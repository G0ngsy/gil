import type { ReactNode } from 'react';

export function Icon({ name, size = 24 }: { name: string; size?: number }) {
 const paths: Record<string, ReactNode> = {
 search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
 bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 21h4M12 2v2"/></>,
 back: <path d="m14 5-7 7 7 7"/>, close: <path d="m6 6 12 12M18 6 6 18"/>,
 arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
 turn: <path d="M6 21V11a4 4 0 0 1 4-4h10m-5-5 5 5-5 5"/>,
 pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
 book: <><path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15"/></>,
 building: <><path d="m3 8 9-5 9 5H3Zm0 13h18M5 10v8m5-8v8m4-8v8m5-8v8"/></>,
 health: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10m-5-5h10"/></>,
 camera: <><path d="M4 6h4l2-3h4l2 3h4a1 1 0 0 1 1 1v13H3V7a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/></>,
 map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/></>,
 locate: <><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></>,
 shield: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/></>,
 check: <path d="m5 12 5 5L20 7"/>,
 walk: <><circle cx="14" cy="3.5" r="1.5"/><path d="m8 21 3-7 3 3v4M7 12l2-5 5 1 3 4h3M12 8l-1 6-5-1"/></>,
 compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/></>,
 dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
 clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
 leaf: <><path d="M20 3C7 2 2 9 6 16c7 6 15-1 14-13Z"/><path d="M4 21 16 8"/></>,
 chevron: <path d="m9 5 7 7-7 7"/>,
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.pin}</svg>;
}

export function Brand() {
 return <span className="brand"><svg viewBox="0 0 56 48" aria-hidden="true"><path d="M5 19Q18 20 25 7q9 11 26 11M10 24l5-8m6 11 2-9m10 9-2-9m12 6-5-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M36 29C11 34 15 40 33 42" fill="none" stroke="#B58A52" strokeWidth="5" strokeLinecap="round"/></svg><span>길빛</span></span>;
}

export function Hanok() {
 return <svg className="hanok-art" viewBox="0 0 390 165" preserveAspectRatio="xMidYMax slice" role="img" aria-label="나뭇가지와 한옥 처마 일러스트">
 <defs><linearGradient id="mist" x2="0" y2="1"><stop stopColor="#E5E8D8" stopOpacity=".1"/><stop offset="1" stopColor="#DBE0CA" stopOpacity=".7"/></linearGradient></defs>
 <path d="M0 147q33-41 63-13 34-47 70-13 33-43 57-10 37-34 74 4 42-31 79 13 22-24 47 9v28H0Z" fill="url(#mist)"/>
 <path d="M-8 168Q17 133 28 92Q35 67 29 45M12 137Q42 126 64 112M27 99Q64 86 101 87M28 85Q10 73-2 70M55 92Q66 66 83 55M64 112q26 2 42 15M33 70l19-23" stroke="#8D8061" strokeWidth="3.5" fill="none"/>
 {[ [1,62],[13,77],[27,54],[29,39],[38,65],[48,51],[56,44],[62,74],[73,64],[85,51],[90,65],[91,86],[105,83],[76,91],[50,100],[58,112],[72,119],[88,123],[106,130],[29,114],[10,113],[4,96] ].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y} rx="9" ry="4.5" transform={`rotate(${i*41} ${x} ${y})`} fill={['#97A76D','#B5C184','#CFD3A1'][i%3]}/><ellipse cx={x+4} cy={y-6} rx="6" ry="3" transform={`rotate(${i*33} ${x+4} ${y-6})`} fill="#B5C184"/></g>)}
 <path d="M266 103v62m63-80v80m45-101v101" stroke="#A67E4C" strokeWidth="10"/>
 <path d="M246 120 401 72M253 135 401 90M254 146 400 107" stroke="#D4AF78" strokeWidth="9"/>
 <path d="M243 115 400 65M252 131 400 85M255 144 400 104" stroke="#8F6B40" strokeWidth="2"/>
 <path d="M227 96Q296 119 405 43L406 7Q316 77 222 70Z" fill="#626B68"/>
 <path d="M224 72Q305 94 402 14M225 82Q305 104 403 26M225 93Q309 115 404 39" fill="none" stroke="#A0A7A1" strokeWidth="4"/>
 {Array.from({length:18},(_,i)=>{const x=220+i*11;const y=76+8*Math.sin(i/5)-i*1.8;return <g key={i}><path d={`M${x} ${y-5}q7 12 4 25`} stroke="#343F3E" strokeWidth="7" fill="none"/><path d={`M${x-1} ${y-5}q6 12 4 25`} stroke="#ACB1A9" strokeWidth="3" fill="none"/><ellipse cx={x+3} cy={y+20} rx="4.5" ry="3" fill="#D2D0BE" stroke="#626A65" strokeWidth="1.5"/></g>})}
 <path d="M226 104Q308 128 403 55" fill="none" stroke="#555D55" strokeWidth="5"/>
 <path d="M266 121v44m12-49v49m12-54v54m12-58v58" stroke="#C2A87F" strokeWidth="2"/>
 </svg>;
}

export function Lattice({ right = false }: { right?: boolean }) {
 return <svg className={`lattice ${right?'right':''}`} viewBox="0 0 70 180" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 0h63v17H17v146h46v17H0M0 35h35V0M0 72h35V35M0 109h35V72M0 146h35v-37M17 17h34v35H17m0 37h34v35H17m0 37h34v19"/></g></svg>;
}

export function DemoMap({ active = false, compact = false, title = '중앙도서관', centered = false }: {active?:boolean;compact?:boolean;title?:string;centered?:boolean}) {
 return <div className={`demo-map ${compact?'compact':''} ${centered?'centered':''}`} role="img" aria-label={`${title}까지의 예시 도보 경로 지도`}>
 <svg viewBox="0 0 390 600" preserveAspectRatio="xMidYMid slice">
 <rect width="390" height="600" fill="#F7F3EA"/>
 <g fill="#DCDDD4" stroke="#D1D2C7" strokeWidth="1">
 {[[18,15,75,70],[120,15,65,70],[210,20,60,55],[300,20,65,75],[20,118,70,64],[122,116,65,65],[290,120,75,60],[15,215,77,57],[123,217,60,55],[218,214,55,65],[306,219,65,61],[15,318,67,65],[122,315,63,68],[218,315,62,69],[310,320,60,65],[22,420,67,62],[120,420,61,63],[220,420,58,68],[310,424,60,62],[18,520,65,65],[121,522,65,65],[220,523,60,60],[310,525,60,59]].map((r,i)=><rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx="5"/>)}
 </g>
 <path d="M200 98h70v90h-70Z" fill="#CFD8B9"/><path d="M0 295h100v107H0Z" fill="#DCE3CA"/>
 <g stroke="#E9E2D2" strokeWidth="20" fill="none"><path d="M105-20v640M200-20v640M292-20v640M-20 101h430M-20 199h430M-20 299h430M-20 405h430M-20 505h430"/></g>
 <path d="M385 600Q310 520 349 436T331 278Q308 210 390 167" fill="none" stroke="#CEE0DF" strokeWidth="16"/>
 <path d="M105 448V299h95V199h92v-63" fill="none" stroke="white" strokeWidth="15" strokeLinejoin="round" strokeLinecap="round"/>
 <path d="M105 448V299h95V199h92v-63" fill="none" stroke="#087F83" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round"/>
 <path d="M105 448V299h95V199h92v-63" fill="none" stroke="#B8DECF" strokeWidth="2" strokeDasharray="5 9"/>
 <g fill="#777D71" fontSize="11" fontFamily="sans-serif"><text x="30" y="162">주민센터</text><text x="215" y="165">중앙공원</text><text x="224" y="356">문화회관</text><text x="25" y="355">소나무 쉼터</text><text x="135" y="465">은행</text><text x="127" y="58">보건소</text></g>
 <g transform="translate(292 131)"><path d="M0 10S-14-3-14-13a14 14 0 1 1 28 0C14-3 0 10 0 10" fill="#245447" stroke="#fff" strokeWidth="3"/><circle cy="-13" r="4" fill="#fff"/></g>
 <circle cx="105" cy={active?371:448} r="21" fill="#087F83" opacity=".12"/><circle cx="105" cy={active?371:448} r="10" fill="#087F83" stroke="white" strokeWidth="4"/>
 </svg><span className="map-destination">{title}</span><span className="map-caption">예시 지도</span>
 </div>;
}

