import {isCoordinate, type LocationAddress, type Coordinate, type Place, type WalkingRoute } from '../../shared/navigation';

export class ClientError extends Error { constructor(message: string, public code = 'UNKNOWN') { super(message); } }
const validPoint=(v:unknown):boolean=>isCoordinate(v);
const finitePositive=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function validPayload(action:string,data:any){
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 if(action==='config')return typeof data.searchConfigured==='boolean';
 if(action==='search')return Array.isArray(data.places)&&data.places.every((p:any)=>validPoint(p)&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.address==='string'&&(p.category===undefined||typeof p.category==='string')&&(p.entrance===undefined||validPoint(p.entrance)));
 if(action==='address')return typeof data.location?.address==='string'&&typeof data.location?.area==='string';
 if(action==='route'){const r=data.route;return r&&finitePositive(r.distanceMeters)&&finitePositive(r.durationSeconds)&&Array.isArray(r.segments)&&r.segments.length>0&&r.segments.every((line:any)=>Array.isArray(line)&&line.length>=2&&line.every(isCoordinate))&&Array.isArray(r.steps)&&r.steps.every((step:any)=>validPoint(step)&&typeof step.description==='string'&&Number.isFinite(step.turnType)&&(step.roadName===undefined||typeof step.roadName==='string'));}
 return true;
}
export async function navigationRequest<T>(action: string, options: {q?:string;body?:unknown;signal?:AbortSignal} = {}): Promise<T> {
 const url = new URL('/api/navigation',location.origin);
 url.searchParams.set('action',action);
 if(options.q)url.searchParams.set('q',options.q);
 const controller=new AbortController();let timedOut=false;
 const cancel=()=>controller.abort();
 if(options.signal?.aborted)cancel();else options.signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},20000);
 try{
  let response:Response;
  try{response=await fetch(url,{method:options.body?'POST':'GET',cache:'no-store',headers:options.body?{'Content-Type':'application/json'}:{},body:options.body?JSON.stringify(options.body):undefined,signal:controller.signal});}
  catch(error){if(controller.signal.aborted)throw error;throw new ClientError('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.','NETWORK_ERROR');}
  let data:any;
  try{data=await response.json();}catch(error){if(controller.signal.aborted)throw error;throw new ClientError('정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.','INVALID_RESPONSE');}
  if(controller.signal.aborted)throw new DOMException('Aborted','AbortError');
  if(!response.ok){const code=typeof data?.error?.code==='string'?data.error.code:undefined;throw new ClientError(['NOT_CONFIGURED','PROVIDER_AUTH'].includes(code||'')?'지금은 서비스를 이용할 수 없어요. 잠시 후 다시 시도해 주세요.':typeof data?.error?.message==='string'?data.error.message.slice(0,300):'요청을 처리하지 못했어요.',code);}
  if(!validPayload(action,data))throw new ClientError('받은 정보가 올바르지 않아요. 잠시 후 다시 시도해 주세요.','INVALID_RESPONSE');
  return data as T;
 }catch(error){
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  if(timedOut)throw new ClientError('응답 시간이 길어졌어요. 연결 상태를 확인하고 다시 시도해 주세요.','REQUEST_TIMEOUT');
  throw error;
 }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
export const searchPlaces = (q:string, signal:AbortSignal, center?:Coordinate) => navigationRequest<{places:Place[]}>('search',center?{body:{q,center:{lat:center.lat,lng:center.lng}},signal}:{q,signal});
export const getLocationAddress=(point:Coordinate,signal:AbortSignal)=>navigationRequest<{location:LocationAddress}>('address',{body:{point:{lat:point.lat,lng:point.lng}},signal});
export const findWalkingRoute = (start:Coordinate,end:Coordinate&Partial<Pick<Place,'id'|'entrance'>>,signal:AbortSignal) => navigationRequest<{route:WalkingRoute}>('route',{body:{start:{lat:start.lat,lng:start.lng},end:{lat:(end.entrance??end).lat,lng:(end.entrance??end).lng},...(end.id&&/^\d{1,30}$/.test(end.id)?{endPoiId:end.id}:{})},signal});

export interface UserPosition extends Coordinate { accuracy: number; timestamp: number }
export function getUserPosition(signal?:AbortSignal):Promise<UserPosition> {
 return new Promise((resolve,reject)=>{
  if(!window.isSecureContext){reject(new ClientError('현재 위치를 사용할 수 없어요. 안전한 연결로 다시 열어 주세요.','INSECURE_CONTEXT'));return;}
  if(!navigator.geolocation){reject(new ClientError('이 브라우저에서는 현재 위치를 확인할 수 없어요.','UNSUPPORTED'));return;}
  let done=false,watch:number|undefined,timer:ReturnType<typeof setTimeout>|undefined,best:UserPosition|null=null;
  function finish(error?:ClientError){if(done)return;done=true;if(watch!==undefined)navigator.geolocation.clearWatch(watch);if(timer)clearTimeout(timer);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);signal?.removeEventListener('abort',cancel);if(error)reject(error);else if(best)resolve(best);}
  function leave(){finish(new ClientError('화면을 벗어나 위치 확인을 중지했어요. 다시 확인해 주세요.','CANCELED'));}
  function hidden(){if(document.hidden)leave();}
  function cancel(){finish(new ClientError('위치 확인을 취소했어요.','CANCELED'));}
  function valid(p:GeolocationPosition):UserPosition|null{const {latitude:lat,longitude:lng,accuracy}=p.coords;return isCoordinate({lat,lng})&&Number.isFinite(accuracy)&&accuracy>=0&&accuracy<=100&&Number.isFinite(p.timestamp)&&p.timestamp>=0&&Date.now()-p.timestamp<=10000&&p.timestamp<=Date.now()+1000?{lat,lng,accuracy,timestamp:p.timestamp}:null;}
  function failure(error:GeolocationPositionError){finish(new ClientError(error.code===1?'위치 권한이 꺼져 있어요. 브라우저 설정에서 허용한 뒤 다시 눌러 주세요.':error.code===3?'위치 확인 시간이 초과됐어요. 다시 시도해 주세요.':'현재 위치를 찾지 못했어요. 안전한 곳에서 다시 확인해 주세요.',error.code===1?'PERMISSION_DENIED':'LOCATION_UNAVAILABLE'));}
  if(signal?.aborted){cancel();return;}
  signal?.addEventListener('abort',cancel,{once:true});
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);
  try{navigator.geolocation.getCurrentPosition(p=>{
   if(done)return;best=valid(p);if(!best){finish(new ClientError('위치 오차가 커요. 주변이 트인 안전한 곳에서 다시 확인해 주세요.','LOW_ACCURACY'));return;}
   if(best.accuracy<=30){finish();return;}
   timer=setTimeout(()=>{if(best&&Date.now()-best.timestamp<=10000)finish();else finish(new ClientError('새 위치를 받지 못했어요. 다시 확인해 주세요.','LOW_ACCURACY'));},8000);
   try{const id=navigator.geolocation.watchPosition(next=>{if(done)return;const fix=valid(next);if(!fix)return;if(!best||fix.accuracy<=best.accuracy)best=fix;if(fix.accuracy<=30)finish();},failure,{enableHighAccuracy:true,maximumAge:0,timeout:8000});watch=id;if(done)navigator.geolocation.clearWatch(id);}catch{finish(new ClientError('정확한 위치를 확인하지 못했어요. 다시 확인해 주세요.','LOW_ACCURACY'));}
  },failure,{enableHighAccuracy:true,timeout:12000,maximumAge:0});}catch{finish(new ClientError('현재 위치를 확인하지 못했어요. 브라우저 설정을 확인해 주세요.','LOCATION_UNAVAILABLE'));}
 });
}
