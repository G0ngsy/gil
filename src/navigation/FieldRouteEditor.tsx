import {useState} from 'react';
import {parseFieldRoute,type FieldRoute} from '../../shared/fieldRoute';

export function FieldRouteEditor({onApply,onDefault}:{onApply:(value:FieldRoute)=>void;onDefault:()=>void}){
 const [value,setValue]=useState('');
 const [error,setError]=useState('');
 return <details className="tracking-guide"><summary>현장 테스트 경로 설정</summary><p id="field-route-help">출발 → 경유 → 도착 순서로 한 줄에 위도, 경도를 입력하세요. 2~20개 지점, 지점 간 5~500m, 전체 40m~2km로 설정할 수 있어요.</p><p>직접 입력한 지점을 직선으로 이은 테스트 도식이에요. 도로·통행 가능 여부를 확인하지 않으며 실제 길찾기나 회전 안내를 제공하지 않아요. 적용하면 진행 중인 GPS와 안내를 종료해요. 경로는 저장하지 않아요.</p><form className="simulation-controls" onSubmit={event=>{event.preventDefault();try{const next=parseFieldRoute(value);onApply(next);setError('');}catch(error){setError(error instanceof Error?error.message:'경로를 확인해 주세요.');}}}><label>테스트 경로 좌표<textarea aria-label="테스트 경로 좌표" aria-describedby="field-route-help" value={value} maxLength={2000} rows={6} placeholder={'37.566500, 126.978000\n37.567000, 126.978000'} onChange={event=>setValue(event.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="primary">현장 경로 적용</button></form><button className="secondary" onClick={()=>{setError('');onDefault();}}>서울시청 예시로 복원</button></details>;
}
