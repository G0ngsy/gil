import {useEffect,useRef,useState} from 'react';
import {isCoordinate} from '../../shared/navigation';
import type {Fix} from '../../shared/tracking';

/** Explicit opt-in only. Each session invalidates late browser callbacks. */
export function useGpsTracking(onFix:(fix:Fix)=>void, receivedNotice='실제 GPS 위치를 수신하고 있어요. 경로는 예시입니다.',onObservation?:(fix:Fix)=>void){
 const [active,setActive]=useState(false);
 const [notice,setNotice]=useState('');
 const session=useRef(0),watch=useRef<number|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const receiver=useRef(onFix);receiver.current=onFix;
 const observer=useRef(onObservation);observer.current=onObservation;
 function release(){session.current++;if(watch.current!==null){navigator.geolocation.clearWatch(watch.current);watch.current=null;}if(timer.current){clearTimeout(timer.current);timer.current=null;}}
 function stop(text='GPS 추적을 중지했어요.'){release();setActive(false);setNotice(text);}
 function start(){
  release();
  if(!window.isSecureContext||!navigator.geolocation){setNotice('이 환경에서는 GPS를 사용할 수 없어요. HTTPS 또는 localhost에서 확인해 주세요.');return;}
  const version=session.current;
  setActive(true);setNotice('GPS 위치를 기다리고 있어요…');
  const arm=()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{if(session.current===version)stop('GPS 수신이 20초 동안 멈췄어요. 안전한 곳에서 다시 시작해 주세요.');},20000);};
  arm();
  try{
   const id=navigator.geolocation.watchPosition(position=>{
    if(session.current!==version)return;
    const fix={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy,timestamp:position.timestamp};
    if(!isCoordinate(fix)||!Number.isFinite(fix.accuracy)||fix.accuracy<0||fix.accuracy>100||!Number.isFinite(fix.timestamp)||Date.now()-fix.timestamp>10000||fix.timestamp>Date.now()+1000){setNotice('GPS 오차가 크거나 오래된 위치예요. 새 위치를 기다리고 있어요.');return;}
    if(observer.current){observer.current(fix);arm();}
    if(fix.accuracy>30){setNotice(`위치 오차가 약 ${Math.round(fix.accuracy)}m예요. 지도에 대략적인 위치만 표시하며 이동 안내는 정확한 위치를 기다려요.`);return;}
    arm();setNotice(receivedNotice);receiver.current(fix);
   },error=>{if(session.current!==version)return;stop(error.code===1?'위치 권한이 꺼져 있어요. 브라우저 설정에서 허용한 뒤 다시 시작해 주세요.':error.code===3?'GPS 수신 시간이 초과됐어요. 다시 시작해 주세요.':'현재 위치를 받지 못했어요. 안전한 곳에서 다시 시작해 주세요.');},{enableHighAccuracy:true,maximumAge:0,timeout:15000});
   if(session.current===version)watch.current=id;else navigator.geolocation.clearWatch(id);
  }catch{stop('GPS 추적을 시작하지 못했어요. 브라우저 설정을 확인해 주세요.');}
 }
 useEffect(()=>{
  const hidden=()=>{if(document.hidden)stop('화면이 숨겨져 GPS 추적을 중지했어요. 다시 시작할 수 있어요.');};
  const leave=()=>stop('화면을 떠나 GPS 추적을 중지했어요.');
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);
  return()=>{release();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);};
 },[]);
 return {active,notice,start,stop};
}
