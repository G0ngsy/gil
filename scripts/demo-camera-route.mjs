import {createServer} from 'vite';
import {chromium,expect} from '@playwright/test';
import {mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('docs/portfolio/assets');await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5191,strictPort:true},define:{'import.meta.env.VITE_TMAP_MAP_KEY':JSON.stringify('')}});
await server.listen();let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:process.argv.includes('--headless'),args:['--window-size=440,950']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',recordVideo:{dir:path.resolve('test-results/camera-demo-video'),size:{width:390,height:844}}});
 const page=await context.newPage();await page.clock.install();let pageErrors=0;page.on('pageerror',()=>pageErrors++);
 await page.addInitScript(()=>{
  const state={ok:null,orientationRequests:0};window.cameraDemo=state;
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:class{static requestPermission(){state.orientationRequests++;throw new Error('orientation not used');}}});
  navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()});
  navigator.geolocation.watchPosition=ok=>{state.ok=ok;return 1;};navigator.geolocation.clearWatch=()=>{};
  navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=390;c.height=844;const x=c.getContext('2d');x.fillStyle='#798781';x.fillRect(0,0,390,844);x.fillStyle='#BAC0AE';x.fillRect(0,0,390,300);x.fillStyle='#D8D4C8';x.beginPath();x.moveTo(135,300);x.lineTo(255,300);x.lineTo(390,844);x.lineTo(0,844);x.fill();x.strokeStyle='#FFFDF9';x.lineWidth=3;for(let i=0;i<5;i++){x.beginPath();x.moveTo(195,330+i*100);x.lineTo(195,370+i*100);x.stroke();}x.fillStyle='#14251d';x.fillRect(15,180,360,40);x.fillStyle='#fff';x.font='bold 15px sans-serif';x.textAlign='center';x.fillText('모의 카메라 · 모의 GPS / 실외 검증 아님',195,206);return c.captureStream(1);};
 });
 const route={distanceMeters:144,durationSeconds:120,segments:[[{lat:37.5665,lng:126.978},{lat:37.567,lng:126.978},{lat:37.567,lng:126.979}]],steps:[{lat:37.5665,lng:126.978,description:'직진하세요',turnType:11},{lat:37.567,lng:126.978,description:'오른쪽으로 이동하세요',turnType:13},{lat:37.567,lng:126.9782,description:'목적지까지 직진하세요',turnType:11},{lat:37.567,lng:126.979,description:'목적지 도착',turnType:201}]};
 await page.route('https://apis.openapi.sk.com/**',r=>r.abort());
 await page.route('**/api/navigation?**',r=>{const a=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:a==='config'?{searchConfigured:true}:a==='route'?{route}:a==='address'?{location:{address:'모의 출발지',area:'서울'}}:{places:[{id:'demo',name:'모의 목적지',address:'GPS 이동 시연',category:'장소',lat:37.567,lng:126.979}]}});});
 await page.goto('http://127.0.0.1:5191/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('모의 목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();
 const emit=async(lat,lng,accuracy=5,seconds=1)=>{await page.clock.runFor(seconds*1000);await page.evaluate(({lat,lng,accuracy})=>window.cameraDemo.ok({coords:{latitude:lat,longitude:lng,accuracy},timestamp:Date.now()}),{lat,lng,accuracy});};
 await emit(37.5665,126.978);await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();
 const card=page.getByRole('region',{name:'카메라 경로 안내',exact:true});await expect(card).toBeVisible();await expect(card).toHaveAttribute('data-action','straight');await page.waitForTimeout(2000);
 await emit(37.5667,126.978,5,7);await expect(card).toHaveAttribute('data-action','right');await page.screenshot({path:path.join(output,'2026-11-13-camera-route-right-390.png')});await page.waitForTimeout(2000);
 await emit(37.567,126.978,5,10);await expect(card.getByRole('heading')).toHaveText('지금 오른쪽');await page.waitForTimeout(2000);
 await emit(37.567,126.97825,5,7);await expect(card).toHaveAttribute('data-action','straight');await page.waitForTimeout(2000);
 await emit(37.568,126.97825);await expect(card.getByRole('heading')).toHaveText('경로를 벗어났어요');await page.waitForTimeout(2000);
 await emit(37.567,126.97825);await emit(37.567,126.97825,45);await expect(card.getByRole('heading')).toHaveText('위치 오차가 커요');await page.waitForTimeout(2000);
 await emit(37.567,126.97825);await emit(37.567,126.9788,5,15);await emit(37.567,126.979,5,5);await emit(37.567,126.979);await expect(card.getByRole('heading')).toHaveText('목적지에 도착했어요');if(!await page.locator('.real-camera').evaluate(e=>e.scrollWidth<=e.clientWidth))throw new Error('arrival overflow');await page.screenshot({path:path.join(output,'2026-11-13-camera-route-arrival-390.png')});await page.waitForTimeout(2000);
 if(pageErrors)throw new Error('page errors');
 const video=page.video();await context.close();const saved=await video.path();await rename(saved,path.join(output,'2026-11-13-camera-route-demo.webm'));
 console.log('Mobile browser demo recorded: route actions, off-route, GPS error, arrival; page errors 0.');
}finally{await browser?.close();await server.close();}
