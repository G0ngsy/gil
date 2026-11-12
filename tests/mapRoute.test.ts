import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splitRoute} from '../shared/mapRoute';
import {distanceBetween,type WalkingRoute} from '../shared/navigation';
const a={lat:37,lng:127},b={lat:37.001,lng:127},c={lat:38,lng:128},d={lat:38.001,lng:128};
const route:WalkingRoute={segments:[[a,b],[c,d]],steps:[],distanceMeters:999,durationSeconds:999};
test('진행 선분을 좌표 거리 기준으로 나누고 분리 구간 사이를 잇지 않는다',()=>{
 const result=splitRoute(route,distanceBetween(a,b)/2);
 assert.equal(result.completed.length,1);assert.equal(result.remaining.length,2);
 assert.ok(Math.abs(result.completed[0][1].lat-37.0005)<1e-8);
 assert.deepEqual(result.remaining[1],[c,d]);
 assert.deepEqual(result.remaining[0][0],result.completed[0][1]);
});
test('출발·도착·역진행·중복점과 잘못된 진행값을 안정적으로 표시한다',()=>{
 assert.equal(splitRoute(route,0).completed.length,0);assert.deepEqual(splitRoute(route,Infinity).remaining,route.segments);
 assert.equal(splitRoute(route,99999).remaining.length,0);
 assert.equal(splitRoute(route,-1).completed.length,0);
 assert.equal(splitRoute({...route,segments:[[a,a,b]]},1).completed.length,1);
 assert.ok(splitRoute(route,30).completed[0][1].lat<splitRoute(route,50).completed[0][1].lat);
});
