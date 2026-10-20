# ISWAS v16.4

Continues in a new folder from completed v16.3; no earlier version was changed or published.

- All descriptive body paragraphs are justified, including mobile, Morgan, book and location dialogs. Final lines retain natural alignment and automatic hyphenation limits large gaps.
- Morgan is a two-sided photographic cutout with five shallow silhouette layers and slight relief. Front and back use the same existing likeness; invented anatomy and rear clothing surfaces are removed. All layers share one draw call, 1,170 vertices and 1,920 triangles, versus six draws and 37,350 triangles previously.
- Home rotation holds the front for 13.5 seconds, then completes a smooth 1.5-second turn. Reduced-motion preferences retain the still portrait. Existing flights, shelf placement, dialog and control placements are retained.
- Globe self-illumination pulses between 0.6 and 1.7 over roughly four seconds, with a stronger internal light. Reduced motion uses steady illumination.
- Location pins use turquoise (visit), amber (outside only), and violet (gone). Hover shows movie and place, follows the pin on screen, and pauses idle globe rotation. Labels dismiss on leaving the pin, dragging, opening a dialog or leaving 360 mode. Touch continues to use the archive interface.
- The locations close control is a centered SVG cross inside a 44px circular button; browser measurements confirm zero horizontal/vertical center offset.
- Narration remains removed; YouTube is manual-play only. Camera clearance, responsive navigation and lazy loading from v16.3 are preserved.

## Validation

Run `python3 ISWAS_v16.4/tools/package_release.py --check` and the eight `tools/test-*.mjs` suites. Model tests cover shared geometry and rendering/disposal; motion checks cover the 90% front hold. Scene tests cover pin labels, dismissals and pulse range in addition to prior data/interaction coverage. Browser review confirms the colored pins, hover labels, popup icon alignment and front-facing portrait. Performance numbers above describe geometry, not a measured device frame rate.

## Provenance

No image was generated, replaced or upscaled in this revision. Morgan reuses the existing transparent 1024×1536 likeness (512×768 mobile). His depth is shallow layered geometry, not a scanned or fully modeled person. See prior asset provenance for source details.
