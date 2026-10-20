import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../assets/startup-v17-10.js',import.meta.url),'utf8');
function harness(route='/'){
 let next=1,image,decodeResolve,decodeReject;const frames=new Map,timers=[],classes=new Set;
 const win={__ISWAS_BASE:'/ISWAS_v17.10/',__ISWAS_ROUTE:route};
 class Image{constructor(){image=this}decode(){return new Promise((resolve,reject)=>{decodeResolve=resolve;decodeReject=reject})}}
 runInNewContext(source,{window:win,document:{documentElement:{classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}}},Image,requestAnimationFrame:fn=>{const id=next++;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),setTimeout:fn=>(timers.push(fn),timers.length)});
 return {win,state:win.__iswasStartup,image,classes,frames,timers,frame(){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn())},async decode(fail=false){image.onload();assert.equal(win.__iswasStartup.posterReady,false,'Image load waits for decode');fail?decodeReject(new Error('decode unavailable')):decodeResolve();await Promise.resolve();await Promise.resolve()}};
}
{
 const h=harness();assert.equal(h.image.src,'/ISWAS_v17.10/textures/gallery-startup.webp');assert.equal(h.state.posterReady,false);assert.equal(h.win.__showLodge,undefined);
 await h.decode();assert.equal(h.state.posterReady,true);assert.ok(h.classes.has('iswas-poster-ready'));assert.equal(h.frames.size,0,'Overview defers scene creation until loader calls startScene');
 h.state.startScene();h.state.startScene();assert.equal(h.frames.size,1,'Scene start is idempotent');h.frame();assert.equal(h.win.__showLodge,undefined,'First scheduling frame preserves the poster paint');h.frame();assert.equal(h.win.__showLodge,true);
 h.state.sceneReady();h.state.sceneReady();assert.equal(h.frames.size,1);assert.equal(h.state.live,false,'Live scene is shown after a paint boundary');h.state.sceneLost();h.frame();assert.equal(h.state.live,false,'Context loss cancels an obsolete ready callback');assert.ok(h.classes.has('iswas-scene-lost'));assert.equal(h.state.posterReady,true,'Context loss preserves the decoded poster');
 h.state.sceneReady();h.frame();assert.equal(h.state.live,true);assert.ok(h.classes.has('iswas-scene-ready'));assert.ok(!h.classes.has('iswas-scene-lost'));
 h.state.sceneLost();assert.equal(h.state.live,false);assert.ok(!h.classes.has('iswas-scene-ready'));assert.equal(h.state.posterReady,true);
}
{
 const h=harness('/need');await h.decode();assert.equal(h.frames.size,1,'Deep links begin scene creation once their poster is decoded');h.frame();h.frame();assert.equal(h.win.__showLodge,true);h.timers.forEach(fn=>fn());assert.equal(h.frames.size,0,'Deep-link timeout cannot create a duplicate scene');
}
{
 const h=harness();h.image.onerror();assert.equal(h.state.posterReady,false);h.frame();h.frame();assert.equal(h.win.__showLodge,true,'Poster failure still attempts the live scene');assert.equal(h.state.live,false,'Attempting a scene is not proof of a render');
}
{
 const h=harness();await h.decode(true);assert.equal(h.state.posterReady,true,'An onload image remains usable when decode() is unsupported or rejects');
}
console.log('PASS: poster decode gating, deferred double-frame start, idempotent readiness, canceled stale ready frame, context-loss poster preservation and recovery, deep links, and poster failures.');
