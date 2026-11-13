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
 return <div className="journey-content">
 {navigating&&<div className="journey-remaining"><small>남은 거리{!active&&progress.position&&<span className="last-distance-label">마지막 확인 기준</span>}</small><strong data-testid="live-remaining">{formatDistance(progress.position?progress.remaining:route.distanceMeters)}</strong><button className="journey-end" onClick={onFinish}>안내 종료</button></div>}
 <div className="destination-heading journey-destination selected-destination"><SelectionCorner/><span className="result-icon"><Icon name="pin"/></span><div><h2>{destination.name}</h2>{!navigating&&<p>{destination.address}</p>}</div></div>
 {!navigating&&<><div className="trip-summary"><strong>{formatDuration(route.durationSeconds)}</strong><span>도보 · {formatDistance(route.distanceMeters)}</span></div><p className="journey-caption">전체 경로 기준 예상 시간</p><button className="primary journey-start" onClick={onStart}><Icon name="walk"/>길 안내 시작</button></>}
 {navigating&&!active&&!progress.arrived&&<button className="primary journey-start" onClick={onStart}>위치 안내 다시 시작</button>}
 {progress.arrived&&navigating&&<button className="primary journey-start" onClick={onFinish}>안내 마치기</button>}
 {cameraControl}
 {navigating&&<p className="journey-safety"><Icon name="shield" size={16}/>주변과 신호를 확인하며 걸어가세요</p>}

 </div>;
}
export function JourneyInstruction({route,progress,active,notice,fix,surface='map'}:Pick<Props,'route'|'progress'|'active'|'notice'>&{fix?:Fix|null;surface?:'map'|'camera'}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{if(!active)return;const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer);},[active]);
 const stale=Boolean(progress.position&&now-progress.timestamp>10000);
 const approximate=Boolean(active&&fix&&fix.accuracy>30&&fix.accuracy<=100&&now-fix.timestamp<=10000);
 const status=progress.arrived?'목적지에 도착했어요':!active?'위치 수신이 멈췄어요':approximate?'위치 오차가 커요':!progress.position?'현재 위치를 확인하고 있어요':progress.rejected||stale?'위치를 다시 확인하고 있어요':progress.offRoute?'경로를 벗어났어요':null;
 const next=routeInstruction(route,progress,Math.max(now,progress.timestamp));
 const detail=progress.arrived?'':!active?notice:approximate?`오차 약 ${Math.round(fix!.accuracy)}m · ${surface==='camera'?'정확한 위치를 기다려 주세요.':'지도에는 대략적인 위치를 표시해요. 정확한 위치를 기다려 주세요.'}`:progress.offRoute?'안전한 곳에서 새 경로를 확인해 주세요.':status?'안전한 곳에서 잠시 기다려 주세요.':next.detail;
 const symbol=status?(progress.arrived?'check':'clock'):next.symbol==='back'?'turn-back':next.symbol==='walk'?'walk':next.symbol==='straight'?'arrow':'turn';
 return <section className={`journey-guidance ${surface==='camera'?'camera-route-instruction':''}`} aria-label={surface==='camera'?'카메라 경로 안내':'실제 경로 이동 안내'} data-action={status?'status':next.symbol} aria-live="polite">{progress.arrived&&surface==='map'&&<OrnamentalDivider kind="lotus" className="journey-arrival-decoration"/>}<span className={`instruction-symbol instruction-${status?'status':next.symbol}`}><span data-testid={!status&&next.symbol!=='walk'?'route-action-arrow':undefined}><Icon name={symbol} size={surface==='camera'?76:38}/></span></span><div className="instruction-copy"><h2>{status||next.title}</h2>{detail&&<p className={status?'instruction-status-note':'instruction-road'}>{detail}</p>}</div></section>;
}
