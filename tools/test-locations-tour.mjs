import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../assets/lodge-canvas-v18-1.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function clampGlobeZoom('),source.indexOf('function ky(){'));
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
 lookAt(target){this.aim={x:target.x,y:target.y,z:target.z}}
}

function run(direction=1,{paused=false,archive=false}={}){
 let frame,now=10000;const events=[],camera=new Camera(),classes=new Set();
 const win={innerWidth:1440,innerHeight:900,__globeZoom:1.18,__v9Paused:paused,__galleryFirstFrame:true,__globeElevation:3,__locationsViewport:{left:740,top:110,width:660,height:710},
 addEventListener(){},removeEventListener(){},dispatchEvent:event=>events.push(event)};
 
 runInNewContext(code+';Oy()',{
 frameHospitalityReview:()=>false,frameTelevisionCamera:()=>false,frameRecordCamera:()=>false,window:win,document:{addEventListener(){},removeEventListener(){},querySelector:selector=>selector.includes('.horror-locations[open]')&&archive?{}:null,documentElement:{classList:{contains:()=>false,add(){},remove(){},toggle(){}}}},
 o:()=>'/locations',__:()=>({camera,gl:{},scene:{}}),Ty:()=>false,
 u:{useRef:current=>({current}),useMemo:fn=>fn(),useEffect:fn=>fn()},v_:fn=>frame=fn,
 U:Vector,Wd:class {setFromVector3(){this.phi=1;this.theta=0}},xu:Camera,Fr:class{},
 xy:{'/locations':{position:[24.5,3.8,7.5],target:[21.5,1.49,1.5]}},
 Dn:{clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),damp:(v,target,lambda,dt)=>target+(v-target)*Math.exp(-lambda*dt)},
 Element,performance:{now:()=>now},CustomEvent:class {constructor(type,{detail}){Object.assign(this,{type,detail})}},clearGlobeCamera:()=>0,tourSection:()=>'/locations',wy:{},
 });
 for(let tick=0;tick<60*30;tick++){
  now+=1000/60;frame({clock:{elapsedTime:now/1000}},1/60);
  if(events.some(event=>event.type==='gallery-tour'))break;
 }
 return{events,win,now};
}
const live=run();const departure=live.events.find(event=>event.type==='gallery-tour');
assert.ok(departure,'The real camera/tour callback must leave Locations even while the split-screen viewport stays active');
assert.equal(departure.detail.section,'/form');assert.equal(departure.detail.automatic,true);
assert.ok(live.now<30000,'Locations reaches the camera, holds 5.5 seconds, then advances without an indefinite wait');
assert.equal(run(1,{paused:true}).events.some(event=>event.type==='gallery-tour'),false,'Manual pause still stops the Locations tour');
assert.equal(run(1,{archive:true}).events.some(event=>event.type==='gallery-tour'),false,'An open location case file does not get interrupted');
console.log('PASS: actual Locations camera loop reaches and departs after its timed stop with an active split pane; manual pause and archive interaction remain protected.');
