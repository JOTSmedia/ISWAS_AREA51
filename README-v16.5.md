# v16.5 — rendering and startup performance

Based on v16.4; earlier versions preserved. No visual assets replaced.

- Removed the desktop full-screen bloom composer and its render targets; globe emissive pulse and local light remain.
- Mirror renders only when its projected position is visible, at most 15 updates/second, with a quarter of the previous desktop reflection pixels. Main camera movement continues every frame.
- Desktop pixel ratio starts at up to 1.35 (previously 1.75) with a 2.2-million-pixel initial budget. Sustained slow frames reduce pixel ratio gradually to a floor of 0.75; sustained fast frames restore it within the budget.
- Shadow maps refresh as the camera crosses a 0.65-unit travel threshold instead of re-rendering the entire shadow scene each frame. Initial scene shadow rendering remains enabled.
- Texture anisotropy for dynamically loaded artwork capped at 4 instead of 16.
- Loading indicator includes compositor-driven activity; completion waits for a rendered gallery frame and loaded wall textures. Full completion remains visible for 360ms followed by a 240ms fade. A 12-second fallback prevents indefinite blocking when optional assets fail.
- No narration or autoplay audio added.

Validation: eight existing Node suites passed; static release validation passed (56 script syntax checks, 259 local references, 100 covers, 200 locations). Browser preview was blocked by the browser security gate this session. No measured FPS or end-to-end network improvement is claimed; real-device visual/performance verification is still required.

Preview: http://localhost:8106/ISWAS_v16.5/
