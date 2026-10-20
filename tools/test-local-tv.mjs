import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createTelevisionSurface,createVintageTelevision,frameTelevisionCamera,TV_LAYOUT,TV_VIDEO_PATH,televisionVisible} from '../assets/vintage-television-v18-1.js';
class Target {
 listeners=new Map();
 addEventListener(name,fn){const list=this.listeners.get(name)||new Set();list.add(fn);this.listeners.set(name,list)}
 removeEventListener(name,fn){this.listeners.get(name)?.delete(fn)}
 dispatchEvent(event){for(const fn of [...(this.listeners.get(event.type)||[])])fn(event);return true}
}
class Element extends Target {
 children=[];attributes={};hidden=false;removed=false;focused=false;paused=true;currentTime=0;src='';playCalls=0;pauseCalls=0;loadCalls=0;dataset={};style={};classList={contains:()=>false};
 constructor(tag){super();this.tagName=tag}
 append(...nodes){this.children.push(...nodes)}
 setAttribute(name,value){this.attributes[name]=String(value)}
 removeAttribute(name){delete this.attributes[name];if(name==='src')this.src=''}
 focus(){this.focused=true}
 remove(){this.removed=true}
 click(){this.dispatchEvent({type:'click',target:this})}
 play(){this.playCalls++;this.paused=false;this.dispatchEvent({type:'play',target:this});return this.playResult??Promise.resolve()}
 pause(){this.pauseCalls++;this.paused=true;this.dispatchEvent({type:'pause',target:this})}
 load(){this.loadCalls++}
}
let created=[],pausedTours=0,mediaQueries=0,modalQueries=0,projectCalls=0,worldUpdates=0;
const flags=new Set();
globalThis.CustomEvent=class {constructor(type,options={}){this.type=type;this.detail=options.detail}};
globalThis.document=Object.assign(new Target(),{
 hidden:false,body:new Element('body'),head:new Element('head'),documentElement:{classList:{contains:name=>flags.has(name)},dataset:{}},
 createElement:tag=>{const element=new Element(tag);created.push(element);return element},
 querySelector:selector=>{if(selector.startsWith('dialog'))modalQueries++;return null},
 querySelectorAll:()=>{mediaQueries++;return created.filter(el=>el.tagName==='video'||el.tagName==='audio')}
});
globalThis.window=Object.assign(new Target(),{__iswasTour:{pause:reason=>{assert.equal(reason,'vintage-television');pausedTours++}}});
const flush=()=>new Promise(resolve=>queueMicrotask(resolve));
const event=type=>window.dispatchEvent({type});
const normal={front:true,near:true,area:500,left:-.1,right:.1,top:.1,bottom:-.1,hidden:false,blocked:false};
assert.equal(televisionVisible(normal),true);
for(const change of [{front:false},{near:false},{area:100},{left:1.1},{right:-1.1},{bottom:1.1},{top:-1.1},{hidden:true},{blocked:true}])assert.equal(televisionVisible({...normal,...change}),false);
const tv=createTelevisionSurface();tv.connect();
assert.equal(tv.powered,false);assert.equal(tv.video.src,'');assert.equal(tv.video.loadCalls,0);assert.equal(tv.controls.hidden,true);
assert.equal(tv.start(),false,'Offscreen interaction cannot fetch or start the tape');
assert.equal(created.filter(el=>el.tagName==='iframe').length,0,'The local tape never creates a YouTube overlay');
event('gallery-waypoint');tv.setVisible(true);await flush();
assert.equal(tv.video.src,TV_VIDEO_PATH);assert.ok(TV_VIDEO_PATH.endsWith('/media/ring-tape-v18-1.mp4'));
assert.equal(tv.video.paused,false,'Navigating from another room allows visible muted playback');assert.equal(tv.video.muted,true);assert.equal(tv.video.loop,true);assert.equal(tv.video.playsInline,true);assert.equal(tv.controls.hidden,true);
const plays=tv.video.playCalls,loads=tv.video.loadCalls;
for(let n=0;n<20;n++)tv.setVisible(true);
assert.equal(tv.video.playCalls,plays,'Visible frames do not repeatedly call play');assert.equal(tv.video.loadCalls,loads);
const other=document.createElement('audio');other.paused=false;
assert.equal(tv.start(),true);await flush();assert.equal(tv.video.muted,false);assert.equal(other.paused,true);assert.equal(pausedTours,1);assert.equal(tv.controls.hidden,false);assert.equal(tv.buttons.play.focused,true);
const camera={position:{x:40.8,y:2.1,z:2.3},lookAt(){}},aim={x:40.8,y:1,z:6.8};
for(let n=0;n<250;n++)assert.equal(frameTelevisionCamera(camera,aim,1/60),true);
assert.ok(Math.abs(camera.position.z-(TV_LAYOUT.position[2]-TV_LAYOUT.screen[2]-2.35))<1e-6);
tv.buttons.play.click();assert.equal(tv.video.paused,true);assert.equal(tv.buttons.play.textContent,'PLAY');
tv.buttons.play.click();await flush();assert.equal(tv.video.paused,false);assert.equal(tv.buttons.play.textContent,'PAUSE');
tv.buttons.mute.click();assert.equal(tv.video.muted,true);assert.equal(tv.buttons.mute.textContent,'SOUND ON');
tv.buttons.mute.click();assert.equal(tv.video.muted,false);
tv.video.currentTime=39;tv.buttons.restart.click();await flush();assert.equal(tv.video.currentTime,0);assert.equal(tv.video.paused,false);
tv.buttons.power.click();assert.equal(tv.powered,false);assert.equal(tv.video.paused,true);assert.equal(tv.video.muted,true);assert.equal(tv.buttons.power.textContent,'POWER ON');
tv.setVisible(false);tv.setVisible(true);await flush();assert.equal(tv.powered,false,'A powered off TV stays off when returning to the room');
tv.buttons.power.click();await flush();assert.equal(tv.powered,true);assert.equal(tv.video.paused,false);assert.equal(tv.video.muted,true);
tv.start();await flush();tv.buttons.close.click();assert.equal(tv.focused,false);assert.equal(tv.controls.hidden,true);assert.equal(tv.video.muted,true);assert.equal(frameTelevisionCamera(camera,aim,.016),false);
for(const type of ['gallery-waypoint','gallery-tour','gallery-nudge','pagehide','open-tome','iswas:record-open','iswas:lloyd-open']){
 tv.setVisible(false);tv.setVisible(true);tv.start();await flush();event(type);assert.equal(tv.video.paused,true,type+' stops playback');assert.equal(tv.video.muted,true);assert.equal(tv.focused,false);
}
tv.setVisible(false);tv.setVisible(true);tv.start();await flush();
window.dispatchEvent(new CustomEvent('gallery-direction',{detail:{yaw:.2,pitch:.1,depth:.5}}));
assert.equal(tv.video.paused,true,'Compass look/depth navigation pauses the tape');assert.equal(tv.video.muted,true);assert.equal(tv.focused,false);
assert.equal(frameTelevisionCamera(camera,aim,.016),false,'Compass input releases the TV camera so normal gallery movement can proceed');
tv.setVisible(false);tv.setVisible(true);tv.start();await flush();document.hidden=true;document.dispatchEvent({type:'visibilitychange'});assert.equal(tv.video.paused,true);assert.equal(tv.visible,false);
document.hidden=false;tv.setVisible(true);await flush();assert.equal(tv.video.paused,false);assert.equal(tv.video.muted,true,'Returning from a hidden tab never restores sound automatically');
tv.start();await flush();document.dispatchEvent({type:'play',target:other});assert.equal(tv.video.paused,true,'Other native audio pauses the television');
tv.setVisible(false);tv.setVisible(true);tv.start();await flush();window.dispatchEvent(new CustomEvent('iswas:media-focus',{detail:{source:'lloyd'}}));assert.equal(tv.video.paused,true);
tv.setVisible(false);tv.setVisible(true);tv.start();await flush();let prevented=false;window.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(tv.focused,false);assert.equal(tv.video.muted,true);
tv.dispose();assert.equal(tv.video.src,'');assert.equal(tv.video.removed,true);assert.equal(tv.controls.removed,true);assert.equal(tv.button.removed,true);assert.equal(tv.start(),false);
assert.equal([...window.listeners.values()].reduce((n,set)=>n+set.size,0),0,'Disposal removes global listeners');
// A React strict-effects reconnect receives a fresh source and no stale state.
tv.connect();tv.setVisible(true);await flush();assert.equal(tv.video.paused,false);tv.dispose();
const racing=createTelevisionSurface();racing.connect();let resolvePlay;racing.video.playResult=new Promise(resolve=>resolvePlay=resolve);racing.setVisible(true);racing.setVisible(false);racing.video.paused=false;resolvePlay();await flush();assert.equal(racing.video.paused,true,'A late play promise cannot resume a hidden TV');racing.dispose();
// Mount the factory against its public React/Three interfaces, then exercise
// visibility gates. Neither startup nor distant rooms should query the DOM or
// project screen corners; a nearby gallery view renders a real native mesh.
class Vector {
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 copy(v){return this.set(v.x,v.y,v.z)}
 applyMatrix4(){this.z=-5;return this}
 project(){projectCalls++;this.x=(this.x-40.94)*.2;this.y=(this.y-1.24)*.2;this.z=.5;return this}
}
let frame,effect,textureDisposed=0;const cameraView={position:{x:0,y:2,z:0},near:.1,updateMatrixWorld(){worldUpdates++},matrixWorldInverse:{}};
const R={useMemo:fn=>fn(),useRef:value=>({current:value}),useEffect:fn=>{effect=fn}};
const J={jsx:(type,props)=>{if(props.ref)props.ref.current=type==='mesh'?{visible:false}:{color:{set(){}},needsUpdate:false};return {type,props}}};
class VideoTexture {constructor(video){this.video=video}dispose(){textureDisposed++}}
const {VintageTelevision}=createVintageTelevision({React:R,jsx:J,useFrame:fn=>{frame=fn},useThree:()=>({camera:cameraView,size:{width:1280,height:720}}),Vector3:Vector,VideoTexture,SRGBColorSpace:'srgb'});
const screen=VintageTelevision(),cleanup=effect();assert.equal(screen.type,'mesh');assert.equal(screen.props.children[0].type,'planeGeometry');assert.equal(screen.props.children[1].type,'meshBasicMaterial');
const before={modalQueries,projectCalls,worldUpdates};frame();flags.add('is-gallery');frame();assert.deepEqual({modalQueries,projectCalls,worldUpdates},before,'Startup and distant views skip modal checks and projection');
cameraView.position={x:40.94,y:2,z:3};frame();await flush();assert.equal(modalQueries,before.modalQueries+1);assert.equal(projectCalls,before.projectCalls+4);assert.equal(screen.props.ref.current.visible,true);
const factoryVideo=created.filter(el=>el.tagName==='video').at(-1);assert.equal(factoryVideo.src,TV_VIDEO_PATH);assert.equal(factoryVideo.paused,false);assert.equal(factoryVideo.muted,true);
flags.delete('is-gallery');frame();assert.equal(factoryVideo.paused,true);cleanup();assert.equal(textureDisposed,1);assert.equal(factoryVideo.src,'');
const data=readFileSync(new URL('../media/ring-tape-v18-1.mp4',import.meta.url));
assert.ok(data.indexOf(Buffer.from('moov'))<data.indexOf(Buffer.from('mdat')),'Faststart metadata precedes tape data for streaming');assert.ok(statSync(new URL('../media/ring-tape-v18-1.mp4',import.meta.url)).size<16_000_000);
console.log('PASS: local faststart tape; native 4:3 screen; no initial media request/iframe; visible muted autoplay; sound gesture; play/pause/mute/restart/power/close; keyboard Escape/focus; camera framing; offscreen/hidden/dialog/navigation/audio stops; no stacked playback; disposal/reconnect; late play cancellation; cheap distant/startup gates.');
