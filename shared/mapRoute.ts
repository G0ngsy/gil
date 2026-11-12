import {distanceBetween,type Coordinate,type WalkingRoute} from './navigation';
/** Split each original segment independently; never bridge disconnected paths. */
export function splitRoute(route:WalkingRoute,along:number){
 const completed:Coordinate[][]=[],remaining:Coordinate[][]=[];
 let offset=0;
 const target=Number.isFinite(along)?Math.max(0,along):0;
 for(const segment of route.segments){
  const before:Coordinate[]=[],after:Coordinate[]=[];
  for(let i=1;i<segment.length;i++){
   const a=segment[i-1],b=segment[i],length=distanceBetween(a,b);
   if(length===0)continue;
   if(target>=offset+length){if(!before.length)before.push(a);before.push(b);}
   else if(target<=offset){if(!after.length)after.push(a);after.push(b);}
   else{const ratio=(target-offset)/length;const cut={lat:a.lat+(b.lat-a.lat)*ratio,lng:a.lng+(b.lng-a.lng)*ratio};if(!before.length)before.push(a);before.push(cut);after.push(cut,b);}
   offset+=length;
  }
  if(before.length>1)completed.push(before);
  if(after.length>1)remaining.push(after);
 }
 return {completed,remaining};
}
