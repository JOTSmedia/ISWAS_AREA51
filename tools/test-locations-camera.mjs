import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/lodge-canvas-v17-17.js',import.meta.url),'utf8');
const start=source.indexOf('function clampGlobeZoom(');
assert.ok(start>=0,'Locations uses a dedicated framing helper');
const {frame,visit,clamp,damp}=new Function(source.slice(start,source.indexOf('function Oy(){',start))+';return {frame:frameLocationsCamera,visit:frameGlobeVisitCamera,clamp:clampGlobeZoom,damp:dampGlobeZoom}')();
const vector=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})}});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,`${message}: ${a} != ${b}`);
const cameraMock=()=>({fov:42,updates:0,view:null,setViewOffset(fullWidth,fullHeight,offsetX,offsetY,width,height){this.updates++;this.view={enabled:true,fullWidth,fullHeight,offsetX,offsetY,width,height}},clearViewOffset(){this.updates++;this.view.enabled=false},updateProjectionMatrix(){this.updates++}});
const subtract=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const norm=a=>{const length=Math.hypot(a.x,a.y,a.z);return{x:a.x/length,y:a.y/length,z:a.z/length}};
// Sample the actual perspective tangent silhouette, rather than a flat disc at
// the globe center. The pin envelope includes the largest selected pin scale.
function projectedBounds(camera,width,height,position,center,radius){
 const forward=norm(subtract(center,position)),right=norm(cross(forward,{x:0,y:1,z:0})),up=cross(right,forward);
 const distance=Math.hypot(...Object.values(subtract(center,position)));
 const tangentDepth=(distance*distance-radius*radius)/distance;
 const tangentRadius=radius*Math.sqrt(1-radius*radius/(distance*distance));
 const focal=height/(2*Math.tan(camera.fov*Math.PI/360));
 const cx=width/2-(camera.view?.enabled?camera.view.offsetX:0),cy=height/2-(camera.view?.enabled?camera.view.offsetY:0);
 const bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(let i=0;i<360;i++){
  const angle=i*Math.PI/180,point={};
  for(const axis of ['x','y','z'])point[axis]=position[axis]+forward[axis]*tangentDepth+tangentRadius*(right[axis]*Math.cos(angle)+up[axis]*Math.sin(angle));
  near(Math.hypot(...Object.values(subtract(point,center))),radius,'Sample lies on sphere');
  const relative=subtract(point,position),depth=dot(relative,forward);
  const x=cx+focal*dot(relative,right)/depth,y=cy-focal*dot(relative,up)/depth;
  bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);
 }
 return bounds;
}
const sphereRadius=1.05,pinEnvelope=1.27;
function checkFraming(camera,width,height,viewport,desired,target,scaleWidth,scaleHeight,zoom=1.18,elevation=1.49){
 if(camera.view?.enabled&&width<768)viewport={...viewport,height:viewport.height-Math.min(52,viewport.height*.3)};
 const distance=Math.hypot(desired.x-target.x,desired.y-target.y,desired.z-target.z);
 const pixelsPerUnit=height/(2*Math.tan(camera.fov*Math.PI/360))/distance;
 near(target.x,21.5,'Camera targets the globe horizontally');near(target.y,elevation,'Camera targets the actual eased globe center vertically');near(target.z,1.5,'Camera targets the globe depth');
 near(distance,7.5,'All layouts keep the same safe camera distance');
 near(pixelsPerUnit,Math.min(viewport.width/scaleWidth,viewport.height/scaleHeight)*zoom,'Dynamic field of view preserves the requested scale');
 assert.ok(desired.y<=4.4&&desired.y>3,'Framed camera stays below ceiling details and above the table');
 assert.ok(desired.z<8.1,'Framed camera stays inside the room in front of the rear wall');
 for(const radius of [sphereRadius,pinEnvelope]){
  const bounds=projectedBounds(camera,width,height,desired,target,radius);
  const fringe=radius===pinEnvelope?.015:0;
  assert.ok(bounds.left>viewport.left-viewport.width*fringe&&bounds.right<viewport.left+viewport.width*(1+fringe),'Visible sphere fits horizontally; selected-pin tips may occupy a narrow fringe');
  assert.ok(bounds.top>viewport.top-viewport.height*fringe&&bounds.bottom<viewport.top+viewport.height*(1+fringe),'Visible sphere fits vertically; selected-pin tips may occupy a narrow fringe');
  const diameter=2*radius/Math.sqrt(1-(radius/distance)**2)*pixelsPerUnit;
  near(bounds.right-bounds.left,diameter,'Sampled silhouette agrees with perspective tangent diameter');
  near((bounds.left+bounds.right)/2,viewport.left+viewport.width/2,'Globe is centered in the visible pane');
  near((bounds.top+bounds.bottom)/2,viewport.top+viewport.height/2,'Globe is centered vertically');
 }
}
for(const [width,height,viewport] of [
 [1440,900,{left:740,top:110,width:660,height:710}],
 [1024,768,{left:540,top:100,width:460,height:620}],
 [390,844,{left:10,top:100,width:370,height:260}],
 [320,568,{left:8,top:84,width:304,height:180}],
 [844,390,{left:430,top:30,width:400,height:330}],
]){
 const camera=cameraMock(),desired=vector(),target=vector();
 assert.equal(frame(camera,viewport,width,height,desired,target),true);
 near(camera.view.fullWidth/camera.view.fullHeight,width/height,'Full canvas aspect is preserved');
 checkFraming(camera,width,height,viewport,desired,target,3.2,3.2);
 for(const elevation of [1.49,1.8,2.3,2.75,3,3.05]){
  frame(camera,viewport,width,height,desired,target,1.18,elevation);
  checkFraming(camera,width,height,viewport,desired,target,3.2,3.2,1.18,elevation);
 }
 const updates=camera.updates;
 for(let i=0;i<120;i++)frame(camera,viewport,width,height,desired,target);
 assert.equal(camera.updates,updates,'Stationary frames do not rebuild the projection matrix');
 for(const invalid of [null,{width:0,height:1},{width:1,height:NaN},{width:-1,height:2}])assert.equal(frame(camera,invalid,width,height,desired,target),false);
 assert.equal(camera.view.enabled,false,'Leaving locations restores the normal projection');
 assert.equal(camera.updates,updates+1,'Projection is restored only once');
}
for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,568],[320,480],[390,640],[844,390]]){
 const camera=cameraMock(),desired=vector(),target=vector();
 // Match the production ordering when changing from Locations to a 360 visit.
 frame(camera,{left:10,top:80,width:width-20,height:height-160},width,height,desired,target);
 visit(camera,width,height,desired,target);
 const shortPhone=width<768&&height<=640&&height>=width;
 assert.equal(camera.view.enabled,shortPhone,'360 focus clears the old companion offset or replaces it with a short-phone safe area');
 if(!shortPhone)checkFraming(camera,width,height,{left:0,top:0,width,height},desired,target,3.6,3.6);
 for(const elevation of [1.49,1.8,2.3,2.75,3,3.05]){
  visit(camera,width,height,desired,target,1.18,elevation);
  if(!shortPhone)checkFraming(camera,width,height,{left:0,top:0,width,height},desired,target,3.6,3.6,1.18,elevation);
  else{
   near(target.y,elevation,'Short-phone focus follows rising globe');
   const safeBounds=projectedBounds(camera,width,height,desired,target,pinEnvelope);
   assert.ok(safeBounds.top>=180-1e-8&&safeBounds.bottom<=height-92,'Full needle heads clear the short-phone zoom bar and footer controls');
  }
 }
 const bounds=projectedBounds(camera,width,height,desired,target,pinEnvelope);
 assert.ok(bounds.left>=width*.075&&bounds.right<=width*.925,'360 selected-pin envelope leaves horizontal edge controls room');
 assert.ok(bounds.top>=height*.075&&bounds.bottom<=height*.925,'360 selected-pin envelope leaves vertical control margins');
 const updates=camera.updates;
 for(let i=0;i<120;i++)visit(camera,width,height,desired,target)
 assert.equal(camera.updates,updates,'Stationary 360 focus does not rebuild the projection');
}
const oy=source.slice(source.indexOf('function Oy(){'),source.indexOf('function ky(){'));
assert.match(oy,/!window\.__locationsViewport&&!window\.__globeVisit&&t instanceof xu&&t\.fov!==/,'Standard 360 FOV does not fight globe focus');
assert.match(oy,/let idle=tourSceneReady\(\)&&\(!window\.__locationsViewport\|\|e===`\/locations`\)/,'Locations framing permits the automatic tour timer');
assert.match(oy,/r=r=>\{if\(window\.__locationsViewport\|\|r\.button/,'Room dragging cannot fight the globe');
assert.match(oy,/r=n=>\{if\(window\.__locationsViewport\|\|!e\(\)/,'Wheel scrolling does not move the room during locations');
// Zoom endpoints use optics only: the camera never approaches the globe/table.
for(const [requested,expected] of [[-4,.8],[.8,.8],[1.18,1.18],[2.4,2.4],[99,2.4],[NaN,1.18],[Infinity,1.18],[undefined,1.18]]){
 near(clamp(requested),expected,'Invalid and excessive zoom is bounded');
 for(const mode of ['locations','visit']){
  const camera=cameraMock(),desired=vector(),target=vector();
  const viewport={left:740,top:110,width:660,height:710};
  const size=mode==='locations'?viewport:{width:1440,height:900};
  if(mode==='locations')frame(camera,viewport,1440,900,desired,target,requested);else visit(camera,1440,900,desired,target,requested);
  near(Math.hypot(desired.x-target.x,desired.y-target.y,desired.z-target.z),7.5,'Every user zoom keeps camera safely fixed');
  const scale=900/(2*Math.tan(camera.fov*Math.PI/360))/7.5;
  near(scale,Math.min(size.width/(mode==='locations'?3.2:3.6),size.height/(mode==='locations'?3.2:3.6))*expected,'Requested optical zoom reaches exact scale');
  if(expected===2.4){const bounds=projectedBounds(camera,1440,900,desired,target,sphereRadius);assert.ok(bounds.right-bounds.left>size.width||bounds.bottom-bounds.top>size.height,'Deep zoom intentionally crops the globe so individual pins separate');}
 }
}
for(const fps of [30,60,120]){
 let value=.8;
 for(let tick=0;tick<fps;tick++)value=damp(value,2.4,1/fps,false);
 near(value,2.4,'Zoom settles identically across common refresh rates');
 assert.equal(damp(value,2.4,1/fps,false),value,'Settled zoom stops projection updates');
}
near(damp(.8,2.4,2,false),damp(.8,2.4,.05,false),'A stalled frame has a bounded zoom step');
assert.equal(damp(.8,2.4,0,false),.8,'Zero time cannot move zoom');
assert.equal(damp(.8,2.4,NaN,false),.8,'Invalid time cannot corrupt zoom');
assert.equal(damp(.8,2.4,1/60,true),2.4,'Reduced motion changes zoom immediately');
const stationary=cameraMock(),position=vector(),aim=vector(),pane={left:740,top:110,width:660,height:710};
let eased=.8;
for(let tick=0;tick<120;tick++){eased=damp(eased,2.4,1/60);frame(stationary,pane,1440,900,position,aim,eased)}
const settledUpdates=stationary.updates;
for(let tick=0;tick<120;tick++){eased=damp(eased,2.4,1/60);frame(stationary,pane,1440,900,position,aim,eased)}
assert.equal(stationary.updates,settledUpdates,'Projection matrices stop rebuilding after zoom settles');
assert.match(oy,/zoomActive!==zoomFocus\.current/,'Zoom controls visibility changes only on focus transitions');
assert.match(oy,/dampGlobeZoom\(zoom\.current,window\.__globeZoom,f,i\)/,'Production zoom respects bounded frame time and reduced motion');
assert.match(oy,/frameGlobeVisitCamera\(t,window\.innerWidth,window\.innerHeight,w,T,zoom\.current,liftHeight\)/,'360 uses the same user zoom');
assert.match(oy,/frameLocationsCamera\(t,window\.__locationsViewport,window\.innerWidth,window\.innerHeight,w,T,zoom\.current,liftHeight\)/,'Locations uses the same user zoom');
assert.doesNotMatch(oy,/window\.__globeZoom\s*=/,'Changing camera modes preserves the user-selected zoom');
assert.match(oy,/d\.current\.y\+=liftHeight-globeElevation\.current/,'A rising globe updates the optical aim without a second delayed ease');
assert.match(oy,/clearGlobeCamera\(t\.position,liftHeight\)/,'Travel clearance tracks the actual floating globe');
console.log('PASS: full sphere and needle-head framing throughout lift; bounded optical zoom; desktop/phone safe distance; deliberate deep-zoom crop; 30/60/120 FPS damping; reduced motion; settled projections; restoration and shared zoom state.');
