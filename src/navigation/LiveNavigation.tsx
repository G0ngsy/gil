import {useGpsTracking} from './useGpsTracking';
import {initialProgress,updateProgress} from '../../shared/tracking';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Brand, Hanok, Icon, Lattice } from '../ui';
import { Motif } from '../Motif';
import { distanceBetween, formatDistance, formatDuration, type LocationAddress, type Place, type WalkingRoute } from '../../shared/navigation';
import { findWalkingRoute, getLocationAddress, getUserPosition, navigationRequest, searchPlaces, type UserPosition } from './client';
import {useRecentHistory} from '../history';
import {RecentHistoryPanel} from '../RecentHistory';
import { WalkingMap } from './WalkingMap';

type Stage='home'|'results'|'route'|'map'|'history';
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
 const [focusRequest,setFocusRequest]=useState(0);
 const [ending,setEnding]=useState(false);
 const [progress,setProgress]=useState(initialProgress);
 const [trackingStarted,setTrackingStarted]=useState(false);
 const gps=useGpsTracking(fix=>{if(route)setProgress(previous=>updateProgress(route,previous,fix));},'실제 GPS 위치를 수신하고 있어요.');
 useEffect(()=>{gps.stop('');setTrackingStarted(false);setProgress(initialProgress());},[route]);
 useEffect(()=>{if(progress.arrived&&gps.active)gps.stop('도착을 확인해 GPS 추적을 마쳤어요.');},[progress.arrived,gps.active]);
 const content=useRef<HTMLElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const focus=useRef<HTMLElement|null>(null);
 const searchAbort=useRef<AbortController|null>(null);
 const addressAbort=useRef<AbortController|null>(null);
 const routeAbort=useRef<AbortController|null>(null);
 const locationVersion=useRef(0);
 const alive=useRef(false);
 const stageTitle={home:'길빛',results:'장소 검색',route:'도보 경로 확인',map:'도보 경로 살펴보기',history:'이용 기록'}[stage];
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;locationVersion.current++;searchAbort.current?.abort();routeAbort.current?.abort();addressAbort.current?.abort();};},[]);
 useEffect(()=>{
  const controller=new AbortController();
  setConfigError('');setConfigured(null);
  navigationRequest<{searchConfigured:boolean}>('config',{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setConfigured(data.searchConfigured);}).catch(e=>{if(!controller.signal.aborted)setConfigError(message(e));});
  return()=>controller.abort();
 },[configAttempt]);
 useEffect(()=>{content.current?.scrollTo(0,0);},[stage]);
 useEffect(()=>{
  if(ending){focus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}
  else if(dialog.current?.open){dialog.current.close();focus.current?.focus();}
 },[ending]);

 function cancelWork(){gps.stop();searchAbort.current?.abort();routeAbort.current?.abort();locationVersion.current++;setSearching(false);setRouting(false);setLocating(false);}
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
  if(configured===false){setAddressLoading(false);setAddressError('좌표는 확인했어요. 주소 표시는 검색 서비스 연결 후 이용할 수 있어요.');return;}
  setAddressLoading(true);
  try{const data=await getLocationAddress(point,controller.signal);if(!data.location?.address)throw new Error('주소를 읽지 못했어요.');if(!controller.signal.aborted)setAddress(data.location);}
  catch(e){if(!controller.signal.aborted)setAddressError(`위치는 확인했지만 주소를 표시하지 못했어요. ${message(e)}`);}
  finally{if(!controller.signal.aborted)setAddressLoading(false);}
 }
 async function locate(cancelSearch=true):Promise<UserPosition|null>{
  gps.stop();
  if(cancelSearch){searchAbort.current?.abort();setSearching(false);}
  addressAbort.current?.abort();setAddress(null);setAddressError('');setAddressLoading(false);setPosition(null);
  const version=++locationVersion.current;
  routeAbort.current?.abort();setRouting(false);setRoute(null);
  setLocating(true);setLocationError('');setError('');
  try {
   const next=await getUserPosition();
   if(alive.current&&locationVersion.current===version){setPosition(next);setFocusRequest(n=>n+1);void lookupAddress(next);return next;}
  }catch(e){if(alive.current&&locationVersion.current===version){setPosition(null);setLocationError(message(e));}}
  finally{if(alive.current&&locationVersion.current===version)setLocating(false);}
  return null;
 }
 function choose(place:Place){recent.recordDestination(place);cancelWork();setSelected(place);setRoute(null);setError('');setFocusRequest(0);setStage('route');}
 async function getRoute(){
  if(!selected)return;
  let origin=position;
  // A stale one-shot position must not silently become the next route's origin.
  if(!origin || Date.now()-origin.timestamp>120000)origin=await locate();
  if(!origin||!alive.current)return;
  routeAbort.current?.abort();const controller=new AbortController();routeAbort.current=controller;
  setRouting(true);setRoute(null);setError('');setFocusRequest(0);
  try {
   const data=await findWalkingRoute(origin,selected,controller.signal);
   if(!controller.signal.aborted)setRoute(data.route);
  }catch(e){if(!controller.signal.aborted)setError(message(e));}
  finally{if(!controller.signal.aborted)setRouting(false);}
 }
 const onSubmit=(event:FormEvent)=>{event.preventDefault();void submitSearch();};
 const locationPanel=<section className="live-location" aria-label="현재 위치"><div className="location-label"><Icon name="locate" size={18}/><strong>현재 위치 · 출발지</strong></div>
 {position?<><strong className="current-address">{address?address.address:addressLoading?'현재 위치의 주소를 확인하고 있어요…':'현재 위치 좌표를 확인했어요'}</strong><p>GPS 기준 주변 주소 · 오차 약 {Math.round(position.accuracy)}m<br/>확인 시각 {new Date(position.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</p></>:<p>현재 위치를 확인하면 주변 장소를 가까운 순서로 찾을 수 있어요.</p>}
 <button className="secondary" disabled={locating||routing} onClick={()=>void locate()}><Icon name="locate" size={19}/>{locating?'현재 위치 확인 중…':position?'현재 위치 다시 확인':'현재 위치 확인'}</button>
 {position&&addressError&&<><p className="address-warning" role="status">{addressError}</p><button className="text-button" disabled={addressLoading||configured!==true} onClick={()=>void lookupAddress(position)}>주소 다시 확인</button></>}
 {!position&&<p className="location-disclosure">주소 확인·주변 검색을 위해 현재 좌표를 서버와 TMAP에 전달해요. 위치는 저장하지 않아요.</p>}
 {locationError&&<p className="inline-error" role="alert">{locationError}</p>}</section>;
 const searchScope=<div className="search-scope"><label>검색 범위<select aria-label="검색 범위" value={position&&nearbySearch?'nearby':'national'} onChange={e=>setNearbySearch(e.target.value==='nearby')}><option value="nearby" disabled={!position}>내 주변 10km</option><option value="national">전국 검색</option></select></label>{!position&&<p>위치를 확인하기 전에는 전국에서 검색해요.</p>}</div>;

 const setup=<>{configured===null&&!configError&&<p className="connection-note" role="status">검색 서비스 연결을 확인하고 있어요…</p>}{configured===false&&<div className="connection-note"><strong>실제 장소 검색을 준비 중이에요.</strong><p>검색 서비스 설정을 확인한 뒤 다시 이용해 주세요.</p>{review&&<button className="text-button" onClick={onDemo}>디자인 시안으로 돌아가기</button>}</div>}{configError&&<div className="connection-note" role="alert"><p>{configError}</p><button className="text-button" onClick={()=>setConfigAttempt(n=>n+1)}>연결 다시 확인</button></div>}</>;

 return <div className={`studio live-studio ${review?'':'app-shell'}`}><aside className="studio-intro"><span className="eyebrow">GILBIT / WALKING ROUTE</span><h1>눈앞의 길을,<br/>실제 경로로.</h1><p>장소를 찾고 현재 위치에서<br/>걸어갈 경로를 확인하세요.</p><div className="studio-rule"/><span className="studio-note">현재 위치는 버튼을 눌렀을 때만 확인해요.<br/>경로는 저장하지 않아요.</span>{review&&<button className="secondary return-demo" onClick={onDemo}>디자인 시안 보기</button>}</aside><div className="phone live-phone"><header className={`app-header ${stage==='home'?'home-header':''}`}>
  {stage==='home'?<Brand/>:<><button className="icon-button" aria-label="뒤로 가기" onClick={back}><Icon name="back"/></button><strong className="header-title">{stageTitle}</strong></>}
  <>{review&&<button className="live-demo-exit" onClick={onDemo}>시안 보기</button>}</>
 </header><main className={`app-content live-content live-${stage}`} ref={content}>
 {stage==='home'&&<><section className="home-hero"><Lattice/><Lattice right/><h2>어디로<br/>걸어갈까요<span>?</span></h2><form className="search-form" onSubmit={onSubmit}><button className="home-search-submit" type="submit" aria-label="실제 장소 검색" disabled={configured!==true||locating||searching}><Icon name="search" size={23}/></button><input aria-label="실제 목적지 검색" placeholder="장소나 주소를 검색하세요" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/></form><Hanok/></section><div className="live-home-body">{locationPanel}{searchScope}{setup}{error&&<p className="inline-error" role="alert">{error}</p>}<RecentHistoryPanel controller={recent} compact onDetails={()=>{setError('');setStage('history');}} onSearch={q=>void submitSearch(q)} onDestination={p=>void submitSearch(p.name)}/><p className="live-privacy">주소·주변 검색에는 현재 위치, 도보 경로 계산에는 출발·도착 위치가 TMAP에 전달돼요. 좌표와 현재 주소는 저장하지 않아요.</p></div></>}
 {stage==='history'&&<>{error&&<p className="inline-error" role="alert">{error}</p>}<RecentHistoryPanel controller={recent} onSearch={q=>void submitSearch(q)} onDestination={p=>void submitSearch(p.name)}/></>}
 {stage==='results'&&<section className="padded"><form className="search-form" onSubmit={onSubmit}><button type="submit" aria-label="다시 검색"><Icon name="search" size={21}/></button><input aria-label="검색어" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="검색어 지우기" onClick={()=>{searchAbort.current?.abort();setSearching(false);setQuery('');setPlaces([]);setSearched(false);setError('');}}><Icon name="close" size={18}/></button></form><div className="section-heading live-results-heading"><h3>검색 결과 {searched&&<em>{places.length}</em>}</h3><span>{searchOrigin?'주변 거리순':'전국 관련도순'}</span></div><p className="sample-description">{searchOrigin?'확인한 위치 반경 10km · 거리순':'전국 검색 · 현재 위치 기준이 아니에요'} · 거리는 직선 거리예요.</p>{searching&&<p role="status" className="connection-note">장소를 찾고 있어요…</p>}{error&&<div className="connection-note" role="alert"><p>{error}</p><button className="secondary" onClick={()=>void submitSearch()}>다시 검색</button></div>}<div className="search-results">{places.map(place=><button className="result-card" key={place.id} onClick={()=>choose(place)}><span className="result-icon"><Icon name="pin"/></span><div className="result-copy"><small>{place.category}</small><h3>{place.name}</h3><p>{place.address}</p>{searchOrigin&&<span>직선 {formatDistance(distanceBetween(searchOrigin,place))}</span>}</div><Icon name="chevron" size={19}/></button>)}</div>{searched&&!places.length&&!error&&<div className="empty-state"><div className="empty-lattice"><Motif kind="lattice" size={54}/></div><h3>일치하는 장소가 없어요</h3><p>{searchOrigin?'주변 10km 안에 결과가 없어요. 전국 검색으로 범위를 넓혀 보세요.':'지역명과 장소명을 함께 입력해 보세요.'}</p>{searchOrigin&&<button className="secondary" onClick={()=>{setNearbySearch(false);void submitSearch(query,false);}}>전국에서 다시 검색</button>}</div>}</section>}
 {(stage==='route'||stage==='map')&&selected&&<section className="map-screen live-route-screen">{position?<><WalkingMap start={position} destination={selected} route={route} focusRequest={focusRequest} currentPosition={trackingStarted?progress.position:null}/><button className="map-locate icon-button" aria-label="출발 위치로 지도 이동" onClick={()=>setFocusRequest(n=>n+1)}><Icon name="locate"/></button></>:<div className="live-no-position"><Icon name="map" size={43}/><p>출발 위치를 확인하면<br/>목적지와 경로를 볼 수 있어요.</p></div>}
  <div className="map-bottom bottom-sheet"><span className="sheet-handle"/><div className="destination-heading"><span className="result-icon"><Icon name="pin"/></span><div><h2>{selected.name}</h2><p>{selected.address}</p></div></div>{setup}
   {route?<><div className="trip-summary"><strong>{formatDuration(route.durationSeconds)}</strong><span>도보 · {formatDistance(route.distanceMeters)}</span></div><section className="tracking-guide" aria-label="실제 경로 이동 안내">
 <h2>{progress.arrived?'목적지에 도착했어요':progress.offRoute?'경로를 벗어났어요':gps.active?'이동 안내':'이동 안내 대기'}</h2>
 <p>남은 거리 <strong data-testid="live-remaining">{formatDistance(progress.position?progress.remaining:route.distanceMeters)}</strong></p>
 {trackingStarted&&<div aria-live="polite"><p>{progress.arrived?'안내를 마쳤어요.':!gps.active?'GPS 추적이 중지됐어요. 다시 시작하려면 버튼을 눌러 주세요.':!progress.position?'새 GPS 위치를 기다리고 있어요.':progress.rejected?'위치를 반영하지 않았어요. 새 GPS 위치를 기다려 주세요.':progress.offRoute?'안전한 곳에서 경로를 확인해 주세요. 경로로 돌아오면 안내를 이어가요.':route.steps[progress.stepIndex]?.description||'지도에서 경로를 확인해 주세요.'}</p>{progress.position&&route.steps.length>0&&<p>안내 단계 {progress.stepIndex+1} / {route.steps.length}</p>}</div>}
 <button className="primary" disabled={gps.active||progress.arrived} onClick={()=>{setTrackingStarted(true);setProgress(initialProgress());gps.start();}}>GPS 이동 안내 시작</button>
 {gps.active&&<button className="secondary" onClick={()=>gps.stop()}>GPS 이동 안내 중지</button>}
 <p role="status">{gps.notice}</p>
 <p className="live-privacy">시작하면 위치를 계속 확인해요. 탭을 숨기거나 경로 확인을 마치면 중지해요. 경로 이탈 시 자동 재탐색은 하지 않아요.</p>
 </section><details className="route-directions" key={selected.id}>
 <summary>전체 도보 안내 보기 <span>{route.steps.filter(step=>step.description.trim()).length}개</span></summary>
 <p className="directions-notice">출발부터 도착까지의 안내예요. 현재 위치에 따라 자동으로 바뀌지 않아요. 주변과 신호를 직접 확인해 주세요.</p>
 {route.steps.some(step=>step.description.trim())?<ol aria-label="전체 도보 안내">{route.steps.filter(step=>step.description.trim()).map((step,index)=><li key={index}><span aria-hidden="true">{index+1}</span><p>{step.description}</p></li>)}</ol>:<p className="directions-empty">이 경로에는 상세 안내가 없어요. 지도에서 전체 경로를 확인해 주세요.</p>}
 </details><p className="live-route-notice">위의 시간은 전체 경로 기준이에요. GPS 이동 안내는 시작 버튼을 눌러 사용해요. 카메라 안내는 준비 중이에요.</p>{stage==='route'?<button className="primary" onClick={()=>setStage('map')}><Icon name="map"/>경로 살펴보기</button>:<button className="secondary" onClick={()=>setStage('route')}>경로 정보로 돌아가기</button>}<button className="text-button" onClick={()=>setEnding(true)}>경로 확인 마치기</button></>:<>{locationPanel}{routing&&<p role="status" className="connection-note">걸어갈 경로를 찾고 있어요…</p>}{error&&<p className="inline-error" role="alert">{error}</p>}<button className="primary" disabled={routing||locating||configured!==true} onClick={()=>void getRoute()}><Icon name="walk"/>{routing?'도보 경로 찾는 중…':'도보 경로 찾기'}</button><p className="live-privacy">출발·도착 위치를 TMAP에 보내 경로를 계산해요.</p></>}
  </div></section>}
 </main><footer className="live-bottom"><span>TMAP 장소·도보 경로 연결</span><span className="live-status">{configured?'연결 준비됨':'설정 대기'}</span></footer></div><aside className="studio-controls"><span className="eyebrow">REAL PLACE SEARCH</span><h2>검색에서<br/>도보 경로까지.</h2><p>실제 데이터와 시안 데이터를 섞지 않아요.<br/>위치 권한은 요청 버튼을 누를 때만 사용해요.</p>{review&&<button className="secondary" onClick={onDemo}>디자인 시안으로 돌아가기</button>}</aside>
 <dialog ref={dialog} onCancel={()=>setEnding(false)}><div className="dialog-inner"><h2>경로 확인을 마칠까요?</h2><p>검색한 경로를 지우고 처음으로 돌아가요.</p><button className="primary" onClick={()=>{setEnding(false);cancelWork();setRoute(null);setSelected(null);setStage('home');}}>확인 마치기</button><button className="secondary" onClick={()=>setEnding(false)}>계속 보기</button></div></dialog></div>;
}
const message=(error:unknown)=>error instanceof Error?error.message:'요청을 처리하지 못했어요. 다시 시도해 주세요.';
