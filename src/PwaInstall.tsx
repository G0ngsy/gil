import {useState,useSyncExternalStore} from 'react';
import {getInstallState,requestInstall,subscribeInstall} from './pwa';
export function PwaInstall(){
 const state=useSyncExternalStore(subscribeInstall,getInstallState,()=> 'manual');
 const [manual,setManual]=useState(false),[pending,setPending]=useState(false);
 if(state==='installed')return null;
 return <section className="pwa-install" aria-label="길빛 앱 설치"><div><h3>홈 화면에서 길빛을 열어보세요</h3><p>앱 아이콘으로 바로 시작할 수 있어요.</p></div><button className="secondary" disabled={pending} onClick={()=>{if(state!=='available'){setManual(value=>!value);return;}setPending(true);void requestInstall().catch(()=>setManual(true)).finally(()=>setPending(false));}}>{pending?'설치 확인 중…':state==='available'?'길빛 설치':'설치 방법 보기'}</button>{manual&&<p role="status">브라우저 메뉴에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택해 주세요. iPhone은 공유 메뉴를 이용해 주세요. 메뉴가 없다면 Chrome이나 Safari로 열어 주세요.</p>}</section>;
}
