import {test,expect} from '@playwright/test';
test.use({reducedMotion:'no-preference'});
for(const width of [360,390,430])test(`${width}px 개선안 3초·문고리 비율·단독 재생·홈`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/?intro=refined');await expect(page.getByRole('region',{name:'문 열림 개선안 미리보기'})).toBeVisible();await expect(page.locator('.door-intro,.knots-splash,.steps-splash')).toHaveCount(0);
 const handle=await page.locator('.refined-handle').first().boundingBox();expect(handle!.width).toBe(handle!.height);await page.screenshot({path:`test-results/refined-closed-${width}.png`});
 await expect(page.locator('.refined-logo')).toBeVisible();await expect(page.locator('.refined-identity')).toHaveCSS('opacity','1');await page.screenshot({path:`test-results/refined-logo-${width}.png`});await expect(page.locator('.refined-home-reveal')).toBeAttached();await expect(page.locator('.refined-intro')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();await expect(page.locator('.refined-home')).toHaveCSS('transform','none');
 expect(await page.evaluate(()=>localStorage.getItem('splashSeen'))).toBeNull();expect(await page.evaluate(()=>sessionStorage.getItem('gilbit.intro.seen.v1'))).toBeNull();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('개선안 스킵과 동작 줄이기는 즉시 홈으로',async({page})=>{
 await page.goto('/?intro=refined');await page.getByRole('button',{name:'건너뛰기',exact:true}).click();await expect(page.locator('[inert]')).toHaveCount(0);await expect(page.locator('.refined-intro')).toHaveCount(0);await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await expect(page.locator('.refined-intro')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
});
