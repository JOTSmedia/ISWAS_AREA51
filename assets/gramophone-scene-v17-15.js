import {RECORD_STATION,recordFlightPose} from './record-catalogue-v17-15.js';
import './record-player-v17-15.js';

// One atlas and one instanced mesh hold the complete, independently pickable
// collection. Only the single record on the gramophone needs animation.
export function createGramophone({React:R,jsx:J,useFrame,BufferGeometry,BufferAttribute,InstancedBufferAttribute,BoxGeometry,CylinderGeometry,LatheGeometry,TorusGeometry,Shape,Vector2,Vector3,Object3D,Curve,CanvasTexture,MeshStandardMaterial,MeshPhysicalMaterial,MeshBasicMaterial,loadTexture,woodMap,ContactShadow}){
 const h=J.jsx,hs=J.jsxs,mobile=matchMedia('(max-width:767px)').matches;
 const tier=mobile?1024:innerWidth>=1600?4096:2048;
 const atlas=loadTexture(`/textures/records/sleeves-${tier}.webp`);atlas.wrapS=atlas.wrapT=1001;atlas.anisotropy=mobile?2:4;
 const emptyRaycast=()=>null;
 const tile=(rank,out)=>{const i=rank-1;out.set(i%10*.1+.002,.9-Math.floor(i/10)*.1+.002);return out};
 function recordShader(shader){
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 recordTile;\nvarying vec2 vRecordTile;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRecordTile=recordTile;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vRecordTile;').replace('#include <map_fragment>','vec4 sampledDiffuseColor=texture2D(map,vMapUv*.096+vRecordTile);diffuseColor*=sampledDiffuseColor;');
 }
 function GramophoneStation(){
  const discs=R.useRef(null),flying=R.useRef(null),spin=R.useRef(null),arm=R.useRef(null),horn=R.useRef(null),idle=R.useRef({rank:1,progress:0,direction:0,playing:false,speed:0,angle:0}),lastHover=R.useRef(-1);
  const reduced=R.useMemo(()=>matchMedia('(prefers-reduced-motion:reduce)'),[]);
  const dummy=R.useMemo(()=>new Object3D(),[]),labelTile=R.useMemo(()=>({value:new Vector2(.002,.902)}),[]);
  const recordGeometry=R.useMemo(()=>{const g=new BoxGeometry(.3,.3,.024),offsets=new Float32Array(200);for(let i=0;i<100;i++){offsets[i*2]=i%10*.1+.002;offsets[i*2+1]=.9-Math.floor(i/10)*.1+.002}g.setAttribute('recordTile',new InstancedBufferAttribute(offsets,2));return g},[]);
  const recordMaterial=R.useMemo(()=>new MeshBasicMaterial({map:atlas,onBeforeCompile:recordShader,customProgramCacheKey:()=> 'record-atlas-v1'}),[]);
  const finishes=R.useMemo(()=>({wood:new MeshStandardMaterial({map:woodMap,color:'#967650',roughness:.4}),dark:new MeshStandardMaterial({color:'#14100c',roughness:.55}),brass:new MeshPhysicalMaterial({color:'#b79550',metalness:.76,roughness:.3,clearcoat:.35,side:2}),groove:new MeshStandardMaterial({color:'#121314',roughness:.32,metalness:.16}),ivory:new MeshBasicMaterial({color:'#cbb58c'})}),[]);
  const staticMeshes=R.useMemo(()=>{
   const parts=new Map(),obj=new Object3D();
   const put=(geo,key,p,rot=[0,0,0])=>{obj.position.set(...p);obj.rotation.set(...rot);obj.updateMatrix();geo.applyMatrix4(obj.matrix);let data=parts.get(key);if(!data){data={p:[],n:[],uv:[]};parts.set(key,data)}const pos=geo.attributes.position,nor=geo.attributes.normal,uv=geo.attributes.uv,ix=geo.index;for(let j=0;j<(ix?ix.count:pos.count);j++){const i=ix?ix.getX(j):j;data.p.push(pos.getX(i),pos.getY(i),pos.getZ(i));data.n.push(nor.getX(i),nor.getY(i),nor.getZ(i));data.uv.push(uv?.getX(i)||0,uv?.getY(i)||0)}geo.dispose()};
   const box=(a,key,p,rot)=>put(new BoxGeometry(...a),key,p,rot);
   const cylinder=(r1,r2,height,key,p,rot)=>put(new CylinderGeometry(r1,r2,height,mobile?12:20),key,p,rot);
   // Shelf cabinet uses the rear-left corner, opposite the front-left library.
   box([5.12,3.85,.09],'dark',[0,1.96,-.04]);
   for(const x of [-2.6,2.6])box([.11,3.9,.48],'wood',[x,1.96,.12]);
   for(let row=0;row<=7;row++)box([5.15,.055,.45],'wood',[0,.34+row*.43,.13]);
   for(const x of [-1.31,0,1.31])box([.045,3.07,.4],'wood',[x,1.87,.1]);
   box([5.33,.13,.55],'wood',[0,3.93,.14]);box([5.2,.025,.025],'brass',[0,3.59,.38]);
   // A console and acoustic gramophone, 1.81 m in front of the record wall.
   for(const x of [-.49,.49])for(const z of [1.46,2.15])cylinder(.04,.055,.79,'wood',[x,.43,z]);
   box([1.2,.07,.9],'wood',[0,.87,1.81]);box([1.02,.065,.74],'brass',[0,.935,1.81]);
   box([.96,.2,.68],'wood',[0,1.05,1.81]);
   box([.64,.11,.016],'dark',[0,1.035,2.16]);
   for(let i=0;i<11;i++)box([.018,.1,.022],'brass',[-.28+i*.056,1.035,2.175]);
   cylinder(.182,.182,.028,'brass',[0,1.163,1.81]);cylinder(.17,.17,.012,'groove',[0,1.181,1.81]);
   cylinder(.009,.009,.035,'brass',[0,1.205,1.81]);
   // Winding crank, feet and decorative corner brackets.
   cylinder(.015,.015,.18,'brass',[.57,1.025,1.78],[0,0,Math.PI/2]);cylinder(.018,.018,.12,'brass',[.66,.97,1.78]);
   cylinder(.025,.025,.1,'wood',[.66,.91,1.78],[Math.PI/2,0,0]);
   for(const x of [-.44,.44])for(const z of [1.52,2.1])box([.045,.19,.035],'brass',[x,1.05,z]);
   const result=[];for(const[key,d]of parts){const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(d.p),3));g.setAttribute('normal',new BufferAttribute(new Float32Array(d.n),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(d.uv),2));g.computeBoundingSphere();result.push({key,geometry:g})}return result;
  },[]);
  const label=R.useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#16110d';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#cfb078';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='35px Georgia';ctx.fillText('THE HORROR RECORD COLLECTION',512,55);ctx.font='17px Georgia';ctx.fillText('FACT’S 100 · SELECT A SLEEVE TO PLAY',512,101);const t=new CanvasTexture(c);t.colorSpace='srgb';return t},[]);
  const labelShader=R.useMemo(()=>shader=>{shader.uniforms.activeRecordTile=labelTile;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 activeRecordTile;').replace('#include <map_fragment>','diffuseColor*=texture2D(map,vMapUv*.096+activeRecordTile);')},[labelTile]);
  R.useLayoutEffect(()=>{const mesh=discs.current;if(!mesh)return;for(let i=0;i<100;i++){dummy.position.set(-2.275+i%15*.325,3.22-Math.floor(i/15)*.43,.36);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()},[]);
  R.useEffect(()=>{
   const load=e=>{const s=idle.current;s.rank=Math.min(100,Math.max(1,e.detail?.rank||1));s.progress=0;s.direction=1;s.playing=false;tile(s.rank,labelTile.value);if(flying.current)flying.current.visible=true};
   const playback=e=>{idle.current.playing=!!e.detail?.playing};
   const close=()=>{idle.current.playing=false;idle.current.direction=-1};
   window.addEventListener('gramophone-load',load);window.addEventListener('gramophone-playback',playback);window.addEventListener('gramophone-closed',close);
   return()=>{window.removeEventListener('gramophone-load',load);window.removeEventListener('gramophone-playback',playback);window.removeEventListener('gramophone-closed',close);recordGeometry.dispose();recordMaterial.dispose();staticMeshes.forEach(m=>m.geometry.dispose());Object.values(finishes).forEach(m=>m.dispose());label.dispose()};
  },[]);
  useFrame((state,delta)=>{
   if(document.hidden)return;const s=idle.current,dt=Math.min(.05,delta),moving=s.direction!==0;
   const desired=s.playing&&s.progress>=1?1:0;
   if(!moving&&!desired&&s.speed<.001&&Math.abs((arm.current?.rotation.y??-.75)+.75)<.002)return;
   if(moving){s.progress=reduced.matches?(s.direction>0?1:0):Math.min(1,Math.max(0,s.progress+s.direction*dt/.95));const pose=recordFlightPose(s.rank,s.progress);if(flying.current){flying.current.position.set(...pose.position);flying.current.rotation.x=-pose.tilt}if(s.progress===0||s.progress===1){s.direction=0;if(s.progress===0&&flying.current)flying.current.visible=false}}
   s.speed+=(desired-s.speed)*(1-Math.exp(-dt*5));
   if(spin.current&&!reduced.matches){s.angle=(s.angle+dt*s.speed*3.49)%(Math.PI*2);spin.current.rotation.y=s.angle}
   if(arm.current){const angle=desired?0:-.75;arm.current.rotation.y+=(angle-arm.current.rotation.y)*(1-Math.exp(-dt*5))}
   if(horn.current)horn.current.rotation.z=-.28+(desired&&!reduced.matches?Math.sin(state.clock.elapsedTime*7)*.003:0);
  });
  const open=rank=>{window.dispatchEvent(new CustomEvent('iswas:record-open',{detail:{rank}}))};
  const hover=e=>{if(!Number.isInteger(e.instanceId))return;e.stopPropagation();document.body.style.cursor='pointer';if(lastHover.current===e.instanceId)return;lastHover.current=e.instanceId;document.documentElement.dataset.hoveredRecord=String(e.instanceId+1)};
  return hs('group',{name:'Gramophone and 100 horror soundtrack records',children:[
   hs('group',{position:RECORD_STATION.shelf,rotation:[0,Math.PI,0],children:[
    ...staticMeshes.map(m=>h('mesh',{name:'Gramophone cabinet · '+m.key,geometry:m.geometry,material:finishes[m.key],castShadow:true,receiveShadow:true,raycast:emptyRaycast,dispose:null},m.key)),
    h('instancedMesh',{name:'100 selectable horror soundtrack sleeves',ref:discs,args:[recordGeometry,recordMaterial,100],onClick:e=>{if(e.delta>6)return;e.stopPropagation();open(e.instanceId+1)},onPointerOver:hover,onPointerMove:hover,onPointerOut:()=>{lastHover.current=-1;document.body.style.cursor=''},dispose:null}),
    hs('mesh',{position:[0,3.77,.4],raycast:emptyRaycast,children:[h('planeGeometry',{args:[4.5,.5]}),h('meshBasicMaterial',{map:label,toneMapped:false})]}),
    hs('group',{position:[.42,1.17,1.74],rotation:[.9,0,-.28],ref:horn,children:[
     hs('mesh',{material:finishes.brass,castShadow:true,receiveShadow:true,raycast:emptyRaycast,children:h('latheGeometry',{args:[[[.032,0],[.037,.11],[.055,.23],[.09,.35],[.16,.48],[.28,.6],[.43,.7],[.49,.73]].map(p=>new Vector2(...p)),mobile?32:56]})}),
     hs('mesh',{position:[0,.73,0],rotation:[Math.PI/2,0,0],material:finishes.brass,raycast:emptyRaycast,children:h('torusGeometry',{args:[.49,.013,8,mobile?32:56]})})
    ]}),
    hs('group',{ref:arm,position:[.25,1.22,1.6],rotation:[0,-.75,0],children:[
     hs('mesh',{material:finishes.brass,raycast:emptyRaycast,children:h('tubeGeometry',{args:[new Curve([[0,.025,0],[-.08,.025,.05],[-.15,.02,.23],[-.18,0,.28]].map(p=>new Vector3(...p))),mobile?12:20,.012,8,false]})}),
     hs('mesh',{position:[-.18,0,.28],rotation:[Math.PI/2,0,0],material:finishes.brass,raycast:emptyRaycast,children:h('cylinderGeometry',{args:[.026,.026,.035,16]})})
    ]}),
    hs('mesh',{position:[0,1.5,1.81],onClick:e=>{if(e.delta>6)return;e.stopPropagation();open(idle.current.rank)},children:[h('boxGeometry',{args:[1.15,1.4,1]}),h('meshBasicMaterial',{transparent:true,opacity:0,colorWrite:false,depthWrite:false})]})
   ]}),
   hs('group',{ref:flying,visible:false,children:hs('group',{ref:spin,children:[
    hs('mesh',{material:finishes.groove,raycast:emptyRaycast,children:h('cylinderGeometry',{args:[.16,.16,.006,mobile?40:72]})}),
    ...[.075,.105,.132,.15].map(r=>hs('mesh',{rotation:[Math.PI/2,0,0],position:[0,.0035,0],material:finishes.dark,raycast:emptyRaycast,children:h('torusGeometry',{args:[r,.0008,4,mobile?40:64]})},r)),
    hs('mesh',{rotation:[-Math.PI/2,0,0],position:[0,.004,0],raycast:emptyRaycast,children:[h('circleGeometry',{args:[.047,32]}),h('meshBasicMaterial',{map:atlas,onBeforeCompile:labelShader,customProgramCacheKey:()=> 'active-record-atlas-v1',toneMapped:false})]})
   ]})}),
   h(ContactShadow,{position:[-2.65,.022,6.35],size:[1.7,1.5]}),
   h('pointLight',{position:[-2.6,3.4,5.45],color:'#efd9ae',intensity:8,distance:6,decay:2})
  ]});
 }
 return {GramophoneStation};
}
