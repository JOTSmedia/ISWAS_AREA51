import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const file = new URL('../assets/donnie-darko-ui-v17-9.js', import.meta.url);
const source = readFileSync(file, 'utf8');
const emitted = [];
const windowEvents = {};
const nodes = [];
const pauseReasons = [];
let focusReturns = 0;
let modalShows = 0;
const priorFocus = {isConnected:true,focus:options => {assert.equal(options.preventScroll,true);focusReturns++;}};
const children = () => ({
  image:{},
  close:{addEventListener(name,fn){this[name]=fn;},focus(options){assert.equal(options.preventScroll,true);this.focused=true;}},
});
const document = {
  readyState:'complete',activeElement:priorFocus,documentElement:{},
  head:{append(node){nodes.push(node);}},
  body:{append(node){nodes.push(node);node.isConnected=true;}},
  getElementById(id){return nodes.find(node=>node.id===id);},
  querySelector(){return priorFocus;},
  createElement(tag){
    const contents=children();
    const element={tagName:tag,open:false,isConnected:false,events:{},attributes:{},
      addEventListener(name,fn){this.events[name]=fn;},
      setAttribute(name,value){this.attributes[name]=value;},
      querySelector(selector){return selector==='img'?contents.image:contents.close;},
      showModal(){this.open=true;modalShows++;},
      close(){this.open=false;this.events.close?.();},
    };
    return element;
  },
};
const context = {
  document,URL,
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  window:{
    __iswasTour:{pause:reason=>pauseReasons.push(reason)},
    addEventListener(name,fn){windowEvents[name]=fn;},
    dispatchEvent(event){emitted.push(event);},
  },
};
runInNewContext(source.replace(/^import .*;\n/m,'').replace('export function openDonnieDarko','function openDonnieDarko').replaceAll('import.meta.url',JSON.stringify(file.href)),context);
assert.equal(nodes.filter(node=>node.tagName==='dialog').length,0,'No modal or artwork is created during initial loading');
assert.ok(nodes.find(node=>node.id==='donnie-mirror-access'),'Keyboard-only alternative exists without a toolbar button');
windowEvents['iswas:open-donnie-darko']();
const dialog=nodes.find(node=>node.tagName==='dialog');
assert.ok(dialog.open);
assert.equal(modalShows,1,'Native modal contains keyboard focus');
assert.equal(dialog.attributes['aria-labelledby'],'donnie-darko-title');
assert.match(dialog.querySelector('img').src,/ISWAS_v17\.9\/plates\/donnie-darko-mirror\.webp$/,'Artwork uses a nested-deployment-safe local URL');
assert.deepEqual(pauseReasons,['donnie-darko'],'Movie reading explicitly pauses the tour');
windowEvents['iswas:open-donnie-darko']();
assert.equal(modalShows,1,'Repeat mirror activation cannot stack dialogs');
dialog.querySelector('.donnie-darko-close').click();
assert.equal(dialog.open,false);
assert.equal(focusReturns,1,'Closing returns focus without scrolling the underlying section');
assert.equal(emitted.at(-1).detail.open,false);
windowEvents['iswas:open-donnie-darko']();
assert.equal(nodes.filter(node=>node.tagName==='dialog').length,1,'Reopening reuses the dialog and image');
assert.equal(dialog.scrollTop,0,'Reopening starts at the film heading');
assert.equal(modalShows,2);
assert.match(source,/import '\.\/popup-behavior-v17-9\.js'/,'Movie participates in shared outside-click, wheel and touch dismissal');
assert.match(source,/::backdrop\{background:transparent\}/,'Gallery remains visible around the popup');
assert.match(source,/overscroll-behavior:contain/,'Scrolling the movie cannot scroll its background');
assert.doesNotMatch(source,/<(?:audio|video|iframe)\b|requestAnimationFrame|setInterval|fetch\(/,'The movie popup adds no media autoplay, frame loop or external request');
assert.match(readFileSync(new URL('../assets/index-v17-9.js',import.meta.url),'utf8'),/^import '\.\/donnie-darko-ui-v17-9\.js';/,'Main entry installs the lightweight mirror listener');
console.log('PASS: lazy native movie dialog, nested asset URL, tour pause, no duplicate modal, focus return, reopening, accessible entry and shared outside dismissal.');
