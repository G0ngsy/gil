import {useState} from 'react';
import type {HistoryController,SavedDestination} from './history';
export function RecentHistoryPanel({controller,onSearch,onDestination,demo=false,compact=false,onDetails}:{compact?:boolean;onDetails?:()=>void;controller:HistoryController;onSearch:(q:string)=>void;onDestination:(place:SavedDestination)=>void;demo?:boolean}){
 const [confirm,setConfirm]=useState(false);
 const {history,warning}=controller;
 const hasItems=history.searches.length>0||history.destinations.length>0;
 if(compact){const place=history.destinations[0];return <section className="history-panel history-compact" aria-label={demo?'최근 예시 목적지':'최근 목적지'}><div className="section-heading"><h3>최근 목적지</h3><button className="text-button" onClick={onDetails}>기록 자세히 보기</button></div>
 {place?<button className="history-item" aria-label={`${place.name} 목적지 다시 찾기`} onClick={()=>onDestination(place)}><strong>{place.name}</strong><small>{place.address}</small></button>:<p className="history-empty">최근 목적지가 없어요.</p>}
 {demo&&<p className="history-note">예시 화면에서 선택한 목적지예요.</p>}{warning&&<p className="inline-error" role="alert">{warning}</p>}</section>;}

 return <section className="history-panel" aria-label={demo?'예시 이용 기록':'이용 기록'}><div className="section-heading"><h3>{demo?'예시 이용 기록':'최근 이용 기록'}</h3>{hasItems&&<button className="text-button" onClick={()=>setConfirm(true)}>전체 삭제</button>}</div>
 <p className="history-note">{demo?'예시 화면에서 사용한 기록이에요. 실제 검색 기록과 따로 저장돼요.':'검색어와 선택한 목적지 이름·주소를 이 브라우저에만 저장해요.'}</p>
 {confirm&&hasItems&&<div className="history-confirm" role="group" aria-label="전체 기록 삭제 확인"><p>{demo?'예시 이용':'실제 검색 이용'} 기록을 모두 삭제할까요?</p><button className="secondary" onClick={()=>setConfirm(false)}>취소</button><button className="primary" onClick={()=>{controller.clear();setConfirm(false);}}>모두 삭제하기</button></div>}
 <h4>최근 검색</h4>{history.searches.length?<ul>{history.searches.map(query=><li key={query}><button className="history-item" aria-label={`${query} 다시 검색`} onClick={()=>onSearch(query)}>{query}</button><button className="history-delete" aria-label={`${query} 검색 기록 삭제`} onClick={()=>controller.removeSearch(query)}>삭제</button></li>)}</ul>:<p className="history-empty">최근 검색이 없어요.</p>}
 <h4>최근 목적지</h4>{history.destinations.length?<ul>{history.destinations.map(place=><li key={place.id}><button className="history-item" aria-label={`${place.name} 목적지 다시 찾기`} onClick={()=>onDestination(place)}><strong>{place.name}</strong><small>{place.address}</small></button><button className="history-delete" aria-label={`${place.name} 목적지 기록 삭제`} onClick={()=>controller.removeDestination(place.id)}>삭제</button></li>)}</ul>:<p className="history-empty">최근 목적지가 없어요.</p>}
 {warning&&<p className="inline-error" role="alert">{warning}</p>}
 </section>;
}
