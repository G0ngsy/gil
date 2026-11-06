import { useEffect, useId, useRef, useState } from 'react';
import type { Coordinate, Place, WalkingRoute } from '../../shared/navigation';
import { loadTMap, point, type TMapOverlay, type TMapView } from './tmap';

interface Props {start:Coordinate; destination:Place; route:WalkingRoute|null; focusRequest:number}
export function WalkingMap({start,destination,route,focusRequest}:Props) {
 const host=useRef<HTMLDivElement>(null);
 const id=useId().replaceAll(':','');
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 const [retry,setRetry]=useState(0);
 const key=import.meta.env.VITE_TMAP_MAP_KEY || '';
 useEffect(()=>{
  if(!key||!host.current)return;
  let cancelled=false;
  let map:TMapView|undefined;
  const overlays:TMapOverlay[]=[];
  setError('');setReady(false);
  const element=host.current;
  loadTMap(key).then(sdk=>{
   if(cancelled)return;
   element.replaceChildren();
   map=new sdk.Map(element.id,{center:point(sdk,start),width:'100%',height:'100%',zoom:16});
   const icon=(color:string)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36"><path d="M14 35S1 22 1 14a13 13 0 1126 0c0 8-13 21-13 21Z" fill="${color}" stroke="#fffdf9" stroke-width="2"/><circle cx="14" cy="14" r="4" fill="#fffdf9"/></svg>`)}`;
   overlays.push(new sdk.Marker({position:point(sdk,start),map,icon:icon('#087F83'),title:'출발지'}));
   overlays.push(new sdk.Marker({position:point(sdk,destination),map,icon:icon('#245447'),title:destination.name}));
   const bounds=new sdk.LatLngBounds();
   bounds.extend(point(sdk,start));bounds.extend(point(sdk,destination));
   route?.segments.forEach(segment=>{
    const path=segment.map(c=>point(sdk,c));
    overlays.push(new sdk.Polyline({path,strokeColor:'#087F83',strokeWeight:6,strokeOpacity:0.9,map}));
    path.forEach(p=>bounds.extend(p));
   });
   if(focusRequest>0)map.setCenter(point(sdk,start));else map.fitBounds(bounds);
   setReady(true);
  }).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'지도를 불러오지 못했어요.');});
  return ()=>{cancelled=true;overlays.forEach(overlay=>overlay.setMap(null));map?.destroy?.();element.replaceChildren();};
 },[key,start,destination,route,focusRequest,retry]);
 return <div className="live-map-wrapper"><div id={`walking-map-${id}`} ref={host} className="live-map-canvas" role="region" aria-label={`${destination.name} 도보 경로 지도`}/>{!key?<div className="map-message"><strong>지도 연결을 준비하고 있어요</strong><p>목적지와 경로 정보는 아래에서 확인할 수 있어요.</p></div>:error?<div className="map-message" role="alert"><p>{error}</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>지도 다시 불러오기</button></div>:!ready?<div className="map-message" role="status">지도를 불러오고 있어요…</div>:null}</div>;
}
