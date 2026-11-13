import {routeAccess} from '../../shared/routeAccess';
import type {ReactNode} from 'react';
import type {Place,WalkingRoute} from '../../shared/navigation';
import {formatDistance,formatDuration} from '../../shared/navigation';
import {routeInstruction} from '../../shared/routeInstruction';
import {useEffect,useState} from 'react';
import type {Progress,Fix} from '../../shared/tracking';
import {OrnamentalDivider} from '../OrnamentalDivider';
import {SelectionCorner} from '../SelectionCorner';
import {Icon} from '../ui';

interface Props{cameraControl?:ReactNode;destination:Place;route:WalkingRoute;progress:Progress;active:boolean;notice:string;navigating:boolean;onStart:()=>void;onFinish:()=>void}
export function RouteJourney({destination,route,progress,active,notice,navigating,onStart,onFinish,cameraControl}:Props){
 const access=routeAccess(route,route.segments[0]?.[0]??destination,destination);
 return <div className="journey-content">
 {navigating&&<div className="journey-remaining"><small>남은 거리{!active&&progress.position&&<span className="last-distance-label">마지막 확인 기준</span>}</small><strong data-testid="live-remaining">{formatDistance(progress.position?progress.remaining:route.distanceMeters)}</strong><button className="journey-end" onClick={onFinish}>안내 종료</button></div>}
 <div className="destination-heading journey-destination selected-destination"><SelectionCorner/><span className="result-icon"><Icon name="pin"/></span><div><h2>{destination.name}</h2>{!navigating&&<p>{destination.address}</p>}</div></div>
 {!navigating&&<><div className="trip-summary"><strong>{formatDuration(route.durationSeconds)}</strong><span>도보 · {formatDistance(route.distanceMeters)}</span></div><p className="journey-caption">전체 경로 기준 예상 시간</p><button className="primary journey-start" onClick={onStart}><Icon name="walk"/>길 안내 시작</button></>}
 {navigating&&!active&&!progress.arrived&&<button className="primary journey-start" onClick={onStart}>위치 안내 다시 시작</button>}
 {progress.arrived&&navigating&&<button className="primary journey-start" onClick={onFinish}>안내 마치기</button>}
 {access&&access.endGap>15&&<p className="route-access-note" role="note">도보 경로는 표시된 경로 도착점까지예요. 장소 위치와 약 {formatDistance(access.endGap)} 차이가 있어요. 현장의 출입구를 확인해 주세요.</p>}
 <details className="route-detail-list"><summary>전체 경로 상세 보기 · {route.steps.length}단계</summary><p>출발부터 경로 도착점까지의 전체 안내예요.</p><ol>{route.steps.map((step,index)=><li key={index}>{step.description||'지도에서 이동 구간을 확인해 주세요.'}</li>)}</ol></details>
 {cameraControl}
 {navigating&&<p className="journey-safety"><Icon name="shield" size={16}/>주변과 신호를 확인하며 걸어가세요</p>}

 </div>;
}
export function JourneyInstruction({route,progress,active,notice,fix,destination,surface='map'}:Pick<Props,'route'|'progress'|'active'|'notice'>&{fix?:Fix|null;destination?:Place;surface?:'map'|'camera'}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{if(!active)return;const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer);},[active]);
 const stale=Boolean(progress.position&&now-progress.timestamp>10000);
 const approximate=Boolean(active&&fix&&fix.accuracy>30&&fix.accuracy<=100&&now-fix.timestamp<=10000);
 const arrivalGap=destination?routeAccess(route,route.segments[0]?.[0]??destination,destination)?.endGap??0:0;
 const status=progress.arrived?(arrivalGap>15?'경로 도착점에 도착했어요':'목적지에 도착했어요'):!active?'위치 수신이 멈췄어요':approximate?'위치 오차가 커요':!progress.position?'현재 위치를 확인하고 있어요':progress.rejected||stale?'위치를 다시 확인하고 있어요':progress.offRoute?'경로를 벗어났어요':null;
 const next=routeInstruction(route,progress,Math.max(now,progress.timestamp));
 const detail=progress.arrived?(arrivalGap>15?'장소의 실제 출입구를 확인해 주세요.':''):!active?notice:approximate?`오차 약 ${Math.round(fix!.accuracy)}m · ${surface==='camera'?'정확한 위치를 기다려 주세요.':'지도에는 대략적인 위치를 표시해요. 정확한 위치를 기다려 주세요.'}`:progress.offRoute?'안전한 곳에서 새 경로를 확인해 주세요.':status?'안전한 곳에서 잠시 기다려 주세요.':next.detail;
 const symbol=status?(progress.arrived?'check':'clock'):next.symbol==='back'?'turn-back':next.symbol==='walk'?'walk':next.symbol==='straight'?'arrow':'turn';
 return <section className={`journey-guidance ${surface==='camera'?'camera-route-instruction':''}`} aria-label={surface==='camera'?'카메라 경로 안내':'실제 경로 이동 안내'} data-action={status?'status':next.symbol} aria-live="polite">{progress.arrived&&surface==='map'&&<OrnamentalDivider kind="lotus" className="journey-arrival-decoration"/>}<span className={`instruction-symbol instruction-${status?'status':next.symbol}`}><span data-testid={!status&&next.symbol!=='walk'?'route-action-arrow':undefined}><Icon name={symbol} size={surface==='camera'?76:38}/></span></span><div className="instruction-copy"><h2>{status||next.title}</h2>{detail&&<p className={status?'instruction-status-note':'instruction-road'}>{detail}</p>}</div></section>;
}
