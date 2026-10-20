import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../assets/lodge-canvas-v18-1.js',import.meta.url),'utf8');
// Execute the production declarations rather than reproducing their loaders.
const declarations=source.match(/var woodMap=([\s\S]*?);var plushMap=([\s\S]*?);var walnutHeight=/);
assert.ok(declarations,'The production wood and shelf declarations are present');
const repeat=source.match(/shelfMap\.repeat\.set\([^;]+\)/)?.[0];
assert.ok(repeat,'The independent shelf UV transform remains present');

function vector(x=1,y=1){return {x,y,set(x,y){this.x=x;this.y=y},clone(){return vector(this.x,this.y)}}}
// Three's Texture.clone copies the mutable UV vectors and shares Source.
// Images may finish loading after a clone is created, so image reads must use
// the shared source rather than a snapshot of the initial data.
class Texture {
 constructor(source={data:null}){this.source=source;this.repeat=vector()}
 get image(){return this.source.data}
 clone(){const texture=new Texture(this.source);texture.repeat=this.repeat.clone();return texture}
}

for(const width of [390,767,768,1440,1920]){
 const requests=[];
 const context={window:{innerWidth:width},loadFrame(url){const texture=new Texture();requests.push({url,texture});return texture}};
 runInNewContext(`var woodMap=${declarations[1]};var plushMap=${declarations[2]};${repeat};this.maps={woodMap,shelfMap}`,context);
 const {woodMap,shelfMap}=context.maps;
 const walnutRequests=requests.filter(({url})=>/^\/textures\/v9\/walnut-(1024|2048)\.webp$/.test(url));
 assert.equal(walnutRequests.length,1,'The wood and shelves start only one walnut image load');
 assert.equal(walnutRequests[0].url,`/textures/v9/walnut-${width<768?1024:2048}.webp`,'Responsive source selection is unchanged');
 assert.notEqual(woodMap,shelfMap,'Each material keeps an independent Texture');
 assert.equal(woodMap.source,shelfMap.source,'The cloned texture shares the image source');
 assert.notEqual(woodMap.repeat,shelfMap.repeat,'UV transforms remain independent');
 assert.deepEqual([woodMap.repeat.x,woodMap.repeat.y],[1,1]);
 assert.deepEqual([shelfMap.repeat.x,shelfMap.repeat.y],[3,1.6]);
 const image={width:width<768?1024:2048,height:width<768?1024:2048};
 walnutRequests[0].texture.source.data=image;
 assert.equal(shelfMap.image,image,'The clone receives the image when the original asynchronous load completes');
 shelfMap.repeat.set(5,2);
 assert.deepEqual([woodMap.repeat.x,woodMap.repeat.y],[1,1],'Subsequent shelf changes cannot alter the other wood material');
 woodMap.repeat.set(2,4);
 assert.deepEqual([shelfMap.repeat.x,shelfMap.repeat.y],[5,2],'Other wood changes cannot alter the shelf material');
}
console.log('PASS: one responsive walnut image load; shared asynchronous image source; independent wood/shelf textures and UV transforms at mobile and desktop widths.');
