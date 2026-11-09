import {test} from 'node:test';
import assert from 'node:assert/strict';
import {magneticDeclination,orientationToHeading,type CompassReading} from '../shared/compass';
const now=Date.parse('2026-11-09T00:00:00Z');
const position={lat:37.5665,lng:126.978,accuracy:5,timestamp:now};
const reading:CompassReading={webkitCompassHeading:10,webkitCompassAccuracy:5,beta:0,gamma:0};
test('WMM 공개 참조점의 진북 보정 부호와 방위를 확인한다',()=>{
 // geomagnetism test/values.csv WMM-2015 sea-level reference: lat 0, lon 120, decl 0.57°.
 assert.ok(Math.abs(magneticDeclination({lat:0,lng:120},Date.parse('2015-01-01T00:00:00Z'))!-.57)<.02);
 const decl=magneticDeclination(position,now)!;assert.ok(decl< -5&&decl> -15);
 const result=orientationToHeading(reading,position,0,now);assert.ok(result.sample);
 assert.ok(Math.abs(result.sample.degrees-((10+decl+360)%360))<1e-9);assert.equal(result.sample.reference,'true-north');assert.equal(result.sample.accuracyDegrees,7);assert.equal(result.sample.timestamp,now);
 const wrapped=orientationToHeading({...reading,webkitCompassHeading:0},position,0,now);assert.ok(wrapped.sample&&wrapped.sample.degrees>340);
});
for(const [name,change,reason] of [
 ['오차 없음',{webkitCompassAccuracy:undefined},'accuracy'],['보정 불량',{webkitCompassAccuracy:-1},'accuracy'],['큰 오차',{webkitCompassAccuracy:19},'accuracy'],['잘못된 방위',{webkitCompassHeading:-1},'invalid'],['누락된 자세',{beta:null},'pose'],['수직 자세',{beta:90},'pose'],['뒤집은 자세',{beta:180},'pose'],['큰 기울기',{gamma:31},'pose'],['상대 방향',{webkitCompassHeading:undefined,alpha:0,absolute:false},'relative'],['오차 없는 표준 절대값',{webkitCompassHeading:undefined,alpha:0,absolute:true},'accuracy']
] as const)test(`${name} 입력을 실제 방향으로 꾸며 쓰지 않는다`,()=>assert.deepEqual(orientationToHeading({...reading,...change},position,0,now),{sample:null,reason}));
test('화면 회전·위치 오류·오래된 위치·미지원 모델은 안내하지 않는다',()=>{
 for(const angle of [90,180,270,NaN])assert.equal(orientationToHeading(reading,position,angle,now).sample,null);
 for(const point of [null,{...position,accuracy:100},{...position,timestamp:now-10001},{...position,timestamp:now+1},{...position,lat:NaN}])assert.equal(orientationToHeading(reading,point,0,now).sample,null);
 assert.equal(magneticDeclination(position,Date.parse('2035-01-01')),null);assert.equal(magneticDeclination({lat:89,lng:0},now),null);
 assert.equal(orientationToHeading(reading,{...position,timestamp:Date.parse('2035-01-01')},0,Date.parse('2035-01-01')).sample,null);
});
