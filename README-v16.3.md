# ISWAS v16.3

This iteration continues from v16.2 in its own folder. Earlier version folders are preserved. The site is a static, self-contained web application; no publishing or deployment is performed by saving or packaging it.

## Changes

- Rebuilt the library seating area around the supplied Black Lodge reference: red folded curtains, dark upholstered chairs with curved walnut trim, a small table between the chairs, and a floor lamp outside each chair. The ivory chevron floor uses deep scarlet stripes, darker than the curtains.
- Replaced the central circular table with a large, interactive horror globe table. Matching wood-trimmed sofas sit beyond the carpet to leave room around it.
- Refined lighting, fabric bump strength, wood/metal roughness, and contact shadows to reduce the uniform glossy appearance and ground the furniture in the room.
- Stocked the perimeter shelving and display ledges with dimensional decorative books. These volumes have no hover, click, or raycast behavior; movie interactions remain confined to the library collection.
- Added LOCATIONS immediately after STARS, including the section camera stop, previous/next links, a globe archive, search, status filters, film case files, map links, and selectable 3D markers. The globe rotates by dragging; marker selection uses stable film IDs when filters change.
- Camera travel rises smoothly over the globe and its table so forward, reverse, depth, diagonal, and tour movement do not pass through them. The globe has a brighter blue internal glow, with gentle variation and hover emphasis; reduced-motion preferences disable the variation.
- Integrated the supplied `horror-globe.html` content into the existing gallery renderer. Its original file remains in the source folder; it is not shipped as a second application.
- Applied the supplied Overview and Need replacement copy to the application and static route snapshots.
- Rebuilt all seven static section snapshots from the current presentation components, including all 13 Stars cards, portrait/text wrappers, the Comparison styling, and the shared logo/loader markup, so initial HTML matches the mounted presentation.
- Reduced the 360 control dial and separated LOOK from MOVE, with explicit direction labels, reset, and a HIDE/SHOW control. The mobile dial is 120px; the desktop dial is 152px. Morgan briefly introduces the controls, then returns to the appropriate location.
- Kept the main navigation on one row on wider screens and replaced it with a compact hamburger menu at widths of 1050px or less. The expanded menu scrolls within the available viewport.
- Clicking LIBRARY opens its search window while the gallery camera moves toward the bookshelf.
- Morgan's speech bubbles have a close button, a short pointer anchored at his mouth, and a three-second maximum lifetime including fade. They require a visible, current avatar anchor and dismiss when the avatar is no longer visible. Closing a bubble does not restart it during the same visit.
- Morgan's location and flight handling use the actual current camera and avatar projection. Hidden avatars do not intercept clicks. The opening camera remains the Overview camera, with Morgan beside the bookshelf rather than over the hero.
- Adjusted the shared opening/Overview camera distance to keep Morgan in view, widened Overview to a 56-degree field of view for landscape aspect ratios from 1 to 1.65, and moved the right library lamp clear of the mirror. On mobile, Morgan's popup copy spans the container width, and opening the library does not automatically summon the keyboard.
- Morgan now has modeled body, face, garment, hand, and shoe surfaces, with the existing likeness texture projected onto the front and separate material surfaces around the sides and back. The same model appears beside the shelf and in the guide's small avatar; it slowly rotates at home base, with rotation disabled for reduced-motion preferences. The prior portrait remains the fallback if the small 3D renderer is unavailable.
- Removed Morgan's read-aloud button, automatic narration, and speech-synthesis module. Guidance remains available as text in his temporary bubbles and popup.
- Startup mounts the guide once after the main application is ready. Failed gallery startup shows a readable static fallback and disables unavailable 360 controls rather than retrying indefinitely.
- The opening loader reveals the presentation when the gallery reports readiness, removing about 2.1 seconds of fixed animation holds. A bounded readiness timeout prevents a stalled loading screen.

## Loading and mobile handling

The globe shares the site's existing Three renderer, lighting, and interaction system. It does not add D3, TopoJSON, OrbitControls, a remote font dependency, or a second renderer. Location data, case-file UI, and the detailed map load when needed. The 200 globe markers use one instanced mesh.

Removed eager requests for two unused textures: `textures/v56/plaster.webp` (497,420 bytes) and `textures/v56/rug.webp` (779,444 bytes), reducing cold-start requested assets by 1,276,864 bytes (about 1.22 MiB). This total comes from their file sizes, not a measured download-time improvement. The gallery film player also waits until its screen is visible before assigning its external URL. Offscreen or hidden-tab screen projection/render work is skipped, projection vectors are reused, and unchanged dimensions do not trigger repeated layout resizing.

Removing the narration module, narration controls, and unused Three audio code reduced these runtime sources by a net 11,232 bytes. Stationary Morgan portraits are cached rather than redrawn each frame; moving, resizing, flying, and home rotation still refresh the model. The embedded film waits for its own Play control and has no autoplay request or permission.

Perimeter books use one shared 256px cloth texture and eight instanced draw calls for about 12,000 desktop volumes. Mobile uses wider volumes and simpler spine details, reducing the count to about 10,000 books and the total book geometry from approximately 386,000 to 262,000 triangles before frustum culling. Instance transforms/colors take roughly 1.4 MiB on mobile. The library's interactive collection remains separate.

The small Morgan avatar reuses the same Three classes and merged character geometry: six draw calls, 20,204 vertices, and 37,350 triangles. The model includes shaped facial relief, garment depth, coat seams/vent/hem, and layered hair, plus two local 256px procedural grain maps. It uses one separate transparent rendering context, reused for the active home, control, dialog, or flying avatar, with a maximum drawing buffer of 320 × 480 pixels. It does not download another Three library. The model's likeness texture uses the existing 512 × 768 variant on mobile/data-saving connections and the 1024 × 1536 variant on desktop. The buffer size stays stable while CSS scales the flying avatar. This adds some GPU work beyond the room renderer; output dimensions are bounded rather than rendering a full-screen second scene.

The new lodge materials use 4096px maps on larger screens and 1024px maps on mobile or a data-saving connection. The globe uses a 4096 × 2048 map on desktop and 1024 × 512 on mobile. The archive preview also uses the 1024px map; a 2048 × 1024 intermediate export remains available in the package. Mobile geometry and texture filtering are reduced. The mobile 360 starting view remains wider than desktop. Search/result areas scroll within bounded dialogs.

The complete runtime payload is approximately 20.3 MiB before archive compression. This is the full set of routes, maps, portraits, and 100 book covers, not a measurement of the initial page transfer. Package size and automated checks do not establish real-device load time, frame rate, or mobile memory use. Those depend on hardware, browser, connection, and hosting configuration; no physical-device performance benchmark is claimed.

## Image and data provenance

- `textures/black-lodge/PROVENANCE.json`: the new chevron, upholstery, and velvet maps were generated procedurally at native 4096 × 4096, then exported to WebP at 4096 and 1024. They are surface textures used by real-time 3D materials, not photographic scans. The scene is rendered at a device-adaptive resolution; a fixed 4K framebuffer is not forced on phones.
- `textures/globe-PROVENANCE.json`: the supplied globe's credited Natural Earth vector geography was rasterized locally to the three map resolutions. “4096” describes the map export resolution, not satellite photography. The source file SHA-256 and extraction details are recorded there.
- The 200 film/location records and visiting-status descriptions are supplied content. They have not been independently fact-checked or verified as current travel information. All original poster fields were blank. Fifty-two exact title-and-year matches reuse existing local book covers; remaining entries use film title cards rather than mismatched posters.
- `characters/morgan/PROVENANCE.md`: Morgan uses the user's likeness reference and a generated 1024 × 1536 transparent source, with a 512 × 768 delivery variant. In v16.3 that likeness is mapped onto modeled volumes with separate side/back materials. The current model is procedural geometry, not a scanned character or a skeletal animation rig. The image dimensions have not been reclassified as native 4K.
- `textures/v9/PROVENANCE.json`: the inherited walnut source is 1254 × 1254. Its 4096 export is an upscale and does not contain native 4K source detail. Earlier provenance, source images, and cover-source records remain in this workspace.

## Validation and packaging

Run the checks from the workspace root:

```sh
python3 ISWAS_v16.3/tools/package_release.py --check
node ISWAS_v16.3/tools/test-bubble-lifetime.mjs
node ISWAS_v16.3/tools/test-morgan-bubbles.mjs
node ISWAS_v16.3/tools/test-black-lodge-scene.mjs
node ISWAS_v16.3/tools/test-decorative-books.mjs
node ISWAS_v16.3/tools/test-morgan-model.mjs
node ISWAS_v16.3/tools/test-camera-clearance.mjs
node ISWAS_v16.3/tools/test-gallery-screen.mjs
node ISWAS_v16.3/tools/test-quiet-guide.mjs
```

The checks cover local references, JavaScript syntax, all 100 movie covers, 200 unique location records with valid coordinates/status values, the six dynamically selected lodge maps, and the three globe map sizes. The eight behavior suites cover bubble lifetime/close/visibility and flight handoff, short mouth pointers and mobile fit, globe coordinate alignment, stable pin identity, interrupted-pointer cleanup, multitouch exclusion, texture-readiness deadlines, and unmount cleanup. Decorative-book checks verify deterministic placement, all 57 stocked rows and three display ledges, shelf bounds, bust and mirror clearance, and reduced mobile density. Model checks execute the character builder and verify finite geometry, valid indices, volume/grounding, shared resources, procedural textures, mobile texture selection, one reusable avatar renderer, and a stable GPU buffer during flight scaling. Camera-clearance checks exercise both directions and diagonal/depth travel over the globe/table, including smooth clearance boundaries. Gallery-screen checks exercise deferred player loading, visibility/back-face/hidden-tab culling, vector reuse, resize caching, and cleanup. Quiet-guide checks scan runtime modules for narration, microphone, Web Audio, and autoplay paths and verify static-portrait caching without interrupting flight updates. Browser visual testing remains necessary because these tests do not simulate GPU rendering or the entire page layout.

Browser checks confirmed fresh Overview startup without application console errors, the compact menu at 320px (opening, keyboard focus, Escape, closing after section selection, and no horizontal overflow), all seven desktop links on one row at 1051px, the brighter globe, and Morgan's popup without a read-aloud control. Mobile dossier paragraphs use left alignment to avoid justified word gaps. These are browser viewport checks, not physical-device performance benchmarks.

Create a runtime-only release archive only after final visual review:

```sh
python3 ISWAS_v16.3/tools/package_release.py --output ISWAS_v16.3-release.zip
```

The archive has deployable files at its root, a SHA-256 manifest, and shipping instructions. It excludes Git data, local preview/test tools, authoring history, source/provenance images, and replaced image originals. Existing license/notice files, if present, are retained. Extract it to an HTTP(S) static server while preserving relative paths; both domain-root and version-subfolder hosting are supported. Direct `file://` loading is unsupported.

The final local package passed all eight behavior suites and the package validator: 30 HTML/JavaScript/CSS files, 258 local references, and 55 JavaScript syntax checks. The archive contains 212 runtime files plus its manifest and shipping notes, totaling 19,804,555 bytes (18.89 MiB). ZIP CRC, safe unique extraction paths, all manifest sizes/hashes, byte-for-byte comparison against current runtime sources (including the final mobile paragraph alignment), and references after extraction passed. The camera-clearance helper is included and the narration module is absent. Archive SHA-256: `746a58db08f573a60ce2ad895c190f51af295e839b515d6a674e84b016b467ad`.
