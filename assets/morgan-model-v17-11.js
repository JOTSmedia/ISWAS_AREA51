/* Two identical photographic faces with shallow layered depth. Shared by all avatars. */
export function createMorganModelSystem(T) {
 const {Group,Mesh,BufferGeometry,BufferAttribute,MeshStandardMaterial,
  Scene,PerspectiveCamera,WebGLRenderer,DirectionalLight,HemisphereLight,
  AmbientLight,Vector3,loadTexture}=T;
 const mobile=matchMedia('(max-width: 767px)').matches||navigator.connection?.saveData;
 const texture=loadTexture(mobile?'/characters/morgan/morgan-mobile.webp':'/characters/morgan/morgan.webp');
 texture.wrapS=texture.wrapT=1001;texture.colorSpace='srgb';texture.anisotropy=mobile?2:4;
 const photo=new MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.22,roughness:.94,metalness:0,alphaTest:.12,side:0});
 const materials={},surfaceTextures=[],parts=[],scale=2.5/1480;
 // A small relief and five silhouette layers give real depth without invented anatomy.
 // The back UVs are reversed so the same portrait reads correctly from either face.
 for(let layer=0;layer<5;layer++)for(const back of [false,true]){
  const vertices=[],uv=[],indices=[],cols=8,rows=12;
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
   const u=x/cols,v=y/rows,relief=.006*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
   vertices.push((u*1024-510)*scale,(1500-v*1536)*scale,(layer-2)*.012+(back?-relief:relief));
   uv.push(back?1-u:u,1-v);
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const a=y*(cols+1)+x,b=a+cols+1;
   if(back)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geometry.setIndex(indices);geometry.computeVertexNormals();
  parts.push({geometry,material:photo,name:back?'Morgan likeness — back':'Morgan likeness — front'});
 }
 // Merge the silhouette layers into a single draw, shared across every placement.
 const positions=[],uvs=[],indices=[];let offset=0;
 for(const part of parts){const g=part.geometry;positions.push(...g.attributes.position.array);uvs.push(...g.attributes.uv.array);for(const n of g.index.array)indices.push(n+offset);offset+=g.attributes.position.count;g.dispose()}
 const merged=new BufferGeometry();merged.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));merged.setAttribute('uv',new BufferAttribute(new Float32Array(uvs),2));merged.setIndex(indices);merged.computeVertexNormals();parts.splice(0,parts.length,{geometry:merged,material:photo,name:'Two-sided photographic silhouette with shallow depth'});
 function createModel(){
  const group=new Group();group.name='Morgan — two-sided dimensional cutout';group.userData.morgan3D=true;
  for(const part of parts){const mesh=new Mesh(part.geometry,part.material);mesh.name=part.name;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}
  return group;
 }
 // Upper sternum at (550,350) in the original 1024×1536 portrait.
 // Keep this separate from the mouth so the liquid path starts on his chest.
 const mouthPoint=[.107,2.19,.03],chestPoint=[40*scale,1150*scale,.036],mouthProjection=new Vector3(),chestProjection=new Vector3();
 let renderer=null,scene=null,camera=null,avatar=null,lastSize='',failed=false;
 function ensureRenderer(){
  if(renderer||failed)return !!renderer;
  try{
   renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
   renderer.setClearColor(0,0);renderer.setPixelRatio(1);renderer.outputColorSpace='srgb';renderer.toneMapping=4;renderer.toneMappingExposure=1.3;
   scene=new Scene();camera=new PerspectiveCamera(27,2/3,.1,20);camera.position.set(0,1.33,5.6);camera.lookAt(0,1.33,0);
   scene.add(new HemisphereLight('#eadfcb','#353b35',2.1));scene.add(new AmbientLight('#ecdfcd',.3));
   const key=new DirectionalLight('#ffedda',3.2);key.position.set(-2,3.7,4);scene.add(key);
   const rim=new DirectionalLight('#b4ead9',2.6);rim.position.set(1.5,2.5,-2.5);scene.add(rim);
   avatar=createModel();scene.add(avatar);return true;
  }catch(error){failed=true;renderer?.dispose();renderer=null;return false}
 }
 let ready=false,readyTimer=null,resolveReady=null,disposed=false;
 const readyPromise=new Promise(resolve=>{
  resolveReady=resolve;
  const start=performance.now();const check=()=>{
   if(disposed){resolve(false);return}
   if(texture.image?.width){ready=true;resolve(true)}
   else if(performance.now()-start>12000)resolve(false);
   else readyTimer=setTimeout(check,100);
  };check();
 });
 function renderAvatar(canvas,angle=0){
  if(disposed||!ready||!canvas?.isConnected||!ensureRenderer())return false;
  const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return false;
  // CSS transforms animate the flight; keep the GPU buffer tied to its stable
  // layout dimensions, rather than reallocating it on every animation frame.
  const dpr=Math.min(devicePixelRatio||1,2),w=Math.min(320,Math.ceil((canvas.clientWidth||rect.width)*dpr)),h=Math.min(480,Math.ceil((canvas.clientHeight||rect.height)*dpr));
  const size=w+'x'+h;if(size!==lastSize){lastSize=size;renderer.setSize(w,h,false)}
  const aspect=rect.width/rect.height;if(Math.abs(camera.aspect-aspect)>.0001){camera.aspect=aspect;camera.updateProjectionMatrix()}
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  avatar.rotation.y=angle;renderer.render(scene,camera);
  const context=canvas.getContext('2d',{alpha:true});if(!context)return false;
  context.clearRect(0,0,w,h);context.drawImage(renderer.domElement,0,0,w,h);
  mouthProjection.set(...mouthPoint).applyMatrix4(avatar.matrixWorld).project(camera);
  canvas.__morganMouth={x:rect.left+(mouthProjection.x*.5+.5)*rect.width,y:rect.top+(-mouthProjection.y*.5+.5)*rect.height};
  chestProjection.set(...chestPoint).applyMatrix4(avatar.matrixWorld).project(camera);
  canvas.__morganChest={x:rect.left+(chestProjection.x*.5+.5)*rect.width,y:rect.top+(-chestProjection.y*.5+.5)*rect.height};
  return true;
 }
 return {
  createModel,renderAvatar,ready:readyPromise,get isReady(){return ready&&!disposed},
  mouth:mouthPoint,chest:chestPoint,bounds:{min:[-.46,0,-.04],max:[.46,2.5,.04]},
  disposeModel:group=>{group?.removeFromParent()},
  stats:{drawCalls:parts.length,vertices:parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0),triangles:parts.reduce((n,p)=>n+p.geometry.index.count/3,0)},
  dispose(){disposed=true;clearTimeout(readyTimer);resolveReady?.(false);renderer?.dispose();for(const p of parts)p.geometry.dispose();photo.dispose();texture.dispose();for(const t of surfaceTextures)t.dispose();for(const m of Object.values(materials))m.dispose()}
 };
}
