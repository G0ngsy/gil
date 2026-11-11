import {useEffect,useRef,useState,type ReactNode} from 'react';

function cameraError(error:unknown){
 const name=error instanceof DOMException?error.name:'';
 if(name==='NotAllowedError'||name==='SecurityError')return '카메라 권한이 꺼져 있어요. 브라우저의 사이트 설정에서 카메라를 허용한 뒤 다시 시도해 주세요.';
 if(name==='NotFoundError'||name==='OverconstrainedError')return '사용할 수 있는 카메라가 없어요. 카메라 연결을 확인해 주세요.';
 if(name==='NotReadableError')return '카메라를 사용할 수 없어요. 다른 앱에서 사용 중인지 확인해 주세요.';
 return '카메라 화면을 열지 못했어요. 잠시 후 다시 시도해 주세요.';
}
export function CameraPreview({onMap,live=false,overlay,onPlayingChange}:{onMap:()=>void;live?:boolean;overlay?:ReactNode;onPlayingChange?:(playing:boolean)=>void}){
 const [open,setOpen]=useState(false);
 const [state,setState]=useState<'idle'|'pending'|'playing'|'error'>('idle');
 const [error,setError]=useState('');
 const notify=useRef(onPlayingChange);notify.current=onPlayingChange;
 useEffect(()=>{notify.current?.(state==='playing'&&open);},[state,open]);
 const video=useRef<HTMLVideoElement>(null);
 const stream=useRef<MediaStream|null>(null);
 const version=useRef(0);
 function release(){notify.current?.(false);version.current++;stream.current?.getTracks().forEach(track=>{track.onended=null;track.stop();});stream.current=null;if(video.current)video.current.srcObject=null;}
 function close(){release();setOpen(false);setState('idle');setError('');}
 useEffect(()=>{
  const pause=()=>{release();setState('idle');setError('화면을 벗어나 카메라를 껐어요. 다시 켜려면 버튼을 눌러 주세요.');};
  const visibility=()=>{if(document.hidden)pause();};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pause);
  return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pause);release();};
 },[]);
 async function start(){
  release();const request=version.current;setOpen(true);setError('');setState('pending');
  if(!window.isSecureContext){setError('카메라는 HTTPS 주소 또는 이 기기의 localhost에서 사용할 수 있어요.');setState('error');return;}
  if(!navigator.mediaDevices?.getUserMedia){setError('이 브라우저는 카메라 연결을 지원하지 않아요. 최신 브라우저에서 열어 주세요.');setState('error');return;}
  try{
   const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
   if(request!==version.current){next.getTracks().forEach(track=>track.stop());return;}
   stream.current=next;
   next.getVideoTracks().forEach(track=>{track.onended=()=>{release();setState('error');setError('카메라 연결이 끊겼어요. 다시 켜 주세요.');};});
   if(!video.current)throw new Error('Video unavailable');
   video.current.srcObject=next;await video.current.play();
   if(request===version.current)setState('playing');
  }catch(e){if(request===version.current){release();setError(cameraError(e));setState('error');}}
 }
 return <>{!open&&<button className="secondary camera-launch" onClick={()=>void start()}>실제 카메라 켜기</button>}{open&&<section className="real-camera" aria-label="실제 카메라 미리보기">
 <video ref={video} autoPlay muted playsInline aria-label="실시간 카메라 영상"/>
 <div className="real-camera-label"><strong>{live?'카메라 방향 안내 · 시험 기능':'실제 카메라 · 미리보기'}</strong><p>{live?'화면 위 방향 표시 · 바닥에 고정되는 AR은 아니에요.':'방향 추적 준비 중 · 화살표 안내는 표시하지 않아요.'}</p></div>
 {state==='playing'&&overlay}
 {state!=='playing'&&<div className="camera-permission"><h2>{state==='pending'?'카메라 권한을 확인해 주세요':'카메라를 켜 주세요'}</h2><p role={error?'alert':'status'}>{error||'브라우저의 카메라 허용을 선택하면 화면이 나타나요.'}</p>{state!=='pending'&&<button className="primary" onClick={()=>void start()}>카메라 다시 켜기</button>}<button className="secondary" onClick={close}>{state==='pending'?'요청 취소':live?'안내로 돌아가기':'시안으로 돌아가기'}</button></div>}
 <div className="real-camera-controls"><p>안전한 곳에 멈춰 확인하세요.<br/>영상은 저장하거나 전송하지 않아요.</p><button className="secondary" onClick={close}>카메라 끄기</button><button className="secondary" onClick={()=>{close();onMap();}}>지도 보기</button></div>
 </section>}</>;
}
