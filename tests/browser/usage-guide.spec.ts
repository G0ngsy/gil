import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page){
 await page.addInitScript(()=>{
  const state={location:0,camera:0};Object.assign(window,{usageTest:state});
  navigator.geolocation.getCurrentPosition=()=>{state.location++;};navigator.geolocation.watchPosition=()=>{state.location++;return 1;};
  navigator.mediaDevices.getUserMedia=async()=>{state.camera++;throw new Error('unexpected camera');};
  if(!localStorage.getItem('usage-seeded')){localStorage.setItem('gilbit.history.v1.live',JSON.stringify({version:1,searches:['도서관'],destinations:[{id:'1',name:'중앙도서관',address:'시험 주소'}]}));localStorage.setItem('usage-seeded','1');}
 });
 await page.route('**/api/navigation?action=config',r=>r.fulfill({json:{searchConfigured:true}}));
 await page.goto('/');await expect(page.getByRole('button',{name:'실제 장소 검색',exact:true})).toBeEnabled();
}
test('안내 열기는 권한·추가 API 요청·기록 삭제 없이 표시하고 뒤로가기로 홈에 돌아간다',async({page})=>{
 await setup(page);const before=await page.evaluate(()=>localStorage.getItem('gilbit.history.v1.live'));const calls:string[]=[];page.on('request',r=>{if(r.url().includes('/api/navigation'))calls.push(r.url());});
 await page.getByRole('button',{name:'개인정보·이용 안내',exact:true}).click();await expect(page.getByRole('heading',{name:'개인정보·이용 안내',exact:true})).toBeVisible();await expect(page.locator('main')).toBeFocused();await page.screenshot({path:'test-results/usage-guide-390.png'});await expect(page.getByRole('heading',{name:'검색·지도에 필요한 정보 전달'})).toBeVisible();expect(await page.evaluate(()=>(window as any).usageTest)).toEqual({location:0,camera:0});expect(calls).toEqual([]);expect(await page.evaluate(()=>localStorage.getItem('gilbit.history.v1.live'))).toBe(before);await page.goBack();await expect(page.locator('.home-hero')).toBeVisible();
});
test('안내에서 기록 관리·전체 삭제를 사용하고 뒤로가면 안내로 돌아간다',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'개인정보·이용 안내',exact:true}).click();await page.getByRole('button',{name:'이용 기록 관리',exact:true}).click();await expect(page.locator('.header-title')).toHaveText('이용 기록');await page.getByRole('button',{name:'전체 삭제',exact:true}).click();await page.getByRole('button',{name:'모두 삭제하기',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('gilbit.history.v1.live'))).toBe(null);await page.goBack();await expect(page.getByRole('heading',{name:'개인정보·이용 안내',exact:true})).toBeVisible();
});
for(const width of [320,360,430])test(`${width}px 큰 글씨에서도 읽기·외부 링크·기록 관리가 가능하다`,async({page})=>{
 await page.setViewportSize({width,height:720});await setup(page);await page.addStyleTag({content:'html{font-size:200%!important}'});await page.getByRole('button',{name:'개인정보·이용 안내',exact:true}).click();expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);for(const link of await page.locator('.usage-links a').all()){await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel',/noopener/);await expect(link).toHaveAccessibleName(/새 창/);}const manage=page.getByRole('button',{name:'이용 기록 관리',exact:true});await manage.scrollIntoViewIfNeeded();await expect(manage).toBeInViewport();expect((await manage.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
