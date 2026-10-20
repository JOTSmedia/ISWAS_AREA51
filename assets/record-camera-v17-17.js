// Reserve a real, unobscured part of the existing scene, without another renderer.
export function recordViewport(width,height){
 const mobile=width<=700;
 return mobile?{x:0,y:0,width,height:height*.43}:{x:0,y:0,width:width*.56,height};
}
export function frameRecordCamera(camera,aim,dt){
 const active=document.documentElement.classList.contains('record-viewing');
 if(!active){
  if(camera.userData.recordView){camera.clearViewOffset();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();delete camera.userData.recordView;window.__recordCameraReady=false}
  return false;
 }
 const box=recordViewport(innerWidth,innerHeight),mobile=innerWidth<=700;
 const key=innerWidth+':'+innerHeight;
 if(camera.userData.recordView!==key||Math.abs(camera.aspect-box.width/box.height)>.001){
  camera.fov=mobile?55:48;
  camera.setViewOffset(box.width,box.height,-box.x,-box.y,innerWidth,innerHeight);
  camera.userData.recordView=key;
 }
 // Both the entire sleeve wall and the platter sit inside the reserved viewport.
 const close=!!window.__recordCloseup,target=close?[-2.65,1.35,6.35]:[-2.65,1.85,6.95],distance=close?(mobile?3.1:3.6):(mobile?Math.max(5.5,3.5/(box.width/box.height)):5.5);
 const position=[-2.65,close?2.6:2.9,target[2]-distance],alpha=1-Math.exp(-Math.min(dt,.05)*5);
 camera.position.x+=(position[0]-camera.position.x)*alpha;
 camera.position.y+=(position[1]-camera.position.y)*alpha;
 camera.position.z+=(position[2]-camera.position.z)*alpha;
 aim.x+=(target[0]-aim.x)*alpha;aim.y+=(target[1]-aim.y)*alpha;aim.z+=(target[2]-aim.z)*alpha;
 camera.lookAt(aim);
 const arrived=Math.hypot(camera.position.x-position[0],camera.position.y-position[1],camera.position.z-position[2],aim.x-target[0],aim.y-target[1],aim.z-target[2])<.08;
 if(arrived&&!window.__recordCameraReady){window.__recordCameraReady=true;window.dispatchEvent(new Event('record-camera-ready'))}
 return true;
}
