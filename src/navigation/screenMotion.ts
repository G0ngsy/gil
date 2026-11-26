import {flushSync} from 'react-dom';
import './screenMotion.css';
export type ScreenMotion='none'|'card'|'push-forward'|'push-back';
type NativeTransition={ready:Promise<void>;finished:Promise<void>;skipTransition:()=>void};
type Operation={apply:()=>void;cancel:()=>void};
let active:Operation|null=null;

/** 연출 실패가 이동 실패가 되지 않게, 화면 갱신은 반드시 한 번만 수행합니다. */
export function changeScreen(change:()=>void,kind:ScreenMotion){
 active?.apply();active?.cancel();
 if(kind==='none'){change();return;}
 let applied=false,cancelled=false,native:NativeTransition|undefined,animation:Animation|undefined;
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const apply=()=>{if(applied||cancelled)return;applied=true;flushSync(change);};
 const cleanup=()=>{preference.removeEventListener('change',reduce);if(active===operation){active=null;delete document.documentElement.dataset.screenMotion;}};
 const operation:Operation={apply,cancel:()=>{cancelled=true;native?.skipTransition();animation?.cancel();cleanup();}};
 const reduce=()=>{if(preference.matches){apply();operation.cancel();}};
 active=operation;
 if(preference.matches){apply();cleanup();return;}
 document.documentElement.dataset.screenMotion=kind;
 preference.addEventListener('change',reduce);
 const fallback=()=>{
  apply();
  const page=document.querySelector<HTMLElement>('.live-content');
  const from=kind==='card'?'scale(.97)':`translateX(${kind==='push-back'?'-':''}32px)`;
  animation=page?.animate?.([{opacity:0,transform:from},{opacity:1,transform:'none'}],{duration:280,easing:'ease-out'});
  if(animation)void animation.finished.then(cleanup,cleanup);else cleanup();
 };
 try{
  const start=(document as Document&{startViewTransition?:(update:()=>void)=>NativeTransition}).startViewTransition;
  if(!start){fallback();return;}
  native=start.call(document,apply);
  // 연출이 생략되어 준비 약속이 거절돼도 화면 이동과 기록은 유지합니다.
  void native.ready.catch(()=>{});
  void native.finished.then(cleanup,cleanup);
 }catch{fallback();}
}
/** 화면이 사라질 때 늦은 갱신을 버리고 연출을 정리합니다. */
export function stopScreenMotion(){active?.cancel();}
