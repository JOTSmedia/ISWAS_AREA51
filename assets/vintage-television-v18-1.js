// The supplied local tape is rendered on the console's physical screen by the
// gallery's WebGL renderer. No iframe, separate scene, or floating video layer.
export const TV_VIDEO_PATH=new URL('../media/ring-tape-v18-1.mp4',import.meta.url).href;
export const TV_LAYOUT=Object.freeze({position:Object.freeze([40.8,0,7.48]),screen:Object.freeze([-.14,1.24,.353]),width:1.02,height:.765});
export function televisionVisible({front,near,area,left,right,top,bottom,hidden,blocked}){
 return !hidden&&!blocked&&front&&near&&area>400&&left<1.05&&right> -1.05&&bottom<1.05&&top> -1.05;
}
export function frameTelevisionCamera(camera,aim,dt){
 if(!window.__vintageTVActive)return false;
 const target=[TV_LAYOUT.position[0]-TV_LAYOUT.screen[0],TV_LAYOUT.screen[1],TV_LAYOUT.position[2]-TV_LAYOUT.screen[2]];
 const reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion:reduce)').matches;
 const alpha=reduced?1:1-Math.exp(-Math.min(dt,.05)*5);
 const position=[target[0],1.52,target[2]-2.35];
 camera.position.x+=(position[0]-camera.position.x)*alpha;
 camera.position.y+=(position[1]-camera.position.y)*alpha;
 camera.position.z+=(position[2]-camera.position.z)*alpha;
 aim.x+=(target[0]-aim.x)*alpha;aim.y+=(target[1]-aim.y)*alpha;aim.z+=(target[2]-aim.z)*alpha;
 camera.lookAt(aim);return true;
}

// Kept separate from React so media lifetime and every control can be tested
// without mounting or starting the gallery. Creation never assigns a source.
export function createTelevisionSurface(){
 const video=document.createElement('video');video.className='vintage-tv-media';
 video.preload='none';video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.volume=.45;
 video.width=640;video.height=480;video.tabIndex=-1;
 video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');
 const button=document.createElement('button');button.type='button';button.className='vintage-tv-access sr-only';button.hidden=true;
 button.textContent='WATCH THE TAPE WITH SOUND';button.setAttribute('aria-label','Watch The Ring tape on the vintage television with sound');
 const controls=document.createElement('section');controls.className='vintage-tv-controls';controls.hidden=true;
 controls.setAttribute('aria-label','Vintage television controls');
 const title=document.createElement('span');title.className='vintage-tv-title';title.textContent='THE RING · VHS TAPE';
 const status=document.createElement('span');status.className='vintage-tv-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const makeButton=(label,action)=>{const el=document.createElement('button');el.type='button';el.textContent=label;el.addEventListener('click',action);controls.append(el);return el};
 controls.append(title);
 const play=makeButton('PAUSE',()=>togglePlay()),mute=makeButton('MUTE',()=>toggleMute()),restart=makeButton('RESTART',()=>rewind()),power=makeButton('POWER OFF',()=>togglePower()),close=makeButton('CLOSE CONTROLS',()=>closeControls());
 controls.append(status);
 let visible=false,powered=false,focused=false,off=false,manualPause=false,suspended=false,disposed=false,connected=false,loaded=false,pending=false,attempt=0;
 const events=[];
 function listen(target,name,fn,capture=false){target.addEventListener(name,fn,capture);events.push(()=>target.removeEventListener(name,fn,capture))}
 function sync(){
  window.__vintageTVActive=focused&&powered&&visible;
  button.hidden=!visible;controls.hidden=!visible||!focused;
  play.textContent=video.paused?'PLAY':'PAUSE';play.disabled=!powered;
  mute.textContent=video.muted?'SOUND ON':'MUTE';mute.disabled=!powered;
  mute.setAttribute('aria-pressed',String(!video.muted));restart.disabled=!powered;
  power.textContent=powered?'POWER OFF':'POWER ON';power.setAttribute('aria-pressed',String(powered));
 }
 function silenceOthers(){
  for(const media of document.querySelectorAll('audio,video'))if(media!==video)media.pause();
  window.dispatchEvent(new CustomEvent('iswas:media-focus',{detail:{source:'vintage-television'}}));
 }
 function load(){
  if(loaded||disposed||!visible)return;
  loaded=true;video.src=TV_VIDEO_PATH;video.load();
 }
 function requestPlay(){
  if(disposed||!visible||!powered||manualPause||suspended||pending)return;
  load();pending=true;const token=++attempt;
  let result;try{result=video.play()}catch(error){result=Promise.reject(error)}
  Promise.resolve(result).then(()=>{
   if(disposed||!visible||!powered||manualPause||suspended)video.pause();
   if(token!==attempt)return;
   pending=false;
   status.textContent=video.paused?'PAUSED':video.muted?'PLAYING · SOUND OFF':'PLAYING';sync();
  }).catch(error=>{
   if(token!==attempt)return;
   pending=false;if(error?.name!=='AbortError')status.textContent='PRESS PLAY TO START THE TAPE';sync();
  });
 }
 function pause(){attempt++;pending=false;video.pause()}
 function stop(){
  pause();focused=false;video.muted=true;suspended=visible;
  status.textContent='PAUSED';sync();
 }
 function setVisible(value){
  if(disposed)return;
  const next=!!value;if(next===visible)return;
  visible=next;
  if(!visible){stop();suspended=false;button.hidden=true;return}
  powered=!off;video.muted=true;sync();requestPlay();
 }
 function start(){
  if(disposed||!visible)return false;
  window.__iswasTour?.pause('vintage-television');window.__v9Paused=true;
  powered=true;off=false;focused=true;suspended=false;manualPause=false;
  // Retry play within the user's gesture even if muted autoplay is pending.
  attempt++;pending=false;
  silenceOthers();video.muted=false;status.textContent='STARTING THE TAPE…';sync();requestPlay();
  play.focus({preventScroll:true});return true;
 }
 function togglePlay(){
  if(!visible||!powered)return;
  if(!video.paused){manualPause=true;pause();status.textContent='PAUSED'}
  else{manualPause=false;suspended=false;if(video.error)video.load();if(!video.muted)silenceOthers();requestPlay()}
  sync();
 }
 function toggleMute(){
  if(!visible||!powered)return;
  video.muted=!video.muted;if(!video.muted)silenceOthers();status.textContent=video.muted?'SOUND OFF':'SOUND ON';sync();
 }
 function rewind(){
  if(!visible||!powered)return;
  video.currentTime=0;manualPause=false;suspended=false;requestPlay();status.textContent='RESTARTING THE TAPE';sync();
 }
 function togglePower(){
  if(!visible)return;
  if(powered){powered=false;off=true;pause();video.muted=true;status.textContent='TV POWER OFF'}
  else{powered=true;off=false;manualPause=false;suspended=false;video.muted=true;status.textContent='TV POWER ON · SOUND OFF';requestPlay()}
  sync();
 }
 function closeControls(){focused=false;video.muted=true;status.textContent='SOUND OFF';sync();button.focus({preventScroll:true})}
 button.addEventListener('click',start);
 function connect(){
  if(connected)return;
  connected=true;disposed=false;
  for(const type of ['pagehide','gallery-waypoint','gallery-tour','gallery-nudge','gallery-direction','iswas:record-open','open-tome','iswas:lloyd-open'])listen(window,type,stop);
  listen(document,'visibilitychange',()=>{if(document.hidden)setVisible(false)});
  // Native audio opened elsewhere wins immediately; YouTube record playback
  // is covered by record-open and the gallery's dialog visibility.
  listen(document,'play',event=>{if(event.target!==video&&!event.target.muted)stop()},true);
  listen(window,'iswas:media-focus',event=>{if(event.detail?.source!=='vintage-television')stop()});
  listen(window,'keydown',event=>{if(event.key==='Escape'&&focused){event.preventDefault();closeControls()}});
  for(const type of ['play','pause','volumechange'])listen(video,type,sync);
  listen(video,'error',()=>{status.textContent='THE TAPE COULD NOT LOAD. PRESS PLAY TO RETRY.';sync()});
 }
 return {video,element:video,button,controls,buttons:{play,mute,restart,power,close},start,stop,setVisible,connect,
  get powered(){return powered},get focused(){return focused},get visible(){return visible},
  dispose(){if(disposed)return;stop();disposed=true;connected=false;visible=false;powered=false;loaded=false;off=false;manualPause=false;suspended=false;for(const remove of events)remove();events.length=0;video.removeAttribute('src');video.load();video.remove();button.remove();controls.remove()}};
}

export function createVintageTelevision({React:R,jsx:J,useFrame,useThree,Vector3,VideoTexture,SRGBColorSpace='srgb'}){
 const h=J.jsx;
 function VintageTelevision(){
  const {camera,size}=useThree();
  const surface=R.useMemo(createTelevisionSurface,[]);
  const texture=R.useRef(null),material=R.useRef(null),mesh=R.useRef(null);
  const point=R.useMemo(()=>new Vector3(TV_LAYOUT.position[0]-TV_LAYOUT.screen[0],TV_LAYOUT.screen[1],TV_LAYOUT.position[2]-TV_LAYOUT.screen[2]),[]);
  const scratch=R.useMemo(()=>({corner:new Vector3,view:new Vector3,powered:null,texture:null}),[]);
  R.useEffect(()=>{
   surface.connect();
   const map=new VideoTexture(surface.video);map.colorSpace=SRGBColorSpace;texture.current=map;
   if(!document.querySelector('link[data-vintage-television]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./vintage-television-v18-1.css',import.meta.url).href;link.dataset.vintageTelevision='';document.head.append(link);
   }
   document.body.append(surface.video,surface.button,surface.controls);
   return()=>{surface.dispose();texture.current=null;map.dispose();document.body.style.cursor=''};
  },[surface]);
  useFrame(()=>{
   const root=document.documentElement,review=root.dataset.roomReview,gallery=root.classList.contains('is-gallery');
   const distance=Math.hypot(camera.position.x-point.x,camera.position.z-point.z);
   // Distant rooms and startup never query dialogs or project the TV corners.
   if(document.hidden||(!gallery&&!review)||distance>=9||Math.abs(camera.position.x-point.x)>=3.2||root.classList.contains('iswas-loading')||document.body.classList.contains('access-gated')){
    surface.setVisible(false);if(mesh.current)mesh.current.visible=false;return;
   }
   const blocked=!!document.querySelector('dialog[open],.gallery-dialog,.tome-back:not(.is-shut),.magic-portal,.lloyd-dialog')||root.classList.contains('record-viewing');
   camera.updateMatrixWorld(true);
   let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity,front=true;
   for(let n=0;n<4;n++){
    scratch.corner.set(point.x+(n&1?TV_LAYOUT.width/2:-TV_LAYOUT.width/2),point.y+(n&2?TV_LAYOUT.height/2:-TV_LAYOUT.height/2),point.z);
    scratch.view.copy(scratch.corner).applyMatrix4(camera.matrixWorldInverse);
    if(scratch.view.z>=-camera.near){front=false;break}
    scratch.corner.project(camera);left=Math.min(left,scratch.corner.x);right=Math.max(right,scratch.corner.x);top=Math.max(top,scratch.corner.y);bottom=Math.min(bottom,scratch.corner.y);
   }
   const area=(right-left)*(top-bottom)*size.width*size.height/4;
   const visible=televisionVisible({front:front&&camera.position.z<point.z-.25,near:distance<9&&Math.abs(camera.position.x-point.x)<3.2,area,left,right,top,bottom,hidden:document.hidden,blocked:blocked||(review&&review!=='cigars'&&review!=='tv'&&review!=='room')});
   surface.setVisible(visible);
   if(mesh.current)mesh.current.visible=visible;
   if(material.current&&(scratch.powered!==surface.powered||scratch.texture!==texture.current)){
    scratch.powered=surface.powered;scratch.texture=texture.current;material.current.map=surface.powered?texture.current:null;material.current.color.set(surface.powered?'#ffffff':'#020403');material.current.needsUpdate=true;
   }
   if(review)root.dataset.tvReview=JSON.stringify({visible,front,blocked,distance,point:[point.x,point.y,point.z],camera:[camera.position.x,camera.position.y,camera.position.z],area,powered:surface.powered,paused:surface.video.paused,muted:surface.video.muted,time:surface.video.currentTime,ready:surface.video.readyState,review,left,right,top,bottom});
  });
  return h('mesh',{name:'The Ring · native vintage television screen',ref:mesh,position:[point.x,point.y,point.z],rotation:[0,Math.PI,0],
   onPointerOver:event=>{event.stopPropagation();document.body.style.cursor='pointer'},onPointerOut:()=>{document.body.style.cursor=''},
   onClick:event=>{event.stopPropagation();surface.start()},children:[h('planeGeometry',{args:[TV_LAYOUT.width,TV_LAYOUT.height]}),h('meshBasicMaterial',{ref:material,toneMapped:false,color:'#020403'})]});
 }
 return {VintageTelevision};
}
