/* A failed browser graphics context must not become an unexplained dead end. */
(() => {
  let dialog;
  window.__showGalleryHelp = () => {
    if (dialog?.open) return;
    const graphics = /webgl|context|graphics/i.test(window.__iswasGalleryFailure?.message || '');
    dialog = document.createElement('dialog');
    dialog.className = 'gallery-recovery';
    dialog.setAttribute('aria-labelledby', 'gallery-recovery-title');
    dialog.innerHTML = `<button type="button" class="gallery-recovery-close" aria-label="Close gallery help">×</button>
      <p class="gallery-recovery-kicker">360 GALLERY</p>
      <h2 id="gallery-recovery-title">${graphics ? 'LET’S RESTORE THE VIEW' : 'LET’S TRY THAT AGAIN'}</h2>
      <p>${graphics ? 'YOUR BROWSER COULD NOT START 3D GRAPHICS. THE PRESENTATION IS STILL AVAILABLE.' : 'THE GALLERY COULD NOT FINISH LOADING. PLEASE CHECK YOUR CONNECTION AND TRY AGAIN.'}</p>
      ${graphics ? '<p>IN CHROME, CHECK SETTINGS → SYSTEM → “USE GRAPHICS ACCELERATION WHEN AVAILABLE.” IF IT IS ALREADY ON, FULLY QUIT AND REOPEN CHROME. YOU CAN ALSO OPEN THIS SITE IN SAFARI.</p>' : ''}
      <div class="gallery-recovery-actions"><button type="button" data-retry>TRY AGAIN</button><button type="button" data-close>BACK TO PRESENTATION</button></div>`;
    const close = () => dialog.close();
    const outside = event => {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    const scrollOutside = event => { if (dialog.open && outside(event)) close(); };
    dialog.querySelector('.gallery-recovery-close').addEventListener('click', close);
    dialog.querySelector('[data-close]').addEventListener('click', close);
    // Full reload also resets Morgan's failed renderer and disposed scene resources.
    dialog.querySelector('[data-retry]').addEventListener('click', () => window.location.reload());
    dialog.addEventListener('click', event => { if (event.target === dialog && outside(event)) close(); });
    dialog.addEventListener('close', () => {
      document.removeEventListener('wheel', scrollOutside, true);
      dialog.remove();
    }, {once:true});
    document.addEventListener('wheel', scrollOutside, {capture:true, passive:true});
    document.body.appendChild(dialog);
    dialog.showModal();
  };
})();
