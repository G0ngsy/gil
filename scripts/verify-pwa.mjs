import {preview} from 'vite';
import {chromium,expect} from '@playwright/test';
const base=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6)||'http://127.0.0.1:5193/';
const remote=new URL(base).protocol==='https:';
const server=remote?{httpServer:{close:callback=>callback()}}:await preview({preview:{host:'127.0.0.1',port:5193,strictPort:true}});let browser;
try{
 const context=await chromium.launchPersistentContext(remote?'test-results/pwa-check-profile-production':'test-results/pwa-check-profile',{channel:'chrome',headless:true,viewport:{width:390,height:844},reducedMotion:'reduce'});browser=context;const page=await context.newPage();
 await page.route('**/api/navigation?**',r=>r.fulfill({json:{searchConfigured:false}}));await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 const cdp=await context.newCDPSession(page);const manifest=await cdp.send('Page.getAppManifest');const parsed=JSON.parse(manifest.data);const errors=await cdp.send('Page.getInstallabilityErrors');console.log(JSON.stringify({manifestErrors:manifest.errors,name:parsed.name,display:parsed.display,icons:parsed.icons.map(i=>i.sizes),installability:errors.installabilityErrors}));if(manifest.errors.length||errors.installabilityErrors.length)throw new Error('Chrome installability failed');
 await expect(page.getByRole('region',{name:'길빛 앱 설치'})).toBeVisible();await page.screenshot({path:remote?'docs/portfolio/assets/2026-11-13-pwa-install-production-390.png':'docs/portfolio/assets/2026-11-13-pwa-install-390.png'});
 const cache=await page.evaluate(async()=>Promise.all((await caches.keys()).map(async name=>({name,urls:(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname)}))));console.log('cache',JSON.stringify(cache));
 if(cache.some(c=>c.urls.some(u=>u!=='/offline.html')))throw new Error('unexpected cached data');
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'인터넷 연결이 필요해요'})).toBeVisible();await expect(page.getByText('이 화면에서는 위치를 추적하지 않아요.',{exact:false})).toBeVisible();console.log('offline navigation fallback: passed');
 await context.setOffline(false);await page.getByRole('button',{name:'다시 연결하기'}).click();await expect(page.getByRole('textbox',{name:'실제 목적지 검색'})).toBeVisible();console.log('online recovery: passed');
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
