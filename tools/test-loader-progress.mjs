import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../assets/index-v17-11.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('check=(now)=>{')+6,source.indexOf(';frame=window.requestAnimationFrame(check)'));
function run({readyAt=0,kind='posterReady',stall=false,complete=true}={}){
 let now=0,raf,values=[],timers=[],classes=[],attempts=0,reveals=0;
 const win={__wallGot:{h:true,p:true,l:true},__wallReady:true,__galleryFirstFrame:true,__iswasStartup:{posterReady:false,live:false,startScene(){attempts++}},requestAnimationFrame:fn=>(raf=fn,1),setTimeout:fn=>(timers.push(fn),1)};
 const doc={querySelector:()=>({classList:{add:x=>classes.push(x)}})};
 const check=new Function('window','document','performance','i','reveal',`let started=0,timer=0,frame=0,shown=0,lastStep=0,finished=false,completing=false;const check=${body};return check`)(win,doc,{now:()=>now},v=>values.push(v),()=>reveals++);
 raf=check;
 for(now=0;now<20000&&!classes.includes('is-complete');now+=16){win.__iswasStartup[kind]=now>=readyAt;if(stall&&now>500&&now<2500)continue;raf(now);if(now<readyAt&&values.length)assert.ok(values.at(-1)<=95,'An unpainted scene cannot finish from elapsed time alone')}
 if(complete){assert.deepEqual(values,Array.from({length:100},(_,i)=>i+1));assert.ok(classes.includes('is-complete'));assert.equal(reveals,0,'Completion is painted before revealing');while(timers.length)timers.shift()();assert.equal(reveals,1);assert.ok(classes.includes('is-revealing'))}
 else {assert.ok(values.at(-1)<=95);assert.equal(reveals,0);assert.equal(timers.length,0);assert.ok(attempts>0,'A delayed poster attempts the real scene instead of falsely completing')}
 if(readyAt===0)assert.equal(attempts,0,'Ready poster keeps initial scene work deferred until the loader reveal');
}
run();run({readyAt:5000});run({kind:'live',readyAt:5000});run({stall:true});run({readyAt:Infinity,complete:false});
console.log('PASS: decoded poster/live-scene readiness, sequential 1–100 after stalls, completion paint, delayed scene-start attempts, and no false timeout completion.');
