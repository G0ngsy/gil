/** Purely decorative dividers; hidden from assistive technology. */
export function OrnamentalDivider({kind,className=''}:{kind:'diamonds'|'lotus';className?:string}){
 return <div className={`ornamental-divider ornamental-${kind} ${className}`} aria-hidden="true"><span/>
 {kind==='diamonds'?<svg width="46" height="20" viewBox="0 0 46 20" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="m2 10 8-8 8 8-8 8Zm13 0 8-8 8 8-8 8Zm13 0 8-8 8 8-8 8Z"/></svg>:<svg width="38" height="32" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M32 4C20 17 20 29 32 40c12-11 12-23 0-36Z"/><path d="M27 34C16 25 16 14 17 10c10 4 15 13 15 30M37 34c11-9 11-20 10-24-10 4-15 13-15 30M32 40C16 39 7 28 5 18c13 1 22 9 27 22Zm0 0c16-1 25-12 27-22-13 1-22 9-27 22Z"/><path d="M32 40C18 44 8 39 3 33c12-2 21 1 29 7Zm0 0c14 4 24-1 29-7-12-2-21 1-29 7Z"/></svg>}
 <span/></div>;
}
