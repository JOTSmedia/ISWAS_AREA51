import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../assets/index-v18-1.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/styles-v18-1.css',import.meta.url),'utf8');
assert.match(css,/html:not\(\.is-gallery\):not\(\.locations-layout\) \.sheet,\s*html:not\(\.is-gallery\):not\(\.locations-layout\) \.dossier-panel\{pointer-events:auto!important\}/,'Ordinary prose receives native pointer/touch events, while 360 and Locations retain their dedicated surfaces');
const start=source.indexOf('function zv(e,t){let n=Dc()'),end=source.indexOf('function Bv(',start);
function harness(){
 let now=1000,route='/',cursor=0,blocked=false;const listeners=new Map,refs=[],cleanups=[],navigations=[],tops=[];
 const heights={'/':900,'/need':1200,'/stars':500};
 const scrollingElement={scrollTop:0,scrollHeight:900,clientHeight:300};
 const document={scrollingElement,querySelector:()=>blocked?{}:null,documentElement:{classList:{contains:()=>false}}};
 const window={__v9Paused:true,scrollTo(x,y){scrollingElement.scrollTop=y;tops.push({route,y})},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 class Element{constructor(tagName,classes=[],parentElement=null){Object.assign(this,{tagName,classes,parentElement})}closest(selector){for(let element=this;element;element=element.parentElement)if(selector.split(',').some(part=>part.startsWith('.')?element.classes.includes(part.slice(1)):element.tagName===part))return element;return null}}
 const sheet=new Element('div',['sheet']),panel=new Element('div',['dossier-panel'],sheet),paragraph=new Element('p',[],panel),prose=new Element('span',[],paragraph),link=new Element('a',[],paragraph);
 const navigate=value=>{assert.equal(value.resetScroll,false,'Router cannot perform a second late reset after native scrolling resumes');navigations.push(value.to);render(value.to)};
 const context={I:{useRef:initial=>refs[cursor++]??=( {current:initial}),useLayoutEffect:fn=>fn(),useEffect:fn=>cleanups.push(fn())},Dc:()=>navigate,jv:Object.keys(heights).map(to=>({to})),window,document,performance:{now:()=>now},Element};
 vm.runInNewContext(source.slice(start,end)+';this.mount=zv',context);
 function render(next){cleanups.splice(0).filter(Boolean).forEach(fn=>fn());route=next;cursor=0;scrollingElement.scrollHeight=heights[route];context.mount(route,false)}
 render('/');
 return {window,navigations,tops,sc:scrollingElement,get route(){return route},advance:ms=>now+=ms,block:value=>blocked=value,bottom(){scrollingElement.scrollTop=scrollingElement.scrollHeight-scrollingElement.clientHeight},wheel(delta,modifiers={}){let prevented=false;listeners.get('wheel')({deltaY:delta,...modifiers,preventDefault(){prevented=true}});if(!prevented&&!modifiers.ctrlKey&&!modifiers.metaKey)scrollingElement.scrollTop=Math.max(0,Math.min(scrollingElement.scrollHeight-scrollingElement.clientHeight,scrollingElement.scrollTop+delta));return prevented},touchStart(y=200,{count=1,target=prose}={}){listeners.get('touchstart')({touches:Array.from({length:count},()=>({clientY:y,clientX:100})),target})},touchEnd(y=80,{remaining=0}={}){listeners.get('touchend')({touches:Array.from({length:remaining},()=>({clientY:y,clientX:100})),changedTouches:[{clientY:y,clientX:100}]})},touchCancel(){listeners.get('touchcancel')()},link};
}
{
 const h=harness();h.sc.scrollTop=300;assert.equal(h.wheel(100),false);assert.equal(h.route,'/');assert.equal(h.sc.scrollTop,400,'Ordinary text scroll remains native');
 h.bottom();h.advance(250);assert.equal(h.wheel(90),true);assert.equal(h.route,'/need');assert.equal(h.sc.scrollTop,0,'Boundary navigation snaps next content to the top during layout');assert.equal(h.tops.at(-1).route,'/need');
 h.advance(16);assert.equal(h.wheel(100),false);assert.equal(h.sc.scrollTop,100,'The next wheel event immediately continues scrolling the new content');
 for(let n=0;n<30;n++){h.advance(50);h.wheel(150)}
 assert.deepEqual(h.navigations,['/need'],'One inertial wheel gesture cannot skip multiple sections even after reaching the new bottom');assert.equal(h.sc.scrollTop,900);
 h.advance(221);h.wheel(90);assert.deepEqual(h.navigations,['/need','/stars'],'A fresh boundary gesture can intentionally advance again');assert.equal(h.sc.scrollTop,0);
 assert.equal(h.window.__v9Paused,true,'Manual section navigation never resumes the automatic tour');
 h.advance(500);h.wheel(-90);assert.equal(h.route,'/need');assert.equal(h.sc.scrollTop,0,'Backward boundary navigation also starts at the destination top');
}
{
 const h=harness();h.bottom();h.block(true);assert.equal(h.wheel(80),false);assert.equal(h.navigations.length,0,'Popup scrolling cannot change the background section');h.block(false);
 h.touchStart();h.touchEnd();assert.equal(h.route,'/need');assert.equal(h.sc.scrollTop,0,'An intentional boundary swipe starts the next section at its top');
 h.advance(500);h.touchStart();h.sc.scrollTop=150;h.touchEnd();assert.equal(h.route,'/need');assert.equal(h.sc.scrollTop,150,'A follow-up swipe scrolls the current section normally');
 h.touchStart();h.bottom();h.touchEnd();assert.equal(h.route,'/need','A swipe that only reaches the bottom does not accidentally skip its final content');
 h.advance(500);h.touchStart();h.touchEnd();assert.equal(h.route,'/stars');assert.equal(h.sc.scrollTop,0);
}

{
 const h=harness();h.bottom();
 for(const modifiers of [{ctrlKey:true},{metaKey:true}]){assert.equal(h.wheel(80,modifiers),false,'Browser zoom is never prevented');assert.equal(h.navigations.length,0,'Browser zoom cannot select another section')}
 h.touchStart(200,{count:2});h.touchEnd();assert.equal(h.navigations.length,0,'Two-finger zoom is not a boundary swipe');
 h.touchStart();h.touchStart(200,{count:2});h.touchEnd();assert.equal(h.navigations.length,0,'Adding a second finger cancels an eligible swipe');
 h.touchStart();h.touchEnd(80,{remaining:1});assert.equal(h.navigations.length,0,'A remaining finger prevents navigation');
 h.touchStart();h.touchCancel();h.touchEnd();assert.equal(h.navigations.length,0,'Browser-canceled gestures cannot navigate');
 h.touchStart(200,{target:h.link});h.touchEnd();assert.equal(h.navigations.length,0,'Interactive text remains exempt from boundary swipes');
 h.touchStart();h.touchEnd();assert.deepEqual(h.navigations,['/need'],'A fresh one-finger swipe on nested prose still works after cancellation');
 h.advance(500);h.bottom();h.touchEnd();assert.deepEqual(h.navigations,['/need'],'A duplicate touchend cannot replay the previous gesture');
}

console.log('PASS: layout-phase top reset, continued native scrolling, one transition per inertial wheel gesture, fresh-gesture navigation, popup guards, native prose targets, browser zoom preservation, single-finger/canceled gesture handling, and intentional boundary swipes without resuming the automatic tour.');
