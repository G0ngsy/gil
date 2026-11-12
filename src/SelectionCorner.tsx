import {Icon} from './ui';
/** Decoration accompanies the ordinary selected-state border and check mark. */
export function SelectionCorner(){return <><svg className="selection-corner" width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M2 2h24v24M10 2v8h16M18 2v16h8M18 10h-8v8h16"/></svg><span className="selection-check" aria-hidden="true"><Icon name="check" size={15}/></span></>;}
