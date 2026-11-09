import {distanceBetween,isCoordinate,type Coordinate,type WalkingRoute} from './navigation';
import type {Progress} from './tracking';

/** Normalized contract: clockwise degrees from TRUE north, not raw device alpha or GPS course. */
export interface HeadingSample {degrees:number;accuracyDegrees:number;timestamp:number;reference:'true-north'|'magnetic'|'relative'}
export type Facing='forward'|'left'|'right'|'opposite'|'unknown';
export type UnknownReason='arrived'|'off-route'|'position-unavailable'|'route-unavailable'|'heading-unavailable'|'unsupported-reference'|'invalid-heading'|'stale-heading'|'unreliable-heading'|'boundary-uncertainty';
export type FacingResult={state:Exclude<Facing,'unknown'>;deltaDegrees:number;routeBearing:number}|{state:'unknown';reason:UnknownReason};
const wrap=(degrees:number)=>((degrees+180)%360+360)%360-180;

function bearing(a:Coordinate,b:Coordinate):number|null {
 if(distanceBetween(a,b)<1)return null;
 const rad=Math.PI/180,lat1=a.lat*rad,lat2=b.lat*rad,dLng=(b.lng-a.lng)*rad;
 const y=Math.sin(dLng)*Math.cos(lat2);
 const x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLng);
 if(Math.hypot(x,y)<1e-12)return null;
 return (Math.atan2(y,x)/rad+360)%360;
}

/** Uses geometric progress, never provider total distance or a line bridging disconnected segments. */
export function routeBearingAt(route:WalkingRoute,along:number):number|null {
 if(!Number.isFinite(along)||along<0||route.segments.some(line=>line.some(c=>!isCoordinate(c))))return null;
 let offset=0;
 for(const line of route.segments)for(let i=1;i<line.length;i++){
  const length=distanceBetween(line[i-1],line[i]);
  if(length===0)continue;
  // At a corner select the outgoing edge, not the completed incoming edge.
  if(along<offset+length-1e-6)return bearing(line[i-1],line[i]);
  offset+=length;
 }
 return null;
}
function classify(delta:number):Exclude<Facing,'unknown'> {
 if(Math.abs(delta)<=25)return 'forward';
 if(Math.abs(delta)>=155)return 'opposite';
 return delta>0?'right':'left';
}

/** A comparison of PHONE heading and route tangent. It does not infer where a person faces. */
export function compareFacing(route:WalkingRoute,progress:Progress,heading:HeadingSample|null,now:number):FacingResult {
 const unknown=(reason:UnknownReason):FacingResult=>({state:'unknown',reason});
 if(progress.arrived)return unknown('arrived');
 if(progress.offRoute)return unknown('off-route');
 if(!Number.isFinite(now)||now<0||!progress.position||!isCoordinate(progress.position)||progress.rejected||!Number.isFinite(progress.timestamp)||progress.timestamp<0||progress.timestamp>now||now-progress.timestamp>10000)return unknown('position-unavailable');
 const routeBearing=routeBearingAt(route,progress.along);
 if(routeBearing===null)return unknown('route-unavailable');
 if(!heading)return unknown('heading-unavailable');
 if(heading.reference!=='true-north')return unknown('unsupported-reference');
 if(!Number.isFinite(heading.degrees)||heading.degrees<0||heading.degrees>360||!Number.isFinite(heading.timestamp)||heading.timestamp<0||heading.timestamp>now)return unknown('invalid-heading');
 if(now-heading.timestamp>3000)return unknown('stale-heading');
 if(!Number.isFinite(heading.accuracyDegrees)||heading.accuracyDegrees<0||heading.accuracyDegrees>20)return unknown('unreliable-heading');
 const deltaDegrees=wrap(routeBearing-heading.degrees);
 const state=classify(deltaDegrees);
 if(classify(wrap(deltaDegrees-heading.accuracyDegrees))!==state||classify(wrap(deltaDegrees+heading.accuracyDegrees))!==state)return unknown('boundary-uncertainty');
 return {state,deltaDegrees,routeBearing};
}
