import {test,expect} from '@playwright/test';
for(const width of [360,390,430])test(`${width}px 전통 구분선과 도착 버튼 배치`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.route('**/api/navigation?**',r=>r.fulfill({json:{searchConfigured:true}}));await page.goto('/');await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
 const divider=page.locator('.home-history-divider');await expect(divider).toBeVisible();
 const location=await page.getByRole('region',{name:'현재 위치',exact:true}).boundingBox();const line=await divider.boundingBox();const history=await page.locator('.history-panel').boundingBox();expect(line!.y).toBeGreaterThan(location!.y+location!.height);expect(line!.y+line!.height).toBeLessThanOrEqual(history!.y);
 expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:`test-results/ornament-home-${width}.png`});
 await page.goto('/?preview=1&screen=arrival');await expect(page.locator('.arrival-decoration.ornamental-lotus')).toBeVisible();await expect(page.getByRole('button',{name:'안내 마치기',exact:true})).toBeInViewport();await expect(page.getByRole('button',{name:'다른 목적지 찾기',exact:true})).toBeInViewport();expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:`test-results/ornament-arrival-${width}.png`});
});
