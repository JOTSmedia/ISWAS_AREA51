import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GALLERY_WAYPOINTS,waypointIndex,waypointAngles,nearestGalleryWaypoint,installGalleryProgress} from '../assets/gallery-progress-v18-1.js';
import {clearGlobeCamera,globeClearanceHeight} from '../assets/camera-clearance-v18-1.js';
const expected=['library','overview','need','stars','locations','form','comparison','contact','akkad','piano','cigars','bar','wine','records'];
assert.deepEqual(GALLERY_WAYPOINTS.map(stop=>stop.id),expected);
assert.equal(new Set(expected).size,GALLERY_WAYPOINTS.length);
for(const [index,stop] of GALLERY_WAYPOINTS.entries()){
 assert.equal(waypointIndex(stop.id),index);assert.equal(waypointIndex(index),index);
 for(const vector of [stop.position,stop.target])assert.ok(vector.length===3&&vector.every(Number.isFinite));
 assert.ok(stop.position[0]>=-5.4&&stop.position[0]<=48.1&&stop.position[2]>=-5.4&&stop.position[2]<=8.6,'Every viewpoint remains inside the room');
 const angles=waypointAngles(stop);assert.ok(Number.isFinite(angles.yaw)&&Math.abs(angles.pitch)<=1.35);
 assert.equal(nearestGalleryWaypoint(stop.position,angles),index,'The location indicator follows free-looking at '+stop.id);
}
for(const value of [-Infinity,Infinity,NaN,-50,50])assert.ok(waypointIndex(value)>=0&&waypointIndex(value)<GALLERY_WAYPOINTS.length);
assert.equal(waypointIndex(-5),0);assert.equal(waypointIndex(99),13);
assert.deepEqual(GALLERY_WAYPOINTS[9].position,[47.8,2.2,8.45],'Only the keyboard approach is exposed as PIANO');
// Verify every direct-route corridor at a high and low refresh rate, including
// distant front/rear jumps. The production frame applies this same clearance
// after easing the actual camera position, not just at the destination.
for(const fps of [30,60])for(const elevation of [1.49,3.05])for(const from of GALLERY_WAYPOINTS)for(const to of GALLERY_WAYPOINTS){
 const position={x:from.position[0],y:from.position[1],z:from.position[2]},destination={x:to.position[0],y:to.position[1],z:to.position[2]};
 clearGlobeCamera(position,elevation);clearGlobeCamera(destination,elevation);
 for(let tick=0;tick<fps*8;tick++){
  for(const axis of ['x','y','z'])position[axis]=destination[axis]+(position[axis]-destination[axis])*Math.exp(-1.5/fps);
  clearGlobeCamera(position,elevation);
  assert.ok(position.y+1e-10>=globeClearanceHeight(position.x,position.z,elevation),'The entire route stays above the globe/table safety envelope');
  for(const [axis,k] of [['x',0],['z',2]])assert.ok(position[axis]>=Math.min(from.position[k],to.position[k])-1e-9&&position[axis]<=Math.max(from.position[k],to.position[k])+1e-9,'Travel cannot overshoot its horizontal endpoints');
 }
}
class Classes{
 constructor(){this.values=new Set}
 contains(name){return this.values.has(name)}
 toggle(name,value=!this.values.has(name)){if(value)this.values.add(name);else this.values.delete(name)}
}
class Element extends EventTarget{
 constructor(tag){super();this.tagName=tag;this.children=[];this.attributes={};this.classList=new Classes;this.style={setProperty:(key,value)=>this.style[key]=value}}
 append(...children){this.children.push(...children)}
 setAttribute(name,value){this.attributes[name]=value}
 getBoundingClientRect(){return{left:0,width:200}}
}
class DetailEvent extends Event{constructor(type,{detail}){super(type);this.detail=detail}}
const root=new Element('html'),body=new Element('body');let observe;
globalThis.document={documentElement:root,body,createElement:tag=>new Element(tag),getElementById:id=>body.children.find(el=>el.id===id)};
globalThis.MutationObserver=class{constructor(fn){observe=fn}observe(){}};
globalThis.CustomEvent=DetailEvent;
const events=[],paused=[];globalThis.window=new EventTarget;window.__iswasTour={setPaused:(...args)=>paused.push(args)};window.addEventListener('gallery-waypoint',event=>events.push(event.detail));
installGalleryProgress();const rail=body.children[0],[previous,middle,next]=rail.children,[label,ticks,range]=middle.children;
assert.equal(rail.hidden,true,'The rail is absent from reading mode');root.classList.toggle('is-gallery',true);observe();assert.equal(rail.hidden,false);
assert.equal(rail.attributes['aria-label'],'Explore the gallery');assert.equal(range.type,'range');assert.equal(range.min,'0');assert.equal(range.max,'13');assert.equal(range.step,'1');assert.equal(ticks.children.length,14);
previous.dispatchEvent(new Event('click'));assert.equal(events.at(-1).id,'records','Previous wraps around the complete room');
next.dispatchEvent(new Event('click'));assert.equal(events.at(-1).id,'library','Next wraps back to the Lodge');
range.value='9';range.dispatchEvent(new Event('input'));assert.equal(events.at(-1).id,'piano');assert.equal(label.textContent,'PIANO');assert.equal(range.attributes['aria-valuetext'],'PIANO');assert.equal(window.__v9Paused,true);assert.equal(paused.at(-1)[0],true);
window.dispatchEvent(new DetailEvent('gallery-waypoint-state',{detail:{index:12,manual:true}}));assert.equal(label.textContent,'WINE COLLECTION','Free movement updates the indicator');
root.classList.toggle('is-gallery',false);observe();assert.equal(rail.hidden,true);assert.equal(root.classList.contains('has-gallery-progress'),false);
const css=readFileSync(new URL('../assets/gallery-progress-v18-1.css',import.meta.url),'utf8');
assert.match(css,/grid-template-columns:44px minmax\(0,1fr\) 44px/,'The slider shrinks between touch-safe arrows even at 320px');
assert.match(css,/height:2px/);assert.match(css,/has-gallery-progress #morgan-guide/);assert.match(css,/has-gallery-progress \.site-footer/);
console.log('PASS: all 14 room stops, keyboard-facing piano, front/rear indicator, every high/low-refresh camera corridor and globe clearance; 360-only accessible slider, full-room wrap, paused tour and mobile control spacing.');
