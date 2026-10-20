# ISWAS v17.9 — liquid mirror, glass bubbles and Earth globe

Created from v17.8 in a new folder. Earlier completed versions remain intact.

The mirror uses the new user-supplied Frank image with its upper-left watermark removed using the built-in image generation tool. The oval glass preserves the picture’s proportions and the rabbit’s ears, face and hand. Subtle liquid ripples radiate from the hand. Clicking the glass opens a Donnie Darko movie popup with the image, year, credits and an original synopsis. The dialog keeps the surrounding gallery visible, scrolls on phones, and supports its centered close button, Escape, outside click/scroll and keyboard focus containment. Opening it pauses the tour. A keyboard-only entry appears when focused in 360 mode.

Morgan’s bubbles now match his chest path: cool blue glass, pale text, a silver edge and a subtle glow. Their dimensions, chest anchoring, movement, close buttons and existing eight-second welcome / three-second tip timing remain unchanged. No backdrop blur or new animation loop was added.

All six floor lamps use the same Black Lodge torchiere design and share geometry/material resources. The two old fabric-shade lamps were replaced. Existing light settings are preserved. The right library lamp was moved slightly left to clear the mirror. Portrait picture lights and shrine candles remain distinct fixtures.

Both couches by the globe are 24% larger, with their original Black Lodge upholstery and trim. Each was moved 0.20 units farther from the carpet so the table retains clearance. Library chairs remain unchanged.

The globe gains NASA cloud bands and a blue atmospheric rim, with illuminated oceans, natural land detail and the existing pulse. Clouds drift slowly without moving the geographic pin coordinates. Rotation, drag, zoom and pin targeting are preserved. The effect shares the original sphere rendering pass and adds one cloud-map sample. Clouds load only when the globe is approached or opened: 373,172 bytes on desktop or 111,458 bytes on mobile/save-data connections. Missing cloud imagery leaves the satellite globe working. This is historical satellite imagery, not live weather. Cloud documentation: https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/

Image records: runtime `plates/donnie-darko-mirror.webp` is 800 × 1000 and 85,882 bytes. The edited source is 1122 × 1402; the user reference was 800 × 1000. Both are archived under `tools/mirror-source/`. The exact image-edit prompt is `tools/mirror-source/PROMPT-v17.9.md`; provenance is `plates/donnie-darko-mirror-provenance.json`. No native 4K detail is claimed for this artwork. NASA originals, cloud exports and source credits are separately documented under `textures/` and `tools/earth-source/`.

Movie credits were checked against the official studio and BFI pages:
- https://www.20thcenturystudios.com/movies/donnie-darko
- https://www.bfi.org.uk/film/4cdcb182-f077-5329-8da7-5c468ec50abf/donnie-darko

Local preview: http://localhost:8106/ISWAS_v17.11/

For GitHub Pages, extract `ISWAS_v17.11-release.zip` and upload its contents to the repository root, preserving relative paths and `.nojekyll`. Open via HTTP(S), not directly as a file. No deployment is performed by packaging.

Validation: all 33 regression files pass. Release checks cover 38 HTML/JS/CSS files, 301 local references, 63 script syntax checks, 100 covers and 200 locations. Browser checks at desktop 1280 × 720 and phone layouts 390 × 844 and 320 × 620 verified rendering, the mirror popup, internal scrolling and dismissal; globe zoom and direct pin selection also passed. No browser console errors appeared in the final preview. Phone checks use responsive browser viewports, not physical-device performance measurements.
