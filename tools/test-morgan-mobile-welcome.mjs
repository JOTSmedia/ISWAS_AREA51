import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../assets/v9-guide-v17-13.js',import.meta.url),'utf8');
const state=source.slice(source.indexOf('function updateMorganMobileWelcome('),source.indexOf('function installMorganFlight('));
const location=source.slice(source.indexOf('const morganLocation=()'),source.indexOf('const morganLocationRect='));
let overview=true,gallery=false,library=true;
const classes=new Map;
const win={__morganInitialAtLibrary:true};
const context={window:win,innerWidth:320,morganOverview:()=>overview,morganAtLibrary:()=>library,document:{documentElement:{classList:{contains:()=>gallery,toggle:(name,on)=>classes.set(name,on)}}}};
runInNewContext(state+location+';globalThis.api={updateMorganMobileWelcome,morganLocation}',context);
const api=context.api;
assert.equal(classes.get('morgan-mobile-intro'),true,'Module initialization reserves mobile Overview spacing before guide mount or any GPU projection');
assert.equal(win.__morganInitialMobilePerch,true,'Mobile Overview selects its visible perch before any GPU frame');
assert.equal(api.updateMorganMobileWelcome(false),true,'Missing projection never delays initial phone layout');
assert.equal(api.updateMorganMobileWelcome(false,{worldVisible:true,visible:true}),true,'Later GPU projection does not move the mobile greeting or hero');
assert.equal(api.morganLocation(),'welcome');
win.__morganWelcomeComplete=true;
assert.equal(api.updateMorganMobileWelcome(false,{worldVisible:true,visible:false}),true,'Strip space remains after the greeting expires');
assert.equal(api.morganLocation(),'home','After greeting, avatar flies to its home platform');
overview=false;library=false;
assert.equal(api.updateMorganMobileWelcome(false,{worldVisible:true,visible:false}),false,'Leaving Overview removes the strip');
assert.equal(win.__morganInitialAtLibrary,false);assert.equal(api.morganLocation(),'home');
overview=true;assert.equal(api.updateMorganMobileWelcome(false,{worldVisible:true,visible:false}),false,'Returning to Overview does not recreate the initial strip');
context.innerWidth=1280;win.__morganInitialAtLibrary=true;win.__morganWelcomeComplete=false;library=true;
assert.equal(api.updateMorganMobileWelcome(false,{worldVisible:true,visible:false}),false,'Desktop never gets the phone fallback');
assert.equal(api.morganLocation(),'library');
assert.match(source,/location!=='library'&&location!=='welcome'&&previousRect/,'Scrolling the reserved strip does not launch repeated flights');
assert.doesNotMatch(source,/now-projection\.at<250/,'A slow GPU frame retains the last explicitly visible owner projection');
assert.match(source,/img\.morgan-welcome-avatar/,'Welcome avatar joins the existing shared renderer');
// Execute the shipped inline route setup: this runs before body content can
// paint, even if the guide module or GPU takes a long time to arrive.
for(const route of ['', 'need/', 'stars/', 'locations/', 'form/', 'comparison/', 'contact/']){
 const html=readFileSync(new URL('../'+route+'index.html',import.meta.url),'utf8');
 const begin=html.indexOf('window.__morganInitialAtLibrary=!section;');
 const end=html.indexOf('window.__atLibrary=',begin);
 assert.ok(begin>=0&&end>begin,'Each entrypoint includes the early route setup');
 const early=html.slice(begin,end);
 for(const [section,width,expected] of [[null,320,true],[null,1280,false],[['need'],320,false]]){
  const earlyClasses=new Set,earlyWindow={};
  runInNewContext(early,{section,innerWidth:width,window:earlyWindow,document:{documentElement:{classList:{add:name=>earlyClasses.add(name)}}}});
  assert.equal(earlyClasses.has('morgan-mobile-intro'),expected,'First paint reserves only initial phone Overview: '+route+' '+width);
  assert.equal(!!earlyWindow.__morganInitialMobilePerch,expected,'First paint and mounted guide use the same perch state');
 }
}
console.log('PASS: before-projection mobile layout reservation, stable greeting and reading space, home return, route cleanup, desktop preservation and shared renderer.');
