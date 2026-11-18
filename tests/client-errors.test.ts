import {test} from 'node:test';
import assert from 'node:assert/strict';
import {navigationRequest,ClientError} from '../src/navigation/client';
function context(t:any,fetcher:typeof fetch){t.mock.method(globalThis,'fetch',fetcher);const descriptor=Object.getOwnPropertyDescriptor(globalThis,'location');Object.defineProperty(globalThis,'location',{configurable:true,value:{origin:'https://gilbit.test'}});t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'location',descriptor);else Reflect.deleteProperty(globalThis,'location');});}
test('헤더를 받지 못해도20초 후 시간 초과로 끝난다',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});context(t,((_url:any,init:any)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))) as typeof fetch);
 const pending=navigationRequest('config');const check=assert.rejects(pending,(e:any)=>e instanceof ClientError&&e.code==='REQUEST_TIMEOUT');t.mock.timers.tick(20000);await check;
});
test('응답 본문 대기도 시간 제한에 포함한다',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});context(t,(async(_url:any,init:any)=>({ok:true,json:()=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))})) as typeof fetch);
 const pending=navigationRequest('config');await Promise.resolve();const check=assert.rejects(pending,(e:any)=>e.code==='REQUEST_TIMEOUT');t.mock.timers.tick(20000);await check;
});
test('사용자 취소는 통신 실패나 시간 초과로 바꾸지 않는다',async t=>{
 context(t,((_url:any,init:any)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))) as typeof fetch);const controller=new AbortController();const pending=navigationRequest('config',{signal:controller.signal});const check=assert.rejects(pending,(e:any)=>e.name==='AbortError');controller.abort();await check;
});
test('통신 단절과 잘못된 JSON을 구분한다',async t=>{
 context(t,(async()=>{throw new TypeError('offline');}) as typeof fetch);await assert.rejects(navigationRequest('config'),(e:any)=>e.code==='NETWORK_ERROR');t.mock.method(globalThis,'fetch',async()=>new Response('not-json'));await assert.rejects(navigationRequest('config'),(e:any)=>e.code==='INVALID_RESPONSE');
});
test('빈 오류 응답도 예외 문자열 대신 사용자 오류로 변환한다',async t=>{
 context(t,(async()=>new Response('null',{status:503})) as typeof fetch);await assert.rejects(navigationRequest('config'),(e:any)=>e instanceof ClientError&&e.message==='요청을 처리하지 못했어요.');
});
test('성공 HTTP라도 잘못된 설정·장소·경로·주소를 거부한다',async t=>{
 context(t,(async()=>new Response('{}')) as typeof fetch);for(const action of ['config','search','route','address'])await assert.rejects(navigationRequest(action),(e:any)=>e.code==='INVALID_RESPONSE');
 const payloads=[['search',{places:[{id:'1',name:'장소',address:'주소',category:{bad:true},lat:37,lng:127}]}],['route',{route:{distanceMeters:100,durationSeconds:60,segments:[[{lat:37,lng:127},{lat:37.1,lng:127}]],steps:[{lat:37,lng:127,description:'직진',turnType:11,roadName:{bad:true}}]}}]] as const;for(const [action,data] of payloads){t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify(data)));await assert.rejects(navigationRequest(action),(e:any)=>e.code==='INVALID_RESPONSE');}
});
