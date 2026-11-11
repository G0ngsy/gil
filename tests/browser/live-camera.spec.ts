import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page){
 await page.addInitScript(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);navigator.geolocation.watchPosition=ok=>{Object.assign(window,{journeyFix:ok});return 1;};navigator.geolocation.clearWatch=()=>{};});
 await page.route('https://apis.openapi.sk.com/tmap/jsv2**',r=>r.abort());
 await page.route('**/api/navigation?**',r=>{const action=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:action==='config'?{searchConfigured:true}:action==='route'?{route:{distanceMeters:200,durationSeconds:180,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978}]],steps:[{lat:37.5665,lng:126.978,description:'보행로를 따라 직진하세요',turnType:0}]}}:action==='address'?{location:{address:'서울 중구',area:'서울 중구'}}:{places:[{id:'test',name:'가까운 도서관',address:'서울 중구 세종대로',category:'도서관',lat:37.5675,lng:126.978}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.locator('.map-compact')).toBeVisible();
}

test('실제 안내 카메라 연결·지원 자세·오차 숨김·복귀 자원 해제',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(screen,'orientation',{configurable:true,value:Object.assign(new EventTarget(),{angle:0})});
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:class {static requestPermission(){return Promise.resolve('granted');}}});
  navigator.mediaDevices.getUserMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=390;canvas.height=844;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#536258';ctx.fillRect(0,0,390,844);const stream=canvas.captureStream(1);Object.assign(window,{cameraStream:stream});return stream;};
  const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window),wrapped=new Map<EventListener,EventListener>();
  window.addEventListener=((type:string,fn:EventListener,...args:unknown[])=>{if(type.startsWith('deviceorientation')){const cb=(e:Event)=>{if(!e.isTrusted)fn(e);};wrapped.set(fn,cb);return (add as Function)(type,cb,...args);}return (add as Function)(type,fn,...args);}) as typeof window.addEventListener;
  window.removeEventListener=((type:string,fn:EventListener,...args:unknown[]) => (remove as Function)(type,wrapped.get(fn)||fn,...args)) as typeof window.removeEventListener;
 });
 await page.setViewportSize({width:390,height:844});await setup(page);
 await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();
 await page.evaluate(()=>(window as any).journeyFix({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()}));
 await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();
 await expect(page.getByRole('button',{name:'방향 센서 시작',exact:true})).toBeVisible();
 await expect(page.getByTestId('facing-arrow')).toHaveCount(0);
 await page.getByRole('button',{name:'방향 센서 시작',exact:true}).click();
 async function reading(beta=0,accuracy=5){await page.evaluate(({beta,accuracy})=>{const e=new Event('deviceorientation');for(const [key,value] of Object.entries({beta,gamma:0,webkitCompassHeading:10,webkitCompassAccuracy:accuracy}))Object.defineProperty(e,key,{value});window.dispatchEvent(e);},{beta,accuracy});}
 await reading();await expect(page.getByTestId('facing-arrow')).toBeVisible();
 await page.screenshot({path:'test-results/live-camera-overlay.png'});
 await reading(90);await expect(page.getByTestId('facing-arrow')).toHaveCount(0);
 await reading();await expect(page.getByTestId('facing-arrow')).toBeVisible();
 await reading(0,-1);await expect(page.getByTestId('facing-arrow')).toHaveCount(0);
 await page.getByRole('button',{name:'지도 보기',exact:true}).click();
 await expect(page.getByRole('region',{name:'실제 카메라 미리보기'})).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).cameraStream.getTracks().every((t:MediaStreamTrack)=>t.readyState==='ended'))).toBe(true);
 await expect(page.getByRole('heading',{name:'보행로를 따라 직진하세요'})).toBeVisible();
});
