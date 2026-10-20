# ISWAS v17.3 — Locations and globe together

Created from v17.2 in a separate folder.

- Desktop: the Locations introduction or archive stays at the left, with the live globe framed at the right.
- Mobile: the globe remains above a separately scrolling archive/case file. A compact ALL FILMS control returns to search without hiding the globe.
- The archive is nonmodal; dragging the globe does not dismiss the case file. Clicking outside both regions or pressing Escape closes the archive.
- Selecting a film rotates its pin toward the viewer. CENTER ON GLOBE keeps the case open.
- The existing gallery renderer is reused. No second WebGL canvas, duplicate scene, or additional image download was added.
- Camera framing is derived from available screen space while keeping the camera inside the gallery walls. Leaving Locations restores normal framing.
- Section-scrolling navigation is suppressed while reading Locations or any native dialog, so a wheel gesture cannot unexpectedly change sections.
- Fresh v17.3 runtime filenames prevent stale assets when uploading over an existing repository.

Validation: all 18 focused checks pass, including new camera bounds/projection and pointer/scroll isolation tests. Desktop 1440px and mobile 390px/320px layouts were visually checked in the in-app browser. Search, case selection, independent detail scrolling, globe dragging with the archive open, closing, and return to another section were checked. Package validation checks all references and JavaScript syntax. Real physical mobile browsers were not tested.

Preview: http://localhost:8106/ISWAS_v17.10/locations/

Unzip ISWAS_v17.10-release.zip and upload its CONTENTS to the GitHub repository root, including .nojekyll. Do not put the version folder inside the repository. Hosting is not changed automatically.

## Loading and smoothness pass — October 19

- The gallery module now downloads at low priority during the existing 1–100 loader; scene creation remains deferred to keep the loader responsive. The later import reuses the same URL and dependencies.
- The startup background includes the existing Morgan portrait beside the library, without waiting for WebGL. The same 40KB portrait is reused by the guide. The unavailable-scene overlay retains it too.
- Morgan projection uses the renderer’s cached dimensions rather than measuring the canvas every frame. Stationary globe tooltips skip unchanged layout and style work. The invisible curtain/veil skips transform work, and renderer diagnostics reuse their object.
- Loading-counter changes no longer rescan the page for logos. Locations only recalculates its layout for relevant changes and reuses its catalogue rows/search index when selecting pins.
- Runtime assets have fresh p1 filenames so an uploaded replacement does not reuse stale script/style URLs.

Validation: all 22 focused test files pass. In actual-callback harnesses, 120 Morgan frames avoid all 120 previous bounds reads; 120 stationary tooltip frames require no extra layout reads or writes; 100 loader text updates cause no new whole-page logo scans. These are operation-count checks, not claims of universal frame rates. Globe rotation and glow tests pass at 30/60/120fps on both geometry tiers. Desktop and narrow mobile browser checks cover scene loading, Locations selection/scrolling, and the Morgan fallback. Physical devices and production network speeds are not benchmarked.
