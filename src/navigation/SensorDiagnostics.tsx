import {useState} from 'react';

export function SensorDiagnostics({diagnostic,notice}:{diagnostic:Record<string,string|number|boolean|null>;notice:string}){
 const [snapshot,setSnapshot]=useState('');
 const [copyNotice,setCopyNotice]=useState('');
 function capture(){setSnapshot(JSON.stringify({version:'gilbit-sensor-v1',browser:navigator.userAgent,notice,sensor:diagnostic},null,2));setCopyNotice('');}
 async function copy(){try{await navigator.clipboard.writeText(snapshot);setCopyNotice('복사했어요. 대화에 붙여 넣어 주세요.');}catch{setCopyNotice('자동 복사가 안 돼요. 아래 결과를 길게 눌러 복사해 주세요.');}}
 return <details className="sensor-diagnostics"><summary>센서 진단</summary><p>방향 센서를 시작한 뒤 결과 확인을 눌러 주세요. 현재 방향 값과 브라우저 정보만 표시해요. 위치·영상은 포함하지 않으며 자동 저장·전송하지 않아요.</p><button className="secondary" onClick={capture}>진단 결과 확인</button>{snapshot&&<><textarea aria-label="센서 진단 결과" readOnly value={snapshot} rows={9}/><button className="secondary" onClick={()=>void copy()}>진단 결과 복사</button></>}<p role="status">{copyNotice}</p></details>;
}
