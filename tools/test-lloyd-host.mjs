import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const file = new URL('../assets/lloyd-host-v18-1.js', import.meta.url);
const source = readFileSync(file, 'utf8');
const css = readFileSync(new URL('../assets/lloyd-host-v18-1.css', import.meta.url), 'utf8');
const nodes = [], emitted = [], pauses = [], listeners = new Map();
let shows = 0, restored = 0;
const priorFocus = {isConnected:true,focus(options){assert.equal(options.preventScroll,true);restored++;document.activeElement=this;}};
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attributes={};this.dataset={};this.isConnected=false;this.open=false;this.textContent='';}
  append(...children){this.children.push(...children);for(const child of children)child.isConnected=true;}
  replaceChildren(...children){for(const child of this.children)child.isConnected=false;this.children=[];this.append(...children);}
  setAttribute(name,value){this.attributes[name]=value;}
  addEventListener(type,fn){this.events[type]=fn;}
  click(){this.events.click?.();}
  focus(options){assert.equal(options.preventScroll,true);document.activeElement=this;}
  showModal(){this.open=true;shows++;}
  close(){if(!this.open)return;this.open=false;this.events.close?.();}
  set innerHTML(value){
    this.markup=value;
    this.parts={img:new Element('img'),'.lloyd-host-close':new Element('button'),'.lloyd-host-reply':new Element('p'),'.lloyd-host-actions':new Element('div')};
  }
  querySelector(selector){return selector==='.lloyd-host-actions button'?this.parts['.lloyd-host-actions'].children[0]:this.parts[selector];}
}
const document = {
  readyState:'complete',activeElement:priorFocus,documentElement:{},
  head:{append(node){nodes.push(node);node.isConnected=true;}},
  body:{append(node){nodes.push(node);node.isConnected=true;}},
  getElementById(id){return nodes.find(node=>node.id===id);},
  createElement(tag){return new Element(tag);},
};
const window = {
  __iswasTour:{pause:reason=>pauses.push(reason)},
  addEventListener(type,fn){assert.equal(listeners.has(type),false,'Each global listener is installed once');listeners.set(type,fn);},
  dispatchEvent(event){emitted.push(event);if(event.type==='gallery-waypoint')assert.equal(dialog.open,false,'Navigation happens after dismissing the dialog');},
};
const context={document,window,URL,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
runInNewContext(source.replace(/^import .*;\n/m,'').replaceAll('export function ','function ').replaceAll('import.meta.url',JSON.stringify(file.href))+';this.openLloydHost=openLloydHost;this.installLloydAccess=installLloydAccess;',context);
assert.equal(nodes.filter(node=>node.tagName==='dialog').length,0,'Startup creates no conversation dialog or portrait');
const entry=nodes.find(node=>node.id==='lloyd-host-access');
assert.equal(entry.textContent,'TALK TO LLOYD');assert.equal(entry.attributes['aria-haspopup'],'dialog');
const style=nodes.find(node=>node.id==='lloyd-host-style');
assert.equal(style.href,new URL('../assets/lloyd-host-v18-1.css',file).href,'Stylesheet supports a nested GitHub Pages deployment');
context.installLloydAccess();assert.equal(nodes.filter(node=>node.id==='lloyd-host-access').length,1);
entry.click();
const dialog=nodes.find(node=>node.tagName==='dialog');
assert.ok(dialog.open);assert.equal(shows,1);assert.equal(pauses[0],'lloyd-host');
assert.equal(dialog.attributes['aria-labelledby'],'lloyd-host-title');assert.equal(dialog.attributes['aria-describedby'],'lloyd-host-greeting');
assert.match(dialog.markup,/WELCOME TO THE GOLD ROOM, I'M LLOYD/);
assert.equal(dialog.querySelector('img').src,new URL('../characters/lloyd/lloyd.webp',file).href);
assert.equal(emitted.at(-1).type,'iswas:lloyd-open');assert.equal(emitted.at(-1).detail.open,true);
const actions=()=>dialog.querySelector('.lloyd-host-actions').children;
const click=action=>{const button=actions().find(button=>button.dataset.lloydAction===action);assert.ok(button,action+' is offered');button.click();};
assert.equal(document.activeElement,actions()[0],'First question receives keyboard focus');
listeners.get('iswas:open-lloyd')();assert.equal(shows,1,'Repeated clicks do not stack modals or re-pause the tour');assert.equal(pauses.length,1);
click('recommend');assert.match(dialog.querySelector('.lloyd-host-reply').textContent,/GINGER ALE WITH LIME.*WITHOUT ALCOHOL/);
assert.equal(document.activeElement,dialog.querySelector('.lloyd-host-reply'),'An answer receives reading focus');
assert.deepEqual(actions().map(button=>button.dataset.lloydAction),['menu','explore']);
click('menu');click('guest');assert.match(dialog.querySelector('.lloyd-host-reply').textContent,/JACK TORRANCE.*JACK NICHOLSON IN THE SHINING/);
click('menu');assert.equal(actions().length,3,'Another question returns to the complete menu');
click('explore');assert.deepEqual(actions().map(button=>button.dataset.lloydAction),['go:bar','go:cigars','go:library','menu']);
for(const id of ['cigars','library','bar']){
  if(!dialog.open){document.activeElement=priorFocus;context.openLloydHost();click('explore');}
  const previous=actions();click('go:'+id);
  assert.equal(dialog.open,false);assert.equal(actions().length,0,'Closing releases old action handlers and resets the conversation');
  assert.ok(previous.every(button=>!button.isConnected));
  assert.equal(dialog.querySelector('.lloyd-host-reply').textContent,'');
  assert.equal(emitted.at(-1).type,'gallery-waypoint');assert.equal(emitted.at(-1).detail.id,id);
}
assert.equal(restored,3,'Every navigation returns focus without scrolling');
document.activeElement=priorFocus;context.openLloydHost();
assert.equal(actions().length,3);assert.match(dialog.querySelector('.lloyd-host-reply').textContent,/HOW MAY I HELP/);
assert.equal(nodes.filter(node=>node.tagName==='dialog').length,1,'Reopening reuses one native dialog and portrait');
dialog.querySelector('.lloyd-host-close').click();
assert.equal(dialog.open,false);assert.equal(restored,4);assert.equal(emitted.at(-1).type,'iswas:lloyd-close');assert.equal(emitted.at(-1).detail.open,false);
context.openLloydHost();dialog.close();assert.equal(restored,5,'Native Escape/outside close follows the same cleanup and focus path');
assert.match(source,/import '\.\/popup-behavior-v18-1\.js'/,'Shared outside pointer, wheel and touch dismissal is installed');
assert.match(css,/::backdrop\{background:transparent\}/);assert.match(css,/overscroll-behavior:contain/);assert.match(css,/\.lloyd-host-access:focus-visible/);
assert.match(css,/min-height:4[468]px/,'Visible controls have generous touch targets');
assert.doesNotMatch(source,/speechSynthesis|fetch\(|setInterval|requestAnimationFrame|<(?:audio|video|iframe)\b/,'Conversation needs no remote chat, media or continuous work');
console.log('PASS: lazy reusable native Lloyd conversation; exact greeting; recommendation and guest branches; repeat menu; three working room routes; tour pause; local media-stop signal; keyboard access; focus return; close cleanup and nested asset URLs.');
