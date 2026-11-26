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


const title=(page:Page,text:string)=>page.locator('.header-title').filter({hasText:text});
test('브라우저 뒤로가기는 지도→경로→검색→홈 순서이며 홈에서는 이전 웹페이지로 나간다',async({page})=>{
 await page.route('https://gilbit-back-test.invalid/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<h1>외부 시작 페이지</h1>'}));await page.goto('https://gilbit-back-test.invalid/');await setup(page);
 await page.goBack();await expect(title(page,'도보 경로 확인')).toBeVisible();await page.goBack();await expect(title(page,'장소 검색')).toBeVisible();await page.goBack();await expect(page.locator('.home-hero')).toBeVisible();await page.goBack();await expect(page.getByRole('heading',{name:'외부 시작 페이지'})).toBeVisible();
});
test('상단 뒤로가기와 브라우저 뒤로가기를 섞어도 한 단계씩 돌아간다',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'뒤로 가기',exact:true}).click();await expect(title(page,'도보 경로 확인')).toBeVisible();await page.goBack();await expect(title(page,'장소 검색')).toBeVisible();await page.getByRole('button',{name:'뒤로 가기',exact:true}).click();await expect(page.locator('.home-hero')).toBeVisible();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toBeVisible();
});
test('기록에서 검색했으면 검색 뒤로가기는 기록으로 돌아간다',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'안내 화면 닫기'}).click();await expect(page.locator('.home-hero')).toBeVisible();await page.getByRole('button',{name:'기록 자세히 보기'}).click();await expect(title(page,'이용 기록')).toBeVisible();await page.getByRole('button',{name:'목적지 다시 검색',exact:true}).click();await expect(title(page,'장소 검색')).toBeVisible();await page.goBack();await expect(title(page,'이용 기록')).toBeVisible();
});
test('종료 확인에서 뒤로가기는 확인창만 닫고 안내를 유지한다',async({page})=>{
 await setup(page);await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.goBack();await expect(page.getByRole('dialog')).not.toBeVisible();await expect(title(page,'길 안내')).toBeVisible();await expect(page.getByTestId('live-remaining')).toHaveText('200m');
});
test('안내 종료 후 앞으로가기로 이전 안내를 되살리지 않는다',async({page})=>{
 await setup(page);await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();await expect(page.getByRole('heading',{name:/길 안내를\s*마쳤어요/})).toBeVisible();await page.getByRole('button',{name:'뒤로 가기',exact:true}).click();await expect(page.locator('.home-hero')).toBeVisible();await page.goForward();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toHaveCount(0);await expect(page.getByTestId('live-remaining')).toHaveCount(0);
});

test('새로고침 후 홈 뒤로가기는 과거 경로 화면을 되살리지 않고 외부로 나간다',async({page})=>{
 await page.route('https://gilbit-back-test.invalid/',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<h1>외부 시작 페이지</h1>'}));await page.goto('https://gilbit-back-test.invalid/');await setup(page);await page.reload();await expect(page.getByRole('region',{name:'이전 안내 복원'})).toBeVisible();await page.goBack();await expect(page.getByRole('heading',{name:'외부 시작 페이지'})).toBeVisible();
});

for(const action of ['안내 마치기','다른 목적지 찾기'])test('종료 화면에서 '+action+' 이동 후 안내는 복원되지 않는다',async({page})=>{await setup(page);await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();await expect(page.getByRole('heading',{name:/길 안내를\s*마쳤어요/})).toBeVisible();await expect(page.locator('.ended-destination')).toHaveText('기존 목적지');await page.getByRole('button',{name:action,exact:true}).click();await expect(page.locator('.home-hero')).toBeVisible();await page.goForward();await expect(page.getByTestId('live-remaining')).toHaveCount(0);await expect(page.getByRole('region',{name:'진행 중인 안내'})).toHaveCount(0);});

test('종료 화면은 작은 화면과 큰 글씨에서도 버튼이 잘리지 않는다',async({page})=>{await page.setViewportSize({width:320,height:720});await setup(page);await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();await expect(page.getByRole('heading',{name:/길 안내를\s*마쳤어요/})).toBeVisible();await page.screenshot({path:'test-results/guidance-ended-320.png'});await page.addStyleTag({content:'html{font-size:200%!important}'});expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);const home=page.getByRole('button',{name:'안내 마치기',exact:true});await home.scrollIntoViewIfNeeded();await expect(home).toBeInViewport();await home.click();await expect(page.locator('.home-hero')).toBeVisible();});

test('종료는 기존 시안의 연꽃·목적지·선택 평가를 표시한다',async({page})=>{await setup(page);await page.locator('.journey-remaining').getByRole('button',{name:'안내 종료',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'안내 종료',exact:true}).click();await expect(page.getByRole('heading',{name:/길 안내를\s*마쳤어요/})).toBeVisible();await expect(page.locator('.ended-screen .arrival-decoration')).toBeVisible();await expect(page.locator('.ended-destination')).toHaveText('기존 목적지');await expect(page.locator('.arrival-trip')).toHaveCount(0);await page.getByRole('button',{name:'도움이 됐어요',exact:true}).click();await expect(page.getByRole('button',{name:'도움이 됐어요',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByText('의견을 들려주셔서 고마워요.')).toBeVisible();await page.screenshot({path:'test-results/ended-original-design-390.png',fullPage:true});await page.getByRole('button',{name:'보통이에요',exact:true}).click();await expect(page.getByRole('button',{name:'도움이 됐어요',exact:true})).toHaveAttribute('aria-pressed','false');});
