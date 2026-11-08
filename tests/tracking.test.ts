import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialProgress,updateProgress} from '../shared/tracking';
import type {WalkingRoute} from '../shared/navigation';
const route:WalkingRoute={distanceMeters:300,durationSeconds:240,segments:[[{lat:37,lng:127},{lat:37.001,lng:127},{lat:37.001,lng:127.002}]],steps:[{lat:37,lng:127,description:'start',turnType:0},{lat:37.001,lng:127,description:'turn',turnType:0},{lat:37.001,lng:127.001,description:'end',turnType:0}]};
const fix=(lat:number,lng:number,timestamp:number,accuracy=5)=>({lat,lng,timestamp,accuracy});
test('이동 거리·단계·이탈·복귀·도착을 연속 좌표로 판정한다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37,127,1));assert.equal(p.remaining,300);
 p=updateProgress(route,p,fix(37.0005,127,2));assert.ok(p.remaining<300&&p.remaining>150);assert.equal(p.stepIndex,0);
 p=updateProgress(route,p,fix(37.001,127,3));assert.equal(p.stepIndex,1);
 const remaining=p.remaining;p=updateProgress(route,p,fix(37.002,127.001,4));assert.equal(p.offRoute,true);assert.equal(p.remaining,remaining);assert.equal(p.arrived,false);
 p=updateProgress(route,p,fix(37.001,127.001,5));assert.equal(p.offRoute,false);assert.equal(p.stepIndex,2);
 p=updateProgress(route,p,fix(37.001,127.002,6));assert.equal(p.arrived,true);assert.equal(p.remaining,0);
});
test('정확도 부족·오래된 좌표·잘못된 좌표는 상태를 진행시키지 않는다',()=>{
 const p=updateProgress(route,initialProgress(),fix(37,127,10));
 for(const f of [fix(37.001,127.002,11,100),fix(37.001,127.002,9),fix(NaN,127,11),fix(91,127,11),fix(37,127,11,-1)]){
 const next=updateProgress(route,p,f);assert.equal(next.rejected,true);assert.equal(next.remaining,300);assert.equal(next.timestamp,10);assert.equal(next.arrived,false);
 }
});
test('목적지 근처라도 경로 진행이 남으면 도착하지 않는다',()=>{
 const loop={...route,segments:[[{lat:37,lng:127},{lat:37.005,lng:127},{lat:37,lng:127.00005}]]};
 assert.equal(updateProgress(loop,initialProgress(),fix(37,127,1)).arrived,false);
});
test('뒤로 걷는 경우 남은 거리와 안내도 현재 위치에 맞춘다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37.001,127.001,1));
 const remaining=p.remaining;p=updateProgress(route,p,fix(37.0002,127,2));assert.ok(p.remaining>remaining);assert.equal(p.stepIndex,0);
});
test('이탈 경계의 흔들림에는 복귀 임계값을 별도로 적용한다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37.0005,127.0005,1));assert.equal(p.offRoute,true);
 p=updateProgress(route,p,fix(37.0005,127.0003,2));assert.equal(p.offRoute,true);
 p=updateProgress(route,p,fix(37.0005,127.0001,3));assert.equal(p.offRoute,false);
});
test('분리된 경로 사이에 가상의 연결선을 만들지 않는다',()=>{
 const broken={...route,segments:[[{lat:37,lng:127},{lat:37.001,lng:127}],[{lat:37.01,lng:127},{lat:37.011,lng:127}]]};
 assert.equal(updateProgress(broken,initialProgress(),fix(37.005,127,1)).offRoute,true);
});
