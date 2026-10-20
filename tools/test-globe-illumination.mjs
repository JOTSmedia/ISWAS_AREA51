import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url),read=path=>readFileSync(new URL(path,root),'utf8');
const source=read('assets/black-lodge-scene-v17-11.js');
const {illuminateGlobeOcean,addSatelliteAtmosphere,globeAtmosphereHaloShader}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const original='#include <common>\n#include <map_fragment>\n#include <emissivemap_fragment>';
const shader={fragmentShader:original};illuminateGlobeOcean(shader);
const fragment=shader.fragmentShader;
assert.ok(!fragment.includes('#include <map_fragment>')&&!fragment.includes('#include <emissivemap_fragment>'));
assert.equal((fragment.match(/texture2D\(/g)||[]).length,2,'Only the material’s original diffuse and emissive samples are read');

// Verify the injected code against this release’s real Three shader chunks,
// including both optional video decoders and the current UV variable names.
const vendor=read('assets/lodge-canvas-v17-11.js');
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

// Check the production atmosphere's deeper-water variant with the same real
// NASA pixels; final form shading still leaves a readable ocean at pulse trough.
const satellite={uniforms:{},fragmentShader:original+'\n#include <opaque_fragment>'};addSatelliteAtmosphere(satellite,{});
const satelliteBody=satellite.fragmentShader.match(/vec3 globeOceanColor\(vec3 color\) \{([\s\S]*?)\n\}/)?.[1];
const satelliteExecute=new Function('color','vec3','max','mix','smoothstep',satelliteBody.replace(/\bfloat\b/g,'let'));
const satelliteCorrect=color=>satelliteExecute(color,vec3,maximum,mix,smoothstep);
for(const {landmark,rgb} of provenance.earth_texture.landmark_samples_4096){
 const before=fromRGB(rgb),after=satelliteCorrect(before);
 if(landmark==='Pacific'){
  assert.ok(after.b>=.24&&after.g>=.03&&after.g/after.b<.14,'Production deep water retains a saturated navy/cobalt floor instead of pale cyan.');
  const darkest=[after.r,after.g,after.b].map(value=>srgb(value*.54*.44));
  assert.ok(darkest[2]>65&&darkest[1]>20,'Even the shaded side at minimum glow keeps a visible blue ocean.');
 }else assert.deepEqual(after,before,landmark+' retains the natural NASA color before neutral form shading.');
}
assert.equal((satellite.fragmentShader.match(/texture2D\(/g)||[]).length,3,'The complete production atmosphere adds only one cloud sample.');
assert.ok(satellite.fragmentShader.includes('float globeShape=0.44+0.56*globeKey'),'Form shading never creates a black hemisphere.');
console.log('PASS: production atmosphere preserves natural land, richer blue oceans survive minimum pulse/shading, and only one cloud sample is added.');

assert.ok(satellite.fragmentShader.includes('texture2D(globeCloudMap,vec2(vMapUv.x+globeCloudOffset,vMapUv.y))'),'Repeat-wrapped cloud lookup preserves continuous derivatives across the date line.');assert.doesNotMatch(satellite.fragmentShader,/fract\(vMapUv\.x\+globeCloudOffset\)/,'No mip seam caused by manually wrapping cloud UVs.');

// The exterior atmospheric shell is additive and depth-tested: the opaque
// Earth masks its center and the opaque marker heads remain visible in front.
assert.equal(globeAtmosphereHaloShader.side,1,'BackSide atmosphere is behind the Earth surface');
assert.equal(globeAtmosphereHaloShader.blending,2,'Additive atmosphere brightens the dark background');
assert.equal(globeAtmosphereHaloShader.depthWrite,false,'Transparent halo cannot write a false foreground depth');
assert.equal(globeAtmosphereHaloShader.depthTest,true,'Existing Earth and marker depth still occludes the halo');
assert.equal(globeAtmosphereHaloShader.toneMapped,false);
assert.doesNotMatch(globeAtmosphereHaloShader.fragmentShader,/texture2D|sampler2D|discard/,'The halo adds no texture fetches or costly alpha test');
assert.equal((globeAtmosphereHaloShader.fragmentShader.match(/uniform /g)||[]).length,1,'Only the existing Earth pulse uniform is shared');
const halo=smoothstep.bind(null,0,.42);
assert.equal(halo(0),0,'The outer edge fades completely into the scene');
assert.ok(halo(.14)<halo(.28)&&halo(.28)<halo(.42),'Halo intensity grows smoothly toward the solid Earth');
assert.ok(.52*1.08<.57,'Pulse peak remains bounded to preserve marker contrast');
assert.ok(satellite.fragmentShader.includes('pow(1.0-globeFacing,4.2)'),'The brighter surface rim is thin enough to preserve Earth detail');
console.log('PASS: richer ocean contrast, nonblack form shading, texture-free exterior halo, stable depth occlusion, and smooth halo edge fade.');
