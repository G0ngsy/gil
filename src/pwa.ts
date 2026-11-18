/**
 * PWA 설치 상태: 브라우저 설치 이벤트를 구독하고 사용자 동작에서 설치 요청을 실행합니다.
 */
interface InstallPrompt extends Event {prompt():Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>}
let prompt:InstallPrompt|null=null;
let installed=window.matchMedia('(display-mode: standalone)').matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
const listeners=new Set<()=>void>();
const publish=()=>listeners.forEach(listener=>listener());
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallPrompt;publish();});
window.addEventListener('appinstalled',()=>{installed=true;prompt=null;publish();});
export const subscribeInstall=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const getInstallState=()=>installed?'installed':prompt?'available':'manual';
export async function requestInstall(){const event=prompt;if(!event)return;prompt=null;publish();await event.prompt();await event.userChoice;}
// Register only in the production build. Installing does not imply offline navigation.
if(import.meta.env.PROD&&'serviceWorker' in navigator){window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{/* Browser-menu installation remains available where supported. */});});}
