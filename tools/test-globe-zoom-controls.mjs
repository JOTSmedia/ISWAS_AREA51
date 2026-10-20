import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the shipped controller against DOM event and observer boundaries.
const source = readFileSync(new URL('../assets/globe-zoom-v17-8.js', import.meta.url), 'utf8');
function harness(initial) {
  const observers = [], classes = new Set(), events = new Map(), readyEvents = new Map();
  const children = new Map(), emitted = [], pauses = [];
  let mounted, blocking = null, scans = 0, mounts = 0;
  const node = () => ({hidden:false,value:'118',disabled:false,attributes:{},listeners:new Map(),
    setAttribute(name,value){this.attributes[name]=value},
    addEventListener(name,handler,options){this.listeners.set(name,{handler,options})},
    fire(name,event={}){this.listeners.get(name)?.handler(event)}});
  const root = {classList:{contains:name=>classes.has(name)}};
  const body = {append(item){mounted=item;mounts++}};
  const document = {
    readyState:'loading',documentElement:root,body,
    addEventListener(name,handler,options){readyEvents.set(name,{handler,options})},
    getElementById:id=>mounted?.id===id?mounted:null,
    querySelector:selector=>{scans++;return blocking&&selector.includes(blocking)?{}:null},
    createElement(){const element=node();element.querySelector=selector=>{if(!children.has(selector))children.set(selector,node());return children.get(selector)};return element}
  };
  const window = {
    ...(initial===undefined?{}:{__globeZoom:initial}),
    __iswasTour:{pause:reason=>pauses.push(reason)},
    addEventListener(name,handler){if(!events.has(name))events.set(name,[]);events.get(name).push(handler)},
    dispatchEvent(event){emitted.push(event);for(const handler of events.get(event.type)||[])handler(event)}
  };
  class MutationObserver {constructor(callback){this.callback=callback;observers.push(this)}observe(target,options){this.target=target;this.options=options}}
  class CustomEvent {constructor(type,options){this.type=type;this.detail=options.detail}}
  runInNewContext(source,{document,window,MutationObserver,CustomEvent});
  const ready=()=>readyEvents.get('DOMContentLoaded').handler();
  const rootChange=()=>observers.find(observer=>observer.target===root).callback([]);
  const bodyChange=changes=>observers.find(observer=>observer.target===body).callback(changes);
  return {window,children,classes,emitted,pauses,observers,ready,rootChange,bodyChange,
    get controls(){return mounted},get mounts(){return mounts},get scans(){return scans},
    block(value){blocking=value;bodyChange([{type:'attributes'}])}};
}

const app=harness();
assert.equal(app.window.__globeZoom,1.18,'Closer default is shared before the scene starts');
assert.equal(app.controls,undefined,'No mutation before DOMContentLoaded');
app.ready();app.ready();assert.equal(app.mounts,1,'Repeated initialization does not duplicate the toolbar');
const minus=app.children.get('.globe-zoom-minus'), plus=app.children.get('.globe-zoom-plus'), reset=app.children.get('.globe-zoom-reset'), range=app.children.get('input'), output=app.children.get('output');
assert.equal(app.controls.hidden,true,'Controls wait for an interactive globe and painted scene');
app.classes.add('globe-zoom-active');app.rootChange();assert.equal(app.controls.hidden,true);
app.classes.add('iswas-scene-ready');app.classes.add('iswas-loading');app.rootChange();assert.equal(app.controls.hidden,true);
app.classes.delete('iswas-loading');app.rootChange();assert.equal(app.controls.hidden,false);
assert.equal(reset.disabled,true,'Reset is disabled only at the starting view');
plus.fire('click');assert.equal(app.window.__globeZoom,1.3);assert.equal(output.textContent,'130%');
assert.equal(range.attributes['aria-valuetext'],'130 percent');
assert.equal(app.emitted.at(-1).detail.zoom,1.3);assert.equal(app.pauses.at(-1),'globe-zoom');
range.value='500';range.fire('input');assert.equal(app.window.__globeZoom,2.4);assert.equal(plus.disabled,true);assert.equal(minus.disabled,false);
range.value='0';range.fire('input');assert.equal(app.window.__globeZoom,.8);assert.equal(minus.disabled,true);assert.equal(plus.disabled,false);
range.value='173';range.fire('input');assert.equal(app.window.__globeZoom,1.73,'Native range input supports keyboard and touch values');
app.classes.delete('globe-zoom-active');app.rootChange();assert.equal(app.controls.hidden,true);assert.equal(app.window.__globeZoom,1.73,'Leaving the globe preserves the chosen scale');
app.classes.add('globe-zoom-active');app.classes.add('is-gallery');app.rootChange();assert.equal(app.controls.hidden,false);assert.equal(output.textContent,'173%','360 and Locations share one state');
app.block('dialog[open]');assert.equal(app.controls.hidden,true,'Other dialogs hide the globe controls');
app.block(null);assert.equal(app.controls.hidden,false,'Closing the dialog restores the controls');
const beforeScans=app.scans;
app.bodyChange([{type:'childList',addedNodes:[{nodeType:3}],removedNodes:[]}]);
app.bodyChange([{type:'childList',addedNodes:[{nodeType:1,matches:()=>false,querySelector:()=>null}],removedNodes:[]}]);
assert.equal(app.scans,beforeScans,'Animated text and unrelated archive rows do not cause visibility queries');
const bodyObserver=app.observers.find(item=>item.options.childList);
assert.deepEqual([...bodyObserver.options.attributeFilter],['open'],'No observer watches frame-rate inline styles');
let stopped=0,prevented=0;
app.controls.fire('wheel',{ctrlKey:true,stopPropagation(){stopped++},preventDefault(){prevented++}});
app.controls.fire('keydown',{key:'ArrowRight',stopPropagation(){stopped++},preventDefault(){prevented++}});
assert.equal(stopped,2);assert.equal(prevented,0,'Browser zoom and native range keyboard behavior retain default actions');
assert.equal(app.controls.listeners.get('wheel').options.passive,true);
reset.fire('click');assert.equal(app.window.__globeZoom,1.18);assert.equal(output.textContent,'118%');
assert.equal(reset.disabled,true);
const clamped=harness(7);clamped.ready();assert.equal(clamped.window.__globeZoom,2.4,'Preexisting out-of-range state is bounded');
const invalid=harness('bad');invalid.ready();assert.equal(invalid.window.__globeZoom,1.18,'Invalid state falls back safely');
console.log('PASS: globe zoom DOM readiness, single toolbar, scene/modal visibility, shared state, bounds, reset, accessible value, gesture defaults, tour pause, and filtered observers.');
