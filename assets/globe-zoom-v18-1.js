// One lightweight control surface shared by Locations and the focused 360 globe.
// Projection stays in the existing camera; this module never creates a renderer.
const DEFAULT_ZOOM = 1.18;
const MIN_ZOOM = .8;
const MAX_ZOOM = 2.4;
const clampZoom = value => Number.isFinite(Number(value))
  ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value))) : DEFAULT_ZOOM;
window.__globeZoom = clampZoom(window.__globeZoom ?? DEFAULT_ZOOM);

function initGlobeZoom() {
  if (document.getElementById('globe-zoom-controls')) return;
  const root = document.documentElement;
  const controls = document.createElement('div');
  controls.id = 'globe-zoom-controls';
  controls.hidden = true;
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Globe zoom controls');
  controls.innerHTML = `
    <button type="button" class="globe-zoom-minus" aria-label="Zoom out of the globe" title="Zoom out">−</button>
    <div class="globe-zoom-track">
      <label for="globe-zoom-range">ZOOM <output id="globe-zoom-value" for="globe-zoom-range">118%</output></label>
      <input id="globe-zoom-range" type="range" min="80" max="240" step="1" value="118" aria-label="Globe zoom" aria-valuetext="118 percent">
    </div>
    <button type="button" class="globe-zoom-plus" aria-label="Zoom into the globe" title="Zoom in">+</button>
    <button type="button" class="globe-zoom-reset" aria-label="Reset globe zoom to 118 percent">RESET</button>`;
  const minus = controls.querySelector('.globe-zoom-minus');
  const plus = controls.querySelector('.globe-zoom-plus');
  const reset = controls.querySelector('.globe-zoom-reset');
  const range = controls.querySelector('input');
  const value = controls.querySelector('output');
  function render() {
    const zoom = clampZoom(window.__globeZoom);
    const percent = Math.round(zoom * 100);
    if (range.value !== String(percent)) range.value = String(percent);
    value.textContent = `${percent}%`;
    range.setAttribute('aria-valuetext', `${percent} percent`);
    minus.disabled = zoom <= MIN_ZOOM;
    plus.disabled = zoom >= MAX_ZOOM;
    reset.disabled = Math.abs(zoom - DEFAULT_ZOOM) < .001;
  }
  function setZoom(zoom) {
    const next = Math.round(clampZoom(zoom) * 100) / 100;
    if (next === window.__globeZoom) return;
    window.__globeZoom = next;
    window.__iswasTour?.pause('globe-zoom');
    render();
    window.dispatchEvent(new CustomEvent('globe-zoom-change', {detail:{zoom:next}}));
  }
  minus.addEventListener('click', () => setZoom(window.__globeZoom - .12));
  plus.addEventListener('click', () => setZoom(window.__globeZoom + .12));
  reset.addEventListener('click', () => setZoom(DEFAULT_ZOOM));
  // Native range supplies keyboard arrows, Home/End and touch dragging.
  range.addEventListener('input', () => setZoom(Number(range.value) / 100));
  window.addEventListener('globe-zoom-change', render);
  const stop = event => event.stopPropagation();
  for (const type of ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend','click','keydown']) {
    controls.addEventListener(type, stop);
  }
  // Never prevent default: browser zoom and native range gestures remain native.
  controls.addEventListener('wheel', stop, {passive:true});
  const popupSelector = 'dialog[open]:not(.horror-locations),.gallery-dialog,.tome-back,.magic-portal';
  function syncVisibility() {
    const visible = root.classList.contains('globe-zoom-active') &&
      root.classList.contains('iswas-scene-ready') &&
      !root.classList.contains('iswas-loading') && !document.querySelector(popupSelector);
    if (controls.hidden === visible) controls.hidden = !visible;
  }
  document.body.append(controls);
  render();
  syncVisibility();
  new MutationObserver(syncVisibility).observe(root, {attributes:true, attributeFilter:['class']});
  // Ignore frame-rate avatar transforms, changing tooltip text and archive rows.
  const popupNodeSelector = 'dialog,.gallery-dialog,.tome-back,.magic-portal';
  new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'attributes') { syncVisibility(); return; }
      for (const nodes of [change.addedNodes, change.removedNodes]) {
        for (const node of nodes) {
          if (node.nodeType === 1 && (node.matches(popupNodeSelector) || node.querySelector(popupNodeSelector))) {
            syncVisibility(); return;
          }
        }
      }
    }
  }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['open']});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGlobeZoom, {once:true});
else initGlobeZoom();
