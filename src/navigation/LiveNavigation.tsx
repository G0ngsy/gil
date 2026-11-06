import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Brand, Hanok, Icon, Lattice } from '../ui';
import { Motif } from '../Motif';
import { distanceBetween, formatDistance, formatDuration, type Place, type WalkingRoute } from '../../shared/navigation';
import { findWalkingRoute, getUserPosition, navigationRequest, searchPlaces, type UserPosition } from './client';
import { WalkingMap } from './WalkingMap';

type Stage='home'|'results'|'route'|'map';
interface Props {onDemo:()=>void}
export function LiveNavigation({onDemo}:Props) {
 const [stage,setStage]=useState<Stage>('home');
 const [query,setQuery]=useState('');
 const [places,setPlaces]=useState<Place[]>([]);
 const [selected,setSelected]=useState<Place|null>(null);
 const [position,setPosition]=useState<UserPosition|null>(null);
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
 const content=useRef<HTMLElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const focus=useRef<HTMLElement|null>(null);
 const searchAbort=useRef<AbortController|null>(null);
 const routeAbort=useRef<AbortController|null>(null);
 const locationVersion=useRef(0);
 const alive=useRef(false);
 const stageTitle={home:'길빛',results:'장소 검색',route:'도보 경로 확인',map:'도보 경로 살펴보기'}[stage];
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;locationVersion.current++;searchAbort.current?.abort();routeAbort.current?.abort();};},[]);
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

 function cancelWork(){searchAbort.current?.abort();routeAbort.current?.abort();locationVersion.current++;setSearching(false);setRouting(false);setLocating(false);}
 function back(){cancelWork();setError('');setStage(stage==='route'?'results':'home');}
 async function submitSearch(value=query){
  const q=value.trim();setQuery(value);
  if(q.length<2||q.length>80){setError('검색어를 2~80자로 입력해 주세요.');return;}
  if(configured!==true){setError('실제 검색을 아직 준비하고 있어요. 디자인 시안으로 먼저 둘러볼 수 있어요.');return;}
  searchAbort.current?.abort();routeAbort.current?.abort();
  const controller=new AbortController();searchAbort.current=controller;
  setStage('results');setError('');setPlaces([]);setSearched(false);setSearching(true);setRoute(null);setSelected(null);
  try {
   const data=await searchPlaces(q,controller.signal);
   if(!controller.signal.aborted){setPlaces(data.places);setSearched(true);}
  }catch(e){if(!controller.signal.aborted)setError(message(e));}
  finally{if(!controller.signal.aborted)setSearching(false);}
 }
 async function locate():Promise<UserPosition|null>{
  const version=++locationVersion.current;
  routeAbort.current?.abort();setRouting(false);setRoute(null);
  setLocating(true);setLocationError('');setError('');
  try {
   const next=await getUserPosition();
   if(alive.current&&locationVersion.current===version){setPosition(next);setFocusRequest(n=>n+1);return next;}
  }catch(e){if(alive.current&&locationVersion.current===version){setPosition(null);setLocationError(message(e));}}
  finally{if(alive.current&&locationVersion.current===version)setLocating(false);}
  return null;
 }
 function choose(place:Place){cancelWork();setSelected(place);setRoute(null);setError('');setFocusRequest(0);setStage('route');}
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
 const locationPanel=<section className="live-location"><div className="location-label"><Icon name="locate" size={18}/><strong>출발 위치</strong></div><p>{position?`현재 위치를 확인했어요 · 오차 약 ${Math.round(position.accuracy)}m`:'길찾기를 시작하려면 현재 위치를 확인해 주세요.'}</p><button className="secondary" disabled={locating||routing} onClick={()=>void locate()}><Icon name="locate" size={19}/>{locating?'현재 위치 확인 중…':position?'현재 위치 다시 확인':'현재 위치 확인'}</button>{locationError&&<p className="inline-error" role="alert">{locationError}</p>}</section>;
 const setup=<>{configured===null&&!configError&&<p className="connection-note" role="status">검색 서비스 연결을 확인하고 있어요…</p>}{configured===false&&<div className="connection-note"><strong>실제 장소 검색을 준비 중이에요.</strong><p>지금은 디자인 시안으로 화면을 둘러볼 수 있어요.</p><button className="text-button" onClick={onDemo}>디자인 시안으로 돌아가기</button></div>}{configError&&<div className="connection-note" role="alert"><p>{configError}</p><button className="text-button" onClick={()=>setConfigAttempt(n=>n+1)}>연결 다시 확인</button></div>}</>;

 return <div className="studio live-studio"><aside className="studio-intro"><span className="eyebrow">GILBIT / WALKING ROUTE</span><h1>눈앞의 길을,<br/>실제 경로로.</h1><p>장소를 찾고 현재 위치에서<br/>걸어갈 경로를 확인하세요.</p><div className="studio-rule"/><span className="studio-note">현재 위치는 버튼을 눌렀을 때만 확인해요.<br/>경로는 저장하지 않아요.</span><button className="secondary return-demo" onClick={onDemo}>디자인 시안 보기</button></aside><div className="phone live-phone"><header className={`app-header ${stage==='home'?'home-header':''}`}>
  {stage==='home'?<Brand/>:<><button className="icon-button" aria-label="뒤로 가기" onClick={back}><Icon name="back"/></button><strong className="header-title">{stageTitle}</strong></>}
  <button className="live-demo-exit" onClick={onDemo}>시안 보기</button>
 </header><main className={`app-content live-content live-${stage}`} ref={content}>
 {stage==='home'&&<><section className="home-hero"><Lattice/><Lattice right/><h2>어디로<br/>걸어갈까요<span>?</span></h2><form className="search-form" onSubmit={onSubmit}><button className="home-search-submit" type="submit" aria-label="실제 장소 검색" disabled={configured!==true}><Icon name="search" size={23}/></button><input aria-label="실제 목적지 검색" placeholder="장소나 주소를 검색하세요" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/></form><Hanok/></section><div className="live-home-body">{setup}{error&&<p className="inline-error" role="alert">{error}</p>}<div className="section-heading"><h3>이런 곳을 찾아보세요</h3></div><div className="suggestions">{['도서관','시청','보건소'].map((q,i)=><button key={q} className="place-tile" disabled={configured!==true} onClick={()=>void submitSearch(q)}><Icon name={['book','building','health'][i]} size={25}/><strong>{q}</strong></button>)}</div>{locationPanel}<p className="live-privacy">위치를 확인하면 이 기기의 좌표를 가져와요.<br/>도보 경로를 찾을 때 출발·도착 위치가 TMAP에 전달돼요.</p></div></>}
 {stage==='results'&&<section className="padded"><form className="search-form" onSubmit={onSubmit}><button type="submit" aria-label="다시 검색"><Icon name="search" size={21}/></button><input aria-label="검색어" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label="검색어 지우기" onClick={()=>{searchAbort.current?.abort();setSearching(false);setQuery('');setPlaces([]);setSearched(false);setError('');}}><Icon name="close" size={18}/></button></form><div className="section-heading live-results-heading"><h3>검색 결과 {searched&&<em>{places.length}</em>}</h3><span>관련도순</span></div><p className="sample-description">TMAP 장소 검색 · 거리는 직선 거리예요.</p>{searching&&<p role="status" className="connection-note">장소를 찾고 있어요…</p>}{error&&<div className="connection-note" role="alert"><p>{error}</p><button className="secondary" onClick={()=>void submitSearch()}>다시 검색</button></div>}<div className="search-results">{places.map(place=><button className="result-card" key={place.id} onClick={()=>choose(place)}><span className="result-icon"><Icon name="pin"/></span><div className="result-copy"><small>{place.category}</small><h3>{place.name}</h3><p>{place.address}</p>{position&&<span>직선 {formatDistance(distanceBetween(position,place))}</span>}</div><Icon name="chevron" size={19}/></button>)}</div>{searched&&!places.length&&!error&&<div className="empty-state"><div className="empty-lattice"><Motif kind="lattice" size={54}/></div><h3>일치하는 장소가 없어요</h3><p>지역명과 장소명을 함께 입력해 보세요.</p></div>}</section>}
 {(stage==='route'||stage==='map')&&selected&&<section className="map-screen live-route-screen">{position?<><WalkingMap start={position} destination={selected} route={route} focusRequest={focusRequest}/><button className="map-locate icon-button" aria-label="출발 위치로 지도 이동" onClick={()=>setFocusRequest(n=>n+1)}><Icon name="locate"/></button></>:<div className="live-no-position"><Icon name="map" size={43}/><p>출발 위치를 확인하면<br/>목적지와 경로를 볼 수 있어요.</p></div>}
  <div className="map-bottom bottom-sheet"><span className="sheet-handle"/><div className="destination-heading"><span className="result-icon"><Icon name="pin"/></span><div><h2>{selected.name}</h2><p>{selected.address}</p></div></div>{setup}
   {route?<><div className="trip-summary"><strong>{formatDuration(route.durationSeconds)}</strong><span>도보 · {formatDistance(route.distanceMeters)}</span></div><p className="route-note">{route.steps[0]?.description||'지도에 표시된 도보 경로를 확인해 주세요.'}</p><p className="live-route-notice">전체 경로 정보예요. 이동에 따른 자동 안내와 카메라 안내는 아직 준비 중이에요.</p>{stage==='route'?<button className="primary" onClick={()=>setStage('map')}><Icon name="map"/>경로 살펴보기</button>:<button className="secondary" onClick={()=>setStage('route')}>경로 정보로 돌아가기</button>}<button className="text-button" onClick={()=>setEnding(true)}>경로 확인 마치기</button></>:<>{locationPanel}{routing&&<p role="status" className="connection-note">걸어갈 경로를 찾고 있어요…</p>}{error&&<p className="inline-error" role="alert">{error}</p>}<button className="primary" disabled={routing||locating||configured!==true} onClick={()=>void getRoute()}><Icon name="walk"/>{routing?'도보 경로 찾는 중…':'도보 경로 찾기'}</button><p className="live-privacy">출발·도착 위치를 TMAP에 보내 경로를 계산해요.</p></>}
  </div></section>}
 </main><footer className="live-bottom"><span>TMAP 장소·도보 경로 연결</span><span className="live-status">{configured?'연결 준비됨':'설정 대기'}</span></footer></div><aside className="studio-controls"><span className="eyebrow">REAL PLACE SEARCH</span><h2>검색에서<br/>도보 경로까지.</h2><p>실제 데이터와 시안 데이터를 섞지 않아요.<br/>위치 권한은 요청 버튼을 누를 때만 사용해요.</p><button className="secondary" onClick={onDemo}>디자인 시안으로 돌아가기</button></aside>
 <dialog ref={dialog} onCancel={()=>setEnding(false)}><div className="dialog-inner"><h2>경로 확인을 마칠까요?</h2><p>검색한 경로를 지우고 처음으로 돌아가요.</p><button className="primary" onClick={()=>{setEnding(false);cancelWork();setRoute(null);setSelected(null);setStage('home');}}>확인 마치기</button><button className="secondary" onClick={()=>setEnding(false)}>계속 보기</button></div></dialog></div>;
}
const message=(error:unknown)=>error instanceof Error?error.message:'요청을 처리하지 못했어요. 다시 시도해 주세요.';
