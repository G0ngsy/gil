/**
 * 앱 시작점: URL에 따라 실제 길찾기·디자인 시안·센서 테스트를 선택하고 시작 연출과 함께 실행합니다.
 */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {resolveAppMode} from '../shared/appMode';
import {LiveNavigation} from './navigation/LiveNavigation';
import './style.css';
import {Intro} from './Intro';
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
 createRoot(document.getElementById('root')!).render(<React.StrictMode><Intro>{content}</Intro></React.StrictMode>);
}
void mount();
