import fs from 'node:fs';
import assert from 'node:assert/strict';

const dataModule=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const lifetime=dataModule(fs.readFileSync(new URL('../assets/bubble-lifetime-v17-8.js',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../assets/morgan-bubbles-v17-8.js',import.meta.url),'utf8').replace("'./bubble-lifetime-v17-8.js'",JSON.stringify(lifetime));

let measuredHeight=64;
class Element {
 constructor(){this.style={};this.children=[];this.hidden=false;this.attributes={};this.classes=new Set;this.classList={add:name=>this.classes.add(name),toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};}
 append(...children){this.children.push(...children)}
 setAttribute(name,value){this.attributes[name]=value}
 getAttribute(name){return this.attributes[name]??null}
 get offsetHeight(){const width=parseFloat(this.style.width)||160;return measuredHeight==='realistic'?(width<=120?124:width<=160?105:86):measuredHeight}
 getBoundingClientRect(){const left=parseFloat(this.style.left)||0,top=parseFloat(this.style.top)||0,width=parseFloat(this.style.width)||0,height=this.offsetHeight;return{left,top,width,height,right:left+width,bottom:top+height}}
 remove(){}
}
const timers=new Map;let nextTimer=1;
globalThis.setTimeout=(callback,delay)=>{const id=nextTimer++;timers.set(id,{callback,delay});return id};
globalThis.clearTimeout=id=>timers.delete(id);
globalThis.window={__morganInTransit:false};
globalThis.innerWidth=1000;globalThis.innerHeight=800;
globalThis.document={hidden:false,createElement:()=>new Element,createElementNS:()=>new Element,querySelector:()=>null};
const {createMorganBubbles,wormholeGeometry}=await import(dataModule(source));
const guide=new Element,finished=[];
const bubbles=createMorganBubbles({guide,onAction(){},onDone:kind=>finished.push(kind)});
const [bubble,tail]=guide.children;
const anchor=(left=100,top=300,width=100,height=150)=>({rect:{left,top,width,height},mouth:{x:left+width*.56,y:top+height*.132},chest:{x:left+width*.537,y:top+height*.228},visible:true});
const context=(key,kind='library',position=anchor())=>({key,kind,text:'NEED A HAND? ASK MORGAN.',anchor:position});

bubbles.update(context('library-1'),100);
assert.equal(bubble.hidden,false);
window.__morganInTransit=true;
bubbles.update(context('controls-1','controls'),200);
assert.deepEqual(finished,[],'A new owner waiting for its arrival flight must not inherit the previous bubble’s started state.');
window.__morganInTransit=false;
bubbles.update(context('controls-1','controls'),300);
assert.equal(bubble.hidden,false,'Controls greeting survives the flight handoff.');
const mouth=anchor().mouth;
assert.ok(bubble.getBoundingClientRect().left-mouth.x<=24,'The readable text remains close to Morgan’s head without covering him.');
assert.equal(tail.className,'morgan-wormhole-path');
assert.equal(tail.src,'/characters/morgan/wormhole-path.webp','All visits share the optimized local image.');
assert.equal(tail.alt,'','The connector is decorative and does not repeat speech to screen readers.');
assert.equal(tail.attributes['aria-hidden'],'true');
assert.equal(tail.children.length,0,'No SVG mouth triangle remains.');
const chest=anchor().chest,pathAngle=Number(tail.style.transform.match(/rotate\(([-.\d]+)rad\)/)[1]);
const imageWidth=parseFloat(tail.style.width),imageHeight=parseFloat(tail.style.height);
const startX=parseFloat(tail.style.left)+imageWidth*.051*Math.cos(pathAngle)-imageHeight*.466*Math.sin(pathAngle);
const startY=parseFloat(tail.style.top)+imageWidth*.051*Math.sin(pathAngle)+imageHeight*.466*Math.cos(pathAngle);
assert.ok(Math.hypot(startX-chest.x,startY-chest.y)<.001,'The liquid source endpoint sits exactly on the projected sternum.');
assert.ok(Math.hypot(startX-mouth.x,startY-mouth.y)>10,'The connector starts at the chest, not the mouth.');
const geometry=wormholeGeometry(chest,bubble.getBoundingClientRect(),{width:1000,height:800});
assert.ok(geometry.distance>=16&&geometry.distance<=90,'The path remains compact.');
for(const [rect,label] of [[{left:250,right:350,top:280,bottom:340},'right'],[{left:70,right:150,top:280,bottom:340},'left']]){
 const g=wormholeGeometry({x:200,y:320},rect,{width:1000,height:800});
 assert.ok(g,'The same image connects to a bubble on the '+label);
 const x=g.left+g.width*.958*Math.cos(g.angle)-g.height*.506*Math.sin(g.angle);
 const y=g.top+g.width*.958*Math.sin(g.angle)+g.height*.506*Math.cos(g.angle);
 assert.ok(Math.hypot(x-g.end.x,y-g.end.y)<.001,'The image outlet reaches the closest bubble edge on the '+label);
}
assert.equal(wormholeGeometry({x:100,y:300},{left:300,right:400,top:280,bottom:340},{width:1000,height:800}),null,'Long floating paths are rejected.');
assert.equal(wormholeGeometry({x:4,y:4},{left:40,right:140,top:10,bottom:50},{width:320,height:568}),null,'The rotated image cannot spill outside the screen.');
const css=fs.readFileSync(new URL('../assets/styles-v17-8.css',import.meta.url),'utf8');
assert.doesNotMatch(source,/createElementNS|morgan-bubble-tail|<svg/,'No viewport SVG or mouth tail is created.');
assert.match(css,/\.morgan-wormhole-path\{[^}]*pointer-events:none!important/,'The image cannot impede books, controls or bubble buttons.');
assert.match(css,/\.morgan-speech-bubble:after\{content:none!important/,'The legacy triangle is disabled at its source.');
const close=bubble.children[1];
close.onclick({stopPropagation(){}});
assert.equal(bubble.hidden,true,'The X closes the greeting.');
bubbles.update(context('controls-1','controls'),400);
assert.equal(bubble.hidden,true,'An explicitly closed greeting does not reappear.');
assert.deepEqual(finished,['controls']);

globalThis.innerWidth=320;
bubbles.update(context('controls-2','controls',anchor(108,300,76,114)),500);
assert.equal(bubble.hidden,false,'The mobile greeting fits beside the controls avatar.');
assert.ok(bubble.getBoundingClientRect().right<=310,'Mobile bubble remains inside the viewport.');
const expiry=[...timers.values()].find(timer=>timer.delay===3000);
assert.ok(expiry,'The hard deadline is scheduled for three seconds.');
expiry.callback();
assert.equal(bubble.hidden,true,'The hard deadline hides the bubble independently of animation frames.');
bubbles.update(context('controls-2','controls',anchor(108,300,76,114)),3600);
assert.equal(bubble.hidden,true,'A timed-out greeting cannot restart.');
// The welcome has a longer reading budget, but loading, camera travel and an
// initially blocked candidate never consume that budget or cancel the greeting.
globalThis.innerWidth=1000;measuredHeight='realistic';
let sceneReady=false,mastRect=null,hero={left:0,right:1000,top:0,bottom:800};
document.documentElement={classList:{contains:name=>name==='iswas-scene-ready'&&sceneReady}};
document.querySelector=selector=>selector==='.dossier-panel'&&hero?{getBoundingClientRect:()=>hero}:selector==='.mast'&&mastRect?{getBoundingClientRect:()=>mastRect}:null;
window.__morgan3D={isReady:false};
const initial=context('initial','initial');
bubbles.update(initial,10000);assert.equal(bubble.hidden,true,'Loading cannot start the welcome');
sceneReady=true;bubbles.update(initial,11000);assert.equal(bubble.hidden,true,'The actual likeness must be loaded before greeting');
window.__morgan3D.isReady=true;
bubbles.update(initial,12000);
bubbles.update(context('initial','initial',anchor(130)),12200);
bubbles.update(context('initial','initial',anchor(160)),12400);
assert.equal(bubble.hidden,true,'Moving camera anchors do not start the welcome');
for(const now of [12600,12800,13000])bubbles.update(context('initial','initial',anchor(160)),now);
assert.equal(bubble.hidden,true,'A blocked placement waits instead of spending the welcome');
assert.equal(finished.includes('initial'),false,'A temporary layout obstruction does not permanently dismiss the welcome');
hero={left:390,right:900,top:200,bottom:700};
bubbles.update(context('initial','initial',anchor(160)),13032);
assert.equal(bubble.hidden,false,'The welcome appears when a valid chest-connected candidate is available');
assert.ok(bubble.getBoundingClientRect().right<=hero.left,'Alternate widths keep the opening bubble clear of hero text');
assert.equal([...timers.values()].filter(timer=>timer.delay===8000).length,1,'Welcome gets a full eight-second timer after placement succeeds');
for(let now=13064;now<=16032;now+=32)bubbles.update(context('initial','initial',anchor(160)),now);
assert.equal(bubble.hidden,false,'The opening greeting remains after the former three-second deadline');
bubbles.update(context('initial','initial',anchor(160)),20782);
assert.ok(bubble.classes.has('is-fading'),'Welcome fades during its final quarter second');
bubbles.update(context('initial','initial',anchor(160)),21032);
assert.equal(bubble.hidden,true,'Welcome ends at eight seconds');
bubbles.update(context('initial','initial',anchor(160)),22000);
assert.equal(bubble.hidden,true,'An expired welcome never returns');
window.__ISWAS_BASE='/ISWAS_v17.8/';window.location={pathname:'/ISWAS_v17.8/'};
for(const now of [23000,23200,23400,23600])bubbles.update(context('initial-route','initial',anchor(160)),now);
assert.equal(bubble.hidden,false,'Welcome is eligible on the nested Overview route');
window.__tourUntil=99999;window.location.pathname='/ISWAS_v17.8/need';
bubbles.update(context('initial-route','initial',anchor(160)),23632);
assert.equal(bubble.hidden,true,'Leaving Overview immediately dismisses the greeting');
assert.equal(window.__tourUntil,99999,'Greeting never changes the tour deadline');
window.location.pathname='/ISWAS_v17.8/';
bubbles.update(context('initial-route','initial',anchor(160)),23700);
assert.equal(bubble.hidden,true,'Returning cannot restart a welcome dismissed on route exit');
window.location.pathname='/ISWAS_v17.8/stars/';
bubbles.update(context('late-initial','initial',anchor(160)),24000);
window.location.pathname='/ISWAS_v17.8/';
for(const now of [25000,25200,25400,25600])bubbles.update(context('late-initial','initial',anchor(160)),now);
assert.equal(bubble.hidden,true,'A welcome from another initial route never appears late');
// Real desktop projection and measured text heights from browser QA. A layout
// obstruction is recoverable; genuine loss of the avatar still ends the visit.
window.__tourStopSection='/';window.__tourStopStartedAt=0;window.__tourUntil=39000;
hero={left:300,right:1000,top:150,bottom:720};
const realAnchor={rect:{left:-50,top:250,width:307,height:400},mouth:{x:141.5,y:299.35},chest:{x:128.5,y:338.9},visible:true};
const realContext=context('stress-initial','initial',realAnchor);
for(const now of [29000,29200,29400,29600])bubbles.update(realContext,now);
assert.equal(bubble.hidden,true,'Zero arrival marker means camera travel is pending, not an arrival at time zero');
window.__tourStopStartedAt=30000;
bubbles.update(realContext,30000);assert.equal(bubble.hidden,true,'Arrival marker allows a brief projection settle');
bubbles.update(realContext,30100);assert.equal(bubble.hidden,false,'Real124px text height fits beside the projected face');
assert.equal(bubble.getBoundingClientRect().height,124);
const proofDeadline=[...timers.entries()].find(([,timer])=>timer.delay===8000)?.[0];
assert.ok(proofDeadline);const initialFinished=finished.length;
for(let i=1;i<=8;i++){
 const jitter={rect:{...realAnchor.rect,width:307+i*.04},mouth:{x:141.5+i*.15,y:299.35+Math.sin(i)*.2},chest:{x:128.5+i*.15,y:338.9+Math.sin(i)*.2},visible:true};
 bubbles.update(context('stress-initial','initial',jitter),30100+i*100);
 assert.equal(bubble.hidden,false,'Subpixel camera/breathing changes preserve the readable greeting');
}
hero={left:0,right:1000,top:0,bottom:800};bubbles.update(realContext,31000);
assert.equal(bubble.hidden,true,'Impossible placement hides instead of covering the hero');
assert.equal(finished.length,initialFinished,'One bad placement never permanently dismisses the greeting');
hero={left:300,right:1000,top:150,bottom:720};bubbles.update(realContext,31100);
assert.equal(bubble.hidden,false,'A greeting recovers on the next valid placement');
assert.ok(timers.has(proofDeadline),'Recovery preserves the original deadline instead of starting another8s');
assert.equal(window.__tourUntil,39000,'Welcome remains concurrent with the existing9s hold');
window.__morganProjection={...realAnchor,at:30100};
bubbles.update({...realContext,anchor:null},31132);
assert.equal(bubble.hidden,false,'A slow paint cannot dismiss its still-visible last avatar projection');
window.__morganProjection={visible:false,at:31164};
bubbles.update({...realContext,anchor:{...realAnchor,visible:false}},31200);
assert.equal(bubble.hidden,true);bubbles.update(realContext,31300);
assert.equal(bubble.hidden,true,'An actual offscreen avatar still permanently dismisses the greeting');
// Narrow mobile: full-height text beside the face and above the content panel.
globalThis.innerWidth=320;globalThis.innerHeight=568;
hero={left:12,right:308,top:340,bottom:520};window.__tourStopStartedAt=40000;
const mobileInitial=context('mobile-initial','initial',{rect:{left:-70,top:120,width:170,height:230},mouth:{x:40,y:150},chest:{x:36,y:174},visible:true});
bubbles.update(mobileInitial,40100);
assert.equal(bubble.hidden,false,'Opening greeting fits a320px mobile viewport with actual textheight');
assert.ok(bubble.getBoundingClientRect().right<=310&&bubble.getBoundingClientRect().top>=10);
hero={left:17,right:303,top:234,bottom:800};mastRect={left:0,right:320,top:0,bottom:60};window.__tourStopStartedAt=50000;
const strip=context('mobile-strip','initial',{rect:{left:16,top:76,width:68,height:102},mouth:{x:54.08,y:94.4},chest:{x:52.5,y:108.4},space:'portrait',visible:true});
bubbles.update(strip,50100);assert.equal(bubble.hidden,false,'Reserved mobile strip displays a chest-native greeting');
assert.ok(bubble.getBoundingClientRect().top>=mastRect.bottom&&bubble.getBoundingClientRect().bottom<=hero.top,'The mobile greeting clears both navigation and Overview text');
window.__tourStopStartedAt=0;window.__v9Paused=true;
const paused=context('paused-initial','initial',strip.anchor);
for(const now of [60000,60200,60400,60600])bubbles.update(paused,now);
assert.equal(bubble.hidden,false,'A manually paused tour can greet after its avatar settles without a running stop timer');
console.log('PASS: flight handoff, chest-native liquid image, compact bidirectional geometry, X/mobile fit,3s tips, loaded/arrived8s welcome, actual105–124px text, jitter recovery, offscreen expiry, reserved mobile strip and unchanged9s tour.');
