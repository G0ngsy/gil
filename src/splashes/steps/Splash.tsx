import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import './Splash.css';

// 두 안이 같은 키를 써야 안을 바꿔도 첫 방문 연출이 반복되지 않습니다.
const KEY='splashSeen';
const DURATION=2800; // CSS의 전체 재생 시간과 함께 바꾸세요. 단위는 밀리초입니다.
interface Props{onComplete:()=>void;brand?:ReactNode;replay?:boolean}
function seen(){try{return localStorage.getItem(KEY)==='true';}catch{return false;}}

export default function Splash({onComplete,brand,replay=false}:Props){
 // 최신 함수를 기억하되, 부모가 다시 그려져도 타이머를 처음부터 시작하지 않습니다.
 const callback=useRef(onComplete);callback.current=onComplete;
 const ended=useRef(false);
 // 이미 봤거나 동작 줄이기가 켜져 있으면 첫 화면부터 아무것도 그리지 않습니다.
 const [show]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&(replay||!seen()));
 const finish=useCallback(()=>{
  if(ended.current)return; // 연속 탭이나 타이머 중복으로 완료를 두 번 알리지 않습니다.
  ended.current=true;
  // 비교용 재생은 실제 첫 방문 기록을 바꾸지 않습니다. 저장이 막혀도 앱은 열립니다.
  if(!replay){try{localStorage.setItem(KEY,'true');}catch{/* 저장소 없이도 홈으로 이동합니다. */}}
  callback.current();
 },[replay]);
 useEffect(()=>{
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  if(!show||preference.matches){finish();return;}
  const timer=window.setTimeout(finish,DURATION);
  // 재생 도중 기기 설정을 켠 경우에도 기다리지 않고 끝냅니다.
  const change=()=>{if(preference.matches)finish();};
  preference.addEventListener('change',change);
  return()=>{window.clearTimeout(timer);preference.removeEventListener('change',change);};
 },[show,finish]);
 if(!show)return null;
 return <button type="button" className="steps-splash" aria-label="길빛 시작 화면 건너뛰기" onClick={finish}>
  {/* 전체 화면이 실제 버튼이므로 탭뿐 아니라 Enter와 Space로도 건너뜁니다. */}
  <svg className="steps-splash__art" viewBox="0 0 120 120" fill="currentColor" aria-hidden="true">
   {/* 세 발자국은 예시 장식이며 실제 이동이나 GPS 위치를 뜻하지 않습니다. */}
   <g className="steps-splash__first"><path d="M0-17C-7-17-10-6-7 0c2 4 3 5 3 10 0 7 9 7 9 0 0-5 4-9 4-15 0-8-4-12-9-12Z" transform="translate(38 93) rotate(-12)"/></g>
   <g className="steps-splash__second"><path d="M0-17C-7-17-10-6-7 0c2 4 3 5 3 10 0 7 9 7 9 0 0-5 4-9 4-15 0-8-4-12-9-12Z" transform="translate(78 58) rotate(12)"/></g>
   <g className="steps-splash__third"><path d="M0-17C-7-17-10-6-7 0c2 4 3 5 3 10 0 7 9 7 9 0 0-5 4-9 4-15 0-8-4-12-9-12Z" transform="translate(40 23) rotate(-12)"/></g>
  </svg>
  <span className="steps-splash__identity">
   {/* brand={<Brand />}를 넘기면 이 글자 자리가 기존 로고로 바뀝니다. */}
   <span className="steps-splash__brand">{brand??<span className="steps-splash__wordmark">길빛</span>}</span>
   <span className="steps-splash__message">어디로 걸어갈까요?</span>
  </span>
  <span className="steps-splash__skip" aria-hidden="true">화면을 누르면 시작해요</span>
 </button>;
}
