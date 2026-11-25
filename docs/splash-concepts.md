# 길빛 스플래시 두 가지 구현안

기존 문 열림·먹 번짐·산 레이어·등불·길 그리기·빛 퍼짐 없이, 완성된 SVG의 위치와 투명도만 바꾼다. 기본은 매듭이며 하나씩만 실행한다.

## 매듭의 합

### 1. 컨셉
네 매듭 조각이 중앙에 모여 길과 사람의 연결을 표현한다.

### 2. 타임라인

| 시간 | 장면 |
|---|---|
| 0~0.9초 | 네 조각이 각각 14px 안쪽으로 모임 |
| 0.9~1.25초 | 완성된 문양이 잠시 머물고 옅어짐 |
| 1.25~1.75초 | 중앙 로고와 문구 등장 |
| 1.75~2.5초 | 중앙 로고와 문구 유지 |
| 2.5~2.8초 | 전체가 옅어지며 홈 노출 |


### 3. Splash.tsx 전체 코드

파일: src/splashes/knots/Splash.tsx

```tsx
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
```


### 4. Splash.css 전체 코드

파일: src/splashes/knots/Splash.css

```css
/* 로컬 폰트라서 외부 폰트 서버 연결을 기다리지 않습니다. */
@font-face{font-family:'Noto Serif KR';src:url('/assets/title-serif.ttf') format('truetype');font-display:swap}
@font-face{font-family:'Noto Sans KR';src:url('/assets/noto-sans-kr.ttf') format('truetype');font-display:swap}
/* 색은 모두 단색입니다. 그림자·그라데이션·발광 효과는 쓰지 않습니다. */
.knots-splash{position:fixed;inset:0;z-index:1000;width:100%;height:100dvh;margin:0;padding:0;border:0;background:#F7F3EA;color:#245447;overflow:hidden;cursor:pointer;font-family:'Noto Sans KR',sans-serif;animation:knots-splash-leave 2.8s linear both;-webkit-tap-highlight-color:transparent}
.knots-splash:focus-visible{outline:2px solid #B58A52;outline-offset:-8px}
/* 장식과 로고를 같은 화면 중앙에 겹쳐 놓고 서로 다른 시간에 보입니다. */
.knots-splash__art{position:absolute;left:50%;top:50%;width:144px;height:144px;margin:-72px 0 0 -72px;animation:knots-splash-art 2.8s ease both;pointer-events:none}
.knots-splash__identity{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;animation:knots-splash-identity 2.8s ease both;pointer-events:none}
.knots-splash__brand{display:flex;align-items:center;justify-content:center;min-height:64px;color:#252D2A}
.knots-splash__wordmark{font:500 44px/1.4 'Noto Serif KR',serif;letter-spacing:.12em}
.knots-splash__message{font:400 17px/1.6 'Noto Sans KR',sans-serif;color:#65706B}
.knots-splash__skip{position:absolute;bottom:max(28px,env(safe-area-inset-bottom));left:16px;right:16px;text-align:center;font-size:12px;color:#65706B;animation:knots-splash-hint 2.8s linear both}
/* 2.5~2.8초: 화면 전체를 옅게 만들어 뒤의 홈을 자연스럽게 드러냅니다. */
@keyframes knots-splash-leave{0%,89.28%{opacity:1}100%{opacity:0}}
@keyframes knots-splash-art{0%,40%{opacity:1;transform:translateY(0)}57%,100%{opacity:0;transform:translateY(-8px)}}
/* 1.25초부터 로고와 문구를 함께 띄우고, 마지막 장면에서 정확히 중앙에 둡니다. */
@keyframes knots-splash-identity{0%,44.64%{opacity:0;transform:translateY(8px)}62.5%,100%{opacity:1;transform:translateY(0)}}
@keyframes knots-splash-hint{0%,75%{opacity:1}89.28%,100%{opacity:0}}
/* 네 조각이 0~0.9초 동안 중앙으로 모입니다. SVG 선 모양 자체는 바뀌지 않습니다. */
.knots-splash__art path{animation:knots-splash-gather .9s ease both}
.knots-splash__north{--x:0px;--y:-14px}
.knots-splash__east{--x:14px;--y:0px;stroke:#B58A52}
.knots-splash__south{--x:0px;--y:14px}
.knots-splash__west{--x:-14px;--y:0px}
@keyframes knots-splash-gather{from{opacity:0;transform:translate(var(--x),var(--y))}to{opacity:1;transform:translate(0,0)}}
/* 자바스크립트가 실행되기 전에도 움직임과 화면 노출을 막습니다. */
@media(prefers-reduced-motion:reduce){.knots-splash{display:none;animation:none}.knots-splash *{animation:none!important}}
```


### 5. App.tsx 연결 예시

아래는 한 안만 독립적으로 사용하는 연결부다. 기존 main.tsx의 콘텐츠를 `<App>{content}</App>`으로 감싼다. 프로젝트에 적용한 연결부는 비교 URL과 기존 문 주소도 처리하며, 기존 Brand를 brand 속성으로 전달한다.

```tsx
import {useState,type ReactNode} from 'react';
import Splash from './splashes/knots/Splash';

// children에는 현재 앱의 홈/길찾기 콘텐츠를 전달합니다.
export default function App({children}:{children:ReactNode}){
 const [opening,setOpening]=useState(true);
 return <>
  {/* 연출 중 뒤의 검색창이 눌리지 않도록 막고, 완료 후 다시 활성화합니다. */}
  <div inert={opening} aria-hidden={opening||undefined}>{children}</div>
  {opening&&<Splash onComplete={()=>setOpening(false)}/>}
 </>;
}
```

## 차분한 세 걸음

### 1. 컨셉
작은 세 발자국이 차례로 나타나 보행 앱의 목적을 직접 표현한다.

### 2. 타임라인

| 시간 | 장면 |
|---|---|
| 0~1.1초 | 발자국이 .12/.43/.74초에 차례로 등장 |
| 1.1~1.6초 | 발자국이 옅어짐 |
| 1.25~1.75초 | 중앙 로고와 문구 등장 |
| 1.75~2.5초 | 중앙 로고와 문구 유지 |
| 2.5~2.8초 | 전체가 옅어지며 홈 노출 |


### 3. Splash.tsx 전체 코드

파일: src/splashes/steps/Splash.tsx

```tsx
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
```


### 4. Splash.css 전체 코드

파일: src/splashes/steps/Splash.css

```css
/* 로컬 폰트라서 외부 폰트 서버 연결을 기다리지 않습니다. */
@font-face{font-family:'Noto Serif KR';src:url('/assets/title-serif.ttf') format('truetype');font-display:swap}
@font-face{font-family:'Noto Sans KR';src:url('/assets/noto-sans-kr.ttf') format('truetype');font-display:swap}
/* 색은 모두 단색입니다. 그림자·그라데이션·발광 효과는 쓰지 않습니다. */
.steps-splash{position:fixed;inset:0;z-index:1000;width:100%;height:100dvh;margin:0;padding:0;border:0;background:#F7F3EA;color:#245447;overflow:hidden;cursor:pointer;font-family:'Noto Sans KR',sans-serif;animation:steps-splash-leave 2.8s linear both;-webkit-tap-highlight-color:transparent}
.steps-splash:focus-visible{outline:2px solid #B58A52;outline-offset:-8px}
/* 장식과 로고를 같은 화면 중앙에 겹쳐 놓고 서로 다른 시간에 보입니다. */
.steps-splash__art{position:absolute;left:50%;top:50%;width:144px;height:144px;margin:-72px 0 0 -72px;animation:steps-splash-art 2.8s ease both;pointer-events:none}
.steps-splash__identity{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;animation:steps-splash-identity 2.8s ease both;pointer-events:none}
.steps-splash__brand{display:flex;align-items:center;justify-content:center;min-height:64px;color:#252D2A}
.steps-splash__wordmark{font:500 44px/1.4 'Noto Serif KR',serif;letter-spacing:.12em}
.steps-splash__message{font:400 17px/1.6 'Noto Sans KR',sans-serif;color:#65706B}
.steps-splash__skip{position:absolute;bottom:max(28px,env(safe-area-inset-bottom));left:16px;right:16px;text-align:center;font-size:12px;color:#65706B;animation:steps-splash-hint 2.8s linear both}
/* 2.5~2.8초: 화면 전체를 옅게 만들어 뒤의 홈을 자연스럽게 드러냅니다. */
@keyframes steps-splash-leave{0%,89.28%{opacity:1}100%{opacity:0}}
@keyframes steps-splash-art{0%,40%{opacity:1;transform:translateY(0)}57%,100%{opacity:0;transform:translateY(-8px)}}
/* 1.25초부터 로고와 문구를 함께 띄우고, 마지막 장면에서 정확히 중앙에 둡니다. */
@keyframes steps-splash-identity{0%,44.64%{opacity:0;transform:translateY(8px)}62.5%,100%{opacity:1;transform:translateY(0)}}
@keyframes steps-splash-hint{0%,75%{opacity:1}89.28%,100%{opacity:0}}
/* 발자국은 실제로 이동하지 않고 아래에서 위 순서로 작게 나타납니다. */
.steps-splash__art g{opacity:0;animation:steps-splash-step .35s ease both}
.steps-splash__first{animation-delay:.12s!important}
.steps-splash__second{animation-delay:.43s!important;color:#B58A52}
.steps-splash__third{animation-delay:.74s!important}
@keyframes steps-splash-step{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
/* 자바스크립트가 실행되기 전에도 움직임과 화면 노출을 막습니다. */
@media(prefers-reduced-motion:reduce){.steps-splash{display:none;animation:none}.steps-splash *{animation:none!important}}
```


### 5. App.tsx 연결 예시

아래는 한 안만 독립적으로 사용하는 연결부다. 기존 main.tsx의 콘텐츠를 `<App>{content}</App>`으로 감싼다. 프로젝트에 적용한 연결부는 비교 URL과 기존 문 주소도 처리하며, 기존 Brand를 brand 속성으로 전달한다.

```tsx
import {useState,type ReactNode} from 'react';
import Splash from './splashes/steps/Splash';

// children에는 현재 앱의 홈/길찾기 콘텐츠를 전달합니다.
export default function App({children}:{children:ReactNode}){
 const [opening,setOpening]=useState(true);
 return <>
  {/* 연출 중 뒤의 검색창이 눌리지 않도록 막고, 완료 후 다시 활성화합니다. */}
  <div inert={opening} aria-hidden={opening||undefined}>{children}</div>
  {opening&&<Splash onComplete={()=>setOpening(false)}/>}
 </>;
}
```


## 실제 프로젝트의 App.tsx

```tsx
import {useState,type ReactNode} from 'react';
import KnotSplash from './splashes/knots/Splash';
import StepsSplash from './splashes/steps/Splash';
import {Brand} from './ui';
import {Intro} from './Intro';

// 이 값만 'steps'로 바꾸면 두 번째 안이 기본 시작 화면이 됩니다.
const DEFAULT_SPLASH:'knots'|'steps'='knots';

/** 시작 연출은 하나만 선택합니다. 세 연출을 이어 붙이지 않습니다. */
export default function App({children}:{children:ReactNode}){
 const [options]=useState(()=>{
  const query=new URLSearchParams(location.search);
  const choice=query.get('splash');
  const replay=choice==='knots'||choice==='steps';
  return {legacy:query.get('intro')==='1',review:query.get('preview')==='1',replay,steps:(replay?choice:DEFAULT_SPLASH)==='steps'};
 });
 // 기본은 매듭 안입니다. 비교 주소의 재생은 첫 방문 기록을 바꾸지 않습니다.
 const [opening,setOpening]=useState(!options.legacy&&(!options.review||options.replay));
 if(options.legacy)return <Intro>{children}</Intro>; // 기존 문 연출은 명시한 주소에서만 유지합니다.
 const Splash=options.steps?StepsSplash:KnotSplash;
 return <>
  {/* 홈을 미리 준비하되 연출 동안 버튼·입력창이 눌리지 않도록 막습니다. */}
  <div inert={opening} aria-hidden={opening||undefined}>{children}</div>
  {opening&&<Splash brand={<Brand/>} replay={options.replay} onComplete={()=>setOpening(false)}/>}
 </>;
}
```

## 수정 사항 요약

### 변경 파일
- `src/splashes/knots/Splash.tsx`, `Splash.css`: 매듭의 합.
- `src/splashes/steps/Splash.tsx`, `Splash.css`: 차분한 세 걸음.
- `src/App.tsx`: 하나의 연출만 선택하고 홈 조작을 잠시 막는 연결부.
- `src/main.tsx`: 기존 콘텐츠를 App으로 감싸서 실행.
- `tests/browser/splash.spec.ts`, `tests/fixtures/splash-harness.tsx`: 저장·건너뛰기·타이머 정리 검증.

### 동작 흐름
1. 기본 진입은 매듭 안을 사용한다. `splashSeen`이 `true`이면 바로 홈으로 간다.
2. 첫 방문에는 선택한 연출 하나를 2.8초간 실행한다.
3. 탭·Enter·Space 또는 동작 줄이기 설정으로 즉시 끝낼 수 있다.
4. 완료 시 `localStorage.splashSeen=true`를 기록하고 홈을 조작할 수 있게 한다.
5. `?splash=knots` / `?splash=steps`는 저장 기록을 바꾸지 않는 비교용 재생이다.
6. 기존 문 연출은 `?intro=1`을 직접 지정했을 때만 실행한다. 새 연출과 이어 붙이지 않는다.

### 조절 가능한 값
| 항목 | 현재 값 | 위치 / 조절 방법 |
|---|---|---|
| 기본 컨셉 | knots | App.tsx의 DEFAULT_SPLASH를 steps로 바꾸기 |
| 전체 길이 | 2.8초 | TSX의 DURATION=2800과 CSS의 2.8s를 함께 변경 |
| 첫 방문 저장 키 | splashSeen | 두 Splash.tsx의 KEY를 같은 값으로 유지 |
| 로고 등장 시작 | 1.25초 | identity의 44.64% |
| 로고 등장 완료 | 1.75초 | identity의 62.5% |
| 홈 전환 시작 | 2.5초 | leave의 89.28% |
| 매듭 이동량 | 14px | north/east/south/west의 --x, --y |
| 발자국 간격 | .12/.43/.74초 | first/second/third의 animation-delay |
| 로고 교체 | brand 속성 | brand={<Brand />} 전달, 생략하면 명조 길빛 |
| 한지/소나무/황토 | #F7F3EA / #245447 / #B58A52 | 각 Splash.css의 단색 값 |

저장소 접근이 차단된 환경에서는 기록을 보존할 수 없어 다음 접속에 다시 표시될 수 있다. 그래도 건너뛰기와 홈 이동은 동작한다. 로컬 폰트 파일 두 개는 현재 프로젝트의 assets를 사용한다.
