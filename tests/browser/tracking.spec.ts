import {test,expect} from '@playwright/test';
test('키나 위치 권한 없이 모의 이동·이탈·복귀·도착을 확인한다',async({page})=>{
 let apiCalls=0;page.on('request',r=>{if(r.url().includes('api/navigation')||r.url().includes('openapi.sk.com'))apiCalls++;});
 await page.goto('/?preview=1&mode=simulation');await expect(page.getByText('모의 GPS · 예시 경로입니다.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'출발',exact:true}).click();await expect(page.getByTestId('remaining')).toHaveText('300m');
 await page.getByRole('button',{name:'직진 이동',exact:true}).click();await expect(page.getByTestId('remaining')).not.toHaveText('300m');
 await page.getByRole('button',{name:'회전 지점',exact:true}).click();await expect(page.getByText('안내 단계 2 / 3')).toBeVisible();
 await page.getByRole('button',{name:'경로 이탈',exact:true}).click();await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
 await page.getByRole('button',{name:'경로 복귀',exact:true}).click();await expect(page.getByText('안내 단계 3 / 3')).toBeVisible();
 await page.getByRole('textbox',{name:'오차(m)'}).fill('100');await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.getByRole('textbox',{name:'오차(m)'}).fill('5');await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();await expect(page.getByTestId('remaining')).toHaveText('0m');
 await page.getByRole('button',{name:'추적 초기화'}).click();await expect(page.getByTestId('remaining')).toHaveText('300m');expect(apiCalls).toBe(0);
});

async function gpsMock(page:import('@playwright/test').Page){
 await page.addInitScript(()=>{
  const state={calls:0,clears:[] as number[],ok:null as PositionCallback|null,fail:null as PositionErrorCallback|null};
  Object.assign(window,{gpsTest:state});
  navigator.geolocation.watchPosition=(ok,fail)=>{state.calls++;state.ok=ok;state.fail=fail??null;return state.calls;};
  navigator.geolocation.clearWatch=id=>{state.clears.push(id);};
 });
}
async function emit(page:import('@playwright/test').Page,lat:number,lng:number,accuracy=5){
 await page.evaluate(({lat,lng,accuracy})=>{
  const w=window as unknown as {gpsTest:{ok:PositionCallback}};
  w.gpsTest.ok({coords:{latitude:lat,longitude:lng,accuracy},timestamp:Date.now()} as GeolocationPosition);
 },{lat,lng,accuracy});
}
test('GPS는 선택 후 시작하고 중지·재시작·도착 시 해제하며 늦은 콜백을 무시한다',async({page})=>{
 await page.clock.install();await gpsMock(page);await page.goto('/?preview=1&mode=simulation');
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{calls:number}}).gpsTest.calls)).toBe(0);
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await expect(page.getByRole('button',{name:'출발',exact:true})).toBeDisabled();
 await emit(page,37.5665,126.978);await page.clock.fastForward(15000);await emit(page,37.567,126.978);await page.clock.fastForward(15000);await emit(page,37.5675,126.978);await expect(page.getByText('안내 단계 2 / 3')).toBeVisible();
 await emit(page,37.5682,126.979);await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
 await emit(page,37.5675,126.979);await expect(page.getByText('안내 단계 3 / 3')).toBeVisible();
 await page.getByRole('button',{name:'GPS 추적 중지',exact:true}).click();
 await emit(page,37.5675,126.980);await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,37.5675,126.980);await page.clock.fastForward(1000);await emit(page,37.5675,126.980);
 await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{clears:number[]}}).gpsTest.clears)).toEqual([1,2]);
});
for(const code of [1,2,3])test(`GPS 오류 ${code} 후 해제하고 재시작할 수 있다`,async({page})=>{
 await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await page.evaluate(code=>(window as unknown as {gpsTest:{fail:PositionErrorCallback}}).gpsTest.fail({code} as GeolocationPositionError),code);
 await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();await expect(page.getByRole('status')).toContainText(code===1?'위치 권한':code===2?'받지 못했어요':'초과');
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{clears:number[]}}).gpsTest.clears)).toEqual([1]);
});
test('오래되거나 부정확한 위치를 반영하지 않고 수신 중단 시 추적을 해제한다',async({page})=>{
 await page.clock.install();await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await emit(page,37.5675,126.980,100);await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.evaluate(()=>(window as unknown as {gpsTest:{ok:PositionCallback}}).gpsTest.ok({coords:{latitude:37.5675,longitude:126.980,accuracy:5},timestamp:Date.now()-60000} as GeolocationPosition));
 await expect(page.getByRole('status')).toContainText('오래된 위치');await page.clock.fastForward(21000);
 await expect(page.getByRole('status')).toContainText('20초');await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();
});
for(const event of ['visibilitychange','pagehide'])test(`${event} 시 추적을 해제하고 자동 재시작하지 않는다`,async({page})=>{
 await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await page.evaluate(event=>{if(event==='visibilitychange'){Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event(event));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event(event));}else window.dispatchEvent(new Event(event));},event);
 await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{calls:number;clears:number[]}}).gpsTest)).toMatchObject({calls:1,clears:[1]});
});

test('시안으로 돌아가면 활성 GPS를 해제한다',async({page})=>{
 await gpsMock(page);await page.goto('/?preview=1&mode=simulation');
 await page.evaluate(()=>{navigator.geolocation.clearWatch=id=>sessionStorage.setItem('gps-cleared',String(id));});
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await page.getByRole('button',{name:'시안으로 돌아가기'}).click();
 await expect(page.getByRole('textbox',{name:'목적지 검색',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>sessionStorage.getItem('gps-cleared'))).toBe('1');
});

test('실제 GPS의 순간적인 목적지 점프는 도착과 단계 전환으로 쓰지 않는다',async({page})=>{
 await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await emit(page,37.5665,126.978);await emit(page,37.5675,126.980);
 await expect(page.getByRole('alert')).toContainText('이동 속도');await expect(page.getByTestId('remaining')).toHaveText('300m');await expect(page.getByText('안내 단계 1 / 3')).toBeVisible();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.getByRole('button',{name:'GPS 추적 중지',exact:true}).click();
});

for(const width of [360,390,430])test(`${width}px 경로 도식에 이동·이탈·복귀·종료를 표시하고 가로 넘침이 없다`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/?preview=1&mode=simulation');
 const map=page.getByRole('region',{name:'예시 경로 지도 안내'});
 await expect(map.getByText('실제 지도·도로 정보가 아니에요.')).toBeVisible();await expect(map.getByTestId('current-position')).toHaveCount(0);
 await page.getByRole('button',{name:'모의 지도 안내 시작'}).click();await page.getByRole('button',{name:'출발',exact:true}).click();
 const origin=await map.getByTestId('current-position').getAttribute('transform');
 await page.getByRole('button',{name:'직진 이동',exact:true}).click();await expect(map.getByTestId('current-position')).not.toHaveAttribute('transform',origin!);
 await page.getByRole('button',{name:'회전 지점',exact:true}).click();await page.getByRole('button',{name:'다음 안내',exact:true}).click();await expect(map.getByTestId('completed-route')).toHaveCount(1);const travelled=await map.getByTestId('completed-route').getAttribute('points');
 const svg=map.getByRole('img');const whole=await svg.getAttribute('viewBox');await map.getByRole('button',{name:'현재 위치 보기'}).click();await expect(svg).not.toHaveAttribute('viewBox',whole!);
 await map.getByRole('button',{name:'전체 경로 보기'}).click();await expect(svg).toHaveAttribute('viewBox',whole!);
 await page.getByRole('button',{name:'경로 이탈',exact:true}).click();await expect(map.locator('.off-route')).toHaveCount(1);await expect(map.getByTestId('completed-route')).toHaveAttribute('points',travelled!);
 await page.getByRole('button',{name:'경로 복귀',exact:true}).click();await expect(map.locator('.off-route')).toHaveCount(0);
 await map.scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/tracking-map-${width}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'지도 안내 종료',exact:true}).click();await expect(map.getByTestId('current-position')).toHaveCount(0);await expect(map.getByTestId('completed-route')).toHaveCount(0);await expect(page.getByRole('region',{name:'지도 안내 제어'})).toContainText('안내 대기');
});

test('지도는 거부된 GPS 위치로 이동하지 않고 종료 후 늦은 GPS도 무시한다',async({page})=>{
 await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,37.5665,126.978);
 const marker=page.getByTestId('current-position');const before=await marker.getAttribute('transform');await emit(page,37.5675,126.980);
 await expect(page.getByRole('alert')).toContainText('이동 속도');await expect(marker).toHaveAttribute('transform',before!);
 await page.getByRole('button',{name:'지도 안내 종료',exact:true}).click();await emit(page,37.5675,126.979);await expect(marker).toHaveCount(0);
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{clears:number[]}}).gpsTest.clears)).toEqual([1]);
});

test('경로 밖 GPS도 현재 위치 보기로 확인하고 수신 중단 시 마지막 위치를 표시한다',async({page})=>{
 await page.clock.install();await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,37.6,127);
 const map=page.getByRole('region',{name:'예시 경로 지도 안내'});await expect(map.getByRole('note')).toContainText('범위 밖');
 await map.getByRole('button',{name:'현재 위치 보기'}).click();await expect(map.getByRole('note')).toHaveCount(0);
 await page.clock.fastForward(21000);await expect(page.getByRole('region',{name:'지도 안내 제어'})).toContainText('마지막 반영 위치');await expect(page.getByTestId('current-position')).toHaveCount(1);
 await page.getByRole('button',{name:'출발',exact:true}).click();await expect(page.getByRole('region',{name:'지도 안내 제어'})).toContainText('모의 좌표 안내 중');await expect(page.getByTestId('remaining')).toHaveText('300m');
});

test('현장 경로 적용은 GPS를 해제하고 거리·위치·단계를 새 경로로 초기화한다',async({page})=>{
 await gpsMock(page);let apiCalls=0;page.on('request',request=>{if(request.url().includes('api/navigation')||request.url().includes('openapi.sk.com'))apiCalls++;});
 await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,37.5665,126.978);await expect(page.getByTestId('current-position')).toHaveCount(1);
 await page.getByText('현장 테스트 경로 설정',{exact:true}).click();await page.getByRole('textbox',{name:'테스트 경로 좌표'}).fill('35.1,129.1\n35.1005,129.1\n35.101,129.1');await page.getByRole('button',{name:'현장 경로 적용'}).click();
 await expect(page.getByTestId('current-position')).toHaveCount(0);await expect(page.getByTestId('remaining')).toHaveText('111m');await expect(page.getByText('출발 테스트 지점',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'출발',exact:true})).toHaveCount(0);
 await emit(page,37.5675,126.980);await expect(page.getByTestId('current-position')).toHaveCount(0);expect(await page.evaluate(()=>(window as unknown as {gpsTest:{clears:number[]}}).gpsTest.clears)).toEqual([1]);
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,35.1,129.1);await expect(page.getByTestId('current-position')).toHaveAttribute('transform','translate(0 0)');await page.getByRole('button',{name:'GPS 추적 중지',exact:true}).click();
 await page.getByRole('button',{name:'서울시청 예시로 복원'}).click();await expect(page.getByTestId('remaining')).toHaveText('300m');await expect(page.getByRole('button',{name:'출발',exact:true})).toBeVisible();expect(apiCalls).toBe(0);
});

test('현장 입력 오류는 기존 경로와 추적을 보존하며 새로고침 후 좌표를 저장하지 않는다',async({page})=>{
 await gpsMock(page);await page.goto('/?preview=1&mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,37.5665,126.978);
 await page.getByText('현장 테스트 경로 설정',{exact:true}).click();await page.getByRole('textbox',{name:'테스트 경로 좌표'}).fill('35,129\n35,129');await page.getByRole('button',{name:'현장 경로 적용'}).click();await expect(page.getByRole('alert')).toContainText('5~500m');await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeDisabled();await expect(page.getByTestId('current-position')).toHaveCount(1);
 await page.getByRole('textbox',{name:'테스트 경로 좌표'}).fill('35.1,129.1\n35.1005,129.1');await page.getByRole('button',{name:'현장 경로 적용'}).click();await expect(page.getByTestId('remaining')).toHaveText('56m');
 await page.reload();await expect(page.getByTestId('remaining')).toHaveText('300m');await page.getByText('현장 테스트 경로 설정',{exact:true}).click();await expect(page.getByRole('textbox',{name:'테스트 경로 좌표'})).toHaveValue('');
});

for(const width of [360,430])test(`${width}px 現場 경로 편집과 적용된 도식이 화면에 들어온다`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/?preview=1&mode=simulation');await page.getByText('현장 테스트 경로 설정',{exact:true}).click();await page.getByRole('textbox',{name:'테스트 경로 좌표'}).fill('35.1,129.1\n35.1005,129.1\n35.101,129.1');await page.getByRole('button',{name:'현장 경로 적용'}).click();await page.getByRole('region',{name:'예시 경로 지도 안내'}).scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/field-route-${width}.png`});
});
