import {GALLERY_WAYPOINTS,waypointIndex,waypointAngles,nearestGalleryWaypoint} from '../assets/gallery-progress-v18-1.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../assets/lodge-canvas-v18-1.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function clampGlobeZoom('),source.indexOf('function ky(){'));
const listeners=new Map(),classes=new Set(),classTransitions=[];
let gallery=true,frame,hidden=false;const documentEvents=new Map();
class Element {
 constructor(toolbar=false){this.toolbar=toolbar}
 closest(selector){return this.toolbar&&selector.includes('#globe-zoom-controls')?this:null}
}
class Vector {
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){Object.assign(this,{x,y,z});return this}
 copy(other){return this.set(other.x,other.y,other.z)}
 add(other){for(const axis of ['x','y','z'])this[axis]+=other[axis];return this}
 setFromSpherical(){return this.set(0,0,0)}
 distanceTo(other){return Math.hypot(this.x-other.x,this.y-other.y,this.z-other.z)}
}
class Camera {
 constructor(){this.position=new Vector(24,4,8);this.fov=51;this.aspect=16/9;this.updates=0;this.view=null}
 setViewOffset(fullWidth,fullHeight,offsetX,offsetY,width,height){this.updates++;this.view={enabled:true,fullWidth,fullHeight,offsetX,offsetY,width,height}}
 clearViewOffset(){this.updates++;this.view.enabled=false}
 updateProjectionMatrix(){this.updates++}
 lookAt(target){this.aim={x:target.x,y:target.y,z:target.z}}
}
const camera=new Camera();
const win={innerWidth:1440,innerHeight:900,__globeZoom:2,__v9Paused:true,
 addEventListener(name,handler){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(handler)},removeEventListener(){},dispatchEvent(){}};
runInNewContext(code+';Oy()',{
 window:win,document:{get hidden(){return hidden},addEventListener(name,fn){documentEvents.set(name,fn)},removeEventListener(name){documentEvents.delete(name)},querySelector:selector=>selector==='.is-gallery'&&gallery?{}:null,
 documentElement:{classList:{contains:name=>name==='is-gallery'?gallery:classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name),toggle(name,value){classTransitions.push([name,value]);if(value)classes.add(name);else classes.delete(name)}}}},
 o:()=>'/need',__:()=>({camera,gl:{},scene:{}}),Ty:()=>false,
 u:{useRef:current=>({current}),useMemo:fn=>fn(),useEffect:fn=>fn()},v_:fn=>frame=fn,
 U:Vector,Wd:class {setFromVector3(){this.phi=1;this.theta=0}},xu:Camera,Fr:class{},
 xy:{'/need':{position:[11.2,1.5,4],target:[11.2,1.5,0]}},
 Dn:{clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),damp:(v,target,lambda,dt)=>target+(v-target)*Math.exp(-lambda*dt)},
 frameHospitalityReview:()=>false,frameTelevisionCamera:()=>false,frameRecordCamera:()=>false,GALLERY_WAYPOINTS,waypointIndex,waypointAngles,nearestGalleryWaypoint,CustomEvent:class{constructor(type,{detail}){Object.assign(this,{type,detail})}},
 Element,performance:{now:()=>10000},clearGlobeCamera:()=>0,tourSection:()=>'/need',wy:{},
});
const emit=(name,event)=>{for(const listener of listeners.get(name)||[])listener(event)};
const toolbar=new Element(true),background=new Element(false);
for(const type of ['pointerdown','wheel','keydown','touchstart']){
 win.__globeVisit=true;
 emit(type,{target:toolbar,button:0,deltaY:100,preventDefault(){throw Error('Toolbar input must not reach room controls')}});
 assert.equal(win.__globeVisit,true,`${type} on toolbar retains globe focus`);
 assert.equal(classes.has('is-looking'),false,'Toolbar does not begin a room drag');
}
for(const modifier of ['ctrlKey','metaKey']){
 win.__globeVisit=true;
 emit('wheel',{target:background,deltaY:100,[modifier]:true,preventDefault(){throw Error('Browser zoom must remain native')}});
 assert.equal(win.__globeVisit,true,'Browser zoom does not leave globe focus');
}
const step=()=>frame({clock:{elapsedTime:1}},1/60);
win.__globeVisit=true;
for(let count=0;count<240;count++)step();
assert.equal(win.__globeZoomRendered,2,'Camera publishes exact eased zoom for screen-sized pins');
assert.equal(classes.has('globe-zoom-active'),true,'360 focus displays controls');
assert.equal(classTransitions.length,1,'Stationary rendering does not repeatedly mutate the root class');
const settledUpdates=camera.updates;
for(let count=0;count<120;count++)step();
assert.equal(camera.updates,settledUpdates,'Production frame loop stops rebuilding a settled zoom projection');
for(const elevation of [1.65,1.9,2.2,2.6,3,3.02,3]){
 win.__globeElevation=elevation;step();
 assert.ok(Math.abs(camera.aim.y-elevation)<.004,'The real frame loop follows the hovering globe without secondary camera lag');
 assert.ok(camera.position.y<=4.4,'Globe lift never moves focused camera into ceiling details');
}
assert.equal(camera.updates,settledUpdates,'Rising globe changes orientation without rebuilding the projection');
gallery=false;win.__locationsViewport={left:740,top:110,width:660,height:710};step();
assert.equal(classTransitions.length,1,'Moving between active globe modes does not flicker controls');
assert.equal(win.__globeZoomRendered,2,'Locations reuses the chosen zoom');
assert.equal(camera.view.enabled,true,'Locations offsets the projection beside the case');
win.__locationsViewport=null;step();
assert.equal(classes.has('globe-zoom-active'),false,'Leaving the globe hides zoom controls');
assert.equal(camera.view.enabled,false,'Leaving Locations clears the companion-pane projection');
assert.equal(camera.fov,42,'Normal room view restores its regular lens');
assert.equal(win.__globeZoom,2,'Leaving the globe preserves the page-session zoom selection');
assert.equal(win.__globeZoomRendered,1,'Unfocused globe uses normal pin sizing');
gallery=true;win.__globeVisit=true;step();
assert.equal(win.__globeZoomRendered,2,'Returning to 360 restores the selected zoom');
assert.equal(classTransitions.length,3,'Only genuine focus changes update control visibility');
win.innerWidth=320;win.innerHeight=568;camera.aspect=320/568;
for(let tick=0;tick<120;tick++)step();
assert.equal(camera.view.enabled,true,'The production 360 frame loop retains short-phone framing below the zoom bar');
assert.ok(camera.view.offsetY<0,'The short-phone optical center moves down away from top controls');
const shortUpdates=camera.updates;
for(let tick=0;tick<120;tick++)step();
assert.equal(camera.updates,shortUpdates,'Short-phone framing does not churn projection matrices');
win.innerWidth=390;win.innerHeight=844;camera.aspect=390/844;step();
assert.equal(camera.view.enabled,false,'Taller phones restore centered 360 framing');
emit('pointerdown',{target:background,button:0,clientX:100,clientY:100,preventDefault(){}});
assert.equal(win.__globeVisit,false,'A deliberate room drag still leaves globe focus');
step();assert.equal(classes.has('globe-zoom-active'),false,'Room navigation hides globe controls');
console.log('PASS: production camera controls ignore toolbar/browser zoom; shared zoom survives Locations/360 transitions; normal lens restores; focus classes and settled projections stay idle; pin scale follows rendered zoom.');

// Interruptions must release the camera drag rather than swallowing the next
// reading swipe after a phone app/tab switch or a return from 360 mode.
win.__locationsViewport=null;gallery=true;
for(const ending of ['blur','pagehide','lostpointercapture','pointercancel']){
 emit('pointerdown',{target:background,button:0,pointerType:'touch',clientX:100,clientY:100,preventDefault(){}});
 assert.equal(classes.has('is-looking'),true);
 let prevented=false;emit('touchmove',{preventDefault(){prevented=true}});assert.equal(prevented,true,'An intentional 360 drag owns its gesture');
 emit(ending,{});assert.equal(classes.has('is-looking'),false,ending+' releases the drag');
 prevented=false;emit('touchmove',{preventDefault(){prevented=true}});assert.equal(prevented,false,'Interrupted gestures cannot keep canceling native scrolling');
}
emit('pointerdown',{target:background,button:0,pointerType:'touch',clientX:100,clientY:100,preventDefault(){}});
hidden=true;documentEvents.get('visibilitychange')();assert.equal(classes.has('is-looking'),false,'Hiding the document releases touch ownership');hidden=false;
emit('pointerdown',{target:background,button:0,pointerType:'touch',clientX:100,clientY:100,preventDefault(){}});
gallery=false;step();assert.equal(classes.has('is-looking'),false,'Returning to the presentation releases an unfinished 360 drag');
let prevented=false;emit('touchmove',{preventDefault(){prevented=true}});assert.equal(prevented,false,'Reading remains native after mode exit');
console.log('PASS: 360 touch drag releases on app/tab switch, capture loss, cancellation and return to presentation; no stale touchmove prevention.');

// Exercise the actual new waypoint listener and the existing frame callback.
gallery=true;win.__locationsViewport=null;win.innerWidth=1440;win.innerHeight=900;camera.aspect=1440/900;
for(const stop of GALLERY_WAYPOINTS){
 emit('gallery-waypoint',{detail:{id:stop.id}});
 for(let tick=0;tick<480;tick++)step();
 if(stop.id!=='locations'){
  assert.ok(camera.position.distanceTo({x:stop.position[0],y:stop.position[1],z:stop.position[2]})<.004,stop.id+' reaches its camera without a final snap');
  const expected=waypointAngles(stop),actual=Math.atan2(camera.aim.x-camera.position.x,camera.position.z-camera.aim.z);
  assert.ok(Math.abs(Math.atan2(Math.sin(actual-expected.yaw),Math.cos(actual-expected.yaw)))<.001,stop.id+' faces its real object');
 }
 if(stop.id==='records')assert.equal(win.__atLibrary,false,'Facing the rear record wall returns Morgan home instead of treating the whole left end as the library');
 if(stop.id==='library'||stop.id==='overview')assert.equal(win.__atLibrary,true,'The front-facing library retains its native Morgan placement');
 assert.equal(win.__v9Paused,true,'Gallery navigation pauses the presentation tour');
}
emit('gallery-waypoint',{detail:{id:'piano'}});for(let tick=0;tick<480;tick++)step();
const beforeDrag={...camera.position};
emit('pointerdown',{target:background,button:0,pointerType:'mouse',clientX:100,clientY:100,preventDefault(){}});
emit('pointermove',{target:background,pointerType:'mouse',clientX:140,clientY:105});
emit('pointerup',{});for(let tick=0;tick<120;tick++)step();
assert.ok(camera.position.distanceTo(beforeDrag)<.01,'Looking around at the piano retains the keyboard-side camera position');
assert.ok(Math.abs(Math.atan2(camera.aim.x-camera.position.x,camera.position.z-camera.aim.z)-waypointAngles(GALLERY_WAYPOINTS[9]).yaw)>.1,'Dragging takes control of the waypoint heading');
console.log('PASS: all physical stops settle without drift; PIANO keeps the keyboard approach; manual looking takes over in place and the tour stays paused.');
