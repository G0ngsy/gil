import {expandJourney} from './helpers/journey';
import {test,expect,type Page} from '@playwright/test';
const original={distanceMeters:200,durationSeconds:180,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978}]],steps:[{lat:37.5665,lng:126.978,description:'직진',turnType:11},{lat:37.5675,lng:126.978,description:'도착',turnType:201}]};
const replacement={distanceMeters:300,durationSeconds:240,segments:[[{lat:37.5682,lng:126.978},{lat:37.5682,lng:126.979},{lat:37.5675,lng:126.978}]],steps:[{lat:37.5682,lng:126.978,description:'새 경로',turnType:11},{lat:37.5675,lng:126.978,description:'도착',turnType:201}]};
async function setup(page:Page){
 await page.clock.install();
 await page.addInitScript(()=>{
  const state={ok:null as PositionCallback|null,accuracy:5,oneShots:0};Object.assign(window,{rerouteTest:state});
  navigator.geolocation.getCurrentPosition=ok=>{state.oneShots++;ok({coords:{latitude:37.5682,longitude:126.978,accuracy:state.accuracy},timestamp:Date.now()} as GeolocationPosition);};
  navigator.geolocation.watchPosition=ok=>{state.ok=ok;return 1;};navigator.geolocation.clearWatch=()=>{};
 });
 await page.route('https://apis.openapi.sk.com/tmap/jsv2**',r=>r.abort());
 await page.route('**/api/navigation?**',r=>{const action=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:action==='config'?{searchConfigured:true}:action==='route'?{route:original}:action==='address'?{location:{address:'테스트 주소',area:'테스트'}}:{places:[{id:'123',name:'기존 목적지',address:'테스트',category:'장소',lat:37.5675,lng:126.978}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();
 await emit(page,37.5665);await page.clock.runFor(1000);await emit(page,37.5682);await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
}
async function emit(page:Page,lat:number,accuracy=5){await page.evaluate(({lat,accuracy})=>(window as any).rerouteTest.ok({coords:{latitude:lat,longitude:126.978,accuracy},timestamp:Date.now()}),{lat,accuracy});}
const button=(page:Page)=>page.getByRole('button',{name:'현재 위치에서 다시 찾기',exact:true});
for(const width of [360,390,430])test(`${width}px 이탈 후 현재 위치·기존 목적지로 새 경로를 교체한다`,async({page})=>{
 await page.setViewportSize({width,height:844});await setup(page);let body:any,calls=0;
 await page.route('**/api/navigation?action=route',r=>{calls++;body=r.request().postDataJSON();return r.fulfill({json:{route:replacement}});});
 await button(page).click();await expect(page.getByTestId('live-remaining')).toHaveText('300m');expect(body.start).toEqual({lat:37.5682,lng:126.978});expect(body.end).toEqual({lat:37.5675,lng:126.978});expect(body.endPoiId).toBe('123');expect(calls).toBe(1);await expect(button(page)).toHaveCount(0);await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toHaveCount(0);await expandJourney(page);await expect(page.getByText('기존 목적지',{exact:true})).toBeVisible();
});
test('실패는 기존 경로·거리를 유지하고 재시도 성공 시에만 교체한다',async({page})=>{
 await setup(page);const before=await page.getByTestId('live-remaining').textContent();let fail=true;
 await page.route('**/api/navigation?action=route',r=>r.fulfill(fail?{status:503,json:{error:{message:'연결 실패'}}}:{json:{route:replacement}}));
 await button(page).click();await expect(page.locator('.journey-reroute').getByRole('alert')).toContainText('기존 경로를 유지해요');await expect(page.getByTestId('live-remaining')).toHaveText(before!);fail=false;await button(page).click();await expect(page.getByTestId('live-remaining')).toHaveText('300m');
});
test('중복 요청을 막고 홈으로 나가면 늦은 응답이 안내를 교체하지 않는다',async({page})=>{
 await setup(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);let calls=0;
 await page.route('**/api/navigation?action=route',async r=>{calls++;await gate;await r.fulfill({json:{route:replacement}}).catch(()=>{});});
 await button(page).click();await expect(page.getByRole('button',{name:'현재 위치에서 다시 찾는 중…'})).toBeDisabled();await page.getByRole('button',{name:'안내 화면 닫기',exact:true}).click();release();await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();await expect(page.getByTestId('live-remaining')).toHaveText('200m');expect(calls).toBe(1);await expect(button(page)).toBeEnabled();
});
test('부정확한 위치로는 새 경로를 요청하지 않는다',async({page})=>{
 await setup(page);await emit(page,37.5682,45);await page.evaluate(()=>(window as any).rerouteTest.accuracy=45);let calls=0;await page.route('**/api/navigation?action=route',r=>{calls++;return r.fulfill({json:{route:replacement}});});
 await button(page).click();await page.clock.runFor(8100);await expect(page.locator('.journey-reroute').getByRole('alert')).toContainText('현재 위치 오차');expect(calls).toBe(0);await expect(page.getByTestId('live-remaining')).toHaveText('200m');
});
test('오래된 위치는 다시 확인한 좌표로 요청한다',async({page})=>{
 await setup(page);await page.clock.runFor(11000);let body:any;await page.route('**/api/navigation?action=route',r=>{body=r.request().postDataJSON();return r.fulfill({json:{route:replacement}});});
 await button(page).click();await expect(page.getByTestId('live-remaining')).toHaveText('300m');expect(await page.evaluate(()=>(window as any).rerouteTest.oneShots)).toBe(2);expect(body.start.lat).toBe(37.5682);
});
test('화면을 떠나면 대기 요청을 취소하고 자동 재탐색하지 않는다',async({page})=>{
 await setup(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);let calls=0;await page.route('**/api/navigation?action=route',async r=>{calls++;await gate;await r.fulfill({json:{route:replacement}}).catch(()=>{});});await button(page).click();await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));release();await expect(button(page)).toBeEnabled();await expect(page.getByTestId('live-remaining')).toHaveText('200m');expect(calls).toBe(1);
});
test('응답 시간 초과는 기존 안내를 유지하고 다시 시도할 수 있다',async({page})=>{
 await setup(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/api/navigation?action=route',async r=>{await gate;await r.fulfill({json:{route:replacement}}).catch(()=>{});});
 await button(page).click();for(let i=0;i<3;i++){await page.clock.runFor(10000);await emit(page,37.5682);}await expect(page.locator('.journey-reroute').getByRole('alert')).toContainText('시간이 길어졌어요');release();await expect(button(page)).toBeEnabled();await expect(page.getByTestId('live-remaining')).toHaveText('200m');
});
test('안내 종료 후 도착한 재탐색 응답은 경로를 복원하지 않는다',async({page})=>{
 await setup(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/api/navigation?action=route',async r=>{await gate;await r.fulfill({json:{route:replacement}}).catch(()=>{});});await button(page).click();await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();release();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toHaveCount(0);await expect(page.getByTestId('live-remaining')).toHaveCount(0);
});
