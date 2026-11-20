/**
 * 안내 복원 데이터: 기기에 저장된 목적지·경로를 검사합니다. 하루가 지난 기록이나 잘못된 값은 복원하지 않습니다.
 */
import {isCoordinate,type Place,type WalkingRoute} from '../../shared/navigation';
export const guidanceKey='gilbit.guidance.v1.live';
export interface SavedGuidance{version:1;savedAt:number;destination:Place;route:WalkingRoute}
const validPoint=(v:unknown):boolean=>isCoordinate(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
/** Stored browser data is untrusted. Never persist live GPS, camera state or arrival claims. */
export function parseSavedGuidance(raw:string|null,now=Date.now()):SavedGuidance|null{
 if(!raw||raw.length>1000000)return null;
 try{
  const v=JSON.parse(raw),d=v?.destination,r=v?.route;
  if(v?.version!==1||!Number.isFinite(v.savedAt)||v.savedAt>now||now-v.savedAt>86400000)return null;
  if(!validPoint(d)||!text(d.id,200)||!text(d.name,200)||!d.name.trim()||!text(d.address,500)||!text(d.category,200)||d.entrance!==undefined&&!isCoordinate(d.entrance))return null;
  if(!r||!Number.isFinite(r.distanceMeters)||r.distanceMeters<=0||r.distanceMeters>1000000||!Number.isFinite(r.durationSeconds)||r.durationSeconds<=0||r.durationSeconds>1000000)return null;
  if(!Array.isArray(r.segments)||!r.segments.length||r.segments.length>1000||!r.segments.every((line:unknown)=>Array.isArray(line)&&line.length>=2&&line.every(isCoordinate))||r.segments.flat().length>20000)return null;
  // 회전 단계가 없는 경로도 API에서 허용하므로 빈 목록 자체는 복원 실패로 처리하지 않습니다.
  if(!Array.isArray(r.steps)||r.steps.length>5000||!r.steps.every((s:any)=>validPoint(s)&&text(s.description,2000)&&Number.isFinite(s.turnType)&&(s.roadName===undefined||text(s.roadName,500))))return null;
  return {version:1,savedAt:v.savedAt,destination:{id:d.id,name:d.name,address:d.address,category:d.category,lat:d.lat,lng:d.lng,...(d.entrance?{entrance:{lat:d.entrance.lat,lng:d.entrance.lng}}:{})},route:{distanceMeters:r.distanceMeters,durationSeconds:r.durationSeconds,segments:r.segments.map((line:any[])=>line.map(p=>({lat:p.lat,lng:p.lng}))),steps:r.steps.map((s:any)=>({lat:s.lat,lng:s.lng,description:s.description,turnType:s.turnType,...(s.roadName?{roadName:s.roadName}:{})}))}};
 }catch{return null;}
}
export function readSavedGuidance(){try{const raw=localStorage.getItem(guidanceKey),saved=parseSavedGuidance(raw);if(raw&&!saved)localStorage.removeItem(guidanceKey);return saved;}catch{return null;}}
