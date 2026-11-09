import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareFacing,routeBearingAt,type HeadingSample} from '../shared/facing';
import {initialProgress,type Progress} from '../shared/tracking';
import {distanceBetween,type WalkingRoute} from '../shared/navigation';
const start={lat:37,lng:127},corner={lat:37.001,lng:127},end={lat:37.001,lng:127.001};
const route:WalkingRoute={segments:[[start,corner,end]],steps:[],distanceMeters:999,durationSeconds:0};
const now=100000;
const progress:Progress={...initialProgress(),position:start,timestamp:now};
const heading=(degrees:number,accuracyDegrees=5):HeadingSample=>({degrees,accuracyDegrees,timestamp:now,reference:'true-north'});

for(const [degrees,state] of [[0,'forward'],[90,'left'],[180,'opposite'],[270,'right'],[359,'forward'],[360,'forward']] as const)test(`북쪽 경로와 모의 휴대폰 ${degrees}도 비교는 ${state}`,()=>{
 assert.equal(compareFacing(route,progress,heading(degrees),now).state,state);
});
test('실제 좌표에서 동서남북 방위를 계산한다',()=>{
 for(const [point,expected] of [[{lat:37.001,lng:127},0],[{lat:37,lng:127.001},90],[{lat:36.999,lng:127},180],[{lat:37,lng:126.999},270]] as const){
  const bearing=routeBearingAt({...route,segments:[[start,point]]},0)!;
  assert.ok(Math.abs(bearing-expected)<.01,`${bearing} vs ${expected}`);
 }
});
test('경로 꺾임에서 나가는 방향으로 바꾸고 총거리 메타데이터를 쓰지 않는다',()=>{
 const along=distanceBetween(start,corner);
 assert.equal(routeBearingAt(route,along-1),0);
 assert.ok(Math.abs(routeBearingAt(route,along)!-90)<.01);
 assert.equal(compareFacing(route,{...progress,along,position:corner},heading(0),now).state,'right');
 assert.equal(routeBearingAt(route,along+distanceBetween(corner,end)),null);
});
test('0/360도 경계를 지나도 좌우와 반대 방향을 올바르게 비교한다',()=>{
 assert.equal(compareFacing(route,progress,heading(350),now).state,'forward');
 assert.equal(compareFacing(route,progress,heading(320),now).state,'right');
 assert.equal(compareFacing(route,progress,heading(40),now).state,'left');
 for(const h of [179,181])assert.equal(compareFacing(route,progress,heading(h),now).state,'opposite');
});
test('분리된 선분 사이에 가상의 방향을 만들지 않고 중복 좌표를 건너뛴다',()=>{
 const broken={...route,segments:[[start,start,corner],[{lat:38,lng:128},{lat:38.001,lng:128}]]};
 assert.equal(routeBearingAt(broken,0),0);assert.equal(routeBearingAt(broken,distanceBetween(start,corner)),0);
});
for(const degrees of [25,335,155,205])test(`${degrees}도 분류 경계에 오차가 걸치면 확인 불가`,()=>{
 assert.deepEqual(compareFacing(route,progress,heading(degrees),now),{state:'unknown',reason:'boundary-uncertainty'});
 assert.notEqual(compareFacing(route,progress,heading(degrees,0),now).state,'unknown');
});
for(const [name,sample,reason] of [
 ['누락',null,'heading-unavailable'],['상대 방향',{...heading(0),reference:'relative'},'unsupported-reference'],['자북',{...heading(0),reference:'magnetic'},'unsupported-reference'],['NaN',heading(NaN),'invalid-heading'],['음수',heading(-1),'invalid-heading'],['각도 초과',heading(361),'invalid-heading'],['음수 시각',{...heading(0),timestamp:-1},'invalid-heading'],['미래',{...heading(0),timestamp:now+1},'invalid-heading'],['과거',{...heading(0),timestamp:now-3001},'stale-heading'],['큰 오차',heading(0,21),'unreliable-heading'],['음수 오차',heading(0,-1),'unreliable-heading'],['오차 누락',heading(0,NaN),'unreliable-heading']
] as const)test(`${name} 모의 방위는 방향을 단정하지 않는다`,()=>{
 assert.deepEqual(compareFacing(route,progress,sample,now),{state:'unknown',reason});
});
for(const [name,change,reason] of [
 ['도착',{arrived:true},'arrived'],['이탈',{offRoute:true},'off-route'],['위치 없음',{position:null},'position-unavailable'],['거부된 GPS',{rejected:true},'position-unavailable'],['오래된 위치',{timestamp:now-10001},'position-unavailable'],['음수 위치 시각',{timestamp:-1},'position-unavailable'],['미래 위치',{timestamp:now+1},'position-unavailable'],['진행값 오류',{along:NaN},'route-unavailable']
] as const)test(`${name} 상태는 반대 방향으로 오인하지 않는다`,()=>{
 assert.deepEqual(compareFacing(route,{...progress,...change},heading(180),now),{state:'unknown',reason});
});
test('빈 경로·잘못된 좌표·너무 짧은 선분·경로 끝은 확인 불가',()=>{
 for(const segments of [[],[[start]],[[start,start]],[[start,{lat:37.000001,lng:127}]],[[start,{lat:NaN,lng:127}]]])assert.equal(routeBearingAt({...route,segments},0),null);
 for(const along of [-1,Infinity,999])assert.equal(routeBearingAt(route,along),null);
});
test('유효한 모의값은 정방향→오른쪽→반대→왼쪽→불확실→정방향으로 재현된다',()=>{
 const states=[0,270,180,90,25,0].map(h=>compareFacing(route,progress,heading(h),now).state);
 assert.deepEqual(states,['forward','right','opposite','left','unknown','forward']);
});

test('허용 시각·정확도 경계와 잘못된 시각을 구분한다',()=>{
 assert.equal(compareFacing(route,progress,{...heading(0,20),timestamp:now-3000},now).state,'forward');
 assert.deepEqual(compareFacing(route,progress,{...heading(0),timestamp:NaN},now),{state:'unknown',reason:'invalid-heading'});
 assert.deepEqual(compareFacing(route,progress,heading(0),NaN),{state:'unknown',reason:'position-unavailable'});
 assert.equal(compareFacing(route,{...progress,timestamp:now-10000},heading(0),now).state,'forward');
});
test('진북 기준 동쪽 경로에서도 네 상태의 좌우 부호를 유지한다',()=>{
 const east={...route,segments:[[{lat:0,lng:0},{lat:0,lng:.001}]]};
 const p={...progress,position:{lat:0,lng:0}};
 for(const [degrees,state] of [[90,'forward'],[0,'right'],[180,'left'],[270,'opposite']] as const)assert.equal(compareFacing(east,p,heading(degrees),now).state,state);
});
