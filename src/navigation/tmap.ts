import type { Coordinate } from '../../shared/navigation';

export interface TMapView {
 setCenter(position:unknown):void;
 fitBounds(bounds:unknown):void;
 destroy?():void;
}
export interface TMapOverlay { setMap(map:TMapView|null):void }
export interface TMapSDK {
 Point?:new (x:number,y:number)=>unknown;
 Size?:new (width:number,height:number)=>unknown;
 Circle?:new (options:Record<string,unknown>)=>TMapOverlay;
 Map: new (elementId:string, options:Record<string,unknown>)=>TMapView;
 LatLng: new (lat:number,lng:number)=>unknown;
 LatLngBounds: new ()=>{extend(point:unknown):void};
 Marker: new (options:Record<string,unknown>)=>TMapOverlay;
 Polyline: new (options:Record<string,unknown>)=>TMapOverlay;
}
declare global { interface Window { Tmapv2?: TMapSDK } }
let loading:Promise<TMapSDK>|undefined;
const isReady=(sdk:TMapSDK|undefined):sdk is TMapSDK=>Boolean(sdk && ['Map','LatLng','LatLngBounds','Marker','Polyline'].every(name=>typeof sdk[name as keyof TMapSDK]==='function'));
export function loadTMap(key:string):Promise<TMapSDK> {
 if (isReady(window.Tmapv2)) return Promise.resolve(window.Tmapv2);
 if (loading) return loading;
 loading = new Promise<TMapSDK>((resolve,reject)=>{
  const script=document.createElement('script');
  const core=document.createElement('script');
  // The provider bootstrap uses document.write, which cannot load from an async script.
  // singleFile asks it to expose the official asset base without writing to the page.
  if (!window.Tmapv2) window.Tmapv2={singleFile:true} as unknown as TMapSDK;
  const timeout=setTimeout(()=>finish(new Error('지도를 불러오는 시간이 초과됐어요.')),15000);
  function finish(error?:Error) {
   if (!error && !isReady(window.Tmapv2)) error=new Error('지도 연결 설정을 확인해 주세요.');
   clearTimeout(timeout);script.onload=null;script.onerror=null;core.onload=null;core.onerror=null;
   if(error){script.remove();core.remove();delete window.Tmapv2;reject(error);}else if(isReady(window.Tmapv2)){resolve(window.Tmapv2);}
  }
  script.src=`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${encodeURIComponent(key)}`;
  script.async=true;
  script.onload=()=>{
   const bootstrap=window.Tmapv2 as (TMapSDK & {_getScriptLocation?:()=>string})|undefined;
   const base=bootstrap?._getScriptLocation?.();
   if (!base || !/^https:\/\/topopentile[123]\.tmap\.co\.kr\/scriptSDKV2\/$/.test(base)) {finish(new Error('지도 연결 설정을 확인해 주세요.'));return;}
   core.src=`${base}tmapjs2.min.js`;
   core.onload=()=>finish();
   core.onerror=()=>finish(new Error('지도 구성 요소를 불러오지 못했어요.'));
   document.head.append(core);
  };
  script.onerror=()=>finish(new Error('지도를 불러오지 못했어요. 연결 상태를 확인해 주세요.'));
  document.head.append(script);
 }).catch(error=>{loading=undefined;throw error;});
 return loading;
}
export function point(sdk:TMapSDK,c:Coordinate){return new sdk.LatLng(c.lat,c.lng);}
