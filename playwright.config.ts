import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',fullyParallel:false,workers:1,timeout:20000,
 use:{reducedMotion:'reduce',baseURL:'http://127.0.0.1:5182',viewport:{width:390,height:844},launchOptions:{channel:'chrome'},trace:'retain-on-failure'},
 webServer:{command:'npm run dev -- --port 5182 --strictPort',url:'http://127.0.0.1:5182',reuseExistingServer:false,env:{TMAP_APP_KEY:'',VITE_TMAP_MAP_KEY:'test-public-map-key'}},
});
