import { distanceBetween, isCoordinate, type Coordinate, type WalkingRoute } from './navigation';

export interface Fix extends Coordinate { accuracy:number; timestamp:number }
export interface Progress { timestamp:number; along:number; remaining:number; stepIndex:number; offRoute:boolean; arrived:boolean; rejected:boolean; position:Coordinate|null; arrivalSamples:number }
export const initialProgress=():Progress=>({timestamp:0,along:0,remaining:0,stepIndex:0,offRoute:false,arrived:false,rejected:false,position:null,arrivalSamples:0});
interface Projection {distance:number;along:number}

// Each line remains separate. Keep all candidates to resolve crossing/overlapping paths.
function project(route:WalkingRoute,fix:Coordinate) {
 let total=0;const candidates:Projection[]=[];
 for(const line of route.segments)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],length=distanceBetween(a,b);
  if(!length)continue;
  const scale=Math.cos(fix.lat*Math.PI/180);
  const x=(b.lng-a.lng)*scale,y=b.lat-a.lat;
  const t=Math.max(0,Math.min(1,((fix.lng-a.lng)*scale*x+(fix.lat-a.lat)*y)/(x*x+y*y||1)));
  const distance=distanceBetween(fix,{lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t});
  candidates.push({distance,along:total+t*length});total+=length;
 }
 return {candidates,total};
}
export function updateProgress(route:WalkingRoute,previous:Progress,fix:Fix):Progress {
 const reject=()=>({...previous,rejected:true,arrivalSamples:0});
 if(!isCoordinate(fix)||!Number.isFinite(fix.accuracy)||fix.accuracy<0||fix.accuracy>30||!Number.isFinite(fix.timestamp)||fix.timestamp<=previous.timestamp)return reject();
 if(previous.arrived)return {...previous,rejected:false};
 const {candidates,total}=project(route,fix);
 if(!candidates.length||total===0)return reject();
 const nearest=Math.min(...candidates.map(p=>p.distance));
 // Within 8m of the best spatial match, favor continuity over later route branches.
 const nearby=candidates.filter(p=>p.distance<=nearest+8);
 const reference=previous.position?previous.along:0;
 const p=nearby.reduce((best,next)=>Math.abs(next.along-reference)<Math.abs(best.along-reference)?next:best);
 const offRoute=nearest>(previous.offRoute?20:35);
 // 4m/s walking ceiling with a 20m noise allowance; no unlimited jump after a long gap.
 const budget=20+4*Math.min(20,(fix.timestamp-previous.timestamp)/1000);
 if(previous.position&&!offRoute&&!previous.offRoute&&Math.abs(p.along-previous.along)>budget)return reject();
 // Returning from an excursion also cannot skip arbitrarily far along the route.
 if(previous.position&&!offRoute&&previous.offRoute&&Math.abs(p.along-previous.along)>100)return reject();
 const along=offRoute?previous.along:p.along;
 const end=route.segments.flat().at(-1)!;
 const nearEnd=!offRoute&&total-along<=15&&distanceBetween(fix,end)+fix.accuracy<=15;
 const arrivalSamples=nearEnd?previous.arrivalSamples+1:0;
 const arrived=arrivalSamples>=2;
 let stepIndex=0,stepAlong=0;
 for(let i=0;i<route.steps.length;i++){
  const matches=project(route,route.steps[i]).candidates;
  if(!matches.length)continue;
  const minDistance=Math.min(...matches.map(p=>p.distance));
  const ordered=matches.filter(p=>p.distance<=minDistance+1&&p.along>=stepAlong-1);
  if(!ordered.length)continue;
  stepAlong=Math.min(...ordered.map(p=>p.along));
  if(stepAlong<=along+5)stepIndex=i;
 }
 return {timestamp:fix.timestamp,along,remaining:arrived?0:Math.max(0,route.distanceMeters*(1-along/total)),stepIndex:offRoute?previous.stepIndex:stepIndex,offRoute:arrived?false:offRoute,arrived,rejected:false,position:fix,arrivalSamples};
}
