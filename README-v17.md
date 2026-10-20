# v17 — v16.6 restored, with the green glowing globe

Created directly from v16.6. Morgan, the sequential loader, original pin styling, Black Lodge, guide behavior and rendering optimizations are preserved. Later THE ARM assets and changes are not included. Only assets/black-lodge-scene-v17-1.js differs among runtime files from v16.6.

Globe changes:
- Existing map land is tinted green in both surface and emissive shading, preserving blue oceans and map detail. No new textures or draw calls.
- Original glow/pulse preserved: emission 0.6–1.7, coupled to the inner point light; steady glow with reduced motion.
- Idle spin increased from 0.055 to 0.075 radians/second (about 36%). Time-based rotation maintains speed across refresh rates, with a bounded step after stalls.
- Selection easing is exponential and time-based, with bounded catch-up. Hover, drag, dialog, distance, reduced-motion and hidden-tab behavior remain.

Validation:
- Ten automated suites passed, including actual globe callbacks for both desktop/mobile geometry tiers at 30/60/120fps and pause/pulse behavior.
- Local browser checked at 1280×800 and 390×844; green globe, Morgan, mobile drag and collapsible controls verified. No horizontal overflow; no console errors returned during these checks.
- Screenshots saved in tools/qa-proof/. Browser viewport testing does not certify performance on every physical phone/GPU. No universal FPS claim is made.
- Release syntax and local asset references validated before ZIP creation.

Preview: http://localhost:8106/ISWAS_v17/locations/
Earlier completed folders preserved. No deployment performed.
