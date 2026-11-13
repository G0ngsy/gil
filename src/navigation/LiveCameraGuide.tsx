import {CameraPreview} from '../CameraPreview';
import type {WalkingRoute,Place} from '../../shared/navigation';
import type {Progress,Fix} from '../../shared/tracking';
import {JourneyInstruction} from './RouteJourney';

/** Route action overlay only: no phone heading or camera/ground alignment. */
export function LiveCameraGuide({route,progress,position,active,notice,destination}:{route:WalkingRoute;progress:Progress;position:Fix|null;active:boolean;notice:string;destination:Place}){
 return <div className="live-camera-guide"><CameraPreview live onMap={()=>{}} overlay={<div className="live-camera-overlay">
 <JourneyInstruction route={route} progress={progress} active={active} notice={notice} destination={destination} fix={position} surface="camera"/>
 <p className="camera-route-note">경로상 다음 행동을 알려줘요.<br/>현재 바라보는 방향이나 실제 도로를 가리키는 화살표는 아니에요.</p>
 </div>}/></div>;
}
