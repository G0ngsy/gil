import {useEffect,useState,type ReactNode} from 'react';
import {Brand} from './ui';
import './RefinedIntro.css';

/** 문 이미지를 늘리지 않고 일정한 굵기의 창살과 원형 문고리를 그립니다. */
function Door({side}:{side:'left'|'right'}){
 return <div className={`refined-door refined-door-${side}`} aria-hidden="true">
  <div className="refined-panel">
   {[14,27,73,86].map(x=><i key={`v${x}`} className="refined-stile" style={{left:`${x}%`}}/>)}
   {[8,17,83,92].map(y=><i key={`h${y}`} className="refined-rail" style={{top:`${y}%`}}/>)}
   <span className="refined-handle"/>
  </div>
 </div>;
}
/** 개선안 비교 전용: 첫 방문 기록이나 기본 스플래시 선택은 바꾸지 않습니다. */
export function RefinedIntro({children}:{children:ReactNode}){
 const [visible,setVisible]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [phase,setPhase]=useState<'closed'|'opening'|'logo'|'reveal'>('closed');
 useEffect(()=>{
  if(!visible)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>{if(preference.matches)setVisible(false);};
  const timers=[setTimeout(()=>setPhase('opening'),300),setTimeout(()=>setPhase('logo'),1400),setTimeout(()=>setPhase('reveal'),2300),setTimeout(()=>setVisible(false),3000)];
  preference.addEventListener('change',change);
  return()=>{timers.forEach(clearTimeout);preference.removeEventListener('change',change);};
 },[visible]);
 return <><div className={`refined-home ${visible?(phase==='reveal'?'refined-home-reveal':'refined-home-waiting'):''}`} inert={visible} aria-hidden={visible||undefined}>{children}</div>
 {visible&&<section className={`refined-intro refined-${phase}`} aria-label="문 열림 개선안 미리보기">
  <div className="refined-scenery" aria-hidden="true"/>
  <div className="refined-identity"><Brand/><p>어디로 걸어갈까요?</p></div>
  <Door side="left"/><Door side="right"/>
  <button className="refined-skip" onClick={()=>setVisible(false)}>건너뛰기</button>
 </section>}</>;
}
