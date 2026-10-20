import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../assets/lodge-canvas-v17-15.js',import.meta.url),'utf8');
const section=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const jsx=(type,props)=>({type,props});
const hooks={useRef:current=>({current}),useMemo:fn=>fn(),useEffect(){}};
class Vector {
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){Object.assign(this,{x,y,z});return this}
 copy(v){return this.set(v.x,v.y,v.z)}
 applyMatrix4(matrix){if(matrix?.view)this.z-=5;else if(matrix){const angle=matrix.rotationY||0,x=this.x,z=this.z;this.x=x*Math.cos(angle)+z*Math.sin(angle)+(matrix.offsetX||0);this.z=-x*Math.sin(angle)+z*Math.cos(angle)}return this}
 project(){this.x*=.2;this.y*=.2;this.z=0;return this}
}
{
 let frame,reads=0,now=0;
 const size={left:10,top:20,width:1280,height:800};
 const camera={near:.1,far:90,matrixWorldInverse:{view:true},updateMatrixWorld(){}};
 const model={matrixWorld:{},updateWorldMatrix(){}};
 const group={position:new Vector,rotation:{},visible:true,children:[model]};
 const window={__atLibrary:true};
 const context={u:hooks,$:{jsx,jsxs:jsx},v_:fn=>frame=fn,__ :()=>({camera,size,gl:{domElement:{getBoundingClientRect(){reads++;return{...size,right:size.left+size.width,bottom:size.top+size.height}}}}}),U:Vector,Morgan3D:{createModel:()=>model,mouth:[.107,2.19,.03],chest:[40*2.5/1480,1150*2.5/1480,.036]},matchMedia:()=>({matches:true}),window,document:{documentElement:{classList:{contains:()=>true}},body:{style:{}}},performance:{now:()=>now},Fy(){}};
 runInNewContext(section('function MorganV10(){','function lb(')+';this.tree=MorganV10();',context);
 context.tree.props.ref.current=group;
 for(let i=0;i<120;i++){now+=1000/60;frame({clock:{elapsedTime:now/1000}})}
 assert.equal(reads,0,'Avatar projection uses Fiber’s measured canvas bounds without forcing DOM layout');
 const projection=window.__morganProjection;
 assert.equal(projection.visible,true);assert.ok(Math.abs(projection.rect.left-591.12)<1e-8);assert.ok(Math.abs(projection.rect.width-117.76)<1e-8);assert.equal(projection.rect.top,220);assert.equal(projection.rect.height,200);
 assert.ok(Math.abs(projection.mouth.x-663.696)<1e-8);assert.ok(Math.abs(projection.mouth.y-244.8)<1e-8);
 assert.ok(Math.abs(projection.chest.x-(650+40*2.5/1480*128))<1e-8);
 assert.ok(Math.abs(projection.chest.y-(420-1150*2.5/1480*80))<1e-8,'The world anchor projects the sternum, below the mouth.');
 model.matrixWorld.rotationY=Math.PI/2;frame({clock:{elapsedTime:2.5}});
 assert.ok(Math.abs(window.__morganProjection.chest.x-(650+.036*128))<1e-8,'World chest anchor follows the actual model transform.');
 window.__morganInTransit=true;frame({clock:{elapsedTime:3}});assert.equal(window.__morganProjection.visible,false);assert.ok(window.__morganProjection.rect,'Flight destination projection remains available while the world avatar is hidden');
 window.__morganInTransit=false;model.matrixWorld.offsetX=20;frame({clock:{elapsedTime:3.5}});
 assert.equal(window.__morganProjection.visible,false);assert.equal(window.__morganProjection.chest,null,'Looking away removes the chest anchor instead of leaving a floating speech path.');
}
{
 let frame,now=10000,transforms=0;
 const window={__veilT:1000};
 const group={visible:true,material:{opacity:1},quaternion:{copy(){transforms++;return this}},position:{copy(){transforms++;return this},addScaledVector(){transforms++;return this}}};
 const camera={position:{},quaternion:{},getWorldDirection(){transforms++}};
 const context={u:hooks,$:{jsx,jsxs:jsx},v_:fn=>frame=fn,window,performance:{now:()=>now},_aim:{}};
 runInNewContext(section('function Veil(){','var _aim=')+';this.tree=Veil();',context);context.tree.props.ref.current=group;
 for(let i=0;i<120;i++)frame({camera});
 assert.equal(transforms,0,'A fully faded overlay performs no camera transforms');assert.equal(group.visible,false);assert.equal(group.material.opacity,0);
 window.__veilT=now;now+=1400;frame({camera});assert.equal(group.visible,true);assert.equal(group.material.opacity,.5,'A restarted fade keeps the original easing');assert.equal(transforms,4);
 now+=1400;frame({camera});assert.equal(group.visible,false);assert.equal(group.material.opacity,0);assert.equal(transforms,4,'Completion immediately returns to the inactive path');
 window.__veilT=0;frame({camera});assert.equal(group.visible,true);assert.equal(group.material.opacity,1,'Resetting a veil restores its opaque state');
 window.__shelfHold=true;frame({camera});assert.equal(window.__veilT,now,'A new shelf hold starts its fade');
}
console.log('PASS: 120 avatar frames avoid DOM bounds reads while retaining flight/mouth/chest projection; 120 inactive veil frames avoid all transforms and still restart/fade correctly.');
