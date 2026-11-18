/**
 * 뒤로가기 훅: 화면과 카메라/확인창의 방문 순서를 브라우저 기록과 연결하며 홈에서는 기본 뒤로가기를 막지 않습니다.
 */
import {useLayoutEffect,useRef,useState} from 'react';
export type Stage='home'|'results'|'route'|'map'|'history';
export interface View{stage:Stage;overlay?:'camera'|'confirm'}
interface Entry extends View{session:string;depth:number}
const key='gilbitNavigation';
/** Browser back and the app back button share one stack; home never traps Back. */
export function useAppHistory(onChange:(next:View,previous:View)=>void){
 const initial=useRef<Entry>({stage:'home',session:crypto.randomUUID(),depth:0});
 const current=useRef(initial.current),notify=useRef(onChange);notify.current=onChange;
 const [view,setView]=useState<View>(initial.current);
 const reset=useRef(false),travelling=useRef(false),queued=useRef<View|null>(null);
 // 방문 상태를 반영합니다. 뒤로 이동/홈 복귀일 때는 화면 정리 콜백도 실행합니다.
 function apply(next:Entry,announce=true){const previous=current.current;current.current=next;setView(next);if(announce)notify.current(next,previous);}
 function replace(next:Entry){history.replaceState({...history.state,[key]:next},'');}
 useLayoutEffect(()=>{
  replace(initial.current);
  const pop=(event:PopStateEvent)=>{
   travelling.current=false;
   const entry=event.state?.[key] as Entry|undefined;
   if(reset.current){reset.current=false;replace(current.current);const next=queued.current;queued.current=null;if(next)go(next);return;}
   // Reloaded/finished journeys are not revived by stale forward/back entries.
   if(entry&&entry.session!==current.current.session){history.back();return;}
   if(!entry)return;
   if(entry.overlay){history.back();return;} // Never revive camera or stale confirmation via Forward.
   apply(entry);
  };
  window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);
 },[]);
 // 다음 화면을 기록합니다. 홈 정리 중인 요청은 기록 이동이 끝난 뒤 반영합니다.
 function go(next:View){if(reset.current){queued.current=next;return;}if(next.stage===current.current.stage&&next.overlay===current.current.overlay)return;const entry={...next,session:current.current.session,depth:current.current.depth+1};history.pushState({...history.state,[key]:entry},'');apply(entry,false);}
 // 카메라 정리 등의 중복 알림으로 두 화면을 건너뛰지 않도록 이동 중 재호출을 막습니다.
 function back(){if(!reset.current&&!travelling.current){travelling.current=true;history.back();}}
 // X/종료는 홈까지 돌아가고 새 세션을 부여해 오래된 앞으로가기 기록을 무효화합니다.
 function home(){
  const depth=current.current.depth;
  const next:Entry={stage:'home',session:crypto.randomUUID(),depth:0};
  if(depth){reset.current=true;apply(next);history.go(-depth);}else{apply(next);replace(next);}
 }
 return {view,current,go,back,home};
}
