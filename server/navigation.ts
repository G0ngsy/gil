import { distanceBetween, isCoordinate, type LocationAddress, type Coordinate, type Place, type WalkingRoute, type WalkingStep } from '../shared/navigation.js';

export class NavigationError extends Error {
 constructor(public status: number, public code: string, message: string) { super(message); }
}
type RecordValue = Record<string, unknown>;
const record = (v: unknown): RecordValue => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordValue : {};
const string = (v: unknown) => typeof v === 'string' ? v : '';
const coordinate = (lat: unknown, lng: unknown): Coordinate | null => {
 if ((typeof lat !== 'string' && typeof lat !== 'number') || (typeof lng !== 'string' && typeof lng !== 'number') || lat === '' || lng === '') return null;
 const point = {lat: Number(lat), lng: Number(lng)};
 return isCoordinate(point) ? point : null;
};

export function parsePlaces(data: unknown): Place[] {
 const info = record(record(data).searchPoiInfo);
 if (!('pois' in info)) {
  if (String(info.totalCount) === '0') return [];
  throw new NavigationError(502, 'INVALID_RESPONSE', '장소 정보를 읽지 못했어요. 다시 검색해 주세요.');
 }
 const raw = record(info.pois).poi;
 if (!Array.isArray(raw)) throw new NavigationError(502, 'INVALID_RESPONSE', '장소 정보를 읽지 못했어요.');
 const seen = new Set<string>();
 return raw.flatMap(item => {
  const p = record(item);
  // noorLat/noorLon are in the requested WGS84 response coordinate system.
  const point = coordinate(p.noorLat, p.noorLon) ?? coordinate(p.frontLat, p.frontLon);
  if (!point || !string(p.name) || !string(p.id) || seen.has(string(p.id))) return [];
  seen.add(string(p.id));
  const address = [p.upperAddrName, p.middleAddrName, p.lowerAddrName, p.detailAddrName].map(string).filter(Boolean).join(' ');
  return [{...point, id: string(p.id), name: string(p.name), address: address || '주소 정보 없음', category: string(p.lowerBizName) || string(p.middleBizName) || '장소'}];
 });
}

export function parseWalkingRoute(data: unknown): WalkingRoute {
 const collection = record(data);
 const features = collection.features;
 if (collection.type !== 'FeatureCollection' || !Array.isArray(features)) throw invalidRoute();
 const segments: Coordinate[][] = [];
 const steps: WalkingStep[] = [];
 let distanceMeters: number | undefined;
 let durationSeconds: number | undefined;
 for (const item of features) {
  const feature = record(item), properties = record(feature.properties), geometry = record(feature.geometry);
  if (typeof properties.totalDistance === 'number') distanceMeters = properties.totalDistance;
  if (typeof properties.totalTime === 'number') durationSeconds = properties.totalTime;
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
   const points = geometry.coordinates.map(value => Array.isArray(value) ? coordinate(value[1], value[0]) : null);
   // Do not join across corrupt segments and accidentally show a shortcut.
   if (points.some(p => !p)) throw invalidRoute();
   if (points.length >= 2) segments.push(points as Coordinate[]);
  }
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
   const point = coordinate(geometry.coordinates[1], geometry.coordinates[0]);
   if (point && string(properties.description)) steps.push({...point, description: string(properties.description), turnType: typeof properties.turnType === 'number' ? properties.turnType : 0,...(string(properties.nextRoadName).trim()?{roadName:string(properties.nextRoadName).trim().slice(0,60)}:{})});
  }
 }
 if (!segments.length || !Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds) || distanceMeters! < 0 || durationSeconds! < 0) throw invalidRoute();
 return {distanceMeters: distanceMeters!, durationSeconds: durationSeconds!, segments, steps};
}
const invalidRoute = () => new NavigationError(502, 'INVALID_RESPONSE', '도보 경로 정보를 읽지 못했어요. 다시 시도해 주세요.');


export function parseLocationAddress(data:unknown):LocationAddress{
 const info=record(record(data).addressInfo);
 const area=[info.city_do,info.gu_gun,info.eup_myun,info.adminDong||info.legalDong].map(string).filter(Boolean).join(' ');
 const address=string(info.fullAddress).split(',').map(s=>s.trim()).find(Boolean)||area;
 if(!address||address.length>500)throw new NavigationError(502,'NO_ADDRESS','좌표는 확인했지만 주변 주소를 찾지 못했어요.');
 return {address,area:area||address};
}

function json(data: unknown, status = 200) {
 return Response.json(data, {status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
}
interface Dependencies { appKey: string; fetcher?: typeof fetch }
export function createNavigationHandler({appKey, fetcher = fetch}: Dependencies) {
 return async function handle(request: Request): Promise<Response> {
  try {
   const url = new URL(request.url), action = url.searchParams.get('action');
   if (action === 'config' && request.method === 'GET') return json({searchConfigured: Boolean(appKey.trim())});
   if (!['search','route','address'].includes(action || '')) throw new NavigationError(404,'NOT_FOUND','요청한 기능을 찾을 수 없어요.');
   const allowed=action==='search'?['GET','POST']:['POST'];
   if (!allowed.includes(request.method)) return new Response(null,{status:405,headers:{Allow:allowed.join(', '),'Cache-Control':'no-store'}});
   let input:RecordValue={};
   if(request.method==='POST'){
    if(!request.headers.get('content-type')?.includes('application/json'))throw new NavigationError(415,'INVALID_BODY','요청 형식이 올바르지 않아요.');
    const raw=await request.text();if(raw.length>4096)throw new NavigationError(413,'INVALID_BODY','요청 내용이 너무 커요.');
    try{input=record(JSON.parse(raw));}catch{throw new NavigationError(400,'INVALID_BODY','요청 내용을 확인해 주세요.');}
   }
   let center:Coordinate|undefined;
   let target = '', body: string | undefined;
   if (action === 'search') {
    const q = (request.method==='POST'?string(input.q):url.searchParams.get('q')||'').trim();
    if (q.length < 2 || q.length > 80) throw new NavigationError(400,'INVALID_QUERY','검색어를 2~80자로 입력해 주세요.');
    const params = new URLSearchParams({version:'1',format:'json',searchKeyword:q,reqCoordType:'WGS84GEO',resCoordType:'WGS84GEO',count:'20',searchtypCd:'A'});
    if('center' in input){
     if(!isCoordinate(input.center))throw new NavigationError(400,'INVALID_COORDINATE','검색 기준 위치를 확인해 주세요.');
     center=input.center;params.set('searchtypCd','R');params.set('radius','10');params.set('centerLat',String(center.lat));params.set('centerLon',String(center.lng));
    }
    target = `https://apis.openapi.sk.com/tmap/pois?${params}`;
   } else if(action==='address'){
    if(!isCoordinate(input.point))throw new NavigationError(400,'INVALID_COORDINATE','주소를 확인할 위치를 확인해 주세요.');
    const params=new URLSearchParams({version:'1',format:'json',lat:String(input.point.lat),lon:String(input.point.lng),coordType:'WGS84GEO',addressType:'A10',newAddressExtend:'N'});
    target=`https://apis.openapi.sk.com/tmap/geo/reversegeocoding?${params}`;
   } else {
    if (!isCoordinate(input.start) || !isCoordinate(input.end)) throw new NavigationError(400,'INVALID_COORDINATE','출발지와 목적지 위치를 확인해 주세요.');
    if (Math.abs(input.start.lat-input.end.lat)<0.00001 && Math.abs(input.start.lng-input.end.lng)<0.00001) throw new NavigationError(400,'SAME_LOCATION','출발지와 목적지가 너무 가까워요. 주변을 확인해 주세요.');
    body = JSON.stringify({startX:input.start.lng,startY:input.start.lat,endX:input.end.lng,endY:input.end.lat,startName:encodeURIComponent('출발지'),endName:encodeURIComponent('목적지'),reqCoordType:'WGS84GEO',resCoordType:'WGS84GEO',searchOption:'0',sort:'index'});
    target = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1';
   }
   if (!appKey.trim()) throw new NavigationError(503,'NOT_CONFIGURED','검색 서비스 설정을 확인한 뒤 다시 이용해 주세요.');
   let response: Response;
   try { response = await fetcher(target, {method:action==='route'?'POST':'GET',headers:{appKey,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},body,signal:AbortSignal.timeout(10000)}); }
   catch { throw new NavigationError(504,'UPSTREAM_TIMEOUT','연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.'); }
   if (!response.ok) {
    // Never forward provider bodies: they can contain credentials or internal details.
    if (response.status === 401 || response.status === 403) throw new NavigationError(502,'PROVIDER_AUTH','검색 서비스 연결 설정을 확인해야 해요.');
    if (response.status === 429) throw new NavigationError(429,'RATE_LIMIT','검색 요청이 많아요. 잠시 후 다시 시도해 주세요.');
    if (action==='route' && [400,404].includes(response.status)) throw new NavigationError(422,'NO_ROUTE','이 구간의 도보 경로를 찾지 못했어요. 다른 목적지를 선택해 주세요.');
    throw new NavigationError(502,'PROVIDER_ERROR','검색 서비스에 연결하지 못했어요. 다시 시도해 주세요.');
   }
   let data: unknown;
   try { data = await response.json(); } catch { throw new NavigationError(502,'INVALID_RESPONSE','서비스 응답을 읽지 못했어요.'); }
   if(action==='address')return json({location:parseLocationAddress(data)});
   if(action==='search'){
    let places=parsePlaces(data);
    if(center){const origin=center;places=places.filter(p=>distanceBetween(origin,p)<=10000).sort((a,b)=>distanceBetween(origin,a)-distanceBetween(origin,b));}
    return json({places});
   }
   return json({route:parseWalkingRoute(data)});
  } catch (error) {
   if (error instanceof NavigationError) return json({error:{code:error.code,message:error.message}},error.status);
   return json({error:{code:'INTERNAL_ERROR',message:'요청을 처리하지 못했어요. 다시 시도해 주세요.'}},500);
  }
 };
}
