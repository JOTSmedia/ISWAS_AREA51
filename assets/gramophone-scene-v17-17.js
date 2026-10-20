import {RECORD_STATION,recordFlightPose} from './record-catalogue-v17-17.js';
import './record-player-v17-17.js';

// A double-walled eight-petal acoustic bell. The thin lip and raised seams are
// geometry; subtle patina and machining marks come from native 4K PBR maps.
export function gramophoneHornProfile(t){
 const u=Math.min(1,Math.max(0,t));return {radius:.034+.406*Math.pow(u,2.7),height:.68*u};
}
export function gramophoneHornSurface(radial=80,rows=32){
 const positions=[],uv=[],indices=[],stride=radial+1,layer=(rows+1)*stride;
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++){
  const t=j/rows,{radius,height}=gramophoneHornProfile(t);
  for(let i=0;i<=radial;i++){
   const a=i/radial*Math.PI*2,r=radius*(1+.022*Math.pow(t,3)*Math.cos(a*8))-(side?.0018:0);
   positions.push(Math.cos(a)*r,height,Math.sin(a)*r);uv.push(i/radial,t);
  }
 }
 const quad=(a,b,c,d,reverse=false)=>indices.push(...(reverse?[a,c,b,a,d,c]:[a,b,c,a,c,d]));
 for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<radial;i++){
  const a=side*layer+j*stride+i;quad(a,a+stride,a+stride+1,a+1,side===1);
 }
 for(let i=0;i<radial;i++){
  const a=rows*stride+i;quad(a,a+1,a+1+layer,a+layer);
  quad(i,i+layer,i+layer+1,i+1);
 }
 return {positions,uv,indices};
}

// One atlas and one instanced mesh hold the complete, independently pickable
// collection. Only the single record on the gramophone needs animation.
export function createGramophone({React:R,jsx:J,useFrame,BufferGeometry,BufferAttribute,InstancedBufferAttribute,BoxGeometry,CylinderGeometry,LatheGeometry,TorusGeometry,Shape,Vector2,Vector3,Object3D,Curve,CanvasTexture,MeshStandardMaterial,MeshPhysicalMaterial,MeshBasicMaterial,loadTexture,woodMap,ContactShadow}){
 const h=J.jsx,hs=J.jsxs,mobile=matchMedia('(max-width:767px)').matches||navigator.connection?.saveData;
 const tier=mobile?1024:innerWidth>=1600?4096:2048;
 const atlas=loadTexture(`/textures/records/sleeves-${tier}.webp`);atlas.wrapS=atlas.wrapT=1001;atlas.anisotropy=mobile?2:4;
 const emptyRaycast=()=>null;
 const surface=name=>{const t=loadTexture(`/textures/gramophone/${name}-${tier}.webp`);t.anisotropy=mobile?2:6;return t};
 const brassMap=surface('aged-brass'),brassRoughness=surface('brass-roughness');brassRoughness.colorSpace='';
 const walnut=loadTexture(`/textures/hospitality/walnut-${tier}.webp`);walnut.anisotropy=mobile?2:6;
 const geometryFrom=({positions,uv,indices})=>{const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(indices);g.computeVertexNormals();return g};
 const mergePieces=pieces=>{
  const obj=new Object3D(),positions=[],normals=[],uvs=[];
  for(const{geometry:g,position=[0,0,0],rotation=[0,0,0]}of pieces){
   obj.position.set(...position);obj.rotation.set(...rotation);obj.updateMatrix();g.applyMatrix4(obj.matrix);
   const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,ix=g.index;
   for(let j=0;j<(ix?ix.count:p.count);j++){const i=ix?ix.getX(j):j;positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(uv?.getX(i)||0,uv?.getY(i)||0)}g.dispose();
  }
  const merged=new BufferGeometry();merged.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));merged.setAttribute('normal',new BufferAttribute(new Float32Array(normals),3));merged.setAttribute('uv',new BufferAttribute(new Float32Array(uvs),2));merged.computeBoundingSphere();return merged;
 };
 // Rounded molding profiles carry actual edge highlights, even on small screens.
 const moldedBox=(width,height,depth,radius=.018)=>{
  const positions=[],uv=[],indices=[],ring=[],segs=mobile?3:5;
  for(let c=0;c<4;c++)for(let i=0;i<=segs;i++){
   const a=(c+i/segs)*Math.PI/2,cx=c===0||c===3?1:-1,cz=c<2?1:-1;
   ring.push([cx*(width/2-radius)+Math.cos(a)*radius,cz*(depth/2-radius)+Math.sin(a)*radius]);
  }
  const levels=[[-height/2,.012],[-height/2+.008,.004],[-height/2+.017,0],[height/2-.017,0],[height/2-.008,.004],[height/2,.012]],count=ring.length;
  for(const[y,inset]of levels)for(let i=0;i<count;i++){const[x,z]=ring[i];positions.push(x-Math.sign(x)*inset,y,z-Math.sign(z)*inset);uv.push(i/(count-1),y/height+.5)}
  for(let j=0;j<levels.length-1;j++)for(let i=0;i<count;i++){const a=j*count+i,b=j*count+(i+1)%count,c=b+count,d=a+count;indices.push(a,d,c,a,c,b)}
  for(const top of [false,true]){const offset=positions.length/3,y=top?height/2:-height/2;positions.push(0,y,0);uv.push(.5,.5);for(const[x,z]of ring){positions.push(x-Math.sign(x)*.012,y,z-Math.sign(z)*.012);uv.push(x/width+.5,z/depth+.5)}for(let i=0;i<count;i++){const a=offset+1+i,b=offset+1+(i+1)%count;indices.push(...(top?[offset,b,a]:[offset,a,b]))}}
  return geometryFrom({positions,uv,indices});
 };
 // Tube along a Catmull-Rom path, baked into a finish batch with its neighbors.
 const tube=(points,radius,segments=24,sides=mobile?6:8)=>{
  const curve=new Curve(points.map(p=>new Vector3(...p))),frames=curve.computeFrenetFrames(segments,false),positions=[],uv=[],indices=[];
  for(let i=0;i<=segments;i++){const p=curve.getPointAt(i/segments);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,c=Math.cos(a)*radius,s=Math.sin(a)*radius,n=frames.normals[i],b=frames.binormals[i];positions.push(p.x+n.x*c+b.x*s,p.y+n.y*c+b.y*s,p.z+n.z*c+b.z*s);uv.push(j/sides,i/segments)}}
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b+1,a,b+1,b)}
  return geometryFrom({positions,uv,indices});
 };
 const tile=(rank,out)=>{const i=rank-1;out.set(i%10*.1+.002,.9-Math.floor(i/10)*.1+.002);return out};
 function recordShader(shader){
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 recordTile;\nvarying vec2 vRecordTile;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRecordTile=recordTile;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vRecordTile;').replace('#include <map_fragment>','vec4 sampledDiffuseColor=texture2D(map,vMapUv*.096+vRecordTile);diffuseColor*=sampledDiffuseColor;');
 }
 function GramophoneStation(){
  const discs=R.useRef(null),flying=R.useRef(null),spin=R.useRef(null),arm=R.useRef(null),idle=R.useRef({rank:1,progress:0,direction:0,playing:false,speed:0,angle:0}),lastHover=R.useRef(-1);
  const reduced=R.useMemo(()=>matchMedia('(prefers-reduced-motion:reduce)'),[]);
  const dummy=R.useMemo(()=>new Object3D(),[]),labelTile=R.useMemo(()=>({value:new Vector2(.002,.902)}),[]);
  const recordGeometry=R.useMemo(()=>{const g=new BoxGeometry(.3,.3,.006),offsets=new Float32Array(200);for(let i=0;i<100;i++){offsets[i*2]=i%10*.1+.002;offsets[i*2+1]=.9-Math.floor(i/10)*.1+.002}g.setAttribute('recordTile',new InstancedBufferAttribute(offsets,2));return g},[]);
  const recordMaterial=R.useMemo(()=>new MeshBasicMaterial({map:atlas,onBeforeCompile:recordShader,customProgramCacheKey:()=> 'record-atlas-v1'}),[]);
  const finishes=R.useMemo(()=>({
   wood:new MeshPhysicalMaterial({map:walnut,color:'#f5dfc5',bumpMap:walnut,bumpScale:.0009,roughness:.3,clearcoat:.48,clearcoatRoughness:.23}),
   edge:new MeshPhysicalMaterial({map:walnut,color:'#ad8867',roughness:.34,clearcoat:.38,clearcoatRoughness:.28}),
   dark:new MeshStandardMaterial({color:'#171512',roughness:.67}),
   brass:new MeshPhysicalMaterial({map:brassMap,roughnessMap:brassRoughness,color:'#fff2d2',metalness:.92,roughness:1,clearcoat:.14,clearcoatRoughness:.3,envMapIntensity:1.1}),
   polished:new MeshPhysicalMaterial({color:'#cfb37f',metalness:.96,roughness:.24,envMapIntensity:1.15}),
   iron:new MeshStandardMaterial({color:'#242726',metalness:.8,roughness:.37}),
   felt:new MeshStandardMaterial({color:'#243c32',roughness:1}),
   groove:new MeshPhysicalMaterial({color:'#090c0e',roughness:.26,metalness:.13,clearcoat:.4,clearcoatRoughness:.22}),
   mica:new MeshPhysicalMaterial({color:'#a99c7f',roughness:.32,metalness:.24,clearcoat:.55})
  }),[]);
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
   // Turned walnut console, with actual moldings, joins and brass shoe ferrules.
   const lathe=(profile,key,p,rot)=>put(new LatheGeometry(profile.map(v=>new Vector2(...v)),mobile?16:24),key,p,rot);
   const rounded=(a,key,p,r=.018,rot)=>put(moldedBox(...a,r),key,p,rot);
   const pipe=(points,r,key)=>put(tube(points,r,mobile?18:28),key,[0,0,0]);
   const screw=(x,y,z,front=false)=>{
    cylinder(.006,.006,.004,'polished',[x,y,z],front?[Math.PI/2,0,0]:[0,0,0]);
    box(front?[.007,.001,.004]:[.007,.002,.001],'iron',front?[x,y,z+.0025]:[x,y+.0025,z]);
   };
   for(const x of [-.47,.47])for(const z of [1.47,2.15]){
    lathe([[0,0],[.042,0],[.044,.025],[.034,.055],[.028,.09],[.026,.43],[.042,.47],[.044,.52],[.034,.55],[.035,.74],[0,.74]],'wood',[x,.08,z]);
    cylinder(.043,.044,.035,'polished',[x,.08,z]);
    rounded([.102,.14,.105],'edge',[x,.785,z],.012);
   }
   for(const x of [-.47,.47])rounded([.055,.08,.71],'edge',[x,.29,1.81],.008);
   rounded([.98,.055,.055],'edge',[0,.29,1.81],.008);
   rounded([1.13,.09,.9],'wood',[0,.865,1.81],.025);
   rounded([1.18,.026,.94],'edge',[0,.918,1.81],.018);
   // A spring motor case of believable scale, not a brass-grilled loudspeaker.
   rounded([.79,.042,.67],'edge',[0,.949,1.81],.022);
   rounded([.735,.145,.605],'wood',[0,1.035,1.81],.026);
   rounded([.795,.026,.67],'edge',[0,1.112,1.81],.018);
   rounded([.82,.026,.694],'wood',[0,1.136,1.81],.018);
   for(const x of [-.347,.347])for(const z of [1.533,2.087]){
    rounded([.035,.132,.035],'edge',[x,1.033,z],.008);
    screw(x,1.079,z+.021,true);
   }
   // Recessed front panel and fine inlay are cabinetry, with no floating signage.
   rounded([.562,.095,.015],'edge',[0,1.033,2.116],.008);
   rounded([.535,.071,.012],'wood',[0,1.033,2.126],.008);
   for(const y of [.997,1.07])box([.536,.002,.003],'polished',[0,y,2.133]);
   // Felt-topped platter has room for a 12-inch record, and a real central spindle.
   cylinder(.184,.178,.024,'iron',[0,1.157,1.81]);
   cylinder(.181,.181,.006,'polished',[0,1.17,1.81]);
   cylinder(.172,.172,.005,'felt',[0,1.175,1.81]);
   cylinder(.004,.006,.03,'polished',[0,1.192,1.81]);
   // Brake, graduated speed lever, tonearm bearing and rest.
   rounded([.055,.009,.038],'iron',[-.22,1.155,1.91],.006);
   pipe([[-.22,1.162,1.91],[-.19,1.17,1.94],[-.166,1.17,1.95]],.005,'polished');
   cylinder(.012,.012,.006,'iron',[-.22,1.164,1.91]);
   rounded([.09,.006,.032],'polished',[-.23,1.152,1.69],.005,[0,-.3,0]);
   pipe([[-.253,1.157,1.69],[-.244,1.18,1.684],[-.24,1.184,1.68]],.003,'iron');
   for(let i=0;i<7;i++)box([.001,.001,.008],'iron',[-.269+i*.011,1.156,1.687-i*.003]);
   cylinder(.038,.046,.016,'iron',[.25,1.158,1.6]);
   cylinder(.026,.029,.06,'polished',[.25,1.196,1.6]);
   cylinder(.008,.011,.053,'iron',[-.072,1.177,1.682]);
   pipe([[-.086,1.203,1.682],[-.08,1.212,1.682],[-.065,1.212,1.682],[-.058,1.203,1.682]],.003,'polished');
   // Offset winding crank: rosette, horizontal axle, drop and freely turning grip.
   cylinder(.033,.033,.016,'polished',[.377,1.027,1.82],[0,0,Math.PI/2]);
   cylinder(.011,.011,.17,'iron',[.455,1.027,1.82],[0,0,Math.PI/2]);
   pipe([[.532,1.027,1.82],[.545,1.025,1.82],[.55,.945,1.82],[.57,.929,1.82],[.645,.929,1.82]],.011,'polished');
   lathe([[0,0],[.02,0],[.026,.012],[.029,.035],[.028,.072],[.02,.095],[0,.1]],'edge',[.64,.929,1.82],[0,0,-Math.PI/2]);
   cylinder(.012,.012,.01,'polished',[.747,.929,1.82],[0,0,Math.PI/2]);
   // Rear acoustic elbow and cast support are visibly connected to the bell.
   rounded([.14,.027,.14],'iron',[.31,1.16,1.49],.014);
   pipe([[.31,1.17,1.49],[.31,1.32,1.49],[.31,1.4,1.53],[.32,1.45,1.62]],.033,'brass');
   pipe([[.25,1.23,1.6],[.26,1.29,1.54],[.31,1.3,1.49]],.021,'brass');
   pipe([[.33,1.15,1.47],[.41,1.25,1.43],[.43,1.47,1.48],[.4,1.58,1.57]],.012,'iron');
   for(const[x,z]of [[.26,1.445],[.36,1.445],[.26,1.535],[.36,1.535]])screw(x,1.177,z);
   const hornObject=new Object3D();hornObject.position.set(.32,1.45,1.62);hornObject.rotation.set(.95,0,-.2);hornObject.updateMatrix();
   const hornPart=(geo,key)=>{geo.applyMatrix4(hornObject.matrix);put(geo,key,[0,0,0])};
   hornPart(geometryFrom(gramophoneHornSurface(mobile?56:88,mobile?24:36)),'brass');
   // Rolled edge follows the petal shape rather than cutting across a flat disc.
   const lip=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,r=.44*(1+.022*Math.cos(a*8));lip.push([Math.cos(a)*r,.68,Math.sin(a)*r])}
   hornPart(tube(lip,.0045,mobile?64:96,mobile?5:7),'polished');
   for(let petal=0;petal<8;petal++){
    const a=petal/8*Math.PI*2,path=[];
    for(let j=0;j<=18;j++){const t=j/18,{radius,height}=gramophoneHornProfile(t),r=radius*(1+.022*Math.pow(t,3))+.0014;path.push([Math.cos(a)*r,height,Math.sin(a)*r])}
    hornPart(tube(path,.0015,mobile?18:28,5),'polished');
   }
   const throat=new CylinderGeometry(.032,.032,.002,mobile?24:36);throat.translate(0,.001,0);hornPart(throat,'dark');
   const result=[];for(const[key,d]of parts){const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(d.p),3));g.setAttribute('normal',new BufferAttribute(new Float32Array(d.n),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(d.uv),2));g.computeBoundingSphere();result.push({key,geometry:g})}return result;
  },[]);
  const tonearmGeometry=R.useMemo(()=>tube([[0,.012,0],[-.07,.018,.035],[-.13,.014,.15],[-.17,.004,.25],[-.18,0,.28]],.015,mobile?20:32,mobile?8:12),[]);
  const armTrimGeometry=R.useMemo(()=>mergePieces([
   {geometry:tube([[-.18,-.022,.28],[-.18,-.027,.282],[-.176,-.034,.288]],.0012,8,5)},
   {geometry:new TorusGeometry(.028,.004,6,mobile?24:40),position:[-.19,0,.28],rotation:[0,Math.PI/2,0]},
   ...[-1,1].flatMap(y=>[-1,1].map(z=>({geometry:new CylinderGeometry(.002,.002,.002,6),position:[-.196,y*.017,z*.017+.28],rotation:[0,0,Math.PI/2]})))
  ]),[]);
  const vinylGeometry=R.useMemo(()=>mergePieces([
   {geometry:new CylinderGeometry(.16,.16,.006,mobile?40:72)},
   ...[.075,.105,.132,.15].map(r=>({geometry:new TorusGeometry(r,.00035,3,mobile?40:64),position:[0,.0035,0],rotation:[Math.PI/2,0,0]}))
  ]),[]);
  const labelShader=R.useMemo(()=>shader=>{shader.uniforms.activeRecordTile=labelTile;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 activeRecordTile;').replace('#include <map_fragment>','diffuseColor*=texture2D(map,vMapUv*.096+activeRecordTile);')},[labelTile]);
  R.useLayoutEffect(()=>{const mesh=discs.current;if(!mesh)return;for(let i=0;i<100;i++){dummy.position.set(-2.275+i%15*.325,3.22-Math.floor(i/15)*.43,.36);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()},[]);
  R.useEffect(()=>{
   const data=document.documentElement.dataset;
   data.gramophoneStaticDraws=String(staticMeshes.length);
   data.gramophoneStaticTriangles=String(staticMeshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0));
   data.gramophoneGeometryValid=String(staticMeshes.every(m=>m.geometry.attributes.position.array.every(Number.isFinite)&&m.geometry.attributes.normal.array.every(Number.isFinite)));
   window.__shadowRefresh=true;
   const load=e=>{const s=idle.current;s.rank=Math.min(100,Math.max(1,e.detail?.rank||1));s.progress=0;s.direction=1;s.playing=false;tile(s.rank,labelTile.value);if(flying.current)flying.current.visible=true};
   const playback=e=>{idle.current.playing=!!e.detail?.playing};
   const close=()=>{idle.current.playing=false;idle.current.direction=-1};
   window.addEventListener('gramophone-load',load);window.addEventListener('gramophone-playback',playback);window.addEventListener('gramophone-closed',close);
   return()=>{window.removeEventListener('gramophone-load',load);window.removeEventListener('gramophone-playback',playback);window.removeEventListener('gramophone-closed',close);recordGeometry.dispose();recordMaterial.dispose();tonearmGeometry.dispose();armTrimGeometry.dispose();vinylGeometry.dispose();staticMeshes.forEach(m=>m.geometry.dispose());Object.values(finishes).forEach(m=>m.dispose())};
  },[]);
  useFrame((state,delta)=>{
   if(document.hidden)return;const s=idle.current,dt=Math.min(.05,delta),moving=s.direction!==0;
   const desired=s.playing&&s.progress>=1?1:0;
   if(!moving&&!desired&&s.speed<.001&&Math.abs((arm.current?.rotation.y??-.75)+.75)<.002)return;
   if(moving){s.progress=reduced.matches?(s.direction>0?1:0):Math.min(1,Math.max(0,s.progress+s.direction*dt/.95));const pose=recordFlightPose(s.rank,s.progress);if(flying.current){flying.current.position.set(...pose.position);flying.current.rotation.x=-pose.tilt}if(s.progress===0||s.progress===1){s.direction=0;if(s.progress===1)window.__recordCloseup=true;if(s.progress===0&&flying.current)flying.current.visible=false}}
   s.speed+=(desired-s.speed)*(1-Math.exp(-dt*5));
   if(spin.current&&!reduced.matches){s.angle=(s.angle+dt*s.speed*3.49)%(Math.PI*2);spin.current.rotation.y=s.angle}
   if(arm.current){const angle=desired?0:-.75;arm.current.rotation.y+=(angle-arm.current.rotation.y)*(1-Math.exp(-dt*5))}
   // The rigid acoustic horn stays still; record spin and the tonearm carry playback.
  });
  const open=rank=>{window.dispatchEvent(new CustomEvent('iswas:record-open',{detail:{rank}}))};
  const hover=e=>{if(!Number.isInteger(e.instanceId))return;e.stopPropagation();document.body.style.cursor='pointer';if(lastHover.current===e.instanceId)return;lastHover.current=e.instanceId;document.documentElement.dataset.hoveredRecord=String(e.instanceId+1)};
  return hs('group',{name:'Gramophone and 100 horror soundtrack records',children:[
   hs('group',{position:RECORD_STATION.shelf,rotation:[0,Math.PI,0],children:[
    ...staticMeshes.map(m=>h('mesh',{name:'Gramophone cabinet · '+m.key,geometry:m.geometry,material:finishes[m.key],castShadow:true,receiveShadow:true,raycast:emptyRaycast,dispose:null},m.key)),
    h('instancedMesh',{name:'100 selectable horror soundtrack sleeves',ref:discs,args:[recordGeometry,recordMaterial,100],onClick:e=>{if(e.delta>6)return;e.stopPropagation();open(e.instanceId+1)},onPointerOver:hover,onPointerMove:hover,onPointerOut:()=>{lastHover.current=-1;document.body.style.cursor=''},dispose:null}),
    hs('group',{name:'Acoustic tonearm, diaphragm and steel needle',ref:arm,position:[.25,1.22,1.6],rotation:[0,-.75,0],children:[
     h('mesh',{geometry:tonearmGeometry,material:finishes.brass,castShadow:true,raycast:emptyRaycast,dispose:null}),
     hs('mesh',{position:[-.18,0,.28],rotation:[0,0,Math.PI/2],material:finishes.iron,raycast:emptyRaycast,children:h('cylinderGeometry',{args:[.03,.03,.017,mobile?20:32]})}),
     h('mesh',{geometry:armTrimGeometry,material:finishes.polished,raycast:emptyRaycast,dispose:null}),
     hs('mesh',{position:[-.195,0,.28],rotation:[0,0,Math.PI/2],material:finishes.mica,raycast:emptyRaycast,children:h('cylinderGeometry',{args:[.024,.024,.001,mobile?20:32]})}),
    ]}),
    hs('mesh',{position:[0,1.5,1.81],onClick:e=>{if(e.delta>6)return;e.stopPropagation();open(idle.current.rank)},children:[h('boxGeometry',{args:[1.15,1.4,1]}),h('meshBasicMaterial',{transparent:true,opacity:0,colorWrite:false,depthWrite:false})]})
   ]}),
   hs('group',{ref:flying,visible:false,children:hs('group',{ref:spin,children:[
    h('mesh',{geometry:vinylGeometry,material:finishes.groove,raycast:emptyRaycast,dispose:null}),
    hs('mesh',{rotation:[-Math.PI/2,0,0],position:[0,.004,0],raycast:emptyRaycast,children:[h('circleGeometry',{args:[.047,32]}),h('meshBasicMaterial',{map:atlas,onBeforeCompile:labelShader,customProgramCacheKey:()=> 'active-record-atlas-v1',toneMapped:false})]})
   ]})}),
   h(ContactShadow,{position:[-2.65,.022,6.35],size:[1.7,1.5]}),
   h('pointLight',{position:[-2.6,3.4,5.45],color:'#efd9ae',intensity:8,distance:6,decay:2})
  ]});
 }
 return {GramophoneStation};
}
