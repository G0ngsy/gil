/**
 * 실행 모드 선택: 기본 실제 앱과 명시적으로 요청한 디자인/센서 검토 화면을 구분합니다.
 */
/** Review pages require an explicit flag; legacy demo URLs stay on real search. */
export function resolveAppMode(query:string):'live'|'demo'|'simulation'{
 const params=new URLSearchParams(query);
 if(params.get('preview')!=='1')return 'live';
 return params.get('mode')==='simulation'?'simulation':params.get('mode')==='live'?'live':'demo';
}
