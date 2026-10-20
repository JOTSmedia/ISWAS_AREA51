import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url),read=path=>readFileSync(new URL(path,root),'utf8');
const source=read('assets/black-lodge-scene-v17-8.js');
const {illuminateGlobeOcean}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const original='#include <common>\n#include <map_fragment>\n#include <emissivemap_fragment>';
const shader={fragmentShader:original};illuminateGlobeOcean(shader);
const fragment=shader.fragmentShader;
assert.ok(!fragment.includes('#include <map_fragment>')&&!fragment.includes('#include <emissivemap_fragment>'));
assert.equal((fragment.match(/texture2D\(/g)||[]).length,2,'Only the material’s original diffuse and emissive samples are read');

// Verify the injected code against this release’s real Three shader chunks,
// including both optional video decoders and the current UV variable names.
const vendor=read('assets/lodge-canvas-v17-8.js');
const chunk=name=>{const match=vendor.match(new RegExp('(?<![a-z])'+name+':`([^`]+)`'));assert.ok(match,name+' exists in bundled Three');return match[1]};
const compact=text=>text.replace(/\s+/g,'');
const diffuse=fragment.slice(fragment.indexOf('#ifdef USE_MAP'),fragment.indexOf('#ifdef USE_EMISSIVEMAP'));
const emissive=fragment.slice(fragment.indexOf('#ifdef USE_EMISSIVEMAP'));
assert.equal(compact(diffuse.replace('sampledDiffuseColor.rgb = globeOceanColor(sampledDiffuseColor.rgb);','')),compact(chunk('map_fragment')),'Diffuse shader preserves the exact bundled sampling, decoding and alpha behavior');
assert.equal(compact(emissive.replace('globeOceanColor(emissiveColor.rgb)','emissiveColor.rgb')),compact(chunk('emissivemap_fragment')),'Emissive shader preserves the exact bundled sampling and optional decoding');

// Execute the actual scalar GLSL body, rather than a separate JS copy of the
// correction. Small vector helpers supply GLSL’s componentwise operations.
const body=fragment.match(/vec3 globeOceanColor\(vec3 color\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(body);
const vec3=(r,g,b)=>({r,g,b});
const maximum=(a,b)=>typeof a==='number'?Math.max(a,b):vec3(Math.max(a.r,b.r),Math.max(a.g,b.g),Math.max(a.b,b.b));
const mix=(a,b,t)=>vec3(a.r+(b.r-a.r)*t,a.g+(b.g-a.g)*t,a.b+(b.b-a.b)*t);
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const execute=new Function('color','vec3','max','mix','smoothstep',body.replace(/\bfloat\b/g,'let'));
const correct=color=>execute(color,vec3,maximum,mix,smoothstep);
const linear=value=>{const x=value/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
const srgb=value=>255*(value<=.0031308?12.92*value:1.055*value**(1/2.4)-.055);
const fromRGB=rgb=>vec3(...rgb.map(linear));
const provenance=JSON.parse(read('textures/globe-PROVENANCE.json'));
for(const {landmark,rgb} of provenance.earth_texture.landmark_samples_4096){
 const before=fromRGB(rgb),after=correct(before);
 if(landmark==='Pacific'){
  assert.ok(after.b>before.b*20&&after.g>before.g*20,'NASA’s near-black deep Pacific fill becomes visibly blue');
  // At the lowest pulse, with every external light omitted, mapped emission
  // still supplies a distinct blue surface. Actual tone mapping is browser QA.
  const minimum=.54,display=[after.r,after.g,after.b].map(value=>srgb(value*minimum));
  assert.ok(display[2]>85&&display[1]>45&&display[0]<15,'Unlit pulse minimum retains blue ocean instead of black');
 }else assert.deepEqual(after,before,landmark+' retains the exact NASA land/ice color');
}
for(const [name,rgb] of [['Black',[0,0,0]],['Neutral shadow',[8,8,8]],['Forest shadow',[3,7,4]],['Cloud',[210,221,232]],['Ice shadow',[90,125,155]],['Coastal turquoise',[30,140,151]],['Tan desert',[160,120,75]]]){
 const color=fromRGB(rgb);assert.deepEqual(correct(color),color,name+' is not mistaken for dark deep ocean');
}
for(let r=0;r<=255;r+=17)for(let g=0;g<=255;g+=17)for(let b=0;b<=255;b+=17){
 const before=fromRGB([r,g,b]),after=correct(before);
 for(const channel of ['r','g','b'])assert.ok(Number.isFinite(after[channel])&&after[channel]>=before[channel]&&after[channel]<=1,'Correction is finite, bounded and cannot darken a source pixel');
 if(b<=Math.max(r,g))assert.deepEqual(after,before,'Non-blue pixels cannot acquire an ocean tint');
}
assert.ok(source.includes('customProgramCacheKey:globeOceanProgram'),'The corrected material has a stable program cache key');
assert.ok(!fragment.includes('uniform '),'The correction adds no animated uniforms or render-loop work');
console.log('PASS: bundled shader chunk compatibility, unchanged sample count, real NASA landmark colors, readable unlit pulse trough, 4096 color samples, and stable shader caching.');
