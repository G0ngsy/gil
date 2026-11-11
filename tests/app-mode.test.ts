import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveAppMode} from '../shared/appMode';
test('기본·과거 모드 주소는 실제 검색만 연다',()=>{
 for(const query of ['', '?screen=camera','?mode=demo','?mode=simulation','?mode=live','?preview=0&mode=simulation'])assert.equal(resolveAppMode(query),'live');
});
test('명시적 검토 모드만 예시와 시뮬레이션을 연다',()=>{
 assert.equal(resolveAppMode('?preview=1'),'demo');assert.equal(resolveAppMode('?preview=1&mode=simulation'),'simulation');assert.equal(resolveAppMode('?preview=1&mode=live'),'live');
});
