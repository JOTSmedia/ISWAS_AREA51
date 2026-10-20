import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../assets/',import.meta.url);
const index=fs.readFileSync(new URL('index-v18-1.js',root),'utf8');
const scene=fs.readFileSync(new URL('lodge-canvas-v18-1.js',root),'utf8');
const guide=fs.readFileSync(new URL('v9-guide-v18-1.js',root),'utf8');
const start=index.indexOf('function installTourPause('),end=index.indexOf('function zv(',start);
assert.ok(index.includes('(0,I.useEffect)(installTourPause,[])'));
let now=0;const listeners=new Map,events=[];
const window={addEventListener(type,fn,options){listeners.set(type,{fn,options})},removeEventListener(type){listeners.delete(type)},dispatchEvent:event=>events.push(event)};
const document={documentElement:{clientWidth:1000},body:{}};
class CustomEvent{constructor(type,options){this.type=type;this.detail=options.detail}}
const context={window,document,CustomEvent,performance:{now:()=>now}};
vm.runInNewContext(index.slice(start,end)+';this.cleanup=installTourPause()',context);
const tour=window.__iswasTour,plain={closest:()=>null};
const emit=(type,event={})=>listeners.get(type).fn({target:plain,...event});
for(const type of ['wheel','touchstart','touchmove','pointerdown']){assert.equal(listeners.get(type).options.capture,true);assert.equal(listeners.get(type).options.passive,true)}
assert.equal(listeners.get('keydown').options,true);
window.__v9Trip={start:0};window.__tourGlide=true;emit('wheel',{deltaY:50});
assert.equal(window.__v9Paused,true);assert.equal(window.__v9Trip,null);assert.equal(window.__tourGlide,false);
now=3_600_000;assert.equal(window.__v9Paused,true,'Elapsed time never releases a manual pause');
assert.equal(events.at(-1).detail.reason,'wheel');
const before=events.length;emit('wheel',{deltaY:30});assert.equal(events.length,before,'Repeated scroll does not spam state events');
tour.resume();assert.equal(window.__v9Paused,false);assert.equal(window.__tourUntil,0,'Resume waits for camera arrival before starting a full stop');assert.equal(window.__forceTour,true);
emit('touchstart',{target:{closest:()=>({})}});assert.equal(window.__v9Paused,true,'Touch contact on prose cancels an arriving tour before the first scroll movement');
tour.resume();emit('touchstart');assert.equal(window.__v9Paused,false,'Touching an unrelated guide control does not invert its explicit Resume action');
emit('touchmove');assert.equal(window.__v9Paused,true);
for(const key of ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ']){tour.resume();emit('keydown',{key});assert.equal(window.__v9Paused,true,key+' pauses the tour')}
tour.resume();emit('keydown',{key:' ',target:{closest:selector=>selector.includes('button')?{}:null}});assert.equal(window.__v9Paused,false,'Space activation of Resume/Pause buttons cannot invert the click intent');
emit('keydown',{key:' ',target:{closest:selector=>selector.includes('input')?{}:null}});assert.equal(window.__v9Paused,false,'Typing does not masquerade as page scrolling');
emit('wheel',{deltaY:30,target:{closest:()=>({})}});assert.equal(window.__v9Paused,true,'Scroll originating inside a popup is caught during capture');
tour.resume();emit('pointerdown',{target:{closest:()=>({})}});assert.equal(window.__v9Paused,true,'Manual section selection stops the automatic tour');
tour.resume();emit('pointerdown',{target:document.documentElement,clientX:995});assert.equal(window.__v9Paused,true,'Dragging the page scrollbar also pauses');

// Execute the actual camera tour's clock/transition block with stable camera
// inputs to check the stop duration and cancellation at a partially flown trip.
const tripStart=scene.indexOf('let nowTime=performance.now();window.__v9Stop??=e;');
const tripEnd=scene.indexOf('a.current=Dn.damp(a.current,0,4,f);',tripStart);
assert.ok(tripStart>0&&tripEnd>tripStart);
const p={current:.2},z={current:1},stops=[['/',.2],['/need',11.2]];
const tick=new Function('window','performance','CustomEvent','e','p','z','stops','Dn',`let _={position:[.2]},dir=1,f=.016,i=false,starsArrivalTrip;${scene.slice(tripStart,tripEnd)}`);
const readyStart=scene.indexOf('function tourSceneReady('),readyEnd=scene.indexOf('function Oy(',readyStart);
vm.runInNewContext(scene.slice(readyStart,readyEnd)+';this.ready=tourSceneReady',context);
window.__galleryFirstFrame=true;window.__iswasStartup={live:false};assert.equal(context.ready(),false,'A first render that has not been displayed cannot start the tour clock');
window.__iswasStartup.live=true;assert.equal(context.ready(),true);
assert.ok(scene.includes('let idle=tourSceneReady()&&'));
const frame=(section='/')=>{if(!window.__v9Paused&&context.ready())tick(window,{now:()=>now},CustomEvent,section,p,z,stops,{damp:value=>value})};
now=0;tour.resume();window.__v9Stop='/';window.__tourCameraSection='/';window.__tourCameraArrived=false;window.__morganInitialAtLibrary=true;window.__morgan3D={isReady:false};frame();
now=10000;frame();assert.equal(window.__tourUntil,0,'Camera settling does not consume the stop');
window.__tourCameraArrived=true;frame();assert.equal(window.__tourUntil,0,'Initial Overview also waits for the Morgan portrait');
now=20000;window.__morgan3D.isReady=true;frame();assert.equal(window.__tourStopStartedAt,20000);assert.equal(window.__tourStopSection,'/');assert.equal(window.__tourUntil,25500);
now=25499;frame();assert.equal(window.__v9Trip,null,'Overview gets a complete 5.5-second stop after actual readiness');
now=25500;frame();assert.ok(window.__v9Trip);now=26500;frame();assert.ok(p.current>.2&&p.current<11.2);
tour.pause('wheel');const count=events.filter(event=>event.type==='gallery-tour').length;
now=9_000_000;frame();assert.equal(window.__v9Trip,null);assert.equal(events.filter(event=>event.type==='gallery-tour').length,count,'A canceled trip never navigates after an indefinite pause');
tour.resume();frame();now+=5499;frame();assert.equal(window.__v9Trip,null);now++;frame();assert.ok(window.__v9Trip);now+=2400;frame();
const route=events.findLast(event=>event.type==='gallery-tour');assert.equal(route.detail.section,'/need');assert.equal(route.detail.automatic,true);
assert.equal(window.__tourUntil,0,'The next section waits for its camera arrival');frame('/need');assert.equal(window.__tourUntil,0,'An arrival marker for the old section cannot start the next stop');
window.__tourCameraSection='/need';window.__tourCameraArrived=true;frame('/need');assert.equal(window.__tourUntil,now+5500);assert.equal(window.__tourStopSection,'/need');
assert.ok(index.includes('if(e.detail?.automatic&&window.__v9Paused)return;'),'Route listener rejects stale automatic events while paused');
assert.ok(/__iswasTour\?\.setPaused\(!window\.__v9Paused/.test(guide));
assert.ok(guide.includes('iswas-tour-state'));assert.ok(!guide.includes('+14000'));assert.ok(!scene.includes('window.__tourUntil=nowTime+12000'),'No old 12-second stop remains');
// Only the section layout effect resets scroll; no delayed arrival work can
// pull the page back after a user has resumed native scrolling.
const arrivalStart=index.indexOf('let on=e=>'),arrivalEnd=index.indexOf(';return window.addEventListener(`gallery-tour`',arrivalStart);
assert.ok(arrivalStart>0&&arrivalEnd>arrivalStart);
const arrivals=[],queued=[];document.scrollingElement={scrollTop:0};document.querySelector=()=>null;
const arrivalContext={...context,nav:options=>arrivals.push(options),t:'/',menuOpen:false,requestAnimationFrame:fn=>queued.push(fn)};
vm.runInNewContext(index.slice(arrivalStart,arrivalEnd)+';this.arrive=on',arrivalContext);
tour.resume();arrivalContext.arrive({detail:{section:'/need',automatic:true}});
assert.equal(arrivals.length,1);assert.equal(arrivals[0].resetScroll,false,'Router defers to the single layout-phase top reset');
document.scrollingElement.scrollTop=140;for(const callback of queued)callback();
assert.equal(queued.length,0,'No delayed arrival callback can reset an active swipe');assert.equal(document.scrollingElement.scrollTop,140);
emit('touchstart',{target:{closest:()=>({})}});arrivalContext.arrive({detail:{section:'/stars',automatic:true}});
assert.equal(arrivals.length,1,'Touch contact blocks a stale automatic navigation before touchmove');
context.cleanup();assert.equal(listeners.size,0);assert.equal(window.__iswasTour,undefined);

console.log('PASS: 5.5-second camera-arrival stops, initial Morgan readiness, permanent input pause, trip cancellation, explicit resume, popup/keyboard/swipe/scrollbar capture, stale automatic event suppression, and guide synchronization.');
