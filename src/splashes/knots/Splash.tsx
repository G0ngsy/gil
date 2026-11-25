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
 return <button type="button" className="knots-splash" aria-label="길빛 시작 화면 건너뛰기" onClick={finish}>
  {/* 전체 화면이 실제 버튼이므로 탭뿐 아니라 Enter와 Space로도 건너뜁니다. */}
  <svg className="knots-splash__art" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
   {/* 선을 그리는 효과 없이, 완성된 네 조각의 위치와 투명도만 바꿉니다. */}
   <path className="knots-splash__north" d="m60 10 23 23-23 23-23-23Z"/>
   <path className="knots-splash__east" d="m110 60-23 23-23-23 23-23Z"/>
   <path className="knots-splash__south" d="m60 110-23-23 23-23 23 23Z"/>
   <path className="knots-splash__west" d="m10 60 23-23 23 23-23 23Z"/>
  </svg>
  <span className="knots-splash__identity">
   {/* brand={<Brand />}를 넘기면 이 글자 자리가 기존 로고로 바뀝니다. */}
   <span className="knots-splash__brand">{brand??<span className="knots-splash__wordmark">길빛</span>}</span>
   <span className="knots-splash__message">어디로 걸어갈까요?</span>
  </span>
  <span className="knots-splash__skip" aria-hidden="true">화면을 누르면 시작해요</span>
 </button>;
}
