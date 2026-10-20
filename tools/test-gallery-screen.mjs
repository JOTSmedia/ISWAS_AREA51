import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/lodge-canvas-v17-15.js',import.meta.url),'utf8');
assert.ok(!source.includes('plasterMap=loadFrame('));
assert.ok(!source.includes('rugMap=loadFrame('));
const component=source.slice(source.indexOf('function Zy(){'),source.indexOf('function Qy()'));
let draw,cleanup,renderer,frame,visible=false,front=true,viewScale=1,group;
let requests=0,resizes=0,renders=0,vectorCount=0;
class Vector{
 constructor(x=0,y=0,z=0){vectorCount++;this.set(x,y,z)}
 set(x,y,z){Object.assign(this,{x,y,z});return this}
 setScalar(n){return this.set(n,n,n)}
 copy(v){return this.set(v.x,v.y,v.z)}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 transformDirection(){return this.set(0,0,front?1:-1)}
 dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}
 applyMatrix4(matrix){if(matrix.kind==='world')this.z-=5;return this}
 project(){return this.set((visible?0:4)+this.x*viewScale*.1,this.y*.1,0)}
}
class Layer{constructor(){this.style={};this.removed=false}remove(){this.removed=true}}
class Renderer{constructor(){renderer=this;this.domElement=new Layer}setSize(){resizes++}render(){renders++}}
class Screen{constructor(element){this.element=element;this.scale=new Vector;this.position=new Vector}}
const document={hidden:false,body:{appendChild(){}},documentElement:{classList:{contains:()=>true}},createElement:()=>{
 frame={style:{}};Object.defineProperty(frame,'src',{get:()=>frame.url,set:value=>{frame.url=value;requests++}});return frame;
}};
const jsx=(type,props)=>{if(type==='group'&&props.ref){group={matrixWorld:{kind:'world'},updateWorldMatrix(){},getWorldPosition:v=>v.set(0,0,-5)};props.ref.current=group}return{type,props}};
const context={u:{useRef:current=>({current}),useMemo:fn=>fn(),useEffect:fn=>cleanup=fn()},__:()=>({camera:{position:new Vector,near:.1,matrixWorldInverse:{kind:'camera'},updateMatrixWorld(){}},scene:{},size:{width:1280,height:900}}),ty:Renderer,Qv:Screen,U:Vector,document,v_:fn=>draw=fn,$:{jsx,jsxs:jsx}};
vm.runInNewContext(component+';Zy()',context);
assert.equal(requests,0,'Mount does not request the external player.');
const allocated=vectorCount;
for(let i=0;i<120;i++)draw();
assert.equal(requests,0,'An offscreen film stays unloaded.');assert.equal(renders,0,'Offscreen CSS3D work is skipped.');assert.equal(vectorCount,allocated,'Frames reuse projection vectors.');
visible=true;draw();assert.equal(requests,1);assert.equal(renders,1);assert.equal(frame.style.pointerEvents,'auto');
for(let i=0;i<60;i++)draw();
assert.equal(requests,1,'Player URL is assigned once.');assert.equal(resizes,1,'Stable dimensions do not trigger renderer layout work.');assert.equal(renders,61,'A visible screen follows the camera on every frame.');
visible=false;draw();assert.equal(renders,61);assert.equal(renderer.domElement.style.display,'none');assert.equal(frame.style.pointerEvents,'none');
visible=true;document.hidden=true;draw();assert.equal(renders,61,'Hidden tabs skip CSS3D rendering.');document.hidden=false;
front=false;draw();assert.equal(renders,61,'Screen back faces are skipped.');front=true;draw();assert.equal(renders,62);assert.equal(requests,1,'Returning to the screen retains the existing player.');
document.documentElement.dataset={roomReview:'records'};draw();assert.equal(renders,62,'Authoring furniture angles suppress the unrelated film layer.');assert.equal(renderer.domElement.style.display,'none');document.documentElement.dataset={};draw();assert.equal(renders,63,'The real gallery film resumes outside the authoring preview.');
cleanup();assert.equal(frame.url,'about:blank');assert.equal(renderer.domElement.removed,true);
console.log('PASS: zero offscreen player requests, visibility culling, vector reuse, resize caching, smooth visible updates, hidden-tab work suppression, and cleanup.');
