import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../assets/lodge-canvas-v17-10.js',import.meta.url),'utf8');
const range=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const base='/ISWAS_v17.10/';
const plates=new Function('n','return '+range('Sy=[',',Cy=').slice(3))(path=>base+path.replace(/^\//,''));
const price=plates.find(plate=>plate.title==='Vincent Price'),romero=plates.find(plate=>plate.title==='George A. Romero');
assert.ok(price);assert.ok(existsSync(new URL('../plates/vincent-price.webp',import.meta.url)));
assert.equal(price.src,base+'plates/vincent-price.webp');assert.equal(price.aspect,362/450);assert.equal(price.audioSrc,base+'audio/vincent-price-laugh.mp3');assert.equal(price.audioLink,undefined);
const audioFile=readFileSync(new URL('../audio/vincent-price-laugh.mp3',import.meta.url));
const provenance=JSON.parse(readFileSync(new URL('../plates/vincent-price-provenance.json',import.meta.url),'utf8'));
assert.equal(audioFile.length,520496);assert.equal(createHash('sha256').update(audioFile).digest('hex'),provenance.audio.sha256,'Delivered MP3 matches its unchanged user-source hash');
assert.ok(price.detail.includes('House of Wax (1953)'));assert.ok(price.detail.includes('Vincent (1982)'));assert.ok(price.detail.includes('Thriller'));assert.ok(price.detail.split(/\s+/).length<100);
assert.equal(price.sources[0][1],'https://www.vincentprice.com/about');
const frameBox=new Function(range('function frameBox(','function museumFrame(')+';return frameBox')();
const extent=plate=>frameBox(plate.h*plate.aspect,plate.h)[0]/2*1.16;
assert.ok(price.x-extent(price)>romero.x+extent(romero),'Even both portraits fully hovered leave clear wall space between their frames');
const shrineX=Number(source.match(/akkadPos=\[([\d.]+)/)[1]);
assert.ok(price.x+extent(price)<shrineX-2.8,'Portrait clears a conservative 2.8-unit envelope around the angled shrine');
assert.ok(price.y-(price.h+.4)*.58>0&&price.y+(price.h+.4)*.58<4.9,'Portrait stays within wall height while hovered');

const jsx=(type,props)=>({type,props});
const u={useRef:current=>({current}),useMemo:fn=>fn(),useEffect(){},useLayoutEffect(){}};
{
 let clicked,frameDimensions;
 const context={u,$:{jsx,jsxs:jsx},Ly:()=>({}),frameBox,museumFrame:(...args)=>(frameDimensions=args,[]),v_(){},By:'interactive-frame',lightMap:{},window:{},portraitFly(){},document:{body:{style:{}}},price,onOpen:id=>clicked=id};
 runInNewContext(range('function Jy(','function Yy(')+';this.tree=Jy({plate:price,onOpen});',context);
 assert.equal(context.tree.type,'interactive-frame');assert.deepEqual(frameDimensions,frameBox(price.h*price.aspect,price.h));
 context.tree.props.onOpen(context.tree.props.id);assert.equal(clicked,price.src,'The existing framed-portrait interaction opens the correct piece');
}
{
 let index=0;const effects=[];
 const window={innerWidth:1280,innerHeight:800,devicePixelRatio:1};
 const context={u:{...u,useState:value=>[index++===0?price.src:value,()=>{}],useLayoutEffect:fn=>effects.push(fn)},$:{jsx,jsxs:jsx,Fragment:'fragment'},window,document:{body:{}},Sy:plates,r:[],yy:[],Hy:[],by:[],akkadId:'akkad-shrine',akkadPiece:{},qv:'canvas',lb:'scene',Tome:'book',Jv:{createPortal:tree=>tree}};
 runInNewContext(range('function ub(','function Tome(')+range('function db(){','export{db')+';db();this.popup=ub({piece:window.__piece,onClose(){}});',context);
 const piece=window.__piece;assert.equal(piece.title,'Vincent Price');assert.equal(piece.audioSrc,price.audioSrc);assert.equal(piece.sources,price.sources,'Popup resolution preserves its official biography source');
 const collect=(node,predicate)=>{if(Array.isArray(node))return node.flatMap(child=>collect(child,predicate));if(!node||typeof node!=='object')return[];return [...(predicate(node)?[node]:[]),...collect(node.props?.children,predicate)]};
 const audio=collect(context.popup,node=>node.type==='audio');assert.equal(audio.length,1);assert.equal(audio[0].props.src,price.audioSrc);assert.equal(audio[0].props.controls,true);assert.equal(audio[0].props.preload,'none');assert.ok(!audio[0].props.autoPlay&&!audio[0].props.autoplay,'Playback always waits for the user');assert.equal(audio[0].props['aria-label'],"Vincent Price's laugh");
 assert.ok(JSON.stringify(context.popup).includes('PLAY THE LAUGH'));assert.ok(!JSON.stringify(context.popup).includes('youtube'),'Vincent has no external YouTube dependency');
 assert.equal(collect(context.popup,node=>node.type==='img').length,1,'The popup shows only the supplied portrait, with no audio thumbnail');assert.equal(collect(context.popup,node=>['iframe','video'].includes(node.type)).length,0,'No embedded video player exists');
 const mediaCalls=[];const element={pause(){mediaCalls.push('pause')},removeAttribute(name){mediaCalls.push('remove:'+name)},load(){mediaCalls.push('load')}};
 audio[0].props.ref.current=element;const cleanup=effects.map(fn=>fn()).filter(Boolean);assert.deepEqual(mediaCalls,[],'Mounting the audio does not start playback or force loading');
 audio[0].props.ref.current=null;cleanup.reverse().forEach(fn=>fn());assert.deepEqual(mediaCalls,['pause','remove:src','load'],'Unmount cleanup keeps its captured element, pauses playback, clears the source and resets loading');
 assert.equal(collect(context.popup,node=>node.type==='a'&&node.props.href==='https://www.vincentprice.com/about').length,1);
}
console.log('PASS: Vincent Price portrait placement/hover clearance, original photo aspect, matching frame/click behavior, biography/source propagation, unchanged user MP3, manual native controls, no preload/autoplay, and explicit close cleanup.');
