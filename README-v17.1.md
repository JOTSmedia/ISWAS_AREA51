# v17.1 — loading and performance fixes

Based on v17. Morgan, the green pulsing globe, faster rotation, lodge, library, navigation and sequential loading animation are preserved. Earlier versions remain unchanged.

## What changed

The old loader could finish after 12 seconds without a rendered gallery frame. The new loader hands off to a decoded 60 KB gallery image. Heavy 3D initialization begins afterward; the live canvas fades in only after a successful render. That image remains available when the graphics context fails.

Desktop repeating surfaces now use 2048px delivery textures instead of 4096px. Mobile retains its 1024px tier. Together with removing an unused leather texture, the affected cold downloads are about 2.90 MB smaller after accounting for the new poster. Estimated storage for the affected GPU textures falls from 512 to 128 MiB; this is an estimate, not a device measurement. Original high-resolution assets are preserved.

Rendering starts at pixel ratio 1, then adapts to performance. Slow frames, resizing, context loss and recovery are handled. Stationary library books avoid repeated material and transform updates; hover and opening behavior remain intact. All runtime JavaScript and CSS files have release-specific names to prevent cached v17 code mixing with this release.

## Verification

All 15 automated suites pass, covering readiness, sequential progress, context loss, frame-rate-independent globe motion, idle book updates, texture tiers, guide behavior and deployment paths. Release validation checks 275 local references and 57 scripts.

The local browser was checked for normal startup, live 3D, a 390×844 mobile view, and an actual blocked scene-module request. In that failure test the page retained its gallery background and usable content. No overflow or console errors appeared in the normal mobile check. Native Chrome inspection timed out; these results do not certify every physical device or browser build.

## Preview and upload

Preview: http://localhost:8106/ISWAS_v17.1/

Upload the CONTENTS of ISWAS_v17.1-release.zip to the GitHub Pages publishing root: index.html should be beside assets/, textures/, and the section folders. It works under the existing /ISWAS_v17/ repository path or a new /ISWAS_v17.1/ path. No deployment was performed by the agent.
