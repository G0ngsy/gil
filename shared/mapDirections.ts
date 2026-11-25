/** 지도 표시 전용: 경로 진행 꺾쇠와 신뢰할 수 있는 GPS 이동 방향을 계산합니다. */
import {distanceBetween,type Coordinate} from './navigation';
import type {Fix} from './tracking';
export function bearing(a:Coordinate,b:Coordinate){const r=Math.PI/180,p=a.lat*r,q=b.lat*r,d=(b.lng-a.lng)*r;return (Math.atan2(Math.sin(d)*Math.cos(q),Math.cos(p)*Math.sin(q)-Math.sin(p)*Math.cos(q)*Math.cos(d))/r+360)%360;}
// 끝점이 실제로 같은 선분만 합칩니다. 떨어진 길 사이에는 새 연결선을 만들지 않습니다.
export function joinTouching(lines:Coordinate[][]){const result:Coordinate[][]=[];for(const line of lines){if(line.length<2)continue;const previous=result.at(-1);if(previous&&distanceBetween(previous.at(-1)!,line[0])<0.05)previous.push(...line.slice(1));else result.push([...line]);}return result;}
// 70m 간격으로만 표시하고 실제 회전 꼭짓점 12m 안쪽은 비워 연속된 선을 강조합니다.
export function routeArrows(lines:Coordinate[][]){
 const arrows:{position:Coordinate;heading:number}[]=[];
 const turns=(a:number,b:number)=>Math.abs(((a-b+540)%360)-180)>25;
 for(const line of lines){let until=28;for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],length=distanceBetween(a,b);if(length<0.1)continue;
  const heading=bearing(a,b),nearStart=i>1&&turns(bearing(line[i-2],a),heading),nearEnd=i+1<line.length&&turns(heading,bearing(b,line[i+1]));
  let at=until;for(;at<length;at+=70){if(arrows.length>=12)return arrows;if(nearStart&&at<12||nearEnd&&length-at<12)continue;const ratio=at/length;arrows.push({position:{lat:a.lat+(b.lat-a.lat)*ratio,lng:a.lng+(b.lng-a.lng)*ratio},heading});}until=at-length;
 }}return arrows;
}
export interface Movement{anchor:Fix|null;heading:number|null}
export function updateMovement(previous:Movement,fix:Fix):Movement{if(!Number.isFinite(fix.timestamp)||fix.accuracy>30)return previous;const a=previous.anchor;if(!a)return {...previous,anchor:fix};if(fix.timestamp<=a.timestamp)return previous;if(fix.timestamp-a.timestamp>15000)return {...previous,anchor:fix};const distance=distanceBetween(a,fix);if(distance<Math.max(8,a.accuracy,fix.accuracy))return previous;return {anchor:fix,heading:bearing(a,fix)};}
