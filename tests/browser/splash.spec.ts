import {test,expect} from '@playwright/test';
test.use({reducedMotion:'no-preference'});
for(const kind of ['knots','steps']){
 for(const width of [360,390,430])test(`${kind} ${width}px: 2.8초 연출·중앙 로고·홈·겹침 없음`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto(`/?splash=${kind}`);
  const splash=page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'});await expect(splash).toBeVisible();await expect(page.locator('.door-intro')).toHaveCount(0);await expect(page.locator('[inert]')).toHaveCount(1);
  await page.waitForTimeout(950);await page.screenshot({path:`test-results/splash-${kind}-art-${width}.png`});
  await expect(page.locator(`.${kind}-splash__identity`)).toHaveCSS('opacity','1');const box=await page.locator(`.${kind}-splash__identity`).boundingBox();expect(Math.abs(box!.x+box!.width/2-width/2)).toBeLessThan(1);
  await page.screenshot({path:`test-results/splash-${kind}-logo-${width}.png`});await expect(splash).toHaveCount(0);await expect(page.locator('[inert]')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('splashSeen'))).toBeNull();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`${kind}: 분리된 컴포넌트의 cleanup과 중복 완료 방지`,async({page})=>{
  await page.clock.install();await page.route('**/__splash-harness?**',r=>r.fulfill({contentType:'text/html',body:'<div id="root"></div><script type="module" src="/tests/fixtures/splash-harness.tsx"></script>'}));
  await page.goto(`/__splash-harness?kind=${kind}`);await page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'}).waitFor();await page.evaluate(()=>(window as any).unmountSplash());await page.clock.fastForward(4000);expect(await page.evaluate(()=>(window as any).splashTest.completed)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('splashSeen'))).toBeNull();
  await page.reload();await page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'}).waitFor();await page.clock.fastForward(1000);await page.evaluate(()=>(window as any).rerenderSplash());await page.clock.fastForward(1850);expect(await page.evaluate(()=>(window as any).splashTest.completed)).toBe(1);
  await page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'}).click();await page.clock.fastForward(4000);expect(await page.evaluate(()=>(window as any).splashTest.completed)).toBe(1);
 });
}
test('기본 첫 방문·탭 스킵·새로고침 및 새 페이지에서 저장 유지',async({page,context})=>{
 await page.goto('/');const button=page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'});await button.click();await expect(button).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('splashSeen'))).toBe('true');await page.reload();await expect(button).toHaveCount(0);const next=await context.newPage();await next.goto('/');await expect(next.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toHaveCount(0);
});
test('키보드로도 즉시 건너뛰고 저장 차단이어도 홈으로 이동',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked');};Storage.prototype.setItem=()=>{throw new Error('blocked');};});await page.goto('/');await page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
});
test('동작 줄이기: 처음부터 및 재생 중 설정 변경 모두 즉시 종료',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toHaveCount(0);await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('splashSeen'))).toBe('true');await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/?splash=steps');await expect(page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toBeVisible();await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toHaveCount(0);
});
test('시안 기본 주소는 새 연출 없이, 기존 문 주소는 문만 실행',async({page})=>{
 await page.goto('/?preview=1');await expect(page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toHaveCount(0);await page.goto('/?intro=1');await expect(page.locator('.door-intro')).toBeVisible();await expect(page.getByRole('button',{name:'길빛 시작 화면 건너뛰기'})).toHaveCount(0);await page.getByRole('button',{name:'건너뛰기',exact:true}).click();await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();
});
