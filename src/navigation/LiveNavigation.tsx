import {UsageGuide} from '../UsageGuide';
/**
 * 실제 길찾기 총괄: 검색→경로 확인→GPS 안내, 기록·복원·재탐색·종료 및 화면 이동 상태를 관리합니다.
 */
import {useAppHistory,type Stage,type View} from './useAppHistory';
import {guidanceKey,parseSavedGuidance,readSavedGuidance} from './savedGuidance';
import {PwaInstall} from '../PwaInstall';
import {useGpsTracking} from './useGpsTracking';
import {initialProgress,updateProgress,type Fix} from '../../shared/tracking';
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Brand, Icon } from '../ui';
import { Motif } from '../Motif';
import { distanceBetween, formatDistance, type LocationAddress, type Place, type WalkingRoute } from '../../shared/navigation';
import { findWalkingRoute, getLocationAddress, getUserPosition, navigationRequest, searchPlaces, type UserPosition } from './client';
import {useRecentHistory} from '../history';
import {SelectionCorner} from '../SelectionCorner';
import {OrnamentalDivider} from '../OrnamentalDivider';
import {RecentHistoryPanel} from '../RecentHistory';
import {RouteJourney,JourneyInstruction} from './RouteJourney';
import {LiveCameraGuide} from './LiveCameraGuide';
import { WalkingMap } from './WalkingMap';

interface Guidance {route:WalkingRoute;destination:Place;start:UserPosition}
interface Props {onDemo:()=>void;review?:boolean}
export function LiveNavigation({onDemo,review=false}:Props) {
 const recent=useRecentHistory('live');
 const navigationChange=useRef<(next:View,previous:View)=>void>(()=>{});
 const navigation=useAppHistory((next,previous)=>navigationChange.current(next,previous));
 const stage=navigation.view.stage;
 const setStage=(next:Stage)=>next==='home'?navigation.home():navigation.go({stage:next});
 const [cameraCloseSignal,setCameraCloseSignal]=useState(0);
 // 검색/경로 확인용 상태: 다른 목적지를 살펴보는 동안에도 진행 중인 안내 세션과 분리해 둡니다.
 const [query,setQuery]=useState('');
 const [places,setPlaces]=useState<Place[]>([]);
 const [selected,setSelected]=useState<Place|null>(null);
 const [position,setPosition]=useState<UserPosition|null>(null);
 const [address,setAddress]=useState<LocationAddress|null>(null);
 const [addressLoading,setAddressLoading]=useState(false);
 const [addressError,setAddressError]=useState('');
 const [nearbySearch,setNearbySearch]=useState(true);
 const [searchOrigin,setSearchOrigin]=useState<UserPosition|null>(null);
 const [route,setRoute]=useState<WalkingRoute|null>(null);
 const [searched,setSearched]=useState(false);
 const [searching,setSearching]=useState(false);
 const [locating,setLocating]=useState(false);
 const [routing,setRouting]=useState(false);
 const [error,setError]=useState('');
 const [locationError,setLocationError]=useState('');
 const [configured,setConfigured]=useState<boolean|null>(null);
 const [configError,setConfigError]=useState('');
 const [configAttempt,setConfigAttempt]=useState(0);
 const [ending,setEnding]=useState(false);
 const [endedDestination,setEndedDestination]=useState('');
 const [endRating,setEndRating]=useState('');
 // 실제로 안내 중인 목적지/경로 스냅샷입니다. 검색 결과를 바꿔도 이 세션을 덮어쓰지 않습니다.
 const [guidance,setGuidance]=useState<Guidance|null>(null);
 const [saved,setSaved]=useState(readSavedGuidance);
 const [restoring,setRestoring]=useState(false),[restoreError,setRestoreError]=useState(''),[storageWarning,setStorageWarning]=useState('');
 const restoreAbort=useRef<AbortController|null>(null);
 // 복원용 안내만 삭제합니다. 최근 검색/목적지 기록은 별도 저장소에서 관리합니다.
 function clearSaved(){setSaved(null);try{localStorage.removeItem(guidanceKey);setStorageWarning('');}catch{setStorageWarning('저장된 안내를 삭제하지 못했어요. 이 기기에 이전 기록이 남아 있을 수 있어요.');}}

 // GPS와 비동기 응답이 최신 안내를 읽도록 ref도 함께 유지합니다.
 const guidanceRef=useRef<Guidance|null>(null);
 const [pendingGuidance,setPendingGuidance]=useState<Guidance|null>(null);
 // 경로 계산에 채택된 GPS 진행값입니다. 오래되거나 오차가 큰 관측값과 구분합니다.
 const [progress,setProgress]=useState(initialProgress);
 useEffect(()=>{if(!guidance)return;if(progress.arrived){clearSaved();return;}try{const raw=JSON.stringify({version:1,savedAt:Date.now(),destination:guidance.destination,route:guidance.route});if(!parseSavedGuidance(raw))throw new Error('Unsupported route');localStorage.setItem(guidanceKey,raw);setStorageWarning('');}catch{try{localStorage.removeItem(guidanceKey);}catch{}setStorageWarning('이 기기에 안내를 저장하지 못했어요. 다시 열면 복원되지 않거나 이전 기록이 남아 있을 수 있어요.');}},[guidance,progress.arrived]);
 // 지도 관측용 최근 위치: 오차가 큰 값은 회색 참고 위치로만 표시하고 진행 계산에는 쓰지 않습니다.
 const [observedFix,setObservedFix]=useState<Fix|null>(null);
 const latestFix=useRef<Fix|null>(null);latestFix.current=observedFix;
 const [rerouting,setRerouting]=useState(false),[rerouteError,setRerouteError]=useState('');
 const rerouteAbort=useRef<AbortController|null>(null);
 const gps=useGpsTracking(fix=>{const current=guidanceRef.current;if(current){setProgress(previous=>updateProgress(current.route,previous,fix));}},'실제 GPS 위치를 수신하고 있어요.',fix=>{if(guidanceRef.current)setObservedFix(fix);});
 useEffect(()=>{if(progress.arrived&&gps.active)gps.stop('도착을 확인해 GPS 추적을 마쳤어요.');},[progress.arrived,gps.active]);
 const content=useRef<HTMLElement>(null);
 const guidanceLayer=useRef<HTMLDivElement>(null);
 const [cameraLauncherRoot,setCameraLauncherRoot]=useState<HTMLDivElement|null>(null);
 const [cameraRoot,setCameraRoot]=useState<HTMLDivElement|null>(null);
 const [cameraOpen,setCameraOpen]=useState(false);
 // 글자가 커지거나 안내 문구가 바뀌면 바텀 시트 위에 필요한 안내 카드 공간을 확보합니다.
 useLayoutEffect(()=>{const layer=guidanceLayer.current,parent=layer?.parentElement;if(!layer||!parent)return;const update=()=>parent.style.setProperty('--map-guidance-space',Math.ceil(layer.getBoundingClientRect().height+24)+'px');update();const observer=new ResizeObserver(update);observer.observe(layer);return()=>{observer.disconnect();parent.style.removeProperty('--map-guidance-space');};},[stage,cameraOpen,Boolean(guidance)]);
 const dialog=useRef<HTMLDialogElement>(null);
 const focus=useRef<HTMLElement|null>(null);
 // 종류별 요청 취소 장치입니다. 이전 요청의 늦은 응답이 현재 화면을 바꾸지 않도록 관리합니다.
 const searchAbort=useRef<AbortController|null>(null);
 const addressAbort=useRef<AbortController|null>(null);
 const routeAbort=useRef<AbortController|null>(null);
 const locationAbort=useRef<AbortController|null>(null);
 const locationVersion=useRef(0);
 const alive=useRef(false);
 const stageTitle={home:'길빛',results:'장소 검색',route:'도보 경로 확인',map:'길 안내',history:'이용 기록',privacy:'개인정보·이용 안내',ended:'안내 종료'}[stage];
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;locationVersion.current++;locationAbort.current?.abort();searchAbort.current?.abort();routeAbort.current?.abort();addressAbort.current?.abort();};},[]);
 useEffect(()=>{
  const controller=new AbortController();
  setConfigError('');setConfigured(null);
  navigationRequest<{searchConfigured:boolean}>('config',{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setConfigured(data.searchConfigured);}).catch(e=>{if(!controller.signal.aborted)setConfigError(message(e));});
  return()=>controller.abort();
 },[configAttempt]);
 // 화면이 바뀌면 본문으로 초점을 옮겨 키보드/보조기기 사용자가 새 화면부터 탐색하도록 합니다.
 const previousStage=useRef(stage);
 useEffect(()=>{content.current?.scrollTo(0,0);if(previousStage.current!==stage)content.current?.focus({preventScroll:true});previousStage.current=stage;},[stage]);
 useEffect(()=>{if(stage==='map')content.current?.scrollTo(0,0);},[gps.active]);
 useEffect(()=>{
  if(ending){if(navigation.current.current.overlay!=='confirm')navigation.go({stage,overlay:'confirm'});focus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}
  else{if(navigation.current.current.overlay==='confirm')navigation.back();if(dialog.current?.open){dialog.current.close();focus.current?.focus();}}
 },[ending]);

 // 복원 요청을 취소해 화면을 떠난 뒤 늦게 온 응답이 안내를 시작하지 못하게 합니다.
 function cancelRestore(){restoreAbort.current?.abort();restoreAbort.current=null;setRestoring(false);setRestoreError('');}
 useEffect(()=>{if(stage!=='home')cancelRestore();},[stage]);
 // 재탐색을 취소하되 현재 안내 경로와 GPS 세션은 유지합니다.
 function cancelReroute(){rerouteAbort.current?.abort();rerouteAbort.current=null;setRerouting(false);setRerouteError('');}
 useEffect(()=>{const leave=()=>{cancelReroute();cancelRestore();};const hidden=()=>{if(document.hidden)leave();};window.addEventListener('pagehide',leave);document.addEventListener('visibilitychange',hidden);return()=>{rerouteAbort.current?.abort();restoreAbort.current?.abort();window.removeEventListener('pagehide',leave);document.removeEventListener('visibilitychange',hidden);};},[]);
 useEffect(()=>{if(progress.arrived)cancelReroute();},[progress.arrived]);
 useEffect(()=>{if(!gps.active)cancelReroute();},[gps.active]);
 // 화면 이동 시 진행 중인 조회를 중단하고 단발 위치 요청의 이전 결과도 무효화합니다.
 function cancelWork(){cancelRestore();cancelReroute();searchAbort.current?.abort();routeAbort.current?.abort();locationVersion.current++;locationAbort.current?.abort();addressAbort.current?.abort();setAddressLoading(false);setSearching(false);setRouting(false);setLocating(false);}
 navigationChange.current=(next,previous)=>{cancelWork();setError('');if(previous.overlay==='camera'&&next.overlay!=='camera')setCameraCloseSignal(n=>n+1);if(previous.overlay==='confirm'&&next.overlay!=='confirm'){setEnding(false);setPendingGuidance(null);}};
 // 상단 뒤로가기와 브라우저 뒤로가기가 같은 방문 기록을 사용합니다.
 function back(){navigation.back();}
 // 카메라 열기/닫기를 방문 기록에 반영합니다. 닫는 것은 안내 종료와 다릅니다.
 function cameraChanged(open:boolean){setCameraOpen(open);if(open){if(navigation.current.current.overlay!=='camera')navigation.go({stage:'map',overlay:'camera'});}else if(navigation.current.current.overlay==='camera')navigation.back();}
 // 주변/전국 범위를 적용해 목적지를 검색하고 최근 검색 기록에 남깁니다.
 async function submitSearch(value=query,nearby=nearbySearch){
  cancelRestore();const q=value.trim();setQuery(value);
  if(q.length<2||q.length>80){setError('검색어를 2~80자로 입력해 주세요.');return;}
  if(configured!==true){setError('검색 서비스가 아직 준비되지 않았어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.');return;}
  searchAbort.current?.abort();routeAbort.current?.abort();
  const controller=new AbortController();searchAbort.current=controller;
  setError('');setPlaces([]);setSearched(false);setSearching(true);setRoute(null);setSelected(null);
  try {
   let origin=nearby?position:null;
   if(origin&&Date.now()-origin.timestamp>120000){origin=await locate(false);if(controller.signal.aborted)return;if(!origin){setError('현재 위치를 갱신하지 못했어요. 다시 확인하거나 전국 검색을 선택해 주세요.');return;}}
   if(controller.signal.aborted)return;
   setSearchOrigin(origin);setStage('results');
   const data=await searchPlaces(q,controller.signal,origin||undefined);
   if(!controller.signal.aborted){setPlaces(data.places);setSearched(true);recent.recordSearch(q);}
  }catch(e){if(!controller.signal.aborted)setError(message(e));}
  finally{if(!controller.signal.aborted)setSearching(false);}
 }
 // 확인한 좌표를 사람이 읽을 수 있는 주소로 바꾸며 과거 위치의 늦은 응답은 무시합니다.
 async function lookupAddress(point:UserPosition){
  addressAbort.current?.abort();const controller=new AbortController();addressAbort.current=controller;
  setAddress(null);setAddressError('');
  if(configured===false){setAddressLoading(false);setAddressError('위치는 확인했지만 주소를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.');return;}
  setAddressLoading(true);
  try{const data=await getLocationAddress(point,controller.signal);if(!data.location?.address)throw new Error('주소를 읽지 못했어요.');if(!controller.signal.aborted)setAddress(data.location);}
  catch(e){if(!controller.signal.aborted)setAddressError(`위치는 확인했지만 주소를 표시하지 못했어요. ${message(e)}`);}
  finally{if(!controller.signal.aborted)setAddressLoading(false);}
 }
 // 현재 출발 위치를 새로 확인합니다. 안내 중 GPS 추적과는 별도의 단발 조회입니다.
 async function locate(cancelSearch=true):Promise<UserPosition|null>{
  cancelRestore();
  if(cancelSearch){searchAbort.current?.abort();setSearching(false);}
  // 재조회 중에는 마지막 확인 위치를 보존합니다. 새 좌표가 확정될 때 주소를 교체합니다.
  addressAbort.current?.abort();setAddressError('');setAddressLoading(false);
  const version=++locationVersion.current;
  // 화면 이동/새 위치 요청 때 정확도 개선용 임시 GPS 감시도 함께 정리합니다.
  locationAbort.current?.abort();const controller=new AbortController();locationAbort.current=controller;
  routeAbort.current?.abort();setRouting(false);setRoute(null);
  setLocating(true);setLocationError('');setError('');
  try {
   const next=await getUserPosition(controller.signal);
   if(alive.current&&locationVersion.current===version){setPosition(next);void lookupAddress(next);return next;}
  }catch(e){if(alive.current&&locationVersion.current===version){setLocationError(message(e));}}
  finally{if(locationAbort.current===controller)locationAbort.current=null;if(alive.current&&locationVersion.current===version)setLocating(false);}
  return null;
 }
 // 검색 결과의 장소를 선택하고 경로 확인 화면으로 이동합니다.
 function choose(place:Place){recent.recordDestination(place);cancelWork();setSelected(place);setRoute(null);setError('');setStage('route');}
 // 오래되거나 부정확한 출발 위치를 갱신한 뒤 선택한 목적지까지 최초 경로를 요청합니다.
 async function getRoute(){
  if(!selected)return;
  let origin=position;
  // A stale one-shot position must not silently become the next route's origin.
  if(!origin || Date.now()-origin.timestamp>10000||origin.accuracy>30)origin=await locate();
  if(!origin||!alive.current)return;
  if(origin.accuracy>30){setError(`현재 위치 오차가 약 ${Math.round(origin.accuracy)}m예요. 주변이 트인 곳에서 위치를 다시 확인해 주세요.`);return;}
  routeAbort.current?.abort();const controller=new AbortController();routeAbort.current=controller;
  setRouting(true);setRoute(null);setError('');
  try {
   const data=await findWalkingRoute(origin,selected,controller.signal);
   if(!controller.signal.aborted)setRoute(data.route);
  }catch(e){if(!controller.signal.aborted)setError(message(e));}
  finally{if(!controller.signal.aborted)setRouting(false);}
 }
 // 확정된 목적지/경로를 안내 세션으로 묶고 진행값을 초기화한 후 GPS를 시작합니다.
 function beginGuidance(next:Guidance,fix?:Fix){
  cancelRestore();setSaved(null);
  cancelReroute();
  guidanceRef.current=next;setGuidance(next);setObservedFix(fix??null);setProgress(fix?updateProgress(next.route,initialProgress(),fix):initialProgress());setStage('map');gps.start();
 }
 // 새 안내 시작 전 기존 안내가 있으면 교체 확인을 받습니다.
 function startGuidance(){
  if(!route||!selected||!position)return;
  const next={route,destination:selected,start:position};
  if(guidance){setPendingGuidance(next);setEnding(true);}else beginGuidance(next);
 }
 // 사용자가 이어가기를 누르면 새 GPS로 진행값을 다시 계산하고 경로 밖이면 재탐색합니다.
 async function restoreGuidance(){
  if(!saved||restoreAbort.current||guidanceRef.current)return;
  const snapshot=saved,controller=new AbortController();restoreAbort.current=controller;setRestoring(true);setRestoreError('');
  let timeout=false;const timer=setTimeout(()=>{timeout=true;controller.abort();},30000);
  try{
   if(!parseSavedGuidance(JSON.stringify(snapshot))){clearSaved();return;}
   const origin=await getUserPosition(controller.signal);
   if(controller.signal.aborted||!alive.current)return;
   if(origin.accuracy>30)throw new Error('위치 오차가 커요. 안전한 곳에서 다시 확인해 주세요.');
   const check=updateProgress(snapshot.route,initialProgress(),origin);
   const route=check.offRoute||check.rejected?(await findWalkingRoute(origin,snapshot.destination,controller.signal)).route:snapshot.route;
   if(controller.signal.aborted||!alive.current||guidanceRef.current||document.hidden)return;
   beginGuidance({destination:snapshot.destination,route,start:origin},origin);
  }catch(e){if(alive.current&&(!controller.signal.aborted||timeout))setRestoreError(timeout?'이어가는 시간이 길어졌어요. 잠시 후 다시 시도해 주세요.':message(e));}
  finally{clearTimeout(timer);if(restoreAbort.current===controller){restoreAbort.current=null;setRestoring(false);}}
 }
 // 현재 위치에서 기존 목적지로 재탐색합니다. 성공한 응답만 반영하고 실패 시 기존 경로를 유지합니다.
 async function rerouteGuidance(){
  const current=guidanceRef.current;
  if(!current||rerouteAbort.current||progress.arrived)return;
  const controller=new AbortController();rerouteAbort.current=controller;
  setRerouting(true);setRerouteError('');
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},30000);
  const valid=()=>alive.current&&!controller.signal.aborted&&guidanceRef.current===current;
  try{
   let origin=latestFix.current;
   if(!origin||origin.accuracy>30||Date.now()-origin.timestamp>10000)origin=await getUserPosition(controller.signal);
   if(!valid())return;
   if(origin.accuracy>30)throw new Error(`현재 위치 오차가 약 ${Math.round(origin.accuracy)}m예요. 안전한 곳에서 위치를 다시 확인해 주세요.`);
   const data=await findWalkingRoute(origin,current.destination,controller.signal);
   if(!valid()||document.hidden)return;
   const next={...current,start:origin,route:data.route};
   guidanceRef.current=next;setGuidance(next);
   const fix=latestFix.current;
   setProgress(fix&&fix.accuracy<=30&&Date.now()-fix.timestamp<=10000?updateProgress(next.route,initialProgress(),fix):initialProgress());
   if(!gps.active)gps.start();
  }catch(e){if(alive.current&&guidanceRef.current===current&&(!controller.signal.aborted||timedOut))setRerouteError(timedOut?'다시 찾는 시간이 길어졌어요. 기존 경로를 유지해요. 잠시 후 다시 시도해 주세요.':`새 경로를 찾지 못했어요. 기존 경로를 유지해요. ${message(e)}`);}
  finally{clearTimeout(timer);if(rerouteAbort.current===controller){rerouteAbort.current=null;setRerouting(false);}}
 }
 // 자동 중단된 GPS를 사용자가 다시 시작합니다. 카메라는 자동으로 켜지지 않습니다.
 function resumeGuidance(){if(guidanceRef.current&&!progress.arrived)gps.start();}
 // 명시적 종료: 자원을 정리하고 방문 기록을 새로 시작해 종료한 경로로 돌아가지 않게 합니다.
 function finishGuidance(){const destination=guidanceRef.current?.destination.name;setEndedDestination(destination||'');setEndRating('');clearSaved();gps.stop();cancelWork();guidanceRef.current=null;setGuidance(null);setObservedFix(null);setProgress(initialProgress());setRoute(null);setSelected(null);navigation.home();if(destination)navigation.go({stage:'ended'});}
 function cancelEnding(){setEnding(false);setPendingGuidance(null);}
 const shownDestination=stage==='map'?guidance?.destination:selected;
 const shownRoute=stage==='map'?guidance?.route:route;
 const shownStart=stage==='map'?guidance?.start:position;
 const shownProgress=stage==='map'?progress:initialProgress();

 // 아래부터 화면에 보여줄 요약 문구·공통 패널과 화면별 UI를 구성합니다.
 const onSubmit=(event:FormEvent)=>{event.preventDefault();void submitSearch();};
 const locationAction=locating?'현재 위치 확인 중…':position?'현재 위치 다시 확인':'현재 위치 확인';
 const locationText=address?address.address:locating?'현재 위치를 확인하고 있어요…':addressLoading?'현재 위치의 주소를 확인하고 있어요…':position?'현재 위치를 확인했어요':'현재 위치를 확인해 주세요';
 const locationPanel=<section className={`live-location ${stage==='home'?'compact-location':''}`} aria-label="현재 위치">
 {stage==='home'?<div className="compact-location-row"><Icon name="pin" size={25}/><div className="compact-location-copy"><span>현재 위치</span><strong className="current-address">{locationText}</strong>{position&&locating&&<small role="status">위치 갱신 중 · 이전 확인 위치</small>}{position&&locationError&&<small>이전 확인 위치</small>}</div><button className="location-action" aria-label={locationAction} disabled={locating||routing} onClick={()=>void locate()}><Icon name="locate" size={18}/><span>{locating?'확인 중…':position?'다시 확인':'현재 위치 확인'}</span></button></div>:<><div className="location-label"><Icon name="locate" size={18}/><strong>현재 위치 · 출발지</strong></div>{position?<><strong className="current-address">{locationText}</strong><p>주변 주소 · 오차 약 {Math.round(position.accuracy)}m<br/>확인 시각 {new Date(position.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</p></>:<p>현재 위치를 확인하면 주변 장소를 가까운 순서로 찾을 수 있어요.</p>}<button className="secondary" disabled={locating||routing} onClick={()=>void locate()}><Icon name="locate" size={19}/>{locationAction}</button></>}
 {position&&addressError&&<><p className="address-warning" role="status">{addressError}</p><button className="text-button" disabled={addressLoading||configured!==true} onClick={()=>void lookupAddress(position)}>주소 다시 확인</button></>}
 {locationError&&<p className="inline-error" role="alert">{locationError}</p>}</section>;
 const searchScope=<div className="search-scope"><label>검색 범위<select aria-label="검색 범위" value={position&&nearbySearch?'nearby':'national'} onChange={e=>setNearbySearch(e.target.value==='nearby')}><option value="nearby" disabled={!position}>내 주변 10km</option><option value="national">전국 검색</option></select></label>{!position&&<p>위치 미확인 · 전국 기준</p>}</div>;

 const setup=<>{configured===null&&!configError&&<p className="connection-note" role="status">검색을 준비하고 있어요…</p>}{configured===false&&<div className="connection-note"><strong>지금은 장소를 검색할 수 없어요.</strong><p>잠시 후 다시 시도해 주세요.</p>{review&&<button className="text-button" onClick={onDemo}>디자인 시안으로 돌아가기</button>}</div>}{configError&&<div className="connection-note" role="alert"><p>{configError}</p><button className="text-button" onClick={()=>setConfigAttempt(n=>n+1)}>다시 시도</button></div>}</>;

 return <div className={`studio live-studio ${review?'':'app-shell'}`}>{review&&<aside className="studio-intro"><span className="eyebrow">GILBIT / WALKING ROUTE</span><h1>눈앞의 길을,<br/>실제 경로로.</h1><p>장소를 찾고 현재 위치에서<br/>걸어갈 경로를 확인하세요.</p><div className="studio-rule"/><span className="studio-note">현재 위치는 버튼을 눌렀을 때만 확인해요.<br/>진행 중인 경로를 이 기기에 저장해요. 하루 이내 안내만 이어갈 수 있어요.</span>{review&&<button className="secondary return-demo" onClick={onDemo}>디자인 시안 보기</button>}</aside>}<div className="phone live-phone"><header className={`app-header ${stage==='home'?'home-header':''} ${stage==='map'?'guidance-header':''}`}>
  {stage==='home'?<Brand/>:<><button className="icon-button" aria-label="뒤로 가기" onClick={back}><Icon name="back"/></button><strong className="header-title">{stageTitle}</strong></>}
  {stage==='map'&&guidance&&<button className="icon-button" aria-label="안내 화면 닫기" onClick={()=>{cancelReroute();setError('');setStage('home');}}><Icon name="close"/></button>}
  <>{review&&<button className="live-demo-exit" onClick={onDemo}>시안 보기</button>}</>
 </header><div className="navigation-viewport"><main tabIndex={-1} aria-label={stageTitle} inert={cameraOpen} className={`app-content live-content live-${stage}`} ref={content}>{storageWarning&&<p className="storage-warning" role="status">{storageWarning}</p>}
 {stage==='home'&&<><section className="home-hero landscape-home-hero"><h2>어디로 걸어갈까요<span>?</span></h2>{searchScope}<form className="search-form" onSubmit={onSubmit}><button className="home-search-submit" type="submit" aria-label="실제 장소 검색" disabled={configured!==true||locating||searching}><Icon name="search" size={23}/></button><input aria-label="실제 목적지 검색" placeholder="장소나 주소를 검색하세요" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/></form></section><div className="live-home-body">{saved&&!guidance&&<section className="saved-guidance" aria-label="이전 안내 복원"><h3>이전 안내를 이어갈까요?</h3><p>{saved.destination.name}</p><small>현재 위치를 새로 확인해요. 하루 이내의 안내만 이어갈 수 있어요.</small><button className="primary" disabled={restoring} onClick={()=>void restoreGuidance()}>{restoring?'현재 위치와 경로 확인 중…':'이전 안내 이어가기'}</button><button className="text-button" onClick={()=>{cancelRestore();clearSaved();}}>이전 안내 삭제</button>{restoreError&&<p className="inline-error" role="alert">{restoreError}</p>}</section>}{guidance&&<section className="ongoing-guidance" aria-label="진행 중인 안내"><div className="ongoing-title"><Icon name="flag" size={25}/><div><h3>{guidance.destination.name} {progress.arrived?'근처 도착':gps.active?'안내 중':'위치 확인 필요'}</h3><p role="status">{progress.arrived?'목적지 근처에 도착했어요. 실제 출입구를 확인해 주세요.':gps.active?'위치 안내가 계속되고 있어요.':'위치 안내가 멈춰 있어요.'}</p></div></div>{progress.position&&<p className="ongoing-distance">{progress.arrived?'경로 끝 기준 거리':gps.active?'남은 거리':'마지막 확인 거리'} {formatDistance(progress.remaining)}</p>}<button className="secondary" onClick={()=>{setError('');setStage('map');}}>안내로 돌아가기<Icon name="chevron" size={18}/></button></section>}{locationPanel}{setup}{error&&<p className="inline-error" role="alert">{error}</p>}<PwaInstall/><OrnamentalDivider kind="diamonds" className="home-history-divider"/><RecentHistoryPanel controller={recent} compact onDetails={()=>{setError('');setStage('history');}} onSearch={q=>void submitSearch(q)} onDestination={p=>void submitSearch(p.name)}/><footer className="usage-entry"><button className="text-button" onClick={()=>{cancelWork();setStage('privacy');}}>개인정보·이용 안내</button></footer></div></>}
 {stage==='ended'&&<section className="arrival padded ended-screen" aria-labelledby="guidance-ended-title"><OrnamentalDivider kind="lotus" className="arrival-decoration"/><div className="arrival-check"><Icon name="check" size={44}/></div><span className="eyebrow">오늘도 함께 걸었어요</span><h2 id="guidance-ended-title">길 안내를<br/>마쳤어요.</h2><div className="arrival-place ended-destination"><Icon name="pin"/><strong>{endedDestination}</strong></div><p className="arrival-copy">안내가 종료되었어요.<br/>오늘도 안전하게 걸어가세요.</p><button className="primary" onClick={()=>setStage('home')}><Icon name="check"/>안내 마치기</button><button className="secondary" onClick={()=>{setQuery('');setStage('home');}}>다른 목적지 찾기</button><div className="feedback"><h3>길 안내가 도움이 되었나요?</h3><p>평가는 선택 사항이며 저장되지 않아요.</p><div>{['도움이 됐어요','보통이에요','아쉬워요'].map((rating,index)=><button key={rating} aria-label={rating} aria-pressed={endRating===rating} className={endRating===rating?'selected':''} onClick={()=>setEndRating(rating)}><span aria-hidden="true">{['✧','◌','⌁'][index]}</span>{rating}</button>)}</div><div className="feedback-thanks" role="status">{endRating&&<><Motif kind="flower" size={30}/><span>의견을 들려주셔서 고마워요.</span></>}</div></div></section>}
 {stage==='history'&&<>{error&&<p className="inline-error" role="alert">{error}</p>}<RecentHistoryPanel controller={recent} onSearch={q=>void submitSearch(q)} onDestination={p=>void submitSearch(p.name)}/></>}
 {stage==='privacy'&&<UsageGuide onHistory={()=>setStage('history')}/>}
 {stage==='results'&&<section className="padded"><form className="search-form" onSubmit={onSubmit}><button type="submit" aria-label="다시 검색"><Icon name="search" size={21}/></button><input aria-label="검색어" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="검색어 지우기" onClick={()=>{searchAbort.current?.abort();setSearching(false);setQuery('');setPlaces([]);setSearched(false);setError('');}}><Icon name="close" size={18}/></button></form><div className="section-heading live-results-heading"><h3>검색 결과 {searched&&<em>{places.length}</em>}</h3><span>{searchOrigin?'주변 거리순':'전국 관련도순'}</span></div><p className="sample-description">{searchOrigin?'확인한 위치 반경 10km · 거리순':'전국 검색 · 현재 위치 기준이 아니에요'} · 거리는 직선 거리예요.</p>{searching&&<p role="status" className="connection-note">장소를 찾고 있어요…</p>}{error&&<div className="connection-note" role="alert"><p>{error}</p><button className="secondary" onClick={()=>void submitSearch()}>다시 검색</button></div>}<div className="search-results">{places.map(place=><button className={`result-card ${selected?.id===place.id?'selected-result':''}`} aria-pressed={selected?.id===place.id} key={place.id} onClick={()=>choose(place)}>{selected?.id===place.id&&<SelectionCorner/>}<span className="result-icon"><Icon name="pin"/></span><div className="result-copy"><small>{place.category}</small><h3>{place.name}</h3><p>{place.address}</p>{searchOrigin&&<span>직선 {formatDistance(distanceBetween(searchOrigin,place))}</span>}</div><Icon name="chevron" size={19}/></button>)}</div>{searched&&!places.length&&!error&&<div className="empty-state"><div className="empty-lattice"><Motif kind="lattice" size={54}/></div><h3>일치하는 장소가 없어요</h3><p>{searchOrigin?'주변 10km 안에 결과가 없어요. 전국 검색으로 범위를 넓혀 보세요.':'지역명과 장소명을 함께 입력해 보세요.'}</p>{searchOrigin&&<button className="secondary" onClick={()=>{setNearbySearch(false);void submitSearch(query,false);}}>전국에서 다시 검색</button>}</div>}</section>}
 {(stage==='route'||stage==='map')&&shownDestination&&<section className={`map-screen live-route-screen journey-screen ${stage==='map'?'journey-navigating':''}`}>{shownStart&&<WalkingMap onCameraHost={setCameraLauncherRoot} start={shownStart} destination={shownDestination} route={shownRoute||null} progress={shownProgress} navigating={stage==='map'} active={gps.active} fix={observedFix}/>}


 <div className="map-bottom bottom-sheet journey-sheet">
 {shownRoute?<RouteJourney destination={shownDestination} route={shownRoute} progress={shownProgress} active={gps.active} notice={gps.notice} navigating={stage==='map'} onStart={stage==='map'?resumeGuidance:startGuidance} onFinish={()=>setEnding(true)} rerouting={rerouting} rerouteError={rerouteError} onReroute={stage==='map'?()=>void rerouteGuidance():undefined} cameraControl={stage==='map'?<LiveCameraGuide launcherRoot={cameraLauncherRoot} destination={shownDestination} route={shownRoute} progress={progress} position={observedFix} active={gps.active} notice={gps.notice} overlayRoot={cameraRoot} closeSignal={cameraCloseSignal} onOpenChange={cameraChanged}/>:undefined}/>:<><div className="destination-heading selected-destination"><SelectionCorner/><span className="result-icon"><Icon name="pin"/></span><div><h2>{shownDestination.name}</h2><p>{shownDestination.address}</p></div></div>{setup}{!position&&locationPanel}{routing&&<p role="status" className="connection-note">걸어갈 경로를 찾고 있어요…</p>}{error&&<p className="inline-error" role="alert">{error}</p>}<button className="primary" disabled={routing||locating||configured!==true} onClick={()=>void getRoute()}><Icon name="walk"/>{routing?'도보 경로 찾는 중…':'도보 경로 찾기'}</button></>}
 </div></section>}
 </main>{stage==='map'&&shownRoute&&!cameraOpen&&<div className="map-guidance-layer" ref={guidanceLayer}><JourneyInstruction route={shownRoute} progress={progress} active={gps.active} notice={gps.notice} destination={shownDestination||undefined} fix={observedFix}/></div>}<div className="camera-viewport-host" ref={setCameraRoot}/></div></div>{review&&<aside className="studio-controls"><span className="eyebrow">REAL PLACE SEARCH</span><h2>검색에서<br/>도보 경로까지.</h2><p>실제 데이터와 시안 데이터를 섞지 않아요.<br/>위치 권한은 요청 버튼을 누를 때만 사용해요.</p>{review&&<button className="secondary" onClick={onDemo}>디자인 시안으로 돌아가기</button>}</aside>}
 <dialog ref={dialog} onCancel={cancelEnding}><div className="dialog-inner"><h2>{pendingGuidance?'새 목적지로 안내할까요?':guidance?'길 안내를 종료할까요?':'경로 확인을 마칠까요?'}</h2><p>{pendingGuidance?'현재 안내를 마치고 선택한 목적지로 안내를 시작해요.':guidance?'위치 추적을 멈추고 종료 화면으로 이동해요.':'경로 확인을 마치고 처음으로 돌아가요.'}</p><button className="primary" onClick={()=>{setEnding(false);const next=pendingGuidance;setPendingGuidance(null);if(next)beginGuidance(next);else finishGuidance();}}>{pendingGuidance?'새 안내 시작':'안내 종료'}</button><button className="secondary" onClick={cancelEnding}>계속 보기</button></div></dialog></div>;

}
const message=(error:unknown)=>error instanceof Error?error.message:'요청을 처리하지 못했어요. 다시 시도해 주세요.';
