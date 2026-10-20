import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Run the actual layout controller against observable DOM/RAF boundaries.
{
 const source=readFileSync(new URL('../assets/locations-layout-v17-10.js',import.meta.url),'utf8').replace(/export /g,'');
 const frames=new Map,observers=[],classes=new Set,styles=new Map,events={};
 let nextFrame=0,styleWrites=0,reads=0,mastBottom=68,page={},archive=null,stage;
 const root={classList:{contains:name=>classes.has(name),toggle(name,on){on?classes.add(name):classes.delete(name)}},style:{getPropertyValue:key=>styles.get(key)||'',setProperty(key,value){styleWrites++;styles.set(key,value)}}};
 const mast={getBoundingClientRect(){reads++;return{bottom:mastBottom}}};
 const document={documentElement:root,body:{append(node){stage=node}},querySelector:selector=>selector.includes('horror-locations')?archive:selector==='.locations-page'?page:mast,createElement:()=>({hidden:false,setAttribute(){},getBoundingClientRect(){reads++;return{left:640,top:80,width:760,height:650}}})};
 const win={addEventListener:(type,fn)=>events[type]=fn,visualViewport:{addEventListener(){}}};
 let resized;
 class ResizeObserver{constructor(fn){resized=fn}observe(){}unobserve(){}}
 class MutationObserver{constructor(fn){this.callback=fn;observers.push(this)}observe(target){this.target=target}}
 const context={document,window:win,ResizeObserver,MutationObserver,requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id}};
 runInNewContext(source+';globalThis.api={schedule,archiveVisibility}',context);
 const flush=()=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback()};
 flush();assert.ok(win.__locationsViewport);const viewport=win.__locationsViewport;
 assert.equal(viewport.height,650,'The zoom toolbar does not shrink the camera viewport');
 assert.equal(styles.get('--globe-controls-x'),'1020px','Zoom controls share the globe stage center');
 assert.equal(styles.get('--globe-controls-bottom'),'730px','Zoom controls sit at the stage bottom');
 const rootChanges=observers.find(item=>item.target===root).callback;
 const bodyChanges=observers.find(item=>item.target===document.body).callback;
 rootChanges();assert.equal(frames.size,0,'Controller-owned root classes do not cause a second frame');
 bodyChanges([{addedNodes:[{nodeType:3}],removedNodes:[]}]);
 bodyChanges([{addedNodes:[{nodeType:1,matches:()=>false,querySelector:()=>null}],removedNodes:[]}]);
 assert.equal(frames.size,0,'Loader, avatar, tooltip and case content do not trigger framing');
 const beforeReads=reads,beforeWrites=styleWrites;
 for(let i=0;i<5;i++)events.resize();
 assert.equal(frames.size,1,'Resize bursts coalesce into a single frame');flush();
 assert.equal(reads-beforeReads,2,'An update measures only mast and stage');
 assert.equal(styleWrites,beforeWrites,'Unchanged dimensions do not rewrite styles');
 assert.equal(win.__locationsViewport,viewport,'Unchanged dimensions reuse the shared viewport object');
 mastBottom=90;resized();flush();assert.equal(styles.get('--locations-top'),'102px','Header resizing updates the top boundary');
 page=null;bodyChanges([{addedNodes:[],removedNodes:[{nodeType:1,matches:()=>true}]}]);flush();
 assert.equal(win.__locationsViewport,null);assert.equal(stage.hidden,true,'Route removal clears and hides the workspace');
 resized();assert.equal(frames.size,0,'Inactive workspace ignores ResizeObserver notifications');
 page={};classes.add('is-gallery');rootChanges();flush();assert.equal(win.__locationsViewport,null,'360 mode hides narrative workspace');
 archive={};context.api.archiveVisibility(true);flush();assert.ok(win.__locationsViewport,'An archive in 360 mode keeps the workspace active');
 archive=null;context.api.archiveVisibility(false);flush();assert.equal(win.__locationsViewport,null,'Closing the archive restores the normal camera');
}

// Run real index/filter/select/open functions. The DOM counters expose redundant
// 200-row rebuilds and case-file renders without duplicating their implementation.
{
 const source=readFileSync(new URL('../assets/horror-globe-ui-v17-10.js',import.meta.url),'utf8');
 const index=source.slice(source.indexOf('function indexRecords()'),source.indexOf('function detailSection('));
 const select=source.slice(source.indexOf('function select(id)'),source.indexOf('function step('));
 const open=source.slice(source.indexOf('export async function openHorrorLocations'),source.indexOf("window.addEventListener('horror-globe-open'")).replace('export ','');
 let attributeWrites=0,caseRenders=0,dataReads=0;
 function node(tag='div',className='',text=''){return{tag,className,textContent:text,dataset:{},attributes:{},children:[],replacements:0,append(...children){this.children.push(...children)},setAttribute(name,value){attributeWrites++;this.attributes[name]=value},replaceChildren(...children){this.replacements++;this.children=children},focus(){},classList:{add(){},toggle(){}}}}
 const data=[
  {id:'c',film:'Night House',dir:'Director C',place:'Old Manor',area:'New York',year:2000,status:'gone'},
  {id:'a',film:'The Castle',dir:'Director A',place:'Blue Castle',area:'Scotland',year:1930,status:'open'},
  {id:'b',film:'The Fog',dir:'Director B',place:'Lighthouse',area:'California',year:1980,status:'outside'},
 ];
 const module={get HORROR_LOCATIONS(){dataReads++;return data}};
 const view={dialog:{open:true,classList:{add(){},toggle(){}}},input:node(),list:node(),count:node(),case:node(),layout:{scrollTop:0},filters:[],resultButtons:new Map,activeResult:null};
 const emitted=[];
 const context={Map,source:module,view,document:{createDocumentFragment:()=>node()},element:node,renderCase:()=>caseRenders++,emit:(type,detail)=>emitted.push({type,detail}),matchMedia:()=>({matches:false}),buildView(){},loadData:()=>Promise.resolve(module),console};
 runInNewContext(`let indexedSource,resultKey,records=[],filtered=[],selected=null,status='all',query='',recordById=new Map,searchIndex=new Map,requestNumber=0,dataPromise;
 ${index}\n${select}\n${open}
 globalThis.api={indexRecords,renderResults,select,openHorrorLocations,filter(s,q){status=s;query=q;return renderResults()},ids:()=>filtered.map(record=>record.id)};`,context);
 context.api.indexRecords();context.api.renderResults();assert.deepEqual([...context.api.ids()],['a','b','c'],'Results retain chronological ordering');
 assert.equal(view.list.replacements,1);assert.equal(dataReads,1);
 await context.api.openHorrorLocations({id:'a'});assert.equal(caseRenders,1,'A pin opens its case exactly once');
 const initialRows=view.list.replacements,beforeWrites=attributeWrites;
 await context.api.openHorrorLocations({id:'b'});
 assert.equal(view.list.replacements,initialRows,'Selecting another pin reuses the current result rows');
 assert.equal(caseRenders,2,'Next pin renders only its one case');
 assert.equal(attributeWrites-beforeWrites,2,'Only previous and next selected rows change aria-current');
 assert.equal(dataReads,1,'Repeated openings reuse the sorted archive and text index');
 assert.equal(view.resultButtons.get('a').attributes['aria-current'],'false');
 assert.equal(view.resultButtons.get('b').attributes['aria-current'],'true');
 context.api.filter('all','scotland');assert.deepEqual([...context.api.ids()],['a'],'Indexed place search works');
 const filteredRows=view.list.replacements;assert.equal(context.api.filter('all','scotland'),false);assert.equal(view.list.replacements,filteredRows,'Equivalent search does not rebuild rows');
 context.api.filter('gone','');assert.deepEqual([...context.api.ids()],['c'],'Status filtering works');
 await context.api.openHorrorLocations({id:'b'});assert.deepEqual([...context.api.ids()],['a','b','c'],'A map pin resets active search and status');
 assert.equal(view.resultButtons.get('b').attributes['aria-current'],'true','Selection survives rebuilding the filtered results');
 assert.equal(emitted.at(-1).type,'globe-location-select','Selection still drives the live globe');
}
console.log('PASS: filtered layout observers, one-frame resizing, unchanged-layout reuse, route/mode/archive lifecycle, cached archive/search, targeted selection updates, and one case render per pin.');
