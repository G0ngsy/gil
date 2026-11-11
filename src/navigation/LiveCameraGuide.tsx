import {useEffect,useState} from 'react';
import {CameraPreview} from '../CameraPreview';
import {compareFacing} from '../../shared/facing';
import type {WalkingRoute} from '../../shared/navigation';
import type {Progress,Fix} from '../../shared/tracking';
import {DirectionCard} from './FacingGuide';
import {SensorDiagnostics} from './SensorDiagnostics';
import {useHeadingTracking} from './useHeadingTracking';

export function LiveCameraGuide({route,progress,position,active}:{route:WalkingRoute;progress:Progress;position:Fix|null;active:boolean}){
 const [playing,setPlaying]=useState(false);
 const sensor=useHeadingTracking(position,active&&playing);
 const [,tick]=useState(0);
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>tick(n=>n+1),250);return()=>clearInterval(timer);},[playing]);
 const result=compareFacing(route,progress,playing&&active&&sensor.active?sensor.sample:null,Date.now());
 const unavailable=!active?'GPS 안내를 다시 시작해 주세요.':!sensor.active?'방향 센서 시작 버튼을 눌러 주세요.':progress.arrived?'목적지에 도착했어요.':progress.offRoute?'경로를 벗어났어요. 안내 화면에서 확인해 주세요.':null;
 return <div className="live-camera-guide"><CameraPreview live onPlayingChange={setPlaying} onMap={()=>setPlaying(false)} overlay={<div className="live-camera-overlay">
 <DirectionCard candidate={result.state} unavailable={unavailable}/>
 <div className="live-camera-sensor"><p>멈춘 자리에서 휴대폰을 세로 화면으로 바닥과 나란하게 들어 주세요. 세워 들거나 방향 오차를 확인할 수 없는 브라우저에서는 화살표를 숨겨요.</p><p role="status">{sensor.notice}</p><button className="secondary" onClick={()=>void(sensor.active?sensor.stop():sensor.start())}>{sensor.active?'방향 센서 중지':'방향 센서 시작'}</button><SensorDiagnostics diagnostic={sensor.diagnostic} notice={sensor.notice}/></div>
 </div>}/></div>;
}
