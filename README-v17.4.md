# ISWAS v17.4 — Vincent Price and visitor-controlled touring

Created from v17.3 in a separate folder. Earlier versions are preserved.

- Vincent Price’s supplied portrait is framed between George A. Romero and Moustapha Akkad. Clicking it opens his portrait, a short biography, and an official biography source link.
- The supplied “Vincent Price Laugh.mp3” plays through native audio controls in that popup. It has no video image, autoplay, or YouTube dependency. `preload="none"` avoids downloading the 508 KiB MP3 before playback. Closing the popup explicitly pauses and unloads the player.
- Morgan’s opening greeting has eight seconds of reading time, within Overview’s automatic stop rather than as an additional delay. Its timer waits for the visible avatar; small camera jitter does not permanently cancel it. Speech stays attached to the avatar, retains the close control, and ends when its owner leaves view or the section changes.
- On narrow phones, an offscreen library avatar uses a compact welcome space above Overview. The space stays for that Overview visit, so the eight-second greeting does not cause the text to jump. Morgan then flies to his footer homebase.
- Every automatic stop holds for nine seconds after the camera arrives. Scrolling, swiping, and other manual navigation pause automatic touring until the visitor explicitly chooses Resume tour.
- Scrolling beyond a section boundary enters the adjacent section at its top. Further input scrolls the new content normally. A continuous inertial wheel gesture cannot skip several sections.
- Popup scrolling and Locations’ independent archive scrolling remain isolated from section navigation.
- The globe is framed closer in Locations and its 360 focus view. The phone globe area is larger while retaining a usable case panel. Rotation pauses while aiming over the globe, and pin selection remains open after release. Invisible pin targets are 28px across for a mouse and 44px for touch; visible pin dots are unchanged. Picking rejects occluded backside pins, and adds no continuous per-frame pin loop.
- New runtime asset filenames keep v17.4 distinct from older cached releases. The existing gallery renderer, optimized textures, startup poster, loader, and globe effects are retained.

The portrait was supplied at 362 × 450 pixels and converted to a 27 KiB WebP without resizing or generated detail. The 21.7-second MP3 is copied unchanged. Provenance is in `plates/vincent-price-provenance.json`; the original photo is retained under `tools/` and omitted from the deployment ZIP.

## Preview and upload

Preview: http://localhost:8106/ISWAS_v17.10/

Unzip `ISWAS_v17.10-release.zip` and upload its contents to the repository root, including `.nojekyll`. Do not nest the version folder inside the repository. No deployment is performed automatically.

## Verification

All 27 focused test files pass. Focused checks cover scene rendering and fallback, loader progression, tour timing, deliberate boundary navigation, permanent user-input pause, mobile layouts, popup interactions, native audio teardown, asset references, and JavaScript syntax. Browser checks use desktop and phone-sized in-app previews. Physical mobile devices and every hardware/browser combination are not covered.
