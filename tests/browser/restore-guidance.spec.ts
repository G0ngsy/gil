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

const key='gilbit.guidance.v1.live';
for(const width of [360,390,430])test(`${width}px 새로고침 후 동의 전 위치·카메라를 켜지 않고 새 위치로 복원한다`,async({page})=>{
 await page.setViewportSize({width,height:844});await setup(page);await expect.poll(()=>page.evaluate(key=>Boolean(localStorage.getItem(key)),key)).toBe(true);
 await page.reload();const panel=page.getByRole('region',{name:'이전 안내 복원'});await expect(panel).toBeVisible();expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);if(width===390)await page.screenshot({path:'test-results/guidance-restore-home-390.png'});expect(await page.evaluate(()=>(window as any).rerouteTest.oneShots)).toBe(0);expect(await page.evaluate(()=>(window as any).rerouteTest.ok)).toBe(null);await expect(page.locator('.real-camera')).toHaveCount(0);
 await page.route('**/api/navigation?action=route',r=>r.fulfill({json:{route:replacement}}));await page.getByRole('button',{name:'이전 안내 이어가기'}).click();await expect(page.getByTestId('live-remaining')).toHaveText('300m');await expect(panel).toHaveCount(0);expect(await page.evaluate(()=>(window as any).rerouteTest.oneShots)).toBe(1);await expect(page.locator('.real-camera')).toHaveCount(0);
 await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(null);await page.reload();await expect(panel).toHaveCount(0);
});
test('경로 위에서는 API 재탐색 없이 새 GPS로 남은 거리를 계산한다',async({page})=>{
 await setup(page);await page.reload();await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.567,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);});let calls=0;await page.route('**/api/navigation?action=route',r=>{calls++;return r.fulfill({json:{route:replacement}});});await page.getByRole('button',{name:'이전 안내 이어가기'}).click();await expect(page.getByTestId('live-remaining')).toHaveText('100m');expect(calls).toBe(0);
});
test('재탐색 실패는 저장 안내를 보존하고 재시도할 수 있다',async({page})=>{
 await setup(page);await page.reload();await page.route('**/api/navigation?action=route',r=>r.fulfill({status:503,json:{error:{message:'연결 실패'}}}));await page.getByRole('button',{name:'이전 안내 이어가기'}).click();await expect(page.locator('.saved-guidance').getByRole('alert')).toHaveText('연결 실패');await expect(page.getByRole('button',{name:'이전 안내 이어가기'})).toBeEnabled();expect(await page.evaluate(key=>Boolean(localStorage.getItem(key)),key)).toBe(true);expect(await page.evaluate(()=>(window as any).rerouteTest.ok)).toBe(null);
});
test('복원 요청 중 삭제하면 늦은 응답이 안내를 시작하지 않는다',async({page})=>{
 await setup(page);await page.reload();let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/api/navigation?action=route',async r=>{await gate;await r.fulfill({json:{route:replacement}}).catch(()=>{});});await page.getByRole('button',{name:'이전 안내 이어가기'}).click();await expect(page.getByRole('button',{name:'현재 위치와 경로 확인 중…'})).toBeDisabled();await page.getByRole('button',{name:'이전 안내 삭제'}).click();release();await expect(page.getByRole('region',{name:'이전 안내 복원'})).toHaveCount(0);await expect(page.getByTestId('live-remaining')).toHaveCount(0);expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(null);
});
test('권한 거절 후 저장 안내는 남고 GPS 추적을 시작하지 않는다',async({page})=>{
 await setup(page);await page.reload();await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>fail?.({code:1} as GeolocationPositionError);});await page.getByRole('button',{name:'이전 안내 이어가기'}).click();await expect(page.locator('.saved-guidance').getByRole('alert')).toContainText('위치 권한');expect(await page.evaluate(()=>(window as any).rerouteTest.ok)).toBe(null);
});
test('도착하면 복원 기록을 지우고 저장된 GPS·카메라 상태는 없다',async({page})=>{
 await setup(page);const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key);expect(saved.start).toBeUndefined();expect(saved.progress).toBeUndefined();expect(saved.camera).toBeUndefined();await page.clock.runFor(10000);await emit(page,37.567);await page.clock.runFor(10000);await emit(page,37.5675);await page.clock.runFor(1000);await emit(page,37.5675);await expect(page.getByRole('heading',{name:'목적지 근처에 도착했어요'})).toBeVisible();await expect.poll(()=>page.evaluate(key=>localStorage.getItem(key),key)).toBe(null);
});
test('저장 공간 오류로 안내 자체가 중단되지는 않는다',async({page})=>{
 await page.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='gilbit.guidance.v1.live')throw new DOMException('Quota','QuotaExceededError');return set.call(this,key,value);};});await setup(page);await expect(page.getByText('이 기기에 안내를 저장하지 못했어요. 다시 열면 복원되지 않거나 이전 기록이 남아 있을 수 있어요.')).toBeVisible();await expect(page.getByTestId('live-remaining')).toBeVisible();
});
