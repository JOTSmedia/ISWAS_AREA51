# ISWAS v9

Local iteration based on jotsmedia/ISWAS_v8, commit 89f6b36. V8 remains unchanged. No deployment performed.

- Tour now holds each navigation section for 14 seconds and eases the background camera to the next stop over 2.4 seconds. Body content does not auto-scroll. Manual reading extends the hold; Morgan offers pause/resume.
- Larger sentence-case body copy. Titles retain the original styling.
- “Explore the gallery” is now “360 MODE”.
- Morgan: lightweight original procedural 3D ghost butler inspired by The Old Dark House, with bow tie, period jacket, ghost tail, and floating animation. Open MORGAN to summon him and get navigation instructions. Optional device speech reads guidance; no voice imitation. This is a stylized character, not a scanned actor likeness.
- Gallery: generated walnut material, 4096px desktop export, 1024px mobile delivery, grain relief, physical wood shading, plaster/floor relief, sharper desktop rendering, removed panel background blur. The generated source was 1254×1254: the 4096 export is upscaled, not native 4K image detail. The gallery is live 3D and resolution follows screen/device limits.
- Existing imagery converted to high-quality WebP: 23.0 MB source images → 11.4 MB delivery images. Originals are retained, and each asset’s native dimensions and sizes are in ASSET_PROVENANCE.json. Historical photos/art remain unchanged in content.
- Generated material provenance and prompt: textures/v9/PROVENANCE.json. Built-in image generation used.

Preview: serve this folder over HTTP (e.g. http://localhost:8099/). It remains compatible with a GitHub Pages subdirectory.

Validation: JS syntax checks; local browser review. Mobile material selection is implemented; physical-device performance has not been measured. tools/upgrade.py records the initial migration and is not intended to be rerun on the migrated folder.

## Reading panels and library revision

- Near-opaque reading panels (94–97%) and 98% opaque guide/detail panels.
- Section stamps such as `02 — NEED` retain v8's small uppercase style.
- Movie covers are now included locally in books/ and mapped by stable rank IDs. All 100 shelf titles match data/variety.json exactly. Sources are recorded in books/SOURCES.json.
- Book hover adds a warm emissive highlight, 10% scale emphasis, and a small forward movement.
- Ladder parked beyond the selectable books; decorative ladder geometry does not intercept raycasts.
- 360 mode includes a searchable Library catalogue for keyboard and touch access to the same book dialogs.
- Cover proportions are preserved; book pages scroll on smaller screens. The close control remains visible.
- Browser checked: section navigation, automatic tour advance, 360 mode, catalogue, and The Exorcist opening with its actual cover.
