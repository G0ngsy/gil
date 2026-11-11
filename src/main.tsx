import React from 'react';
import {createRoot} from 'react-dom/client';
import {resolveAppMode} from '../shared/appMode';
import {LiveNavigation} from './navigation/LiveNavigation';
import './style.css';
async function mount(){
 const mode=resolveAppMode(location.search);
 const review=new URLSearchParams(location.search).get('preview')==='1';
 let content:React.ReactNode;
 if(mode==='demo'){
  const {default:DemoApp}=await import('./DemoApp');content=<DemoApp/>;
 }else if(mode==='simulation'){
  const {SimulationNavigation}=await import('./navigation/SimulationNavigation');
  content=<SimulationNavigation onExit={()=>{location.href='/?preview=1';}}/>;
 }else content=<LiveNavigation review={review} onDemo={()=>{location.href='/?preview=1';}}/>;
 createRoot(document.getElementById('root')!).render(<React.StrictMode>{content}</React.StrictMode>);
}
void mount();
