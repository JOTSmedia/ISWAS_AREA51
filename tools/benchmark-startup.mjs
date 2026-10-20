import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Deterministic timing simulation, not browser/network/GPU wall time.
// Execute the shipped loader effect and startup script instead of copying their
// progress formula. A decoded-poster event and a scene-ready event are inputs.
const FRAME_MS = 1000 / 60;
const MAX_MS = 12000;
const releases = [
  {name:'v18 baseline',root:new URL('../../ISWAS_v18/', import.meta.url),suffix:'v18'},
  {name:'v18.1 current',root:new URL('../', import.meta.url),suffix:'v18-1'},
];
const scenarios = [
  {name:'POSTER DECODED AT 0MS',posterAt:0},
  {name:'POSTER DECODED AT 5000MS',posterAt:5000},
  {name:'NO POSTER; SCENE READY AT 5000MS',sceneAt:5000},
  {name:'NEITHER READY WITHIN 12000MS'},
];

function loaderEffect(source) {
  const start = source.indexOf('let started=performance.now(),timer=0,frame=0');
  const cleanup = 'return()=>{finished=true;window.clearTimeout(timer);window.cancelAnimationFrame(frame)}';
  const end = source.indexOf(cleanup, start);
  assert.ok(start >= 0 && end > start, 'Locate the actual loader effect and cleanup');
  return source.slice(start, end + cleanup.length);
}

function simulate(release, scenario) {
  const main = readFileSync(new URL(`assets/index-${release.suffix}.js`, release.root), 'utf8');
  const startup = readFileSync(new URL(`assets/startup-${release.suffix}.js`, release.root), 'utf8');
  let now = 0, next = 1, image, showLodge, hundredAt, revealAt, requestAt, sceneEnabledAt;
  const frames = new Map(), timers = new Map(), progress = [], classes = new Set();
  const classList = {add(name){classes.add(name);if(name==='is-complete')hundredAt ??= now;},remove(name){classes.delete(name);}};
  const document = {
    documentElement:{classList},
    querySelector(selector){return selector==='.load-screen'?{classList}:selector==='.overview-hero .hero-title'?{style:{}}:null;},
  };
  const raf = fn => {const id=next++;frames.set(id,fn);return id;};
  const later = (fn, delay=0) => {const id=next++;timers.set(id,{at:now+delay,fn});return id;};
  const window = {
    __ISWAS_BASE:'/',__ISWAS_ROUTE:'/',__wallGot:{h:true,p:true,l:true},
    requestAnimationFrame:raf,cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:later,clearTimeout:id=>timers.delete(id),
  };
  Object.defineProperty(window,'__showLodge',{
    get:()=>showLodge,set:value=>{showLodge=value;if(value)sceneEnabledAt ??= now;},
  });
  class Image {
    constructor(){image=this;}
    // The chosen scenario supplies the time at which decoding has completed.
    decode(){return {then:ready=>ready()};}
  }
  runInNewContext(startup, {window,document,Image,requestAnimationFrame:raf,cancelAnimationFrame:id=>frames.delete(id),setTimeout:later});
  const startScene=window.__iswasStartup.startScene;
  window.__iswasStartup.startScene=function(){requestAt ??= now;return startScene.call(this);};
  const cleanup = new Function('window','document','performance','i','done',loaderEffect(main))(
    window,document,{now:()=>now},value=>progress.push({value,at:now}),{current(){revealAt ??= now;}},
  );
  if (scenario.posterAt !== undefined) later(()=>image.onload(),scenario.posterAt);
  if (scenario.sceneAt !== undefined) later(()=>window.__iswasStartup.sceneReady(),scenario.sceneAt);
  const runDueTimers = frameTime => {
    while (true) {
      const due = [...timers.entries()].filter(([,timer])=>timer.at<=frameTime).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];
      if(!due)return;
      timers.delete(due[0]);now=due[1].at;due[1].fn();
    }
  };
  for (let frame=1;frame*FRAME_MS<=MAX_MS;frame++) {
    const frameTime = frame * FRAME_MS;
    runDueTimers(frameTime);now=frameTime;
    const batch=[...frames.values()];frames.clear();
    for(const fn of batch)fn(now);
    if(revealAt!==undefined&&sceneEnabledAt!==undefined)break;
  }
  const increments=progress.filter((entry,index)=>index===0||entry.value!==progress[index-1].value);
  if (scenario.posterAt!==undefined || scenario.sceneAt!==undefined) {
    assert.deepEqual(increments.map(entry=>entry.value),Array.from({length:100},(_,index)=>index+1),`${release.name}: all 100 values are shown in order`);
    assert.ok(increments.every((entry,index)=>index===0||entry.at>increments[index-1].at),'No two visible increments are collapsed into one animation frame');
    assert.ok(revealAt>hundredAt,'100% is presented before reveal');
  } else {
    assert.equal(increments.at(-1)?.value,95,'Unready content remains capped at 95%');
    assert.equal(revealAt,undefined,'No timeout can falsely reveal unready content');
    assert.ok(requestAt>=1500,'A missing poster attempts real scene startup');
  }
  if(scenario.posterAt===0)assert.ok(requestAt>=revealAt,'A ready poster defers scene creation until reveal');
  cleanup();
  return {
    release:release.name,scenario:scenario.name,
    progress100Ms:hundredAt??null,revealMs:revealAt??null,
    sceneStartRequestMs:requestAt??null,sceneEnabledMs:sceneEnabledAt??null,
    firstStepMs:increments[0]?.at??null,visibleSteps:increments.length,
    progressAnimationMs:hundredAt===undefined?null:hundredAt-(increments[0]?.at??0),
    finalProgress:increments.at(-1)?.value??0,
  };
}

const results=releases.flatMap(release=>scenarios.map(scenario=>simulate(release,scenario)));
if(process.argv.includes('--json'))console.log(JSON.stringify({method:'SIMULATION: actual shipped loader/startup JavaScript, synthetic 60Hz RAF and readiness events; not browser wall time.',frameRateHz:60,results},null,2));
else {
  console.log('SIMULATION: actual shipped loader/startup JavaScript with synthetic 60Hz RAF.');
  console.log('Times are simulated milliseconds from loader mount, not browser/network/GPU wall time.');
  console.log('Poster decoding and scene readiness occur at the scenario times; scene enabled means __showLodge, not a rendered frame.');
  console.table(results.map(row=>({
    release:row.release,scenario:row.scenario,
    '100% (ms)':row.progress100Ms===null?'—':Math.round(row.progress100Ms),
    'animation (ms)':row.progressAnimationMs===null?'—':Math.round(row.progressAnimationMs),
    'reveal (ms)':row.revealMs===null?'—':Math.round(row.revealMs),
    'scene requested (ms)':row.sceneStartRequestMs===null?'—':Math.round(row.sceneStartRequestMs),
    'scene enabled (ms)':row.sceneEnabledMs===null?'—':Math.round(row.sceneEnabledMs),
    'visible steps':row.visibleSteps,
  })));
  const baseline=results.find(row=>row.release===releases[0].name&&row.scenario===scenarios[0].name);
  const current=results.find(row=>row.release===releases[1].name&&row.scenario===scenarios[0].name);
  console.log(`Ready-poster loader reaches 100% in ${Math.round(baseline.progress100Ms)}ms (baseline) versus ${Math.round(current.progress100Ms)}ms (current); simulated difference ${Math.round(baseline.progress100Ms-current.progress100Ms)}ms.`);
  console.log('Verification: every 1–100 value gets its own RAF; 100% precedes reveal; missing readiness stays at 95% and attempts scene startup.');
}
