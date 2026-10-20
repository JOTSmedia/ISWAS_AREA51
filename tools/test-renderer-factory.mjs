import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/renderer-factory-v17-10.js',import.meta.url),'utf8');
const {createGalleryRenderer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const context={},canvas={id:'fiber-canvas',getContext:()=>context},defaults={canvas,powerPreference:'high-performance',antialias:true,alpha:true,precision:'highp'};
{
 const attempts=[];class Renderer{constructor(options){attempts.push(options);this.domElement=options.canvas}}
 const renderer=createGalleryRenderer(Renderer,defaults,true);
 assert.equal(attempts.length,1);assert.equal(renderer.domElement,canvas);assert.equal(attempts[0].powerPreference,'default');assert.equal(attempts[0].failIfMajorPerformanceCaveat,false);assert.equal(attempts[0].antialias,true);assert.equal(attempts[0].alpha,false);assert.equal(attempts[0].precision,'highp');assert.equal(defaults.powerPreference,'high-performance','Caller settings are not mutated');
}
{
 const attempts=[];let constructors=0;const retryCanvas={getContext(type,options){assert.equal(type,'webgl2');attempts.push({...options});return options.antialias?null:context}};
 class Renderer{constructor(options){constructors++;assert.equal(options.context,context);this.domElement=options.canvas}}
 const renderer=createGalleryRenderer(Renderer,{...defaults,canvas:retryCanvas},true);
 assert.equal(attempts.length,2);assert.deepEqual(attempts.map(options=>options.antialias),[true,false]);assert.equal(renderer.domElement,retryCanvas,'Retry retains Fiber’s canvas and pointer target');assert.ok(attempts.every(options=>options.powerPreference==='default'));assert.equal(constructors,1,'Rejected context attempts create no renderer or stale event handlers');
}
{
 const failure=new Error('WebGL disabled');let attempts=0;class Renderer{constructor(){throw new Error('A renderer must not be created without a context')}}
 const unavailable={...defaults,canvas:{getContext(){attempts++;throw failure}}};
 assert.throws(()=>createGalleryRenderer(Renderer,unavailable,true),error=>error.cause===failure);assert.equal(attempts,2,'Unavailable desktop WebGL exits after two bounded attempts');
 attempts=0;assert.throws(()=>createGalleryRenderer(Renderer,unavailable,false),error=>error.cause===failure);assert.equal(attempts,1,'Mobile does not repeat an identical non-antialiased request');
}
console.log('PASS: browser-selected graphics, software fallback allowed, bounded no-antialias retry, retained Canvas identity, and terminal error propagation.');
