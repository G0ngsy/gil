type MotifKind = 'lattice' | 'cloud' | 'lotus' | 'flower' | 'knot';

/** Decorative SVGs inspired by the approved motif sheet; no functional meaning. */
export function Motif({ kind, size = 40 }: { kind: MotifKind; size?: number }) {
 const gold = '#B58A52';
 return <svg className={`traditional-motif motif-${kind}`} width={size} height={size} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {kind === 'lattice' && <><path d="M9 9h62v62H9ZM24 9v62M40 9v20m0 22v20M56 9v62M9 24h62M9 40h20m22 0h20M9 56h62M29 29h22v22H29Z"/><path d="M13 13h7v7h-7Zm47 47h7v7h-7Z" stroke={gold}/></>}
  {kind === 'cloud' && <><path d="M14 49c-9 0-11-11-4-16 4-3 9-1 10 3 1 4-3 6-5 3M20 32c-5-12 6-21 17-17 7-14 26-9 27 3 0 8-10 13-14 7-3-4 2-8 5-5M62 30c15-2 19 17 7 23-8 4-15-3-21-3-12 0-12 14-26 11"/><path d="M10 63c12 5 22-5 34-7s19 9 28 4" stroke={gold}/><path d="M26 44c-7-7-1-17 7-14 8 3 5 13-1 11"/></>}
  {kind === 'lotus' && <><path d="M40 13C24 28 24 41 40 54c16-13 16-26 0-41ZM30 46C21 29 9 30 9 30c0 20 10 31 31 31M50 46c9-17 21-16 21-16 0 20-10 31-31 31"/><path d="M40 61C25 48 10 50 4 57c11 15 25 18 36 4Zm0 0c15-13 30-11 36-4-11 15-25 18-36 4Z"/><path d="M40 49V34m-5 12-4-9m14 9 4-9" stroke={gold}/></>}
  {kind === 'flower' && <>{Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 40 40)`}><path d="M32 27c-6-7-4-18 3-20 12-5 17 11 10 20"/><path d="M40 14v9" stroke={gold}/></g>)}<circle cx="40" cy="40" r="15" fill="var(--sheet, #fffdf9)"/><circle cx="40" cy="40" r="8" stroke={gold} strokeWidth="4"/></>}
  {kind === 'knot' && <><path d="m40 6 13 13-13 13-13-13L40 6Zm0 42 13 13-13 13-13-13 13-13ZM6 40l13-13 13 13-13 13L6 40Zm42 0 13-13 13 13-13 13-13-13Z"/><path d="m28 13 39 39-15 15-39-39Zm24 0L13 52l15 15 39-39Z"/><path d="m40 13 6 6-6 6-6-6Zm0 42 6 6-6 6-6-6Z" stroke={gold} strokeWidth="2"/></>}
 </svg>;
}
