import {useId,useState} from 'react';
import {distanceBetween,type Coordinate,type WalkingRoute} from '../../shared/navigation';
import type {Progress} from '../../shared/tracking';

/** Offline route diagram: never presented as a provider basemap. */
export function TrackingMap({route,progress}:{route:WalkingRoute;progress:Progress}){
 const [focus,setFocus]=useState(false);
 const title=useId();
 const origin=route.segments.flat()[0];
 const xy=(c:Coordinate)=>({x:(c.lng-origin.lng)*111195*Math.cos(origin.lat*Math.PI/180),y:-(c.lat-origin.lat)*111195});
 const lines=route.segments.map(line=>line.map(xy));
 const points=lines.flat();
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
 const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const current=progress.position?xy(progress.position):null;
 const bounds=focus&&current?`${current.x-90} ${current.y-90} 180 180`:`${minX-45} ${minY-45} ${maxX-minX+90} ${maxY-minY+90}`;
 const pointList=(ps:{x:number;y:number}[])=>ps.map(p=>`${p.x},${p.y}`).join(' ');
 let remaining=progress.along;
 const completed=route.segments.map(line=>{
  const path:Coordinate[]=[];
  for(let i=1;i<line.length;i++){
   const a=line[i-1],b=line[i],length=distanceBetween(a,b);
   if(remaining<=0)break;
   if(!path.length)path.push(a);
   if(remaining>=length){path.push(b);remaining-=length;}
   else {const t=remaining/length;path.push({lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t});remaining=0;}
  }
  return path.map(xy);
 });
 const end=points.at(-1)!;
 const outside=current&&(current.x<minX-45||current.x>maxX+45||current.y<minY-45||current.y>maxY+45);
 return <section className="tracking-map" aria-label="예시 경로 지도 안내"><div className="tracking-map-heading"><strong>예시 경로 도식</strong><span>북쪽 ↑</span></div><p>실제 지도·도로 정보가 아니에요.</p>
 <svg viewBox={bounds} role="img" aria-labelledby={title} preserveAspectRatio="xMidYMid meet">
 <title id={title}>예시 보행 경로와 이동 진행{progress.position?' 및 마지막으로 반영한 위치':''}</title>
 {lines.map((line,i)=><polyline key={i} points={pointList(line)} className="tracking-route"/>)}
 {completed.map((line,i)=>line.length>1?<polyline key={i} points={pointList(line)} className="tracking-completed" data-testid="completed-route"/>:null)}
 <circle cx="0" cy="0" r="5" className="tracking-start"/><text x="9" y="5">출발</text>
 <circle cx={end.x} cy={end.y} r="6" className="tracking-destination"/><text x={end.x-7} y={end.y-12} textAnchor="end">도착</text>
 {current&&<g data-testid="current-position" transform={`translate(${current.x} ${current.y})`}><circle r="9" className={progress.offRoute?'tracking-position off-route':'tracking-position'}/><circle r="3" fill="#FFFDF9"/></g>}
 </svg><div className="tracking-legend"><span>청록: 전체 경로</span><span>진녹색: 이동한 구간</span><span>원: 마지막 반영 위치</span></div>
 {!progress.position&&<p>좌표를 받으면 현재 위치를 표시해요.</p>}{outside&&!focus&&<p role="note">현재 위치가 예시 경로 범위 밖에 있어요. 현재 위치 보기를 눌러 확인하세요.</p>}
 <div className="tracking-map-actions"><button className="secondary" onClick={()=>setFocus(false)} aria-pressed={!focus||!current}>전체 경로 보기</button><button className="secondary" disabled={!current} onClick={()=>setFocus(true)} aria-pressed={focus&&!!current}>현재 위치 보기</button></div></section>;
}
