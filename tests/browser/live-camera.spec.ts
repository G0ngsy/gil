import {test,expect,type Page} from '@playwright/test';
const route={distanceMeters:144,durationSeconds:120,segments:[[{lat:37.5665,lng:126.978},{lat:37.567,lng:126.978},{lat:37.567,lng:126.979}]],steps:[{lat:37.5665,lng:126.978,description:'직진하세요',turnType:11},{lat:37.567,lng:126.978,description:'오른쪽으로 이동하세요',turnType:13},{lat:37.567,lng:126.9782,description:'목적지까지 직진하세요',turnType:11},{lat:37.567,lng:126.979,description:'목적지 도착',turnType:201}]};
async function setup(page:Page,turnType=13){
 await page.clock.install();
 await page.addInitScript(()=>{
  const state={ok:null as PositionCallback|null,clears:0,orientationRequests:0};Object.assign(window,{routeCameraTest:state});
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:class{static requestPermission(){state.orientationRequests++;throw new Error('must not request orientation');}}});
  navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);
  navigator.geolocation.watchPosition=ok=>{state.ok=ok;return 1;};navigator.geolocation.clearWatch=()=>state.clears++;
  navigator.mediaDevices.getUserMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=390;canvas.height=844;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#536258';ctx.fillRect(0,0,390,844);const stream=canvas.captureStream(1);Object.assign(window,{routeCameraStream:stream});return stream;};
 });
 await page.route('https://apis.openapi.sk.com/tmap/jsv2**',r=>r.abort());
 await page.route('**/api/navigation?**',r=>{const a=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:a==='config'?{searchConfigured:true}:a==='route'?{route:{...route,steps:route.steps.map((step,index)=>index===1?{...step,turnType}:step)}}:a==='address'?{location:{address:'모의 출발지',area:'서울'}}:{places:[{id:'test',name:'모의 목적지',address:'테스트 경로',category:'장소',lat:37.567,lng:126.979}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await emit(page,37.5665,126.978);await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();await expect(page.getByRole('region',{name:'카메라 경로 안내',exact:true})).toBeVisible();
}
async function emit(page:Page,lat:number,lng:number,accuracy=5){await page.evaluate(({lat,lng,accuracy})=>(window as any).routeCameraTest.ok({coords:{latitude:lat,longitude:lng,accuracy},timestamp:Date.now()}),{lat,lng,accuracy});}
const card=(page:Page)=>page.getByRole('region',{name:'카메라 경로 안내',exact:true});
for(const width of [360,390,430])test(`${width}px 방향 센서 없이 직진·회전 접근·회전 후 안내·도착 표시`,async({page})=>{
 await page.setViewportSize({width,height:844});await setup(page);
 await expect(card(page)).toHaveAttribute('data-action','straight');await expect(card(page).getByTestId('route-action-arrow')).toBeVisible();
 await expect(page.getByRole('button',{name:'방향 센서 시작'})).toHaveCount(0);
 await page.clock.runFor(7000);await emit(page,37.5667,126.978);await expect(card(page)).toHaveAttribute('data-action','right');await expect(card(page).getByRole('heading')).toHaveText(/앞 오른쪽/);
 await page.clock.runFor(10000);await emit(page,37.567,126.978);await expect(card(page).getByRole('heading')).toHaveText('지금 오른쪽');
 await page.clock.runFor(7000);await emit(page,37.567,126.97825);await expect(card(page)).toHaveAttribute('data-action','straight');
 await expect(page.getByRole('button',{name:'지도 보기',exact:true})).toBeInViewport();expect(await page.locator('.real-camera').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.clock.runFor(15000);await emit(page,37.567,126.9788);await page.clock.runFor(5000);await emit(page,37.567,126.979);await page.clock.runFor(1000);await emit(page,37.567,126.979);
 await expect(card(page).getByRole('heading')).toHaveText('목적지에 도착했어요');expect(await page.locator('.real-camera').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await expect(card(page).getByTestId('route-action-arrow')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).routeCameraTest.orientationRequests)).toBe(0);
 await page.getByRole('button',{name:'지도 보기',exact:true}).click();expect(await page.evaluate(()=>(window as any).routeCameraStream.getTracks().every((t:MediaStreamTrack)=>t.readyState==='ended'))).toBe(true);
});
test('이탈·부정확·오래된 GPS·수신 중단은 카메라 화살표를 숨기고 지도와 같은 상태를 보인다',async({page})=>{
 await setup(page);await page.clock.runFor(1000);await emit(page,37.568,126.978);await expect(card(page).getByRole('heading')).toHaveText('경로를 벗어났어요');await expect(card(page).getByTestId('route-action-arrow')).toHaveCount(0);
 await page.clock.runFor(1000);await emit(page,37.5665,126.978);await expect(card(page).getByTestId('route-action-arrow')).toBeVisible();
 await page.clock.runFor(1000);await emit(page,37.5665,126.978,45);await expect(card(page).getByRole('heading')).toHaveText('위치 오차가 커요');await expect(card(page).getByTestId('route-action-arrow')).toHaveCount(0);
 await page.clock.runFor(1000);await emit(page,37.5665,126.978);await page.clock.runFor(11000);await expect(card(page).getByRole('heading')).toHaveText('위치를 다시 확인하고 있어요');await expect(card(page).getByTestId('route-action-arrow')).toHaveCount(0);
 await page.clock.runFor(10000);await expect(card(page).getByRole('heading')).toHaveText('위치 수신이 멈췄어요');
 await page.getByRole('button',{name:'지도 보기',exact:true}).click();await expect(page.getByRole('region',{name:'실제 경로 이동 안내'}).getByRole('heading')).toHaveText('위치 수신이 멈췄어요');
});

for(const [turnType,symbol,title] of [[12,'left','왼쪽'],[14,'back','유턴']] as const)test(`카메라 ${title}도 지도와 같은 회전 코드를 사용한다`,async({page})=>{
 await setup(page,turnType);await page.clock.runFor(7000);await emit(page,37.5667,126.978);await expect(card(page)).toHaveAttribute('data-action',symbol);await expect(card(page).getByRole('heading')).toHaveText(new RegExp(title));
 await page.getByRole('button',{name:'지도 보기',exact:true}).click();await expect(page.getByRole('region',{name:'실제 경로 이동 안내'})).toHaveAttribute('data-action',symbol);
});
