import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNavigationHandler, parsePlaces, parseWalkingRoute, parseLocationAddress } from '../server/navigation';
import { distanceBetween, formatDistance, formatDuration, isCoordinate } from '../shared/navigation';

const start={lat:37.5665,lng:126.978},end={lat:37.5651,lng:126.9776};
const providerPlaces={searchPoiInfo:{totalCount:'1',pois:{poi:[{id:'library-1',name:'서울도서관',noorLat:'37.5651',noorLon:'126.9776',upperAddrName:'서울특별시',middleAddrName:'중구',lowerAddrName:'세종대로',detailAddrName:'110',lowerBizName:'도서관'}]}}};
const providerRoute={type:'FeatureCollection',features:[
 {geometry:{type:'Point',coordinates:[start.lng,start.lat]},properties:{totalDistance:340,totalTime:301,description:'횡단보도를 따라 이동',turnType:211}},
 {geometry:{type:'LineString',coordinates:[[start.lng,start.lat],[126.9778,37.5659],[end.lng,end.lat]]},properties:{}},
 {geometry:{type:'Point',coordinates:[end.lng,end.lat]},properties:{description:'목적지 근처',turnType:201}},
]};
const request=(action:string,body?:unknown)=>new Request(`https://gil.test/api/navigation?action=${action}`,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});

test('키가 없으면 설정 상태만 전달하며 외부 요청이나 비밀 노출이 없다',async()=>{
 const handler=createNavigationHandler({appKey:'',fetcher:async()=>{throw Error('외부 호출 금지');}});
 const config=await handler(request('config'));assert.deepEqual(await config.json(),{searchConfigured:false});
 const search=await handler(new Request('https://gil.test/api/navigation?action=search&q=도서관'));
 assert.equal(search.status,503);assert.equal((await search.json()).error.code,'NOT_CONFIGURED');
 assert.equal(search.headers.get('cache-control'),'no-store');
});
test('검색은 WGS84·관련도순을 요청하고 서버 인증키를 헤더로만 보낸다',async()=>{
 let called=false;
 const handler=createNavigationHandler({appKey:'private-test-secret',fetcher:async(input,options)=>{
  called=true;const url=new URL(String(input));assert.equal(url.hostname,'apis.openapi.sk.com');assert.equal(url.searchParams.get('resCoordType'),'WGS84GEO');assert.equal(url.searchParams.get('searchKeyword'),'서울도서관');assert.equal(url.searchParams.get('searchtypCd'),'A');assert.equal(url.searchParams.get('appKey'),null);assert.equal(new Headers(options?.headers).get('appKey'),'private-test-secret');return Response.json(providerPlaces);
 }});
 const response=await handler(new Request('https://gil.test/api/navigation?action=search&q=서울도서관'));
 const body=await response.text();assert.equal(response.status,200);assert.ok(called);assert.ok(!body.includes('private-test-secret'));assert.equal(JSON.parse(body).places[0].lng,126.9776);
});
test('비어 있는 좌표를 0도로 취급하지 않고 중복·이상 장소를 제외한다',()=>{
 const poi=providerPlaces.searchPoiInfo.pois.poi[0];
 const result=parsePlaces({searchPoiInfo:{pois:{poi:[poi,poi,{...poi,id:'invalid',noorLat:'',noorLon:''},{...poi,id:'bad',noorLat:'150'}]}}});
 assert.equal(result.length,1);assert.equal(result[0].name,'서울도서관');
});
test('명시된 검색 결과 없음과 잘못된 응답을 구분한다',()=>{
 assert.deepEqual(parsePlaces({searchPoiInfo:{totalCount:'0'}}),[]);
 assert.throws(()=>parsePlaces({unexpected:true}),/읽지 못/);
});
test('보행 경로의 좌표 순서를 위도·경도로 변환하고 거리·초를 보존한다',()=>{
 const route=parseWalkingRoute(providerRoute);
 assert.deepEqual(route.segments[0][0],start);assert.equal(route.distanceMeters,340);assert.equal(route.durationSeconds,301);assert.equal(route.steps[0].turnType,211);
});
test('단절된 라인은 별도 선분으로 유지한다',()=>{
 const route=parseWalkingRoute({...providerRoute,features:[...providerRoute.features,{geometry:{type:'LineString',coordinates:[[126.9775,37.565],[126.9774,37.5649]]},properties:{}}]});
 assert.equal(route.segments.length,2);
});
test('경로 총계가 없거나 좌표가 훼손되면 직선 대체 경로를 만들지 않는다',()=>{
 assert.throws(()=>parseWalkingRoute({type:'FeatureCollection',features:[providerRoute.features[1]]}));
 assert.throws(()=>parseWalkingRoute({...providerRoute,features:[providerRoute.features[0],{geometry:{type:'LineString',coordinates:[[126.97,37.56],['',37.55]]},properties:{}}]}));
});
test('POST 경로는 경도를 X로 전달하며 보행자 전용 엔드포인트를 사용한다',async()=>{
 const handler=createNavigationHandler({appKey:'key',fetcher:async(input,options)=>{
  assert.equal(String(input),'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1');assert.equal(options?.method,'POST');const body=JSON.parse(String(options?.body));assert.equal(body.startX,start.lng);assert.equal(body.startY,start.lat);assert.equal(body.endX,end.lng);return Response.json(providerRoute);
 }});
 const response=await handler(request('route',{start,end}));assert.equal(response.status,200);assert.equal((await response.json()).route.durationSeconds,301);
});
for(const [label,body] of [['위도 초과',{start:{lat:200,lng:126},end}],['좌표 문자열',{start:{lat:'37',lng:126},end}],['동일 지점',{start,end:start}]] as const){
 test(`${label} 요청은 제공사 호출 전에 거절한다`,async()=>{
  const handler=createNavigationHandler({appKey:'key',fetcher:async()=>{assert.fail('외부 호출 금지');}});
  assert.equal((await handler(request('route',body))).status,400);
 });
}
test('잘못된 메서드·쿼리·JSON·본문 크기를 검사한다',async()=>{
 const handler=createNavigationHandler({appKey:'key',fetcher:async()=>{assert.fail('외부 호출 금지');}});
 assert.equal((await handler(request('route'))).status,405);
 assert.equal((await handler(request('search'))).status,400);
 assert.equal((await handler(new Request('https://gil.test/api/navigation?action=route',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'}))).status,400);
 assert.equal((await handler(request('route',{padding:'x'.repeat(5000)}))).status,413);
});
for(const [providerStatus,expectedCode,expectedStatus] of [[403,'PROVIDER_AUTH',502],[429,'RATE_LIMIT',429],[500,'PROVIDER_ERROR',502]] as const){
 test(`제공사 ${providerStatus} 오류를 사용자 문구로 변환하고 원문을 숨긴다`,async()=>{
  const handler=createNavigationHandler({appKey:'secret',fetcher:async()=>new Response('secret provider details',{status:providerStatus})});
  const response=await handler(new Request('https://gil.test/api/navigation?action=search&q=도서관'));assert.equal(response.status,expectedStatus);const body=await response.text();assert.equal(JSON.parse(body).error.code,expectedCode);assert.ok(!body.includes('secret'));
 });
}
test('제공사 시간 초과와 HTML 응답을 각각 처리한다',async()=>{
 const timeout=createNavigationHandler({appKey:'key',fetcher:async()=>{throw new DOMException('timeout','TimeoutError');}});
 assert.equal((await timeout(new Request('https://gil.test/api/navigation?action=search&q=도서관'))).status,504);
 const html=createNavigationHandler({appKey:'key',fetcher:async()=>new Response('<html>error</html>')});
 assert.equal((await html(new Request('https://gil.test/api/navigation?action=search&q=도서관'))).status,502);
});
test('도보 경로를 찾지 못한 경우 재탐색 가능한 오류를 전달한다',async()=>{
 const handler=createNavigationHandler({appKey:'key',fetcher:async()=>new Response('not found',{status:404})});
 const response=await handler(request('route',{start,end}));assert.equal(response.status,422);assert.equal((await response.json()).error.code,'NO_ROUTE');
});
test('거리 표시와 직선 거리는 도보 소요 시간으로 추정되지 않는다',()=>{
 assert.equal(formatDistance(520),'520m');assert.equal(formatDistance(1200),'1.2km');assert.equal(formatDuration(301),'6분');assert.equal(distanceBetween(start,start),0);assert.ok(distanceBetween(start,end)>100);assert.equal(isCoordinate({lat:NaN,lng:1}),false);
});

test('주소 변환은 WGS84·확장 없음으로 요청하고 필요한 주소만 반환한다',async()=>{
 const handler=createNavigationHandler({appKey:'private-key',fetcher:async(input,options)=>{
  const url=new URL(String(input));assert.equal(url.pathname,'/tmap/geo/reversegeocoding');assert.equal(url.searchParams.get('lat'),String(start.lat));assert.equal(url.searchParams.get('lon'),String(start.lng));assert.equal(url.searchParams.get('coordType'),'WGS84GEO');assert.equal(url.searchParams.get('addressType'),'A10');assert.equal(url.searchParams.get('newAddressExtend'),'N');assert.equal(options?.method,'GET');
  return Response.json({addressInfo:{fullAddress:'서울특별시 중구 세종대로 110,서울 중구 태평로1가',city_do:'서울특별시',gu_gun:'중구',legalDong:'태평로1가',extra:'private-key'}});
 }});
 const response=await handler(request('address',{point:start}));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{location:{address:'서울특별시 중구 세종대로 110',area:'서울특별시 중구 태평로1가'}});
});
test('주변 검색은 반경 10km·거리순을 요청하고 범위 밖 결과를 제외한다',async()=>{
 const template=providerPlaces.searchPoiInfo.pois.poi[0];
 const handler=createNavigationHandler({appKey:'key',fetcher:async(input)=>{
  const url=new URL(String(input));assert.equal(url.searchParams.get('searchtypCd'),'R');assert.equal(url.searchParams.get('radius'),'10');assert.equal(url.searchParams.get('centerLat'),String(start.lat));assert.equal(url.searchParams.get('centerLon'),String(start.lng));
  return Response.json({searchPoiInfo:{pois:{poi:[{...template,id:'far',noorLat:'37.6'},{...template,id:'outside',noorLat:'35.1'},{...template,id:'near',noorLat:String(start.lat),noorLon:String(start.lng)}]}}});
 }});
 const response=await handler(request('search',{q:'도서관',center:start}));assert.equal(response.status,200);assert.deepEqual((await response.json()).places.map((p:{id:string})=>p.id),['near','far']);
});
for(const [action,body] of [['search',{q:'도서관',center:{lat:'37',lng:126}}],['search',{q:'도서관',center:{lat:37}}],['address',{point:{lat:100,lng:126}}],['address',{point:null}]] as const){
 test(`${action}의 잘못된 기준 좌표는 제공사 호출 전에 거부한다 ${JSON.stringify(body)}`,async()=>{
  const handler=createNavigationHandler({appKey:'key',fetcher:async()=>{assert.fail('외부 호출 금지');}});assert.equal((await handler(request(action,body))).status,400);
 });
}
test('주소 결과가 없으면 현재 위치 주소를 만들어내지 않는다',()=>{
 assert.throws(()=>parseLocationAddress({addressInfo:{}}),/주소를 찾지 못/);
 assert.deepEqual(parseLocationAddress({addressInfo:{city_do:'제주특별자치도',gu_gun:'제주시',legalDong:'연동'}}),{address:'제주특별자치도 제주시 연동',area:'제주특별자치도 제주시 연동'});
});
