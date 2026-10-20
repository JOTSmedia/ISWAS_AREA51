import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/camera-clearance-v18-1.js',import.meta.url),'utf8');
const {clearGlobeCamera,globeClearanceHeight}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const safe=(p,elevation)=>{const radial=Math.hypot(p.x-21.5,p.z-1.5);assert.ok(Math.hypot(radial,p.y-elevation)>1.4,'Camera must clear sphere, pins and near plane');if(radial<2.7)assert.ok(p.y>2.7,'Camera must pass above the entire table');};
for(const elevation of [1.49,1.8,2.4,3,3.05])for(const [start,end] of [[[8,1.5,1.3],[36,1.45,1.2]],[[36,1.5,1.2],[8,1.5,1.3]],[[21.5,1.62,7],[21.5,1.62,-4]],[[16,1.62,-2.1],[27,1.62,4.9]],[[24.5,4.6,8.4],[11.2,1.5,1.3]]]){
 const p={x:start[0],y:start[1],z:start[2]};
 for(let frame=0;frame<360;frame++){
  const u=Math.min(1,frame/240),ease=u*u*(3-2*u),desired={x:start[0]+(end[0]-start[0])*ease,y:start[1]+(end[1]-start[1])*ease,z:start[2]+(end[2]-start[2])*ease};
  clearGlobeCamera(desired,elevation);for(const key of ['x','y','z'])p[key]+=(desired[key]-p[key])*(1-Math.exp(-1.5/60));clearGlobeCamera(p,elevation);safe(p,elevation);
 }
}
assert.equal(globeClearanceHeight(21.5,1.5),4.1);
assert.equal(globeClearanceHeight(21.5,1.5,3),4.65);
assert.equal(globeClearanceHeight(21.5,1.5,NaN),4.1);
assert.ok(globeClearanceHeight(21.5,1.5,99)<=4.7,'Invalid elevation cannot lift the camera through the ceiling');
for(const p of [{x:0,y:1.45,z:1.3},{x:21.5,y:6.4,z:1.5},{x:40,y:1.42,z:1.3}]){const before={...p};assert.equal(clearGlobeCamera(p),0);assert.deepEqual(p,before);}
for(const elevation of [1.49,3])for(const boundary of [2.8,6.2]){const left=globeClearanceHeight(21.5+boundary-.001,1.5,elevation),right=globeClearanceHeight(21.5+boundary+.001,1.5,elevation);assert.ok(Math.abs(left-right)<1e-7,'Entry and exit slopes stay smooth');}
console.log('PASS: forward, reverse, depth, diagonal and tour camera paths clear the resting and hovering globe, needle pins and table; unaffected views remain unchanged.');
