import fs from 'node:fs';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
const source=fs.readFileSync(new URL('../assets/black-lodge-scene-v17-11.js',import.meta.url),'utf8');
const {createBlackLodge}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const made=[];
class Geometry{constructor(...args){this.args=args;made.push(this)}}
class Cylinder extends Geometry{}
class Lathe extends Geometry{}
class Circle extends Geometry{}
class Material{constructor(props){Object.assign(this,props)}}
class Vector{constructor(...args){this.args=args}}
const jsx=(type,props)=>({type,props});
globalThis.matchMedia=()=>({matches:false});
Object.defineProperty(globalThis,'navigator',{value:{connection:{}},configurable:true});
const api=createBlackLodge({React:{useMemo:fn=>fn()},jsx:{jsx,jsxs:jsx},CylinderGeometry:Cylinder,LatheGeometry:Lathe,CircleGeometry:Circle,MeshStandardMaterial:Material,Vector2:Vector,loadTexture:()=>({repeat:{set(){}}})});
const {LodgeLamp,LibrarySetting,LoungeSetting}=api;
const fixtures=[...LibrarySetting().props.children,...LoungeSetting().props.children].filter(node=>node.type===LodgeLamp);
assert.equal(fixtures.length,4,'Library and globe lounge keep their four matching torchieres.');
assert.deepEqual(fixtures.map(node=>node.props.position),[[-1.05,0,-2.4],[3.05,0,-3.6],[18.9,0,-2.4],[18.7,0,5.6]],'Right library lamp clears the mirror; the other three keep their established positions.');
const first=LodgeLamp(fixtures[0].props),second=LodgeLamp(fixtures[1].props);
assert.equal(first.props.children.length,6,'Five solid lamp components and one existing light.');
assert.equal(made.length,5,'Every torchiere shares one bounded set of five geometries.');
const meshes=first.props.children.filter(node=>node.type==='mesh');
assert.ok(meshes[3].props.geometry instanceof Lathe,'The shade uses the Black Lodge upward flared bowl.');
assert.deepEqual(meshes[3].props.geometry.args[0].map(p=>p.args),[[.055,0],[.075,.1],[.1,.2],[.19,.36],[.32,.47],[.34,.49]]);
assert.equal(meshes[3].props.material.color,'#51473e');
assert.equal(meshes[2].props.material.color,'#7a6b5c');
assert.equal(meshes[4].props.material.emissiveIntensity,.35);
for(let i=0;i<5;i++){
 assert.equal(first.props.children[i].props.geometry,second.props.children[i].props.geometry,'Geometry is shared between fixtures.');
 assert.equal(first.props.children[i].props.material,second.props.children[i].props.material,'Material is shared between fixtures.');
 assert.equal(first.props.children[i].props.dispose,null,'One fixture cannot dispose a shared resource.');
}
assert.deepEqual(first.props.children.at(-1).props,{position:[0,2.85,0],color:'#ccb999',intensity:2.8,distance:5,decay:2});
const bundle=fs.readFileSync(new URL('../assets/lodge-canvas-v17-11.js',import.meta.url),'utf8');
const begin=bundle.indexOf('function rb({position:e}){'),end=bundle.indexOf(' function ib(',begin);
assert.ok(begin>=0&&end>begin);
const sandbox={$:{jsx},LodgeLamp};
runInNewContext(bundle.slice(begin,end)+';globalThis.oldLamp=rb;',sandbox);
for(const position of [[8,0,7.7],[36,0,7.7]]){
 const node=sandbox.oldLamp({position});
 assert.equal(node.type,LodgeLamp,'The legacy fabric lamp resolves to the same shared torchiere.');
 assert.deepEqual(Array.from(node.props.position),position);
 const lamp=LodgeLamp(node.props),lights=lamp.props.children.filter(child=>child.type==='pointLight');
 assert.equal(lights.length,1,'A replacement does not introduce an extra light.');
 assert.equal(lights[0].props.intensity,2.4);assert.equal(lights[0].props.distance,6.5);assert.equal(lights[0].props.color,'#f6e2b8');
 assert.deepEqual(Array.from(lights[0].props.position),[0,1.55,0],'Existing gallery illumination is preserved.');
}
assert.equal((bundle.match(/\(0,\$\.jsx\)\(rb,\{position:/g)||[]).length,2,'Both legacy placements remain mounted.');
assert.equal(made.length,5,'Rendering all six fixtures does not allocate another shape set.');
console.log('PASS: six shared Black Lodge torchieres, exact flared profile/materials, preserved placement/light count, mirror clearance and shared resource safety.');
