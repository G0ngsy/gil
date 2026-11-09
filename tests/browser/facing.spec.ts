import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page){
 await page.clock.install();await page.clock.pauseAt(new Date('2030-01-01T00:00:00Z'));
 await page.goto('/?mode=simulation');await page.getByRole('button',{name:'출발',exact:true}).click();
 return page.getByRole('region',{name:'모의 방향 안내'});
}
test('0.8초 안정화 후 화살표와 문구를 유지하고 짧은 흔들림에는 전환하지 않는다',async({page})=>{
 const guide=await setup(page),card=guide.locator('.facing-card');
 await expect(card).toHaveAttribute('data-state','unknown');await page.clock.runFor(799);await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
 await page.clock.runFor(1);await expect(card).toHaveAttribute('data-state','forward');await expect(card.getByRole('heading')).toHaveText('이 방향으로 이동하세요');
 await guide.getByRole('button',{name:'오른쪽',exact:true}).click();await page.clock.runFor(400);await expect(card).toHaveAttribute('data-state','forward');
 await guide.getByRole('button',{name:'정방향',exact:true}).click();await page.clock.runFor(1000);await expect(card).toHaveAttribute('data-state','forward');
 await guide.getByRole('button',{name:'오른쪽',exact:true}).click();await page.clock.runFor(800);await expect(card).toHaveAttribute('data-state','right');await expect(card.getByRole('heading')).toHaveText('오른쪽으로 방향을 맞춰 주세요');
 await page.clock.runFor(60000);await expect(guide.getByTestId('facing-arrow')).toHaveCount(1);await expect(card.getByRole('heading')).toHaveText('오른쪽으로 방향을 맞춰 주세요');
 for(const [label,state,text] of [['왼쪽','left','왼쪽으로 방향을 맞춰 주세요'],['반대','opposite','반대쪽으로 방향을 맞춰 주세요']] as const){await guide.getByRole('button',{name:label,exact:true}).click();await page.clock.runFor(800);await expect(card).toHaveAttribute('data-state',state);await expect(card.getByRole('heading')).toHaveText(text);}
});
test('확인 불가·오차·경계값은 즉시 화살표를 숨기고 대기 중 전환도 취소한다',async({page})=>{
 const guide=await setup(page),card=guide.locator('.facing-card');await page.clock.runFor(800);
 await guide.getByRole('button',{name:'반대',exact:true}).click();await page.clock.runFor(400);await guide.getByRole('button',{name:'확인 불가',exact:true}).click();
 await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(card.getByRole('heading')).toHaveText('방향을 확인하고 있어요');await page.clock.runFor(1000);await expect(card).toHaveAttribute('data-state','unknown');
 await guide.getByRole('button',{name:'정방향',exact:true}).click();await page.clock.runFor(800);await expect(card).toHaveAttribute('data-state','forward');
 await guide.getByRole('spinbutton',{name:'모의 방향 오차 (도)'}).fill('21');await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
 await guide.getByRole('spinbutton',{name:'모의 방향 오차 (도)'}).fill('5');await guide.getByRole('spinbutton',{name:'모의 방위각 (도)'}).fill('335');await page.clock.runFor(1000);await expect(card).toHaveAttribute('data-state','unknown');
 await guide.getByRole('spinbutton',{name:'모의 방위각 (도)'}).fill('361');await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
});
test('경로가 꺾이면 고정 모의 휴대폰 방위를 새 경로 방향과 비교하고 종료 시 초기화한다',async({page})=>{
 const guide=await setup(page),card=guide.locator('.facing-card');await page.clock.runFor(800);
 await page.getByRole('button',{name:'직진 이동',exact:true}).click();await page.getByRole('button',{name:'회전 지점',exact:true}).click();await page.clock.runFor(800);await expect(card).toHaveAttribute('data-state','right');
 await page.getByRole('button',{name:'경로 이탈',exact:true}).click();await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(card).toContainText('경로로 돌아온 뒤');
 await page.getByRole('button',{name:'경로 복귀',exact:true}).click();await page.clock.runFor(800);await expect(card).toHaveAttribute('data-state','right');
 await page.getByRole('button',{name:'도착',exact:true}).click();await page.getByRole('button',{name:'도착',exact:true}).click();await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(card).toContainText('이동 안내를 마쳤어요.');
 await page.getByRole('button',{name:'지도 안내 종료',exact:true}).click();await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await page.clock.runFor(1000);await expect(guide.locator('.facing-card')).toHaveAttribute('data-state','unknown');
});
test('실제 GPS 선택과 경로 변경은 모의 방향을 지우고 센서 권한을 자동 요청하지 않는다',async({page})=>{
 await page.addInitScript(()=>{Object.assign(window,{watchCalls:0});navigator.geolocation.watchPosition=()=>{(window as unknown as {watchCalls:number}).watchCalls++;return 1;};navigator.geolocation.clearWatch=()=>{};});
 const guide=await setup(page);await page.clock.runFor(800);expect(await page.evaluate(()=>(window as unknown as {watchCalls:number}).watchCalls)).toBe(0);
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(guide).toContainText('모의 GPS 안내에서만');
 await page.getByText('현장 테스트 경로 설정',{exact:true}).click();await page.getByRole('textbox',{name:'테스트 경로 좌표'}).fill('35.1,129.1\n35.1005,129.1');await page.getByRole('button',{name:'현장 경로 적용'}).click();await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(guide.getByRole('button',{name:'정방향',exact:true})).toBeDisabled();
 await page.clock.runFor(1000);await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
});
for(const width of [360,390,430])test(`${width}px 반대 방향 카드와 조작에 가로 넘침이 없다`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});const guide=await setup(page);await guide.getByRole('button',{name:'반대',exact:true}).click();await page.clock.runFor(800);
 await expect(guide.locator('.facing-card')).toHaveAttribute('data-state','opposite');await expect(guide.getByRole('button',{name:'반대',exact:true})).toHaveAttribute('aria-pressed','true');await guide.scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/facing-card-${width}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await guide.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
});
