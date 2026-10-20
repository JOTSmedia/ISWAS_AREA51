import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

// Exercise the production horn builder without importing the browser player.
const source=readFileSync(new URL('../assets/gramophone-scene-v18-1.js',import.meta.url),'utf8');
const isolated=source.replace(/^import .*;\n/gm,'');
const {gramophoneHornProfile:profile,gramophoneHornSurface:surface}=await import('data:text/javascript;base64,'+Buffer.from(isolated).toString('base64'));
assert.deepEqual(profile(-1),profile(0));assert.deepEqual(profile(2),profile(1));
assert.equal(profile(0).radius,.034);assert.ok(Math.abs(profile(1).radius-.44)<1e-12);assert.equal(profile(1).height,.68);
let last=profile(0);for(let i=1;i<=100;i++){const next=profile(i/100);assert.ok(next.radius>last.radius&&next.height>last.height,'The flare grows continuously from acoustic throat to bell');last=next}
for(const[radial,rows,budget]of [[56,24,6000],[88,36,14000]]){
 const mesh=surface(radial,rows),stride=radial+1,layer=(rows+1)*stride;
 assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.uv.every(Number.isFinite));
 assert.equal(mesh.positions.length/3,layer*2);assert.ok(mesh.indices.length/3<budget,'The complete two-sided bell has a bounded device-specific triangle count');
 assert.ok(mesh.indices.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.positions.length/3));
 const point=index=>mesh.positions.slice(index*3,index*3+3);
 const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(let i=0;i<mesh.indices.length;i+=3){
  const[a,b,c]=mesh.indices.slice(i,i+3).map(point),n=cross(subtract(b,a),subtract(c,a));
  assert.ok(Math.hypot(...n)>1e-10,'No collapsed triangles can break normals or lighting');
 }
 for(let row=0;row<=rows;row++)for(let col=0;col<=radial;col++){
  const outer=point(row*stride+col),inner=point(layer+row*stride+col);
  assert.ok(Math.abs(Math.hypot(outer[0],outer[2])-Math.hypot(inner[0],inner[2])-.0018)<1e-12,'The brass is a real 1.8mm thin shell');
 }
 for(let row=0;row<=rows;row++){
  const a=point(row*stride),b=point(row*stride+radial);
  assert.ok(Math.hypot(...subtract(a,b))<1e-12,'The horn closes around its radial seam');
 }
 const outerStart=mesh.indices.slice(0,3).map(point),n=cross(subtract(outerStart[1],outerStart[0]),subtract(outerStart[2],outerStart[0]));
 assert.ok(n[0]>0,'Outer normals face away from the horn');
}
const provenance=JSON.parse(readFileSync(new URL('../textures/gramophone/PROVENANCE.json',import.meta.url)));
assert.deepEqual(provenance.native_resolution,[4096,4096]);assert.equal(provenance.upscaled,false);
for(const tier of [1024,2048,4096]){
 let bytes=0;for(const name of ['aged-brass','brass-roughness'])bytes+=statSync(new URL(`../textures/gramophone/${name}-${tier}.webp`,import.meta.url)).size;
 assert.ok(bytes<(tier===1024?50000:tier===2048?110000:300000),'Physical surface maps stay within the appropriate delivery budget');
}
console.log('PASS: continuous flared acoustic horn; real 1.8mm inner/outer shell; closed seams; finite noncollapsed triangles and outward normals; bounded mobile/desktop polygon budgets; native4096px provenance and small device-tier maps.');
