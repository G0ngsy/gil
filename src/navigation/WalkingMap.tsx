import { useEffect, useId, useRef, useState } from 'react';
import type { Coordinate, Place, WalkingRoute } from '../../shared/navigation';
import type {Fix,Progress} from '../../shared/tracking';
import {splitRoute} from '../../shared/mapRoute';
import {Icon} from '../ui';
import { loadTMap, point, type TMapOverlay, type TMapView } from './tmap';

interface Props {start:Coordinate;destination:Place;route:WalkingRoute|null;progress:Progress;navigating:boolean;active:boolean;fix:Fix|null}
const image=(body:string,w:number,h:number)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function WalkingMap({start,destination,route,progress,navigating,active,fix}:Props) {
 const host=useRef<HTMLDivElement>(null),view=useRef<TMapView|null>(null);
 const layers=useRef<TMapOverlay[]>([]);
 const id=useId().replaceAll(':','');
 const [error,setError]=useState(''),[ready,setReady]=useState(false),[retry,setRetry]=useState(0),[generation,setGeneration]=useState(0),[following,setFollowing]=useState(true),[now,setNow]=useState(Date.now);
 const key=import.meta.env.VITE_TMAP_MAP_KEY || '';
 const fresh=Boolean(navigating&&active&&progress.position&&!progress.rejected&&now-progress.timestamp<=10000);
 useEffect(()=>{if(!navigating)return;const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer);},[navigating]);
 useEffect(()=>{setFollowing(true);},[navigating,route]);
 useEffect(()=>{
  if(!key||!host.current)return;
  let cancelled=false,map:TMapView|undefined;
  setError('');setReady(false);const element=host.current;
  loadTMap(key).then(sdk=>{
   if(cancelled)return;
   element.replaceChildren();map=new sdk.Map(element.id,{center:point(sdk,start),width:'100%',height:'100%',zoom:17,zoomControl:false});view.current=map;
   const bounds=new sdk.LatLngBounds();bounds.extend(point(sdk,start));bounds.extend(point(sdk,destination));route?.segments.forEach(line=>line.forEach(c=>bounds.extend(point(sdk,c))));map.fitBounds(bounds,{left:45,top:70,right:45,bottom:85});setReady(true);setGeneration(n=>n+1);
  }).catch(()=>{if(!cancelled)setError('지도를 불러오지 못했어요. 연결 상태를 확인해 주세요.');});
  return()=>{cancelled=true;view.current=null;layers.current.splice(0).forEach(overlay=>overlay.setMap(null));map?.destroy?.();element.replaceChildren();};
 },[key,start,destination,route,retry]);
 useEffect(()=>{
  const sdk=window.Tmapv2,map=view.current;if(!ready||!sdk||!map)return;
  const overlays:TMapOverlay[]=[];layers.current=overlays;
  const marker=(position:Coordinate,icon:string,title:string,w:number,h:number,anchorY=h/2)=>overlays.push(new sdk.Marker({position:point(sdk,position),map,icon,title,iconSize:sdk.Size?new sdk.Size(w,h):undefined,offset:sdk.Point?new sdk.Point(w/2,anchorY):undefined,zIndex:5}));
  if(route){const parts=splitRoute(route,navigating?progress.along:0);for(const [lines,color,width] of [[parts.completed,'#A8B5AC',5],[parts.remaining,'#087F83',7]] as const){for(const segment of lines){const path=segment.map(c=>point(sdk,c));overlays.push(new sdk.Polyline({path,strokeColor:'#FFFDF9',strokeWeight:width+4,strokeOpacity:1,map,zIndex:1}));overlays.push(new sdk.Polyline({path,strokeColor:color,strokeWeight:width,strokeOpacity:1,map,zIndex:2}));}}}
  marker(start,image('<circle cx="15" cy="15" r="11" fill="#77776E" stroke="white" stroke-width="3"/>',30,30),'출발',30,30);
  const name=escape(destination.name.length>14?destination.name.slice(0,14)+'…':destination.name);const labelWidth=Math.max(92,Math.min(220,destination.name.length*13+24));
  marker(destination,image(`<path d="M${labelWidth/2} 43s-17-17-17-27a17 17 0 1 1 34 0c0 10-17 27-17 27" fill="#245447" stroke="white" stroke-width="2"/><path d="M${labelWidth/2-5} 25V9h12v9h-12" fill="white" stroke="white" stroke-width="2"/><rect x="1" y="46" width="${labelWidth-2}" height="26" rx="13" fill="#FFFDF9" stroke="#E9E2D2"/><text x="${labelWidth/2}" y="64" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#245447">${name}</text>`,labelWidth,74),destination.name,labelWidth,74,43);
  if(navigating&&progress.position){
   const color=fresh?'#2878D0':'#77776E';
   if(fresh&&fix&&fix.timestamp===progress.timestamp&&sdk.Circle)overlays.push(new sdk.Circle({center:point(sdk,progress.position),radius:fix.accuracy,fillColor:'#2878D0',fillOpacity:0.14,strokeColor:'#2878D0',strokeOpacity:0.18,strokeWeight:1,map,zIndex:3}));
   marker(progress.position,image(`<circle cx="58" cy="20" r="15" fill="${color}" stroke="white" stroke-width="4"/><rect x="1" y="43" width="114" height="24" rx="12" fill="#FFFDF9" stroke="#E9E2D2"/><text x="58" y="60" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#252D2A">${fresh?'현재 위치':'마지막 확인 위치'}</text>`,116,69),fresh?'현재 위치':'마지막 확인 위치',116,69,20);
  }
  return()=>overlays.splice(0).forEach(overlay=>overlay.setMap(null));
 },[ready,generation,start,destination,route,navigating,progress.along,progress.position,progress.timestamp,fresh,fix,retry]);
 useEffect(()=>{const sdk=window.Tmapv2;if(ready&&sdk&&view.current&&following&&fresh&&progress.position)view.current.setCenter(point(sdk,progress.position));},[ready,generation,following,fresh,progress.position,retry]);
 function locate(){const sdk=window.Tmapv2,map=view.current;if(!sdk||!map)return;setFollowing(true);if(navigating&&progress.position)map.setCenter(point(sdk,progress.position));else{const bounds=new sdk.LatLngBounds();bounds.extend(point(sdk,start));bounds.extend(point(sdk,destination));route?.segments.forEach(line=>line.forEach(c=>bounds.extend(point(sdk,c))));map.fitBounds(bounds,{left:45,top:70,right:45,bottom:85});}}
 const pointer=useRef<{x:number;y:number}|null>(null);
 return <div className={`live-map-wrapper ${!key||error?'map-compact':''}`}>
 <div id={`walking-map-${id}`} ref={host} className="live-map-canvas" style={!key||error?{display:'none'}:undefined} role="region" aria-label={`${destination.name} 도보 경로 지도`} onPointerDownCapture={e=>{pointer.current={x:e.clientX,y:e.clientY};}} onPointerMoveCapture={e=>{if(pointer.current&&Math.hypot(e.clientX-pointer.current.x,e.clientY-pointer.current.y)>8){setFollowing(false);pointer.current=null;}}} onPointerUpCapture={()=>{pointer.current=null;}} onPointerCancelCapture={()=>{pointer.current=null;}} onWheelCapture={()=>setFollowing(false)}/>
 {ready&&!error&&<><div className="map-recenter"><button className="icon-button" aria-label={navigating?'현재 위치로 지도 이동':'전체 경로 보기'} onClick={locate}><Icon name="locate"/></button>{navigating&&<span role="status">{!progress.position?'현재 위치 확인 중':!fresh?'마지막 위치 · 갱신 대기':following?'위치 따라가는 중':'지도 둘러보는 중'}</span>}</div><div className="map-key" aria-label="지도 표시 범례"><span><i className="key-current"/>현재 위치</span><span><i className="key-destination"/>목적지</span><span><i className="key-route"/>남은 경로</span>{navigating&&<span><i className="key-completed"/>지나온 경로</span>}</div></>}
 {!key?<p className="compact-map-note" role="status">지도 준비 중 · 경로 안내는 사용할 수 있어요</p>:error?<div className="compact-map-note" role="alert"><p>{error}</p><button className="secondary" onClick={()=>{setError('');setRetry(n=>n+1);}}>지도 다시 불러오기</button></div>:!ready?<div className="map-message" role="status">지도를 불러오고 있어요…</div>:null}</div>;
}
