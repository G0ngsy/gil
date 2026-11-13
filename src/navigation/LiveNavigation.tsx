import {PwaInstall} from '../PwaInstall';
import {useGpsTracking} from './useGpsTracking';
import {initialProgress,updateProgress,type Fix} from '../../shared/tracking';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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

type Stage='home'|'results'|'route'|'map'|'history';
interface Guidance {route:WalkingRoute;destination:Place;start:UserPosition}
interface Props {onDemo:()=>void;review?:boolean}
export function LiveNavigation({onDemo,review=false}:Props) {
 const recent=useRecentHistory('live');
 const [stage,setStage]=useState<Stage>('home');
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
 const [guidance,setGuidance]=useState<Guidance|null>(null);
 const guidanceRef=useRef<Guidance|null>(null);
 const [pendingGuidance,setPendingGuidance]=useState<Guidance|null>(null);
 const [progress,setProgress]=useState(initialProgress);
 const [observedFix,setObservedFix]=useState<Fix|null>(null);
 const gps=useGpsTracking(fix=>{const current=guidanceRef.current;if(current){setProgress(previous=>updateProgress(current.route,previous,fix));}},'실제 GPS 위치를 수신하고 있어요.',fix=>{if(guidanceRef.current)setObservedFix(fix);});
 useEffect(()=>{if(progress.arrived&&gps.active)gps.stop('도착을 확인해 GPS 추적을 마쳤어요.');},[progress.arrived,gps.active]);
 const content=useRef<HTMLElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const focus=useRef<HTMLElement|null>(null);
 const searchAbort=useRef<AbortController|null>(null);
 const addressAbort=useRef<AbortController|null>(null);
 const routeAbort=useRef<AbortController|null>(null);
 const locationVersion=useRef(0);
 const alive=useRef(false);
 const stageTitle={home:'길빛',results:'장소 검색',route:'도보 경로 확인',map:'길 안내',history:'이용 기록'}[stage];
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;locationVersion.current++;searchAbort.current?.abort();routeAbort.current?.abort();addressAbort.current?.abort();};},[]);
 useEffect(()=>{
  const controller=new AbortController();
  setConfigError('');setConfigured(null);
  navigationRequest<{searchConfigured:boolean}>('config',{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setConfigured(data.searchConfigured);}).catch(e=>{if(!controller.signal.aborted)setConfigError(message(e));});
  return()=>controller.abort();
 },[configAttempt]);
 useEffect(()=>{content.current?.scrollTo(0,0);},[stage]);
 useEffect(()=>{if(stage==='map')content.current?.scrollTo(0,0);},[gps.active]);
 useEffect(()=>{
  if(ending){focus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}
  else if(dialog.current?.open){dialog.current.close();focus.current?.focus();}
 },[ending]);

 function cancelWork(){searchAbort.current?.abort();routeAbort.current?.abort();locationVersion.current++;setSearching(false);setRouting(false);setLocating(false);}
 function back(){cancelWork();setError('');setStage(stage==='route'?'results':'home');}
 async function submitSearch(value=query,nearby=nearbySearch){
  const q=value.trim();setQuery(value);
  if(q.length<2||q.length>80){setError('검색어를 2~80자로 입력해 주세요.');return;}
  if(configured!==true){setError('검색 서비스가 아직 준비되지 않았어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.');return;}
  searchAbort.current?.abort();routeAbort.current?.abort();
  const controller=new AbortController();searchAbort.current=controller;
  setError('');setPlaces([]);setSearched(false);setSearching(true);setRoute(null);setSelected(null);
  try {
   let origin=nearby?position:null;
   if(origin&&Date.now()-origin.timestamp>120000){origin=await locate(false);if(!origin){setError('현재 위치를 갱신하지 못했어요. 다시 확인하거나 전국 검색을 선택해 주세요.');return;}}
   if(controller.signal.aborted)return;
   setSearchOrigin(origin);setStage('results');
   const data=await searchPlaces(q,controller.signal,origin||undefined);
   if(!controller.signal.aborted){setPlaces(data.places);setSearched(true);recent.recordSearch(q);}
  }catch(e){if(!controller.signal.aborted)setError(message(e));}
  finally{if(!controller.signal.aborted)setSearching(false);}
 }
 async function lookupAddress(point:UserPosition){
  addressAbort.current?.abort();const controller=new AbortController();addressAbort.current=controller;
  setAddress(null);setAddressError('');
  if(configured===false){setAddressLoading(false);setAddressError('위치는 확인했지만 주소를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.');return;}
  setAddressLoading(true);
  try{const data=await getLocationAddress(point,controller.signal);if(!data.location?.address)throw new Error('주소를 읽지 못했어요.');if(!controller.signal.aborted)setAddress(data.location);}
  catch(e){if(!controller.signal.aborted)setAddressError(`위치는 확인했지만 주소를 표시하지 못했어요. ${message(e)}`);}
  finally{if(!controller.signal.aborted)setAddressLoading(false);}
 }
 async function locate(cancelSearch=true):Promise<UserPosition|null>{
  if(cancelSearch){searchAbort.current?.abort();setSearching(false);}
  addressAbort.current?.abort();setAddress(null);setAddressError('');setAddressLoading(false);setPosition(null);
  const version=++locationVersion.current;
  routeAbort.current?.abort();setRouting(false);setRoute(null);
  setLocating(true);setLocationError('');setError('');
  try {
   const next=await getUserPosition();
   if(alive.current&&locationVersion.current===version){setPosition(next);void lookupAddress(next);return next;}
  }catch(e){if(alive.current&&locationVersion.current===version){setPosition(null);setLocationError(message(e));}}
  finally{if(alive.current&&locationVersion.current===version)setLocating(false);}
  return null;
 }
 function choose(place:Place){recent.recordDestination(place);cancelWork();setSelected(place);setRoute(null);setError('');setStage('route');}
 async function getRoute(){
  if(!selected)return;
  let origin=position;
  // A stale one-shot position must not silently become the next route's origin.
  if(!origin || Date.now()-origin.timestamp>120000)origin=await locate();
  if(!origin||!alive.current)return;
  routeAbort.current?.abort();const controller=new AbortController();routeAbort.current=controller;
  setRouting(true);setRoute(null);setError('');
  try {
   const data=await findWalkingRoute(origin,selected,controller.signal);
   if(!controller.signal.aborted)setRoute(data.route);
  }catch(e){if(!controller.signal.aborted)setError(message(e));}
  finally{if(!controller.signal.aborted)setRouting(false);}
 }
 function beginGuidance(next:Guidance){
  guidanceRef.current=next;setGuidance(next);setObservedFix(null);setProgress(initialProgress());setStage('map');gps.start();
 }
 function startGuidance(){
  if(!route||!selected||!position)return;
  const next={route,destination:selected,start:position};
  if(guidance){setPendingGuidance(next);setEnding(true);}else beginGuidance(next);
 }
 function resumeGuidance(){if(guidanceRef.current&&!progress.arrived)gps.start();}
 function finishGuidance(){gps.stop();cancelWork();guidanceRef.current=null;setGuidance(null);setObservedFix(null);setProgress(initialProgress());setRoute(null);setSelected(null);setStage('home');}
 function cancelEnding(){setEnding(false);setPendingGuidance(null);}
 const shownDestination=stage==='map'?guidance?.destination:selected;
 const shownRoute=stage==='map'?guidance?.route:route;
 const shownStart=stage==='map'?guidance?.start:position;
 const shownProgress=stage==='map'?progress:initialProgress();

 const onSubmit=(event:FormEvent)=>{event.preventDefault();void submitSearch();};
 const locationAction=locating?'현재 위치 확인 중…':position?'현재 위치 다시 확인':'현재 위치 확인';
 const locationText=address?address.address:locating?'현재 위치를 확인하고 있어요…':addressLoading?'현재 위치의 주소를 확인하고 있어요…':position?'현재 위치를 확인했어요':'현재 위치를 확인해 주세요';
 const locationPanel=<section className={`live-location ${stage==='home'?'compact-location':''}`} aria-label="현재 위치">
 {stage==='home'?<div className="compact-location-row"><Icon name="pin" size={25}/><div className="compact-location-copy"><span>현재 위치</span><strong className="current-address">{locationText}</strong></div><button className="icon-button" aria-label={locationAction} title={locationAction} disabled={locating||routing} onClick={()=>void locate()}><Icon name="locate" size={20}/></button></div>:<><div className="location-label"><Icon name="locate" size={18}/><strong>현재 위치 · 출발지</strong></div>{position?<><strong className="current-address">{locationText}</strong><p>주변 주소 · 오차 약 {Math.round(position.accuracy)}m<br/>확인 시각 {new Date(position.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</p></>:<p>현재 위치를 확인하면 주변 장소를 가까운 순서로 찾을 수 있어요.</p>}<button className="secondary" disabled={locating||routing} onClick={()=>void locate()}><Icon name="locate" size={19}/>{locationAction}</button></>}
 {position&&addressError&&<><p className="address-warning" role="status">{addressError}</p><button className="text-button" disabled={addressLoading||configured!==true} onClick={()=>void lookupAddress(position)}>주소 다시 확인</button></>}
 {locationError&&<p className="inline-error" role="alert">{locationError}</p>}</section>;
 const searchScope=<div className="search-scope"><label>검색 범위<select aria-label="검색 범위" value={position&&nearbySearch?'nearby':'national'} onChange={e=>setNearbySearch(e.target.value==='nearby')}><option value="nearby" disabled={!position}>내 주변 10km</option><option value="national">전국 검색</option></select></label>{!position&&<p>위치 미확인 · 전국 기준</p>}</div>;

 const setup=<>{configured===null&&!configError&&<p className="connection-note" role="status">검색을 준비하고 있어요…</p>}{configured===false&&<div className="connection-note"><strong>지금은 장소를 검색할 수 없어요.</strong><p>잠시 후 다시 시도해 주세요.</p>{review&&<button className="text-button" onClick={onDemo}>디자인 시안으로 돌아가기</button>}</div>}{configError&&<div className="connection-note" role="alert"><p>{configError}</p><button className="text-button" onClick={()=>setConfigAttempt(n=>n+1)}>다시 시도</button></div>}</>;

 return <div className={`studio live-studio ${review?'':'app-shell'}`}>{review&&<aside className="studio-intro"><span className="eyebrow">GILBIT / WALKING ROUTE</span><h1>눈앞의 길을,<br/>실제 경로로.</h1><p>장소를 찾고 현재 위치에서<br/>걸어갈 경로를 확인하세요.</p><div className="studio-rule"/><span className="studio-note">현재 위치는 버튼을 눌렀을 때만 확인해요.<br/>경로는 저장하지 않아요.</span>{review&&<button className="secondary return-demo" onClick={onDemo}>디자인 시안 보기</button>}</aside>}<div className="phone live-phone"><header className={`app-header ${stage==='home'?'home-header':''} ${stage==='map'?'guidance-header':''}`}>
  {stage==='home'?<Brand/>:<><button className="icon-button" aria-label="뒤로 가기" onClick={back}><Icon name="back"/></button><strong className="header-title">{stageTitle}</strong></>}
  {stage==='map'&&guidance&&<button className="icon-button" aria-label="안내 화면 닫기" onClick={()=>{setError('');setStage('home');}}><Icon name="close"/></button>}
  <>{review&&<button className="live-demo-exit" onClick={onDemo}>시안 보기</button>}</>
 </header><main className={`app-content live-content live-${stage}`} ref={content}>
 {stage==='home'&&<><section className="home-hero landscape-home-hero"><h2>어디로 걸어갈까요<span>?</span></h2>{searchScope}<form className="search-form" onSubmit={onSubmit}><button className="home-search-submit" type="submit" aria-label="실제 장소 검색" disabled={configured!==true||locating||searching}><Icon name="search" size={23}/></button><input aria-label="실제 목적지 검색" placeholder="장소나 주소를 검색하세요" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/></form></section><div className="live-home-body">{guidance&&<section className="ongoing-guidance" aria-label="진행 중인 안내"><div className="ongoing-title"><Icon name="flag" size={25}/><div><h3>{guidance.destination.name} {progress.arrived?'도착':gps.active?'안내 중':'위치 확인 필요'}</h3><p role="status">{progress.arrived?'목적지에 도착했어요.':gps.active?'위치 안내가 계속되고 있어요.':'위치 안내가 멈춰 있어요.'}</p></div></div>{progress.position&&<p className="ongoing-distance">{gps.active?'남은 거리':'마지막 확인 거리'} {formatDistance(progress.remaining)}</p>}<button className="secondary" onClick={()=>{setError('');setStage('map');}}>안내로 돌아가기<Icon name="chevron" size={18}/></button></section>}{locationPanel}{setup}{error&&<p className="inline-error" role="alert">{error}</p>}<PwaInstall/><OrnamentalDivider kind="diamonds" className="home-history-divider"/><RecentHistoryPanel controller={recent} compact onDetails={()=>{setError('');setStage('history');}} onSearch={q=>void submitSearch(q)} onDestination={p=>void submitSearch(p.name)}/></div></>}
 {stage==='history'&&<>{error&&<p className="inline-error" role="alert">{error}</p>}<RecentHistoryPanel controller={recent} onSearch={q=>void submitSearch(q)} onDestination={p=>void submitSearch(p.name)}/></>}
 {stage==='results'&&<section className="padded"><form className="search-form" onSubmit={onSubmit}><button type="submit" aria-label="다시 검색"><Icon name="search" size={21}/></button><input aria-label="검색어" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="검색어 지우기" onClick={()=>{searchAbort.current?.abort();setSearching(false);setQuery('');setPlaces([]);setSearched(false);setError('');}}><Icon name="close" size={18}/></button></form><div className="section-heading live-results-heading"><h3>검색 결과 {searched&&<em>{places.length}</em>}</h3><span>{searchOrigin?'주변 거리순':'전국 관련도순'}</span></div><p className="sample-description">{searchOrigin?'확인한 위치 반경 10km · 거리순':'전국 검색 · 현재 위치 기준이 아니에요'} · 거리는 직선 거리예요.</p>{searching&&<p role="status" className="connection-note">장소를 찾고 있어요…</p>}{error&&<div className="connection-note" role="alert"><p>{error}</p><button className="secondary" onClick={()=>void submitSearch()}>다시 검색</button></div>}<div className="search-results">{places.map(place=><button className={`result-card ${selected?.id===place.id?'selected-result':''}`} aria-pressed={selected?.id===place.id} key={place.id} onClick={()=>choose(place)}>{selected?.id===place.id&&<SelectionCorner/>}<span className="result-icon"><Icon name="pin"/></span><div className="result-copy"><small>{place.category}</small><h3>{place.name}</h3><p>{place.address}</p>{searchOrigin&&<span>직선 {formatDistance(distanceBetween(searchOrigin,place))}</span>}</div><Icon name="chevron" size={19}/></button>)}</div>{searched&&!places.length&&!error&&<div className="empty-state"><div className="empty-lattice"><Motif kind="lattice" size={54}/></div><h3>일치하는 장소가 없어요</h3><p>{searchOrigin?'주변 10km 안에 결과가 없어요. 전국 검색으로 범위를 넓혀 보세요.':'지역명과 장소명을 함께 입력해 보세요.'}</p>{searchOrigin&&<button className="secondary" onClick={()=>{setNearbySearch(false);void submitSearch(query,false);}}>전국에서 다시 검색</button>}</div>}</section>}
 {(stage==='route'||stage==='map')&&shownDestination&&<section className={`map-screen live-route-screen journey-screen ${stage==='map'?'journey-navigating':''}`}>{shownStart&&<WalkingMap start={shownStart} destination={shownDestination} route={shownRoute||null} progress={shownProgress} navigating={stage==='map'} active={gps.active} fix={observedFix}/>}
 {stage==='map'&&shownRoute&&<JourneyInstruction route={shownRoute} progress={progress} active={gps.active} notice={gps.notice} fix={observedFix}/>}

 <div className="map-bottom bottom-sheet journey-sheet">
 {shownRoute?<RouteJourney destination={shownDestination} route={shownRoute} progress={shownProgress} active={gps.active} notice={gps.notice} navigating={stage==='map'} onStart={stage==='map'?resumeGuidance:startGuidance} onFinish={()=>setEnding(true)} cameraControl={stage==='map'?<LiveCameraGuide route={shownRoute} progress={progress} position={observedFix} active={gps.active} notice={gps.notice}/>:undefined}/>:<><div className="destination-heading selected-destination"><SelectionCorner/><span className="result-icon"><Icon name="pin"/></span><div><h2>{shownDestination.name}</h2><p>{shownDestination.address}</p></div></div>{setup}{!position&&locationPanel}{routing&&<p role="status" className="connection-note">걸어갈 경로를 찾고 있어요…</p>}{error&&<p className="inline-error" role="alert">{error}</p>}<button className="primary" disabled={routing||locating||configured!==true} onClick={()=>void getRoute()}><Icon name="walk"/>{routing?'도보 경로 찾는 중…':'도보 경로 찾기'}</button></>}
 </div></section>}
 </main></div>{review&&<aside className="studio-controls"><span className="eyebrow">REAL PLACE SEARCH</span><h2>검색에서<br/>도보 경로까지.</h2><p>실제 데이터와 시안 데이터를 섞지 않아요.<br/>위치 권한은 요청 버튼을 누를 때만 사용해요.</p>{review&&<button className="secondary" onClick={onDemo}>디자인 시안으로 돌아가기</button>}</aside>}
 <dialog ref={dialog} onCancel={cancelEnding}><div className="dialog-inner"><h2>{pendingGuidance?'새 목적지로 안내할까요?':guidance?'길 안내를 종료할까요?':'경로 확인을 마칠까요?'}</h2><p>{pendingGuidance?'현재 안내를 마치고 선택한 목적지로 안내를 시작해요.':'안내를 마치고 처음으로 돌아가요.'}</p><button className="primary" onClick={()=>{setEnding(false);const next=pendingGuidance;setPendingGuidance(null);if(next)beginGuidance(next);else finishGuidance();}}>{pendingGuidance?'새 안내 시작':'안내 종료'}</button><button className="secondary" onClick={cancelEnding}>계속 보기</button></div></dialog></div>;

}
const message=(error:unknown)=>error instanceof Error?error.message:'요청을 처리하지 못했어요. 다시 시도해 주세요.';
