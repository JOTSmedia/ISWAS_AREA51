import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const records=JSON.parse(fs.readFileSync(new URL('textures/desktop-2048-provenance.json',root),'utf8')).textures;
// Read the encoded WebP dimensions without installing an image library.
function dimensions(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 for(let offset=12;offset+8<=bytes.length;){
  const type=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8;
  if(type==='VP8X')return [1+bytes.readUIntLE(start+4,3),1+bytes.readUIntLE(start+7,3)];
  if(type==='VP8 '){assert.equal(bytes.toString('hex',start+3,start+6),'9d012a');return [bytes.readUInt16LE(start+6)&0x3fff,bytes.readUInt16LE(start+8)&0x3fff]}
  if(type==='VP8L'){const bits=bytes.readUInt32LE(start+1);return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1]}
  offset=start+size+(size&1);
 }
 throw Error('No WebP image chunk');
}
let before=0,after=0;
assert.equal(records.length,5);
for(const record of records){
 const original=fs.readFileSync(new URL(record.source,root));
 const derivative=fs.readFileSync(new URL(record.derivative,root));
 assert.deepEqual(dimensions(original),[4096,4096]);
 assert.deepEqual(dimensions(derivative),[2048,2048]);
 assert.equal(derivative.length,record.bytes);
 assert.equal(createHash('sha256').update(derivative).digest('hex'),record.sha256);
 assert.ok(derivative.length<original.length/2,record.derivative+' reduces cold-transfer cost');
 before+=original.length;after+=derivative.length;
}
const scene=fs.readFileSync(new URL('assets/black-lodge-scene-v18-1.js',root),'utf8');
const bundle=fs.readFileSync(new URL('assets/lodge-canvas-v18-1.js',root),'utf8');
assert.ok(scene.includes('const tier=mobile?1024:2048;'));
assert.equal((bundle.match(/walnut-2048\.webp/g)||[]).length,1,'Walnut uses one load shared by two independent texture transforms');
assert.ok(bundle.includes('shelfMap=woodMap.clone()'));
assert.equal((bundle.match(/walnut-height-2048\.webp/g)||[]).length,1);
assert.ok(!/walnut(?:-height)?-4096\.webp/.test(bundle),'Desktop startup retains originals without requesting4096 tiers');
assert.ok(!bundle.includes('leatherMap=loadFrame('),'Obsolete chair upholstery is not downloaded');
console.log(`PASS: five valid2048 delivery textures, preserved4096 originals/mobile tiers, verified hashes, and ${before-after} fewer cold-transfer bytes across these surfaces.`);
