// Physical stops around the gallery; these do not add presentation pages.
export const GALLERY_WAYPOINTS = Object.freeze([
 {id:'library',label:'LIBRARY / BLACK LODGE',position:[-.3,1.65,4.5],target:[-3.2,1.5,-1.6]},
 {id:'overview',label:'OVERVIEW',position:[-.75,1.72,5.5],target:[-.75,1.94,.07],section:'/'},
 {id:'need',label:'NEED',position:[11.2,1.5,1.3],target:[11.2,1.7,-5.6],section:'/need'},
 {id:'stars',label:'STARS',position:[20.15,6.4,7.2],target:[20.15,3.5,-4.85],section:'/stars'},
 {id:'locations',label:'LOCATIONS / GLOBE',position:[24.5,4.6,8.4],target:[21.5,1.5,1.5],section:'/locations'},
 {id:'form',label:'FORM',position:[28.6,1.45,1.2],target:[28.6,1.5,-5.3],section:'/form'},
 {id:'comparison',label:'COMPARISON',position:[36.4,1.55,1.5],target:[36.4,2,-5.45],section:'/comparison'},
 {id:'contact',label:'CONTACT',position:[40.6,1.42,1.3],target:[38.4,2.05,-5.45],section:'/contact'},
 {id:'akkad',label:'MOUSTAPHA AKKAD',position:[43.7,2.4,-.8],target:[46.45,3,-4.69]},
 // The piano is approached from the keyboard, with the bench toward the corner.
 {id:'piano',label:'PIANO',position:[47.8,2.2,8.45],target:[46,1,6.25]},
 {id:'cigars',label:'CIGAR LOUNGE',position:[40.8,2.1,2.3],target:[40.8,1,6.8]},
 {id:'bar',label:'BAR',position:[34,2.15,1.1],target:[34,1.5,6.5]},
 {id:'wine',label:'WINE COLLECTION',position:[27.6,2.1,3.5],target:[27.6,1.7,8.16]},
 {id:'records',label:'RECORD COLLECTION',position:[.3,2.2,3.25],target:[-2.65,1.9,7.7]}
].map(stop=>Object.freeze({...stop,position:Object.freeze(stop.position),target:Object.freeze(stop.target)})));
export function waypointIndex(value){
 const numeric=typeof value==='string'&&!/^\d+$/.test(value)?GALLERY_WAYPOINTS.findIndex(stop=>stop.id===value):Number(value);
 return Number.isFinite(numeric)?Math.max(0,Math.min(GALLERY_WAYPOINTS.length-1,Math.round(numeric))):0;
}
export function waypointAngles(stop){
 const x=stop.target[0]-stop.position[0],y=stop.target[1]-stop.position[1],z=stop.target[2]-stop.position[2];
 return {yaw:Math.atan2(x,-z),pitch:Math.atan2(y,Math.hypot(x,z))};
}
export function nearestGalleryWaypoint(position,direction){
 let best=0,distance=Infinity;
 for(let index=0;index<GALLERY_WAYPOINTS.length;index++){
  const stop=GALLERY_WAYPOINTS[index],dx=position[0]-stop.position[0],dy=position[1]-stop.position[1],dz=position[2]-stop.position[2];
  const angles=waypointAngles(stop),yaw=Math.atan2(Math.sin(direction.yaw-angles.yaw),Math.cos(direction.yaw-angles.yaw));
  // Facing the front and rear walls represents a different room area even at the same X.
  const score=dx*dx+dy*dy+dz*dz+yaw*yaw*12;
  if(score<distance){distance=score;best=index}
 }
 return best;
}
export function installGalleryProgress(){
 if(document.getElementById('gallery-progress'))return;
 const rail=document.createElement('nav');rail.id='gallery-progress';rail.className='gallery-progress';rail.setAttribute('aria-label','Explore the gallery');rail.hidden=true;
 const previous=document.createElement('button');previous.type='button';previous.className='gallery-progress-prev';previous.setAttribute('aria-label','Previous gallery area');previous.textContent='‹';
 const next=document.createElement('button');next.type='button';next.className='gallery-progress-next';next.setAttribute('aria-label','Next gallery area');next.textContent='›';
 const middle=document.createElement('div');middle.className='gallery-progress-middle';
 const label=document.createElement('output');label.className='gallery-progress-label';label.id='gallery-progress-label';
 const range=document.createElement('input');range.type='range';range.min='0';range.max=String(GALLERY_WAYPOINTS.length-1);range.step='1';range.value='0';range.id='gallery-progress-range';range.setAttribute('aria-label','Gallery area');range.setAttribute('aria-describedby',label.id);
 const ticks=document.createElement('div');ticks.className='gallery-progress-ticks';ticks.setAttribute('aria-hidden','true');
 for(const stop of GALLERY_WAYPOINTS){const tick=document.createElement('i');tick.title=stop.label;ticks.append(tick)}
 middle.append(label,ticks,range);rail.append(previous,middle,next);document.body.append(rail);
 let selected=0,requested=null,pointerActive=false;
 const display=index=>{selected=waypointIndex(index);const stop=GALLERY_WAYPOINTS[selected];range.value=String(selected);range.setAttribute('aria-valuetext',stop.label);label.textContent=stop.label;rail.style.setProperty('--gallery-progress',String(selected/(GALLERY_WAYPOINTS.length-1)*100)+'%');for(let i=0;i<ticks.children.length;i++)ticks.children[i].classList.toggle('is-passed',i<=selected)};
 const choose=index=>{display(index);requested=selected;window.__iswasTour?.setPaused(true,'gallery-progress');window.__v9Paused=true;window.dispatchEvent(new CustomEvent('gallery-waypoint',{detail:{id:GALLERY_WAYPOINTS[selected].id,index:selected}}))};
 range.addEventListener('input',()=>choose(range.value));
 range.addEventListener('pointerdown',()=>{pointerActive=true});
 const release=()=>{pointerActive=false};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 previous.addEventListener('click',()=>choose((selected-1+GALLERY_WAYPOINTS.length)%GALLERY_WAYPOINTS.length));
 next.addEventListener('click',()=>choose((selected+1)%GALLERY_WAYPOINTS.length));
 range.addEventListener('pointermove',event=>{if(pointerActive)return;const box=range.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));range.title=GALLERY_WAYPOINTS[waypointIndex(fraction*(GALLERY_WAYPOINTS.length-1))].label});
 window.addEventListener('gallery-waypoint-state',event=>{if(pointerActive)return;const detail=event.detail||{};if(detail.manual)requested=null;if(requested!==null&&detail.index!==requested)return;display(detail.index);if(detail.arrived)requested=null});
 const visible=()=>{const active=document.documentElement.classList.contains('is-gallery')&&!document.documentElement.classList.contains('iswas-loading');rail.hidden=!active;document.documentElement.classList.toggle('has-gallery-progress',active)};
 new MutationObserver(visible).observe(document.documentElement,{attributes:true,attributeFilter:['class']});visible();display(0);
}
if(typeof document!=='undefined'){
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./gallery-progress-v17-17.css',import.meta.url).href;document.head.append(style);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installGalleryProgress,{once:true});else installGalleryProgress();
}
