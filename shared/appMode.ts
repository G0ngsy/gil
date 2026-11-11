/** Review pages require an explicit flag; legacy demo URLs stay on real search. */
export function resolveAppMode(query:string):'live'|'demo'|'simulation'{
 const params=new URLSearchParams(query);
 if(params.get('preview')!=='1')return 'live';
 return params.get('mode')==='simulation'?'simulation':params.get('mode')==='live'?'live':'demo';
}
