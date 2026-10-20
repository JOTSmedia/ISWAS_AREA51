import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('assets/access-gate-v18-1.js', root), 'utf8');
const pages = JSON.parse(fs.readFileSync(new URL('assets/gated-pages-v18-1.json', root), 'utf8'));
const routes = Object.keys(pages);
let cases = 0;

function create({entry='index.html',prefix='/',age=null,failFetch=false,noStorage=false,protocol='https:',hostname='example.test'}={}) {
  class Element {
    value=''; textContent=''; disabled=false; open=false; handlers={}; classList={toggle(){}};
    addEventListener(type, fn) { this.handlers[type]=fn; }
    focus() { focused=this; }
    setAttribute() {}
    showModal() { this.open=true; }
    close() { this.open=false; this.handlers.close?.(); }
    querySelector(selector) { return selector==='[type="submit"]'?submit:close; }
    getBoundingClientRect() { return {left:10,right:200,top:10,bottom:200}; }
  }
  let focused, fetched=[], written=[], redirects=[];
  const elements = Object.fromEntries(['pin-dialog','pin-form','access-pin','open-pin','access-feedback','pin-error'].map(id=>[id,new Element()]));
  const submit=new Element(),close=new Element();
  const key='iswas-preview-v17.18:'+prefix;
  const storage=new Map(age===null?[]:[[key,String(Date.now()-age)]]);
  const context = {
    URL, Date, TextEncoder, Uint8Array, crypto:webcrypto,
    location:{protocol,hostname,host:hostname,pathname:prefix+(entry==='index.html'?'':entry.replace('index.html','')),search:'?test=1',hash:'#entry',replace:url=>redirects.push(url)},
    sessionStorage:{getItem:k=>{if(noStorage)throw Error();return storage.get(k)},setItem:(k,v)=>{if(noStorage)throw Error();storage.set(k,v)},removeItem:k=>storage.delete(k)},
    document:{currentScript:{src:'https://example.test'+prefix+'assets/access-gate-v18-1.js',dataset:{entry}},getElementById:id=>elements[id],querySelectorAll:()=>Array.from({length:4},()=>new Element()),open(){},write:html=>written.push(html),close(){}},
    fetch:async url=>{fetched.push(String(url));return {ok:!failFetch,json:async()=>pages}},
  };
  vm.runInNewContext(source,context);
  const flush = async()=>{ await new Promise(resolve=>setImmediate(resolve)); };
  return {elements,submit,close,fetched,written,redirects,storage,key,flush,context,get focused(){return focused},async send(pin){elements['access-pin'].value=pin;await elements['pin-form'].handlers.submit({preventDefault(){}})}};
}

for (const entry of routes) {
  const html=fs.readFileSync(new URL(entry,root),'utf8');
  assert.ok(html.includes('COMING SOON')&&html.includes('id="pin-dialog"'));
  assert.ok(!html.includes('modulepreload')&&!html.includes('as="image"'));
  assert.deepEqual([...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]),[(entry==='index.html'?'':'../')+'assets/access-gate-v18-1.js']);
  assert.ok(html.includes('type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4"'));
  assert.ok(!html.includes('1023'));
  assert.ok(html.includes('body.access-gated::before{content:none!important;background:none!important}'),'Early CSS prevents the existing background-image downloads before entry');
  for(const prefix of ['/','/ISWAS_web/','/previews/releases/v17.18/']) {
    const app=create({entry,prefix});
    assert.equal(app.fetched.length,0,'Locked visits never request the application');
    app.elements['open-pin'].handlers.click();
    assert.equal(app.elements['pin-dialog'].open,true);
    assert.equal(app.focused,app.elements['access-pin']);
    app.elements['access-pin'].value='1x2!34';app.elements['access-pin'].handlers.input();
    assert.equal(app.elements['access-pin'].value,'1234');
    for(const invalid of ['','1','102','10234','abcd']) {
      await app.send(invalid);assert.equal(app.fetched.length,0);assert.equal(app.elements['pin-dialog'].open,true);
    }
    await app.send('0000');
    assert.equal(app.elements['pin-dialog'].open,false);
    assert.equal(app.elements['access-pin'].value,'');
    assert.equal(app.elements['access-feedback'].textContent,'ACCESS CODE NOT RECOGNIZED.');
    assert.equal(app.fetched.length,0);assert.equal(app.storage.has(app.key),false);
    assert.equal(app.focused,app.elements['open-pin']);
    app.elements['open-pin'].handlers.click();
    await app.send('1023');
    assert.ok(app.storage.has(app.key));
    if(entry==='index.html') {
      assert.deepEqual(app.fetched,['https://example.test'+prefix+'assets/gated-pages-v18-1.json']);
      assert.equal(app.written[0],pages['index.html'],'Successful entry restores the exact existing loader');
    } else assert.deepEqual(app.redirects,['https://example.test'+prefix+'?test=1#entry'],'First successful section entry starts at the root loader');
    const returning=create({entry,prefix,age:1000});await returning.flush();
    assert.equal(returning.written[0],pages[entry],'Unlocked section visits restore their original page');
    cases++;
  }
}
for(const age of [4*60*60*1000+1,-1000]) {
  const app=create({age});await app.flush();assert.equal(app.fetched.length,0);assert.equal(app.storage.size,0);cases++;
}
const noStorage=create({noStorage:true});await noStorage.send('1023');assert.equal(noStorage.written[0],pages['index.html']);cases++;
const failure=create({failFetch:true});failure.elements['open-pin'].handlers.click();await failure.send('1023');
assert.equal(failure.written.length,0);assert.equal(failure.storage.size,0);assert.equal(failure.submit.disabled,false);assert.match(failure.elements['pin-error'].textContent,/TRY AGAIN/);cases++;
const returningFailure=create({age:1000,failFetch:true});await returningFailure.flush();assert.equal(returningFailure.elements['open-pin'].disabled,false);assert.equal(returningFailure.storage.size,0);cases++;
const https=create({protocol:'http:',hostname:'itstartedwithascream.com'});assert.deepEqual(https.redirects,['https://itstartedwithascream.com/?test=1#entry']);assert.equal(https.fetched.length,0);cases++;
console.log(`PASS: ${cases} gate scenarios; seven entry pages; root and nested paths; wrong/right/malformed PINs; dialog focus and clearing; session expiry; storage-disabled entry; network failure recovery; HTTPS redirect; no gallery requests before entry.`);
