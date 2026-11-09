import {useEffect,useState} from 'react';
import {compareFacing} from '../../shared/facing';
import type {WalkingRoute} from '../../shared/navigation';
import type {Fix,Progress} from '../../shared/tracking';
import {DirectionCard} from './FacingGuide';
import {useHeadingTracking} from './useHeadingTracking';

export function SensorFacingGuide({route,progress,position,enabled}:{route:WalkingRoute;progress:Progress;position:Fix|null;enabled:boolean}){
 const sensor=useHeadingTracking(position,enabled);
 const [,tick]=useState(0);
 useEffect(()=>{if(!sensor.active)return;const timer=setInterval(()=>tick(n=>n+1),250);return()=>clearInterval(timer);},[sensor.active]);
 const result=compareFacing(route,progress,sensor.active?sensor.sample:null,Date.now());
 const unavailable=progress.arrived?'이동 안내를 마쳤어요.':!enabled?'실제 GPS 안내를 시작한 뒤 사용할 수 있어요.':!sensor.active?'방향 센서 시작 버튼을 눌러 주세요.':progress.offRoute?'경로로 돌아온 뒤 방향을 확인해 주세요.':result.state==='unknown'&&result.reason==='position-unavailable'?'새로운 GPS 위치가 필요해요.':null;
 return <section className="facing-test" aria-label="실제 방향 안내"><p className="facing-test-label">실제 방위 센서 · 테스트 경로 · 실외 정확도 미검증</p>
 <p className="facing-test-note">휴대폰을 세로 화면으로 바닥과 나란하게 들어 주세요. 사람의 몸 방향은 감지하지 않아요. 정확도 값을 제공하지 않는 브라우저에서는 화살표를 표시하지 않아요.</p>
 <button className="primary" disabled={!enabled||!position||sensor.active} onClick={()=>void sensor.start()}>실제 방향 센서 시작</button><button className="secondary" disabled={!sensor.active} onClick={()=>sensor.stop()}>{sensor.pending?'방향 권한 요청 취소':'방향 센서 중지'}</button><p aria-live="polite" className="facing-test-note">{sensor.notice}</p>
 <DirectionCard candidate={result.state} unavailable={unavailable}/></section>;
}
