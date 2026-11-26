/** GPS와 카메라 없이 브라우저 방위 이벤트의 원본 수신 여부만 진단합니다. */
import {useEffect,useRef,useState} from 'react';
import {SensorDiagnostics} from './SensorDiagnostics';
type Fields=Record<string,string|number|boolean|null>;
type SensorCtor=typeof DeviceOrientationEvent&{requestPermission?:(absolute?:boolean)=>Promise<string>};
export function HeadingDiagnosticPage(){
 const [active,setActive]=useState(false),[pending,setPending]=useState(false),[notice,setNotice]=useState('센서 시작을 누르고 휴대폰을 천천히 좌우로 돌려 주세요.');
 const [values,setValues]=useState<Fields>({status:'아직 수신하지 않음'});
 const epoch=useRef(0),cleanup=useRef<(()=>void)|null>(null);
 function release(){epoch.current++;cleanup.current?.();cleanup.current=null;}
 function stop(message='센서를 중지했어요. 결과는 확인·복사할 수 있어요.'){release();setActive(false);setPending(false);setNotice(message);}
 async function start(){
  release();const token=epoch.current;setValues({status:'수신 대기'});
  if(!window.isSecureContext||!window.DeviceOrientationEvent){setNotice('방향 센서를 지원하지 않는 환경이에요. 휴대폰의 HTTPS 주소로 열어 주세요.');return;}
  setActive(true);setPending(true);setNotice('센서 권한을 확인하고 있어요.');
  try{
   const ctor=window.DeviceOrientationEvent as SensorCtor;
   if(ctor.requestPermission&&await ctor.requestPermission(true)!=='granted'){if(token===epoch.current)stop('센서 권한이 거부됐어요. 브라우저 설정에서 확인해 주세요.');return;}
   if(token!==epoch.current)return;
   setPending(false);setNotice('수신 대기 중이에요. 휴대폰을 천천히 좌우로 돌려 주세요.');
   let count=0;const timer=setTimeout(()=>{if(token===epoch.current&&count===0)setNotice('10초 동안 이벤트가 없어요. 중지 후 다시 시작하거나 다른 브라우저와 비교해 주세요.');},10000);
   const receive=(event:Event)=>{
    if(token!==epoch.current)return;count++;
    const e=event as DeviceOrientationEvent&{webkitCompassHeading?:number;webkitCompassAccuracy?:number};
    const number=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)?Math.round(x*10)/10:null;
    const prefix=event.type==='deviceorientationabsolute'?'absoluteEvent':'orientationEvent';
    const reading:Fields={event:event.type,absolute:typeof e.absolute==='boolean'?e.absolute:null,alpha:number(e.alpha),beta:number(e.beta),gamma:number(e.gamma),webkitCompassHeading:number(e.webkitCompassHeading),webkitCompassAccuracy:number(e.webkitCompassAccuracy),screenAngle:screen.orientation?.angle??null,receivedAt:new Date().toISOString()};
    setValues(previous=>({...previous,...Object.fromEntries(Object.entries(reading).map(([key,value])=>[prefix+'.'+key,value])),status:'이벤트 수신 중',eventCount:count,secureContext:window.isSecureContext,standalone:matchMedia('(display-mode: standalone)').matches}));
    setNotice('센서 값이 들어오고 있어요. 북쪽 기준/오차 지원 여부는 결과를 비교해 확인해야 해요.');
   };
   window.addEventListener('deviceorientation',receive);window.addEventListener('deviceorientationabsolute',receive);
   cleanup.current=()=>{clearTimeout(timer);window.removeEventListener('deviceorientation',receive);window.removeEventListener('deviceorientationabsolute',receive);};
  }catch{if(token===epoch.current)stop('센서를 시작하지 못했어요. 권한과 브라우저 설정을 확인해 주세요.');}
 }
 useEffect(()=>{const hidden=()=>{if(document.hidden)stop('화면이 숨겨져 센서를 중지했어요. 다시 시작해 주세요.');};const leave=()=>stop('화면을 떠나 센서를 중지했어요.');document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);return()=>{release();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);};},[]);
 return <section className="heading-diagnostic padded"><h2>방향 센서 진단</h2><p>GPS·카메라 없이 센서 수신만 확인해요. 설치한 앱과 삼성 인터넷·Chrome에서 비교할 수 있어요.</p><p>금속·전자기기에서 떨어져 안전한 곳에 멈춘 뒤 천천히 좌우로 돌려 주세요. 실내 결과만으로 야외 방향 정확도를 판단하지 않아요.</p><button className="primary" disabled={active} onClick={()=>void start()}>센서 시작</button><button className="secondary" disabled={!active} onClick={()=>stop()}>{pending?'권한 요청 취소':'센서 중지'}</button><p role="status">{notice}</p><dl aria-label="실시간 센서 값">{Object.entries(values).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value===null?'제공 안 됨':String(value)}</dd></div>)}</dl><SensorDiagnostics diagnostic={values} notice={notice}/></section>;
}
