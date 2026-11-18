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
 await page.route('**/api/navigation?**',r=>{const action=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:action==='config'?{searchConfigured:true}:action==='route'?{route:original}:action==='address'?{location:{address:'테스트 주소',area:'테스트'}}:{places:[{id:'123',name:'기존 목적지',address:'테스트',category:'장소',lat:37.5675,lng:126.978}]}});});
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('목적지');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.locator('.result-card').click();await page.getByRole('button',{name:'도보 경로 찾기',exact:true}).click();await page.getByRole('button',{name:'길 안내 시작',exact:true}).click();
 await emit(page,37.5665);await page.clock.runFor(1000);await emit(page,37.5682);await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
}
async function emit(page:Page,lat:number,accuracy=5){await page.evaluate(({lat,accuracy})=>(window as any).rerouteTest.ok({coords:{latitude:lat,longitude:126.978,accuracy},timestamp:Date.now()}),{lat,accuracy});}


test('권한 거절→통신 단절→서버 지연→잘못된 경로 후에도 저장 안내로 재시도한다',async({page})=>{
 await setup(page);await page.reload();const panel=page.getByRole('region',{name:'이전 안내 복원'}),go=page.getByRole('button',{name:'이전 안내 이어가기'});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>fail?.({code:1} as GeolocationPositionError);});await go.click();await expect(panel.getByRole('alert')).toContainText('위치 권한');
 await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.5682,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition);});
 await page.route('**/api/navigation?action=route',r=>r.abort('internetdisconnected'));await go.click();await expect(panel.getByRole('alert')).toContainText('인터넷 연결');
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/api/navigation?action=route',async r=>{await gate;await r.fulfill({json:{route:replacement}}).catch(()=>{});});await go.click();await page.clock.runFor(20100);await expect(panel.getByRole('alert')).toContainText('응답 시간이 길어졌어요');release();
 await page.route('**/api/navigation?action=route',r=>r.fulfill({json:{route:{segments:[]}}}));await go.click();await expect(panel.getByRole('alert')).toContainText('받은 정보가 올바르지');expect(await page.evaluate(()=>Boolean(localStorage.getItem('gilbit.guidance.v1.live')))).toBe(true);await expect(page.getByTestId('live-remaining')).toHaveCount(0);
 await page.route('**/api/navigation?action=route',r=>r.fulfill({json:{route:replacement}}));await go.click();await expect(page.getByTestId('live-remaining')).toHaveText('300m');expect(errors).toEqual([]);
});
test('첫 서비스 설정이 지연돼도 재시도로 검색을 열 수 있다',async({page})=>{
 await page.clock.install();let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/api/navigation?action=config',async r=>{await gate;await r.fulfill({json:{searchConfigured:true}}).catch(()=>{});});await page.goto('/');await page.clock.runFor(20100);await expect(page.getByText(/응답 시간이 길어졌어요/)).toBeVisible();release();await page.route('**/api/navigation?action=config',r=>r.fulfill({json:{searchConfigured:true}}));await page.getByRole('button',{name:'다시 시도',exact:true}).click();await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();
});
