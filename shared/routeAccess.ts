import {distanceBetween,type Coordinate,type WalkingRoute} from './navigation';
/** Provider geometry only: never draw or count an invented connection to a POI. */
export function routeAccess(route:WalkingRoute,start:Coordinate,destination:Coordinate){
 const points=route.segments.flat();const first=points[0],last=points.at(-1);
 return first&&last?{start:first,end:last,startGap:distanceBetween(start,first),endGap:distanceBetween(last,destination)}:null;
}
