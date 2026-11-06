import { test, expect, type Page } from '@playwright/test';

const place={id:'test-library',name:'서울도서관',address:'서울특별시 중구 세종대로 110',category:'도서관',lat:37.5651,lng:126.9776};
const route={distanceMeters:340,durationSeconds:301,segments:[[{lat:37.5665,lng:126.978},{lat:37.5659,lng:126.9778},{lat:37.5651,lng:126.9776}]],steps:[{lat:37.5665,lng:126.978,description:'횡단보도를 따라 이동',turnType:211}]};
async function mockSDK(page:Page){
 await page.addInitScript(()=>{
  const noop=()=>{};
  class Map {constructor(id:string){const el=document.getElementById(id)!;el.setAttribute('data-map-ready','true');}setCenter=noop;fitBounds=noop;destroy=noop;}
  class LatLng {constructor(public lat:number,public lng:number){}}
  class LatLngBounds {extend=noop;}
  class Overlay {constructor(options:Record<string,unknown>){(window as unknown as {overlays:unknown[]}).overlays.push(options);}setMap=noop;}
  (window as unknown as {overlays:unknown[]}).overlays=[];
  window.Tmapv2={Map,LatLng,LatLngBounds,Marker:Overlay,Polyline:Overlay};
 });
}
async function setup(page:Page){
 await mockSDK(page);
 await page.route('**/api/navigation?**',async r=>{
  const action=new URL(r.request().url()).searchParams.get('action');
  await r.fulfill({json:action==='config'?{searchConfigured:true}:action==='search'?{places:[place]}:{route}});
 });
}
async function choose(page:Page){
 await page.goto('/?mode=live');
 await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();
 await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('서울도서관');
 await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();
 await page.getByRole('button',{name:/도서관 서울도서관/}).click();
}
test('키 미설정은 가짜 검색 결과 대신 준비 문구와 시안 복귀를 보여준다',async({page})=>{
 await page.goto('/?mode=live');await expect(page.getByText('실제 장소 검색을 준비 중이에요.')).toBeVisible();
 await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeDisabled();
 await page.screenshot({path:'docs/previews/gilbit-live-setup.png'});
 await page.getByRole('button',{name:'디자인 시안으로 돌아가기',exact:true}).first().click();await expect(page.getByRole('textbox',{name:'목적지 검색',exact:true})).toBeVisible();
});
test('위치 권한을 자동 요청하지 않고 검색→위치→도보 경로를 연결한다',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:37.5665,longitude:126.978,accuracy:10});
 await setup(page);
 await page.addInitScript(()=>{const original=navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);let n=0;Object.defineProperty(window,'positionCalls',{get:()=>n});navigator.geolocation.getCurrentPosition=(...args)=>{n++;original(...args);};});
 await choose(page);expect(await page.evaluate(()=>(window as unknown as {positionCalls:number}).positionCalls)).toBe(0);
 const requestPromise=page.waitForRequest(r=>r.url().includes('action=route'));
 await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();
 const request=await requestPromise;expect(request.postDataJSON().start.lng).toBe(126.978);
 await expect(page.getByText('도보 · 340m')).toBeVisible();await expect(page.getByText('6분',{exact:true})).toBeVisible();
 await expect(page.locator('[data-map-ready="true"]')).toBeVisible();
 await page.getByRole('button',{name:'경로 살펴보기',exact:true}).click();await expect(page.getByRole('button',{name:'경로 정보로 돌아가기'})).toBeVisible();
 await expect(page.getByText('30m 앞 오른쪽')).toHaveCount(0);await expect(page.getByRole('button',{name:'카메라 안내',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'경로 확인 마치기'}).click();await page.getByRole('button',{name:'계속 보기'}).click();
 await page.getByRole('button',{name:'경로 확인 마치기'}).click();await page.getByRole('button',{name:'확인 마치기',exact:true}).click();await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
});
test('위치 거부 시 경로 API를 호출하지 않고 재시도 안내한다',async({page})=>{
 await setup(page);let routeCalls=0;page.on('request',r=>{if(r.url().includes('action=route'))routeCalls++;});
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>fail?.({code:1,message:'denied',PERMISSION_DENIED:1,POSITION_UNAVAILABLE:2,TIMEOUT:3});});
 await choose(page);await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByRole('alert')).toContainText('위치 권한이 꺼져');expect(routeCalls).toBe(0);
});
test('위치 오차가 큰 경우 결과를 경로 출발지로 쓰지 않는다',async({page,context})=>{
 await setup(page);await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:37.5665,longitude:126.978,accuracy:400});
 await choose(page);await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await expect(page.getByRole('alert')).toContainText('위치 오차가 커요');await expect(page.getByText('도보 · 340m')).toHaveCount(0);
});
test('검색 실패·빈 결과·늦게 도착하는 과거 응답을 구분한다',async({page})=>{
 await setup(page);
 let first=true;
 await page.route('**/api/navigation?**action=search**',async r=>{if(first){first=false;await r.fulfill({status:429,json:{error:{code:'RATE_LIMIT',message:'검색 요청이 많아요.'}}});}else await r.fulfill({json:{places:[]}});});
 await page.goto('/?mode=live');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await expect(page.getByRole('alert')).toContainText('검색 요청이 많아요');
 await page.getByRole('button',{name:'다시 검색',exact:true}).last().click();await expect(page.getByRole('heading',{name:'일치하는 장소가 없어요'})).toBeVisible();
 await page.route('**/api/navigation?**action=search**',async r=>{await new Promise(resolve=>setTimeout(resolve,300));await r.fulfill({json:{places:[place]}});});
 await page.getByRole('button',{name:'다시 검색',exact:true}).click();await page.getByRole('button',{name:'검색어 지우기'}).click();await page.waitForTimeout(450);await expect(page.getByRole('heading',{name:'서울도서관',exact:true})).toHaveCount(0);
});
test('경로 실패 시 고정된 거리·시간을 보여주지 않는다',async({page,context})=>{
 await setup(page);await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:37.5665,longitude:126.978,accuracy:10});
 await page.route('**/api/navigation?**action=route**',async r=>r.fulfill({status:422,json:{error:{code:'NO_ROUTE',message:'도보 경로를 찾지 못했어요.'}}}));
 await choose(page);await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByRole('alert')).toContainText('도보 경로를 찾지 못');await expect(page.getByText('520m')).toHaveCount(0);await expect(page.getByRole('button',{name:'경로 살펴보기'})).toHaveCount(0);
});
test('지도 로딩 실패는 경로 정보를 보존하며 재시도할 수 있다',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:37.5665,longitude:126.978,accuracy:10});
 await page.route('**/api/navigation?**',async r=>r.fulfill({json:new URL(r.request().url()).searchParams.get('action')==='config'?{searchConfigured:true}:new URL(r.request().url()).searchParams.get('action')==='search'?{places:[place]}:{route}}));
 await page.route('https://apis.openapi.sk.com/tmap/jsv2**',r=>r.abort());
 await choose(page);await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByText('도보 · 340m')).toBeVisible();await expect(page.getByRole('button',{name:'지도 다시 불러오기'})).toBeVisible();
 await page.getByText('전체 도보 안내 보기').click();await expect(page.getByRole('list',{name:'전체 도보 안내'})).toContainText('횡단보도를 따라 이동');
});
test('기존 시안의 문양과 화면 전환은 유지된다',async({page})=>{
 await page.goto('/');await expect(page.locator('.motif-knot')).toHaveCount(1);await page.getByRole('textbox',{name:'목적지 검색',exact:true}).fill('중앙');await page.getByRole('button',{name:'검색',exact:true}).click();await page.getByRole('button',{name:/도서관 · 가장 가까운 곳/}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await page.getByRole('button',{name:'카메라 안내',exact:true}).click();await expect(page.locator('.direction-arrow')).toBeVisible();
 await page.goto('/?screen=recheck');await expect(page.locator('.motif-cloud')).toHaveCount(1);await expect(page.locator('.direction-arrow')).toHaveCount(0);
 await page.goto('/?screen=arrival');await expect(page.locator('.motif-lotus')).toHaveCount(1);await expect(page.locator('.motif-flower')).toHaveCount(0);await page.getByRole('button',{name:'도움이 됐어요',exact:true}).click();await expect(page.locator('.motif-flower')).toHaveCount(1);
});
for(const width of [360,390,430]){
 test(`${width}px 실제 모드의 장소·경로 정보에 가로 넘침이 없다`,async({page,context})=>{
  await page.setViewportSize({width,height:844});await setup(page);await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:37.5665,longitude:126.978,accuracy:10});
  await page.route('**/api/navigation?**action=route**',r=>r.fulfill({json:{route:{...route,steps:[...route.steps,{lat:37.5651,lng:126.9776,description:'도서관 입구까지 보행로를 따라 이동하고 주변의 횡단보도 신호와 차량을 확인해 주세요. '.repeat(4),turnType:201}]}}}));
  await choose(page);await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByText('도보 · 340m')).toBeVisible();
  await page.getByText('전체 도보 안내 보기').click();await expect(page.getByRole('list',{name:'전체 도보 안내'}).getByRole('listitem')).toHaveCount(2);
  await page.screenshot({path:`test-results/live-route-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 });
}

 test('상세 안내가 비어 있어도 안내를 만들어내지 않는다',async({page,context})=>{
  await setup(page);await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:37.5665,longitude:126.978,accuracy:10});
  await page.route('**/api/navigation?**action=route**',r=>r.fulfill({json:{route:{...route,steps:[]}}}));
  await choose(page);await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();
  const summary=page.getByText('전체 도보 안내 보기');await summary.focus();await page.keyboard.press('Enter');
  await expect(page.getByText('이 경로에는 상세 안내가 없어요.',{exact:false})).toBeVisible();
  await expect(page.getByRole('list',{name:'전체 도보 안내'})).toHaveCount(0);
 });

for(const screen of ['map','camera','recheck']){
 test(`${screen}의 X는 화면만 닫고 목적지와 안내 화면을 유지한다`,async({page})=>{
  await page.goto(`/?screen=${screen}`);
  if(screen==='recheck')await page.getByRole('button',{name:'다시 확인',exact:true}).click();
  await page.getByRole('button',{name:'안내 화면 닫기'}).click();
  const card=page.getByRole('region',{name:'진행 중인 안내'});
  await expect(card).toContainText('중앙도서관');await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.waitForTimeout(1000);await expect(card).toBeVisible();
  await card.getByRole('button',{name:'안내로 돌아가기'}).click();
  await expect(page).toHaveURL(new RegExp(`screen=${screen}`));
  await page.getByRole('button',{name:'안내 화면 닫기'}).click();
  await card.getByRole('button',{name:'안내 종료',exact:true}).click();
  await page.getByRole('button',{name:'계속 안내받기'}).click();await expect(card).toBeVisible();
  await card.getByRole('button',{name:'안내 종료',exact:true}).click();
  await page.getByRole('button',{name:'안내 종료하기',exact:true}).click();await expect(card).toHaveCount(0);
 });
}
test('다른 목적지를 살펴봐도 기존 안내의 목적지는 유지된다',async({page})=>{
 await page.goto('/?screen=map');await page.getByRole('button',{name:'안내 화면 닫기'}).click();
 await page.getByRole('textbox',{name:'목적지 검색',exact:true}).fill('보건소');await page.getByRole('button',{name:'검색',exact:true}).click();
 await page.getByRole('button',{name:/건강·복지 · 가장 가까운 곳/}).click();
 await page.getByRole('button',{name:'뒤로 가기'}).click();await page.getByRole('button',{name:'뒤로 가기'}).click();
 await page.getByRole('button',{name:'안내로 돌아가기'}).click();await expect(page.locator('.destination-tag')).toHaveText('중앙도서관');
});
