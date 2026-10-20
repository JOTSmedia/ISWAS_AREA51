import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/black-lodge-scene-v17-8.js',import.meta.url),'utf8');
const {pickGlobePin,globePinVisible}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const center={x:0,y:0,z:0},origin={x:0,y:0,z:7.5},front={x:0,y:0,z:1.1},back={x:0,y:0,z:-1.1};
const normalize=v=>{const length=Math.hypot(v.x,v.y,v.z);return{x:v.x/length,y:v.y/length,z:v.z/length}};
const rayFor=(point,offset=0,fov=42,height=900)=>({origin,direction:normalize({x:point.x-origin.x+offset*(origin.z-point.z)*2*Math.tan(fov*Math.PI/360)/height,y:point.y-origin.y,z:point.z-origin.z})});
for(const [touch,baseFov,height] of [[false,42,900],[true,68,844],[true,75,568]])for(const zoom of [.8,1,1.18,1.6,2.4]){
 const fov=2*Math.atan(Math.tan(baseFov*Math.PI/360)/zoom)*180/Math.PI;
 const radius=touch?22:14;
 for(const offset of [0,radius*.5,radius*.95]){
  const hit=pickGlobePin(rayFor(front,offset,fov,height),[back,front],center,fov,height,touch);
  assert.equal(hit?.index,1,'A visible pin is selected throughout its enlarged halo; hidden matching pin cannot steal it');
  assert.ok(hit.distance>0&&hit.distance<6.4,'Halo intersection is ahead of the physical pin so the planet surface does not swallow nearby clicks');
 }
 assert.equal(pickGlobePin(rayFor(front,radius*1.2,fov,height),[front],center,fov,height,touch),null,'Clicks beyond the halo retain ordinary globe dragging');
 const neighbor={x:.06,y:0,z:Math.sqrt(1.1**2-.06**2)};
 assert.equal(pickGlobePin(rayFor(neighbor,0,fov,height),[front,neighbor],center,fov,height,touch)?.index,1,'Overlapping halos choose the closest visible pin center');
}
const limb={x:1.1,y:0,z:0},limbRay=rayFor(limb,-12),limbHit=pickGlobePin(limbRay,[limb],center,42,900);
assert.ok(limbHit,'The visible limb pin remains selectable where its halo overlaps the globe');
const sphereB=origin.z*limbRay.direction.z,surface=-sphereB-Math.sqrt(sphereB*sphereB-(origin.z**2-1.05**2));
assert.ok(limbHit.distance<surface,'The planet mesh cannot intercept a visible pin halo at the limb');
assert.equal(globePinVisible(origin,back,center),false,'The rear hemisphere is blocked by the globe');
assert.equal(globePinVisible(origin,front,center),true,'The front hemisphere remains selectable');
assert.equal(globePinVisible(origin,{x:1.1,y:0,z:0},center),true,'A visible elevated pin at the limb is not discarded by a hemisphere approximation');
const ray=rayFor(front);
assert.equal(pickGlobePin({...ray,origin:{x:0,y:0,z:20}},[front],center,42,900),null,'Distant globe cannot catch nearby room navigation');
assert.equal(pickGlobePin({origin,direction:{x:0,y:0,z:1}},[front],center,42,900),null,'Pins behind the camera never hit');
assert.equal(pickGlobePin(ray,[front],center,42,900,false,0,1),null,'Raycaster far distance is respected');
assert.ok(source.includes('raycast:raycastPins'),'The real instanced pin mesh uses the enlarged picking function');
assert.ok(source.includes('if(x<pane.left||x>pane.left+pane.width||y<pane.top||y>pane.top+pane.height)return'),'Case-panel clicks cannot hit a pin through the reserved globe pane');
assert.ok(source.includes("h('sphereGeometry',{args:[.032,8,6]})"),'Visible pin size is unchanged');
console.log('PASS: 28px mouse / 44px touch pin targets across the full .8–2.4× lens range, nearest visible pin selection, exact globe occlusion, visible limb pins, far/behind-camera guards, and unchanged pin dot geometry.');
