import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../assets/lodge-canvas-v17-8.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function clampGlobeZoom('),source.indexOf('function ky(){'));
const listeners=new Map(),classes=new Set(),classTransitions=[];
let gallery=true,frame;
class Element {
 constructor(toolbar=false){this.toolbar=toolbar}
 closest(selector){return this.toolbar&&selector.includes('#globe-zoom-controls')?this:null}
}
class Vector {
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){Object.assign(this,{x,y,z});return this}
 add(other){for(const axis of ['x','y','z'])this[axis]+=other[axis];return this}
 setFromSpherical(){return this.set(0,0,0)}
 distanceTo(other){return Math.hypot(this.x-other.x,this.y-other.y,this.z-other.z)}
}
class Camera {
 constructor(){this.position=new Vector(24,4,8);this.fov=51;this.aspect=16/9;this.updates=0;this.view=null}
 setViewOffset(fullWidth,fullHeight,offsetX,offsetY,width,height){this.updates++;this.view={enabled:true,fullWidth,fullHeight,offsetX,offsetY,width,height}}
 clearViewOffset(){this.updates++;this.view.enabled=false}
 updateProjectionMatrix(){this.updates++}
 lookAt(){}
}
const camera=new Camera();
const win={innerWidth:1440,innerHeight:900,__globeZoom:2,__v9Paused:true,
 addEventListener(name,handler){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(handler)},removeEventListener(){},dispatchEvent(){}};
runInNewContext(code+';Oy()',{
 window:win,document:{querySelector:selector=>selector==='.is-gallery'&&gallery?{}:null,
 documentElement:{classList:{contains:name=>name==='is-gallery'?gallery:classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name),toggle(name,value){classTransitions.push([name,value]);if(value)classes.add(name);else classes.delete(name)}}}},
 o:()=>'/need',__:()=>({camera,gl:{},scene:{}}),Ty:()=>false,
 u:{useRef:current=>({current}),useMemo:fn=>fn(),useEffect:fn=>fn()},v_:fn=>frame=fn,
 U:Vector,Wd:class {setFromVector3(){this.phi=1;this.theta=0}},xu:Camera,Fr:class{},
 xy:{'/need':{position:[11.2,1.5,4],target:[11.2,1.5,0]}},
 Dn:{clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),damp:(v,target,lambda,dt)=>target+(v-target)*Math.exp(-lambda*dt)},
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
emit('pointerdown',{target:background,button:0,clientX:100,clientY:100,preventDefault(){}});
assert.equal(win.__globeVisit,false,'A deliberate room drag still leaves globe focus');
step();assert.equal(classes.has('globe-zoom-active'),false,'Room navigation hides globe controls');
console.log('PASS: production camera controls ignore toolbar/browser zoom; shared zoom survives Locations/360 transitions; normal lens restores; focus classes and settled projections stay idle; pin scale follows rendered zoom.');
