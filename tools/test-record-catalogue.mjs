import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalogueNeighbour,recordShelfPosition,recordFlightPose,RECORD_STATION,parseYouTubeId} from '../assets/record-catalogue-v17-15.js';
const rows=JSON.parse(readFileSync(new URL('../data/horror-soundtracks.json',import.meta.url)));
const source=JSON.parse(readFileSync(new URL('./soundtrack-list-source.json',import.meta.url)));
assert.equal(rows.length,100);assert.equal(new Set(rows.map(r=>r.rank)).size,100);
for(const [i,r] of rows.entries()){
 assert.equal(r.rank,i+1);assert.ok(r.title&&r.composer&&r.year);
 assert.match(r.videoId,/^[\w-]{11}$/);assert.equal(r.title,source[i].title);assert.equal(r.composer,source[i].composer);
 assert.equal(catalogueNeighbour(r.rank,-1),Math.max(1,r.rank-1));assert.equal(catalogueNeighbour(r.rank,1),Math.min(100,r.rank+1));
 assert.deepEqual(recordFlightPose(r.rank,0).position,recordShelfPosition(r.rank));
 const arrived=recordFlightPose(r.rank,1);arrived.position.forEach((p,k)=>assert.ok(Math.abs(p-RECORD_STATION.platter[k])<1e-12));assert.equal(arrived.tilt,0);
 let prior=recordFlightPose(r.rank,0).position;
 for(let step=1;step<=100;step++){
  const pose=recordFlightPose(r.rank,step/100);assert.ok(pose.position.every(Number.isFinite));assert.ok(Number.isFinite(pose.tilt));
  assert.ok(Math.hypot(...pose.position.map((v,k)=>v-prior[k]))<.08,'Record travels continuously from shelf to platter');prior=pose.position;
 }
}
const id='vzU3jnNWKbI';
for(const url of [id,`https://youtu.be/${id}?t=3`,`https://www.youtube.com/watch?v=${id}`,`https://m.youtube.com/shorts/${id}`,`https://www.youtube-nocookie.com/embed/${id}`,`https://youtube.com/live/${id}`])assert.equal(parseYouTubeId(url),id);
for(const url of ['javascript:alert(1)',`https://youtube.com.evil.example/watch?v=${id}`,`https://evil.example/${id}`,`https://youtu.be/${id}more`,'not a link','',`https://www.youtube.com/watch?v=short`])assert.equal(parseYouTubeId(url),null);
assert.equal(rows[0].title,'Suspiria');assert.equal(rows[99].title,'Flesh for Frankenstein');
assert.match(rows[56].note,/unused/i);assert.equal(rows[78].year,2012);
console.log('PASS: all 100 source titles/composers/ranks and usable video IDs; previous/next boundaries; finite continuous record flight; strict YouTube URL validation; unused Coil score distinguished from the film score.');
