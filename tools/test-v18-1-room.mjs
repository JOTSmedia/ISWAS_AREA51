import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {TV_VIDEO_PATH,TV_LAYOUT,televisionVisible} from '../assets/vintage-television-v18-1.js';
import {ROOM_ADDITIONS,ROOM_RUGS,CIGAR_SEATING,cigarChairYaw,BAR_PATRON} from '../assets/hospitality-room-v18-1.js';
assert.ok(TV_VIDEO_PATH.endsWith('/media/ring-tape-v18-1.mp4'));assert.ok(Math.abs(TV_LAYOUT.width/TV_LAYOUT.height-4/3)<1e-12);
assert.equal(TV_LAYOUT.position[0],ROOM_ADDITIONS.cigars.position[0]);
// Both chairs face the actual TV image, remain on the rug, and leave the
// coffee table and console footprints clear (oriented polygon separation).
function rectangle(x,z,w,d,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[x+c*a*w/2+s*b*d/2,z-s*a*w/2+c*b*d/2])}
function overlaps(a,b){
 for(const poly of [a,b])for(let i=0;i<4;i++){
  const p=poly[i],q=poly[(i+1)%4],axis=[-(q[1]-p[1]),q[0]-p[0]];
  const ranges=[a,b].map(points=>points.map(p=>p[0]*axis[0]+p[1]*axis[1]));
  if(Math.max(...ranges[0])<Math.min(...ranges[1])||Math.max(...ranges[1])<Math.min(...ranges[0]))return false;
 }return true;
}
const table=rectangle(40.8,6.6-CIGAR_SEATING.table[2],1.3,.84,0),consoleBox=rectangle(TV_LAYOUT.position[0],TV_LAYOUT.position[2],1.68,.52,0);
for(const chair of CIGAR_SEATING.chairs){
 const yaw=cigarChairYaw(chair.x,chair.z),x=40.8-chair.x,z=6.6-chair.z;
 const target=[TV_LAYOUT.position[0]-TV_LAYOUT.screen[0]-x,TV_LAYOUT.position[2]-TV_LAYOUT.screen[2]-z];
 const length=Math.hypot(...target);assert.ok(length>3.5,'Both seats are now at least 3.5m from the TV');const front=[-Math.sin(yaw),-Math.cos(yaw)];
 assert.ok((front[0]*target[0]+front[1]*target[1])/length>.999999,'Every chair points directly at the TV screen');
 const footprint=rectangle(x,z,1.13,1.02,Math.PI+yaw);
 assert.ok(footprint.every(([x,z])=>x>38.45&&x<43.15&&z>2.7&&z<7.5),'Both chairs remain on the cigar rug');
 assert.equal(overlaps(footprint,table),false,'Coffee table stays clear of the turned chairs');
 assert.equal(overlaps(footprint,consoleBox),false,'TV stays clear of the turned chairs');
}
assert.ok(TV_LAYOUT.position[2]+.26<ROOM_ADDITIONS.cigars.position[2]+1.45-.23);
assert.deepEqual(ROOM_RUGS.bar.position,[34,.028,5.45]);
const normal={front:true,near:true,area:500,left:-.1,right:.1,top:.1,bottom:-.1,hidden:false,blocked:false};
assert.equal(televisionVisible(normal),true);
for(const change of [{front:false},{near:false},{area:100},{left:1.1},{right:-1.1},{bottom:1.1},{top:-1.1},{hidden:true},{blocked:true}])assert.equal(televisionVisible({...normal,...change}),false);
const source=readFileSync(new URL('../assets/hospitality-room-v18-1.js',import.meta.url),'utf8');
assert.match(source,/THE GOLD ROOM/);assert.match(source,/Lloyd · Gold Room bartender/);assert.match(source,/prefers-reduced-motion/);assert.match(source,/document.hidden/);
assert.ok(statSync(new URL('../characters/jack-torrance/jack.webp',import.meta.url)).size<250000);
assert.ok(BAR_PATRON.position[0]>34.8&&BAR_PATRON.position[2]<6.13,'Jack occupies the guest side and leaves Lloyd visible');
assert.ok(Math.abs((34-BAR_PATRON.stoolX)-BAR_PATRON.position[0])<1e-10,'The occupied barstool aligns with Jack');
assert.ok(statSync(new URL('../characters/lloyd/lloyd.webp',import.meta.url)).size<180000);assert.ok(statSync(new URL('../characters/lloyd/lloyd-mobile.webp',import.meta.url)).size<60000);
console.log('PASS: distant TV-facing seats; rug containment; table/TV clearance; seated patron position and barstool; native 4:3 TV; bounded character assets; Gold Room and reduced-motion hooks.');
