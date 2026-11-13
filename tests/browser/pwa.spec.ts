import {test,expect} from '@playwright/test';
test('설치 제안은 사용자 클릭 때만 열리고 취소·설치 완료를 반영한다',async({page})=>{
 await page.goto('/?preview=1&mode=live');const section=page.getByRole('region',{name:'길빛 앱 설치'});await expect(section).toBeVisible();await section.getByRole('button',{name:'설치 방법 보기'}).click();await expect(section.getByRole('status')).toContainText('홈 화면에 추가');
 await page.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});Object.assign(window,{installCalls:0});Object.assign(e,{prompt:async()=>{(window as any).installCalls++;},userChoice:Promise.resolve({outcome:'dismissed'})});window.dispatchEvent(e);});
 await expect(section.getByRole('button',{name:'길빛 설치',exact:true})).toBeVisible();expect(await page.evaluate(()=>(window as any).installCalls)).toBe(0);await section.getByRole('button',{name:'길빛 설치',exact:true}).click();expect(await page.evaluate(()=>(window as any).installCalls)).toBe(1);await expect(section.getByRole('button',{name:'설치 방법 보기'})).toBeEnabled();
 await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));await expect(section).toHaveCount(0);
});
test('앱 창으로 실행 중이면 설치 안내를 반복하지 않는다',async({page})=>{
 await page.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?new Proxy(original(q),{get:(target,key)=>key==='matches'?true:Reflect.get(target,key,target)}):original(q);});
 await page.goto('/?preview=1&mode=live');await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();await expect(page.getByRole('region',{name:'길빛 앱 설치'})).toHaveCount(0);
});
