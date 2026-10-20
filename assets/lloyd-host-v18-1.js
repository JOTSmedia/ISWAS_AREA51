import './popup-behavior-v18-1.js';

// A small, local conversation: no remote chat, audio or animation loop.
let dialog;
let returnFocus;
let keyboardEntry;
let installed = false;
const GREETING = "WELCOME TO THE GOLD ROOM, I'M LLOYD";
const MENU = [
  ['recommend', 'WHAT DO YOU RECOMMEND?'],
  ['guest', 'WHO IS THE GUEST AT THE BAR?'],
  ['explore', 'EXPLORE THE ROOM'],
];

function installStyle() {
  if (document.getElementById('lloyd-host-style')) return;
  const style = document.createElement('link');
  style.id = 'lloyd-host-style';
  style.rel = 'stylesheet';
  style.href = new URL('./lloyd-host-v18-1.css', import.meta.url).href;
  document.head.append(style);
}

function choices(items) {
  const actions = dialog.querySelector('.lloyd-host-actions');
  actions.replaceChildren();
  for (const [action, label] of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.lloydAction = action;
    button.textContent = label;
    button.addEventListener('click', () => choose(action));
    actions.append(button);
  }
}

function say(copy, items) {
  const reply = dialog.querySelector('.lloyd-host-reply');
  reply.textContent = copy;
  choices(items);
  dialog.scrollTop = 0;
  // Announce the answer and keep the next choices immediately after it.
  reply.focus({preventScroll:true});
}

function choose(action) {
  switch (action) {
    case 'recommend':
      say('A QUIET SEAT AND SOMETHING TO YOUR TASTE. PERHAPS A BOURBON, OR A GINGER ALE WITH LIME IF YOU PREFER SOMETHING WITHOUT ALCOHOL. TAKE YOUR TIME; THE ROOM IS YOURS TO EXPLORE.', [['menu', 'ANOTHER QUESTION'], ['explore', 'EXPLORE THE ROOM']]);
      break;
    case 'guest':
      say("THAT'S JACK TORRANCE, AS PLAYED BY JACK NICHOLSON IN THE SHINING. OUR GOLD ROOM PATRON IS INSPIRED BY HIS VISIT TO THE OVERLOOK BAR. HE SEEMS QUITE AT HOME THIS EVENING.", [['menu', 'ANOTHER QUESTION'], ['explore', 'EXPLORE THE ROOM']]);
      break;
    case 'explore':
      say('WHERE WOULD YOU LIKE TO GO? THE BAR IS RIGHT HERE. THE CIGAR LOUNGE HAS THE TELEVISION, AND THE LIBRARY IS WAITING WHEN YOU ARE READY.', [['go:bar', 'STAY AT THE BAR'], ['go:cigars', 'VISIT THE CIGAR LOUNGE'], ['go:library', 'VISIT THE LIBRARY'], ['menu', 'ANOTHER QUESTION']]);
      break;
    case 'menu':
      say('OF COURSE. WHAT ELSE MAY I HELP YOU WITH?', MENU);
      break;
    default:
      if (!['go:bar', 'go:cigars', 'go:library'].includes(action)) return;
      dialog.close();
      window.dispatchEvent(new CustomEvent('gallery-waypoint', {detail:{id:action.slice(3)}}));
  }
}

function createDialog() {
  if (dialog) return;
  installStyle();
  dialog = document.createElement('dialog');
  dialog.className = 'lloyd-host-dialog';
  dialog.setAttribute('aria-labelledby', 'lloyd-host-title');
  dialog.setAttribute('aria-describedby', 'lloyd-host-greeting');
  dialog.innerHTML = `
    <header class="lloyd-host-head">
      <p class="lloyd-host-kicker">THE OVERLOOK · THE GOLD ROOM</p>
      <h2 id="lloyd-host-title">LLOYD</h2>
      <button class="lloyd-host-close" type="button" aria-label="CLOSE LLOYD'S CONVERSATION"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18"/></svg></button>
    </header>
    <div class="lloyd-host-body">
      <div class="lloyd-host-portrait"><img width="400" height="600" decoding="async" alt="LLOYD, YOUR GOLD ROOM BARTENDER"></div>
      <div class="lloyd-host-conversation">
        <p class="lloyd-host-greeting" id="lloyd-host-greeting">${GREETING}</p>
        <p class="lloyd-host-reply" tabindex="-1" aria-live="polite" aria-atomic="true"></p>
        <div class="lloyd-host-actions" role="group" aria-label="QUESTIONS FOR LLOYD"></div>
      </div>
    </div>`;
  dialog.querySelector('img').src = new URL('../characters/lloyd/lloyd.webp', import.meta.url).href;
  dialog.querySelector('.lloyd-host-close').addEventListener('click', () => dialog.close());
  // Native modal focus trapping and Escape; shared popup code handles outside input.
  dialog.addEventListener('close', () => {
    const target = returnFocus;
    returnFocus = null;
    dialog.querySelector('.lloyd-host-reply').textContent = '';
    dialog.querySelector('.lloyd-host-actions').replaceChildren();
    if (target?.isConnected && typeof target.focus === 'function') target.focus({preventScroll:true});
    window.dispatchEvent(new CustomEvent('iswas:lloyd-close', {detail:{open:false}}));
  });
  document.body.append(dialog);
}

export function openLloydHost() {
  if (dialog?.open) return;
  createDialog();
  const active = document.activeElement;
  returnFocus = active && active !== document.body && active !== document.documentElement
    ? active : keyboardEntry;
  dialog.querySelector('.lloyd-host-reply').textContent = 'PLEASE, MAKE YOURSELF COMFORTABLE. HOW MAY I HELP YOU THIS EVENING?';
  choices(MENU);
  window.__iswasTour?.pause('lloyd-host');
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('.lloyd-host-actions button').focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('iswas:lloyd-open', {detail:{open:true}}));
}

export function installLloydAccess() {
  if (installed) return;
  installed = true;
  installStyle();
  keyboardEntry = document.createElement('button');
  keyboardEntry.id = 'lloyd-host-access';
  keyboardEntry.className = 'lloyd-host-access';
  keyboardEntry.type = 'button';
  keyboardEntry.textContent = 'TALK TO LLOYD';
  keyboardEntry.setAttribute('aria-haspopup', 'dialog');
  keyboardEntry.addEventListener('click', openLloydHost);
  document.body.append(keyboardEntry);
  window.addEventListener('iswas:open-lloyd', openLloydHost);
}

if(typeof document!=='undefined'){
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installLloydAccess, {once:true});
 else installLloydAccess();
}
