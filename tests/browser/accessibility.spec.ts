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
 await page.route('**/api/navigation?**',r=>{const action=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:action==='config'?{searchConfigured:true}:action==='route'?{route:original}:action==='address'?{location:{address:'테스트 주소',area:'테스트'}}:{places:[{id:'123',name:'아주긴공공시설이름'.repeat(8),address:'테스트',category:'장소',lat:37.5675,lng:126.978}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();
 
}
async function emit(page:Page,lat:number,accuracy=5){await page.evaluate(({lat,accuracy})=>(window as any).rerouteTest.ok({coords:{latitude:lat,longitude:126.978,accuracy},timestamp:Date.now()}),{lat,accuracy});}


for(const width of [320,360,430])for(const scale of [1,2])test(`${width}px 글자${scale*100}% 긴 장소명·버튼·종료창`,async({page})=>{
 await page.setViewportSize({width,height:720});await setup(page);await page.addStyleTag({content:`html{font-size:${scale*100}%!important}`});
 const main=page.locator('main');expect(await main.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await expandJourney(page);const dest=page.locator('.journey-destination h2');expect(await dest.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 if(scale===2)expect(await dest.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(32);
 const card=page.getByRole('region',{name:'실제 경로 이동 안내'});const box=(await card.boundingBox())!;const remaining=(await page.locator('.journey-remaining').boundingBox())!;expect(remaining.y).toBeGreaterThanOrEqual(box.y+box.height);
 const end=page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true});await end.scrollIntoViewIfNeeded();expect((await end.boundingBox())!.height).toBeGreaterThanOrEqual(44);await end.click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'안내 화면 닫기'}).click();await expect(page.locator('.home-hero')).toBeVisible();expect(await main.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);const search=page.getByRole('button',{name:'실제 장소 검색',exact:true});expect((await search.boundingBox())!.width).toBeGreaterThanOrEqual(44);
 for(const button of await page.locator('button:visible').all()){await expect(button).toHaveAccessibleName(/\S/);expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);}
 if(width===360&&scale===2)await page.screenshot({path:'test-results/a11y-home-text200-360.png'});
});
test('키보드로 검색하고 새 화면의 본문에서 탐색을 이어간다',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'안내 화면 닫기'}).click();await page.getByRole('textbox',{name:'실제 목적지 검색'}).focus();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.type('도서관');await page.keyboard.press('Enter');await expect(page.locator('.header-title')).toHaveText('장소 검색');await expect(page.locator('main')).toBeFocused();await expect(page.locator('.result-card')).toBeVisible();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'다시 검색',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('textbox',{name:'검색어',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'검색어 지우기'})).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('.result-card')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('.header-title')).toHaveText('도보 경로 확인');await expect(page.locator('main')).toBeFocused();
});
