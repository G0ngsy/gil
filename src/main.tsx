import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Brand, DemoMap, Hanok, Icon, Lattice } from './ui';
import './style.css';

type Screen = 'home'|'search'|'route'|'map'|'camera'|'recheck'|'arrival';
const screenNames: Record<Screen,string> = {home:'목적지 검색',search:'검색 결과',route:'도보 경로',map:'지도 안내',camera:'카메라 안내',recheck:'방향 재확인',arrival:'도착 안내'};
const places = [
 {name:'중앙도서관',icon:'book',distance:'520m',time:'8분',address:'한빛시 중앙로 25',tag:'도서관'},
 {name:'시청',icon:'building',distance:'940m',time:'14분',address:'한빛시 시민로 1',tag:'공공기관'},
 {name:'보건소',icon:'health',distance:'1.2km',time:'19분',address:'한빛시 건강로 18',tag:'건강·복지'},
];

function App() {
 const initial = new URLSearchParams(location.search).get('screen');
 const [screen,setScreen]=useState<Screen>(initial && initial in screenNames ? initial as Screen:'home');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState(places[0]);
 const [menu,setMenu]=useState(false);
 const [ending,setEnding]=useState(false);
 const [rating,setRating]=useState('');
 const [dark,setDark]=useState(false);
 const [centered,setCentered]=useState(false);
 const [checking,setChecking]=useState(false);
 const [notice,setNotice]=useState('');
 const content=useRef<HTMLElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const lastFocus=useRef<HTMLElement|null>(null);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const camera = screen==='camera'||screen==='recheck';
 const navigating = camera||screen==='map';
 const go=(next:Screen)=>{setScreen(next);setMenu(false);setChecking(false);setNotice('');};
 useEffect(()=>{content.current?.scrollTo(0,0); const url=new URL(location.href);url.searchParams.set('screen',screen);history.replaceState(null,'',url);},[screen]);
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 useEffect(()=>{
  if(ending){lastFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}
  else if(dialog.current?.open){dialog.current.close();lastFocus.current?.focus();}
 },[ending]);
 const results=places.filter(p=>p.name.includes(query.trim())||p.address.includes(query.trim()));
 const choose=(p:typeof places[number])=>{setSelected(p);go('route');};
 const search=(value:string)=>{setQuery(value);go('search');};
 function showNotice(text:string){setNotice(text);timers.current.push(setTimeout(()=>setNotice(''),2200));}
 function retry(){setChecking(true);timers.current.push(setTimeout(()=>{setChecking(false);go('camera');},900));}

 return <div className="studio">
  <aside className="studio-intro"><span className="eyebrow">GILBIT / DESIGN STUDY 01</span><h1>낯선 길에도,<br/>마음 놓이는 한 걸음.</h1><p>한옥의 차분함을 담은<br/>나만의 도보 길잡이, 길빛.</p><div className="studio-rule"/><span className="studio-note">클릭하며 둘러보는 디자인 시안<br/>실제 위치·지도·카메라는 연결하지 않습니다.</span><div className="swatches"><i/><i/><i/><i/></div><span className="edition">HANJI · PINE · LIGHT</span></aside>
  <div className={`phone ${camera?'camera-phone':''}`}>
   <div className="status-bar" aria-hidden="true"><span>9:41</span><span className="status-icons">▮▮▮ <span>⌁</span> ▰</span></div>
   {!navigating && <header className={`app-header ${screen==='home'?'home-header':''}`}>{screen==='home'?<button className="brand-menu" aria-label="시안 확인 메뉴" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Brand/></button>:<button className="icon-button" aria-label="뒤로 가기" onClick={()=>go(screen==='search'?'home':screen==='route'?'search':'home')}><Icon name="back"/></button>}{screen!=='home'&&<span className="header-title">{screenNames[screen]}</span>}{screen==='home'?<button className="icon-button home-bell" aria-label="알림" onClick={()=>showNotice('새로운 알림이 없어요.')}><Icon name="bell" size={23}/></button>:<button className="sample-badge" aria-label="시안 확인 메뉴" aria-expanded={menu} onClick={()=>setMenu(!menu)}>디자인 시안 ···</button>}</header>}
   {navigating && <div className="navigation-top"><span><span className="mini-symbol">⌁</span> 길빛 <button className="nav-demo" aria-label="시안 확인 메뉴" aria-expanded={menu} onClick={()=>setMenu(!menu)}>안내 시안 ···</button></span><button className="icon-button" aria-label="안내 종료" onClick={()=>setEnding(true)}><Icon name="close"/></button></div>}
   <main ref={content} className={`app-content screen-${screen}`} key={screen}>
    {screen==='home' && <>
     <section className="home-hero"><Lattice/><Lattice right/><h2>어디로<br/>걸어갈까요<span>?</span></h2><form className="search-form" onSubmit={e=>{e.preventDefault();search(query);}}><button className="home-search-submit" aria-label="검색" type="submit"><Icon name="search" size={23}/></button><input aria-label="목적지 검색" placeholder="장소나 주소를 검색하세요" value={query} onChange={e=>setQuery(e.target.value)}/></form><Hanok/></section>
     <section className="recent-section"><div className="section-heading"><h3>최근 목적지</h3><span>익숙한 곳으로 한 걸음</span></div><div className="recent-grid">{places.map(p=><button key={p.name} className="place-tile" onClick={()=>search(p.name)}><span className="place-icon"><Icon name={p.icon} size={26}/></span><strong>{p.name}</strong><small>도보 {p.time}</small></button>)}</div></section>
     <section className="location-section"><div className="location-label"><Icon name="locate" size={18}/><span>현재 위치</span><small>예시 위치</small></div><div className="location-card"><div><strong>중앙공원 산책로 입구</strong><p>한빛시 중앙동 일대</p></div><button aria-label="현재 위치 예시 확인" className="icon-button" onClick={()=>showNotice('시안에서는 예시 위치를 사용해요.')}><Icon name="locate" size={20}/></button></div><DemoMap compact/></section><div className="home-footer"><span className="little-line"/>길을 찾는 순간도, 편안하도록<span className="little-line"/></div>
    </>}
    {screen==='search' && <section className="search-page padded"><form className="search-form" onSubmit={e=>{e.preventDefault();setQuery(query.trim());}}><Icon name="search"/><input aria-label="검색어" placeholder="장소나 주소를 검색하세요" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="검색어 지우기" onClick={()=>setQuery('')}><Icon name="close" size={19}/></button>}</form><div className="section-heading"><h3>검색 결과 <em>{results.length}</em></h3><span>가까운 거리순</span></div><p className="sample-description">아래 장소와 주소는 시안용 가상 정보예요.</p><div className="search-results">{results.map((p,i)=><button key={p.name} className="result-card" onClick={()=>choose(p)}><span className="result-icon"><Icon name={p.icon}/></span><div className="result-copy"><small>{p.tag}{i===0?' · 가장 가까운 곳':''}</small><h3>{p.name}</h3><p>{p.address}</p><span><Icon name="walk" size={16}/>{p.distance}<i/>도보 {p.time}</span></div><Icon name="chevron" size={19}/></button>)}</div>{results.length===0&&<div className="empty-state"><Icon name="search" size={38}/><h3>일치하는 장소가 없어요</h3><p>중앙도서관, 시청, 보건소를 검색해 보세요.</p><button className="secondary" onClick={()=>setQuery('')}>전체 예시 장소 보기</button></div>}<div className="quiet-note"><Icon name="leaf" size={19}/><span>목적지를 선택하면<br/>걸어갈 경로를 확인할 수 있어요.</span></div></section>}
    {(screen==='route'||screen==='map') && <section className="map-screen">
     {screen==='map'&&<div className="turn-card"><Icon name="turn" size={40}/><div><small>다음 이동 방향</small><h2>30m 앞 오른쪽</h2><p>{selected.name} 방향</p></div></div>}
     <DemoMap active={screen==='map'} title={selected.name} centered={centered}/><button className="map-locate icon-button" aria-label="현재 위치로 지도 이동" onClick={()=>{setCentered(true);showNotice('현재 위치를 중심으로 보았어요.');}}><Icon name="locate"/></button>
     <div className="map-bottom bottom-sheet"><span className="sheet-handle"/>{screen==='route'?<><span className="eyebrow">이 길을 따라 걸어가요</span><div className="destination-heading"><span className="result-icon"><Icon name={selected.icon}/></span><div><h2>{selected.name}</h2><p>{selected.address}</p></div></div><div className="trip-summary"><strong>{selected.time}</strong><span>도보 · {selected.distance}</span></div><p className="route-note"><Icon name="leaf" size={17}/>중앙공원을 지나 목적지 방향으로 이동</p><button className="primary" onClick={()=>go('map')}><Icon name="walk"/>길 안내 시작<Icon name="arrow" size={20}/></button></>:<><div className="active-summary"><div><strong>약 5분</strong><span>남은 거리 320m</span></div><span className="destination-tag">{selected.name}</span></div><button className="primary" onClick={()=>go('camera')}><Icon name="camera"/>카메라 안내</button><button className="text-button" onClick={()=>setEnding(true)}>안내 종료</button></>}</div>
    </section>}
    {camera&&<section className={`camera-screen ${dark?'night':''}`}><div className="camera-photo" role="img" aria-label="한옥 옆 보행로 예시 사진"/><div className="camera-shade"/>{screen==='camera'?<><div className="turn-card"><Icon name="turn" size={40}/><div><small>{selected.name} 방향</small><h2>30m 앞 오른쪽</h2></div></div><svg className="direction-arrow" viewBox="0 0 190 170" role="img" aria-label="오른쪽으로 이동"><path d="M38 150V91q0-29 30-29h47V29l53 51-53 50V97H78q-7 0-7 8v45Z" fill="#087F83" stroke="white" strokeWidth="7" strokeLinejoin="round"/></svg></>:<div className="recheck-card" role="status"><span className={`recheck-icon ${checking?'spinning':''}`}><Icon name="compass" size={35}/></span><h2>{checking?'방향을 다시 확인해요':'방향을 확인하고 있어요'}</h2><p>안전한 곳에 멈춰 휴대폰을<br/>천천히 움직여 주세요.</p><button className="primary" disabled={checking} onClick={retry}>{checking?'확인 중…':'다시 확인'}</button><button className="text-button" onClick={()=>go('map')}>지도 보기</button></div>}
     <div className="camera-bottom"><div className="camera-summary"><div><strong>약 5분</strong><span>남은 거리 320m</span></div><div className="camera-actions"><button className="secondary" onClick={()=>go('map')}><Icon name="map" size={20}/>지도 보기</button><button className="text-button" onClick={()=>setEnding(true)}>안내 종료</button></div></div><p className="safety"><Icon name="shield" size={17}/>안전한 곳에 멈춰 확인하세요</p></div></section>}
    {screen==='arrival'&&<section className="arrival padded"><div className="arrival-decoration"><span/><Icon name="leaf" size={24}/><span/></div><div className="arrival-check"><Icon name="check" size={44}/></div><span className="eyebrow">오늘도 잘 걸어왔어요</span><h2>목적지 근처에<br/>도착했어요.</h2><div className="arrival-place"><Icon name={selected.icon}/><strong>{selected.name}</strong></div><p className="arrival-copy">주변의 건물 이름과 출입구를<br/>확인해 주세요.</p><div className="arrival-trip"><span><Icon name="walk" size={18}/>{selected.distance}</span><i/><span><Icon name="clock" size={18}/>{selected.time} 소요</span></div><button className="primary" onClick={()=>go('home')}><Icon name="check"/>안내 마치기</button><button className="secondary" onClick={()=>{setQuery('');go('search');}}>다른 목적지 찾기</button><div className="feedback"><h3>길 안내가 도움이 되었나요?</h3><p>평가는 선택 사항이며 저장되지 않아요.</p><div>{['도움이 됐어요','보통이에요','아쉬워요'].map((r,i)=><button key={r} aria-label={r} aria-pressed={rating===r} className={rating===r?'selected':''} onClick={()=>setRating(r)}><span>{['✧','◌','⌁'][i]}</span>{r}</button>)}</div><span role="status">{rating?'의견을 선택했어요. 고마워요.':' '}</span></div></section>}
   </main>
   {notice&&<div className="toast" role="status">{notice}</div>}
   <div className="phone-bottom" aria-hidden="true"><span/></div>
  </div>
  <aside className="studio-controls"><span className="eyebrow">PROTOTYPE INDEX</span><h2>한 걸음씩,<br/>둘러보세요.</h2><nav aria-label="시안 화면 선택">{(Object.keys(screenNames) as Screen[]).map((s,i)=><button key={s} className={screen===s?'active':''} aria-current={screen===s?'page':undefined} onClick={()=>go(s)}><span>0{i+1}</span>{screenNames[s]}<Icon name="arrow" size={16}/></button>)}</nav><p>장소·지도·거리 사진은 예시입니다.<br/>위치 및 카메라 권한을 요청하지 않습니다.</p></aside>
  <button ref={trigger} className="preview-toggle" aria-label="시안 확인 메뉴" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Icon name="dots" size={19}/><span>시안 보기</span></button>
  {menu&&<div className="preview-popover"><div className="popover-heading"><strong>시안 확인 메뉴</strong><button aria-label="시안 메뉴 닫기" className="icon-button" onClick={()=>{setMenu(false);trigger.current?.focus();}}><Icon name="close" size={19}/></button></div><p>실제 이동 없이 화면을 살펴보세요.</p>{(Object.keys(screenNames) as Screen[]).map((s,i)=><button key={s} onClick={()=>go(s)}><span>0{i+1}</span>{screenNames[s]}<Icon name="chevron" size={16}/></button>)}<label className="dark-control"><input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)}/>카메라 어두운 배경 확인</label></div>}
  <dialog ref={dialog} onCancel={()=>setEnding(false)} onClick={e=>{if(e.target===e.currentTarget)setEnding(false);}}><div className="dialog-inner"><span className="dialog-icon"><Icon name="compass" size={28}/></span><h2>길 안내를 마칠까요?</h2><p>안내를 종료하고 처음으로 돌아가요.</p><button className="primary" onClick={()=>{setEnding(false);go('home');}}>안내 종료하기</button><button className="secondary" onClick={()=>setEnding(false)}>계속 안내받기</button></div></dialog>
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);




