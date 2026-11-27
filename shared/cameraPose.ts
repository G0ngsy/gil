/** W3C Z-X'-Y'' 회전으로 후면 카메라(-Z)의 수평 방위를 구합니다. 진북 보정/정확도 판정은 하지 않습니다. */
export interface CameraPose{heading:number|null;flatHeading:number;elevation:number;horiz:number}
const radians=(x:number)=>x*Math.PI/180;
export const normalize=(x:number)=>((x%360)+360)%360;
export function cameraPose(alpha:unknown,beta:unknown,gamma:unknown):CameraPose|null{
 if(![alpha,beta,gamma].every(x=>typeof x==='number'&&Number.isFinite(x)))return null;
 const [a,b,c]=[alpha,beta,gamma] as number[];
 if(a<0||a>360||b< -180||b>180||c< -90||c>90)return null;
 const z=radians(a),x=radians(b),y=radians(c);
 const vx=-Math.cos(z)*Math.sin(y)-Math.sin(z)*Math.sin(x)*Math.cos(y),vy=-Math.sin(z)*Math.sin(y)+Math.cos(z)*Math.sin(x)*Math.cos(y),vz=-Math.cos(x)*Math.cos(y),horiz=Math.hypot(vx,vy);
 return {heading:horiz<0.3?null:normalize(Math.atan2(vx,vy)*180/Math.PI),flatHeading:normalize(360-a),elevation:Math.asin(Math.max(-1,Math.min(1,vz)))*180/Math.PI,horiz};
}
/** 누적 최단각 보간으로359↔0 경계와180도 원형 평균 상쇄를 피합니다. */
export function smoothHeading(previous:number|null,next:number,dt:number){if(previous===null||dt>1||dt<0)return next;const delta=normalize(next-previous+180)-180;return previous+delta*(1-Math.exp(-dt/0.2));}
