import {test,expect} from '@playwright/test';
for(const width of [360,430,1440]){
 test(`${width}px 기본 주소는 검토용 프레임 없이 앱만 표시한다`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.locator('.studio-intro')).not.toBeVisible();await expect(page.locator('.studio-controls')).not.toBeVisible();await expect(page.locator('.status-bar')).not.toBeVisible();await expect(page.locator('.phone-bottom')).not.toBeVisible();await expect(page.getByRole('button',{name:'시안 확인 메뉴'})).toHaveCount(0);
  const phone=page.locator('.phone');expect(await phone.evaluate(e=>getComputedStyle(e).borderTopWidth)).toBe('0px');expect(await phone.evaluate(e=>getComputedStyle(e).borderRadius)).toBe('0px');
  const bounds=await phone.boundingBox();expect(bounds?.height).toBe(900);expect(bounds?.width).toBe(Math.min(width,480));
  await page.screenshot({path:`test-results/app-shell-${width}.png`});
  await page.goto('/?screen=map');await expect(page.getByText('예시 경로',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'안내 화면 닫기'})).toBeVisible();
  await page.goto('/?mode=live');await expect(page.locator('.studio-intro')).not.toBeVisible();await expect(page.getByRole('button',{name:'예시 화면',exact:true})).toBeVisible();
 });
}
test('검토용 화면은 preview=1에서만 표시한다',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/?preview=1');await expect(page.locator('.studio-intro')).toBeVisible();await expect(page.locator('.studio-controls')).toBeVisible();await expect(page.locator('.status-bar')).toBeVisible();await page.getByRole('button',{name:'시안 확인 메뉴'}).first().click();await expect(page.locator('.preview-popover')).toBeVisible();
});
