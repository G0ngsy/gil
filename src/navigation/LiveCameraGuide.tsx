/**
 * 실제 카메라 위 안내: GPS 경로의 다음 행동을 보여줍니다. 휴대폰 시선 방향이나 지면에 정렬된 AR은 아닙니다.
 */
import {CameraPreview} from '../CameraPreview';
import type {WalkingRoute,Place} from '../../shared/navigation';
import type {Progress,Fix} from '../../shared/tracking';
import {JourneyInstruction} from './RouteJourney';

/** Route action overlay only: no phone heading or camera/ground alignment. */
export function LiveCameraGuide({route,progress,position,active,notice,destination,overlayRoot,onOpenChange,closeSignal,launcherRoot}:{launcherRoot?:HTMLElement|null;route:WalkingRoute;progress:Progress;position:Fix|null;active:boolean;notice:string;destination:Place;closeSignal?:number;overlayRoot?:HTMLElement|null;onOpenChange?:(open:boolean)=>void}){
 return <div className="live-camera-guide"><CameraPreview launcherRoot={launcherRoot} closeSignal={closeSignal} live overlayRoot={overlayRoot} onOpenChange={onOpenChange} onMap={()=>{}} overlay={<div className="live-camera-overlay">
 <JourneyInstruction route={route} progress={progress} active={active} notice={notice} destination={destination} fix={position} surface="camera"/>

 </div>}/></div>;
}
