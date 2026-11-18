/**
 * 출입구/장소 차이 계산: 경로의 시작·끝과 요청 좌표 사이의 차이를 구분해 표시할 근거를 만듭니다.
 */
import {distanceBetween,type Coordinate,type WalkingRoute} from './navigation';
/** Provider geometry only: never draw or count an invented connection to a POI. */
export function routeAccess(route:WalkingRoute,start:Coordinate,destination:Coordinate){
 const points=route.segments.flat();const first=points[0],last=points.at(-1);
 return first&&last?{start:first,end:last,startGap:distanceBetween(start,first),endGap:distanceBetween(last,destination)}:null;
}
