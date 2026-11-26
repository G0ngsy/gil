import {test,expect} from '@playwright/test';
test.use({reducedMotion:'no-preference'});
for(const width of [360,390,430,1280])test(`${width}px 문 열림 후 중앙 로고 등장·퇴장과 홈·세션 재진입`,async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.route('**/api/navigation?**',r=>r.fulfill({json:{searchConfigured:false}}));
 await page.goto('/?intro=1');
 const intro=page.getByRole('region',{name:'길빛 시작 화면'});
 await expect(intro).toBeVisible();await expect(page.locator('[inert]')).toHaveCount(1);
 const handle=await page.locator('.intro-door .refined-handle').first().boundingBox();expect(handle!.width).toBe(handle!.height);await expect(page.locator('.intro-door-art')).toHaveCount(0);
 await expect(page.locator('.intro-door').first()).toHaveCSS('transition-duration','1.1s');
 await expect(page.locator('.intro-door .brand')).toHaveCount(0);
 await expect(page.locator('.intro-center-logo')).toHaveCSS('opacity','0');
 await page.screenshot({path:`test-results/intro-closed-${width}.png`});
 await expect(page.locator('.door-intro-opening')).toBeVisible();
 await page.screenshot({path:`test-results/intro-opening-${width}.png`});
 await expect(page.locator('.door-intro-logo')).toBeVisible();await expect(page.locator('.intro-center-logo')).toHaveCSS('opacity','1');
 await page.screenshot({path:`test-results/intro-logo-${width}.png`});
 await expect(page.locator('.door-intro-logo-out')).toBeVisible();await expect(page.locator('.intro-center-logo')).toHaveCSS('opacity','0');
 await expect(page.locator('.intro-home-revealing')).toBeAttached();
 await expect(page.locator('.intro-home')).toHaveCSS('opacity','1');
 await expect(intro).toHaveCount(0);await expect(page.locator('.intro-home')).toHaveCSS('transform','none');await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
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

for(const delayed of [false,true])test(`기본 문은 이미지 준비 지연 ${delayed}에서도 시작 후 3000ms에 홈 전환 완료`,async({page})=>{
 if(delayed)await page.addInitScript(()=>{HTMLImageElement.prototype.decode=()=>new Promise(()=>{});});
 // 검증 중 실제 시간이 함께 흐르지 않도록 페이지를 열기 전에 시계를 멈춥니다.
 await page.clock.install({time:new Date('2026-11-26T04:00:00Z')});await page.clock.pauseAt(new Date('2026-11-26T04:00:01Z'));await page.goto('/?intro=1');
 await expect(page.locator('.door-intro-closed')).toBeVisible();
 await page.clock.runFor(300);await expect(page.locator('.door-intro-opening')).toBeVisible();
 await page.clock.runFor(1100);await expect(page.locator('.door-intro-logo')).toBeVisible();
 await page.clock.runFor(600);await expect(page.locator('.door-intro-logo-out')).toBeVisible();
 await page.clock.runFor(300);await expect(page.locator('.intro-home-revealing')).toBeAttached();
 await expect(page.locator('.intro-home-revealing')).toHaveCSS('transition-duration','0.7s, 0.7s');
 await page.clock.runFor(699);await expect(page.locator('.door-intro')).toHaveCount(1);
 await page.clock.runFor(1);await expect(page.locator('.door-intro')).toHaveCount(0);await expect(page.locator('[inert]')).toHaveCount(0);
});
