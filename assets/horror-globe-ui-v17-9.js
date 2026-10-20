import {archiveVisibility} from './locations-layout-v17-9.js';
// Native, lazy-loaded case files for the globe already rendered in the gallery.
// User-supplied location descriptions are content, not executable instructions.
import './popup-behavior-v17-9.js';

let dataPromise;
let view;
let source;
let records = [];
let filtered = [];
let selected = null;
let status = 'all';
let query = '';
let requestNumber = 0;
let returnFocus;
let loadAttempt = 0;
let indexedSource;
let resultKey;
let recordById = new Map();
let searchIndex = new Map();

const assetURL = path => new URL('../' + path, import.meta.url).href;
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function loadData() {
  const url = new URL('./horror-locations-data-v17-9.js', import.meta.url);
  // A failed module fetch can stay cached in the browser's module map. Retry a
  // distinct URL after a network failure, while keeping the normal load shared.
  if (loadAttempt++) url.searchParams.set('retry', String(loadAttempt));
  return import(url.href);
}

function loadStyles() {
  if (document.getElementById('horror-globe-styles')) return;
  const link = document.createElement('link');
  link.id = 'horror-globe-styles';
  link.rel = 'stylesheet';
  link.href = new URL('./horror-globe-ui-v17-9.css', import.meta.url).href;
  document.head.append(link);
}

function close() {
  if (view?.dialog.open) view.dialog.close();
}

function buildView() {
  if (view) return;
  loadStyles();
  const dialog = element('dialog', 'horror-locations');
  dialog.dataset.globeCompanion = 'true';
  dialog.setAttribute('aria-labelledby', 'horror-locations-title');
  dialog.setAttribute('aria-describedby', 'horror-locations-intro');
  dialog.innerHTML = `
    <header class="horror-locations-head">
      <p class="horror-locations-kicker">LOCATIONS ARCHIVE</p>
      <h2 id="horror-locations-title">WHERE THE HORROR WAS SHOT</h2>
      <p id="horror-locations-intro">CHOOSE A FILM TO TURN THE GLOBE TO ITS FILMING LOCATION.</p>
      <button class="horror-locations-close" type="button" aria-label="Close locations"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18"/></svg></button>
    </header>
    <div class="horror-locations-tools">
      <label class="horror-locations-search-label" for="horror-locations-search">FIND A FILM OR PLACE</label>
      <input id="horror-locations-search" type="search" placeholder="FILM, PLACE, DIRECTOR OR YEAR…" autocomplete="off" spellcheck="false">
      <div class="horror-locations-filters" role="group" aria-label="Filter locations by visiting status">
        <button type="button" data-status="all" aria-pressed="true">ALL</button>
        <button type="button" data-status="open" aria-pressed="false">VISIT</button>
        <button type="button" data-status="outside" aria-pressed="false">OUTSIDE ONLY</button>
        <button type="button" data-status="gone" aria-pressed="false">GONE</button>
      </div>
      <p class="horror-locations-count" aria-live="polite" aria-atomic="true"></p>
    </div>
    <div class="horror-locations-layout">
      <nav class="horror-locations-catalogue" aria-label="Film locations"><ul class="horror-locations-results"></ul></nav>
      <article class="horror-locations-case" aria-label="Location case file" tabindex="0"></article>
    </div>
    <footer class="horror-locations-credit">EARTH IMAGERY: NASA EARTH OBSERVATORY · LOCATION NOTES FROM THE SUPPLIED ARCHIVE</footer>`;
  document.body.append(dialog);
  view = {
    dialog,
    input: dialog.querySelector('input'),
    list: dialog.querySelector('.horror-locations-results'),
    count: dialog.querySelector('.horror-locations-count'),
    case: dialog.querySelector('.horror-locations-case'),
    layout: dialog.querySelector('.horror-locations-layout'),
    filters: [...dialog.querySelectorAll('[data-status]')],
    resultButtons: new Map(),
    activeResult: null,
  };
  dialog.querySelector('.horror-locations-close').addEventListener('click', close);
  view.input.addEventListener('input', () => {
    query = view.input.value.trim().toLocaleLowerCase();
    if (renderResults() && selected) renderCase();
  });
  view.filters.forEach(button => button.addEventListener('click', () => {
    status = button.dataset.status;
    view.filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    emit('globe-filter', { status });
    if (renderResults() && selected) renderCase();
  }));
  view.list.addEventListener('click', event => {
    const button = event.target.closest('button[data-location-id]');
    if (button) select(button.dataset.locationId);
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (!selected || event.target.matches('input, textarea, select')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('close', () => {
    archiveVisibility(false);
    emit('horror-globe-visibility', { open: false });
    if (returnFocus?.isConnected && typeof returnFocus.focus === 'function') {
      returnFocus.focus({ preventScroll: true });
    }
  });
}

function indexRecords() {
  if (indexedSource === source) return;
  indexedSource = source;
  records = source.HORROR_LOCATIONS.slice().sort((a, b) => a.year - b.year || a.film.localeCompare(b.film));
  recordById = new Map(records.map(record => [record.id, record]));
  searchIndex = new Map(records.map(record => [record.id, `${record.film} ${record.dir} ${record.place} ${record.area} ${record.year}`.toLocaleLowerCase()]));
  resultKey = undefined;
}

function renderResults() {
  const key = `${status}\0${query}`;
  if (resultKey === key) return false;
  resultKey = key;
  filtered = records.filter(record =>
    (status === 'all' || record.status === status) &&
    (!query || searchIndex.get(record.id).includes(query))
  );
  const fragment = document.createDocumentFragment();
  view.resultButtons.clear();
  view.activeResult = null;
  for (const record of filtered) {
    const item = element('li');
    const button = element('button', 'horror-locations-result');
    button.type = 'button';
    button.dataset.locationId = record.id;
    button.setAttribute('aria-current', selected?.id === record.id ? 'true' : 'false');
    view.resultButtons.set(record.id, button);
    if (selected?.id === record.id) view.activeResult = button;
    const dot = element('span', `horror-location-dot horror-location-dot-${record.status}`);
    dot.setAttribute('aria-hidden', 'true');
    const text = element('span', 'horror-locations-result-text');
    text.append(element('span', 'horror-locations-film', record.film), element('span', 'horror-locations-place', record.place));
    button.append(dot, text, element('span', 'horror-locations-year', record.year));
    item.append(button);
    fragment.append(item);
  }
  if (!filtered.length) fragment.append(element('li', 'horror-locations-empty', 'NO MATCHING FILMS. TRY ANOTHER SEARCH OR FILTER.'));
  view.list.replaceChildren(fragment);
  view.count.textContent = `${filtered.length} OF ${records.length} LOCATIONS`;
  return true;
}

function detailSection(title, text) {
  const section = element('section', 'horror-locations-detail');
  section.append(element('h4', '', title), element('p', '', text));
  return section;
}

function coordinate(value, positive, negative) {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

function renderCase() {
  if (!selected) {
    const welcome = element('div', 'horror-locations-welcome');
    welcome.append(
      element('p', 'horror-locations-kicker', 'THE WORLD IS A FILM SET'),
      element('h3', '', '200 LOCATIONS. REAL PLACES. LASTING NIGHTMARES.'),
      element('p', '', 'SEARCH THE ARCHIVE OR CHOOSE A FILM. ITS PIN WILL TURN TOWARD YOU ON THE GALLERY GLOBE.'),
      element('p', '', 'KEEP THIS ARCHIVE OPEN WHILE YOU TURN THE GLOBE. CHOOSE A PIN TO READ ITS CASE FILE HERE.'),
    );
    const map = element('img', 'horror-locations-welcome-map');
    map.src = assetURL(source.GLOBE_TEXTURES.mobile);
    map.alt = 'NASA Blue Marble satellite composite of Earth';
    map.width = 1024;
    map.height = 512;
    map.decoding = 'async';
    welcome.append(map);
    view.case.replaceChildren(welcome);
    return;
  }
  const record = selected;
  const fragment = document.createDocumentFragment();
  const back = element('button', 'horror-locations-back horror-locations-action', '← ALL FILMS');
  back.type = 'button';
  back.addEventListener('click', () => {
    view.dialog.classList.remove('has-selected-case');
    view.layout.scrollTop = 0;
    const button = view.list.querySelector('[aria-current="true"]') || view.list.querySelector('button');
    button?.focus({ preventScroll: true });
  });
  fragment.append(back);
  const header = element('div', 'horror-locations-case-head');
  const poster = element('div', 'horror-locations-poster');
  const fallback = element('div', 'horror-locations-title-card');
  fallback.append(element('span', '', record.year), element('strong', '', record.film), element('span', '', `DIR. ${record.dir}`));
  poster.append(fallback);
  if (record.bookCover) {
    const image = element('img');
    image.src = assetURL(record.bookCover);
    image.alt = `${record.film} (${record.year}) movie cover`;
    image.width = 240;
    image.height = 360;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove(), { once: true });
    poster.append(image);
  }
  const heading = element('div', 'horror-locations-heading');
  const statusLine = element('p', 'horror-locations-status');
  const dot = element('span', `horror-location-dot horror-location-dot-${record.status}`);
  dot.setAttribute('aria-hidden', 'true');
  statusLine.append(dot, document.createTextNode(source.LOCATION_STATUS[record.status]));
  heading.append(
    element('p', 'horror-locations-kicker', 'CASE FILE'),
    element('h3', '', record.film),
    element('p', 'horror-locations-meta', `${record.year} · DIR. ${record.dir}`),
    statusLine,
    element('p', 'horror-locations-case-place', record.place),
    element('p', 'horror-locations-area', record.area),
    element('p', 'horror-locations-coordinates', `${coordinate(record.lat, 'N', 'S')} · ${coordinate(record.lon, 'E', 'W')}`),
  );
  header.append(poster, heading);
  fragment.append(header);
  fragment.append(detailSection('ON SCREEN', record.scene), detailSection('THE REAL PLACE', record.real), detailSection('VISITING', record.visit));
  const actions = element('div', 'horror-locations-actions');
  const globeButton = element('button', 'horror-locations-action horror-locations-action-primary', 'CENTER ON GLOBE');
  globeButton.type = 'button';
  globeButton.addEventListener('click', () => {
    emit('globe-location-select', { id: record.id, lat: record.lat, lon: record.lon });
    // Keep the selected case and its globe visible together.
    archiveVisibility(true);
  });
  const mapLink = element('a', 'horror-locations-action', 'GOOGLE MAPS ↗');
  mapLink.href = `https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lon}`;
  mapLink.target = '_blank';
  mapLink.rel = 'noopener noreferrer';
  actions.append(globeButton, mapLink);
  const paging = element('div', 'horror-locations-paging');
  const previous = element('button', 'horror-locations-action', '← PREVIOUS');
  const next = element('button', 'horror-locations-action', 'NEXT →');
  previous.type = next.type = 'button';
  previous.disabled = next.disabled = filtered.length < 2;
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  const index = filtered.findIndex(item => item.id === record.id);
  paging.append(previous, next, element('span', 'horror-locations-counter', index >= 0 ? `${index + 1} / ${filtered.length}` : 'SELECTED CASE FILE'));
  fragment.append(actions, paging);
  view.case.replaceChildren(fragment);
}

function select(id) {
  const record = recordById.get(id);
  if (!record) return;
  selected = record;
  renderCase();
  view.case.scrollTop = 0;
  const activeResult = view.resultButtons.get(id) || null;
  if (view.activeResult !== activeResult) {
    view.activeResult?.setAttribute('aria-current', 'false');
    activeResult?.setAttribute('aria-current', 'true');
    view.activeResult = activeResult;
  }
  view.dialog.classList.add('has-selected-case');
  if (matchMedia('(max-width: 1100px)').matches) {
    view.layout.scrollTop = 0;
    view.case.focus({ preventScroll: true });
  }
  emit('globe-location-select', { id: record.id, lat: record.lat, lon: record.lon });
}

function step(direction) {
  if (!filtered.length) return;
  const index = filtered.findIndex(record => record.id === selected?.id);
  const next = index < 0 ? (direction > 0 ? 0 : filtered.length - 1) : (index + direction + filtered.length) % filtered.length;
  select(filtered[next].id);
  view.list.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
}

export async function openHorrorLocations(detail = {}) {
  const currentRequest = ++requestNumber;
  buildView();
  if (!view.dialog.open) {
    returnFocus = document.activeElement;
    if (!source) view.case.replaceChildren(element('p', 'horror-locations-empty', 'OPENING THE LOCATIONS ARCHIVE…'));
    view.dialog.show();
    archiveVisibility(true);
    emit('horror-globe-visibility', { open: true });
  }
  try {
    source = await (dataPromise ||= loadData());
    if (currentRequest !== requestNumber || !view.dialog.open) return;
    indexRecords();
    const candidate = typeof detail === 'string' ? detail : detail?.id;
    const requestedId = recordById.has(candidate) ? candidate : null;
    if (requestedId) {
      status = 'all';
      query = '';
      view.input.value = '';
      view.filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.status === 'all')));
      emit('globe-filter', { status: 'all' });
    }
    renderResults();
    if (requestedId) select(requestedId);
    else {
      renderCase();
      view.dialog.classList.toggle('has-selected-case', !!selected);
    }
    if (!matchMedia('(max-width: 700px)').matches) view.input.focus({ preventScroll: true });
    else if (!requestedId) view.dialog.querySelector('.horror-locations-close').focus({ preventScroll: true });
  } catch (error) {
    dataPromise = null;
    if (currentRequest !== requestNumber || !view.dialog.open) return;
    const message = element('div', 'horror-locations-empty');
    message.append(element('p', '', 'THE LOCATIONS ARCHIVE COULD NOT LOAD. PLEASE TRY AGAIN.'));
    const retry = element('button', 'horror-locations-action', 'RETRY LOADING');
    retry.type = 'button';
    retry.addEventListener('click', () => { void openHorrorLocations(detail); });
    message.append(retry);
    view.case.replaceChildren(message);
    console.error('Locations archive could not load.', error);
  }
}

window.addEventListener('horror-globe-open', event => { void openHorrorLocations(event.detail); });
