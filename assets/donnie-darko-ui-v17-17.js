import './popup-behavior-v17-17.js';

// Film details verified against 20th Century Studios and the BFI:
// https://www.20thcenturystudios.com/movies/donnie-darko
// https://www.bfi.org.uk/film/4cdcb182-f077-5329-8da7-5c468ec50abf/donnie-darko
// One native dialog, created only when the mirror is opened. Its transparent
// backdrop leaves the gallery visible while the browser manages modal focus.
let dialog;
let returnFocus;
let keyboardEntry;
const assetURL = path => new URL('../' + path, import.meta.url).href;

function installStyle() {
  if (document.getElementById('donnie-darko-style')) return;
  const style = document.createElement('style');
  style.id = 'donnie-darko-style';
  style.textContent = `
.donnie-mirror-access{display:none}
.is-gallery.iswas-scene-ready:not(.iswas-loading) .donnie-mirror-access{display:block;position:fixed;left:50%;top:calc(var(--mast-height,76px) + 12px);transform:translateX(-50%);z-index:90;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.is-gallery .donnie-mirror-access:focus-visible{clip-path:none;width:auto;max-width:calc(100vw - 24px);height:auto;min-height:44px;margin:0;padding:10px 16px;overflow:visible;white-space:normal;border:1px solid #b39560;border-radius:6px;background:#171414;color:#f0e4ce;font:600 12px/1.5 "Plus Jakarta Sans",Arial,sans-serif;letter-spacing:.06em;outline:2px solid #edc887;outline-offset:3px}
.donnie-darko-dialog{position:fixed;inset:0;box-sizing:border-box;width:min(800px,calc(100vw - 40px));max-width:none;max-height:calc(100dvh - 40px);margin:auto;padding:0;overflow:auto;overscroll-behavior:contain;scrollbar-color:#8c7045 #171414;border:1px solid #927344;border-radius:12px;background:#111013;color:#eee5d5;box-shadow:0 24px 80px #000a;font:13px/1.8 "Plus Jakarta Sans",Arial,sans-serif;letter-spacing:.025em;text-transform:uppercase;color-scheme:dark}
.donnie-darko-dialog::backdrop{background:transparent}
.donnie-darko-dialog *{box-sizing:border-box}
.donnie-darko-head{position:sticky;top:0;z-index:1;padding:20px 78px 18px 24px;border-bottom:1px solid #5b4934;background:#111013}
.donnie-darko-kicker{margin:0 0 5px!important;color:#e7b869;font-size:10px;letter-spacing:.14em}
.donnie-darko-head h2{margin:0;font-size:clamp(24px,4vw,34px);line-height:1.2;letter-spacing:.025em;color:#f6e5c9}
.donnie-darko-close{position:absolute;top:18px;right:18px;display:grid;place-items:center;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border:1px solid #6c5840;border-radius:50%;background:#24201c;color:#eee5d5;cursor:pointer;touch-action:manipulation}
.donnie-darko-close:hover{border-color:#e7b869}
.donnie-darko-close:focus-visible{outline:2px solid #e7b869;outline-offset:3px}
.donnie-darko-close svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
.donnie-darko-body{display:grid;grid-template-columns:minmax(170px,38%) minmax(0,1fr);gap:26px;padding:24px}
.donnie-darko-image{display:block;width:100%;height:auto;aspect-ratio:4/5;object-fit:contain;border:1px solid #514c4a;border-radius:5px;background:#030509}
.donnie-darko-copy{min-width:0}
.donnie-darko-dialog p{text-align:justify;text-align-last:start;hyphens:auto;margin:0 0 18px}
.donnie-darko-meta{margin:0 0 20px;padding:0 0 18px;border-bottom:1px solid #5b4934}
.donnie-darko-meta dt{margin:12px 0 2px;color:#e7b869;font-size:10px;letter-spacing:.09em}
.donnie-darko-meta dt:first-child{margin-top:0}
.donnie-darko-meta dd{margin:0;font-size:12px;line-height:1.7}
.donnie-darko-copy p:last-child{margin-bottom:0}
@media(max-width:600px){.donnie-darko-dialog{width:calc(100vw - 24px);max-height:calc(100dvh - 28px);border-radius:9px;font-size:12px}.donnie-darko-head{padding:18px 70px 16px 18px}.donnie-darko-close{top:14px;right:14px}.donnie-darko-body{grid-template-columns:minmax(0,1fr);gap:20px;padding:18px}.donnie-darko-image{width:min(210px,70%);margin:0 auto}.donnie-darko-meta{margin-bottom:18px}.donnie-darko-meta dd{font-size:12px}}
`;
  document.head.append(style);
}

function createDialog() {
  if (dialog) return;
  installStyle();
  dialog = document.createElement('dialog');
  dialog.className = 'donnie-darko-dialog';
  dialog.setAttribute('aria-labelledby', 'donnie-darko-title');
  dialog.setAttribute('aria-describedby', 'donnie-darko-synopsis');
  dialog.innerHTML = `
    <header class="donnie-darko-head">
      <p class="donnie-darko-kicker">BEYOND THE MIRROR · 2001</p>
      <h2 id="donnie-darko-title">DONNIE DARKO</h2>
      <button class="donnie-darko-close" type="button" aria-label="Close Donnie Darko movie" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18"/></svg></button>
    </header>
    <div class="donnie-darko-body">
      <img class="donnie-darko-image" width="800" height="1000" decoding="async" alt="Frank, the rabbit from Donnie Darko, touching a rippling mirror">
      <div class="donnie-darko-copy">
        <dl class="donnie-darko-meta">
          <dt>WRITTEN AND DIRECTED BY</dt><dd>RICHARD KELLY</dd>
          <dt>STARRING</dt><dd>JAKE GYLLENHAAL · JENA MALONE · DREW BARRYMORE</dd>
        </dl>
        <p id="donnie-darko-synopsis">AFTER NARROWLY ESCAPING A BIZARRE ACCIDENT, A TROUBLED TEENAGER BEGINS SEEING FRANK, A FIGURE IN A RABBIT SUIT WHO WARNS THAT THE WORLD WILL END. AS DONNIE FOLLOWS HIS CRYPTIC GUIDANCE, THE BOUNDARY BETWEEN SUBURBAN LIFE, DREAMS AND TIME ITSELF BEGINS TO UNRAVEL.</p>
      </div>
    </div>`;
  dialog.querySelector('img').src = assetURL('plates/donnie-darko-mirror.webp');
  dialog.querySelector('.donnie-darko-close').addEventListener('click', () => dialog.close());
  // Native showModal supplies Tab/Shift+Tab containment and Escape dismissal.
  // Shared popup-behavior supplies outside click, wheel and touch dismissal.
  dialog.addEventListener('close', () => {
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected && typeof target.focus === 'function') target.focus({preventScroll:true});
    window.dispatchEvent(new CustomEvent('iswas:donnie-darko-visibility', {detail:{open:false}}));
  });
  document.body.append(dialog);
}

export function openDonnieDarko() {
  if (dialog?.open) return;
  createDialog();
  const active = document.activeElement;
  returnFocus = active && active !== document.body && active !== document.documentElement
    ? active : document.querySelector('.gallery-controls button');
  window.__iswasTour?.pause('donnie-darko');
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('.donnie-darko-close').focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('iswas:donnie-darko-visibility', {detail:{open:true}}));
}

function installKeyboardEntry() {
  installStyle();
  if (document.getElementById('donnie-mirror-access')) return;
  keyboardEntry = document.createElement('button');
  keyboardEntry.id = 'donnie-mirror-access';
  keyboardEntry.className = 'donnie-mirror-access';
  keyboardEntry.type = 'button';
  keyboardEntry.textContent = 'OPEN THE DONNIE DARKO MIRROR';
  keyboardEntry.addEventListener('click', openDonnieDarko);
  document.body.append(keyboardEntry);
}

window.addEventListener('iswas:open-donnie-darko', openDonnieDarko);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installKeyboardEntry, {once:true});
else installKeyboardEntry();
