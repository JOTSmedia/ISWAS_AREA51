# ISWAS v17.7 — closer globe and visitor zoom

Created from v17.6 in a separate folder. Earlier completed versions remain intact.

The globe starts closer in Locations and its focused 360 view. Shared zoom controls let visitors zoom in, zoom out, drag a slider, or reset the view. The selected zoom is preserved when switching between those views during the visit. Optical framing keeps the camera outside the globe and table.

Pin centers spread apart as the view enlarges, while the visible dots retain approximately the same screen size. Enlarged mouse/touch selection targets remain available. The illuminated blue ocean, satellite land detail, pulse, rotation, and location case files are retained.

The controls share the globe's existing rendering loop. No additional renderer, texture download, or full per-frame pin-matrix rebuild is introduced. Narrow phones retain an independently scrollable case panel below the globe.

The default zoom is 118% of the previous framing. Visitors can adjust between 80% and 240%; deeper zoom intentionally crops the globe's edges so nearby locations can be inspected. Rotation exposes other regions. The mobile globe area is also larger where screen height allows. Reduced-motion users receive immediate zoom changes; other visitors receive smoothly eased changes.

Verification: all 30 focused test files pass. Coverage includes shared zoom state, bounds, keyboard-accessible controls, camera clearance, smooth transitions at 30/60/120 fps, reduced motion, constant-size pin dots, unchanged 28px mouse/44px touch targets, popup persistence, and existing gallery behavior. Browser checks covered desktop, 390px and 320px phone layouts, Locations and 360 modes, slider keyboard input, button limits, and selecting a location pin after zooming. Static route text was synchronized with the runtime copy to avoid a hydration mismatch. Physical devices and every browser/GPU combination are not covered.

Preview: http://localhost:8106/ISWAS_v17.11/locations/

For GitHub Pages, unzip `ISWAS_v17.11-release.zip` and upload its contents to the repository root, including `.nojekyll`. Do not nest the version folder inside the repository. No deployment is performed automatically.
