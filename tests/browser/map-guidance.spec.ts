import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page){
 await page.clock.install({time:new Date('2026-11-12T00:00:00Z')});
 await page.addInitScript(()=>{
  navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);
  navigator.geolocation.watchPosition=ok=>{Object.assign(window,{mapFix:ok});return 1;};navigator.geolocation.clearWatch=()=>{};
 });
 await page.route('https://apis.openapi.sk.com/tmap/jsv2**',r=>r.fulfill({contentType:'application/javascript',body:`window.Tmapv2={_getScriptLocation:()=> 'https://topopentile1.tmap.co.kr/scriptSDKV2/'};`}));
 await page.route('https://topopentile1.tmap.co.kr/scriptSDKV2/tmapjs2.min.js',r=>r.fulfill({contentType:'application/javascript',body:`
 window.mapTest={layers:[],centers:[],maps:0};
 class Overlay{constructor(options){this.options=options;this.map=options.map;window.mapTest.layers.push(this);}setMap(map){this.map=map;}}
 Object.assign(window.Tmapv2,{Map:class{constructor(id){window.mapTest.maps++;document.getElementById(id).textContent='모의 지도';}setCenter(c){window.mapTest.centers.push(c);}fitBounds(){}destroy(){}},LatLng:class{constructor(lat,lng){this.lat=lat;this.lng=lng;}},LatLngBounds:class{extend(){}},Size:class{constructor(w,h){this.w=w;this.h=h;}},Point:class{constructor(x,y){this.x=x;this.y=y;}},Marker:Overlay,Polyline:Overlay,Circle:Overlay});` }));
 await page.route('**/api/navigation?**',r=>{const a=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:a==='config'?{searchConfigured:true}:a==='route'?{route:{distanceMeters:200,durationSeconds:180,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978}]],steps:[{lat:37.5665,lng:126.978,description:'보행로를 따라 직진하세요',turnType:0}]}}:a==='address'?{location:{address:'서울 중구',area:'서울 중구'}}:{places:[{id:'test',name:'가까운 도서관',address:'서울 중구',category:'도서관',lat:37.5675,lng:126.978}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByLabel('지도 표시 범례')).toBeVisible();
}
async function fix(page:Page,lat=37.5665){await page.evaluate(lat=>(window as any).mapFix({coords:{latitude:lat,longitude:126.978,accuracy:5},timestamp:Date.now()}),lat);}
for(const width of [360,390,430])test(`${width}px 지도 마커·진행 색상·따라가기·오래된 위치`,async({page})=>{
 await page.setViewportSize({width,height:844});await setup(page);
 await expect(page.getByRole('button',{name:'길 안내 시작',exact:true})).toBeInViewport();
 const before=await page.evaluate(()=>(window as any).mapTest.layers.filter((l:any)=>l.map).map((l:any)=>l.options));
 expect(before.some((o:any)=>o.title==='가까운 도서관'&&decodeURIComponent(o.icon).includes('#245447'))).toBe(true);
 expect(before.some((o:any)=>o.strokeColor==='#087F83')).toBe(true);
 await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await fix(page);await expect(page.getByText('위치 따라가는 중',{exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'보행로를 따라 직진하세요'})).toBeInViewport();await expect(page.getByTestId('live-remaining')).toBeInViewport();await expect(page.getByRole('button',{name:'실제 카메라 켜기',exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>(window as any).mapTest.layers.some((l:any)=>l.map&&l.options.radius===5))).toBe(true);
 const canvas=page.getByRole('region',{name:'가까운 도서관 도보 경로 지도'});await canvas.dispatchEvent('pointerdown',{clientX:100,clientY:300});await canvas.dispatchEvent('pointermove',{clientX:140,clientY:300});await canvas.dispatchEvent('pointerup');await expect(page.getByText('지도 둘러보는 중',{exact:true})).toBeVisible();
 const count=await page.evaluate(()=>(window as any).mapTest.centers.length);await page.clock.runFor(7000);await fix(page,37.56665);expect(await page.evaluate(()=>(window as any).mapTest.centers.length)).toBe(count);
 expect(await page.evaluate(()=>(window as any).mapTest.layers.some((l:any)=>l.map&&l.options.strokeColor==='#A8B5AC'))).toBe(true);
 await page.getByRole('button',{name:'현재 위치로 지도 이동',exact:true}).click();await expect(page.getByText('위치 따라가는 중',{exact:true})).toBeVisible();expect(await page.evaluate(()=>(window as any).mapTest.centers.length)).toBeGreaterThan(count);
 expect(await page.evaluate(()=>(window as any).mapTest.maps)).toBeLessThanOrEqual(2);
 await page.clock.runFor(10500);await expect(page.getByText('마지막 위치 · 갱신 대기',{exact:true})).toBeVisible();
 const last=await page.evaluate(()=>(window as any).mapTest.layers.filter((l:any)=>l.map&&l.options.title==='마지막 확인 위치').map((l:any)=>l.options));expect(last).toHaveLength(1);expect(decodeURIComponent(last[0].icon)).toContain('#77776E');expect(last[0].offset.y).toBe(20);
 expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});
