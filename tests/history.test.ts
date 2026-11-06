import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addDestination,addSearch,parseHistory,historyKey} from '../src/history';
test('검색 기록 정규화·중복 제거·최신순·10개 제한',()=>{
 let h=parseHistory(null);for(let i=0;i<12;i++)h=addSearch(h,`도서관 ${i}`);
 assert.equal(h.searches.length,10);h=addSearch(h,'  도서관   5  ');assert.equal(h.searches[0],'도서관 5');assert.equal(h.searches.length,10);
 assert.equal(addSearch(h,' ').searches.length,10);
});
test('목적지 저장은 좌표·추가 속성을 제외하고 ID 중복을 제거한다',()=>{
 let h=parseHistory(null);for(let i=0;i<12;i++)h=addDestination(h,{id:String(i),name:'도서관',address:'주소'});
 h=addDestination(h,{id:'4',name:'변경 이름',address:'변경 주소',lat:37} as never);
 assert.equal(h.destinations.length,10);assert.deepEqual(h.destinations[0],{id:'4',name:'변경 이름',address:'변경 주소'});
});
test('손상된 저장값·다른 버전·비정상 항목을 안전하게 무시한다',()=>{
 assert.deepEqual(parseHistory('{bad'),parseHistory(null));assert.deepEqual(parseHistory('{"version":2}'),parseHistory(null));
 const parsed=parseHistory(JSON.stringify({version:1,searches:[null,'',4,'도서관'],destinations:[null,{id:'1',name:'책방',address:'길',lat:37,lng:127},{name:'잘못된 장소'}]}));
 assert.deepEqual(parsed.searches,['도서관']);assert.deepEqual(parsed.destinations,[{id:'1',name:'책방',address:'길'}]);
 assert.notEqual(historyKey('demo'),historyKey('live'));
});
