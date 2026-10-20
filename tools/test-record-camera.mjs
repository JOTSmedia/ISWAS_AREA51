import assert from 'node:assert/strict';
import {frameRecordCamera,recordViewport} from '../assets/record-camera-v17-17.js';
let active=true,arrivals=0;
globalThis.document={documentElement:{classList:{contains:()=>active}}};
globalThis.window={dispatchEvent:()=>arrivals++};
const camera={userData:{},position:{x:40,y:2,z:4},aspect:1,setViewOffset(w,h){this.aspect=w/h;this.view=true},clearViewOffset(){this.view=false},updateProjectionMatrix(){},lookAt(){}};
const aim={x:40,y:2,z:-5};
for(const [w,h] of [[1512,789],[390,844],[320,720],[844,390]]){
 globalThis.innerWidth=w;globalThis.innerHeight=h;
 for(let n=0;n<300;n++)assert.equal(frameRecordCamera(camera,aim,1/60),true);
 const box=recordViewport(w,h);assert.equal(camera.aspect,box.width/box.height);
 // Simulate the renderer's resize update arriving after our own frame.
 camera.aspect=w/h;frameRecordCamera(camera,aim,1/60);assert.equal(camera.aspect,box.width/box.height);
 // Project every flight location into the unobscured area, with the actual camera basis.
 const {recordFlightPose}=await import('../assets/record-catalogue-v17-17.js');
 const pos=camera.position,dy=aim.y-pos.y,dz=aim.z-pos.z,len=Math.hypot(dy,dz),fy=dy/len,fz=dz/len;
 for(let rank=1;rank<=100;rank++)for(let t=0;t<=1;t+=.05){
  const [x,y,z]=recordFlightPose(rank,t).position,ry=y-pos.y,rz=z-pos.z,depth=ry*fy+rz*fz;
  const halfH=depth*Math.tan(camera.fov*Math.PI/360),px=(x-pos.x)/(halfH*camera.aspect),py=(ry*fz-rz*fy)/halfH;
  assert.ok(Math.abs(px)<.95&&Math.abs(py)<.95,`${w}x${h} record ${rank} at ${t}: ${px},${py}`);
 }
}
assert.ok(arrivals);active=false;assert.equal(frameRecordCamera(camera,aim,.016),false);assert.equal(camera.view,false);assert.equal(camera.aspect,innerWidth/innerHeight);assert.equal(window.__recordCameraReady,false);
console.log('PASS: all 100 record flights remain in the clear desktop/mobile viewport; resize recovery and close restoration');
