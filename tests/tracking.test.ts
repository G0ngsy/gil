import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialProgress,updateProgress} from '../shared/tracking';
import type {WalkingRoute} from '../shared/navigation';
const route:WalkingRoute={distanceMeters:300,durationSeconds:240,segments:[[{lat:37,lng:127},{lat:37.001,lng:127},{lat:37.001,lng:127.002}]],steps:[{lat:37,lng:127,description:'start',turnType:0},{lat:37.001,lng:127,description:'turn',turnType:0},{lat:37.001,lng:127.001,description:'end',turnType:0}]};
const fix=(lat:number,lng:number,timestamp:number,accuracy=5)=>({lat,lng,timestamp:timestamp*20000,accuracy});
test('이동 거리·단계·이탈·복귀·도착을 연속 좌표로 판정한다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37,127,1));assert.equal(p.remaining,300);
 p=updateProgress(route,p,fix(37.0005,127,2));assert.ok(p.remaining<300&&p.remaining>150);assert.equal(p.stepIndex,0);
 p=updateProgress(route,p,fix(37.001,127,3));assert.equal(p.stepIndex,1);
 const remaining=p.remaining;p=updateProgress(route,p,fix(37.002,127.001,4));assert.equal(p.offRoute,true);assert.equal(p.remaining,remaining);assert.equal(p.arrived,false);
 p=updateProgress(route,p,fix(37.001,127.001,5));assert.equal(p.offRoute,false);assert.equal(p.stepIndex,2);
 p=updateProgress(route,p,fix(37.001,127.002,6));assert.equal(p.arrived,false);p=updateProgress(route,p,fix(37.001,127.002,7));assert.equal(p.arrived,true);assert.equal(p.remaining,0);
});
test('정확도 부족·오래된 좌표·잘못된 좌표는 상태를 진행시키지 않는다',()=>{
 const p=updateProgress(route,initialProgress(),fix(37,127,10));
 for(const f of [fix(37.001,127.002,11,100),fix(37.001,127.002,9),fix(NaN,127,11),fix(91,127,11),fix(37,127,11,-1)]){
 const next=updateProgress(route,p,f);assert.equal(next.rejected,true);assert.equal(next.remaining,300);assert.equal(next.timestamp,200000);assert.equal(next.arrived,false);
 }
});
test('목적지 근처라도 경로 진행이 남으면 도착하지 않는다',()=>{
 const loop={...route,segments:[[{lat:37,lng:127},{lat:37.005,lng:127},{lat:37,lng:127.00005}]]};
 assert.equal(updateProgress(loop,initialProgress(),fix(37,127,1)).arrived,false);
});
test('뒤로 걷는 경우 남은 거리와 안내도 현재 위치에 맞춘다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37.001,127.001,1));
 const remaining=p.remaining;p=updateProgress(route,p,fix(37.001,127,2));p=updateProgress(route,p,fix(37.0002,127,3));assert.ok(p.remaining>remaining);assert.equal(p.stepIndex,0);
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

test('순간적인 경로상 GPS 점프는 거리·단계·도착을 바꾸지 않는다',()=>{
 const start=updateProgress(route,initialProgress(),fix(37,127,1));
 const jump=updateProgress(route,start,{lat:37.001,lng:127.002,accuracy:5,timestamp:start.timestamp+1000});
 assert.equal(jump.rejected,true);assert.equal(jump.along,start.along);assert.equal(jump.stepIndex,0);assert.equal(jump.arrived,false);
 const recovered=updateProgress(route,jump,{lat:37.00005,lng:127,accuracy:5,timestamp:start.timestamp+2000});
 assert.equal(recovered.rejected,false);assert.ok(recovered.along>0);
});
test('한 번의 도착 좌표·불확실한 오차로 도착하지 않고 연속 확인 후 도착한다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37.001,127.0015,1));
 p=updateProgress(route,p,fix(37.001,127.002,2,20));assert.equal(p.arrived,false);
 p=updateProgress(route,p,fix(37.001,127.002,3));assert.equal(p.arrived,false);
 p=updateProgress(route,p,fix(37.001,127.002,4,100));assert.equal(p.arrivalSamples,0);
 p=updateProgress(route,p,fix(37.001,127.002,5));assert.equal(p.arrived,false);
 p=updateProgress(route,p,fix(37.001,127.002,6));assert.equal(p.arrived,true);
 const frozen=updateProgress(route,p,fix(37,127,7));assert.equal(frozen.remaining,0);assert.equal(frozen.stepIndex,p.stepIndex);assert.deepEqual(frozen.position,p.position);
});
test('인접한 평행 복귀 구간이 조금 더 가까워도 뒤쪽 단계로 건너뛰지 않는다',()=>{
 const parallel={...route,segments:[[{lat:37,lng:127},{lat:37.003,lng:127},{lat:37.003,lng:127.00005},{lat:37,lng:127.00005}]],steps:[{lat:37,lng:127,description:'출발',turnType:0},{lat:37.003,lng:127,description:'돌기',turnType:0},{lat:37.001,lng:127.00005,description:'돌아오는 길',turnType:0}]};
 let p=updateProgress(parallel,initialProgress(),fix(37.001,127,1));
 const before=p.along;p=updateProgress(parallel,p,fix(37.00105,127.00004,2));assert.equal(p.rejected,false);assert.ok(Math.abs(p.along-before)<10);assert.equal(p.stepIndex,0);assert.equal(p.arrived,false);
});
test('교차점의 후반 구간으로 점프하지 않고 교차 이후 원래 길을 이어간다',()=>{
 const cross={...route,segments:[[{lat:37,lng:127},{lat:37.002,lng:127.002},{lat:37.002,lng:127},{lat:37,lng:127.002}]],steps:[]};
 let p=updateProgress(cross,initialProgress(),fix(37.0009,127.0009,1));
 p=updateProgress(cross,p,fix(37.001,127.00101,2));assert.ok(p.along<200);assert.equal(p.rejected,false);
 p=updateProgress(cross,p,fix(37.0011,127.0011,3));assert.ok(p.along<200);assert.equal(p.rejected,false);
});
test('오랜 수신 공백과 이탈 복귀도 먼 경로 단계로 건너뛰지 않는다',()=>{
 const p=updateProgress(route,initialProgress(),fix(37,127,1));
 assert.equal(updateProgress(route,p,fix(37.001,127.002,100)).rejected,true);
 const off=updateProgress(route,p,fix(37.002,127,2));assert.equal(off.offRoute,true);
 const returned=updateProgress(route,off,fix(37.001,127.002,3));assert.equal(returned.rejected,true);assert.equal(returned.offRoute,true);
});

test('완전히 겹친 왕복 구간에서는 관측만으로 후반 단계나 도착을 추측하지 않는다',()=>{
 const overlap={...route,segments:[[{lat:37,lng:127},{lat:37.003,lng:127},{lat:37,lng:127}]],steps:[{lat:37,lng:127,description:'출발',turnType:0},{lat:37.003,lng:127,description:'반환',turnType:0},{lat:37,lng:127,description:'도착',turnType:0}]};
 let p=updateProgress(overlap,initialProgress(),fix(37.0005,127,1));
 p=updateProgress(overlap,p,fix(37.0006,127,2));assert.equal(p.stepIndex,0);assert.equal(p.arrived,false);assert.ok(p.along<100);
});
test('목적지 근처에서 다시 멀어지면 도착 확인 횟수를 초기화한다',()=>{
 let p=updateProgress(route,initialProgress(),fix(37.001,127.002,1));assert.equal(p.arrivalSamples,1);
 p=updateProgress(route,p,fix(37.001,127.0015,2));assert.equal(p.arrivalSamples,0);
 p=updateProgress(route,p,fix(37.001,127.002,3));assert.equal(p.arrived,false);
});
