import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../assets/hospitality-room-v17-17.js',import.meta.url),'utf8');
const {ROOM_ADDITIONS:room,ROOM_RUGS:rugs,frameHospitalityReview}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const source=readFileSync(new URL('../assets/lodge-canvas-v17-17.js',import.meta.url),'utf8');
function bounds(r){
 const [w,d]=r.size,a=r.rotation[1],c=Math.cos(a),s=Math.sin(a),x=r.position[0],z=r.position[2];
 const corners=[-1,1].flatMap(i=>[-1,1].map(j=>[x+c*i*w/2+s*j*d/2,z-s*i*w/2+c*j*d/2]));
 return {minX:Math.min(...corners.map(c=>c[0])),maxX:Math.max(...corners.map(c=>c[0])),minZ:Math.min(...corners.map(c=>c[1])),maxZ:Math.max(...corners.map(c=>c[1]))};
}
const footprints=Object.values(rugs).map(bounds);
for(const b of footprints){assert.ok(b.minX>-5.7&&b.maxX<48.5&&b.minZ>-5.8&&b.maxZ<9,'Carpets stay clear of the perimeter shelving');}
for(let i=0;i<footprints.length;i++)for(let j=i+1;j<footprints.length;j++){
 const a=footprints[i],b=footprints[j];assert.ok(a.maxX<b.minX||b.maxX<a.minX||a.maxZ<b.minZ||b.maxZ<a.minZ,'Separate seating carpets do not overlap');
}
const [px,,pz]=room.piano.position,a=room.piano.yaw;
assert.ok(px>44&&pz>5,'The piano occupies the rear/east corner across from Akkad');
assert.equal(a,Math.PI/4);assert.equal(rugs.piano.rotation[1],a,'Piano and rug share one diagonal');
const bx=px+Math.sin(a)*room.piano.bench[2],bz=pz+Math.cos(a)*room.piano.bench[2];
assert.ok(Math.hypot(48.6-bx,9.1-bz)<Math.hypot(48.6-px,9.1-pz),'The player’s bench is on the corner side of the instrument');
assert.ok(bx<48.1&&bz<8.5,'There is space behind the bench');
assert.equal(rugs.bar.rotation[1],0,'The bar runner follows the straight counter');
assert.equal(rugs.cigars.rotation[1],Math.PI/2,'The long axis spans both cigar chairs');
for(const x of [34-2.35,34,34+2.35])assert.ok(x>bounds(rugs.bar).minX&&x<bounds(rugs.bar).maxX,'All three bar stools stand on the runner');
assert.ok(source.includes('position:[21.5,.03,1.5],rotation:[0,0,0]')&&source.includes('args:[7.2,6.4]'),'The approved globe carpet retains its exact position, orientation and dimensions');
assert.equal(frameHospitalityReview({}),false,'Authoring camera has no effect outside the local review page');
const provenance=JSON.parse(readFileSync(new URL('../textures/hospitality/PROVENANCE.json',import.meta.url)));
assert.deepEqual(provenance.native_resolution,[4096,4096]);assert.equal(provenance.upscaled,false);
console.log('PASS: diagonal piano and corner-side bench; all three carpets contained, separate and aligned with their furniture; bar stools on runner; globe rug unchanged; local-only review camera; native 4K map provenance.');
