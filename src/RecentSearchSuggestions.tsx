import {Icon} from './ui';
/** 저장된 검색어만 후보로 쓰며 입력 중에는 외부 API를 호출하지 않습니다. */
export function RecentSearchSuggestions({searches,query,onChoose,onRemove}:{searches:string[];query:string;onChoose:(query:string)=>void;onRemove:(query:string)=>void}){
 const matches=searches.filter(value=>value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0,5);
 return <section className="recent-search-suggestions" aria-label="최근 검색어"><h3>최근 검색어</h3>{matches.length?<ul>{matches.map(value=><li key={value}><button type="button" className="recent-search-choice" onClick={()=>onChoose(value)}><Icon name="clock" size={17}/><span>{value}</span></button><button type="button" className="recent-search-remove" aria-label={`${value} 최근 검색어 삭제`} onClick={()=>onRemove(value)}><Icon name="close" size={16}/></button></li>)}</ul>:<p>{searches.length?'일치하는 최근 검색어가 없어요. 검색 버튼을 눌러 새로 찾아보세요.':'최근 검색어가 없어요. 장소나 주소를 입력해 보세요.'}</p>}</section>;
}
