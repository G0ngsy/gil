import {useEffect,useId,useState} from 'react';
import {compareFacing,routeBearingAt,type Facing} from '../../shared/facing';
import type {WalkingRoute} from '../../shared/navigation';
import type {Progress} from '../../shared/tracking';
import {Icon} from '../ui';

const messages:Record<Facing,{title:string;detail:string}>={
 forward:{title:'이 방향으로 이동하세요',detail:'주변과 보행 신호를 확인하며 이동하세요.'},
 left:{title:'왼쪽으로 방향을 맞춰 주세요',detail:'멈춘 자리에서 휴대폰 방향을 왼쪽으로 맞춰 주세요.'},
 right:{title:'오른쪽으로 방향을 맞춰 주세요',detail:'멈춘 자리에서 휴대폰 방향을 오른쪽으로 맞춰 주세요.'},
 opposite:{title:'반대쪽으로 방향을 맞춰 주세요',detail:'뒷걸음질하지 말고 멈춘 자리에서 방향을 확인하세요.'},
 unknown:{title:'방향을 확인하고 있어요',detail:'방향이 확인될 때까지 안전한 곳에서 기다려 주세요.'},
};
export function FacingGuide({route,progress,enabled}:{route:WalkingRoute;progress:Progress;enabled:boolean}){
 const id=useId();
 const [degrees,setDegrees]=useState('0'),[accuracy,setAccuracy]=useState('5');
 const [stable,setStable]=useState<Facing>('unknown');
 const now=Date.now();
 // This is a held MOCK sample, not a sensor stream. Reuse the last mock position at the mock sample time.
 const result=enabled?compareFacing(route,{...progress,timestamp:now},degrees.trim()?{degrees:Number(degrees),accuracyDegrees:accuracy.trim()?Number(accuracy):NaN,timestamp:now,reference:'true-north'}:null,now):{state:'unknown' as const};
 const candidate=result.state;
 useEffect(()=>{
  if(candidate==='unknown'){setStable('unknown');return;}
  const timer=setTimeout(()=>setStable(candidate),800);
  return()=>clearTimeout(timer);
 },[candidate]);
 // Invalid data hides a directional arrow in this render, without waiting for an effect/timer.
 const displayed=candidate==='unknown'?'unknown':stable;
 const unavailable=!enabled?'모의 GPS 안내에서만 사용할 수 있어요.':progress.arrived?'이동 안내를 마쳤어요.':progress.offRoute?'경로로 돌아온 뒤 방향을 확인해 주세요.':!progress.position?'모의 GPS 좌표를 먼저 보내 주세요.':progress.rejected?'유효한 모의 GPS 좌표를 다시 보내 주세요.':null;
 const message=unavailable?{title:'방향 안내 대기',detail:unavailable}:messages[displayed];
 const routeBearing=routeBearingAt(route,progress.along);
 function preset(delta:number){if(routeBearing!==null){setDegrees(String((routeBearing-delta+360)%360));setAccuracy('5');}}
 return <section className="facing-test" aria-label="모의 방향 안내">
 <p className="facing-test-label">모의 방향 · 실제 방위 센서 미연결</p>
 <div className="facing-card" aria-live="polite" aria-atomic="true" data-state={unavailable?'unknown':displayed}>
  <p className="facing-status">{unavailable?'방향 안내 대기':displayed==='unknown'?'방향 확인 중':displayed==='forward'?'방향이 맞아요':'방향을 맞춰 주세요'}</p>
  <div className={`facing-symbol facing-${displayed}`}>
   {!unavailable&&displayed!=='unknown'?<span data-testid="facing-arrow"><Icon name={displayed==='forward'?'arrow':displayed==='opposite'?'turn-back':'turn'} size={68}/></span>:<Icon name="clock" size={38}/>}
  </div>
  <h2>{message.title}</h2><p className="facing-detail">{message.detail}</p>
 </div>
 <fieldset className="simulation-inputs" disabled={!enabled||!progress.position||progress.offRoute||progress.arrived||progress.rejected}>
  <legend>모의 휴대폰 방향</legend><div className="facing-presets">{(['forward','left','right','opposite'] as const).map((state,index)=><button className="secondary" key={state} aria-pressed={candidate===state} onClick={()=>preset([0,-90,90,180][index])}>{['정방향','왼쪽','오른쪽','반대'][index]}</button>)}<button className="secondary" aria-pressed={candidate==='unknown'} onClick={()=>setDegrees('')}>확인 불가</button></div>
  <div className="simulation-controls"><label htmlFor={`${id}-degrees`}>모의 방위각 (도)<input id={`${id}-degrees`} type="number" min="0" max="360" step="any" value={degrees} onChange={event=>setDegrees(event.target.value)}/></label><label htmlFor={`${id}-accuracy`}>모의 방향 오차 (도)<input id={`${id}-accuracy`} type="number" min="0" max="20" step="any" value={accuracy} onChange={event=>setAccuracy(event.target.value)}/></label></div>
 </fieldset><p className="facing-test-note">진북 0° · 동쪽 90° · 남쪽 180° · 서쪽 270°. 선택한 모의값은 다음 변경까지 유지돼요. 화살표는 휴대폰 방향 보정 예시이며, 실제 센서나 몸의 방향을 감지하지 않아요.</p>
 </section>;
}
