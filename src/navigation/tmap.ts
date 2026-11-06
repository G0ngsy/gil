import type { Coordinate } from '../../shared/navigation';

export interface TMapView {
 setCenter(position:unknown):void;
 fitBounds(bounds:unknown):void;
 destroy?():void;
}
export interface TMapOverlay { setMap(map:TMapView|null):void }
export interface TMapSDK {
 Map: new (elementId:string, options:Record<string,unknown>)=>TMapView;
 LatLng: new (lat:number,lng:number)=>unknown;
 LatLngBounds: new ()=>{extend(point:unknown):void};
 Marker: new (options:Record<string,unknown>)=>TMapOverlay;
 Polyline: new (options:Record<string,unknown>)=>TMapOverlay;
}
declare global { interface Window { Tmapv2?: TMapSDK } }
let loading:Promise<TMapSDK>|undefined;
export function loadTMap(key:string):Promise<TMapSDK> {
 if (window.Tmapv2) return Promise.resolve(window.Tmapv2);
 if (loading) return loading;
 loading = new Promise<TMapSDK>((resolve,reject)=>{
  const script=document.createElement('script');
  const timeout=setTimeout(()=>finish(new Error('지도를 불러오는 시간이 초과됐어요.')),15000);
  function finish(error?:Error) {
   clearTimeout(timeout);script.onload=null;script.onerror=null;
   if(error){script.remove();reject(error);}else if(window.Tmapv2){resolve(window.Tmapv2);}else{script.remove();reject(new Error('지도 연결 설정을 확인해 주세요.'));}
  }
  script.src=`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${encodeURIComponent(key)}`;
  script.async=true;
  script.onload=()=>finish();
  script.onerror=()=>finish(new Error('지도를 불러오지 못했어요. 연결 상태를 확인해 주세요.'));
  document.head.append(script);
 }).catch(error=>{loading=undefined;throw error;});
 return loading;
}
export function point(sdk:TMapSDK,c:Coordinate){return new sdk.LatLng(c.lat,c.lng);}
