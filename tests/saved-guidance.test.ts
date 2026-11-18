import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSavedGuidance} from '../src/navigation/savedGuidance';
const now=1800000000000;
const data=()=>({version:1,savedAt:now,destination:{id:'1',name:'도서관',address:'서울',category:'장소',lat:37.5,lng:127},route:{distanceMeters:100,durationSeconds:90,segments:[[{lat:37.5,lng:127},{lat:37.6,lng:127}]],steps:[{lat:37.5,lng:127,description:'직진',turnType:11}]}});
test('정상 저장 경로를 읽고 외부 필드·GPS·카메라 상태를 제거한다',()=>{const parsed=parseSavedGuidance(JSON.stringify({...data(),progress:{arrived:true},camera:true}),now)!;assert.ok(parsed);assert.equal('progress' in parsed,false);assert.equal('camera' in parsed,false);});
test('깨진 JSON·다른 버전·만료·미래 저장 시각은 복원하지 않는다',()=>{for(const raw of [null,'broken',JSON.stringify({...data(),version:2}),JSON.stringify({...data(),savedAt:now-86400001}),JSON.stringify({...data(),savedAt:now+1})])assert.equal(parseSavedGuidance(raw,now),null);});
test('좌표·경로·단계·거리·용량이 잘못되면 복원하지 않는다',()=>{for(const change of [(d:any)=>d.destination.lat=100,(d:any)=>d.route.segments=[[]],(d:any)=>d.route.steps=[],(d:any)=>d.route.distanceMeters=-1,(d:any)=>d.route.steps[0].turnType='11']){const d=data();change(d);assert.equal(parseSavedGuidance(JSON.stringify(d),now),null);}assert.equal(parseSavedGuidance(' '.repeat(1000001),now),null);});
