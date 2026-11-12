import {isCoordinate, type LocationAddress, type Coordinate, type Place, type WalkingRoute } from '../../shared/navigation';

export class ClientError extends Error { constructor(message: string, public code = 'UNKNOWN') { super(message); } }
export async function navigationRequest<T>(action: string, options: {q?:string;body?:unknown;signal?:AbortSignal} = {}): Promise<T> {
 const url = new URL('/api/navigation',location.origin);
 url.searchParams.set('action',action);
 if (options.q) url.searchParams.set('q',options.q);
 let response: Response;
 try {
  response = await fetch(url, {method:options.body?'POST':'GET',cache:'no-store',headers:options.body?{'Content-Type':'application/json'}:{},body:options.body?JSON.stringify(options.body):undefined,signal:options.signal});
 } catch (error) {
  if (error instanceof Error && error.name==='AbortError') throw error;
  throw new ClientError('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.','NETWORK_ERROR');
 }
 let data: T & {error?:{code?:string;message?:string}};
 try {data = await response.json();} catch {throw new ClientError('정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.','INVALID_RESPONSE');}
 if (!response.ok) throw new ClientError(['NOT_CONFIGURED','PROVIDER_AUTH'].includes(data.error?.code||'')?'지금은 서비스를 이용할 수 없어요. 잠시 후 다시 시도해 주세요.':data.error?.message || '요청을 처리하지 못했어요.',data.error?.code);
 return data;
}
export const searchPlaces = (q:string, signal:AbortSignal, center?:Coordinate) => navigationRequest<{places:Place[]}>('search',center?{body:{q,center:{lat:center.lat,lng:center.lng}},signal}:{q,signal});
export const getLocationAddress=(point:Coordinate,signal:AbortSignal)=>navigationRequest<{location:LocationAddress}>('address',{body:{point:{lat:point.lat,lng:point.lng}},signal});
export const findWalkingRoute = (start:Coordinate,end:Coordinate,signal:AbortSignal) => navigationRequest<{route:WalkingRoute}>('route',{body:{start,end},signal});

export interface UserPosition extends Coordinate { accuracy: number; timestamp: number }
export function getUserPosition():Promise<UserPosition> {
 return new Promise((resolve,reject)=>{
  if (!window.isSecureContext) {reject(new ClientError('현재 위치를 사용할 수 없어요. 안전한 연결로 다시 열어 주세요.','INSECURE_CONTEXT'));return;}
  if (!navigator.geolocation) {reject(new ClientError('이 브라우저에서는 현재 위치를 확인할 수 없어요.','UNSUPPORTED'));return;}
  navigator.geolocation.getCurrentPosition(position=>{
   const {latitude:lat,longitude:lng,accuracy}=position.coords;
   if (!isCoordinate({lat,lng})||!Number.isFinite(accuracy)||accuracy<0||accuracy>100||!Number.isFinite(position.timestamp)||position.timestamp<0||Date.now()-position.timestamp>10000||position.timestamp>Date.now()+1000) {reject(new ClientError('위치 오차가 커요. 주변이 트인 안전한 곳에서 다시 확인해 주세요.','LOW_ACCURACY'));return;}
   resolve({lat,lng,accuracy,timestamp:position.timestamp});
  },error=>reject(new ClientError(error.code===1?'위치 권한이 꺼져 있어요. 브라우저 설정에서 허용한 뒤 다시 눌러 주세요.':error.code===3?'위치 확인 시간이 초과됐어요. 다시 시도해 주세요.':'현재 위치를 찾지 못했어요. 안전한 곳에서 다시 확인해 주세요.',error.code===1?'PERMISSION_DENIED':'LOCATION_UNAVAILABLE')),
  {enableHighAccuracy:true,timeout:12000,maximumAge:0});
 });
}
