import {useState,type ReactNode} from 'react';
import KnotSplash from './splashes/knots/Splash';
import StepsSplash from './splashes/steps/Splash';
import {Brand} from './ui';
import {Intro} from './Intro';
import {RefinedIntro} from './RefinedIntro';

/** 시작 연출은 하나만 선택합니다. 세 연출을 이어 붙이지 않습니다. */
export default function App({children}:{children:ReactNode}){
 const [options]=useState(()=>{
  const query=new URLSearchParams(location.search);
  const choice=query.get('splash');
  const replay=choice==='knots'||choice==='steps';
  return {refined:query.get('intro')==='refined',legacy:query.get('intro')==='1',review:query.get('preview')==='1',replay,steps:choice==='steps'};
 });
 // 기본은 기존 문 연출이며 대체안은 명시한 비교 주소에서만 재생합니다.
 const [opening,setOpening]=useState(options.replay&&!options.legacy&&!options.refined);
 if(options.legacy||(!options.replay&&!options.refined))return <Intro>{children}</Intro>;
 if(options.refined)return <RefinedIntro>{children}</RefinedIntro>;
 const Splash=options.steps?StepsSplash:KnotSplash;
 return <>
  {/* 홈을 미리 준비하되 연출 동안 버튼·입력창이 눌리지 않도록 막습니다. */}
  <div inert={opening} aria-hidden={opening||undefined}>{children}</div>
  {opening&&<Splash brand={<Brand/>} replay={options.replay} onComplete={()=>setOpening(false)}/>}
 </>;
}
