import {test,expect,type Page,type Locator} from '@playwright/test';
async function setup(page:Page,permission='granted',pending=false){
 await page.clock.install({time:new Date('2026-11-08T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-09T00:00:00Z'));
 await page.addInitScript(({permission,pending})=>{
  const state={permissionCalls:0,absolute:null as boolean|null,position:null as PositionCallback|null,grant:null as ((value:string)=>void)|null,listeners:0};Object.assign(window,{sensorTest:state});
  Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:class {static requestPermission(absolute:boolean){state.permissionCalls++;state.absolute=absolute;return pending?new Promise<string>(resolve=>state.grant=resolve):Promise.resolve(permission);}}});
  Object.defineProperty(screen,'orientation',{configurable:true,value:Object.assign(new EventTarget(),{angle:0})});
  navigator.geolocation.watchPosition=ok=>{state.position=ok;return 1;};navigator.geolocation.clearWatch=()=>{};
  const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
  window.addEventListener=((type:string,...args:unknown[])=>{if(type==='deviceorientation'||type==='deviceorientationabsolute')state.listeners++;return (add as Function)(type,...args);}) as typeof window.addEventListener;
  window.removeEventListener=((type:string,...args:unknown[])=>{if(type==='deviceorientation'||type==='deviceorientationabsolute')state.listeners--;return (remove as Function)(type,...args);}) as typeof window.removeEventListener;
 },{permission,pending});
 await page.goto('/?mode=simulation');await page.getByRole('button',{name:'실제 GPS 추적 시작'}).click();await fix(page);
 return page.getByRole('region',{name:'실제 방향 안내'});
}
async function fix(page:Page){await page.evaluate(()=>(window as unknown as {sensorTest:{position:PositionCallback}}).sensorTest.position({coords:{latitude:37.5665,longitude:126.978,accuracy:5},timestamp:Date.now()} as GeolocationPosition));}
async function startReady(guide:Locator){
 await guide.getByRole('button',{name:'실제 방향 센서 시작'}).click();
 await expect(guide.getByRole('button',{name:'방향 센서 중지',exact:true})).toBeEnabled();
}
async function reading(page:Page,values:Record<string,unknown>={}){
 await page.evaluate(values=>{const event=new Event('deviceorientation');for(const [key,value] of Object.entries({beta:0,gamma:0,webkitCompassHeading:10,webkitCompassAccuracy:5,...values}))Object.defineProperty(event,key,{value});Object.defineProperty(event,'timeStamp',{value:performance.now()});window.dispatchEvent(event);},values);
}
test('센서는 버튼 후 권한 요청하며 진북 보정 방향·중지·지연 이벤트를 처리한다',async({page})=>{
 const guide=await setup(page);expect(await page.evaluate(()=>(window as unknown as {sensorTest:{permissionCalls:number}}).sensorTest.permissionCalls)).toBe(0);
 await startReady(guide);await reading(page);await expect(guide).toContainText('실제 방향 수신 중');await page.clock.runFor(1200);await expect(guide.locator('.facing-card')).toHaveAttribute('data-state','forward');
 await reading(page,{webkitCompassHeading:190});await expect(guide).toContainText('실제 방향 수신 중');await page.clock.runFor(1200);await expect(guide.locator('.facing-card')).toHaveAttribute('data-state','opposite');
 expect(await page.evaluate(()=>(window as unknown as {sensorTest:{absolute:boolean}}).sensorTest.absolute)).toBe(true);
 await guide.getByRole('button',{name:'방향 센서 중지',exact:true}).click();await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await reading(page);await page.clock.runFor(800);await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {sensorTest:{listeners:number}}).sensorTest.listeners)).toBe(0);
});
test('불확실한 오차·자세·표준 절대값은 즉시 화살표를 숨기고 수신 중단을 해제한다',async({page})=>{
 const guide=await setup(page);await startReady(guide);await reading(page);await page.clock.runFor(800);
 await reading(page,{webkitCompassAccuracy:-1});await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(guide).toContainText('오차');
 await reading(page);await page.clock.runFor(800);await reading(page,{beta:90});await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(guide).toContainText('나란하게');
 await reading(page,{webkitCompassHeading:undefined,absolute:true,alpha:0});await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
 await page.clock.runFor(2300);await expect(guide).toContainText('수신이 멈췄어요');await expect.poll(()=>page.evaluate(()=>(window as unknown as {sensorTest:{listeners:number}}).sensorTest.listeners)).toBe(0);
});
test('권한 거부와 늦게 허용된 취소 요청을 처리한다',async({page})=>{
 const guide=await setup(page,'denied');await guide.getByRole('button',{name:'실제 방향 센서 시작'}).click();await expect(guide).toContainText('권한이 꺼져');await expect(guide.getByRole('button',{name:'실제 방향 센서 시작'})).toBeEnabled();
});
test('권한 요청 취소 뒤 허용되어도 리스너를 추가하지 않는다',async({page})=>{
 const guide=await setup(page,'granted',true);await guide.getByRole('button',{name:'실제 방향 센서 시작'}).click();await guide.getByRole('button',{name:'방향 권한 요청 취소'}).click();
 await page.evaluate(()=>(window as unknown as {sensorTest:{grant:(value:string)=>void}}).sensorTest.grant('granted'));await reading(page);await page.clock.runFor(1000);await expect.poll(()=>page.evaluate(()=>(window as unknown as {sensorTest:{listeners:number}}).sensorTest.listeners)).toBe(0);await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
});
for(const event of ['visibilitychange','pagehide','gps-stop','route-change'])test(`${event} 시 센서를 해제하고 자동 재시작하지 않는다`,async({page})=>{
 const duplicateKeys:string[]=[];page.on('console',message=>{if(message.text().includes('same key'))duplicateKeys.push(message.text());});
 const guide=await setup(page);await startReady(guide);await reading(page);await page.clock.runFor(800);
 if(event==='gps-stop')await page.getByRole('button',{name:'GPS 추적 중지',exact:true}).click();
 else if(event==='route-change'){await page.getByText('현장 테스트 경로 설정',{exact:true}).click();await page.getByRole('textbox',{name:'테스트 경로 좌표'}).fill('35.1,129.1\n35.1005,129.1');await page.getByRole('button',{name:'현장 경로 적용'}).click();}
 else await page.evaluate(event=>{if(event==='visibilitychange'){Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event(event));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event(event));}else window.dispatchEvent(new Event(event));},event);
 await reading(page);await page.clock.runFor(1000);await expect.poll(()=>page.evaluate(()=>(window as unknown as {sensorTest:{listeners:number}}).sensorTest.listeners)).toBe(0);await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);expect(duplicateKeys).toEqual([]);
});
test('GPS 위치가 오래되면 방향 수신이 계속되어도 안내하지 않는다',async({page})=>{
 const guide=await setup(page);await startReady(guide);
 for(let i=0;i<5;i++){await reading(page);await page.clock.runFor(2100);}await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(guide).toContainText('GPS 위치');
});
for(const width of [360,430])test(`${width}px 실제 방향 센서 상태가 화면에 들어온다`,async({page})=>{
 await page.setViewportSize({width,height:844});const guide=await setup(page);await startReady(guide);await reading(page);await page.clock.runFor(800);await guide.scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/real-heading-${width}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('센서가 없거나 권한 요청이 실패해도 재시도 안내를 표시한다',async({page})=>{
 const guide=await setup(page);
 await page.evaluate(()=>{Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:undefined});});await guide.getByRole('button',{name:'실제 방향 센서 시작'}).click();await expect(guide).toContainText('지원하지 않아요');
 await page.evaluate(()=>{Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:class {static requestPermission(){return Promise.reject(new Error('permission failed'));}}});});await guide.getByRole('button',{name:'실제 방향 센서 시작'}).click();await expect(guide).toContainText('켜지 못했어요');await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
});
test('권한 허용 후 첫 수신이 없으면 5초 뒤 리스너를 해제한다',async({page})=>{
 const guide=await setup(page);await startReady(guide);await page.clock.runFor(5001);await expect(guide).toContainText('수신이 멈췄어요');await expect.poll(()=>page.evaluate(()=>(window as unknown as {sensorTest:{listeners:number}}).sensorTest.listeners)).toBe(0);
});
test('화면 회전과 오래된 센서 이벤트에서 즉시 화살표를 숨긴다',async({page})=>{
 const guide=await setup(page);await startReady(guide);await reading(page);await page.clock.runFor(800);
 await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);
 await reading(page);await page.clock.runFor(800);await page.evaluate(()=>{const event=new Event('deviceorientation');Object.defineProperty(event,'timeStamp',{value:performance.now()-2000});window.dispatchEvent(event);});await expect(guide.getByTestId('facing-arrow')).toHaveCount(0);await expect(guide).toContainText('오래된 방향값');
});
