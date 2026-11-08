import {distanceBetween,isCoordinate,type Coordinate,type WalkingRoute} from './navigation';

export interface FieldRoute {route:WalkingRoute;points:Coordinate[]}
/** User-entered straight segments are test geometry, never a walking route estimate. */
export function parseFieldRoute(input:string):FieldRoute {
 const rows=input.trim().split(/\r?\n/).filter(row=>row.trim());
 if(rows.length<2||rows.length>20)throw Error('출발·도착을 포함해 2~20개 지점을 입력해 주세요.');
 const points=rows.map((row,index)=>{
  const fields=row.split(',').map(value=>value.trim());
  if(fields.length!==2||fields.some(value=>!/^[-+]?\d+(?:\.\d+)?$/.test(value)))throw Error(`${index+1}번째 줄을 위도, 경도 형식으로 입력해 주세요.`);
  const point={lat:Number(fields[0]),lng:Number(fields[1])};
  if(!isCoordinate(point)||Math.abs(point.lat)>85)throw Error(`${index+1}번째 줄의 좌표 범위를 확인해 주세요. 위도는 -85~85, 경도는 -180~180이에요.`);
  return point;
 });
 let distanceMeters=0;
 for(let i=1;i<points.length;i++){
  const distance=distanceBetween(points[i-1],points[i]);
  if(distance<5||distance>500||Math.abs(points[i].lng-points[i-1].lng)>1)throw Error(`${i}~${i+1}번째 지점은 5~500m 간격으로 입력해 주세요.`);
  distanceMeters+=distance;
 }
 if(distanceMeters<40||distanceMeters>2000)throw Error('전체 테스트 경로 길이는 40m~2km로 설정해 주세요.');
 return {points,route:{distanceMeters,durationSeconds:0,segments:[points],steps:points.map((point,index)=>({...point,turnType:0,description:index===0?'출발 테스트 지점':index===points.length-1?'도착 테스트 지점':`경유 테스트 지점 ${index}`}))}};
}
