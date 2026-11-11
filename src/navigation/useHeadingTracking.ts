import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {orientationToHeading,type CompassReading} from '../../shared/compass';
import type {HeadingSample} from '../../shared/facing';
import type {Fix} from '../../shared/tracking';

const notices={position:'새로운 GPS 위치가 필요해요.',pose:'휴대폰을 세로 화면으로 바닥과 나란하게 들어 주세요.',relative:'상대 방향만 제공되어 이동 방향을 확인할 수 없어요.',accuracy:'이 브라우저의 방향 오차를 확인할 수 없거나 너무 커요. 화살표를 숨겼어요.',model:'현재 위치·날짜의 진북 보정을 지원하지 않아요.',invalid:'유효한 방향을 받지 못했어요.'};
type OrientationConstructor=typeof DeviceOrientationEvent&{requestPermission?:(absolute?:boolean)=>Promise<string>};
export function useHeadingTracking(position:Fix|null,enabled:boolean){
 const [active,setActive]=useState(false),[pending,setPending]=useState(false);
 const [sample,setSample]=useState<HeadingSample|null>(null),[notice,setNotice]=useState('');
 const [diagnostic,setDiagnostic]=useState<Record<string,string|number|boolean|null>>({status:'아직 수신하지 않음'});
 const received=useRef(false);
 const latest=useRef(position);latest.current=position;
 const version=useRef(0),detach=useRef<(()=>void)|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const release=useCallback(()=>{version.current++;detach.current?.();detach.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;},[]);
 const stop=useCallback((text='방향 센서를 중지했어요.')=>{release();setActive(false);setPending(false);setSample(null);setNotice(text);},[release]);
 async function start(){
  if(!enabled)return;
  release();received.current=false;setDiagnostic({status:'수신 대기'});setSample(null);setNotice('방향 센서 권한을 확인하고 있어요.');
  if(!window.isSecureContext||!window.DeviceOrientationEvent){stop('이 환경은 방향 센서를 지원하지 않아요. 휴대폰의 HTTPS 화면에서 확인해 주세요.');return;}
  const token=version.current;
  setActive(true);setPending(true);
  try{
   const ctor=window.DeviceOrientationEvent as OrientationConstructor;
   if(ctor.requestPermission&&await ctor.requestPermission(true)!=='granted'){if(token===version.current)stop('방향 센서 권한이 꺼져 있어요. 사이트 설정을 확인한 뒤 다시 시작해 주세요.');return;}
   if(token!==version.current)return;
   setPending(false);setNotice('방향을 기다리고 있어요. 휴대폰을 바닥과 나란하게 들어 주세요.');
   const arm=(ms:number)=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{if(token===version.current)stop(received.current?'유효한 방향을 확인하지 못해 진단을 마쳤어요. 센서 진단 결과를 확인해 주세요.':'방향 수신이 멈췄어요. 다시 시작해 주세요.');},ms);};
   const receive=(event:Event)=>{
    if(token!==version.current)return;
    received.current=true;
    const reading=event as unknown as CompassReading;
    const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?Math.round(value*10)/10:null;
    const age=event.timeStamp>1e12?Date.now()-event.timeStamp:performance.now()-event.timeStamp;
    if(!Number.isFinite(age)||age<0||age>1000){setDiagnostic({event:event.type,status:'오래된 이벤트 제외'});setSample(null);setNotice('오래된 방향값을 제외했어요.');return;}
    const angle=window.screen.orientation?.angle??(window as Window&{orientation?:number}).orientation??NaN;
    const result=orientationToHeading(event as unknown as CompassReading,latest.current,angle,Date.now());
    setDiagnostic({event:event.type,absolute:typeof reading.absolute==='boolean'?reading.absolute:null,alpha:number(reading.alpha),beta:number(reading.beta),gamma:number(reading.gamma),webkitCompassHeading:number(reading.webkitCompassHeading),webkitCompassAccuracy:number(reading.webkitCompassAccuracy),screenAngle:number(angle),status:result.reason??'유효한 방향',secureContext:window.isSecureContext});
    setSample(result.sample);
    if(!result.sample){setNotice(notices[result.reason]);return;}
    arm(3000);setNotice('실제 방향 수신 중 · 진북 보정');
   };
   const rotate=()=>{if(token===version.current){setSample(null);setNotice(notices.pose);}};
   window.addEventListener('deviceorientation',receive);window.addEventListener('deviceorientationabsolute',receive);
   window.addEventListener('orientationchange',rotate);window.screen.orientation?.addEventListener('change',rotate);
   detach.current=()=>{window.removeEventListener('deviceorientation',receive);window.removeEventListener('deviceorientationabsolute',receive);window.removeEventListener('orientationchange',rotate);window.screen.orientation?.removeEventListener('change',rotate);};
   arm(5000);
  }catch{if(token===version.current)stop('방향 센서를 켜지 못했어요. 권한 설정을 확인해 주세요.');}
 }
 useEffect(()=>{if(!enabled)stop('GPS 안내를 시작하면 방향 센서를 사용할 수 있어요.');},[enabled,stop]);
 useLayoutEffect(()=>{
  const hidden=()=>{if(document.hidden)stop('화면이 숨겨져 방향 센서를 중지했어요.');};
  const leave=()=>stop('화면을 떠나 방향 센서를 중지했어요.');
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);
  return()=>{release();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);};
 },[stop,release]);
 return {active,pending,sample,notice,diagnostic,start,stop};
}
