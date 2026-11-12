import {test,expect,type Page} from '@playwright/test';
const route={distanceMeters:200,durationSeconds:180,segments:[[{lat:37.5665,lng:126.978},{lat:37.5675,lng:126.978},{lat:37.5675,lng:126.979}]],steps:[{lat:37.5665,lng:126.978,description:'북쪽으로 직진',turnType:0},{lat:37.5675,lng:126.978,description:'오른쪽으로 이동',turnType:0}]};
async function setup(page:Page){
 await page.clock.install();
 await page.addInitScript(()=>{
  const state={calls:0,clears:[] as number[],ok:null as PositionCallback|null};Object.assign(window,{liveGps:state});
  navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);
  navigator.geolocation.watchPosition=ok=>{state.calls++;state.ok=ok;return state.calls;};navigator.geolocation.clearWatch=id=>state.clears.push(id);
  class Map{setCenter(){}fitBounds(){}destroy(){}}class LatLng{}class LatLngBounds{extend(){}}class Overlay{setMap(){}}
  window.Tmapv2={Map,LatLng,LatLngBounds,Marker:Overlay,Polyline:Overlay};
 });
 await page.route('**/api/navigation?**',r=>{const a=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:a==='config'?{searchConfigured:true}:a==='route'?{route}:{places:[{id:'live-test',name:'테스트 목적지',address:'검증용',category:'장소',lat:37.5675,lng:126.979}]}});});
 await page.goto('/?mode=live');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();
 await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('테스트 목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await expect(page.getByRole('button',{name:'길 안내 시작',exact:true})).toBeVisible();
}
async function emit(page:Page,lat:number,lng:number,accuracy=5){await page.evaluate(({lat,lng,accuracy})=>{(window as any).liveGps.ok({coords:{latitude:lat,longitude:lng,accuracy},timestamp:Date.now()});},{lat,lng,accuracy});}
test('실제 검색 경로에서 선택형 GPS·거리·단계·이탈·도착과 종료를 연결한다',async({page})=>{
 await setup(page);expect(await page.evaluate(()=>(window as any).liveGps.calls)).toBe(0);
 await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await emit(page,37.5665,126.978);
 await page.clock.fastForward(15000);await emit(page,37.567,126.978);await expect(page.getByTestId('live-remaining')).not.toHaveText('200m');
 await page.clock.fastForward(15000);await emit(page,37.5675,126.978);await page.getByText('자세히 보기',{exact:true}).click();await expect(page.getByText('안내 단계 2 / 2')).toBeVisible();await page.getByText('자세히 보기',{exact:true}).click();
 await page.clock.fastForward(1000);await emit(page,37.5682,126.978);await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
 await page.clock.fastForward(1000);await emit(page,37.5675,126.978);await expect(page.getByRole('heading',{name:'오른쪽으로 이동',exact:true})).toBeVisible();
 await page.clock.fastForward(15000);await emit(page,37.5675,126.9787);await page.clock.fastForward(10000);await emit(page,37.5675,126.979);
 await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.clock.fastForward(1000);await emit(page,37.5675,126.979);await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();await expect(page.getByTestId('live-remaining')).toHaveText('0m');await expect(page.locator('.journey-arrival-decoration')).toBeVisible();expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([1]);
});
test('일시중지는 추적을 해제하고 X 닫기는 안내를 유지한다',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();await emit(page,37.5665,126.978);
 await page.getByText('자세히 보기',{exact:true}).click();await page.getByRole('button',{name:'안내 일시중지',exact:true}).click();await page.clock.fastForward(1000);await emit(page,37.5675,126.979);await expect(page.getByTestId('live-remaining')).toHaveText('200m');
 await page.getByRole('button',{name:'안내 계속하기',exact:true}).click();await expect(page.getByTestId('live-remaining')).toHaveText('200m');await page.getByRole('button',{name:'안내 화면 닫기',exact:true}).click();expect(await page.evaluate(()=>(window as any).liveGps.clears)).toEqual([1]);await expect(page.getByRole('region',{name:'진행 중인 안내'})).toBeVisible();
 await emit(page,37.5675,126.979);await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
});
