import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFieldRoute} from '../shared/fieldRoute';
import {initialProgress,updateProgress} from '../shared/tracking';
test('현장 좌표 순서·직선 길이를 보존하며 외부 길찾기 안내를 만들지 않는다',()=>{
 const {route,points}=parseFieldRoute('35.1, 129.1\n35.1005, 129.1\n35.101, 129.1');
 assert.equal(points.length,3);assert.deepEqual(route.segments,[points]);assert.ok(route.distanceMeters>110&&route.distanceMeters<112);assert.equal(route.durationSeconds,0);assert.equal(route.steps[1].description,'경유 테스트 지점 1');
 let p=initialProgress();for(const [index,point] of [...points,points[2]].entries())p=updateProgress(route,p,{...point,accuracy:5,timestamp:(index+1)*20000});assert.equal(p.arrived,true);assert.equal(p.remaining,0);
});
for(const [label,value] of [
 ['빈 경로',''],['한 지점','35,129'],['빈 필드','35,\n35.001,129'],['문자','abc,129\n35.001,129'],['경위도 뒤집기','129,35\n129,35.001'],['초과 경도','35,181\n35.001,181'],['극지','89,1\n89.001,1'],['같은 지점','35,129\n35,129'],['너무 가까운 지점','35,129\n35.00001,129'],['너무 긴 구간','35,129\n35.1,129'],['전체 길이 부족','35,129\n35.0002,129'],['필드 초과','35,129,hello\n35.001,129'],['날짜변경선','0,179.999\n0,-179.999'],['지점 초과',Array.from({length:21},(_,i)=>`${35+i*.0005},129`).join('\n')],['전체 길이 초과',Array.from({length:7},(_,i)=>`${35+i*.004},129`).join('\n')]
])test(`${label}은 기존 경로에 적용하기 전에 거절한다`,()=>assert.throws(()=>parseFieldRoute(value)));
