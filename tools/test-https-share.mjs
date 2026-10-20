import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),routes=['','need','stars','locations','form','comparison','contact'];
for(const route of routes){
 const html=readFileSync(new URL((route?route+'/':'')+'index.html',root),'utf8');
 const bootstrap=html.match(/<head><script>([\s\S]*?)<\/script>/)[1];
 for(const hostname of ['itstartedwithascream.com','www.itstartedwithascream.com','jotsmedia.github.io','localhost','127.0.0.1','preview.test'])for(const protocol of ['http:','https:']){
  const pathname='/ISWAS_web/'+(route?route+'/':''),redirects=[],policies=[],requests=[];
  const location={hostname,host:hostname,protocol,pathname,search:'?from=share',hash:'#entry',replace:value=>redirects.push(value)};
  const document={head:{appendChild:node=>policies.push(node)},createElement:()=>({}),documentElement:{classList:{add(){},remove(){}}}};
  const window={};class Image{set src(value){requests.push(value)}}
  vm.runInNewContext(bootstrap,{window,location,document,Image,innerWidth:390,performance:{now:()=>1000}});
  const production=['itstartedwithascream.com','www.itstartedwithascream.com','jotsmedia.github.io'].includes(hostname);
  if(production&&protocol==='http:'){
   assert.deepEqual(redirects,['https://'+hostname+pathname+'?from=share#entry']);
   assert.equal(requests.length,0,'Insecure production navigation upgrades before bootstrap assets are requested');
  }else{
   assert.equal(redirects.length,0,'HTTPS and local previews do not enter redirect loops');
   assert.equal(window.__ISWAS_BASE,'/ISWAS_web/');
   assert.equal(policies.length,protocol==='https:'?1:0,'Secure pages upgrade stray insecure resources without breaking HTTP localhost');
   if(policies.length){assert.equal(policies[0].httpEquiv,'Content-Security-Policy');assert.equal(policies[0].content,'upgrade-insecure-requests')}
  }
 }
 assert.ok(html.includes('name="referrer" content="strict-origin-when-cross-origin"'),'YouTube receives a permitted origin referrer');
 for(const key of ['og:image','og:image:secure_url','twitter:image']){
  const tag=html.match(new RegExp('<meta (?:property|name)="'+key+'" content="([^"]+)"'));
  assert.equal(tag?.[1],'https://itstartedwithascream.com/plates/share-black-lodge-v17-15.jpg',route+' exposes the same HTTPS Black Lodge preview in initial HTML');
 }
 assert.ok(html.includes('property="og:image:width" content="1200"')&&html.includes('property="og:image:height" content="630"'));
 assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
 assert.ok(!/<(?:script|img|iframe|link)\b[^>]*(?:src|href)=["']http:\/\//i.test(html),'No insecure HTML subresources');
}
assert.equal(readFileSync(new URL('CNAME',root),'utf8').trim(),'itstartedwithascream.com');
assert.ok(existsSync(new URL('.nojekyll',root)),'GitHub serves the static modules directly');
console.log('PASS: 84 production/localhost HTTPS bootstrap cases; preserved query/hash and deployment base; no redirect loops; secure resource upgrades; seven crawler-visible consistent JPEG share cards; CNAME and static Pages support.');
