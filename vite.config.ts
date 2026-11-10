import { defineConfig, loadEnv, type Plugin } from 'vite';
import { createNavigationHandler } from './server/navigation';

/** The same handler runs locally and in Vercel; no separate dev server/key copy. */
export default defineConfig(({mode}) => {
 const env = loadEnv(mode, process.cwd(), '');
 const serverKey=(env.TMAP_APP_KEY || process.env.TMAP_APP_KEY || '').trim();
 const mapKey=(env.VITE_TMAP_MAP_KEY || '').trim();
 if(serverKey && mapKey && serverKey===mapKey) {
  throw new Error('TMAP 서버 키를 공개 지도 키로 재사용할 수 없습니다. VITE_TMAP_MAP_KEY를 비워 두고 공급자의 키 분리·사용 제한 지원을 확인하세요.');
 }
 const api: Plugin = {
  name:'gilbit-navigation-api',
  configureServer(server) {
   const handle = createNavigationHandler({appKey:env.TMAP_APP_KEY || process.env.TMAP_APP_KEY || ''});
   server.middlewares.use('/api/navigation', async (req,res) => {
    try {
     let body = '';
     for await (const chunk of req) {
      body += chunk.toString();
      if (Buffer.byteLength(body) > 4096) {res.statusCode=413;res.end();return;}
     }
     const request = new Request(`http://localhost/api/navigation${req.url || ''}`, {method:req.method,headers:{'content-type':req.headers['content-type'] || ''},...(body?{body}:{})});
     const result = await handle(request);
     res.statusCode=result.status;
     result.headers.forEach((value,key)=>res.setHeader(key,value));
     res.end(await result.text());
    } catch {res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:{code:'DEV_SERVER_ERROR',message:'개발 서버 요청을 처리하지 못했어요.'}}));}
   });
  },
 };
 return {plugins:[api],server:{host:'127.0.0.1'}};
});
