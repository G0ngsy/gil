import {test,expect,type Page} from '@playwright/test';
const origin={lat:37.5665,lng:126.978};
async function setup(page:Page){
 await page.addInitScript(()=>{Object.assign(window,{geoCalls:0});navigator.geolocation.getCurrentPosition=ok=>{const n=(window as any).geoCalls++;ok({coords:{latitude:37.5665+n*0.001,longitude:126.978,accuracy:10},timestamp:Date.now()} as GeolocationPosition);};});
 await page.route('**/api/navigation?**',r=>{const action=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:action==='config'?{searchConfigured:true}:action==='address'?{location:{address:'서울특별시 중구 세종대로 110',area:'서울특별시 중구 태평로1가'}}:{places:[{id:'near',name:'근처 도서관',address:'서울 중구',category:'도서관',lat:37.567,lng:126.978}]}});});
}
test('현재 위치 주소 표시와 좌표가 본문에 담긴 주변 검색',async({page})=>{
 await setup(page);await page.goto('/');const panel=page.getByRole('region',{name:'현재 위치',exact:true});
 expect(await page.evaluate(()=>(window as any).geoCalls)).toBe(0);await panel.getByRole('button',{name:'현재 위치 확인',exact:true}).click();
 await expect(panel.getByText('서울특별시 중구 세종대로 110',{exact:true})).toBeVisible();await expect(page.getByRole('combobox',{name:'검색 범위'})).toHaveValue('nearby');
 const request=page.waitForRequest(r=>r.url().includes('action=search'));await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();
 const search=await request;expect(search.method()).toBe('POST');expect(search.postDataJSON()).toEqual({q:'도서관',center:origin});expect(search.url()).not.toContain('37.5665');await expect(page.getByText('주변 거리순',{exact:true})).toBeVisible();await expect(page.getByText(/직선 \d+m/)).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('37.5665');
});
test('위치가 없으면 전국 검색임을 표시하고 권한을 자동 요청하지 않는다',async({page})=>{
 await setup(page);await page.goto('/');await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');const request=page.waitForRequest(r=>r.url().includes('action=search'));await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();expect((await request).method()).toBe('GET');await expect(page.getByText('전국 관련도순',{exact:true})).toBeVisible();expect(await page.evaluate(()=>(window as any).geoCalls)).toBe(0);
});
test('주소 오류는 좌표를 유지하고 주변 검색은 계속할 수 있다',async({page})=>{
 await setup(page);await page.route('**/api/navigation?action=address',r=>r.fulfill({status:502,json:{error:{message:'주소 서비스 오류'}}}));await page.goto('/');await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await expect(page.getByText(/위치는 확인했지만 주소를 표시하지 못했어요/)).toBeVisible();await expect(page.getByRole('combobox',{name:'검색 범위'})).toHaveValue('nearby');await expect(page.getByRole('button',{name:'주소 다시 확인'})).toBeEnabled();
});
test('늦게 도착한 이전 위치 주소를 무시한다',async({page})=>{
 await setup(page);let first=true;await page.route('**/api/navigation?action=address',async r=>{if(first){first=false;await new Promise(resolve=>setTimeout(resolve,400));await r.fulfill({json:{location:{address:'이전 주소',area:'이전 동'}}});}else await r.fulfill({json:{location:{address:'새 위치 주소',area:'새 동'}}});});
 await page.goto('/');await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await page.getByRole('button',{name:'현재 위치 다시 확인',exact:true}).click();await expect(page.getByText('새 위치 주소',{exact:true})).toBeVisible();await page.waitForTimeout(500);await expect(page.getByText('이전 주소',{exact:true})).toHaveCount(0);
});
test('주변 결과가 없으면 사용자가 전국으로 넓힐 수 있다',async({page})=>{
 await setup(page);await page.route('**/api/navigation?action=search**',r=>r.fulfill({json:{places:[]}}));await page.goto('/');await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await page.getByRole('button',{name:'전국에서 다시 검색'}).click();await expect(page.getByText('전국 관련도순',{exact:true})).toBeVisible();
});

test('현재 위치를 확인해도 사용자가 전국 검색을 선택하면 위치를 보내지 않는다',async({page})=>{
 await setup(page);await page.goto('/');await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await expect(page.getByRole('combobox',{name:'검색 범위'})).toHaveValue('nearby');await page.getByRole('combobox',{name:'검색 범위'}).selectOption('national');await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');const next=page.waitForRequest(r=>r.url().includes('action=search'));await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();expect((await next).method()).toBe('GET');await expect(page.getByText('전국 관련도순',{exact:true})).toBeVisible();
});
test('2분 이상 지난 위치는 주변 검색 전에 새로 확인한다',async({page})=>{
 await page.clock.install();await setup(page);await page.goto('/');await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await expect(page.getByRole('combobox',{name:'검색 범위'})).toHaveValue('nearby');await page.clock.fastForward(120001);await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');const next=page.waitForRequest(r=>r.url().includes('action=search'));await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();expect((await next).postDataJSON().center.lat).toBeCloseTo(37.5675,8);expect(await page.evaluate(()=>(window as any).geoCalls)).toBe(2);
});

test('검색 설정 확인 중에 위치를 눌러도 주소 조회를 건너뛰지 않는다',async({page})=>{
 await setup(page);let finish:(()=>void)|undefined;const pending=new Promise<void>(resolve=>finish=resolve);
 await page.route('**/api/navigation?action=config',async r=>{await pending;await r.fulfill({json:{searchConfigured:true}});});
 await page.goto('/');await expect(page.getByText('검색 서비스 연결을 확인하고 있어요…')).toBeVisible();await page.getByRole('button',{name:'현재 위치 확인',exact:true}).click();await expect(page.getByText('서울특별시 중구 세종대로 110',{exact:true})).toBeVisible();finish!();
});
