/**
 * 첫 진입 연출: 한옥 문과 로고 애니메이션, 건너뛰기 및 동작 줄이기 설정을 처리합니다.
 */
import {useEffect,useState,type ReactNode} from 'react';
import {Brand} from './ui';
import {Door} from './RefinedIntro';

const storageKey='gilbit.intro.seen.v1';
function shouldShow(){
 const params=new URLSearchParams(location.search);
 if(params.get('intro')==='1')return true;
 if(params.get('preview')==='1')return false;
 try{return sessionStorage.getItem(storageKey)!=='1';}catch{return true;}
}
/** Decorative entry only; never requests device permissions or changes navigation data. */
export function Intro({children}:{children:ReactNode}){
 const [visible,setVisible]=useState(shouldShow);
 const [phase,setPhase]=useState<'closed'|'opening'|'logo'|'logo-out'|'reveal'>('closed');
 function finish(){try{sessionStorage.setItem(storageKey,'1');}catch{/* Storage is optional. */}setVisible(false);}
 useEffect(()=>{
  if(!visible)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 이미지 준비 시간 때문에 전체 길이가 늘어나지 않도록 시작 시점부터 3초를 셉니다.
  // 동작 줄이기에서는 이미지 준비나 타이머를 기다리지 않고 홈을 보여줍니다.
  if(reduced){finish();return;}
  const timers:ReturnType<typeof setTimeout>[]=[];
  const later=(fn:()=>void,ms:number)=>timers.push(setTimeout(fn,ms));
  // 이미지는 미리 읽되 완료를 기다리지 않습니다. 실패 시에도 한지 배경은 유지됩니다.
  for(const src of ['/assets/intro-landscape.png','/assets/gilbit-logo-reference.png']){
   const image=new Image();image.src=src;void image.decode().catch(()=>{});
  }
  later(()=>setPhase('opening'),300); // 0.3~1.4초: 문 열림(기존 1.1초 유지)
  later(()=>setPhase('logo'),1400); // 1.4~2초: 중앙 로고
  later(()=>setPhase('logo-out'),2000); // 2~2.25초: 로고 퇴장
  later(()=>setPhase('reveal'),2300); // 2.3~3초: 홈 줌인과 페이드
  later(finish,3000);
  return()=>timers.forEach(clearTimeout);
 },[visible]);
 return <><div className={`intro-home ${visible?(phase==='reveal'?'intro-home-revealing':'intro-home-waiting'):''}`} inert={visible} aria-hidden={visible||undefined}>{children}</div>{visible&&<section className={`door-intro door-intro-${phase}`} aria-label="길빛 시작 화면">
 <div className="intro-landscape" aria-hidden="true"/>
 <Door side="left" className="intro-door intro-door-left"/>
 <Door side="right" className="intro-door intro-door-right"/>
 <div className="intro-center-logo" aria-hidden="true"><Brand/></div>
 <span className="sr-only" role="status">길빛을 열고 있어요</span><button className="intro-skip" onClick={finish}>건너뛰기</button>
 </section>}</>;
}
