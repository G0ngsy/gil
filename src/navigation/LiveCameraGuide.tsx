import {CameraPreview} from '../CameraPreview';
import type {WalkingRoute,Place} from '../../shared/navigation';
import type {Progress,Fix} from '../../shared/tracking';
import {JourneyInstruction} from './RouteJourney';

/** Route action overlay only: no phone heading or camera/ground alignment. */
export function LiveCameraGuide({route,progress,position,active,notice,destination,overlayRoot,onOpenChange}:{route:WalkingRoute;progress:Progress;position:Fix|null;active:boolean;notice:string;destination:Place;overlayRoot?:HTMLElement|null;onOpenChange?:(open:boolean)=>void}){
 return <div className="live-camera-guide"><CameraPreview live overlayRoot={overlayRoot} onOpenChange={onOpenChange} onMap={()=>{}} overlay={<div className="live-camera-overlay">
 <JourneyInstruction route={route} progress={progress} active={active} notice={notice} destination={destination} fix={position} surface="camera"/>

 </div>}/></div>;
}
