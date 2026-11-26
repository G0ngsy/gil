/**
 * 경로 안내 UI: 시작 전 거리/시간과 시작 버튼, 안내 중 남은 거리·종료·재탐색 및 다음 행동 카드를 표시합니다.
 */
import type {ReactNode} from 'react';
import type {Place,WalkingRoute} from '../../shared/navigation';
import {formatDistance,formatDuration} from '../../shared/navigation';
import {routeInstruction} from '../../shared/routeInstruction';
import {useEffect,useId,useState} from 'react';
import type {Progress,Fix} from '../../shared/tracking';
import {OrnamentalDivider} from '../OrnamentalDivider';
import {SelectionCorner} from '../SelectionCorner';
import {Icon} from '../ui';

interface Props{rerouting?:boolean;rerouteError?:string;onReroute?:()=>void;cameraControl?:ReactNode;destination:Place;route:WalkingRoute;progress:Progress;active:boolean;notice:string;navigating:boolean;onStart:()=>void;onFinish:()=>void}
// 경로 확인/안내 중 상태에 따라 거리·버튼·상세 목록을 구성합니다.
export function RouteJourney({destination,route,progress,active,notice,navigating,onStart,onFinish,cameraControl,rerouting,rerouteError,onReroute}:Props){
 const [expanded,setExpanded]=useState(false);
 const [now,setNow]=useState(Date.now);
 // GPS가 끊겼을 때 오래된 시간 추정을 계속 보여주지 않도록 안내 중에만 갱신합니다.
 useEffect(()=>{if(!navigating||!active)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[navigating,active]);
 const remaining=progress.position?progress.remaining:route.distanceMeters;
 const fresh=!progress.position||Math.max(now,Date.now())-progress.timestamp<=10000;
 // 전체 경로의 예상 시간을 남은 경로 비율로 환산합니다. 실제 보행 속도를 측정한 값은 아닙니다.
 const estimate=active&&fresh&&!progress.offRoute&&!progress.rejected&&!progress.arrived&&route.distanceMeters>0
  ?formatDuration(route.durationSeconds*Math.max(0,Math.min(1,remaining/route.distanceMeters))):null;
 const detailId=useId();
 // 안내 정보만 접습니다. 카메라 컴포넌트/기존 GPS 세션은 언마운트하지 않습니다.
 return <div className="journey-content" data-sheet-expanded={navigating?String(expanded):undefined}>
 <div className="journey-sheet-summary">
 {navigating&&<button className="journey-sheet-toggle" aria-label={`안내 정보 ${expanded?'접기':'펼치기'}`} aria-expanded={expanded} aria-controls={detailId} onClick={()=>setExpanded(value=>!value)}><svg className="journey-toggle-icon" data-direction={expanded?'down':'up'} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={expanded?'m6 9 6 6 6-6':'m6 15 6-6 6 6'}/></svg></button>}
 {navigating&&<div className="journey-remaining"><div className="journey-trip"><div className="journey-trip-line">{estimate&&<strong className="journey-eta" data-testid="live-eta">약 {estimate}</strong>}<span className="journey-distance">도보 · <span data-testid="live-remaining">{formatDistance(remaining)}</span></span></div>{progress.arrived&&<span className="last-distance-label">경로 끝 기준</span>}{!active&&progress.position&&!progress.arrived&&<span className="last-distance-label">마지막 확인 기준</span>}</div><button className="journey-end" onClick={onFinish}>안내 종료</button></div>}
 {navigating&&!active&&!progress.arrived&&<button className="primary journey-start" onClick={onStart}>위치 안내 다시 시작</button>}
 {progress.arrived&&navigating&&<button className="primary journey-start" onClick={onFinish}>안내 마치기</button>}
 {navigating&&!progress.arrived&&onReroute&&(progress.offRoute||rerouting||rerouteError)&&<div className="journey-reroute"><button className="secondary" disabled={rerouting} onClick={onReroute}>{rerouting?'현재 위치에서 다시 찾는 중…':'현재 위치에서 다시 찾기'}</button>{rerouteError&&<p className="inline-error" role="alert">{rerouteError}</p>}{rerouting&&<p role="status">새 경로를 받을 때까지 기존 안내를 유지해요.</p>}</div>}
 </div>
 <div id={detailId} className="journey-sheet-details" hidden={navigating&&!expanded}>
 <div className="destination-heading journey-destination selected-destination"><SelectionCorner/><span className="result-icon"><Icon name="pin"/></span><div><h2>{destination.name}</h2>{!navigating&&<p>{destination.address}</p>}</div></div>
 {!navigating&&<><div className="trip-summary"><strong>{formatDuration(route.durationSeconds)}</strong><span>도보 · {formatDistance(route.distanceMeters)}</span></div><p className="journey-caption">전체 경로 기준 예상 시간</p><button className="primary journey-start" onClick={onStart}><Icon name="send"/>길 안내 시작</button></>}
 <details className="route-detail-list"><summary>전체 경로 상세 보기 · {route.steps.length}단계</summary><p>출발부터 경로 도착점까지의 전체 안내예요.</p>{route.steps.length?<div className="route-timeline"><div className="timeline-endpoint"><span className="timeline-dot"/><strong>경로 출발점</strong></div><ol aria-label="경로 단계 타임라인" role="list">{route.steps.map((step,index)=><li key={index}><span className="timeline-number" aria-hidden="true">{index+1}</span><div className="timeline-copy"><p>{step.description||'지도에서 이동 구간을 확인해 주세요.'}</p>{step.roadName&&<small>{step.roadName}</small>}</div></li>)}</ol><div className="timeline-endpoint timeline-destination"><span className="timeline-dot"/><div><strong>경로 도착점</strong><p>주변의 장소 이름과 출입구를 확인해 주세요.</p></div></div></div>:<p className="timeline-empty">상세 이동 안내가 없어요. 지도와 실제 출입구를 확인해 주세요.</p>}</details>
 {cameraControl}
 {navigating&&<p className="journey-safety"><Icon name="shield" size={16}/>주변과 신호를 확인하며 걸어가세요</p>}
 </div></div>;
}
// 지도와 카메라가 공유하는 다음 행동 카드입니다. 위치가 불확실하면 회전 대신 상태 안내를 표시합니다.
export function JourneyInstruction({route,progress,active,notice,fix,destination,surface='map'}:Pick<Props,'route'|'progress'|'active'|'notice'>&{fix?:Fix|null;destination?:Place;surface?:'map'|'camera'}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{if(!active)return;const timer=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(timer);},[active]);
 const stale=Boolean(progress.position&&now-progress.timestamp>10000);
 const approximate=Boolean(active&&fix&&fix.accuracy>30&&fix.accuracy<=100&&now-fix.timestamp<=10000);
 const status=progress.arrived?'목적지 근처에 도착했어요':!active?'위치 수신이 멈췄어요':approximate?'위치 오차가 커요':!progress.position?'현재 위치를 확인하고 있어요':progress.rejected||stale?'위치를 다시 확인하고 있어요':progress.offRoute?'경로를 벗어났어요':null;
 const next=routeInstruction(route,progress,Math.max(now,progress.timestamp));
 const detail=progress.arrived?'실제 출입구를 확인해 주세요.':!active?(surface==='camera'?'지도에서 위치 안내를 다시 시작해 주세요.':notice):approximate?`오차 약 ${Math.round(fix!.accuracy)}m · ${surface==='camera'?'정확한 위치를 기다려 주세요.':'지도에는 대략적인 위치를 표시해요. 정확한 위치를 기다려 주세요.'}`:progress.offRoute?'안전한 곳에서 새 경로를 확인해 주세요.':status?'안전한 곳에서 잠시 기다려 주세요.':next.detail;
 const symbol=status?(progress.arrived?'check':'clock'):next.symbol==='back'?'turn-back':next.symbol==='walk'?'walk':next.symbol==='straight'?'arrow':'turn';
 return <section className={`journey-guidance ${surface==='camera'?'camera-route-instruction':''}`} aria-label={surface==='camera'?'카메라 경로 안내':'실제 경로 이동 안내'} data-action={status?'status':next.symbol} aria-live="polite">{progress.arrived&&surface==='map'&&<OrnamentalDivider kind="lotus" className="journey-arrival-decoration"/>}<span className={`instruction-symbol instruction-${status?'status':next.symbol}`}><span data-testid={!status&&next.symbol!=='walk'?'route-action-arrow':undefined}><Icon name={symbol} size={surface==='camera'?28:38}/></span></span><div className="instruction-copy">{surface==='camera'&&<span className="camera-route-basis">경로 기준</span>}<h2>{status||next.title}</h2>{detail&&<p className={status?'instruction-status-note':'instruction-road'}>{detail}</p>}</div></section>;
}
