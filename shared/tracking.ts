import { distanceBetween, isCoordinate, type Coordinate, type WalkingRoute } from './navigation';

export interface Fix extends Coordinate { accuracy:number; timestamp:number }
export interface Progress { timestamp:number; along:number; remaining:number; stepIndex:number; offRoute:boolean; arrived:boolean; rejected:boolean; position:Coordinate|null }
export const initialProgress=():Progress=>({timestamp:0,along:0,remaining:0,stepIndex:0,offRoute:false,arrived:false,rejected:false,position:null});

// Project onto each individual line: disconnected lines are never joined.
function project(route:WalkingRoute,fix:Coordinate) {
 let offset=0,best={distance:Infinity,along:0};
 for(const line of route.segments)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],length=distanceBetween(a,b);
  const scale=Math.cos(fix.lat*Math.PI/180);
  const x=(b.lng-a.lng)*scale,y=b.lat-a.lat;
  const t=Math.max(0,Math.min(1,((fix.lng-a.lng)*scale*x+(fix.lat-a.lat)*y)/(x*x+y*y||1)));
  const distance=distanceBetween(fix,{lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t});
  if(distance<best.distance)best={distance,along:offset+t*length};
  offset+=length;
 }
 return {...best,total:offset};
}
export function updateProgress(route:WalkingRoute,previous:Progress,fix:Fix):Progress {
 if(!isCoordinate(fix)||!Number.isFinite(fix.accuracy)||fix.accuracy<0||fix.accuracy>30||!Number.isFinite(fix.timestamp)||fix.timestamp<=previous.timestamp)return {...previous,rejected:true};
 const p=project(route,fix);
 if(!Number.isFinite(p.distance)||p.total===0)return {...previous,rejected:true};
 const end=route.segments.at(-1)!.at(-1)!;
 // Hysteresis prevents noisy fixes at the corridor edge from toggling the warning.
 const offRoute=p.distance>(previous.offRoute?20:35);
 const along=offRoute?previous.along:p.along;
 const arrived=previous.arrived||(!offRoute&&p.total-along<=15&&distanceBetween(fix,end)<=15);
 let stepIndex=0;
 for(let i=0;i<route.steps.length;i++)if(project(route,route.steps[i]).along<=along+5)stepIndex=i;
 return {timestamp:fix.timestamp,along,remaining:arrived?0:Math.max(0,route.distanceMeters*(1-along/p.total)),stepIndex:offRoute?previous.stepIndex:stepIndex,offRoute:arrived?false:offRoute,arrived,rejected:false,position:fix};
}
