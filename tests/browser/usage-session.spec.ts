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
async function details(page:Page){await expect(page.getByText('자세히 보기',{exact:true})).toHaveCount(0);}
async function newDestination(page:Page){await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('새 목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByRole('button',{name:'길 안내 시작',exact:true})).toBeVisible();}

test('개인정보 안내를 읽는 동안 기존 GPS 안내·목적지·남은 거리를 유지한다',async({page})=>{
 await start(page);await close(page);const before=await page.locator('.ongoing-distance').textContent();await page.getByRole('button',{name:'개인정보·이용 안내',exact:true}).click();await expect(page.getByRole('heading',{name:'개인정보·이용 안내',exact:true})).toBeVisible();await page.clock.runFor(6000);await emit(page,37.5667,126.978);expect(await page.evaluate(()=>(window as any).liveGps)).toMatchObject({calls:1,clears:[]});await page.goBack();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toBeVisible();await expect(page.locator('.ongoing-distance')).not.toHaveText(before!);await page.getByRole('button',{name:'안내로 돌아가기',exact:true}).click();await expect(page.getByText('테스트 목적지',{exact:true})).toBeVisible();
});
