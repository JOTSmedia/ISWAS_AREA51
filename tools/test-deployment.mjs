import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

// Exercise the actual static bootstrap under GitHub Pages and deeper preview
// paths, rather than assuming a development server's root matches deployment.
const root=fileURLToPath(new URL('../',import.meta.url));
const routes=['','need','stars','locations','form','comparison','contact'];
const bases=['/','/ISWAS_v17.17/','/previews/releases/ISWAS_v17.17/'];
const utf8=new TextDecoder('utf-8',{fatal:true});
let cases=0,assets=0,modules=0;
for(const route of routes){
 const file=path.join(root,route,'index.html');
 const html=utf8.decode(fs.readFileSync(file));
 const bootstrap=html.match(/<head><script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(bootstrap,`${route||'Overview'} retains a deployment bootstrap`);
 for(const base of bases){
  const canonical=base+(route?route+'/':'');
  for(const suffix of ['', 'index.html']){
   const requests=[],redirects=[];
   const pathname=canonical+suffix;
   const location={pathname,search:'?test=1',hash:'#entry',replace:value=>redirects.push(value)};
   const document={documentElement:{classList:{add(){},remove(){}}}};
   const window={};
   class Image{set src(value){requests.push(value)}}
   const context={window,location,document,Image,innerWidth:1280,performance:{now:()=>1000}};
   vm.runInNewContext(bootstrap,context,{timeout:1000});
   if(suffix){
    assert.deepEqual(redirects,[canonical+'?test=1#entry'],'index.html canonicalization preserves query and fragment');
   }else{
    assert.equal(window.__ISWAS_BASE,base);
    assert.equal(window.__ISWAS_ROUTE,route?'/'+route:'/');
    for(const request of requests){
     assert.ok(request.startsWith(base),`bootstrap image remains under ${base}`);
     assert.ok(fs.existsSync(path.join(root,request.slice(base.length))),request);
    }
    for(const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g)){
     const ref=match[1];
     if(/^(?:https?:|data:|#|\/\/)/.test(ref))continue;
     const resolved=new URL(ref,'https://example.test'+canonical);
     assert.ok(resolved.pathname.startsWith(base),`${ref} escapes deployment prefix ${base}`);
     assert.ok(fs.existsSync(path.join(root,resolved.pathname.slice(base.length))),`${ref} resolves to a missing file`);
     assets++;
    }
   }
   cases++;
  }
 }
}
for(const name of fs.readdirSync(path.join(root,'assets')).filter(name=>name.endsWith('.js'))){
 const file=path.join(root,'assets',name),source=utf8.decode(fs.readFileSync(file));
 assert.ok(!/speechSynthesis|SpeechSynthesisUtterance|AudioContext|new\s+Audio\s*\(/.test(source),`${name} introduces unexpected audio`);
 assert.ok(!/autoplay\s*[=:]\s*(?:1|true|!0)/i.test(source),`${name} introduces autoplay`);
 // Static imports and literal dynamic imports are relative to their module,
 // independent of whether the document sits at a repository or nested root.
 for(const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'`]((?:\.\.?\/)[^"'`]+\.js)["'`]/g)){
  const target=path.resolve(path.dirname(file),match[1]);
  assert.ok(target.startsWith(root));
  assert.ok(fs.existsSync(target),`${name}: missing module ${match[1]}`);
  modules++;
 }
}
console.log(`PASS: ${cases} repository/nested-root bootstrap cases, ${assets} HTML asset resolutions, ${modules} module imports, strict UTF-8, and no autoplay or unwanted media embeds.`);
