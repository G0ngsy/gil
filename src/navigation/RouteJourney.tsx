import type {Place,WalkingRoute} from '../../shared/navigation';
import {formatDistance,formatDuration} from '../../shared/navigation';
import type {Progress} from '../../shared/tracking';
import {OrnamentalDivider} from '../OrnamentalDivider';
import {SelectionCorner} from '../SelectionCorner';
import {Icon} from '../ui';

interface Props{destination:Place;route:WalkingRoute;progress:Progress;active:boolean;notice:string;navigating:boolean;onStart:()=>void;onFinish:()=>void}
export function RouteJourney({destination,route,progress,active,notice,navigating,onStart,onFinish}:Props){
 const instruction=progress.arrived?'목적지에 도착했어요':!active?'안내가 잠시 멈췄어요':!progress.position?'현재 위치를 확인하고 있어요':progress.rejected?'위치를 다시 확인하고 있어요':progress.offRoute?'경로를 벗어났어요':route.steps[progress.stepIndex]?.description||'주변과 경로를 확인해 주세요';
 return <div className="journey-content">
 {navigating&&<section className="journey-guidance" aria-label="실제 경로 이동 안내" aria-live="polite">{progress.arrived&&<OrnamentalDivider kind="lotus" className="journey-arrival-decoration"/>}<span className="journey-kicker">{progress.arrived?'도착 안내':active?'다음 이동 안내':'안내 일시중지'}</span><h2>{instruction}</h2>{active&&(!progress.position||progress.rejected)&&<p>안전한 곳에서 잠시 기다려 주세요.</p>}{progress.offRoute&&active&&<p>안전한 곳에서 경로를 확인해 주세요.</p>}{!active&&!progress.arrived&&notice&&<p>{notice}</p>}
 <div className="journey-remaining"><small>남은 거리</small><strong data-testid="live-remaining">{formatDistance(progress.position?progress.remaining:route.distanceMeters)}</strong></div></section>}
 <div className="destination-heading journey-destination selected-destination"><SelectionCorner/><span className="result-icon"><Icon name="pin"/></span><div><h2>{destination.name}</h2>{!navigating&&<p>{destination.address}</p>}</div></div>
 {!navigating&&<><div className="trip-summary"><strong>{formatDuration(route.durationSeconds)}</strong><span>도보 · {formatDistance(route.distanceMeters)}</span></div><p className="journey-caption">전체 경로 기준 예상 시간</p><button className="primary journey-start" onClick={onStart}><Icon name="walk"/>길 안내 시작</button></>}
 {navigating&&!active&&!progress.arrived&&<button className="primary journey-start" onClick={onStart}>안내 계속하기</button>}
 {progress.arrived&&navigating&&<button className="primary journey-start" onClick={onFinish}>안내 마치기</button>}
 {navigating&&<p className="journey-safety"><Icon name="shield" size={16}/>주변과 신호를 확인하며 걸어가세요</p>}
 <details className="journey-details"><summary>자세히 보기</summary><div className="journey-detail-body"><h3>경로 정보</h3><p>전체 경로 {formatDistance(route.distanceMeters)} · 예상 {formatDuration(route.durationSeconds)}</p><p>{destination.address}</p>
 <h3>위치 상태</h3><p role="status">{notice||'길 안내 시작을 누르면 현재 위치를 계속 확인해요.'}</p>{progress.position&&route.steps.length>0&&<p>안내 단계 {progress.stepIndex+1} / {route.steps.length}</p>}
 <p>화면을 벗어나거나 탭을 숨기면 위치 수신을 중지해요. 경로 이탈 시 자동 재탐색은 하지 않아요.</p><h3>전체 도보 안내 <span>{route.steps.filter(step=>step.description.trim()).length}개</span></h3>
 {route.steps.some(step=>step.description.trim())?<ol aria-label="전체 도보 안내">{route.steps.filter(step=>step.description.trim()).map((step,index)=><li key={index}>{step.description}</li>)}</ol>:<p>이 경로에는 상세 안내가 없어요. 주변과 목적지를 확인해 주세요.</p>}
 <p>표시 시간은 전체 경로 기준의 예상 시간이에요.</p></div></details>
 </div>;
}
export function JourneyMenu({active,onPause,onFinish}:{active:boolean;onPause:()=>void;onFinish:()=>void}){
 return <details className="journey-menu"><summary aria-label="안내 메뉴"><Icon name="dots"/></summary><div>{active&&<button onClick={e=>{onPause();e.currentTarget.closest('details')?.removeAttribute('open');}}>안내 일시중지</button>}<button onClick={e=>{onFinish();e.currentTarget.closest('details')?.removeAttribute('open');}}>안내 종료</button></div></details>;
}
