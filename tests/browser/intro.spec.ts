import {test,expect} from '@playwright/test';
test.use({reducedMotion:'no-preference'});
for(const width of [360,390,430,1280])test(`${width}px 문과 로고 분리 후 홈·세션 재진입`,async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.route('**/api/navigation?**',r=>r.fulfill({json:{searchConfigured:false}}));
 await page.goto('/?intro=1');
 const intro=page.getByRole('region',{name:'길빛 시작 화면'});
 await expect(intro).toBeVisible();await expect(page.locator('[inert]')).toHaveCount(1);
 await page.locator('.intro-door-art').first().evaluate((img:HTMLImageElement)=>img.decode());
 await page.screenshot({path:`test-results/intro-closed-${width}.png`});
 await expect(page.locator('.door-intro-opening')).toBeVisible();
 await page.screenshot({path:`test-results/intro-opening-${width}.png`});
 await expect(intro).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/');await expect(intro).toHaveCount(0);
});
test('건너뛰기와 키보드 접근',async({page})=>{
 await page.goto('/?intro=1');await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'건너뛰기'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('.door-intro')).toHaveCount(0);await expect(page.locator('[inert]')).toHaveCount(0);
});
test('동작 줄이기 설정은 애니메이션 없이 홈',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('.door-intro')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
});
test('시안 직접 주소에는 인트로를 붙이지 않는다',async({page})=>{
 await page.goto('/?preview=1&screen=camera');await expect(page.locator('.door-intro')).toHaveCount(0);await expect(page.getByRole('button',{name:'실제 카메라 켜기',exact:true})).toBeVisible();
});
test('이미지 실패와 저장소 차단이어도 홈 진입',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked');};Storage.prototype.setItem=()=>{throw new Error('blocked');};});
 await page.route('**/assets/intro-*.png',r=>r.abort());await page.goto('/');await expect(page.locator('.door-intro')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
});
