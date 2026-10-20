// Reserve a visible region for the existing gallery camera; never add a renderer.
let scheduled = 0;
let stage;
let observedMast;
let galleryMode = document.documentElement.classList.contains('is-gallery');
const root = document.documentElement;
const resize = new ResizeObserver(() => {
  if (root.classList.contains('locations-layout')) schedule();
});
const toggle = (name, value) => {
  if (root.classList.contains(name) !== value) root.classList.toggle(name, value);
};
function update() {
  scheduled = 0;
  const archive = document.querySelector('.horror-locations[open]');
  const page = document.querySelector('.locations-page');
  const pageVisible = !!page && !root.classList.contains('is-gallery');
  const active = !!archive || pageVisible;
  toggle('locations-layout', active);
  toggle('locations-page-active', pageVisible);
  toggle('locations-archive-open', !!archive);
  if (!active) {
    window.__locationsViewport = null;
    if (stage && !stage.hidden) stage.hidden = true;
    if (observedMast) resize.unobserve(observedMast);
    observedMast = null;
    return;
  }
  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'locations-globe-space';
    stage.setAttribute('aria-hidden', 'true');
    document.body.append(stage);
    resize.observe(stage);
  }
  if (stage.hidden) stage.hidden = false;
  const mast = document.querySelector('.mast');
  if (mast !== observedMast) {
    if (observedMast) resize.unobserve(observedMast);
    observedMast = mast;
    if (mast) resize.observe(mast);
  }
  const top = `${Math.max(64, mast?.getBoundingClientRect().bottom || 0) + 12}px`;
  if (root.style.getPropertyValue('--locations-top') !== top) root.style.setProperty('--locations-top', top);
  const rect = stage.getBoundingClientRect(), current = window.__locationsViewport;
  const controlsX = `${rect.left + rect.width / 2}px`;
  const controlsBottom = `${rect.top + rect.height}px`;
  if (root.style.getPropertyValue('--globe-controls-x') !== controlsX) root.style.setProperty('--globe-controls-x', controlsX);
  if (root.style.getPropertyValue('--globe-controls-bottom') !== controlsBottom) root.style.setProperty('--globe-controls-bottom', controlsBottom);
  if (!current || current.left !== rect.left || current.top !== rect.top || current.width !== rect.width || current.height !== rect.height) {
    window.__locationsViewport = {left:rect.left, top:rect.top, width:rect.width, height:rect.height};
  }
}
export function schedule() {
  if (!scheduled) scheduled = requestAnimationFrame(update);
}
export function archiveVisibility(open) {
  toggle('locations-archive-open', open);
  schedule();
}
window.addEventListener('resize', schedule, {passive:true});
window.visualViewport?.addEventListener('resize', schedule, {passive:true});
// Text changes in the loader, guide, pin labels and case files do not affect
// framing. Only route/header insertion and removal needs a fresh measurement.
new MutationObserver(changes => {
  for (const change of changes) {
    for (const nodes of [change.addedNodes, change.removedNodes]) {
      for (const node of nodes) {
        if (node.nodeType === 1 && (node.matches('.locations-page,.mast') || node.querySelector('.locations-page,.mast'))) {
          schedule();
          return;
        }
      }
    }
  }
}).observe(document.body, {childList:true, subtree:true});
new MutationObserver(() => {
  const next = root.classList.contains('is-gallery');
  if (next !== galleryMode) {
    galleryMode = next;
    schedule();
  }
}).observe(root, {attributes:true, attributeFilter:['class']});
schedule();
