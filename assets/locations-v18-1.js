import './locations-layout-v18-1.js';
import { g as jsxRuntime } from './index-v18-1.js';
import { t as Dossier } from './dossier-DjjHUuDC-v18-1.js';

const jsx = jsxRuntime();

function Locations() {
  return jsx.jsxs(Dossier, {
    index: '04',
    kicker: 'Locations',
    title: 'Locations',
    lede: 'Every nightmare begins somewhere.',
    className: 'locations-page',
    children: [
      jsx.jsx('p', {
        className: 'max-w-prose text-base leading-relaxed text-pretty text-fg',
        children: 'Explore the places connected to the films in the collection. Turn the world, choose a marker, and discover its story.'
      }),
      jsx.jsxs('div', {
        className: 'locations-actions',
        children: [
          jsx.jsxs('button', {
            type: 'button',
            className: 'locations-open-globe',
            onClick: () => window.dispatchEvent(new Event('horror-globe-open')),
            children: [
              jsx.jsx('span', { children: 'EXPLORE THE HORROR GLOBE' }),
              jsx.jsx('span', { 'aria-hidden': true, children: '↗' })
            ]
          }),
          jsx.jsx('button', {
            type: 'button',
            className: 'locations-open-globe locations-view-room',
            disabled: !!window.__lodgeUnavailable,
            onClick: () => window.dispatchEvent(new Event('horror-globe-visit')),
            children: 'VIEW IN 360'
          })
        ]
      }),
      jsx.jsx('p', {
        className: 'locations-instructions',
        children: 'Drag to turn the globe. Use the zoom controls to separate nearby pins, then select a marker to explore a location. Reset returns to the starting view.'
      })
    ]
  });
}

export { Locations as component };
