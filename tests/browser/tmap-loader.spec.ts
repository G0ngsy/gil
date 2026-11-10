import {test,expect} from '@playwright/test';
const bootstrap="window.Tmapv2={_getScriptLocation:()=> 'https://topopentile1.tmap.co.kr/scriptSDKV2/'};";
const core="for(const k of ['Map','LatLng','LatLngBounds','Marker','Polyline'])window.Tmapv2[k]=function(){};";
test('비동기 SDK 부트스트랩 이후 구성 요소를 한 번만 불러온다',async({page})=>{
 let calls=0;
 await page.route('https://apis.openapi.sk.com/tmap/jsv2?**',r=>r.fulfill({contentType:'application/javascript',body:bootstrap}));
 await page.route('https://topopentile1.tmap.co.kr/scriptSDKV2/tmapjs2.min.js',async r=>{calls++;await r.fulfill({contentType:'application/javascript',body:core});});
 await page.goto('/?mode=live');
 const ready=await page.evaluate(async()=>{const modulePath='/src/navigation/tmap.ts';const {loadTMap}=await import(modulePath);const [a,b]=await Promise.all([loadTMap('test'),loadTMap('test')]);return a===b&&typeof a.LatLng==='function';});
 expect(ready).toBe(true);expect(calls).toBe(1);
});
test('잘못된 부트스트랩은 실패하며 재시도 때 정상 SDK를 다시 읽는다',async({page})=>{
 let calls=0;
 await page.route('https://apis.openapi.sk.com/tmap/jsv2?**',r=>r.fulfill({contentType:'application/javascript',body:++calls===1?'window.Tmapv2={};':bootstrap}));
 await page.route('https://topopentile1.tmap.co.kr/scriptSDKV2/tmapjs2.min.js',r=>r.fulfill({contentType:'application/javascript',body:core}));
 await page.goto('/?mode=live');
 const result=await page.evaluate(async()=>{const modulePath='/src/navigation/tmap.ts';const {loadTMap}=await import(modulePath);let rejected=false;try{await loadTMap('test');}catch{rejected=true;}const clean=!window.Tmapv2;const sdk=await loadTMap('test');return {rejected,clean,ready:typeof sdk.Map==='function'};});
 expect(result).toEqual({rejected:true,clean:true,ready:true});expect(calls).toBe(2);
});
