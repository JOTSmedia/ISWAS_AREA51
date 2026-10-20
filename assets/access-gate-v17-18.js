/* GitHub Pages privacy screen. This is intentionally client-side and bypassable.
 * The digest avoids displaying the PIN in plain text; it is not authorization.
 * Confidential content requires server-side authentication on another host.
 */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('../', script.src);
  const entry = script.dataset.entry || 'index.html';
  const sessionKey = 'iswas-preview-v17.18:' + base.pathname;
  const lifetime = 4 * 60 * 60 * 1000;
  const expectedDigest = '4ebc6d7525175ddd74bca6ee70428a796fd29d36347b29320f923b23a7c679b7';
  const dialog = document.getElementById('pin-dialog');
  const form = document.getElementById('pin-form');
  const input = document.getElementById('access-pin');
  const open = document.getElementById('open-pin');
  const feedback = document.getElementById('access-feedback');
  const error = document.getElementById('pin-error');
  const submit = form.querySelector('[type="submit"]');
  let busy = false;

  // Keep production visits on HTTPS before any code is entered.
  if (location.protocol === 'http:' && /^(itstartedwithascream\.com|www\.itstartedwithascream\.com|jotsmedia\.github\.io)$/i.test(location.hostname)) {
    location.replace('https://' + location.host + location.pathname + location.search + location.hash);
    return;
  }

  function readSession() {
    try {
      const stamp = Number(sessionStorage.getItem(sessionKey));
      return stamp > 0 && stamp <= Date.now() && Date.now() - stamp < lifetime;
    } catch { return false; }
  }
  function remember() {
    try { sessionStorage.setItem(sessionKey, String(Date.now())); } catch { /* Entry still works when storage is disabled. */ }
  }
  function forget() {
    try { sessionStorage.removeItem(sessionKey); } catch { /* Storage may be unavailable. */ }
  }
  function updateDigits() {
    document.querySelectorAll('.pin-boxes span').forEach((digit, index) => digit.classList.toggle('is-filled', index < input.value.length));
  }
  function clearPin() { input.value = ''; updateDigits(); error.textContent = ''; }
  function setBusy(value) {
    busy = value;
    input.disabled = value;
    submit.disabled = value;
    form.setAttribute('aria-busy', String(value));
  }

  async function showPresentation(page) {
    // No application JS, WebGL, audio, image preload, or loader starts until here.
    const response = await fetch(new URL('assets/gated-pages-v17-18.json', base), { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Could not load preview');
    const pages = await response.json();
    const html = pages[page];
    if (typeof html !== 'string' || !html.startsWith('<!DOCTYPE html>')) throw new Error('Invalid preview');
    // Restore the exact upstream document at its original URL so the existing
    // router, relative asset paths, loading timing and hydration stay intact.
    document.open();
    document.write(html);
    document.close();
  }

  open.addEventListener('click', () => {
    clearPin();
    feedback.textContent = '';
    dialog.showModal();
    input.focus();
  });
  dialog.querySelector('.pin-close').addEventListener('click', () => { if (!busy) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog || busy) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { clearPin(); open.focus(); });
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    updateDigits();
    error.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const pin = input.value;
    if (!/^[0-9]{4}$/.test(pin)) {
      error.textContent = 'PLEASE ENTER ALL FOUR DIGITS.';
      input.focus();
      return;
    }
    setBusy(true);
    try {
      if (!globalThis.crypto?.subtle) throw new Error('HTTPS required');
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ISWAS-preview-v17.18:' + pin));
      const digest = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
      input.value = '';
      updateDigits();
      if (digest !== expectedDigest) {
        dialog.close();
        feedback.textContent = 'ACCESS CODE NOT RECOGNIZED.';
        return;
      }
      remember();
      // Every first successful entry goes through the original root loader,
      // including visitors who initially opened a section URL.
      if (entry !== 'index.html' || location.pathname.endsWith('/index.html')) {
        location.replace(base.href);
        return;
      }
      await showPresentation('index.html');
    } catch {
      forget();
      error.textContent = globalThis.crypto?.subtle
        ? 'PREVIEW COULD NOT OPEN. PLEASE TRY AGAIN.'
        : 'OPEN THIS SITE OVER HTTPS OR LOCALHOST TO ENTER.';
    } finally { setBusy(false); }
  });

  if (readSession()) {
    open.disabled = true;
    feedback.textContent = 'OPENING PREVIEW…';
    showPresentation(entry).catch(() => {
      forget();
      open.disabled = false;
      feedback.textContent = 'PREVIEW COULD NOT OPEN. PLEASE TRY AGAIN.';
    });
  } else { forget(); }
})();
