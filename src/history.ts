import {useEffect,useRef,useState} from 'react';
export type HistoryMode='demo'|'live';
export interface SavedDestination {id:string;name:string;address:string}
export interface RecentHistory {version:1;searches:string[];destinations:SavedDestination[]}
const empty=():RecentHistory=>({version:1,searches:[],destinations:[]});
export const historyKey=(mode:HistoryMode)=>`gilbit.history.v1.${mode}`;
export const cleanSearch=(query:string)=>query.trim().replace(/\s+/g,' ').slice(0,80);
const validText=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length>0&&v.length<=max;
export function parseHistory(raw:string|null):RecentHistory{
 if(!raw)return empty();
 try{
  const data=JSON.parse(raw);if(data?.version!==1||!Array.isArray(data.searches)||!Array.isArray(data.destinations))return empty();
  const searches=[...new Set<string>(data.searches.filter((s:unknown)=>validText(s,80)).map(cleanSearch).filter(Boolean))].slice(0,10);
  const destinations:SavedDestination[]=[];
  for(const d of data.destinations){if(d&&validText(d.id,200)&&validText(d.name,200)&&typeof d.address==='string'&&d.address.length<=500&&!destinations.some(p=>p.id===d.id))destinations.push({id:d.id,name:d.name,address:d.address});if(destinations.length===10)break;}
  return {version:1,searches,destinations};
 }catch{return empty();}
}
export function addSearch(history:RecentHistory,query:string):RecentHistory{
 const q=cleanSearch(query);return q?{...history,searches:[q,...history.searches.filter(s=>s.toLocaleLowerCase()!==q.toLocaleLowerCase())].slice(0,10)}:history;
}
export function addDestination(history:RecentHistory,place:SavedDestination):RecentHistory{
 return {...history,destinations:[{id:place.id,name:place.name,address:place.address},...history.destinations.filter(d=>d.id!==place.id)].slice(0,10)};
}
export function useRecentHistory(mode:HistoryMode){
 const load=()=>{try{return parseHistory(localStorage.getItem(historyKey(mode)));}catch{return empty();}};
 const [history,setHistory]=useState<RecentHistory>(load);
 const [warning,setWarning]=useState('');
 const latest=useRef(history);
 useEffect(()=>{
  const sync=(e:StorageEvent)=>{if(e.key===historyKey(mode)||e.key===null){const next=load();latest.current=next;setHistory(next);}};
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[mode]);
 function update(change:(h:RecentHistory)=>RecentHistory){
  const next=change(latest.current);latest.current=next;setHistory(next);
  try{if(!next.searches.length&&!next.destinations.length)localStorage.removeItem(historyKey(mode));else localStorage.setItem(historyKey(mode),JSON.stringify(next));setWarning('');}
  catch{setWarning('이 브라우저에서는 기록을 저장하거나 삭제하지 못했어요. 현재 화면에만 반영되며 기존 저장 기록이 남아 있을 수 있어요.');}
 }
 return {history,warning,recordSearch:(q:string)=>update(h=>addSearch(h,q)),recordDestination:(p:SavedDestination)=>update(h=>addDestination(h,p)),removeSearch:(q:string)=>update(h=>({...h,searches:h.searches.filter(s=>s!==q)})),removeDestination:(id:string)=>update(h=>({...h,destinations:h.destinations.filter(d=>d.id!==id)})),clear:()=>update(()=>empty())};
}
export type HistoryController=ReturnType<typeof useRecentHistory>;
