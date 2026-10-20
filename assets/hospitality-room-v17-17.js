/* Static, native 3D furniture. One mesh per finish, no animation loop, no network assets.
   Coordinates are metres. Piano proportions reference Steinway's Model D (2.74 × 1.56 m).
   This is a custom gallery model, not a manufacturer CAD reproduction. */
export const ROOM_ADDITIONS=Object.freeze({
 piano:{position:[46.0,0,6.3],yaw:Math.PI/4,bench:[0,.49,1.48]},
 wine:{position:[27.6,0,8.16],width:4.6},
 bar:{position:[34.0,0,8.16],width:6.8},
 cigars:{position:[40.8,0,6.6],width:5.2}
});
export const ROOM_RUGS=Object.freeze({
 piano:{position:[46,.028,6.22],rotation:[0,Math.PI/4,0],size:[3,4]},
 bar:{position:[34,.028,5.45],rotation:[0,0,0],size:[6.65,2.45]},
 cigars:{position:[40.8,.028,6.12],rotation:[0,Math.PI/2,0],size:[2.95,4.7]}
});

// Local authoring camera only. Shipping navigation never enables this path.
const reviewEnabled=typeof location!=='undefined'&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&new URLSearchParams(location.search).has('room-review');
export function frameHospitalityReview(camera){
 if(!reviewEnabled)return false;
 const views={gramophone:[[-1.3,1.8,4.8],[-2.65,1.5,6.3]],records:[[.3,2.2,3.25],[-2.65,1.9,7.7]],piano:[[47.8,2.2,8.45],[46,1,6.25]],wine:[[27.6,2.1,3.5],[27.6,1.7,8.16]],bar:[[34,2.15,1.1],[34,1.5,6.5]],cigars:[[40.8,2.1,2.3],[40.8,1,6.8]],room:[[36,3.9,-1.8],[37.7,1.3,6.7]]};
 const name=document.documentElement.dataset.roomReview||'piano',shot=views[name]||views.piano;
 camera.position.set(...shot[0]);
 if(camera.aspect<1&&name!=='piano'){const factor=1.55;camera.position.set(shot[1][0]+(shot[0][0]-shot[1][0])*factor,shot[0][1],shot[1][2]+(shot[0][2]-shot[1][2])*factor)}
 camera.lookAt(...shot[1]);
 const fov=name==='room'?66:camera.aspect<1?68:48;
 if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}
 return true;
}

export function createHospitalityRoom({React:R,jsx:J,useFrame,BufferGeometry,BufferAttribute,
 BoxGeometry,CylinderGeometry,LatheGeometry,SphereGeometry,TorusGeometry,
 ExtrudeGeometry,RoundedBox,Shape,Path,Vector2,Vector3,Object3D,CanvasTexture,
 MeshStandardMaterial,MeshPhysicalMaterial,MeshBasicMaterial,woodMap,woodHeight,
 clothMap,loadTexture,ContactShadow,LodgeLamp}){
 const h=J.jsx,hs=J.jsxs;
 const mobile=matchMedia('(max-width:767px)').matches||navigator.connection?.saveData;
 const radial=mobile?12:20;
 const nullRaycast=()=>null;
 function createModel(){
 const tier=mobile?1024:innerWidth>=1600?4096:2048;
  const surface=name=>{const t=loadTexture(`/textures/hospitality/${name}-${tier}.webp`);t.anisotropy=mobile?2:8;return t};
  const walnutSurface=surface('walnut'),leatherHeight=surface('leather-height'),marbleSurface=surface('marble');
 leatherHeight.colorSpace='';
  const leatherPhoto=loadTexture('/textures/v56/leather.webp');

  const buckets=new Map(),textures=[];
  const material={
   ebony:new MeshPhysicalMaterial({color:'#111317',roughness:.19,metalness:.08,clearcoat:1,clearcoatRoughness:.11}),
   satin:new MeshStandardMaterial({color:'#17191b',roughness:.45,metalness:.16}),
   ivory:new MeshStandardMaterial({color:'#f3eddc',roughness:.28}),
   gold:new MeshStandardMaterial({color:'#ad8244',roughness:.28,metalness:.78}),
   string:new MeshStandardMaterial({color:'#b1a48e',roughness:.38,metalness:.73}),
   soundboard:new MeshStandardMaterial({color:'#b99251',map:woodMap,roughness:.6}),
   wood:new MeshStandardMaterial({color:'#e0c4a2',map:walnutSurface,bumpMap:walnutSurface,bumpScale:.004,roughness:.34}),
   darkwood:new MeshStandardMaterial({color:'#64534a',map:walnutSurface,bumpMap:walnutSurface,bumpScale:.004,roughness:.45}),
   leather:new MeshPhysicalMaterial({color:'#947963',map:leatherPhoto,bumpMap:leatherHeight,bumpScale:.0016,roughness:.63,clearcoat:.16,clearcoatRoughness:.58}),
   velvet:new MeshStandardMaterial({color:'#26191b',bumpMap:leatherHeight,bumpScale:.001,roughness:.94}),
   marble:new MeshPhysicalMaterial({color:'#f0e8dd',map:marbleSurface,bumpMap:marbleSurface,bumpScale:.0004,roughness:.24,metalness:0,clearcoat:.42,clearcoatRoughness:.16}),
   green:new MeshPhysicalMaterial({color:'#163023',roughness:.15,metalness:0,ior:1.5,clearcoat:1,clearcoatRoughness:.09}),
   amber:new MeshPhysicalMaterial({color:'#623a18',roughness:.15,metalness:0,ior:1.5,clearcoat:1,clearcoatRoughness:.09}),
   burgundy:new MeshPhysicalMaterial({color:'#35141e',roughness:.15,metalness:0,ior:1.5,clearcoat:1,clearcoatRoughness:.09}),
   glass:new MeshPhysicalMaterial({color:'#d8ddd5',roughness:.12,metalness:0,ior:1.5,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.3,depthWrite:false}),
   paper:new MeshStandardMaterial({color:'#c6b58b',roughness:.8}),
   cigar:new MeshStandardMaterial({color:'#61402a',map:woodMap,roughness:.9}),
   warm:new MeshBasicMaterial({color:'#e3b36a',toneMapped:false}),
  };
  // Bake every piece's transform and vertex normals once. Hundreds of keys,
  // bottles and trim details share a small set of draw calls on every device.
  const transform=new Object3D(),point=new Vector3(),normal=new Vector3();
  function add(geometry,finish,p=[0,0,0],rot=[0,0,0],parent=null){
   transform.position.set(...p);transform.rotation.set(...rot);transform.scale.set(1,1,1);transform.updateMatrix();
   if(parent)transform.matrix.premultiply(parent);
   geometry.applyMatrix4(transform.matrix);
   const pos=geometry.attributes.position,nor=geometry.attributes.normal,uv=geometry.attributes.uv,index=geometry.index;
   let bucket=buckets.get(finish);if(!bucket){bucket={positions:[],normals:[],uvs:[]};buckets.set(finish,bucket)}
   const count=index?index.count:pos.count;
   for(let j=0;j<count;j++){
    const i=index?index.getX(j):j;
    bucket.positions.push(pos.getX(i),pos.getY(i),pos.getZ(i));
    bucket.normals.push(nor.getX(i),nor.getY(i),nor.getZ(i));
    bucket.uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
   }
   geometry.dispose();
  }
  const frame=(position,rot=[0,0,0])=>{const obj=new Object3D();obj.position.set(...position);obj.rotation.set(...rot);obj.updateMatrix();return obj.matrix.clone()};
  const box=(size,finish,p,rot=[0,0,0],parent)=>add(new BoxGeometry(...size),finish,p,rot,parent);
  const rounded=(size,r,finish,p,rot=[0,0,0],parent)=>add(new RoundedBox(...size,mobile?2:3,r),finish,p,rot,parent);
  const cylinder=(top,bottom,height,finish,p,rot=[0,0,0],parent)=>add(new CylinderGeometry(top,bottom,height,radial),finish,p,rot,parent);
  const sphere=(radius,finish,p,parent)=>add(new SphereGeometry(radius,radial,8),finish,p,[0,0,0],parent);
  const bar=(a,b,r,finish,parent)=>{
   point.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
   const obj=new Object3D();obj.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
   obj.quaternion.setFromUnitVectors(normal.set(0,1,0),point.clone().normalize());obj.updateMatrix();
   if(parent)obj.matrix.premultiply(parent);
   add(new CylinderGeometry(r,r,point.length(),mobile?6:8),finish,[0,0,0],[0,0,0],obj.matrix);
  };
  function label(text,width,height,p,rot=[0,0,0],parent,finish='gold'){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
   const c=canvas.getContext('2d');c.clearRect(0,0,512,128);
   c.fillStyle=finish==='gold'?'#c6a76d':'#e8d8b5';c.textAlign='center';c.textBaseline='middle';
   c.font=`${text.length>17?25:34}px Georgia,serif`;c.fillText(text,256,64,490);
   const texture=new CanvasTexture(canvas);texture.colorSpace='srgb';textures.push(texture);
   const key='label-'+textures.length;
   material[key]=new MeshBasicMaterial({map:texture,transparent:true,alphaTest:.15,toneMapped:false,depthWrite:false});
   // A very thin slab with only its front face is unnecessary; use plane data.
   const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array([-width/2,-height/2,0,width/2,-height/2,0,width/2,height/2,0,-width/2,-height/2,0,width/2,height/2,0,-width/2,height/2,0]),3));
   geometry.setAttribute('normal',new BufferAttribute(new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1]),3));
   geometry.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]),2));add(geometry,key,p,rot,parent);
  }
  function outline(){
   const s=new Shape();s.moveTo(-.78,-.46);s.lineTo(.78,-.46);s.lineTo(.78,-.12);
   s.bezierCurveTo(.77,.23,.31,.3,.31,.75);
   s.bezierCurveTo(.32,1.15,.39,1.63,.01,1.77);
   s.bezierCurveTo(-.28,1.91,-.77,1.81,-.78,1.35);s.lineTo(-.78,-.46);s.closePath();return s;
  }
  const extrude=(shape,depth,finish,p,rot,parent)=>add(new ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.006,curveSegments:mobile?12:22}),finish,p,rot,parent);
  const piano=frame(ROOM_ADDITIONS.piano.position,[0,ROOM_ADDITIONS.piano.yaw,0]);
  // The keyboard faces the rear/east corner. The seated player's back is to
  // that corner, looking diagonally toward the room and Akkad's portrait.
  extrude(outline(),.22,'ebony',[0,.82,0],[-Math.PI/2,0,0],piano);
  extrude(outline(),.018,'soundboard',[0,1.045,0],[-Math.PI/2,0,0],piano);
  const harp=outline();
  for(const [x,y,rx,ry]of [[-.34,.89,.19,.51],[.13,.29,.2,.24],[-.42,-.06,.18,.2]]){
   const hole=new Path();hole.absellipse(x,y,rx,ry,0,Math.PI*2,true,0);harp.holes.push(hole);
  }
  const harpGeo=new ExtrudeGeometry(harp,{depth:.025,bevelEnabled:true,bevelSize:.007,bevelThickness:.005,bevelSegments:1,curveSegments:mobile?12:22});
  harpGeo.scale(.91,.91,1);add(harpGeo,'gold',[0,1.069,0],[-Math.PI/2,0,0],piano);
  // Open lid: hinge is on the straight bass edge; the curved side rises.
  const lid=frame([-.78,1.09,0],[0,0,.63]);lid.premultiply(piano);
  // Shape has no translate method in some Three revisions; move geometry.
  const lidGeo=new ExtrudeGeometry(outline(),{depth:.035,bevelEnabled:true,bevelSize:.008,bevelThickness:.007,bevelSegments:2,curveSegments:mobile?12:22});
  lidGeo.rotateX(-Math.PI/2);lidGeo.translate(.78,0,0);add(lidGeo,'ebony',[0,0,0],[0,0,0],lid);
  bar([.53,1.09,-.27],[.28,1.86,-.27],.017,'ebony',piano);
  // Three tapered legs, brass casters, pedal lyre and three individual pedals.
  for(const [x,z]of [[-.65,.42],[.64,.35],[-.3,-1.5]]){
   cylinder(.058,.039,.74,'ebony',[x,.45,z],[0,0,0],piano);
   cylinder(.065,.065,.05,'gold',[x,.085,z],[Math.PI/2,0,0],piano);
   rounded([.14,.07,.16],.018,'ebony',[x,.82,z],[0,0,0],piano);
  }
  bar([-.18,.82,.34],[-.11,.19,.36],.018,'gold',piano);
  bar([.18,.82,.34],[.11,.19,.36],.018,'gold',piano);
  box([.35,.055,.11],'ebony',[0,.19,.36],[0,0,0],piano);
  for(const x of [-.10,0,.10])rounded([.055,.025,.2],.009,'gold',[x,.14,.48],[0,0,0],piano);
  // 52 separated ivory naturals and 36 black accidentals: all 88 keys.
  box([1.58,.08,.44],'ebony',[0,.76,.71],[0,0,0],piano);
  for(let i=0;i<52;i++)box([.0254,.045,.36],'ivory',[-.702+i*.0275,.825,.72],[0,0,0],piano);
  const blackAfter=[0,2,3,5,6]; // A,B,C,D,E,F,G; last C has no accidental.
  for(let i=0;i<51;i++)if(blackAfter.includes(i%7))box([.016,.048,.22],'ebony',[-.688+i*.0275,.866,.65],[0,0,0],piano);
  rounded([1.59,.09,.075],.015,'ebony',[0,.905,.48],[0,0,0],piano);
  box([1.48,.15,.045],'ebony',[0,.98,.49],[-.12,0,0],piano);
  label('STEINWAY & SONS',.61,.13,[0,.99,.518],[0,0,0],piano);
  // Music desk, gold harp ribs and fine strings visible beneath the open lid.
  rounded([.7,.24,.025],.015,'ebony',[0,1.17,.15],[-.35,0,0],piano);
  for(const x of [-.66,-.35,0,.29])bar([x,1.078,.25],[Math.min(x,.14),1.078,-1.35],.018,'gold',piano);
  for(let i=0;i<(mobile?32:64);i++){
   const x=-.63+i*(1.22/(mobile?31:63));
   const length=1.72-(x+.63)*.92;
   bar([x,1.106,.29],[x*.28-.16,1.106,.29-length],.0014,'string',piano);
  }
  for(const [x,z]of [[-.64,.27],[.59,.27],[-.3,-1.5]])sphere(.024,'gold',[x,1.09,z],piano);
  rounded([.88,.12,.39],.045,'leather',[0,.5,1.48],[0,0,0],piano);
  box([.84,.09,.35],'ebony',[0,.42,1.48],[0,0,0],piano);
  for(const x of [-.34,.34])for(const z of [1.36,1.6])cylinder(.025,.019,.39,'ebony',[x,.23,z],[0,0,0],piano);
  for(const x of [-.25,0,.25])sphere(.008,'satin',[x,.565,1.48],piano);

  // Rear wall sequence: wine cellar, cocktail bar, then the cigar salon.
  function cabinet(parent,width,height,depth){
   box([width,height,.1],'darkwood',[0,height/2,-depth/2],[0,0,0],parent);
   for(const x of [-width/2,width/2])rounded([.1,height,depth],.012,'wood',[x,height/2,0],[0,0,0],parent);
   for(const y of [.08,height])rounded([width+.12,.13,depth+.08],.018,'wood',[0,y,0],[0,0,0],parent);
  }
  const bottleProfile=[[0,0],[.055,0],[.063,.02],[.063,.23],[.06,.26],[.025,.31],[.022,.4],[.023,.43],[0,.43]];
  function bottle(x,y,z,index,parent,{lying=false,scale=1}={}){
   const geo=new LatheGeometry(bottleProfile.map(([r,h])=>new Vector2(r*scale,h*scale)),radial);
   add(geo,index%5===0?'burgundy':index%3===0?'amber':'green',[x,y,z],lying?[Math.PI/2,0,0]:[0,0,0],parent);
   if(lying){
    cylinder(.027*scale,.027*scale,.065*scale,'gold',[x,y,z+.397*scale],[Math.PI/2,0,0],parent);
   }else{
    cylinder(.024*scale,.024*scale,.06*scale,'gold',[x,y+.408*scale,z],[0,0,0],parent);
    cylinder(.064*scale,.064*scale,.1*scale,'paper',[x,y+.16*scale,z],[0,0,0],parent);
   }
  }
  const wine=frame(ROOM_ADDITIONS.wine.position,[0,Math.PI,0]);
  cabinet(wine,4.6,3.35,.6);
  box([4.4,.8,.53],'darkwood',[0,.49,.02],[0,0,0],wine);
  for(const x of [-1.63,-.55,.55,1.63]){
   box([1.02,.64,.035],'wood',[x,.49,.31],[0,0,0],wine);
   cylinder(.022,.022,.07,'gold',[x,.54,.35],[Math.PI/2,0,0],wine);
  }
  for(let row=0;row<4;row++){
   const y=1.01+row*.43;
   box([4.42,.045,.56],'wood',[0,y-.09,.02],[0,0,0],wine);
   box([4.35,.015,.016],'warm',[0,y-.06,.26],[0,0,0],wine);
   for(let col=0;col<14;col++){
    const x=-2.04+col*.314;
    bottle(x,y+.055,-.17,row*14+col,wine,{lying:true});
    for(const dx of [-.085,.085])bar([x+dx,y-.05,-.16],[x+dx*.25,y-.035,.19],.012,'gold',wine);
   }
  }
  box([4.38,.025,.025],'gold',[0,2.81,.31],[0,0,0],wine);

  const barFrame=frame(ROOM_ADDITIONS.bar.position,[0,Math.PI,0]);
  // Back bar against the shelf wall, with warm shelf strips and fluted joinery.
  cabinet(barFrame,6.8,3.35,.42);
  for(const y of [1.03,1.75,2.43]){
   box([6.53,.075,.48],'wood',[0,y,0],[0,0,0],barFrame);
   box([6.46,.018,.02],'warm',[0,y+.045,.22],[0,0,0],barFrame);
  }
  for(let row=0;row<2;row++)for(let i=0;i<18;i++)bottle(-2.89+i*.34,1.08+row*.72,0,row*18+i,barFrame,{scale:.86+(i%3)*.07});
  // Counter is on the room side (+local Z), leaving a bartender's aisle.
  box([6.85,1.05,.62],'darkwood',[0,.57,1.52],[0,0,0],barFrame);
  for(let i=0;i<43;i++)rounded([.047,.83,.045],.012,'wood',[-3.25+i*.155,.57,1.85],[0,0,0],barFrame);
  rounded([7.06,.095,.91],.025,'marble',[0,1.16,1.56],[0,0,0],barFrame);
  box([7.05,.025,.86],'gold',[0,1.103,1.56],[0,0,0],barFrame);
  bar([-3.25,.22,1.99],[3.25,.22,1.99],.026,'gold',barFrame);
  for(const x of [-2.8,0,2.8])bar([x,.22,1.99],[x,.12,1.84],.021,'gold',barFrame);
  for(const x of [-2.35,0,2.35]){
   cylinder(.23,.25,.08,'velvet',[x,.83,2.66],[0,0,0],barFrame);
   cylinder(.19,.22,.035,'gold',[x,.775,2.66],[0,0,0],barFrame);
   for(const dx of [-.14,.14])for(const dz of [-.14,.14])bar([x+dx,.74,2.66+dz],[x+dx*1.5,.035,2.66+dz*1.5],.023,'satin',barFrame);
   add(new TorusGeometry(.19,.012,6,20),'gold',[x,.34,2.66],[Math.PI/2,0,0],barFrame);
  }
  bottle(2.4,1.215,1.54,2,barFrame,{scale:.8});bottle(2.64,1.215,1.54,3,barFrame,{scale:.7});
  cylinder(.25,.25,.025,'gold',[-1.9,1.22,1.52],[0,0,0],barFrame);
  for(const x of [-2.01,-1.79]){
   cylinder(.042,.037,.11,'glass',[x,1.29,1.52],[0,0,0],barFrame);
   cylinder(.038,.038,.018,'amber',[x,1.31,1.52],[0,0,0],barFrame);
  }

  const cigar=frame(ROOM_ADDITIONS.cigars.position,[0,Math.PI,0]);
  function clubChair(x,z,yaw){
   const t=frame([x,0,z],[0,yaw,0]);t.premultiply(cigar);
   rounded([1.13,.29,1.02],.11,'leather',[0,.35,0],[0,0,0],t);
   rounded([1.1,.89,.23],.1,'leather',[0,.94,-.39],[-.09,0,0],t);
   rounded([.75,.16,.76],.07,'leather',[0,.58,.03],[0,0,0],t);
   for(const side of [-1,1]){
    rounded([.28,.46,.99],.12,'leather',[side*.51,.67,0],[0,0,0],t);
    bar([side*.57,.23,.4],[side*.57,.23,-.4],.014,'gold',t);
   }
   for(const x of [-.41,.41])for(const z of [-.34,.34])cylinder(.035,.024,.2,'darkwood',[x,.11,z],[0,0,0],t);
   for(const x of [-.26,0,.26])for(const y of [.86,1.1])sphere(.013,'darkwood',[x,y,-.253],t);
  }
  clubChair(-1.35,.18,.25);clubChair(1.35,.18,-.25);
  rounded([1.3,.075,.84],.06,'darkwood',[0,.53,.8],[0,0,0],cigar);
  for(const x of [-.5,.5])for(const z of [.51,1.08])cylinder(.025,.021,.49,'gold',[x,.27,z],[0,0,0],cigar);
  cylinder(.13,.13,.035,'glass',[.31,.585,.86],[0,0,0],cigar);
  for(let i=0;i<3;i++)cylinder(.011,.011,.16,'cigar',[-.28+i*.055,.59,.78],[Math.PI/2,0,.12],cigar);
  // Low glazed humidor and cigar trays on the back wall.
  const humidor=frame([0,0,-1.45]);humidor.premultiply(cigar);
  cabinet(humidor,3.9,1.3,.46);
  box([3.68,.04,.51],'marble',[0,1.35,0],[0,0,0],humidor);
  for(const x of [-1.33,0,1.33]){
   box([1.18,.83,.035],'wood',[x,.76,.25],[0,0,0],humidor);
   box([1.03,.64,.018],'satin',[x,.77,.277],[0,0,0],humidor);
   for(let row=0;row<3;row++){
    box([.91,.035,.24],'soundboard',[x,.55+row*.19,.37],[0,0,0],humidor);
    for(let i=0;i<8;i++)cylinder(.021,.021,.19,'cigar',[x-.35+i*.1,.6+row*.19,.38],[Math.PI/2,0,0],humidor);
   }
   sphere(.025,'gold',[x+.45,.8,.51],humidor);
  }
  // Finish the static batches. No texture downloads or per-frame React work.
  const meshes=[];let triangles=0;
  for(const [finish,bucket]of buckets){
   const geometry=new BufferGeometry();
   geometry.setAttribute('position',new BufferAttribute(new Float32Array(bucket.positions),3));
   geometry.setAttribute('normal',new BufferAttribute(new Float32Array(bucket.normals),3));
   geometry.setAttribute('uv',new BufferAttribute(new Float32Array(bucket.uvs),2));
   geometry.computeBoundingSphere();geometry.computeBoundingBox();
   triangles+=bucket.positions.length/9;meshes.push({finish,geometry,material:material[finish]});
  }
  return {meshes,triangles,dispose(){meshes.forEach(m=>m.geometry.dispose());Object.values(material).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());[walnutSurface,leatherHeight,marbleSurface,leatherPhoto].forEach(t=>t.dispose())}};
 }
 function Furnishings(){
  if(reviewEnabled)useFrame(({camera})=>frameHospitalityReview(camera));
  const model=R.useMemo(createModel,[]);
  R.useEffect(()=>{window.__shadowRefresh=true;return()=>model.dispose()},[model]);
  R.useEffect(()=>{
   if(!reviewEnabled)return;
   const finite=model.meshes.every(m=>Array.from(m.geometry.attributes.position.array).every(Number.isFinite)&&Array.from(m.geometry.attributes.normal.array).every(Number.isFinite));
   const root=document.documentElement;
   root.dataset.furnitureDraws=String(model.meshes.length);
   root.dataset.furnitureTriangles=String(model.triangles);
   root.dataset.furnitureGeometryValid=String(finite);
  },[model]);
  return hs('group',{name:'Piano, wine cellar, bar and cigar lounge',userData:{staticFurniture:true,drawCalls:model.meshes.length,triangles:model.triangles},children:[
   ...model.meshes.map(m=>h('mesh',{name:'Hospitality · '+m.finish,geometry:m.geometry,material:m.material,castShadow:m.finish!=='glass',receiveShadow:true,raycast:nullRaycast,dispose:null},m.finish)),
   h(ContactShadow,{position:[46,.022,6.1],size:[3.9,3.9]}),
   h(ContactShadow,{position:[34,.023,5.55],size:[7.4,2.1]}),
   h(ContactShadow,{position:[40.8,.022,6.45],size:[4.8,2.3]}),
   h(LodgeLamp,{position:[38.4,0,7.35]}),
   h('pointLight',{position:[30.4,3.8,5.0],color:'#efd4a4',intensity:10,distance:10,decay:2}),
   h('pointLight',{position:[45.5,3.7,4.6],color:'#f3dfbb',intensity:9,distance:8,decay:2})
  ]});
 }
 function HospitalityRoom(){
  const [ready,setReady]=R.useState(false);
  R.useEffect(()=>{
   let live=true,timer=0,idle=0;
   const show=()=>{if(live)setReady(true)};
   const schedule=()=>{
    if(!live)return;
    if(!window.__galleryFirstFrame||document.hidden){timer=setTimeout(schedule,200);return}
    if(window.requestIdleCallback)idle=window.requestIdleCallback(show,{timeout:1800});
    else timer=setTimeout(show,500);
   };
   timer=setTimeout(schedule,150);
   return()=>{live=false;clearTimeout(timer);if(idle)window.cancelIdleCallback(idle)};
  },[]);
  return ready?h(Furnishings,{}):null;
 }
 return {HospitalityRoom};
}
