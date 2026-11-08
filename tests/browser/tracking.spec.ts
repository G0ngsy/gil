import {test,expect} from '@playwright/test';
test('키나 위치 권한 없이 모의 이동·이탈·복귀·도착을 확인한다',async({page})=>{
 let apiCalls=0;page.on('request',r=>{if(r.url().includes('api/navigation')||r.url().includes('openapi.sk.com'))apiCalls++;});
 await page.goto('/?mode=simulation');await expect(page.getByText('모의 GPS · 예시 경로입니다.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'출발',exact:true}).click();await expect(page.getByTestId('remaining')).toHaveText('300m');
 await page.getByRole('button',{name:'직진 이동',exact:true}).click();await expect(page.getByTestId('remaining')).not.toHaveText('300m');
 await page.getByRole('button',{name:'회전 지점',exact:true}).click();await expect(page.getByText('안내 단계 2 / 3')).toBeVisible();
 await page.getByRole('button',{name:'경로 이탈',exact:true}).click();await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
 await page.getByRole('button',{name:'경로 복귀',exact:true}).click();await expect(page.getByText('안내 단계 3 / 3')).toBeVisible();
 await page.getByRole('textbox',{name:'오차(m)'}).fill('100');await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.getByRole('textbox',{name:'오차(m)'}).fill('5');await page.getByRole('button',{name:'도착',exact:true}).click();await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();await expect(page.getByTestId('remaining')).toHaveText('0m');
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
 await gpsMock(page);await page.goto('/?mode=simulation');
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{calls:number}}).gpsTest.calls)).toBe(0);
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await expect(page.getByRole('button',{name:'출발',exact:true})).toBeDisabled();
 await emit(page,37.5665,126.978);await emit(page,37.5675,126.978);await expect(page.getByText('안내 단계 2 / 3')).toBeVisible();
 await emit(page,37.5682,126.979);await expect(page.getByRole('heading',{name:'경로를 벗어났어요'})).toBeVisible();
 await emit(page,37.5675,126.9794);await expect(page.getByText('안내 단계 3 / 3')).toBeVisible();
 await page.getByRole('button',{name:'GPS 추적 중지',exact:true}).click();
 await emit(page,37.5675,126.980);await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await emit(page,37.5675,126.980);
 await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toBeVisible();await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{clears:number[]}}).gpsTest.clears)).toEqual([1,2]);
});
for(const code of [1,2,3])test(`GPS 오류 ${code} 후 해제하고 재시작할 수 있다`,async({page})=>{
 await gpsMock(page);await page.goto('/?mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await page.evaluate(code=>(window as unknown as {gpsTest:{fail:PositionErrorCallback}}).gpsTest.fail({code} as GeolocationPositionError),code);
 await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();await expect(page.getByRole('status')).toContainText(code===1?'위치 권한':code===2?'받지 못했어요':'초과');
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{clears:number[]}}).gpsTest.clears)).toEqual([1]);
});
test('오래되거나 부정확한 위치를 반영하지 않고 수신 중단 시 추적을 해제한다',async({page})=>{
 await page.clock.install();await gpsMock(page);await page.goto('/?mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await emit(page,37.5675,126.980,100);await expect(page.getByRole('heading',{name:'목적지에 도착했어요'})).toHaveCount(0);
 await page.evaluate(()=>(window as unknown as {gpsTest:{ok:PositionCallback}}).gpsTest.ok({coords:{latitude:37.5675,longitude:126.980,accuracy:5},timestamp:Date.now()-60000} as GeolocationPosition));
 await expect(page.getByRole('status')).toContainText('오래된 위치');await page.clock.fastForward(21000);
 await expect(page.getByRole('status')).toContainText('20초');await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();
});
for(const event of ['visibilitychange','pagehide'])test(`${event} 시 추적을 해제하고 자동 재시작하지 않는다`,async({page})=>{
 await gpsMock(page);await page.goto('/?mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();
 await page.evaluate(event=>{if(event==='visibilitychange'){Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event(event));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event(event));}else window.dispatchEvent(new Event(event));},event);
 await expect(page.getByRole('button',{name:'실제 GPS 추적 시작'})).toBeEnabled();
 expect(await page.evaluate(()=>(window as unknown as {gpsTest:{calls:number;clears:number[]}}).gpsTest)).toMatchObject({calls:1,clears:[1]});
});

test('시안으로 돌아가면 활성 GPS를 해제한다',async({page})=>{
 await gpsMock(page);await page.goto('/?mode=simulation');
 await page.evaluate(()=>{navigator.geolocation.clearWatch=id=>sessionStorage.setItem('gps-cleared',String(id));});
 await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await page.getByRole('button',{name:'시안으로 돌아가기'}).click();
 await expect(page.getByRole('textbox',{name:'목적지 검색',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>sessionStorage.getItem('gps-cleared'))).toBe('1');
});
