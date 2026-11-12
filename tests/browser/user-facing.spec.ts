import {test,expect} from '@playwright/test';
for(const width of [360,390,430])test(`${width}px 사용자 화면·선택 카드·재확인 장식`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.route('**/api/navigation?**',r=>{const action=new URL(r.request().url()).searchParams.get('action');return r.fulfill({json:action==='config'?{searchConfigured:true}:{places:[{id:'one',name:'서울도서관',address:'서울 중구',category:'도서관',lat:37.5665,lng:126.978},{id:'two',name:'작은도서관',address:'서울 종로구',category:'도서관',lat:37.57,lng:126.98}]}});});await page.goto('/');
 await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
 for(const text of ['주소·주변 검색에는 현재 위치','TMAP 장소·도보 경로 연결','연결 준비됨','현재 좌표를 서버와 TMAP'])await expect(page.getByText(text,{exact:false})).toHaveCount(0);
 await expect(page.locator('.live-bottom,.location-disclosure,.live-privacy')).toHaveCount(0);
 await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await expect(page.locator('.selected-result')).toHaveCount(0);
 await page.getByRole('button',{name:/서울도서관/}).click();await expect(page.locator('.selected-destination .selection-corner')).toBeVisible();await expect(page.getByRole('button',{name:'현재 위치 확인',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'뒤로 가기',exact:true}).click();await expect(page.locator('.selected-result')).toHaveCount(1);await expect(page.locator('.selected-result')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.selected-result .selection-corner')).toBeVisible();await expect(page.locator('.result-card:not(.selected-result) .selection-corner')).toHaveCount(0);
 expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:`test-results/user-search-${width}.png`});
 await page.goto('/?preview=1&screen=recheck');await expect(page.locator('.recheck-icon .motif-cloud')).toBeVisible();await expect(page.locator('.direction-arrow')).toHaveCount(0);await expect(page.getByRole('button',{name:'다시 확인',exact:true})).toBeInViewport();await page.screenshot({path:`test-results/user-recheck-${width}.png`});
});
