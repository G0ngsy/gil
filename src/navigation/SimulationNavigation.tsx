import {useState} from 'react';
import {formatDistance, type WalkingRoute} from '../../shared/navigation';
import {initialProgress,updateProgress,type Fix} from '../../shared/tracking';
import {Motif} from '../Motif';

export const simulationRoute:WalkingRoute={distanceMeters:300,durationSeconds:240,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978},{lat:37.5675,lng:126.980}]],steps:[{lat:37.5665,lng:126.978,description:'보행로를 따라 직진하세요',turnType:0},{lat:37.5675,lng:126.978,description:'오른쪽 보행로로 이동하세요',turnType:0},{lat:37.5675,lng:126.979,description:'목적지까지 직진하세요',turnType:0}]};
export function SimulationNavigation({onExit}:{onExit:()=>void}){
 const [progress,setProgress]=useState(initialProgress);
 const [lat,setLat]=useState('37.5665'),[lng,setLng]=useState('126.978'),[accuracy,setAccuracy]=useState('5');
 function send(latitude=(lat.trim()?Number(lat):NaN),longitude=(lng.trim()?Number(lng):NaN)){
  setLat(String(latitude));setLng(String(longitude));
  setProgress(old=>updateProgress(simulationRoute,old,{lat:latitude,lng:longitude,accuracy:accuracy.trim()?Number(accuracy):NaN,timestamp:Math.max(Date.now(),old.timestamp+1)} satisfies Fix));
 }
 return <div className="app-shell studio"><div className="phone"><header className="app-header"><strong>모의 GPS 이동 검증</strong><button className="text-button" onClick={onExit}>시안으로 돌아가기</button></header><main className="app-content padded">
 <p className="connection-note">모의 GPS · 예시 경로입니다. 실제 위치·지도·TMAP을 사용하지 않아요.</p>
 <section aria-label="이동 추적 상태" aria-live="polite"><h2>{progress.arrived?'목적지에 도착했어요':progress.offRoute?'경로를 벗어났어요':'이동 안내'}</h2>{progress.arrived&&<Motif kind="lotus" size={40}/>}<p>남은 거리 <strong data-testid="remaining">{formatDistance(progress.position?progress.remaining:300)}</strong></p><p>안내 단계 {progress.stepIndex+1} / {simulationRoute.steps.length}</p><p>{progress.arrived?'안내를 마쳤어요.':progress.offRoute?'경로로 돌아오면 안내를 이어가요.':simulationRoute.steps[progress.stepIndex].description}</p><p>{progress.position?`좌표 ${progress.position.lat.toFixed(6)}, ${progress.position.lng.toFixed(6)}`:'아직 좌표를 받지 않았어요.'}</p>{progress.rejected&&<p role="alert">좌표를 반영하지 않았어요. 좌표 범위와 GPS 오차(30m 이하)를 확인해 주세요.</p>}</section>
 <form className="simulation-controls" onSubmit={e=>{e.preventDefault();send();}}><label>위도<input aria-label="위도" value={lat} onChange={e=>setLat(e.target.value)}/></label><label>경도<input aria-label="경도" value={lng} onChange={e=>setLng(e.target.value)}/></label><label>오차(m)<input aria-label="오차(m)" value={accuracy} onChange={e=>setAccuracy(e.target.value)}/></label><button className="primary">좌표 보내기</button></form>
 <div className="suggestions">{[['출발',37.5665,126.978],['직진 이동',37.567,126.978],['회전 지점',37.5675,126.978],['다음 안내',37.5675,126.979],['경로 이탈',37.5682,126.979],['경로 복귀',37.5675,126.9794],['도착',37.5675,126.980]].map(([name,a,b])=><button className="secondary" key={name} onClick={()=>send(Number(a),Number(b))}>{name}</button>)}</div><button className="secondary" onClick={()=>{setProgress(initialProgress());setLat('37.5665');setLng('126.978');setAccuracy('5');}}>추적 초기화</button>
 </main></div></div>;
}

