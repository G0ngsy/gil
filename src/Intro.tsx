import {useEffect,useState,type ReactNode} from 'react';
import {Brand} from './ui';

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
  let cancelled=false;
  const timers:ReturnType<typeof setTimeout>[]=[];
  const later=(fn:()=>void,ms:number)=>timers.push(setTimeout(fn,ms));
  // Decode before moving the panels so an uncached image cannot appear halfway through.
  const images=['/assets/intro-doors.png','/assets/intro-landscape.png','/assets/gilbit-logo-reference.png'].map(src=>{const image=new Image();image.src=src;return image.decode().catch(()=>{});});
  let started=false;
  function begin(){if(cancelled||started)return;started=true;if(reduced){finish();return;}later(()=>setPhase('opening'),550);later(()=>setPhase('logo'),2150);later(()=>setPhase('logo-out'),3250);later(()=>setPhase('reveal'),3750);later(finish,4550);}
  void Promise.all(images).then(begin);
  later(begin,1500);
  return()=>{cancelled=true;timers.forEach(clearTimeout);};
 },[visible]);
 return <><div className={`intro-home ${visible?(phase==='reveal'?'intro-home-revealing':'intro-home-waiting'):''}`} inert={visible} aria-hidden={visible||undefined}>{children}</div>{visible&&<section className={`door-intro door-intro-${phase}`} aria-label="길빛 시작 화면">
 <div className="intro-landscape" aria-hidden="true"/>
 <div className="intro-door intro-door-left" aria-hidden="true"><img className="intro-door-art" src="/assets/intro-doors.png" alt=""/></div>
 <div className="intro-door intro-door-right" aria-hidden="true"><img className="intro-door-art" src="/assets/intro-doors.png" alt=""/></div>
 <div className="intro-center-logo" aria-hidden="true"><Brand/></div>
 <span className="sr-only" role="status">길빛을 열고 있어요</span><button className="intro-skip" onClick={finish}>건너뛰기</button>
 </section>}</>;
}
