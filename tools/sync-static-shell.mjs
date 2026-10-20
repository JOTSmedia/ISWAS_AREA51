// Keep the shipped document's first render consistent with the bundled app.
// Only evaluate the presentational logo/loading functions, with effects disabled.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'assets/index-v18-1.js'), 'utf8');
const fragment = Symbol('fragment');
const jsx = (type, props) => ({ type, props });
const context = vm.createContext({
  L: { jsx, jsxs: jsx, Fragment: fragment },
  I: { useRef: current => ({ current }), useState: value => [value, () => {}], useEffect: () => {} },
  window: { innerWidth: 1280, innerHeight: 800 },
});
const between = (begin, end) => source.slice(source.indexOf(begin), source.indexOf(end, source.indexOf(begin)));
vm.runInContext(between('function Mv()', 'function Nv()') +
  between('function romanNum(', 'function Iv('), context);

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const isText = value => typeof value === 'string' || typeof value === 'number';
function renderChildren(children) {
  const items = Array.isArray(children) ? children.flat(Infinity) : [children];
  let previousText = false;
  return items.map(item => {
    if (item == null || typeof item === 'boolean') return '';
    const text = isText(item), separator = text && previousText ? '<!-- -->' : '';
    previousText = text;
    return separator + render(item);
  }).join('');
}
function render(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return renderChildren(node);
  if (typeof node !== 'object') return escape(node);
  const { type, props = {} } = node;
  if (type === fragment) return renderChildren(props.children);
  if (typeof type === 'function') return render(type(props));
  let attrs = '';
  for (const [key, value] of Object.entries(props)) {
    if (value == null || ['children', 'ref', 'key', 'dangerouslySetInnerHTML'].includes(key) || key.startsWith('on')) continue;
    const name = key === 'className' ? 'class' : key;
    if (typeof value === 'boolean' && !name.startsWith('aria-') && !name.startsWith('data-')) {
      if (value) attrs += ` ${name}=""`;
      continue;
    }
    let serialized = value;
    if (key === 'style') serialized = Object.entries(value).map(([k,v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';');
    attrs += ` ${name}="${escape(serialized)}"`;
  }
  if (['img', 'br', 'input', 'link', 'meta', 'hr'].includes(type)) return `<${type}${attrs}/>`;
  return `<${type}${attrs}>${props.dangerouslySetInnerHTML?.__html ?? renderChildren(props.children)}</${type}>`;
}

const logo = render(vm.runInContext('Mv()', context));
const menuToggle = '<button type="button" class="nav-menu-toggle" aria-label="Open presentation menu" aria-expanded="false" aria-controls="presentation-navigation"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>';
const menuNav = '<nav id="presentation-navigation" class="presentation-navigation mt-1 flex w-full items-center justify-center gap-x-2 gap-y-0 md:mt-2 md:gap-x-5" aria-label="Presentation">';
const loader = render(vm.runInContext('Fv({onDone:()=>{}})', context));
const jsxRuntime = { jsx, jsxs: jsx, Fragment: fragment };
const hooks = { useRef: current => ({ current }), useState: value => [value, () => {}], useEffect: () => {}, useLayoutEffect: () => {} };
const dataContext = vm.createContext({ window: { __ISWAS_BASE: '../' } });
vm.runInContext(between('function lv(', ',Sv=`modulepreload`') + ';', dataContext);
const readData = name => vm.runInContext(name, dataContext);
const mainExports = {
  _: () => ({}), g: () => jsxRuntime, x: value => value, y: () => hooks,
  c: readData('uv'), u: readData('dv'), p: readData('fv'), f: readData('pv'),
  s: readData('mv'), i: readData('hv'), n: readData('_v'), r: readData('gv'),
  a: readData('vv'), l: readData('bv'), o: readData('xv'), t: readData('yv'),
};
function loadPresentation(filename, otherExports = {}) {
  let script = fs.readFileSync(path.join(root, 'assets', filename), 'utf8');
  script = script.replace(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?/g, (_, bindings, from) => {
    const names = bindings.split(',').map(value => value.trim().replace(/\s+as\s+/, ':')).join(',');
    return `const {${names}}=${from.includes('index-7le_n55D') ? 'mainExports' : 'otherExports'};`;
  });
  script = script.replace(/export\s*\{([^}]+)\};?/, (_, bindings) => {
    const names = bindings.split(',').map(value => {
      const [local, exported] = value.trim().split(/\s+as\s+/);
      return `${exported || local}:${local}`;
    }).join(',');
    return `return {${names}};`;
  });
  return new Function('mainExports', 'otherExports', 'window', script)(mainExports, otherExports, {});
}
const dossier = loadPresentation('dossier-DjjHUuDC-v18-1.js');
const routeFiles = {
  '': 'routes-_h6z7-DI-v18-1.js', need: 'need-CeNEguFh-v18-1.js', stars: 'stars-CUuKb4v8-v18-1.js',
  locations: 'locations-v18-1.js', form: 'form-BBEd8Wd--v18-1.js', comparison: 'comparison-DJ0RniAw-v18-1.js', contact: 'contact-DBe8tnEL-v18-1.js',
};
for (const route of ['', 'need', 'stars', 'locations', 'form', 'comparison', 'contact']) {
  const filename = path.join(root, route, 'index.html');
  let html = fs.readFileSync(filename, 'utf8');
  html = html.replace(/<div class="hero-still"[^>]*><\/div>/, '');
  // Refresh the logo and menu together so every direct route hydrates the same header.
  html = html.replace(/(<header class="mast"><a\b[^>]*>)[\s\S]*?(<\/a>)(?=<nav|<button)/, `$1${logo}$2`);
  html = html.replace(/(<header class="mast"><a\b[^>]*>[\s\S]*?<\/a>)(?:<button\b[^>]*class="nav-menu-toggle"[^>]*>[\s\S]*?<\/button>)?<nav\b[^>]*>/, `$1${menuToggle}${menuNav}`);
  // The brand is a plain reload anchor in the app, not the router's active link.
  html = html.replace(/(<header class="mast"><a\b[^>]*?) active(?=")/, '$1');
  html = html.replace(/(<header class="mast"><a\b[^>]*?) data-status="active" aria-current="page"/, '$1');
  html = html.replace('class="dossier-panel rise"', 'class="dossier-panel"');
  const content = render(loadPresentation(routeFiles[route], dossier).component());
  html = html.replace(/(<!--\$-->)[\s\S]*?(?=<script>\(function\(a,f\))/, `$1${content}`);
  if (!route) {
    html = html.replace(/<div class="load-screen"[\s\S]*?(?=<\/div><script data-tsr-stream-part)/, loader);
  }
  if (route === 'locations') html = html.replace(/i:"\u0000need\u0000need"/, 'i:"\u0000locations\u0000locations"');
  // Hydration does not repair stale relative href attributes. Resolve them while
  // the canonical initial URL still has its slash, before SPA routes can change.
  // This also keeps the same archive deployable at / or under a version folder.
  const linkBootstrap = '<script data-iswas-links>(function(){var base=window.__ISWAS_BASE||"/";document.querySelectorAll(".mast a[href],.slide-nav a[href]").forEach(function(a){var path=new URL(a.getAttribute("href"),location.href).pathname;if(path.indexOf(base)!==0)return;var section=path.slice(base.length).replace(/\\/$/,"");a.setAttribute("href",base+section)});document.currentScript.remove()})();</script>';
  html = html.replace(/<script data-iswas-links>[\s\S]*?<\/script>/g, '');
  html = html.replace(/(?=<script type="module" async="" src=)/, linkBootstrap);
  fs.writeFileSync(filename, html);
  console.log(`Synchronized ${route || 'overview'} shell`);
}
