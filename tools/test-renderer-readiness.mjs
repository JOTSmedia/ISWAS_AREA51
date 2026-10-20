import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/lodge-canvas-v17-8.js',import.meta.url),'utf8');
const start=source.indexOf('function My(){');
const rendererSource=source.slice(start,source.indexOf('function Ny(){',start));
function harness({ratio=1,calls=240,wallReady=true}={}){
 let now=0,frame,lost=false,throws=false,renderCount=0,readyCount=0,lostCount=0;
 const effects=[],listeners=new Map,changes=[];
 const size={width:1280,height:800};
 const canvas={width:1280,height:800,addEventListener(type,fn){listeners.set(type,fn)},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type)}};
 const context={isContextLost:()=>lost};
 const gl={domElement:canvas,shadowMap:{},info:{render:{calls,triangles:50000}},getContext:()=>context,getPixelRatio:()=>ratio,setPixelRatio:value=>{ratio=value;changes.push(value)},setRenderTarget(){},render(){renderCount++;if(throws)throw new Error('Simulated renderer failure')}};
 const win={innerWidth:1280,devicePixelRatio:2,__wallReady:wallReady,__iswasStartup:{sceneReady(){readyCount++},sceneLost(){lostCount++}}};
 const doc={hidden:false};
 const u={useRef:current=>({current}),useEffect:fn=>effects.push(fn)};
 const My=new Function('u','__','v_','window','document','performance',rendererSource+';return My')(u,()=>({gl,size}),fn=>frame=fn,win,doc,{now:()=>now});
 My();const cleanup=effects.map(fn=>fn()).filter(Boolean);
 return {win,doc,size,canvas,gl,changes,get ready(){return readyCount},get lost(){return lostCount},get renders(){return renderCount},get ratio(){return ratio},
  tick(dt=1/60){now+=dt*1000;frame({scene:{},camera:{}},dt)},
  setLost(value){lost=value},setThrows(value){throws=value},
  event(type){let prevented=false;listeners.get(type)?.({preventDefault(){prevented=true}});return prevented},
  dispose(){cleanup.forEach(fn=>fn());assert.equal(listeners.size,0,'Context handlers are removed on unmount')}
 };
}

{
 const h=harness({wallReady:false});h.tick();assert.equal(h.win.__galleryFirstFrame,true);assert.equal(h.ready,0,'A render without required wall textures does not release the loader');
 const metrics=h.win.__galleryPerformance;h.win.__wallReady=true;h.tick();assert.equal(h.ready,1);h.tick();assert.equal(h.ready,1,'Successful readiness is announced once');assert.equal(h.win.__galleryPerformance,metrics,'Frame diagnostics reuse their object instead of allocating every frame');
 h.doc.hidden=true;const before=h.renders;h.tick(10);assert.equal(h.renders,before,'Hidden tabs do not render');h.dispose();
}
for(const target of ['size','canvas']){
 const h=harness();h[target].width=0;h.tick();assert.equal(h.renders,0,'A zero-size surface does not render');assert.equal(h.ready,0);assert.notEqual(h.win.__galleryFirstFrame,true);h.dispose();
}
{
 const h=harness({calls:0});h.tick();assert.equal(h.ready,0,'An empty render does not count as a painted gallery');assert.notEqual(h.win.__galleryFirstFrame,true);h.dispose();
}
{
 const h=harness();h.setLost(true);h.tick();h.tick();assert.equal(h.ready,0);assert.equal(h.renders,0);assert.equal(h.lost,1,'Repeated lost-context checks announce fallback once');
 assert.equal(h.event('webglcontextlost'),true,'Preventing the context-loss default permits restoration');
 h.setLost(false);h.event('webglcontextrestored');h.tick();assert.equal(h.ready,1);assert.equal(h.win.__galleryFirstFrame,true);assert.equal(h.gl.shadowMap.needsUpdate,true,'Restoration refreshes cached shadows');
 h.setLost(true);h.event('webglcontextlost');assert.equal(h.win.__galleryFirstFrame,false);assert.equal(h.lost,2,'A later context loss clears readiness');h.dispose();
}
{
 const h=harness();h.setThrows(true);assert.doesNotThrow(()=>h.tick());assert.equal(h.ready,0);assert.equal(h.lost,1);assert.equal(h.win.__galleryFirstFrame,false);
 const count=h.renders;for(let i=0;i<30;i++)h.tick();assert.equal(h.renders,count,'A failing renderer is not retried every frame');
 h.setThrows(false);h.tick(1);assert.equal(h.ready,1,'A successful bounded retry restores readiness');h.dispose();
}
{
 const h=harness({ratio:1.3});for(let i=0;i<12;i++)h.tick(.3);assert.ok(h.ratio<1.3,'Very slow frames contribute samples and lower rendering resolution');
 h.size.width=4000;h.size.height=2000;h.tick();assert.ok(h.ratio<=Math.sqrt(2200000/8000000),'Resize enforces the maximum pixel budget immediately');h.dispose();
}
{
 const h=harness();for(let i=0;i<60*25;i++)h.tick();assert.ok(h.ratio>1,'Fast rendering can gradually recover detail');assert.ok(h.ratio<=1.35,'Recovered detail stays inside the desktop ceiling');h.dispose();
}
console.log('PASS: real renderer callback gates readiness on nonempty valid rendering, defers textures, handles context loss/restoration and render errors, pauses hidden/zero-size surfaces, bounds retries, adapts very slow frames, and enforces resized pixel budgets.');
