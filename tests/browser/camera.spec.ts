import {test,expect} from '@playwright/test';
test.use({launchOptions:{channel:'chrome',args:['--use-fake-device-for-media-stream']}});
test('실제 영상 재생과 지도 전환 시 트랙 해제',async({page,context})=>{
 await context.grantPermissions(['camera']);
 await page.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);Object.assign(window,{cameraCalls:0});navigator.mediaDevices.getUserMedia=async constraints=>{Object.assign(window,{cameraCalls:(window as unknown as {cameraCalls:number}).cameraCalls+1,cameraConstraints:constraints});const stream=await original(constraints);Object.assign(window,{cameraStream:stream});return stream;};});
 await page.goto('/?screen=camera');expect(await page.evaluate(()=>(window as unknown as {cameraCalls:number}).cameraCalls)).toBe(0);
 await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();
 const preview=page.getByRole('region',{name:'실제 카메라 미리보기'});await expect(preview).toBeVisible();
 await expect.poll(()=>page.locator('video').evaluate(v=>(v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>(window as unknown as {cameraConstraints:{audio:boolean}}).cameraConstraints.audio)).toBe(false);
 await expect(page.locator('.direction-arrow')).not.toBeVisible();await expect(page.getByText('30m 앞 오른쪽',{exact:true})).not.toBeVisible();
 await page.screenshot({path:'docs/previews/gilbit-camera-preview.png'});
 await preview.getByRole('button',{name:'지도 보기',exact:true}).click();
 expect(await page.evaluate(()=>(window as unknown as {cameraStream:MediaStream}).cameraStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true);
});
for(const name of ['NotAllowedError','NotFoundError','NotReadableError']){
 test(`${name} 오류와 재시도`,async({page})=>{
  await page.addInitScript(name=>{navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('test',name));},name);
  await page.goto('/?screen=camera');await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText(name==='NotAllowedError'?'카메라 권한이 꺼져':name==='NotFoundError'?'사용할 수 있는 카메라가 없어요':'다른 앱에서 사용 중');
  await page.getByRole('button',{name:'카메라 다시 켜기'}).click();await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button',{name:'시안으로 돌아가기',exact:true}).click();await expect(page.locator('.direction-arrow')).toBeVisible();
 });
}
test('요청 취소 후 늦게 허용한 영상은 즉시 해제한다',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{Object.assign(window,{allowCamera:()=>{const canvas=document.createElement('canvas');const stream=canvas.captureStream();Object.assign(window,{lateStream:stream});resolve(stream);}});});});
 await page.goto('/?screen=camera');await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();await page.getByRole('button',{name:'요청 취소'}).click();
 await page.evaluate(()=>(window as unknown as {allowCamera:()=>void}).allowCamera());
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {lateStream:MediaStream}).lateStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true);
 await expect(page.getByRole('region',{name:'실제 카메라 미리보기'})).toHaveCount(0);
});
test('상단 X로 닫아도 안내 상태를 유지하고 카메라만 해제한다',async({page,context})=>{
 await context.grantPermissions(['camera']);await page.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async c=>{const stream=await original(c);Object.assign(window,{cameraStream:stream});return stream;};});
 await page.goto('/?screen=camera');await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();await expect.poll(()=>page.locator('video').evaluate(v=>(v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'안내 화면 닫기'}).click();await expect(page.getByRole('region',{name:'진행 중인 안내'})).toBeVisible();
 expect(await page.evaluate(()=>(window as unknown as {cameraStream:MediaStream}).cameraStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true);
 await page.getByRole('button',{name:'안내로 돌아가기'}).click();await expect(page.getByRole('region',{name:'실제 카메라 미리보기'})).toHaveCount(0);
});

for(const width of [360,390,430]){
 test(`${width}px 권한 대기 화면과 취소 버튼이 잘리지 않는다`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(()=>{});});
  await page.goto('/?screen=camera');await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();
  await expect(page.getByRole('button',{name:'요청 취소'})).toBeInViewport();await expect(page.getByRole('button',{name:'카메라 끄기',exact:true})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('탭 숨김 시 해제하고 복귀해도 자동 재요청하지 않는다',async({page,context})=>{
 await context.grantPermissions(['camera']);await page.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async c=>{const stream=await original(c);Object.assign(window,{cameraStream:stream});return stream;};});
 await page.goto('/?screen=camera');await page.getByRole('button',{name:'실제 카메라 켜기',exact:true}).click();await expect.poll(()=>page.locator('video').evaluate(v=>(v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.getByRole('alert')).toContainText('화면을 벗어나');
 expect(await page.evaluate(()=>(window as unknown as {cameraStream:MediaStream}).cameraStream.getTracks().every(t=>t.readyState==='ended'))).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.getByRole('button',{name:'카메라 다시 켜기'})).toBeVisible();
});
