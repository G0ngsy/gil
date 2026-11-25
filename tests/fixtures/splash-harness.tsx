import React,{StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import Knots from '../../src/splashes/knots/Splash';
import Steps from '../../src/splashes/steps/Splash';
const state={completed:0};
const Component=new URLSearchParams(location.search).get('kind')==='steps'?Steps:Knots;
const root=createRoot(document.getElementById('root')!);
function render(){root.render(<StrictMode><Component onComplete={()=>{state.completed++;}}/></StrictMode>);}
Object.assign(window,{splashTest:state,unmountSplash:()=>root.unmount(),rerenderSplash:render});
render();
