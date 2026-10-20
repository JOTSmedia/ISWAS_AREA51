# ISWAS v17.14

Preserves v17.13 and its 5.5-second tour, Locations progression and Stars arrival fixes.

## Changes

- Static Open Graph and Twitter metadata on all seven route entry pages point to one 1200×630 JPEG for link previews in text messages. The actual gallery capture includes the site logo, stocked bookshelves, Morgan, Black Lodge furnishings and Frank in the mirror. It is a still image, not an animation or new visitor flow.
- Production HTTP entry URLs upgrade to HTTPS, HTTPS pages upgrade insecure resource requests, and the referrer policy remains compatible with embedded YouTube. Local HTTP preview remains supported.
- Interrupted 360 drags release on pointer cancellation, capture loss, blur, page hiding and returning to reading mode, preventing a stale gesture from swallowing subsequent touch scrolling.
- GitHub Pages Enforce HTTPS was enabled after certificate provisioning completed. Normal TLS validation and the live HTTP→HTTPS redirect pass.

## Verification

All 36 tools/test*.mjs checks passed. Release validation passed: 38 HTML/JS/CSS files, 301 local references, 63 JavaScript syntax checks, 100 movie covers and 200 location records.

Chrome rendered the complete share scene. Phone-sized Chrome at 390×844 passed reading scroll, hamburger navigation to Locations, archive search and popup close. Landscape 844×390 had no horizontal overflow. The in-app browser at 320×568 passed reading scroll and had no horizontal overflow while its WebGL service was unavailable; its poster/content fallback remained usable. Actual production drag callbacks were tested for interrupted gestures. This is representative browser/layout validation, not a claim of testing every physical device or a measured frame-rate benchmark.

## Shipping

Use the sibling ISWAS_v17.17-release.zip. Extract its contents into the GitHub Pages publishing root, including CNAME and .nojekyll. No build is required. The package has not been uploaded or deployed by this task. See CUSTOM-DOMAIN-SETUP.md for the verified domain state and the post-deployment image check.
