import geomagnetism from 'geomagnetism';
import {isCoordinate,type Coordinate} from './navigation';
import type {HeadingSample} from './facing';
import type {Fix} from './tracking';

export interface CompassReading {alpha?:number|null;beta:number|null;gamma:number|null;absolute?:boolean;webkitCompassHeading?:number;webkitCompassAccuracy?:number}
export type SensorReading={sample:HeadingSample;reason:null}|{sample:null;reason:'position'|'pose'|'relative'|'accuracy'|'model'|'invalid'};
let cached:{key:string;declination:number}|null=null;
/** Local WMM calculation; no coordinates leave the device. Invalid model dates never extrapolate. */
export function magneticDeclination(position:Coordinate,now:number):number|null {
 if(!isCoordinate(position)||Math.abs(position.lat)>=80||!Number.isFinite(now))return null;
 const date=new Date(now);
 if(!Number.isFinite(date.getTime()))return null;
 const key=`${date.toISOString().slice(0,10)}:${position.lat.toFixed(3)}:${position.lng.toFixed(3)}`;
 if(cached?.key===key)return cached.declination;
 try{
  const field=geomagnetism.model(date).point([position.lat,position.lng]);
  if(!Number.isFinite(field.decl)||!Number.isFinite(field.h)||field.h<6000)return null;
  cached={key,declination:field.decl};return field.decl;
 }catch{return null;}
}
export function orientationToHeading(reading:CompassReading,position:Fix|null,screenAngle:number,now:number):SensorReading {
 const fail=(reason:Exclude<SensorReading['reason'],null>):SensorReading=>({sample:null,reason});
 if(!position||!isCoordinate(position)||!Number.isFinite(now)||!Number.isFinite(position.timestamp)||position.timestamp<0||position.timestamp>now||now-position.timestamp>10000||!Number.isFinite(position.accuracy)||position.accuracy<0||position.accuracy>30)return fail('position');
 // First implementation supports portrait, screen-up, near-horizontal compass use only.
 if(screenAngle!==0||reading.beta===null||reading.gamma===null||!Number.isFinite(reading.beta)||!Number.isFinite(reading.gamma)||Math.abs(reading.beta)>30||Math.abs(reading.gamma)>30)return fail('pose');
 if(reading.webkitCompassHeading===undefined)return fail(reading.absolute?'accuracy':'relative');
 const heading=reading.webkitCompassHeading,accuracy=reading.webkitCompassAccuracy;
 if(!Number.isFinite(heading)||heading<0||heading>360)return fail('invalid');
 // A 2-degree TEST margin covers the model/pose approximation; it is not a measured guarantee.
 if(accuracy===undefined||!Number.isFinite(accuracy)||accuracy<0||accuracy+2>20)return fail('accuracy');
 const declination=magneticDeclination(position,now);
 if(declination===null)return fail('model');
 return {sample:{degrees:((heading+declination)%360+360)%360,accuracyDegrees:accuracy+2,timestamp:now,reference:'true-north'},reason:null};
}
