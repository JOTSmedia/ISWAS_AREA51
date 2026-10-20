// Enlarged pointer targets do not enlarge the rendered pin dots or add a draw call.
// Reject pins hidden by the planet before considering their screen-space halo.
export function globePinVisible(origin,point,center,radius=1.05){
 const x=point.x-origin.x,y=point.y-origin.y,z=point.z-origin.z;
 const length=Math.hypot(x,y,z);if(!length)return false;
 const ox=origin.x-center.x,oy=origin.y-center.y,oz=origin.z-center.z;
 const b=(ox*x+oy*y+oz*z)/length,disc=b*b-(ox*ox+oy*oy+oz*oz-radius*radius);
 if(disc<0)return true;
 const near=-b-Math.sqrt(disc);
 return !(near>0&&near<length-.01);
}
export function pickGlobePin(ray,points,center,fov,height,touch=false,near=0,far=Infinity){
 const origin=ray.origin,direction=ray.direction;
 if(Math.hypot(origin.x-center.x,origin.y-center.y,origin.z-center.z)>12||height<=0)return null;
 const pixelRadius=touch?22:14,scale=2*Math.tan(fov*Math.PI/360)/height;
 let best=null,bestPixels=Infinity;
 for(let i=0;i<points.length;i++){
  const p=points[i],x=p.x-origin.x,y=p.y-origin.y,z=p.z-origin.z;
  const along=x*direction.x+y*direction.y+z*direction.z;
  if(along<=0||along<near||along>far||!globePinVisible(origin,p,center))continue;
  const miss=Math.max(0,x*x+y*y+z*z-along*along),worldPerPixel=along*scale;
  const pixels=miss/(worldPerPixel*worldPerPixel);
  if(pixels>pixelRadius*pixelRadius||pixels>=bestPixels)continue;
  const radius=pixelRadius*worldPerPixel;
  bestPixels=pixels;best={index:i,distance:Math.max(near,along-Math.sqrt(Math.max(0,radius*radius-miss)))};
 }
 if(best){
  // A visible pin's halo can cross the planet silhouette. Keep that halo in
  // front of the planet hit, while the exact center occlusion above still
  // prevents a hidden rear pin from stealing a front-surface click.
  const ox=origin.x-center.x,oy=origin.y-center.y,oz=origin.z-center.z;
  const b=ox*direction.x+oy*direction.y+oz*direction.z,disc=b*b-(ox*ox+oy*oy+oz*oz-1.05*1.05);
  if(disc>=0){const surface=-b-Math.sqrt(disc);if(surface>near)best.distance=Math.min(best.distance,surface-.0001)}
 }
 return best;
}
// NASA's base map uses almost-black navy for deep water. Lift only that dark,
// blue-dominant fill in linear color space; land, desert and ice stay unchanged.
// Reuse the two existing texture samples, keeping the globe self-illuminated
// without another texture, light, renderer or per-frame update.
export function illuminateGlobeOcean(shader){
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
vec3 globeOceanColor(vec3 color) {
 float peak = max(color.r, max(color.g, color.b));
 float blueFraction = (color.b - max(color.r, color.g)) / max(color.b, 0.00001);
 float ocean = smoothstep(0.2, 0.55, blueFraction) * (1.0 - smoothstep(0.025, 0.08, peak));
 return mix(color, max(color, vec3(0.004, 0.055, 0.18)), ocean);
}
`).replace('#include <map_fragment>',`#ifdef USE_MAP
 vec4 sampledDiffuseColor = texture2D(map, vMapUv);
 #ifdef DECODE_VIDEO_TEXTURE
  sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);
 #endif
 sampledDiffuseColor.rgb = globeOceanColor(sampledDiffuseColor.rgb);
 diffuseColor *= sampledDiffuseColor;
#endif`).replace('#include <emissivemap_fragment>',`#ifdef USE_EMISSIVEMAP
 vec4 emissiveColor = texture2D(emissiveMap, vEmissiveMapUv);
 #ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
  emissiveColor = sRGBTransferEOTF(emissiveColor);
 #endif
 totalEmissiveRadiance *= globeOceanColor(emissiveColor.rgb);
#endif`);
}
// Reuse the diffuse cloud sample for emission. The Earth and pins keep their
// original UV/geographic mapping; only this lightweight weather layer drifts.
export function addSatelliteAtmosphere(shader,uniforms){
 illuminateGlobeOcean(shader);
 // A richer blue water fill counters the gallery's warm reflected lighting.
 // The original blue-only mask still protects land, ice and coastal color.
 shader.fragmentShader=shader.fragmentShader.replace('vec3(0.004, 0.055, 0.18)','vec3(0.0018, 0.055, 0.26)');
 Object.assign(shader.uniforms,uniforms);
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D globeCloudMap;
uniform float globeCloudReady;
uniform float globeCloudOffset;
uniform float globeAtmospherePulse;`);
 shader.fragmentShader=shader.fragmentShader.replace('sampledDiffuseColor.rgb = globeOceanColor(sampledDiffuseColor.rgb);',`sampledDiffuseColor.rgb = globeOceanColor(sampledDiffuseColor.rgb);
 float globeCloudCover=0.0;
 if(globeCloudReady>0.5){
  float cloudMask=texture2D(globeCloudMap,vec2(fract(vMapUv.x+globeCloudOffset),vMapUv.y)).r;
  globeCloudCover=smoothstep(0.10,0.88,cloudMask)*0.88;
 }
 sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(0.86,0.91,0.94),globeCloudCover);`);
 shader.fragmentShader=shader.fragmentShader.replace('totalEmissiveRadiance *= globeOceanColor(emissiveColor.rgb);',`vec3 globeEmission=globeOceanColor(emissiveColor.rgb);
 #ifdef USE_MAP
  globeEmission=mix(globeEmission,vec3(0.78,0.86,0.92),globeCloudCover);
 #endif
 totalEmissiveRadiance *= globeEmission;`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float globeFacing=clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0);
 float globeKey=clamp(dot(normalize(normal),normalize(vec3(-0.42,0.72,0.60))),0.0,1.0);
 float globeShape=0.63+0.37*globeKey;
 float globeLimb=pow(1.0-globeFacing,3.1);
 outgoingLight=outgoingLight*globeShape+vec3(0.045,0.42,0.64)*globeLimb*(0.60+0.40*globeKey)*(1.0+globeAtmospherePulse*0.10);
 #include <opaque_fragment>`);
}
const globeOceanProgram=()=> 'nasa-earth-atmosphere-v2';
// Shrink only each dot's local vertices as the lens zooms. Instance translations
// stay on their geographic coordinates, so nearby dots separate on screen.
// One shared uniform avoids rewriting every pin matrix during zoom animation.
export function preserveGlobePinSize(shader,scale){
 shader.uniforms.globePinScale=scale;
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float globePinScale;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed *= globePinScale;');
}
const globePinProgram=()=> 'globe-pin-screen-size-v1';
/* Native gallery objects. Reuses the site's renderer, lighting and Three classes. */
export function createBlackLodge({React:R,jsx:J,useFrame,useThree,RoundedBox,CylinderGeometry,LatheGeometry,CircleGeometry,MeshStandardMaterial,Vector2:V2,Vector3:V3,Quaternion:Q,Object3D:Obj,Color,Shape,Path,Curve,loadTexture,woodMap,woodHeight,ContactShadow}){
 const h=J.jsx,hs=J.jsxs;
 const mobile=matchMedia('(max-width: 767px)').matches||navigator.connection?.saveData;
 const tier=mobile?1024:2048;
 const surface=name=>{const t=loadTexture(`/textures/black-lodge/${name}-${tier}.webp`);t.anisotropy=mobile?2:8;return t};
 const floor=surface('chevron'),cloth=surface('upholstery'),velvet=surface('velvet');
 floor.repeat.set(4,4);cloth.repeat.set(2,2);velvet.repeat.set(3,1);
 const fabric={map:cloth,color:'#d7d7d5',roughness:.93,bumpMap:cloth,bumpScale:.0035};
 const walnut={map:woodMap,bumpMap:woodHeight,bumpScale:.007,color:'#967650',roughness:.42};
 const brass={color:'#9e8967',metalness:.76,roughness:.38};
 const mesh=(type,args,mat,p=[0,0,0],rot=[0,0,0],extra={})=>hs('mesh',{position:p,rotation:rot,castShadow:true,receiveShadow:true,...extra,children:[h(type,{args}),h('meshStandardMaterial',mat)]});
 const round=(geo,mat,p,rot=[0,0,0])=>hs('mesh',{geometry:geo,position:p,rotation:rot,castShadow:true,receiveShadow:true,children:h('meshStandardMaterial',mat)});
 const tube=(pts,r,mat)=>mesh('tubeGeometry',[new Curve(pts.map(p=>new V3(...p))),mobile?16:28,r,mobile?5:8,false],mat);
 function Seat({position=[0,0,0],rotation=[0,0,0],sofa=false,scale=1}){
  const width=sofa?2.58:.92;
  const geometry=R.useMemo(()=>({base:new RoundedBox(width,.28,.91,3,.065),back:new RoundedBox(width-.06,.9,.25,4,.12),cushion:new RoundedBox(sofa?.78:.84,.23,.75,4,.07),arm:new RoundedBox(.24,.62,.98,4,.115)}),[width,sofa]);
  R.useEffect(()=>()=>Object.values(geometry).forEach(g=>g.dispose()),[geometry]);
  const trim=R.useMemo(()=>{const pieces=[];for(const side of [-1,1])for(let j=0;j<3;j++){
   const x=side*(width/2+.035+j*.062);
   pieces.push(tube([[x,.12,.48],[x,.4,.5],[x,.72,.46],[x,.78,.18],[x,.79,-.18],[x,.83,-.45]],.018,walnut));
  }return pieces},[width]);
  return hs('group',{position,rotation,scale,children:[h(ContactShadow,{position:[0,.018,0],size:[width+.65,1.5]}),round(geometry.base,fabric,[0,.32,0]),round(geometry.back,fabric,[0,.91,-.37],[-.075,0,0]),...(sofa?[-.83,0,.83]:[0]).map(x=>round(geometry.cushion,fabric,[x,.52,.05])),...[-1,1].map(s=>round(geometry.arm,fabric,[s*(width/2+.04),.58,0])),...trim,...[-1,1].flatMap(s=>[-1,1].map(z=>mesh('boxGeometry',[.16,.14,.18],walnut,[s*(width/2-.07),.1,z*.36])))]});
 }
 // All six gallery lamps reuse these five shapes and four material instances.
 // Factory-owned resources stay alive with the gallery, so one fixture cannot
 // dispose another fixture's geometry during a visibility or route transition.
 let lampResources=null;
 function getLampResources(){
  if(lampResources)return lampResources;
  const profile=[[.055,0],[.075,.1],[.1,.2],[.19,.36],[.32,.47],[.34,.49]].map(p=>new V2(...p));
  lampResources={geometry:[new CylinderGeometry(.23,.28,.065,24),new CylinderGeometry(.065,.12,.16,18),new CylinderGeometry(.024,.033,2.26,12),new LatheGeometry(profile,mobile?20:40),new CircleGeometry(.25,24)],material:[new MeshStandardMaterial(brass),new MeshStandardMaterial({color:'#7a6b5c',metalness:.8,roughness:.3}),new MeshStandardMaterial({color:'#51473e',metalness:.78,roughness:.34,side:2}),new MeshStandardMaterial({color:'#ccb999',emissive:'#ccb999',emissiveIntensity:.35,side:2})]};
  return lampResources;
 }
 function Lamp({position,light={position:[0,2.85,0],color:'#ccb999',intensity:2.8,distance:5,decay:2}}){
  const {geometry:g,material:m}=getLampResources();
  const part=(shape,finish,position,rotation=[0,0,0])=>h('mesh',{geometry:g[shape],material:m[finish],position,rotation,castShadow:true,receiveShadow:true,dispose:null});
  return hs('group',{position,children:[part(0,0,[0,.04,0]),part(1,0,[0,.14,0]),part(2,1,[0,1.28,0]),part(3,2,[0,2.39,0]),part(4,3,[0,2.8,0],[-Math.PI/2,0,0]),h('pointLight',light)]});
 }
 function Curtain({position,width,height}){
  const ref=R.useRef(null);
  R.useLayoutEffect(()=>{const geom=ref.current,arr=geom.attributes.position;for(let i=0;i<arr.count;i++){const x=arr.getX(i);arr.setZ(i,.075*Math.sin(x*17)+.018*Math.sin(x*34))}arr.needsUpdate=true;geom.computeVertexNormals()},[]);
  return hs('mesh',{position,receiveShadow:true,children:[h('planeGeometry',{ref,args:[width,height,mobile?100:220,2]}),h('meshPhysicalMaterial',{map:velvet,color:'#c8b5ab',roughness:.92,sheen:1,sheenColor:'#760e16',sheenRoughness:.75,side:2})]});
 }
 function LibrarySetting(){return hs('group',{children:[mesh('planeGeometry',[10.8,10.5],{map:floor,color:'#f8f4ef',roughness:.48,metalness:0},[.25,.012,.35],[-Math.PI/2,0,0]),h(Curtain,{position:[.2,2.45,-4.93],width:8.4,height:4.9}),h(Seat,{position:[.2,0,-2],rotation:[0,.12,0]}),h(Seat,{position:[2.45,0,-2],rotation:[0,-.12,0]}),h(Lamp,{position:[-1.05,0,-2.4]}),h(Lamp,{position:[3.05,0,-3.6]}),mesh('cylinderGeometry',[.36,.36,.045,32],{color:'#1e1b18',roughness:.25,metalness:.3},[1.325,.66,-1.85]),...[-1,1].flatMap(x=>[-1,1].map(z=>mesh('boxGeometry',[.035,.62,.035],brass,[1.325+x*.22,.32,-1.85+z*.22])))]})}
 function LoungeSetting(){return hs('group',{children:[h(Seat,{sofa:true,scale:1.24,position:[21.5,0,-2.75]}),h(Seat,{sofa:true,scale:1.24,position:[21.5,0,5.8],rotation:[0,Math.PI,0]}),h(Lamp,{position:[18.9,0,-2.4]}),h(Lamp,{position:[18.7,0,5.6]})]})}
 const direction=(d,out=new V3)=>{const a=d.lat*Math.PI/180,b=d.lon*Math.PI/180;out.x=Math.cos(a)*Math.cos(b);out.y=Math.sin(a);out.z=-Math.cos(a)*Math.sin(b);return out};
 function GlobeTable(){
  const spin=R.useRef(null),pins=R.useRef(null),drag=R.useRef(null),animation=R.useRef(null),loaded=R.useRef(false),idle=R.useRef(0),pendingTexture=R.useRef(null),glow=R.useRef(null),innerLight=R.useRef(null),glowPhase=R.useRef(0),globeHovered=R.useRef(false),lastGlobeGesture=R.useRef(-Infinity),[data,setData]=R.useState([]),[texture,setTexture]=R.useState(null),[filter,setFilter]=R.useState('all'),[selected,setSelected]=R.useState(null),{camera}=useThree();
  const reduced=R.useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)'),[]);
  const cloudTexture=R.useRef(null),pendingCloud=R.useRef(null);
  const atmosphere=R.useMemo(()=>({globeCloudMap:{value:null},globeCloudReady:{value:0},globeCloudOffset:{value:0},globeAtmospherePulse:{value:0}}),[]);
  const earthShader=R.useMemo(()=>shader=>addSatelliteAtmosphere(shader,atmosphere),[atmosphere]);
  const pinScale=R.useMemo(()=>({value:1}),[]),pinShader=R.useMemo(()=>shader=>preserveGlobePinSize(shader,pinScale),[pinScale]);
  const pinHover=R.useRef(null),tooltip=R.useRef(null),labelPoint=R.useMemo(()=>new V3(),[]),labelLayout=R.useRef({text:null,viewport:0,width:0,height:0,dirty:true});
  R.useEffect(()=>{if(!document.createElement)return;const tip=document.createElement('div');tip.className='globe-pin-label';tip.hidden=true;tip.setAttribute('role','tooltip');document.body.append(tip);tooltip.current=tip;const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{labelLayout.current.dirty=true}):null;observer?.observe(tip);return()=>{observer?.disconnect();tip.remove();tooltip.current=null}},[]);
  const globeInteractive=()=>!!window.__locationsViewport||document.documentElement.classList.contains('is-gallery');
  const blockingDialog=()=>document.querySelector('dialog[open]:not(.horror-locations)');
  const hidePin=()=>{pinHover.current=null;if(tooltip.current&&!tooltip.current.hidden)tooltip.current.hidden=true};
  const showPin=e=>{const record=Number.isInteger(e.instanceId)?active[e.instanceId]:null;if(!record||drag.current){hidePin();return}pinHover.current=record;if(tooltip.current){const text=record.film+' — '+record.place;if(tooltip.current.textContent!==text)tooltip.current.textContent=text}};
  const top=R.useMemo(()=>{let s=new Shape();s.absarc(0,0,2.4,0,Math.PI*2,false);let p=new Path();p.absarc(0,0,1.12,0,Math.PI*2,true);s.holes.push(p);return s},[]);
  const shelf=R.useMemo(()=>{let s=new Shape();s.absarc(0,0,1.78,0,Math.PI*2,false);let p=new Path();p.absarc(0,0,1.32,0,Math.PI*2,true);s.holes.push(p);return s},[]);
  const cols={open:'#42e6c2',outside:'#ffb347',gone:'#db77ff'};
  const active=R.useMemo(()=>data.filter(d=>filter==='all'||d.status===filter),[data,filter]);
  const hitPoints=R.useMemo(()=>active.map(()=>new V3()),[active]),hitCenter=R.useMemo(()=>new V3(),[]),hitPointer=R.useMemo(()=>new V3(),[]);
  const raycastPins=(raycaster,hits)=>{
   if(!spin.current||!pins.current||!globeInteractive()||blockingDialog())return;
   const pane=window.__locationsViewport;
   if(pane){raycaster.ray.at(1,hitPointer).project(camera);const x=(hitPointer.x*.5+.5)*innerWidth,y=(-hitPointer.y*.5+.5)*innerHeight;if(x<pane.left||x>pane.left+pane.width||y<pane.top||y>pane.top+pane.height)return}
   hitCenter.x=hitCenter.y=hitCenter.z=0;hitCenter.applyMatrix4(spin.current.matrixWorld);
   for(let i=0;i<active.length;i++)direction(active[i],hitPoints[i]).multiplyScalar(1.1).applyMatrix4(spin.current.matrixWorld);
   const hit=pickGlobePin(raycaster.ray,hitPoints,hitCenter,camera.fov,innerHeight,mobile,raycaster.near,raycaster.far);
   if(hit)hits.push({distance:hit.distance,point:raycaster.ray.at(hit.distance,new V3()),object:pins.current,instanceId:hit.index});
  };
  R.useEffect(()=>{let live=true;const load=()=>{if(loaded.current)return;loaded.current=true;import('./horror-locations-data-v17-9.js').then(m=>{if(!live)return;setData(m.HORROR_LOCATIONS);const path=mobile?m.GLOBE_TEXTURES.mobile:m.GLOBE_TEXTURES.desktop;const tex=loadTexture(path);tex.wrapS=1000;tex.wrapT=1001;tex.anisotropy=mobile?2:8;pendingTexture.current={texture:tex,deadline:performance.now()+15000};const clouds=loadTexture(`/textures/globe-clouds-${mobile?1024:2048}.webp`);clouds.wrapS=1000;clouds.wrapT=1001;clouds.colorSpace='';clouds.anisotropy=mobile?2:4;pendingCloud.current={texture:clouds,deadline:performance.now()+15000}}).catch(()=>{loaded.current=false})};const visit=()=>load();const selection=e=>{if(!e.detail||!Number.isFinite(e.detail.lat)||!Number.isFinite(e.detail.lon))return;load();setSelected(e.detail.id);const local=direction(e.detail),toward=new V3(3,3.1,6.9).normalize().add(new V3(0,.2,0)).normalize();animation.current=new Q().setFromUnitVectors(local,toward);idle.current=performance.now()+10000};const filtering=e=>setFilter(['all','open','outside','gone'].includes(e.detail?.status)?e.detail.status:'all');window.addEventListener('horror-globe-open',visit);window.addEventListener('horror-globe-visit',visit);window.addEventListener('globe-location-select',selection);window.addEventListener('globe-filter',filtering);const timer=setInterval(()=>{if(Math.abs(camera.position.x-21.5)<10)load()},600);return()=>{live=false;loaded.current=false;clearInterval(timer);window.removeEventListener('horror-globe-open',visit);window.removeEventListener('horror-globe-visit',visit);window.removeEventListener('globe-location-select',selection);window.removeEventListener('globe-filter',filtering);pendingTexture.current?.texture.dispose();pendingTexture.current=null;pendingCloud.current?.texture.dispose();pendingCloud.current=null;cloudTexture.current?.dispose();cloudTexture.current=null;atmosphere.globeCloudMap.value=null;atmosphere.globeCloudReady.value=0;window.__globeDragging=false}},[camera]);
  R.useEffect(()=>()=>texture?.dispose(),[texture]);
  R.useLayoutEffect(()=>{if(!pins.current)return;let o=new Obj;active.forEach((d,i)=>{o.position.copy(direction(d)).multiplyScalar(1.1);o.scale.setScalar(d.id===selected?1.7:1);o.updateMatrix();pins.current.setMatrixAt(i,o.matrix);pins.current.setColorAt(i,new Color(d.id===selected?'#ff5145':cols[d.status]))});pins.current.count=active.length;pins.current.instanceMatrix.needsUpdate=true;if(pins.current.instanceColor)pins.current.instanceColor.needsUpdate=true;pins.current.computeBoundingSphere()},[active,selected]);
  useFrame((_,dt)=>{if(!spin.current||document.hidden)return;const zoom=window.__globeZoomRendered;pinScale.value=Number.isFinite(zoom)&&zoom>0?1/zoom:1;glowPhase.current+=Math.min(dt,.05);const pulse=reduced.matches?0:Math.sin(glowPhase.current*1.6),hover=globeHovered.current?1:0;const illumination=.68+.14*pulse+.08*hover;if(glow.current)glow.current.emissiveIntensity=illumination;if(innerLight.current)innerLight.current.intensity=6.1+1.1*pulse+.5*hover;atmosphere.globeAtmospherePulse.value=pulse;if(!reduced.matches&&Math.abs(camera.position.x-21.5)<11&&!blockingDialog())atmosphere.globeCloudOffset.value=(atmosphere.globeCloudOffset.value+Math.min(dt,.05)*.00006)%1;
   if(tooltip.current){const tip=tooltip.current,record=pinHover.current;let visible=false;if(record&&!drag.current&&globeInteractive()&&!blockingDialog()){direction(record,labelPoint).multiplyScalar(1.12).applyMatrix4(spin.current.matrixWorld).project(camera);visible=labelPoint.z>-1&&labelPoint.z<1&&Math.abs(labelPoint.x)<1&&Math.abs(labelPoint.y)<1}if(visible){if(tip.hidden)tip.hidden=false;const layout=labelLayout.current;if(layout.dirty||layout.text!==tip.textContent||layout.viewport!==innerWidth){layout.width=tip.offsetWidth;layout.height=tip.offsetHeight;layout.text=tip.textContent;layout.viewport=innerWidth;layout.dirty=false}const left=Math.max(12,Math.min(innerWidth-layout.width-12,(labelPoint.x*.5+.5)*innerWidth+14))+'px',top=Math.max(12,Math.min(innerHeight-layout.height-12,(-labelPoint.y*.5+.5)*innerHeight-layout.height-12))+'px';if(tip.style.left!==left)tip.style.left=left;if(tip.style.top!==top)tip.style.top=top}else if(!tip.hidden)tip.hidden=true}
   const clouds=pendingCloud.current;if(clouds?.texture.image?.width>0){pendingCloud.current=null;cloudTexture.current=clouds.texture;atmosphere.globeCloudMap.value=clouds.texture;atmosphere.globeCloudReady.value=1}else if(clouds&&performance.now()>=clouds.deadline){clouds.texture.dispose();pendingCloud.current=null}
   const pending=pendingTexture.current;if(pending?.texture.image?.width>0){pendingTexture.current=null;setTexture(pending.texture)}else if(pending&&performance.now()>=pending.deadline){pending.texture.dispose();pendingTexture.current=null}if(animation.current){spin.current.quaternion.slerp(animation.current,1-Math.exp(-4*Math.min(dt,.05)));if(spin.current.quaternion.angleTo(animation.current)<.003)animation.current=null}else if(!drag.current&&!pinHover.current&&!globeHovered.current&&!reduced.matches&&performance.now()>idle.current&&Math.abs(camera.position.x-21.5)<11&&!blockingDialog())spin.current.rotation.y+=Math.min(dt,.05)*.075});
  function stopDrag(pointerId){const d=drag.current;if(!d||(pointerId!==undefined&&pointerId!==d.pointerId))return null;drag.current=null;window.__globeDragging=false;lastGlobeGesture.current=performance.now();idle.current=lastGlobeGesture.current+4000;try{if(d.target.hasPointerCapture?.(d.pointerId))d.target.releasePointerCapture(d.pointerId)}catch{}return d}
  // Fiber consumes cancel/lost-capture events internally, so native fallbacks
  // release the navigation lock even after tab switches or interrupted touches.
  R.useEffect(()=>{const release=e=>stopDrag(e.pointerId),blur=()=>stopDrag(),visibility=()=>{if(document.hidden)stopDrag()};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('lostpointercapture',release);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);return()=>{stopDrag();window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('lostpointercapture',release);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility)}},[]);
  const down=e=>{hidePin();if(!globeInteractive()||blockingDialog()||drag.current||e.button!==0)return;e.stopPropagation();e.nativeEvent?.stopImmediatePropagation();window.__globeDragging=true;animation.current=null;drag.current={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,pointerId:e.pointerId,target:e.target,pinId:active[e.instanceId]?.id||null};e.target.setPointerCapture(e.pointerId)};
  const move=e=>{if(!drag.current||e.pointerId!==drag.current.pointerId)return;e.stopPropagation();const d=drag.current,dx=e.clientX-d.x,dy=e.clientY-d.y;spin.current.rotation.y+=dx*.007;spin.current.rotation.x+=dy*.005;d.x=e.clientX;d.y=e.clientY};
  const up=e=>{if(!drag.current||e.pointerId!==drag.current.pointerId)return;e.stopPropagation();const d=stopDrag(e.pointerId);if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<6)window.dispatchEvent(new CustomEvent('horror-globe-open',{detail:d.pinId?{id:d.pinId}:null}))};
  const interactive={onClick:e=>{e.stopPropagation();e.nativeEvent?.stopImmediatePropagation()},onPointerDown:down,onPointerMove:e=>{e.stopPropagation();move(e)},onPointerUp:up,onPointerCancel:e=>stopDrag(e.pointerId),onLostPointerCapture:e=>stopDrag(e.pointerId),onPointerOver:e=>{e.stopPropagation?.();globeHovered.current=true;document.body.style.cursor=drag.current?'grabbing':'grab'},onPointerOut:()=>{globeHovered.current=false;document.body.style.cursor=''}};
  const open=e=>{e.stopPropagation();if(window.__globeDragging||performance.now()-lastGlobeGesture.current<350)return;window.dispatchEvent(new Event('horror-globe-open'))};
  const parts=R.useMemo(()=>{const pieces=[];
  for(let i=0;i<16;i++){let a=i/16*Math.PI*2;pieces.push(mesh('cylinderGeometry',[.035,.045,.6,8],walnut,[Math.cos(a)*1.55,.97,Math.sin(a)*1.55]))}
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4,p=(r,y)=>[Math.cos(a)*r,y,Math.sin(a)*r];pieces.push(tube([p(.25,.3),p(.7,.28),p(1.25,.18),p(1.72,.07)],.075,walnut),tube([p(1.62,.08),p(1.7,.27),p(1.55,.55)],.05,walnut),mesh('sphereGeometry',[.085,12,8],brass,p(1.74,.07)))}return pieces},[]);
  return hs('group',{position:[21.5,0,1.5],children:[h(ContactShadow,{position:[0,.055,0],size:[5.2,5.2]}),hs('mesh',{position:[0,1.41,0],rotation:[-Math.PI/2,0,0],castShadow:true,receiveShadow:true,onClick:open,children:[h('extrudeGeometry',{args:[top,{depth:.14,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:mobile?48:80}]}),h('meshPhysicalMaterial',{...walnut,clearcoat:.55,clearcoatRoughness:.25})]}),mesh('torusGeometry',[1.125,.022,8,64],brass,[0,1.58,0],[Math.PI/2,0,0]),mesh('cylinderGeometry',[2.28,2.28,.24,mobile?40:72,1,true],{...walnut,side:2},[0,1.25,0]),mesh('torusGeometry',[2.28,.03,8,64],walnut,[0,1.12,0],[Math.PI/2,0,0]),mesh('extrudeGeometry',[shelf,{depth:.07,bevelEnabled:false,curveSegments:48}],walnut,[0,.55,0],[-Math.PI/2,0,0]),mesh('latheGeometry',[[[0,0],[.42,0],[.42,.06],[.3,.1],[.22,.2],[.26,.3],[.18,.42],[.16,.55],[.22,.62],[0,.7]].map(p=>new V2(...p)),24],walnut,[0,.02,0]),...parts,hs('group',{ref:spin,position:[0,1.49,0],rotation:[0,-.35,0],children:[hs('mesh',{...interactive,children:[h('sphereGeometry',{args:[1.05,mobile?48:80,mobile?32:56]}),h('meshPhysicalMaterial',{ref:glow,onBeforeCompile:earthShader,customProgramCacheKey:globeOceanProgram,map:texture||undefined,color:texture?'#ffffff':'#304e61',emissiveMap:texture||undefined,emissive:'#ffffff',emissiveIntensity:.68,roughness:.62,clearcoat:.12,clearcoatRoughness:.58},texture?'nasa-satellite':'nasa-loading')]}),hs('instancedMesh',{ref:pins,args:[null,null,Math.max(active.length,1)],raycast:raycastPins,...interactive,onPointerOver:e=>{interactive.onPointerOver(e);showPin(e)},onPointerMove:e=>{e.stopPropagation();move(e);showPin(e)},onPointerOut:()=>{interactive.onPointerOut();hidePin()},children:[h('sphereGeometry',{args:[.032,8,6]}),h('meshBasicMaterial',{color:'#ffffff',toneMapped:false,onBeforeCompile:pinShader,customProgramCacheKey:globePinProgram})]})]}),h('pointLight',{ref:innerLight,position:[0,1.8,0],color:'#79b8ee',intensity:6.1,distance:5,decay:2}),h('pointLight',{position:[0,4.2,1.4],color:'#f3e0c4',intensity:7,distance:8,decay:2})]});
 }
 return {LibrarySetting,LoungeSetting,GlobeTable,LodgeLamp:Lamp};
}
