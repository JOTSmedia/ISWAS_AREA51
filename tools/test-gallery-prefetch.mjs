import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/index-v17-13.js',import.meta.url),'utf8');
const start=source.indexOf('function warmLodgeModule('),end=source.indexOf('function Fv(',start);
assert.ok(start>0&&end>start);
const helper=source.slice(start,end);
assert.ok(!/\bimport\s*\(|\bEv\s*\(|startScene|__showLodge/.test(helper),'Prefetch never evaluates the scene or starts rendering');
const loader=source.slice(end,source.indexOf('function ',end+1));
assert.ok(loader.includes('warmLodgeModule();document.documentElement.classList.add(`iswas-loading`)'),'Overview overlaps download with its loader');
const sceneImport=source.match(/Ev=\(\)=>Tv\(\(\)=>import\(`([^`]+)`\)/)?.[1];
assert.ok(sceneImport);
for(const base of ['/','/ISWAS_v17.13/','/preview/release/ISWAS_v17.13/']){
 const baseURI='https://example.test'+base,links=[];
 const document={baseURI,head:{appendChild:link=>links.push(link)},querySelectorAll:()=>links,createElement:tag=>{assert.equal(tag,'link');return {}}};
 const context={document,URL,lv:asset=>base+asset};
 vm.runInNewContext(helper+';this.warm=warmLodgeModule',context);
 context.warm();context.warm();
 assert.equal(links.length,1,'Repeated effects do not add duplicate preload links');
 const link=links[0],indexURL=baseURI+'assets/index-v17-13.js';
 assert.equal(link.href,new URL(sceneImport,indexURL).href,'Preload and actual import use the same module-map URL');
 assert.equal(link.rel,'modulepreload');assert.equal(link.crossOrigin,'');assert.equal(link.fetchPriority,'low');
 const scene=fs.readFileSync(new URL('../assets/lodge-canvas-v17-13.js',import.meta.url),'utf8');
 const mainImport=scene.match(/from["'](\.\/index-v17-13\.js)["']/)?.[1];
 assert.ok(mainImport);assert.equal(new URL(mainImport,link.href).href,indexURL,'Scene reuses the already loaded React/main module URL');
 links.length=0;links.push({rel:'modulepreload',href:link.href});context.warm();assert.equal(links.length,1,'Existing HTML preload is reused');
}
const noDOM={};vm.runInNewContext(helper+';warmLodgeModule()',noDOM);
console.log('PASS: low-priority, non-evaluating scene prefetch; same URL as the later import; shared React dependency URL; nested deployment paths; duplicate-link prevention.');
