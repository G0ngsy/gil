import {distanceBetween,formatDistance,type Coordinate,type WalkingRoute} from './navigation';
import type {Progress} from './tracking';
export interface RouteInstruction {title:string;detail:string;symbol:'left'|'right'|'straight'|'back'|'walk'}
const turns:Record<number,{label:string;symbol:RouteInstruction['symbol']}>={11:{label:'직진',symbol:'straight'},12:{label:'왼쪽',symbol:'left'},13:{label:'오른쪽',symbol:'right'},14:{label:'유턴',symbol:'back'},16:{label:'8시 방향 왼쪽',symbol:'left'},17:{label:'10시 방향 왼쪽',symbol:'left'},18:{label:'2시 방향 오른쪽',symbol:'right'},19:{label:'4시 방향 오른쪽',symbol:'right'},125:{label:'육교',symbol:'walk'},126:{label:'지하보도',symbol:'walk'},127:{label:'계단',symbol:'walk'},128:{label:'경사로',symbol:'walk'},129:{label:'계단·경사로',symbol:'walk'},211:{label:'횡단보도',symbol:'walk'},212:{label:'왼쪽 횡단보도',symbol:'left'},213:{label:'오른쪽 횡단보도',symbol:'right'},214:{label:'8시 방향 횡단보도',symbol:'left'},215:{label:'10시 방향 횡단보도',symbol:'left'},216:{label:'2시 방향 횡단보도',symbol:'right'},217:{label:'4시 방향 횡단보도',symbol:'right'},218:{label:'엘리베이터',symbol:'walk'},233:{label:'직진',symbol:'straight'}};
/** Project provider anchors onto existing lines; ambiguity and disconnected chains never invent a distance. */
function anchors(route:WalkingRoute,point:Coordinate){
 let offset=0,chain=0;const result:{along:number;chain:number;distance:number}[]=[];let previous:Coordinate|undefined;
 for(const line of route.segments){if(previous&&line.length&&distanceBetween(previous,line[0])>5)chain++;
 for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],length=distanceBetween(a,b);if(!length)continue;const scale=Math.cos(point.lat*Math.PI/180),x=(b.lng-a.lng)*scale,y=b.lat-a.lat;const t=Math.max(0,Math.min(1,((point.lng-a.lng)*scale*x+(point.lat-a.lat)*y)/(x*x+y*y)));result.push({along:offset+t*length,chain,distance:distanceBetween(point,{lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t})});offset+=length;}
 previous=line.at(-1)??previous;}
 return result;
}
export function routeInstruction(route:WalkingRoute,progress:Progress,now:number):RouteInstruction{
 const current=route.steps[progress.stepIndex];
 const raw=current?.description.trim()||'주변과 경로를 확인해 주세요';
 // Provider prose distances are static, so do not present them as live remaining distance.
 const safe=raw.replace(/\s*\d+(?:\.\d+)?\s*(?:km|m|미터)\s*(?:이동|직진|진행)/g,' 이동').replace(/\s+/g,' ').trim();
 const fallback:RouteInstruction={title:safe.length>44?'경로를 따라 이동하세요':safe,detail:'',symbol:'walk'};
 if(!progress.position||progress.rejected||progress.offRoute||progress.arrived||!Number.isFinite(now)||now<progress.timestamp||now-progress.timestamp>10000)return fallback;
 const positions=anchors(route,progress.position);const origin=positions.reduce<typeof positions[number]|null>((best,p)=>!best||Math.abs(p.along-progress.along)<Math.abs(best.along-progress.along)?p:best,null);if(!origin)return fallback;
 for(let i=progress.stepIndex;i<route.steps.length;i++){
 const step=route.steps[i],choices=anchors(route,step);const nearest=Math.min(...choices.map(p=>p.distance));if(nearest>20)continue;const candidates=choices.filter(p=>p.distance<=nearest+2);const first=candidates[0];if(!first||candidates.some(p=>p.chain!==first.chain||Math.abs(p.along-first.along)>15))return fallback;
 if(first.along<progress.along-5)continue;
 const turn=turns[step.turnType];if(!turn){if(i>progress.stepIndex&&step.turnType!==200)return fallback;continue;}
 if(first.chain!==origin.chain)return fallback;const meters=first.along-progress.along;if(meters>150)return fallback;
 return {title:meters<=5?`지금 ${turn.label}`:`${formatDistance(meters)} 앞 ${turn.label}`,detail:step.roadName?`${step.roadName} 방향`:'',symbol:turn.symbol};
 }
 return fallback;
}
