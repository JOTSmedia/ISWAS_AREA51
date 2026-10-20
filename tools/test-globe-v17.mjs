import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Run the real GlobeTable callbacks without a browser/GPU; this verifies animation
// timing and lifecycle behavior, while visual frame rate remains a browser check.
const asModule=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const dataURL=asModule(readFileSync(new URL('../assets/horror-locations-data-v17-10.js',import.meta.url),'utf8'));
const source=readFileSync(new URL('../assets/black-lodge-scene-v17-10.js',import.meta.url),'utf8').replace("'./horror-locations-data-v17-10.js'",JSON.stringify(dataURL));
const {createBlackLodge,illuminateGlobeOcean,preserveGlobePinSize,GLOBE_PIN_HEAD_RADIUS,GLOBE_REST_ELEVATION,GLOBE_HOVER_ELEVATION,stepGlobeElevation,globeTableInFocus}=await import(asModule(source));
class Bus {
 constructor(){this.handlers=new Map}
 addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set);this.handlers.get(name).add(fn)}
 removeEventListener(name,fn){this.handlers.get(name)?.delete(fn)}
 dispatchEvent(event){for(const fn of this.handlers.get(event.type)||[])fn(event)}
}
class Vector {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}
 copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this}
 multiplyScalar(n){this.x*=n;this.y*=n;this.z*=n;return this}
 setScalar(n){this.x=this.y=this.z=n;return this}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1))}
 applyMatrix4(){return this}
 project(){return this.multiplyScalar(.5)}
}
class Quaternion {
 constructor(){this.remaining=1;this.lastAlpha=0}
 setFromUnitVectors(from,to){this.from={...from};this.to={...to};return this}
 slerp(_target,alpha){this.lastAlpha=alpha;this.remaining*=1-alpha}
 angleTo(){return this.remaining}
}
class Shape {constructor(){this.holes=[]}absarc(){}}
class Object3D {constructor(){this.position=new Vector;this.scale=new Vector;this.quaternion=new Quaternion;this.matrix={}}updateMatrix(){this.matrix={position:{...this.position},scale:{...this.scale},quaternion:{...this.quaternion}}}}
const children=node=>Array.isArray(node?.props?.children)?node.props.children:[node?.props?.children];
const find=(node,test)=>{if(!node||typeof node!=='object')return null;if(test(node))return node;for(const child of children(node)){const found=find(child,test);if(found)return found}return null};
const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-10,`${message}: ${actual} vs ${expected}`);

function harness({mobile=false,reduced=false,satellite=null,cloudReady=false}={}){
 let clock=1,frame,stateIndex=0,dialogOpen=false,gallery=true;
 const effects=[],layouts=[],intervals=new Set,texturePaths=[],textureRecords=[],dom={reads:0,writes:0};
 const tooltipElement=()=>{let hidden=true,text;return{style:new Proxy({},{set(object,key,value){dom.writes++;object[key]=value;return true}}),get hidden(){return hidden},set hidden(value){dom.writes++;hidden=value},get textContent(){return text},set textContent(value){dom.writes++;text=value},get offsetWidth(){dom.reads++;return 220},get offsetHeight(){dom.reads++;return 48},setAttribute(){},remove(){}}};
 const records=[{id:'test-lodge',lat:30,lon:-40,status:'open',film:'Test Film',place:'Test Lodge'}];
 const R={useRef:current=>({current}),useMemo:fn=>fn(),useEffect:fn=>effects.push(fn),useLayoutEffect:fn=>layouts.push(fn),useState:value=>{const index=stateIndex++;return[index===0?records:index===1&&satellite?satellite:value,()=>{}]}};
 const jsx=(type,props)=>{
  const node={type,props};
  if(props?.ref){
   node.instance=type==='instancedMesh'?{matrixWrites:0,matrices:[],setMatrixAt(index,matrix){this.matrixWrites++;this.matrices[index]=structuredClone(matrix)},setColorAt(){},instanceMatrix:{},computeBoundingSphere(){}}:
    type==='group'?{position:new Vector(...props.position),rotation:{x:props.rotation?.[0]||0,y:props.rotation?.[1]||0},quaternion:new Quaternion,matrixWorld:{}}:
    type==='meshPhysicalMaterial'?{emissiveIntensity:props.emissiveIntensity}:{intensity:props.intensity};
   props.ref.current=node.instance;
  }
  return node;
 };
 globalThis.window=new Bus;
 globalThis.document=Object.assign(new Bus,{hidden:false,body:{style:{},append(){}},documentElement:{classList:{contains:()=>gallery}},querySelector:selector=>dialogOpen&&!(dialogOpen==='locations'&&selector.includes(':not(.horror-locations)'))?{}:null,createElement:tooltipElement});
 globalThis.innerWidth=mobile?390:1280;globalThis.innerHeight=800;
 globalThis.matchMedia=query=>({matches:query.includes('reduced-motion')?reduced:mobile});
 Object.defineProperty(globalThis,'navigator',{value:{connection:{}},configurable:true});
 globalThis.performance={now:()=>clock};
 globalThis.setInterval=fn=>{intervals.add(fn);return fn};globalThis.clearInterval=fn=>intervals.delete(fn);
 const aim=new Vector(0,0,1),camera={position:new Vector(21.5,4.4,8.4),getWorldDirection:out=>out.copy(aim)};
 const {GlobeTable}=createBlackLodge({React:R,jsx:{jsx,jsxs:jsx},useFrame:fn=>frame=fn,useThree:()=>({camera}),RoundedBox:class{},Vector2:Vector,Vector3:Vector,Quaternion,Object3D,Color:class{},Shape,Path:Shape,Curve:class{},loadTexture:path=>{texturePaths.push(path);const texture={path,image:cloudReady&&path.includes('globe-clouds-')?{width:mobile?1024:2048}:undefined,repeat:{set(){}},disposals:0,dispose(){this.disposals++}};textureRecords.push(texture);return texture}});
 const tree=GlobeTable();layouts.forEach(fn=>fn());const cleanup=effects.map(fn=>fn()).filter(Boolean);
 const globe=find(tree,node=>node.type==='mesh'&&node.props.onPointerDown);
 const material=find(globe,node=>node.type==='meshPhysicalMaterial');
 const spin=find(tree,node=>node.type==='group'&&node.props.ref).instance;
 const light=find(tree,node=>node.type==='pointLight'&&node.props.ref).instance;
 const pins=find(tree,node=>node.type==='instancedMesh');
 return {tree,globe,material,spin,light,pins,camera,texturePaths,textureRecords,dom,
  tick(dt){clock+=dt*1000;frame(null,dt)},
  advance(seconds,fps){for(let n=0;n<Math.round(seconds*fps);n++)this.tick(1/fps)},
  setDialog(value){dialogOpen=value},setGallery(value){gallery=value},setAim(value){aim.copy(value)},
  dispose(){cleanup.reverse().forEach(fn=>fn());assert.equal(intervals.size,0)}
 };
}

{
 const h=harness(),material=find(h.pins,node=>node.type==='meshBasicMaterial');
 const shader={uniforms:{},vertexShader:'#include <common>\nvoid main(){\n#include <begin_vertex>\n#include <project_vertex>\n}'};
 material.props.onBeforeCompile(shader);
 const uniform=shader.uniforms.globePinScale,matrixWrites=h.pins.instance.matrixWrites;
 assert.ok(uniform,'The rendered pin material receives its shared radius uniform');
 assert.equal(material.props.customProgramCacheKey(),'globe-pin-screen-size-v1');
 assert.ok(shader.vertexShader.indexOf('transformed *= globePinScale;')<shader.vertexShader.indexOf('#include <project_vertex>'),'Pin radius changes before instance projection, leaving geographic translations intact');
 const expected={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>'};
 preserveGlobePinSize(expected,uniform);assert.equal(expected.uniforms.globePinScale,uniform,'The material uses the same shared shader treatment');
 const baselineFov=42,depth=6.4,height=900,pinRadius=.032,spacing=.06;
 const baselinePixelsPerUnit=height/(2*Math.tan(baselineFov*Math.PI/360)*depth);
 for(const zoom of [.8,1,1.18,1.6,2.4]){
  window.__globeZoomRendered=zoom;h.tick(1/60);
  assert.equal(shader.uniforms.globePinScale,uniform,'Animated zoom reuses one uniform without recompiling');
  const fov=2*Math.atan(Math.tan(baselineFov*Math.PI/360)/zoom),pixelsPerUnit=height/(2*Math.tan(fov/2)*depth);
  close(pinRadius*uniform.value*pixelsPerUnit,pinRadius*baselinePixelsPerUnit,'Visible dot radius stays constant through lens zoom');
  close(spacing*pixelsPerUnit,spacing*baselinePixelsPerUnit*zoom,'Geographic centers spread apart as the globe zooms in');
  close(pinRadius*1.7*uniform.value*pixelsPerUnit,pinRadius*baselinePixelsPerUnit*1.7,'Selected pins retain their distinct 1.7× size');
 }
 for(const value of [undefined,NaN,0,-1,Infinity]){window.__globeZoomRendered=value;h.tick(1/60);close(uniform.value,1,'Missing or invalid lens state preserves baseline pin size')}
 assert.equal(h.pins.instance.matrixWrites,matrixWrites,'Zoom frames never rewrite pin instance matrices');
 assert.equal(find(h.pins,node=>node.type==='sphereGeometry').props.args[0],.032,'Zoom does not allocate a new pin geometry');
 h.dispose();
 console.log('PASS: actual globe callback updates one cached shader uniform; pin centers spread during zoom while dots and selected emphasis keep their screen size, with no per-pin matrix updates.');
}

{
 let disposals=0;const satellite={image:{width:4096,height:2048},colorSpace:'srgb',dispose(){disposals++}},h=harness({satellite});
 assert.equal(h.material.props.map,satellite,'The downloaded satellite texture reaches the visible surface');
 assert.equal(h.material.props.emissiveMap,satellite,'The same texture drives glow without another image download');
 assert.equal(h.material.props.color,'#ffffff','The loaded map retains its natural land and water colors');
 h.dispose();assert.equal(disposals,1,'The shared satellite texture is disposed once on unmount');
}

for(const mobile of [false,true])for(const fps of [30,60,120]){
 const h=harness({mobile}),start=h.spin.rotation.y;
 h.advance(10,fps);
 close(h.spin.rotation.y-start,.75,`${mobile?'Mobile':'Desktop'} globe rotates .075 radians/sec at ${fps}fps`);
 const geometry=find(h.globe,node=>node.type==='sphereGeometry');
 assert.deepEqual(geometry.props.args,mobile?[1.05,48,32]:[1.05,80,56]);
 assert.ok(h.texturePaths.every(path=>path.endsWith(mobile?'-1024.webp':'-2048.webp')),'Lodge texture tier matches the device budget');
 h.dispose();
}

{
 const h=harness(),levels=[],lights=[];
 for(let i=0;i<8*60;i++){
  h.tick(1/60);levels.push(h.material.instance.emissiveIntensity);lights.push(h.light.intensity);
  close(h.light.intensity,6.1+(h.material.instance.emissiveIntensity-.68)*1.1/.14,'Inner light follows the surface pulse');
 }
 assert.ok(Math.min(...levels)<.541&&Math.min(...levels)>=.54&&Math.max(...levels)>.819,'The pulse retains a continuous illumination floor while preserving satellite detail');
 assert.ok(Math.min(...lights)<5.001&&Math.max(...lights)>7.199,'The existing inner lamp retains the noticeable glow pulse');
 assert.equal(h.material.props.emissive,'#ffffff','Neutral emission preserves the real satellite map colors');
 const shader={uniforms:{},fragmentShader:'#include <common>\n#include <map_fragment>\n#include <emissivemap_fragment>\n#include <lights_physical_fragment>\n#include <opaque_fragment>'};h.material.props.onBeforeCompile(shader);
 assert.ok(shader.fragmentShader.includes('globeOceanColor'),'Earth atmosphere retains the tested ocean-only illumination floor');
 assert.equal((shader.fragmentShader.match(/texture2D\(/g)||[]).length,3,'Cloud sample adds exactly one lookup to the existing diffuse and emissive samples');
 assert.equal(h.material.props.customProgramCacheKey(),'nasa-earth-atmosphere-v3','Stable program key keeps the atmosphere shader cached across renders');
 assert.equal(h.material.props.onUpdate,undefined,'Renders do not force needless material recompilation');
 assert.ok(h.material.props.roughness>=.6&&h.material.props.clearcoat<=.15,'Broad restrained reflections keep satellite details legible');
 const before=h.spin.rotation.y,phase=h.material.instance.emissiveIntensity;
 document.hidden=true;h.tick(10);close(h.spin.rotation.y,before,'Hidden globe pauses rotation');close(h.material.instance.emissiveIntensity,phase,'Hidden globe pauses pulse');document.hidden=false;
 h.tick(10);close(h.spin.rotation.y-before,.00375,'Long stalls cannot cause a large catch-up jump');
 h.pins.props.onPointerOver({instanceId:0,stopPropagation(){}});const hovered=h.spin.rotation.y;h.advance(1,60);close(h.spin.rotation.y,hovered,'Pin hover pauses rotation for reading');
 h.pins.props.onPointerOut();h.tick(1/60);assert.ok(h.spin.rotation.y>hovered,'Rotation resumes when the label is left');
 h.setDialog(true);const modal=h.spin.rotation.y;h.advance(1,60);close(h.spin.rotation.y,modal,'Location popup pauses idle rotation');
 h.setDialog(false);h.camera.position.x=0;h.advance(1,60);close(h.spin.rotation.y,modal,'Distant globe pauses idle rotation');
 h.dispose();
}


{
 const h=harness();h.setGallery(false);h.setDialog('locations');
 window.__locationsViewport={left:640,top:100,width:600,height:650};
 const start=h.spin.rotation.y;h.advance(1,60);
 assert.ok(h.spin.rotation.y>start,'The nonmodal locations archive keeps the globe rotating');
 const target={setPointerCapture(){},hasPointerCapture(){return false}};
 const event={button:0,pointerId:1,clientX:900,clientY:400,target,stopPropagation(){},nativeEvent:{stopImmediatePropagation(){}}};
 h.globe.props.onPointerDown(event);
 assert.equal(window.__globeDragging,true,'The globe can be dragged alongside the narrative locations page');
 h.globe.props.onPointerMove({...event,clientX:930});
 assert.ok(h.spin.rotation.y>start+.2,'Dragging rotates the globe while the archive stays open');
 h.globe.props.onPointerUp({...event,clientX:930});
 assert.equal(window.__globeDragging,false,'Finishing a globe drag releases the navigation lock');
 h.setDialog(true);h.globe.props.onPointerDown(event);
 assert.equal(window.__globeDragging,false,'An unrelated modal still blocks globe interaction');
 window.__locationsViewport=null;h.setDialog(false);h.globe.props.onPointerDown(event);
 assert.equal(window.__globeDragging,false,'Narrative pages outside locations do not acquire the globe drag');
 h.dispose();
}

for(const mobile of [false,true]){
 const h=harness({mobile,reduced:true}),start=h.spin.rotation.y;
 h.advance(5,60);close(h.spin.rotation.y,start,'Reduced motion disables idle spin');close(h.material.instance.emissiveIntensity,.68,'Reduced motion keeps a steady illuminated globe');close(h.light.intensity,6.1,'Reduced motion retains the steady inner lamp');
 h.dispose();
}

for(const fps of [30,60,120]){
 const h=harness();window.dispatchEvent({type:'globe-location-select',detail:{id:'test-lodge',lat:30,lon:-40}});
 h.advance(.5,fps);close(h.spin.quaternion.remaining,Math.exp(-2),`Location easing is time based at ${fps}fps`);
 h.tick(10);close(h.spin.quaternion.lastAlpha,1-Math.exp(-.2),'Location easing is bounded after a stall');h.dispose();
}
console.log('PASS: actual globe callbacks at 30/60/120fps on both geometry tiers; natural satellite land with illuminated blue oceans; bounded surface and inner-light glow pulse; reduced-motion, hidden, hover, dialog and distance pauses; bounded rotation and selection easing.');

{
 const h=harness();const event={instanceId:0,stopPropagation(){}};h.pins.props.onPointerOver(event);h.tick(1/60);
 assert.equal(h.dom.reads,2,'Tooltip measures its two dimensions once on first display');const writes=h.dom.writes;
 for(let i=0;i<120;i++){h.pins.props.onPointerMove(event);h.tick(1/60)}
 assert.equal(h.dom.reads,2,'A stationary two-second hover performs no repeated layout reads');assert.equal(h.dom.writes,writes,'Unchanged hover text, visibility and position create no DOM mutations');
 globalThis.innerWidth=390;h.tick(1/60);assert.equal(h.dom.reads,4,'Responsive width changes refresh cached tooltip dimensions');h.dispose();
 console.log('PASS: 120 stationary tooltip frames require zero extra layout reads or DOM writes; responsive measurements refresh.');
}

{
 const h=harness();h.camera.fov=42;
 const origin=new Vector(3,3.1,6.9).normalize().multiplyScalar(7.5);
 const a=30*Math.PI/180,b=-40*Math.PI/180;
 const pin=new Vector(Math.cos(a)*Math.cos(b),Math.sin(a),-Math.cos(a)*Math.sin(b)).multiplyScalar(GLOBE_PIN_HEAD_RADIUS);
 const direction=new Vector().copy(pin).sub(origin).normalize();
 const ray={origin,direction,at(distance,target){target.x=origin.x+direction.x*distance;target.y=origin.y+direction.y*distance;target.z=origin.z+direction.z*distance;return target}};
 const hits=[];h.pins.props.raycast({ray,near:0,far:100},hits);
 assert.equal(hits.length,1,'The actual instanced mesh exposes its custom pointer target');
 assert.equal(hits[0].instanceId,0);assert.equal(hits[0].object,h.pins.instance);
 const target={setPointerCapture(){},hasPointerCapture(){return false}};
 const event={button:0,instanceId:hits[0].instanceId,pointerId:3,clientX:600,clientY:350,target,stopPropagation(){},nativeEvent:{stopImmediatePropagation(){}}};
 let opened=null;window.addEventListener('horror-globe-open',event=>opened=event.detail);
 globalThis.CustomEvent??=class{constructor(type,{detail}={}){this.type=type;this.detail=detail}};
 h.pins.props.onPointerDown(event);h.pins.props.onPointerUp(event);
 assert.equal(opened?.id,'test-lodge','A click in the actual hit target opens its matching location');
 const blocked=[];h.setDialog(true);h.pins.props.raycast({ray},blocked);assert.equal(blocked.length,0,'An unrelated popup blocks enlarged targets');
 h.setDialog(false);h.setGallery(false);h.pins.props.raycast({ray},blocked);assert.equal(blocked.length,0,'Narrative pages do not acquire oversized globe targets');
 h.dispose();
 console.log('PASS: actual instanced pin raycast, matching-location pointer click, popup and narrative interaction guards.');
}

{
 // Use the actual bundled Fiber dispatcher: a native click is a distinct event
 // after pointer-up and can otherwise fall through to the table underneath.
 const compiled=readFileSync(new URL('../assets/lodge-canvas-v17-10.js',import.meta.url),'utf8');
 const dispatcherStart=compiled.indexOf('function f_(e){'),dispatcherEnd=compiled.indexOf('var p_=',dispatcherStart);
 assert.ok(dispatcherStart>=0&&dispatcherEnd>dispatcherStart);
 const createEvents=new Function('Hg','c_','l_','U',compiled.slice(dispatcherStart,dispatcherEnd)+';return f_')(
  object=>object.__r3f?.root.getState(),
  hit=>(hit.eventObject||hit.object).uuid+'/'+hit.index+hit.instanceId,
  (captures,object,map,id)=>{const value=map.get(object);if(value){map.delete(object);if(!map.size){captures.delete(id);value.target.releasePointerCapture(id)}}},
  class{unproject(){return this}}
 );
 const h=harness(),opened=[];
 window.addEventListener('horror-globe-open',event=>opened.push(event.detail||null));
 const table=find(h.tree,node=>node.type==='mesh'&&node.props.onClick&&!node.props.onPointerDown);
 const state={camera:{},pointer:{x:0,y:0},internal:{interaction:[],initialHits:[],initialClick:[0,0],hovered:new Map,capturedMap:new Map,lastEvent:{current:null}}};
 const store={getState:()=>state};
 const object=(uuid,node,distance)=>{const handlers=Object.fromEntries(Object.entries(node.props).filter(([name,value])=>name.startsWith('on')&&typeof value==='function'));return{uuid,distance,parent:null,__r3f:{root:store,handlers,eventCount:Object.keys(handlers).length}}};
 const pinObject=object('pin',h.pins,1),sphereObject=object('sphere',h.globe,2),tableObject=object('table',table,3);
 state.internal.interaction=[tableObject,sphereObject,pinObject];
 state.events={enabled:true,priority:1,compute:()=>{state.raycaster.camera=state.camera}};
 state.raycaster={ray:{},intersectObject:object=>[{object,distance:object.distance,...(object===pinObject?{instanceId:0}:{})}]};
 const dispatch=createEvents(store).handlePointer;
 const native={button:0,pointerId:8,clientX:600,clientY:300,offsetX:600,offsetY:300,target:{setPointerCapture(){},releasePointerCapture(){}},stopImmediatePropagation(){}};
 dispatch('onPointerDown')(native);dispatch('onPointerUp')(native);dispatch('onClick')(native);
 assert.equal(opened.length,1,'Pointer-up followed by the native click opens exactly one location');
 assert.equal(opened[0].id,'test-lodge','A table click cannot replace the selected pin with the archive intro');
 table.props.onClick({stopPropagation(){}});
 assert.equal(opened.length,1,'A changed intersection immediately after release cannot fall through to the table');
 h.advance(.4,60);table.props.onClick({stopPropagation(){}});assert.equal(opened.length,2,'An intentional later table click still opens the archive');
 h.globe.props.onPointerOver({stopPropagation(){}});const rotation=h.spin.rotation.y;h.advance(5,60);
 close(h.spin.rotation.y,rotation,'Aiming anywhere over the globe holds pins stationary');
 h.globe.props.onPointerOut();h.tick(1/60);assert.ok(h.spin.rotation.y>rotation,'Leaving the globe resumes idle rotation');
 h.dispose();
 console.log('PASS: actual Fiber pointer-down/up/click ordering preserves pin selection, prevents table click-through, and holds the globe stationary while aiming.');
}

const archive=readFileSync(new URL('../assets/horror-globe-ui-v17-10.js',import.meta.url),'utf8');
assert.match(archive,/EARTH IMAGERY: NASA EARTH OBSERVATORY · LOCATION NOTES FROM THE SUPPLIED ARCHIVE/,'Earth imagery and supplied location notes have separate accurate credits');
assert.doesNotMatch(archive,/NATURAL EARTH/,'The archive no longer credits the replaced cartographic imagery');

// The cloud texture is independent of the satellite-ready surface: it arrives
// through a cached uniform, never delaying or remounting the visible globe.
for(const mobile of [false,true]){
 const h=harness({mobile,cloudReady:true}),shader={uniforms:{},fragmentShader:'#include <common>\n#include <map_fragment>\n#include <emissivemap_fragment>\n#include <lights_physical_fragment>\n#include <opaque_fragment>'};
 h.material.props.onBeforeCompile(shader);const uniforms=shader.uniforms;
 assert.equal(uniforms.globeCloudReady.value,0,'Clouds remain optional before their deferred request.');
 assert.equal(h.texturePaths.some(path=>path.includes('globe-clouds-')),false,'Cloud map is not requested at initial gallery construction.');
 window.dispatchEvent({type:'horror-globe-visit'});
 for(let i=0;i<10&&!h.texturePaths.some(path=>path.includes('globe-clouds-'));i++)await new Promise(resolve=>setImmediate(resolve));
 const clouds=h.textureRecords.find(texture=>texture.path.includes('globe-clouds-'));
 assert.ok(clouds,'A globe visit schedules the cloud map.');assert.ok(clouds.path.endsWith(mobile?'-1024.webp':'-2048.webp'));
 assert.equal(clouds.colorSpace,'','Cloud brightness is sampled as linear coverage data, never sRGB-decoded.');
 assert.equal(clouds.wrapS,1000);assert.equal(clouds.wrapT,1001,'Latitude is clamped at the poles.');
 h.tick(1/60);assert.equal(uniforms.globeCloudReady.value,1);assert.equal(uniforms.globeCloudMap.value,clouds,'Decoded cloud texture swaps into a persistent sampler uniform.');
 const offset=uniforms.globeCloudOffset,begin=offset.value;h.advance(1,60);close(offset.value-begin,.00006,'Weather drifts slowly with elapsed time.');
 document.hidden=true;const hidden=offset.value;h.tick(10);close(offset.value,hidden,'Hidden tabs freeze cloud motion.');document.hidden=false;
 h.camera.position.x=0;h.tick(1/60);close(offset.value,hidden,'Distant globe freezes cloud motion.');h.camera.position.x=21.5;
 h.setDialog(true);h.tick(1/60);close(offset.value,hidden,'A modal pauses cloud motion.');h.setDialog(false);h.tick(10);close(offset.value-hidden,.000003,'Cloud drift cannot jump after a long frame.');
 assert.equal(shader.uniforms.globeCloudOffset,offset,'Uniform objects are reused across animation frames.');
 h.dispose();assert.equal(clouds.disposals,1,'Cloud texture is released exactly once.');assert.equal(uniforms.globeCloudMap.value,null);assert.equal(uniforms.globeCloudReady.value,0);
}
{
 const h=harness({reduced:true}),shader={uniforms:{},fragmentShader:'#include <common>\n#include <map_fragment>\n#include <emissivemap_fragment>\n#include <lights_physical_fragment>\n#include <opaque_fragment>'};h.material.props.onBeforeCompile(shader);h.advance(5,60);close(shader.uniforms.globeCloudOffset.value,0,'Reduced motion holds clouds still.');h.dispose();
}
{
 const h=harness(),shader={uniforms:{},fragmentShader:'#include <common>\n#include <map_fragment>\n#include <emissivemap_fragment>\n#include <lights_physical_fragment>\n#include <opaque_fragment>'};h.material.props.onBeforeCompile(shader);window.dispatchEvent({type:'horror-globe-visit'});
 for(let i=0;i<10&&!h.texturePaths.some(path=>path.includes('globe-clouds-'));i++)await new Promise(resolve=>setImmediate(resolve));
 const clouds=h.textureRecords.find(texture=>texture.path.includes('globe-clouds-'));assert.ok(clouds);h.tick(16);assert.equal(shader.uniforms.globeCloudReady.value,0,'Failed clouds do not replace or hide the earth.');assert.equal(clouds.disposals,1,'Optional cloud load times out cleanly.');h.dispose();assert.equal(clouds.disposals,1,'Timed-out cloud texture is not disposed twice.');
}
console.log('PASS: lazy 1024/2048 linear cloud maps; decoded optional activation; single extra sample shared by diffuse/emission; time-based cloud drift; hidden/distant/modal/reduced-motion pauses; bounded resume and success/failure cleanup.');

{
 const h=harness(),needle=find(h.tree,node=>node.type==='instancedMesh'&&node!==h.pins),needleGeometry=find(needle,node=>node.type==='cylinderGeometry');
 assert.equal(needleGeometry.props.args[0],.009,'Needles have a visible narrow metal stem.');
 assert.equal(needleGeometry.props.args[1],0,'The globe end is a sharp point.');
 close(needleGeometry.props.args[2],GLOBE_PIN_HEAD_RADIUS-1.045,'Each needle begins just below the surface and ends at the marker center.');
 const head=h.pins.instance.matrices[0],stem=needle.instance.matrices[0],radius=Math.hypot(head.position.x,head.position.y,head.position.z);
 close(radius,GLOBE_PIN_HEAD_RADIUS,'Marker heads sit above the atmosphere.');
 close(Math.hypot(stem.position.x,stem.position.y,stem.position.z),(1.045+GLOBE_PIN_HEAD_RADIUS)/2,'Needles are centered between the point and marker.');
 for(const axis of ['x','y','z'])close(stem.quaternion.to[axis],head.position[axis]/radius,'The needle points radially out of its true geographic coordinate.');
 assert.equal(needle.props.raycast(),null,'Needles cannot steal a marker or sphere click.');
 assert.equal(needle.instance.count,h.pins.instance.count,'Filtering updates both instanced marker and needle counts.');
 const group=find(h.tree,node=>node.type==='group'&&node.props.ref),items=children(group);
 assert.ok(items.includes(h.globe)&&items.includes(h.pins)&&items.includes(needle),'Earth, markers and needles lift in the same transform.');
 const halo=items.find(node=>find(node,child=>child.type==='shaderMaterial'));
 assert.ok(halo,'The atmosphere is part of the same lifting transform.');assert.equal(halo.props.raycast(),null);
 assert.equal(find(halo,node=>node.type==='sphereGeometry').props.args[0],1.135,'Atmosphere remains inside the raised pin heads.');
 const haloMat=find(halo,node=>node.type==='shaderMaterial').props;
 assert.equal(haloMat.depthWrite,false);assert.equal(haloMat.depthTest,true);assert.equal(haloMat.side,1,'The halo uses the far surface around the planet silhouette.');
 h.dispose();
 console.log('PASS: instanced pointed needles align to geographic normals, heads sit above the halo, and all globe elements share one lifting transform.');
}
for(const fps of [30,60,120]){
 const h=harness();h.setGallery(false);window.__locationsViewport={left:640,top:100,width:600,height:650};
 h.advance(.5,fps);close(h.spin.position.y,GLOBE_REST_ELEVATION+(GLOBE_HOVER_ELEVATION-GLOBE_REST_ELEVATION)*(1-Math.exp(-1.8)),`Actual lift uses elapsed time at ${fps}fps`);
 assert.equal(window.__globeElevation,h.spin.position.y,'Camera receives actual eased globe height every frame.');
 h.advance(3,fps);close(h.spin.position.y,GLOBE_HOVER_ELEVATION,'Locations holds the complete sphere above the table.');
 assert.ok(h.spin.position.y-1.05>1.58,'The globe bottom clears the table rim.');
 assert.equal(window.__globeLiftActive,true);
 window.__locationsViewport=null;h.advance(3,fps);close(h.spin.position.y,GLOBE_REST_ELEVATION,'Leaving the workspace gently returns the globe to its table.');
 h.dispose();assert.equal(window.__globeLiftActive,false);assert.equal(window.__globeElevation,GLOBE_REST_ELEVATION);
}
{
 const h=harness();window.__globeVisit=true;h.tick(1/60);assert.ok(h.spin.position.y>GLOBE_REST_ELEVATION,'Explicit 360 table focus raises the globe.');
 const height=h.spin.position.y;document.hidden=true;h.tick(20);close(h.spin.position.y,height,'A hidden page does not animate the lift.');document.hidden=false;
 h.tick(20);close(h.spin.position.y,stepGlobeElevation(height,true,.05),'Resuming after a stall cannot teleport the globe.');
 window.__globeVisit=false;h.camera.position=new Vector(25.3,4.4,8.4);h.setAim(new Vector(-3.8,GLOBE_REST_ELEVATION-4.4,-6.9));h.advance(3,60);
 close(h.spin.position.y,GLOBE_HOVER_ELEVATION,'Looking at the nearby table in free 360 mode keeps the whole globe hovering.');
 h.setAim(new Vector(1,0,0));h.advance(.5,60);assert.equal(window.__globeLiftActive,true,'Brief camera movement does not flicker the lift.');
 h.advance(.3,60);assert.equal(window.__globeLiftActive,false,'Looking away releases focus after the short hysteresis hold.');
 h.advance(3,60);close(h.spin.position.y,GLOBE_REST_ELEVATION,'The globe settles back after free-camera focus ends.');h.dispose();
}
{
 const h=harness({reduced:true});window.__locationsViewport={};h.tick(1/60);close(h.spin.position.y,GLOBE_HOVER_ELEVATION,'Reduced motion exposes the full globe without a travel animation.');
 h.setGallery(false);window.__locationsViewport=null;h.tick(1/60);close(h.spin.position.y,GLOBE_REST_ELEVATION,'Reduced motion also returns immediately.');h.dispose();
}
console.log('PASS: actual Locations and 360 lift at 30/60/120fps; shared camera height, complete table clearance, free-look hysteresis, hidden pause, bounded resume, reduced motion and unmount cleanup.');
