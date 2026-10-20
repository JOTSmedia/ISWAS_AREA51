import assert from 'node:assert/strict';
import {createMorganModelSystem} from '../assets/morgan-model-v17-17.js';

// Small Three-compatible construction adapter exercises the real model data,
// sharing, texture tier and rendering lifecycle without requiring a GPU in CI.
class Vector3{
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 normalize(){const n=Math.hypot(this.x,this.y,this.z)||1;this.x/=n;this.y/=n;this.z/=n;return this}
 crossVectors(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x)}
 applyMatrix4(matrix){const angle=matrix.rotationY||0,x=this.x,z=this.z;this.x=x*Math.cos(angle)+z*Math.sin(angle);this.z=-x*Math.sin(angle)+z*Math.cos(angle);return this}
 project(camera){const depth=camera.position.z-this.z,tan=Math.tan(camera.fov*Math.PI/360);this.x=(this.x-camera.position.x)/(depth*tan*camera.aspect);this.y=(this.y-camera.position.y)/(depth*tan);this.z=0;return this}
}
class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize}}
class Geometry{
 constructor(){this.attributes={};this.disposed=false}
 setAttribute(n,a){this.attributes[n]=a;return this}
 setIndex(a){this.index={array:a,count:a.length};return this}
 computeVertexNormals(){const p=this.attributes.position,n=new Float32Array(p.array.length);for(let j=0;j<this.index.array.length;j+=3){const [a,b,c]=this.index.array.slice(j,j+3),u=new Vector3(...[0,1,2].map(k=>p.array[b*3+k]-p.array[a*3+k])),v=new Vector3(...[0,1,2].map(k=>p.array[c*3+k]-p.array[a*3+k])),q=new Vector3().crossVectors(u,v);for(const i of [a,b,c]){n[i*3]+=q.x;n[i*3+1]+=q.y;n[i*3+2]+=q.z}}for(let j=0;j<n.length;j+=3){const m=Math.hypot(n[j],n[j+1],n[j+2])||1;n[j]/=m;n[j+1]/=m;n[j+2]/=m}this.attributes.normal=new Attribute(n,3)}
 dispose(){this.disposed=true}
}
class Group{constructor(){this.children=[];this.userData={};this.rotation={y:0};this.matrixWorld={}}add(o){this.children.push(o);o.parent=this}removeFromParent(){this.parent?.children.splice(this.parent.children.indexOf(this),1)}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material}}
class Material{constructor(options){Object.assign(this,options)}dispose(){this.disposed=true}}
class Texture{constructor(image){this.image=image;this.repeat={set(){}}}dispose(){this.disposed=true}}
class Light{constructor(){this.position=new Vector3()}}
class Camera extends Light{constructor(fov,aspect){super();this.fov=fov;this.aspect=aspect}lookAt(){}updateProjectionMatrix(){}}
const renderers=[];
class Renderer{
 constructor(){this.domElement={};this.sizes=[];renderers.push(this)}setClearColor(){}setPixelRatio(){}
 setSize(w,h){this.sizes.push([w,h])}render(scene){const avatar=scene.children.at(-1);this.lastAngle=avatar.rotation.y;avatar.matrixWorld.rotationY=avatar.rotation.y}dispose(){this.disposed=true}
}
globalThis.devicePixelRatio=2;globalThis.matchMedia=()=>({matches:false});
globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
const loaded=[];
const bindings={Group,Mesh,BufferGeometry:Geometry,BufferAttribute:Attribute,MeshStandardMaterial:Material,CanvasTexture:Texture,Scene:Group,PerspectiveCamera:Camera,WebGLRenderer:Renderer,DirectionalLight:Light,HemisphereLight:Light,AmbientLight:Light,Vector3,loadTexture:path=>{loaded.push(path);return{image:{width:1024},dispose(){this.disposed=true}}}};
const system=createMorganModelSystem(bindings);assert.equal(await system.ready,true);assert.equal(system.isReady,true);
const first=system.createModel(),second=system.createModel();
assert.equal(first.children.length,1,'Both likeness faces and the shallow layers share one draw.');
assert.equal(first.children[0].material.map,first.children[0].material.emissiveMap,'Both sides retain the identical likeness texture.');
const extents={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
for(const [i,mesh]of first.children.entries()){
 const g=mesh.geometry;assert.equal(g,second.children[i].geometry,'Instances share immutable GPU geometry.');
 assert.equal(mesh.material,second.children[i].material);
 for(const key of ['position','normal','uv'])assert.ok([...g.attributes[key].array].every(Number.isFinite),key+' contains only finite values.');
 assert.ok(g.index.array.every(n=>Number.isInteger(n)&&n>=0&&n<g.attributes.position.count),'Every triangle references a valid vertex.');
 for(let j=0;j<g.attributes.position.array.length;j++){const axis=j%3,v=g.attributes.position.array[j];extents.min[axis]=Math.min(extents.min[axis],v);extents.max[axis]=Math.max(extents.max[axis],v)}
}
assert.ok(extents.max[2]-extents.min[2]>.04&&extents.max[2]-extents.min[2]<.08,'The photographic figure has shallow depth without modeled sides.');
assert.ok(extents.min[1]>-.07&&extents.min[1]<=0,'Transparent image margin sits just below the visible boot soles.');
assert.ok(extents.max[1]>2.45&&extents.max[1]<2.55,'Height remains within the scene placement bounds.');
assert.ok(system.mouth[1]>2.1&&system.mouth[1]<extents.max[1]);
assert.ok(system.chest[1]<system.mouth[1]&&system.chest[1]>1.9,'The connector starts at the upper sternum, below the face.');
assert.ok(Math.abs(system.chest[0]/(2.5/1480)+510-550)<1e-8,'Chest anchor matches the source portrait’s sternum pixel.');
assert.ok(Math.abs(1500-system.chest[1]/(2.5/1480)-350)<1e-8);
assert.ok(loaded[0].endsWith('/morgan.webp'));
system.disposeModel(first);assert.ok(!second.children[0].geometry.disposed,'Removing one avatar cannot destroy another shared instance.');
const rect={left:0,top:0,width:104,height:156};let copies=0;
const canvas={isConnected:true,clientWidth:104,clientHeight:156,getBoundingClientRect:()=>rect,getContext:()=>({clearRect(){},drawImage(){copies++}})};
assert.equal(system.renderAvatar(canvas,0),true);
const frontChest={...canvas.__morganChest},frontMouth={...canvas.__morganMouth};
assert.ok(frontChest.y>frontMouth.y,'Rendered connector originates below Morgan’s mouth.');
assert.ok(frontChest.x>rect.left+rect.width/2);
assert.equal(system.renderAvatar(canvas,Math.PI),true);
assert.ok(canvas.__morganChest.x<rect.left+rect.width/2,'Chest projection follows the rotating avatar instead of staying fixed in its box.');
const backChest={...canvas.__morganChest};
rect.left+=29;rect.top+=17;system.renderAvatar(canvas,Math.PI);
assert.ok(Math.abs(canvas.__morganChest.x-backChest.x-29)<1e-8);assert.ok(Math.abs(canvas.__morganChest.y-backChest.y-17)<1e-8,'Flight/layout translation updates the sternum in screen coordinates.');
assert.equal(renderers.length,1,'Home, controls and flight reuse one small renderer.');assert.equal(renderers[0].lastAngle,Math.PI);
rect.width=72;rect.height=108;system.renderAvatar(canvas,1);
assert.equal(renderers[0].sizes.length,1,'Animating CSS flight scale does not repeatedly reallocate the GPU buffer.');
assert.deepEqual(renderers[0].sizes[0],[208,312]);assert.equal(copies,4);
system.dispose();assert.equal(system.isReady,false);assert.equal(system.renderAvatar(canvas),false);assert.ok(renderers[0].disposed);
globalThis.matchMedia=()=>({matches:true});const mobile=createMorganModelSystem(bindings);await mobile.ready;
assert.ok(loaded.at(-1).endsWith('/morgan-mobile.webp'),'Mobile uses the smaller portrait texture.');mobile.dispose();
console.log('Morgan model checks passed:',JSON.stringify(system.stats));
