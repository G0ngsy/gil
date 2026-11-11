import {test,expect} from '@playwright/test';
for(const width of [360,390,430])test(`${width}px 홈 배경은 인트로 수채 이미지이고 검색·위치 버튼은 유지된다`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.route('**/api/navigation?**',r=>r.fulfill({json:{searchConfigured:true,places:[]}}));await page.goto('/');
 await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
 const hero=page.locator('.landscape-home-hero');expect(await hero.evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('intro-landscape.png');await expect(hero.locator('.hanok-art,.lattice')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'현재 위치 확인',exact:true})).toBeInViewport();expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.screenshot({path:`test-results/home-landscape-${width}.png`});await page.getByRole('textbox',{name:'실제 목적지 검색'}).fill('도서관');await page.getByRole('button',{name:'실제 장소 검색',exact:true}).click();await expect(page.getByRole('textbox',{name:'검색어',exact:true})).toBeVisible();await expect(hero).toHaveCount(0);
});
