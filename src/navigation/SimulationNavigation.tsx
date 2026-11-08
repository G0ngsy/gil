import {FieldRouteEditor} from './FieldRouteEditor';
import type {FieldRoute} from '../../shared/fieldRoute';
import {TrackingMap} from './TrackingMap';
import {useGpsTracking} from './useGpsTracking';
import {useEffect,useState} from 'react';
import {formatDistance, type WalkingRoute} from '../../shared/navigation';
import {initialProgress,updateProgress,type Fix} from '../../shared/tracking';
import {Motif} from '../Motif';

export const simulationRoute:WalkingRoute={distanceMeters:300,durationSeconds:240,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978},{lat:37.5675,lng:126.980}]],steps:[{lat:37.5665,lng:126.978,description:'보행로를 따라 직진하세요',turnType:0},{lat:37.5675,lng:126.978,description:'오른쪽 보행로로 이동하세요',turnType:0},{lat:37.5675,lng:126.979,description:'목적지까지 직진하세요',turnType:0}]};
export function SimulationNavigation({onExit}:{onExit:()=>void}){
 const [fieldRoute,setFieldRoute]=useState<FieldRoute|null>(null);
 const route=fieldRoute?.route??simulationRoute;
 const [routeVersion,setRouteVersion]=useState(0);
 const [progress,setProgress]=useState(initialProgress);
 const [guiding,setGuiding]=useState(false);
 const [source,setSource]=useState<'mock'|'gps'>('mock');
 const [lat,setLat]=useState('37.5665'),[lng,setLng]=useState('126.978'),[accuracy,setAccuracy]=useState('5');
 const gps=useGpsTracking(fix=>setProgress(old=>updateProgress(route,old,fix)));
 useEffect(()=>{if(progress.arrived&&gps.active)gps.stop('도착 판정으로 GPS 추적을 마쳤어요.');},[progress.arrived,gps.active]);
 function applyRoute(next:FieldRoute|null){gps.stop('경로 변경으로 GPS 추적을 마쳤어요.');setGuiding(false);setSource('mock');setProgress(initialProgress());setFieldRoute(next);setRouteVersion(version=>version+1);const start=next?.points[0]??simulationRoute.segments[0][0];setLat(String(start.lat));setLng(String(start.lng));setAccuracy('5');}
 function send(latitude=(lat.trim()?Number(lat):NaN),longitude=(lng.trim()?Number(lng):NaN)){
  if(gps.active)return;
  setSource('mock');setGuiding(true);
  setLat(String(latitude));setLng(String(longitude));
  setProgress(old=>updateProgress(route,source==='gps'?initialProgress():old,{lat:latitude,lng:longitude,accuracy:accuracy.trim()?Number(accuracy):NaN,timestamp:Math.max(Date.now(),old.timestamp+20000)} satisfies Fix));
 }
 return <div className="app-shell studio"><div className="phone"><header className="app-header"><strong>모의 GPS 이동 검증</strong><button className="text-button" onClick={()=>{gps.stop();onExit();}}>시안으로 돌아가기</button></header><main className="app-content padded">
 <p className="connection-note">모의 GPS · 예시 경로입니다. TMAP·실제 길찾기는 연결하지 않았어요. {fieldRoute?'직접 설정한 현장 테스트 경로를 사용해요. 지점을 이은 직선 거리이며 실제 보행 거리가 아니에요.':'실제 GPS도 서울시청 인근의 고정 예시 경로와 비교하는 테스트입니다.'}</p>
 <FieldRouteEditor onApply={applyRoute} onDefault={()=>applyRoute(null)}/>
 <section aria-label="실제 GPS 테스트"><h2>실제 GPS 수신 테스트</h2><p>시작 버튼을 누르면 위치 권한을 요청해요. 위치를 서버에 보내거나 저장하지 않아요. 실제 길 안내로 사용하지 마세요.</p><button className="primary" disabled={gps.active} onClick={()=>{setSource('gps');setGuiding(true);setProgress(initialProgress());gps.start();}}>실제 GPS 추적 시작</button><button className="secondary" disabled={!gps.active} onClick={()=>gps.stop()}>GPS 추적 중지</button><p role="status">{gps.notice}</p></section>
 <p>모의 좌표는 한 번에 20초씩 이동한 것으로 계산해요. 도착은 정확한 좌표를 두 번 받아 확인해요. 모의 입력 전 실제 GPS를 중지해 주세요.</p>
 <section className="tracking-guide" aria-label="지도 안내 제어"><h2>지도 이동 안내 테스트</h2><p aria-live="polite">{progress.arrived?'안내 완료':guiding?(source==='gps'?(gps.active?'실제 GPS 수신 중 · 예시 경로':'GPS 추적 중지 · 마지막 반영 위치'):'모의 좌표 안내 중'):'안내 대기'}</p><button className="primary" disabled={guiding} onClick={()=>{gps.stop();setSource('mock');setProgress(initialProgress());setGuiding(true);}}>모의 지도 안내 시작</button><button className="secondary" disabled={!guiding} onClick={()=>{gps.stop('지도 안내를 종료했어요.');setGuiding(false);setProgress(initialProgress());}}>지도 안내 종료</button></section>
 <TrackingMap route={route} key={routeVersion} progress={progress}/>
 <section className="tracking-guide" aria-label="이동 추적 상태" aria-live="polite"><h2>{progress.arrived?'목적지에 도착했어요':source==='gps'&&!gps.active?'GPS 추적이 중지됐어요':progress.offRoute?'경로를 벗어났어요':'이동 안내'}</h2>{progress.arrived&&<Motif kind="lotus" size={40}/>}<p>남은 거리 <strong data-testid="remaining">{formatDistance(progress.position?progress.remaining:route.distanceMeters)}</strong></p><p>안내 단계 {progress.stepIndex+1} / {route.steps.length}</p><p>{progress.arrived?'안내를 마쳤어요.':source==='gps'&&!gps.active?'다시 시작하면 새 위치로 안내를 확인해요.':progress.offRoute?'경로로 돌아오면 안내를 이어가요.':route.steps[progress.stepIndex].description}</p><p>{progress.position?`좌표 ${progress.position.lat.toFixed(6)}, ${progress.position.lng.toFixed(6)}`:'아직 좌표를 받지 않았어요.'}</p>{progress.rejected&&<p role="alert">좌표를 반영하지 않았어요. 좌표·GPS 오차·이동 속도를 확인해 주세요.</p>}</section>
 <fieldset disabled={gps.active} className="simulation-inputs"><legend>모의 GPS 조작</legend><form className="simulation-controls" onSubmit={e=>{e.preventDefault();send();}}><label>위도<input aria-label="위도" value={lat} onChange={e=>setLat(e.target.value)}/></label><label>경도<input aria-label="경도" value={lng} onChange={e=>setLng(e.target.value)}/></label><label>오차(m)<input aria-label="오차(m)" value={accuracy} onChange={e=>setAccuracy(e.target.value)}/></label><button className="primary">좌표 보내기</button></form>
 {!fieldRoute&&<div className="suggestions">{[['출발',37.5665,126.978],['직진 이동',37.567,126.978],['회전 지점',37.5675,126.978],['다음 안내',37.5675,126.979],['경로 이탈',37.5682,126.979],['경로 복귀',37.5675,126.979],['도착',37.5675,126.980]].map(([name,a,b])=><button className="secondary" key={name} onClick={()=>send(Number(a),Number(b))}>{name}</button>)}</div>}<button className="secondary" onClick={()=>{gps.stop();setGuiding(false);setSource('mock');setProgress(initialProgress());setLat(String(route.segments[0][0].lat));setLng(String(route.segments[0][0].lng));setAccuracy('5');}}>추적 초기화</button>
 </fieldset></main></div></div>;
}

