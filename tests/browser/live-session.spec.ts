import {test,expect,type Page} from '@playwright/test';
const route={distanceMeters:200,durationSeconds:180,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978},{lat:37.5675,lng:126.979}]],steps:[{lat:37.5665,lng:126.978,description:'북쪽으로 직진',turnType:0},{lat:37.5675,lng:126.978,description:'오른쪽으로 이동',turnType:0}]};
async function setup(page:Page){
 await page.clock.install();
 await page.addInitScript(()=>{
  const state={calls:0,clears:[] as number[],ok:null as PositionCallback|null};Object.assign(window,{liveGps:state});
  navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);
  navigator.geolocation.watchPosition=ok=>{state.calls++;state.ok=ok;return state.calls;};navigator.geolocation.clearWatch=id=>state.clears.push(id);
  class Map{destroyed=false;setCenter(){}fitBounds(){}destroy(){this.destroyed=true;}}class LatLng{}class LatLngBounds{extend(){}}class Overlay{owner:Map;constructor(options:Record<string,unknown>){this.owner=options.map as Map;}setMap(){if(this.owner.destroyed)throw new Error('Overlay removed after map destruction');}}
  window.Tmapv2={Map,LatLng,LatLngBounds,Marker:Overlay,Polyline:Overlay};
 });
 await page.route('**/api/navigation?**',r=>{const a=new URL(r.request().url()).searchParams.get('action');const q=r.request().method()==='POST'?r.request().postDataJSON()?.q:new URL(r.request().url()).searchParams.get('q');return r.fulfill({json:a==='config'?{searchConfigured:true}:a==='route'?{route}:{places:[{id:q?.includes('새')?'new':'live-test',name:q?.includes('새')?'새 목적지':'테스트 목적지',address:'검증용',category:'장소',lat:37.5675,lng:126.979}]}});});
 await page.goto('/?mode=live');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();
 await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('테스트 목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByRole('button',{name:'길 안내 시작',exact:true})).toBeVisible();
}
async function emit(page:Page,lat:number,lng:number,accuracy=5){await page.evaluate(({lat,lng,accuracy})=>{(window as any).liveGps.ok({coords:{latitude:lat,longitude:lng,accuracy},timestamp:Date.now()});},{lat,lng,accuracy});}

async function start(page:Page){await setup(page);await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await emit(page,37.5665,126.978);}
async function close(page:Page){await page.getByRole('button',{name:'안내 화면 닫기',exact:true}).click();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toBeVisible();}
async function details(page:Page){await page.locator('.journey-details').evaluate(e=>e.setAttribute('open',''));}
async function newDestination(page:Page){await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('새 목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByRole('button',{name:'길 안내 시작',exact:true})).toBeVisible();}
for(const width of [360,390,430])test(`${width}px X 홈 이동·복귀 중 GPS를 유지하고 남은 거리를 갱신한다`,async({page})=>{
 await page.setViewportSize({width,height:844});await start(page);await close(page);await expect(page.getByText('위치 안내가 계속되고 있어요.',{exact:true})).toBeVisible();
 await page.clock.runFor(6000);await emit(page,37.5667,126.978);await expect(page.locator('.ongoing-distance')).not.toHaveText(/200m/);
 const remaining=await page.locator('.ongoing-distance').textContent();await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();expect(remaining).toContain(await page.getByTestId('live-remaining').innerText());
 await close(page);await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();expect(await page.evaluate(()=>(window as any).liveGps)).toMatchObject({calls:1,clears:[]});expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});
test('일시중지·홈·복귀는 진행을 보존하고 재개 후에만 위치를 받는다',async({page})=>{
 await start(page);await page.clock.runFor(6000);await emit(page,37.5667,126.978);const remaining=await page.getByTestId('live-remaining').innerText();await details(page);await page.getByRole('button',{name:'안내 일시중지',exact:true}).click();await expect(page.getByRole('heading',{name:'안내가 잠시 멈췄어요'})).toBeInViewport();expect(await page.locator('main').evaluate(e=>e.scrollTop)).toBe(0);await close(page);
 await expect(page.getByText('위치 안내가 멈춰 있어요.',{exact:true})).toBeVisible();await page.clock.runFor(1000);await emit(page,37.5675,126.979);await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();await expect(page.getByTestId('live-remaining')).toHaveText(remaining);await expect(page.getByText('마지막 확인 기준',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as any).liveGps.calls)).toBe(1);await page.getByRole('button',{name:'안내 계속하기',exact:true}).click();await expect(page.getByTestId('live-remaining')).toHaveText(remaining);expect(await page.evaluate(()=>(window as any).liveGps.calls)).toBe(2);
});
test('다른 장소 탐색·위치 재확인은 기존 안내를 보존하고 새 안내는 확인 후 교체한다',async({page})=>{
 await start(page);await close(page);await page.getByRole('button',{name:'현재 위치 다시 확인',exact:true}).click();await newDestination(page);expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([]);
 await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await expect(page.getByRole('heading',{name:'새 목적지로 안내할까요?'})).toBeVisible();await page.getByRole('button',{name:'계속 보기',exact:true}).click();expect(await page.evaluate(()=>(window as any).liveGps)).toMatchObject({calls:1,clears:[]});
 await page.getByRole('button',{name:'뒤로 가기',exact:true}).click();await page.getByRole('button',{name:'뒤로 가기',exact:true}).click();await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();await expect(page.locator('.journey-destination h2')).toHaveText('테스트 목적지');
 await close(page);await newDestination(page);await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await page.getByRole('button',{name:'새 안내 시작',exact:true}).click();await expect(page.locator('.journey-destination h2')).toHaveText('새 목적지');expect(await page.evaluate(()=>(window as any).liveGps)).toMatchObject({calls:2,clears:[1]});
});
test('종료 확인 취소는 유지하고 확정하면 GPS·경로·홈 복귀 카드를 지운다',async({page})=>{
 await start(page);await details(page);await page.locator('.journey-actions').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('button',{name:'계속 보기',exact:true}).click();expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([]);
 await page.locator('.journey-actions').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toHaveCount(0);expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([1]);await page.clock.runFor(1000);await emit(page,37.5675,126.979);await expect(page.getByRole('region',{name:'진행 중인 안내'})).toHaveCount(0);
});
test('홈에서 탭이 숨겨지면 추적을 중지하고 복귀해도 자동 재시작하지 않는다',async({page})=>{
 await start(page);await close(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.getByText('위치 안내가 멈춰 있어요.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();await expect(page.getByRole('button',{name:'안내 계속하기',exact:true})).toBeVisible();expect(await page.evaluate(()=>(window as any).liveGps)).toMatchObject({calls:1,clears:[1]});
});
test('홈에서도 도착하면 추적을 마치고 도착 화면으로 복귀한다',async({page})=>{
 await start(page);await close(page);for(const [lat,lng] of [[37.567,126.978],[37.5675,126.978],[37.5675,126.9787],[37.5675,126.979],[37.5675,126.979]]){await page.clock.runFor(12000);await emit(page,lat,lng);}
 await expect(page.locator('.ongoing-title h3')).toHaveText('테스트 목적지 도착');await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([1]);
});
test('카메라 권한 대기 중 X로 닫으면 늦은 영상만 해제하고 GPS는 유지한다',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>Object.assign(window,{allowSessionCamera:()=>{const canvas=document.createElement('canvas');const stream=canvas.captureStream();Object.assign(window,{sessionCameraStream:stream});resolve(stream);}}));});
 await start(page);await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();await close(page);await page.evaluate(()=>(window as any).allowSessionCamera());expect(await page.evaluate(()=>(window as any).sessionCameraStream.getTracks().every((t:MediaStreamTrack)=>t.readyState==='ended'))).toBe(true);expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([]);
});
