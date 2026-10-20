import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../assets/popup-behavior-v17-13.js', import.meta.url), 'utf8');
const handlers = {};
let closed = 0;
const dialog = {
  dataset:{globeCompanion:'true'},
  getBoundingClientRect:()=>({left:20,right:600,top:100,bottom:750}),
  querySelector:()=>null,
  close:()=>closed++,
};
runInNewContext(source, {
  window:{__locationsViewport:{left:640,top:100,width:700,height:650}},
  document:{querySelectorAll:()=>[dialog],querySelector:()=>null,addEventListener:(name,fn)=>handlers[name]=fn},
});
function send(type,x,y,target=null){
  let prevented=false,stopped=false;
  const event={type,target,clientX:x,clientY:y,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}};
  if(type==='touchmove')event.touches=[{clientX:x,clientY:y}];
  handlers[type](event);
  return {prevented,stopped};
}
for(const type of ['pointerdown','wheel','touchmove']){
  assert.deepEqual(send(type,900,350),{prevented:false,stopped:false},'Globe dragging/scrolling remains available beside its case');
  assert.deepEqual(send(type,200,350),{prevented:false,stopped:false},'Case scrolling remains available');
  const zoomControl={closest:selector=>selector==='#globe-zoom-controls'?{}:null};
  assert.deepEqual(send(type,610,80,zoomControl),{prevented:false,stopped:false},'Zoom controls preserve the case even when positioned outside its globe rectangle');
}
assert.equal(closed,0);
assert.equal(send('pointerdown',610,80).prevented,true,'Click outside both panels dismisses');
assert.equal(closed,1);
assert.equal(send('click',610,80).prevented,true,'Dismissal click cannot activate underlying navigation');
dialog.dataset={};
assert.equal(send('pointerdown',900,350).prevented,true,'Other popups retain their outside-dismiss behavior');
assert.equal(closed,2);
assert.equal(send('pointerdown',610,80,{closest:()=>({})}).prevented,true,'Zoom controls do not exempt unrelated popups from outside dismissal');
assert.equal(closed,3);
const main=readFileSync(new URL('../assets/index-v17-13.js',import.meta.url),'utf8');
const navigation=main.slice(main.indexOf('function zv('),main.indexOf('function Bv('));
const navigationEvents={}, navigations=[];
let popupOpen=false;
const win={__locationsViewport:{width:400},scrollTo(){},addEventListener:(name,fn)=>navigationEvents[name]=fn,removeEventListener(){}};
runInNewContext(navigation+';zv(`/locations`,false)',{
  Dc:()=>value=>navigations.push(value),I:{useRef:current=>({current}),useLayoutEffect:fn=>fn(),useEffect:fn=>fn()},
  jv:[{to:'/stars'},{to:'/locations'},{to:'/form'}],window:win,
  document:{querySelector:selector=>popupOpen&&selector.includes('dialog[open]')?{}:null,scrollingElement:{scrollHeight:844,clientHeight:844,scrollTop:0}},
  performance:{now:()=>10000},
});
const wheel={deltaY:100,preventDefault(){throw Error('Panel scrolling must not be intercepted')}};
navigationEvents.wheel(wheel);assert.equal(navigations.length,0,'Locations scrolling cannot change sections');
win.__locationsViewport=null;popupOpen=true;
navigationEvents.wheel(wheel);assert.equal(navigations.length,0,'Native dialogs also suppress section scrolling');
popupOpen=false;navigationEvents.wheel({deltaY:100,preventDefault(){}});
assert.equal(navigations[0].to,'/form','Normal section scrolling remains available outside the workspace');
console.log('PASS: globe/case coexistence, preserved drag and scroll, section-navigation isolation, outside dismissal, click-through suppression, and other popup behavior.');
