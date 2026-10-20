import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/lodge-canvas-v17-15.js',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('function frameStarsArrival('),source.indexOf('function tourSceneReady('));
const presetStart=source.indexOf('xy={')+3,presetEnd=source.indexOf(';function tourSection',presetStart);
const presets=new Function('return ('+source.slice(presetStart,presetEnd)+')')();
const vector=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})}});
const frame=new Function('xy',helper+';return frameStarsArrival')(presets);
for(const section of ['/need','/locations']){
 const from=presets[section].position[0],to=20.15,trip={from,to,section:'/stars'};
 const desired=vector(),target=vector();
 for(let tick=0;tick<=240;tick++){
  const u=tick/240,ease=u*u*(3-2*u),travel=from+(to-from)*ease;
  assert.equal(frame(section,trip,travel,desired,target),true);
  for(const [key,v] of [['position',desired],['target',target]])for(const [i,axis] of ['x','y','z'].entries()){
   const a=presets[section][key][i],b=presets['/stars'][key][i];
   assert.ok(v[axis]>=Math.min(a,b)-1e-10&&v[axis]<=Math.max(a,b)+1e-10,'Every camera/aim coordinate stays between its endpoints');
  }
 }
 assert.deepEqual([desired.x,desired.y,desired.z],presets['/stars'].position,'Final approach is the exact opening camera, before route commit');
 assert.deepEqual([target.x,target.y,target.z],presets['/stars'].target,'Final aim matches the destination without any compensating snap');
}
assert.equal(frame('/need',null,11.2,vector(),vector()),false);
assert.equal(frame('/need',{section:'/form'},11.2,vector(),vector()),false);
assert.doesNotMatch(source,/if\(\(e===`\/stars`\|\|window\.__tourSec===`\/stars`\)/,'Nearest-section detection cannot prematurely apply the absolute Stars camera');
assert.match(source,/\[`\/stars`,20\.15\]/,'Tour waypoint matches Stars physical camera');
assert.match(source,/starsArrivalTrip=trip;let progress=/,'Trip is retained through its final frame even when navigation is dispatched');
assert.match(source,/frameStarsArrival\(e,starsArrivalTrip,p\.current,w,T\)/,'The production camera uses the corrected approach');
console.log('PASS: bidirectional Stars arrival stays within all camera/aim endpoints and ends at the exact opening view; no nearest-section activation or duplicated travel offset.');
