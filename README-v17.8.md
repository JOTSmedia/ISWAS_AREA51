# ISWAS v17.8 — Morgan’s chest path and the mirror poster

Created in a new folder from v17.7. Prior version folders are preserved.

Morgan’s message bubble now connects to his chest through a translucent liquid path inspired by the user’s supplied Donnie Darko reference. The bubble stays at the other end of the path. World and portrait positions use the same measured sternum point, including rotation, movement and resizing. The text remains clear of Morgan and the page content; looking away, flying between positions, closing the bubble or its existing timeout hides the connector with the bubble. The opening welcome retains eight seconds and other tips retain three seconds.

The supplied Donnie Darko rabbit poster appears inside the existing gold mirror frame. Its complete image is centered in the black oval without stretching or cropping. The existing frame, location, plaque and light are retained.

The connector is a static transparent 512 × 256 WebP (18,298 bytes) exported from a 1774 × 887 image generated with the built-in image generation tool. Its source, prompt and reference are preserved under `tools/wormhole-source/`; runtime provenance is `characters/morgan/wormhole-PROVENANCE.json`. The poster retains the supplied 220 × 330 resolution, delivered as an 18,498-byte WebP; its original and provenance are also preserved. No 4K source resolution is claimed for these assets.

The two runtime images total 36,796 bytes. The connector adds no renderer or effect animation. Replacing the live mirror reflection removes its secondary scene-render pass. Existing globe illumination, rotation, zoom controls, library, tour and loading behavior are preserved.

Verification: all 31 focused test files pass, including chest projection, connector endpoint transforms, bubble lifecycle, mirror layout and existing globe/startup behavior. Packaging validation checks 61 scripts, 297 local asset references, 100 book covers and 200 filming locations. Browser previews checked desktop and 390px/320px phone layouts; the opening bubble close button was exercised. No browser errors were reported in the preview tab. This does not cover every physical device or GPU.

Local preview: http://localhost:8106/ISWAS_v17.13/

For GitHub Pages, extract `ISWAS_v17.13-release.zip` and upload its contents to the repository root, preserving relative paths and `.nojekyll`. Open through HTTP(S), not directly as a file. No deployment is performed by packaging.
