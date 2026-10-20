/* Real, non-interactive book geometry for the gallery's perimeter shelves.
 * Shared surfaces + instancing keep all 57 rows and three display ledges filled with eight draw calls.
 * No event handlers, active state, cursor changes, or raycasts are registered.
 */
export const PERIMETER_SHELVES = Object.freeze([
 {name:'rear wall',position:[21.5,0,9.1],rotation:[0,Math.PI,0],length:54,divisions:21,displayLedge:true,ys:[.4,.95,1.5,2.05,3.6,4.75,5.9,7.05,8.2,9.35,10.5,11.65,12.8,13.95,15.1,16.25]},
 {name:'left wall',position:[-5.9,0,1.5],rotation:[0,Math.PI/2,0],length:15.2,divisions:6,displayLedge:true,ys:[.4,.95,1.5,2.05,3.6,4.75,5.9,7.05,8.2,9.35,10.5,11.65,12.8,13.95,15.1,16.25]},
 {name:'right wall',position:[48.6,0,1.5],rotation:[0,-Math.PI/2,0],length:15.2,divisions:6,displayLedge:true,ys:[.4,.95,1.5,2.05,3.6,4.75,5.9,7.05,8.2,9.35,10.5,11.65,12.8,13.95,15.1,16.25]},
 {name:'front upper wall',position:[21.5,0,-5.95],rotation:[0,0,0],length:53.6,divisions:21,ys:[6.4,7.6,8.8,10,11.2,12.4,13.6,14.8,16],z:.12}
]);
const PALETTE=['#38271e','#502b2b','#26372e','#514331','#28313a','#382824','#514738','#432d35','#2d3432','#674c32','#2b2524','#3f3026'];
const noRaycast=()=>{};
function random(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296}}
/** Pure layout, used for bounds checks as well as instancing. */
export function arrangeBooks({length,ys,divisions=Math.max(4,Math.round(length/2.6)),z=.04,seed=1,mobile=false,displayLedge=false}){
 const output=[];const rng=random(seed+Math.round(length*100));
 const rows=ys.map((y,row)=>({row,bottom:y+.0255,maxHeight:Math.min(.69,((ys[row+1]??y+1.1)-y-.075)*.88),z,display:false}));
 // The low gallery ledge is stocked too. Two short clusters flank each bust,
 // keeping a half-metre-wide opening around the sculpture and its plinth.
 if(displayLedge)rows.push({row:ys.length,bottom:2.7425,maxHeight:.29,z:.28,display:true});
 for(const spec of rows){
  for(let bay=0;bay<divisions;bay++){
   const bayLeft=-length/2+bay*length/divisions+.065,bayRight=-length/2+(bay+1)*length/divisions-.065,mid=(bayLeft+bayRight)/2;
   const ranges=spec.display?[[bayLeft,mid-.25],[mid+.25,bayRight]]:[[bayLeft,bayRight]];
   for(const [left,right] of ranges){
    let x=left+.008,index=0;
    while(x<right-.075){
     const width=Math.min((mobile?.135:.105)+rng()*.075,right-x-.008);
     if(width<.06)break;
     const height=spec.maxHeight*(.68+rng()*.31),depth=.21+rng()*.065;
     const lean=index%13===8?(rng()-.5)*.055:0;
     const margin=Math.abs(lean)*height*.5;
     if(x+width+margin>right)break;
     output.push({x:x+width/2+margin,y:spec.bottom+height/2,z:spec.z+(rng()-.5)*.015,width,height,depth,lean,color:PALETTE[(Math.floor(rng()*PALETTE.length)+spec.row)%PALETTE.length],row:spec.row,bay,left,right,bottom:spec.bottom,display:spec.display});
     x+=width+.006+margin*2;index++;
    }
   }
  }
 }
 return output;
}
export function createDecorativeBooks({React:R,jsx:J,Object3D,Color,BufferGeometry,Float32BufferAttribute,CanvasTexture}){
 const h=J.jsx,hs=J.jsxs;
 const mobile=matchMedia('(max-width: 767px)').matches||navigator.connection?.saveData;
 // One grayscale cloth texture is shared by every book. Subtle irregular fibres
 // and rubbed edges avoid the uniform colored-plastic appearance of plain boxes.
 const surface=(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const context=canvas.getContext('2d');
  if(!context)return null;
  const rng=random(160319),pixels=context.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4,edge=Math.min(x,255-x),wear=edge<4?17:0;
   const value=211+(rng()-.5)*22+(x%3===0?4:0)+(y%4===0?-4:0)+wear;
   pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
  }
  context.putImageData(pixels,0,0);
  const texture=new CanvasTexture(canvas);texture.colorSpace='srgb';texture.anisotropy=mobile?2:4;
  return texture;
 })();
 const geometry=(quads)=>{
  const positions=[],colors=[],uvs=[];
  for(const [corners,color] of quads){
   const rgb=new Color(color||'#ffffff');
   for(const index of [0,1,2,0,2,3]){positions.push(...corners[index]);colors.push(rgb.r,rgb.g,rgb.b);uvs.push(...[[0,0],[1,0],[1,1],[0,1]][index])}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.computeVertexNormals();g.computeBoundingSphere();return g;
 };
 // The short chamfer along the spine catches ambient light like worn bindings.
 const outline=[[-.5,-.5],[.5,-.5],[.5,.44],[.43,.5],[-.43,.5],[-.5,.44]],coverQuads=[];
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];coverQuads.push([[[a[0],-.5,a[1]],[a[0],.5,a[1]],[b[0],.5,b[1]],[b[0],-.5,b[1]]]])}
 coverQuads.push([[[-.5,.5,-.5],[-.5,.5,.44],[.5,.5,.44],[.5,.5,-.5]]],[[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.44],[-.5,-.5,.44]]]);
 coverQuads.push([[[ -.5,.5,.44],[-.43,.5,.5],[.43,.5,.5],[.5,.5,.44]]],[[[-.5,-.5,.44],[.5,-.5,.44],[.43,-.5,.5],[-.43,-.5,.5]]]);
 const coverGeometry=geometry(coverQuads);
 const details=[[[[-.41,.501,-.43],[-.41,.501,.39],[.41,.501,.39],[.41,.501,-.43]],'#b9ad91']];
 // Embossed rules and quiet title marks: small enough to read as binding detail,
 // without fabricated legible movie names on decorative volumes.
 for(const y of [-.35,.35])details.push([[[ -.34,y-.006,.502],[.34,y-.006,.502],[.34,y+.006,.502],[-.34,y+.006,.502]],'#a89164']);
 for(const [y,w] of (mobile?[]:[[.09,.27],[.04,.32],[-.01,.21]]))details.push([[[ -w,y-.004,.502],[w,y-.004,.502],[w,y+.004,.502],[-w,y+.004,.502]],'#8b7855']);
 const detailGeometry=geometry(details);
 return function DecorativeBooks({length,ys,divisions,z=.04,seed=1,displayLedge=false}){
  const covers=R.useRef(null),details=R.useRef(null),key=ys.join(',');
  const books=R.useMemo(()=>arrangeBooks({length,ys,divisions,z,seed,mobile,displayLedge}),[length,key,divisions,z,seed,displayLedge]);
  R.useLayoutEffect(()=>{
   if(!covers.current||!details.current)return;
   const object=new Object3D();
   books.forEach((b,i)=>{object.position.set(b.x,b.y,b.z);object.rotation.set(0,0,b.lean);object.scale.set(b.width,b.height,b.depth);object.updateMatrix();covers.current.setMatrixAt(i,object.matrix);details.current.setMatrixAt(i,object.matrix);covers.current.setColorAt(i,new Color(b.color))});
   for(const mesh of [covers.current,details.current]){mesh.count=books.length;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere()}
  },[books]);
  R.useEffect(()=>{
   // dispose:null protects the closure-shared geometry and cloth texture from
   // Fiber's recursive disposal. The two instance buffers and their materials
   // still belong to this shelf, so release them when it unmounts or resizes.
   // Capture the objects now: React clears refs before effect cleanup runs.
   const owned=[covers.current,details.current].filter(Boolean);
   return()=>{
    for(const mesh of owned){
     mesh.dispose();
     for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material?.dispose();
    }
   };
  },[books.length]);
  const common={args:[null,null,Math.max(1,books.length)],raycast:noRaycast,castShadow:false,receiveShadow:true,userData:{decorativeBooks:true},dispose:null};
  return hs('group',{userData:{decorativeBooks:true},children:[h('instancedMesh',{...common,ref:covers,geometry:coverGeometry,children:h('meshStandardMaterial',{color:'#ffffff',map:surface,roughness:.88,metalness:0})}),h('instancedMesh',{...common,ref:details,geometry:detailGeometry,children:h('meshStandardMaterial',{vertexColors:true,roughness:.83,metalness:0})})]});
 };
}
