import {expandJourney} from './helpers/journey';
import {test,expect,type Page} from '@playwright/test';
const route={distanceMeters:144,durationSeconds:120,segments:[[{lat:37.5665,lng:126.978},{lat:37.567,lng:126.978},{lat:37.567,lng:126.979}]],steps:[{lat:37.5665,lng:126.978,description:'직진하세요',turnType:11},{lat:37.567,lng:126.978,description:'오른쪽으로 이동하세요',turnType:13},{lat:37.567,lng:126.9782,description:'목적지까지 직진하세요',turnType:11},{lat:37.567,lng:126.979,description:'목적지 도착',turnType:201}]};
async function setup(page:Page,turnType=13){
 await page.clock.install();
 await page.addInitScript(()=>{
  const state={ok:null as PositionCallback|null,clears:0,orientationRequests:0};Object.assign(window,{routeCameraTest:state});
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:class{static requestPermission(){state.orientationRequests++;throw new Error('must not request orientation');}}});
  navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);
  navigator.geolocation.watchPosition=ok=>{state.ok=ok;return 1;};navigator.geolocation.clearWatch=()=>state.clears++;
  navigator.mediaDevices.getUserMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=390;canvas.height=844;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#536258';ctx.fillRect(0,0,390,844);const stream=canvas.captureStream(1);Object.assign(window,{routeCameraStream:stream,routeCameraCanvas:canvas});return stream;};
 });
 await page.route('https://apis.openapi.sk.com/tmap/jsv2**',r=>r.abort());
 await page.route('**/api/navigation?**',r=>{const a=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:a==='config'?{searchConfigured:true}:a==='route'?{route:{...route,steps:route.steps.map((step,index)=>index===1?{...step,turnType}:step)}}:a==='address'?{location:{address:'모의 출발지',area:'서울'}}:{places:[{id:'test',name:'모의 목적지',address:'테스트 경로',category:'장소',lat:37.567,lng:126.979}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await emit(page,37.5665,126.978);await expandJourney(page);await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();await expect(page.getByRole('region',{name:'카메라 경로 안내',exact:true})).toBeVisible();
}
async function emit(page:Page,lat:number,lng:number,accuracy=5){await page.evaluate(({lat,lng,accuracy})=>(window as any).routeCameraTest.ok({coords:{latitude:lat,longitude:lng,accuracy},timestamp:Date.now()}),{lat,lng,accuracy});}
const card=(page:Page)=>page.getByRole('region',{name:'카메라 경로 안내',exact:true});

for(const width of [320,360])test(`${width}px 카메라 글자200%와 정보창 키보드 복귀`,async({page})=>{
 await page.setViewportSize({width,height:640});await setup(page);await page.addStyleTag({content:'html{font-size:200%!important}'});const camera=page.locator('.real-camera-live');expect(await camera.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);const info=page.getByRole('button',{name:'카메라 안내 정보',exact:true});const map=page.getByRole('button',{name:'지도 보기',exact:true});await map.scrollIntoViewIfNeeded();await expect(map).toBeInViewport();await info.click();const dialog=page.getByRole('dialog',{name:'카메라 안내 정보'});await expect(dialog).toBeVisible();expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(info).toBeFocused();await map.click();await expect(page.getByRole('region',{name:'실제 경로 이동 안내'})).toBeVisible();
});
