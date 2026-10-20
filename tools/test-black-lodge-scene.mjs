import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const dataURL=moduleURL(fs.readFileSync(new URL('../assets/horror-locations-data-v17-10.js',import.meta.url),'utf8'));
const {HORROR_LOCATIONS,locationDirection}=await import(dataURL);
assert.equal(HORROR_LOCATIONS.length,200);
assert.equal(new Set(HORROR_LOCATIONS.map(record=>record.id)).size,200,'Every pin has a stable unique ID.');
for(const record of HORROR_LOCATIONS){
 assert.ok(Number.isFinite(record.lat)&&Math.abs(record.lat)<=90);
 assert.ok(Number.isFinite(record.lon)&&Math.abs(record.lon)<=180);
 assert.ok(['open','outside','gone'].includes(record.status));
 assert.ok(Math.abs(Math.hypot(...locationDirection(record))-1)<1e-12);
 if(record.bookCover)assert.ok(fs.existsSync(new URL('../'+record.bookCover,import.meta.url)));
}
for(const [lat,lon,expected]of [[0,0,[1,0,0]],[0,90,[0,0,-1]],[0,-90,[0,0,1]],[90,0,[0,1,0]]]){
 locationDirection({lat,lon}).forEach((value,index)=>assert.ok(Math.abs(value-expected[index])<1e-12,'Pin coordinates match the map’s cardinal directions.'));
}

class Bus {
 constructor(){this.handlers=new Map;this.events=[]}
 addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set);this.handlers.get(name).add(fn)}
 removeEventListener(name,fn){this.handlers.get(name)?.delete(fn)}
 dispatchEvent(event){this.events.push(event);for(const fn of this.handlers.get(event.type)||[])fn(event);return true}
}
class Vector {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}
 copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
 setScalar(s){this.x=this.y=this.z=s;return this}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
 normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1))}
 applyMatrix4(){return this}
 project(){this.x*=.5;this.y*=.5;this.z*=.5;return this}
}
class Shape{constructor(){this.holes=[]}absarc(){}}
class Object3D{constructor(){this.position=new Vector;this.scale=new Vector;this.quaternion={setFromUnitVectors(){}};this.matrix={}}updateMatrix(){}}
const refs=[],effects=[],layouts=[],state=[],intervals=new Map;let frame,clock=0,nextInterval=1;
const records=[{id:'first-film',lat:30,lon:-40,status:'open',film:'Test Film',place:'Test Lodge'},{id:'second-film',lat:0,lon:90,status:'gone'}];
const R={useRef(value){const ref={current:value};refs.push(ref);return ref},useMemo:fn=>fn(),useEffect:fn=>effects.push(fn),useLayoutEffect:fn=>layouts.push(fn),useState(value){const index=state.length;state.push(index===0?records:value);return[state[index],next=>state[index]=next]}};
const spin={position:new Vector(0,1.49,0),rotation:{x:0,y:0},quaternion:{slerp(){},angleTo(){return 0}}};
const pins={setMatrixAt(){},setColorAt(){},instanceMatrix:{},computeBoundingSphere(){}};
const jsx=(type,props)=>{if(props?.ref)props.ref.current=type==='instancedMesh'?pins:spin;return{type,props}};
const texture=()=>({repeat:{set(){}},dispose(){this.disposed=true}});
globalThis.window=new Bus;
const tips=[];globalThis.innerWidth=1280;globalThis.innerHeight=800;
globalThis.document=Object.assign(new Bus,{hidden:false,createElement:()=>({style:{},hidden:true,offsetWidth:240,offsetHeight:50,setAttribute(){},remove(){this.removed=true}}),body:{style:{},append:node=>tips.push(node)},documentElement:{classList:{contains:()=>true}},querySelector:()=>null});
globalThis.performance={now:()=>clock};
globalThis.matchMedia=()=>({matches:false});
Object.defineProperty(globalThis,'navigator',{value:{connection:{}},configurable:true});
globalThis.CustomEvent=class{constructor(type,{detail}={}){this.type=type;this.detail=detail}};
globalThis.setInterval=fn=>{const id=nextInterval++;intervals.set(id,fn);return id};
globalThis.clearInterval=id=>intervals.delete(id);
const source=fs.readFileSync(new URL('../assets/black-lodge-scene-v17-10.js',import.meta.url),'utf8').replace("'./horror-locations-data-v17-10.js'",JSON.stringify(dataURL));
const {createBlackLodge}=await import(moduleURL(source));
const {GlobeTable}=createBlackLodge({React:R,jsx:{jsx,jsxs:jsx},useFrame:fn=>frame=fn,useThree:()=>({camera:{position:{x:0}}}),RoundedBox:class{},Vector2:Vector,Vector3:Vector,Quaternion:class{},Object3D,Color:class{},Shape,Path:Shape,Curve:class{},loadTexture:texture});
const root=GlobeTable();layouts.forEach(fn=>fn());const cleanup=effects.map(fn=>fn()).filter(Boolean);
const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of Array.isArray(node.props?.children)?node.props.children:[node.props?.children]){const result=find(child,predicate);if(result)return result}return null};
const sphere=find(root,node=>node.type==='mesh'&&node.props.onPointerDown);
const pinMesh=find(root,node=>node.type==='instancedMesh');
const captured=new Set,target={setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
const pointer=(pointerId=1,x=20,y=20)=>({pointerId,button:0,clientX:x,clientY:y,target,stopPropagation(){},nativeEvent:{stopImmediatePropagation(){}}});
pinMesh.props.onPointerOver({...pointer(),instanceId:0});frame(null,.016);
assert.equal(tips[0].textContent,'Test Film — Test Lodge');assert.equal(tips[0].hidden,false,'Pin hover reveals film and location');
assert.ok(!tips[0].style.left.includes('NaN'));pinMesh.props.onPointerOut();assert.equal(tips[0].hidden,true,'Leaving a pin dismisses its label');
const levels=[],lights=[];for(let i=0;i<160;i++){frame(null,.05);levels.push(spin.emissiveIntensity);lights.push(spin.intensity)}
assert.ok(Math.min(...levels)>=.54&&Math.max(...levels)<=.82&&Math.max(...levels)-Math.min(...levels)>.27,'Satellite surface stays illuminated at every pulse phase without washing out natural land color');
assert.ok(Math.max(...lights)-Math.min(...lights)>2.19,'The existing inner lamp retains its stronger visible glow pulse');
sphere.props.onPointerDown(pointer());assert.equal(window.__globeDragging,true);
sphere.props.onPointerDown(pointer(2));sphere.props.onPointerUp(pointer(2));assert.equal(window.__globeDragging,true,'A second touch cannot replace or finish the active drag.');
sphere.props.onPointerMove(pointer(1,40,20));assert.ok(spin.rotation.y>0);
window.dispatchEvent({type:'lostpointercapture',pointerId:1});assert.equal(window.__globeDragging,false,'Losing native capture releases gallery navigation.');
for(const type of ['pointercancel','pointerup','blur']){sphere.props.onPointerDown(pointer());window.dispatchEvent({type,pointerId:1});assert.equal(window.__globeDragging,false,`${type} releases the drag lock.`)}
sphere.props.onPointerDown(pointer());document.hidden=true;document.dispatchEvent({type:'visibilitychange'});assert.equal(window.__globeDragging,false);document.hidden=false;

pinMesh.props.onPointerDown({...pointer(),instanceId:0});records.reverse();pinMesh.props.onPointerUp(pointer());
assert.equal(window.events.filter(event=>event.type==='horror-globe-open').at(-1).detail.id,'first-film','Pin identity survives a filter/data reorder during capture.');
const pending=refs[6];
const waiting=texture();pending.current={texture:waiting,deadline:15000};frame(null,.016);assert.equal(waiting.disposed,undefined);
clock=15001;frame(null,.016);assert.equal(waiting.disposed,true);assert.equal(pending.current,null,'Unready texture polling ends at the bounded deadline.');
const ready=Object.assign(texture(),{image:{width:4096}});pending.current={texture:ready,deadline:30000};frame(null,.016);assert.equal(state[1],ready,'Only a ready image replaces the fallback material.');
sphere.props.onPointerDown(pointer());cleanup.reverse().forEach(fn=>fn());assert.equal(window.__globeDragging,false);assert.equal(intervals.size,0);
console.log('PASS: 200 valid map pins, cardinal alignment, native capture cleanup, multitouch, stable pin identity, bounded texture readiness, and unmount cleanup.');
