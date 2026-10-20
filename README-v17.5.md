# ISWAS v17.5 — NASA satellite globe and Instagram

Created from the completed v17.4 in a separate folder. Earlier versions are preserved.

- Instagram now links to https://www.instagram.com/itstartedwithascream/ in the live footer and all seven route snapshots.
- The globe uses NASA Earth Observatory's Blue Marble: Next Generation satellite composite, with natural vegetation, desert, coastline, and ice detail. The artificial green land tint has been removed.
- The source is a genuine 5400 × 2700 NASA JPEG. Direct downsampled WebP exports are 4096 × 2048 (611,840 bytes), 2048 × 1024 (162,586 bytes), and 1024 × 512 (46,030 bytes). These are not upscales or AI-generated detail. Desktop uses the 4K map; the mobile scene uses the 46 KB map. The intermediate export is retained for existing tier support.
- Textures are hosted with the site and loaded only when the globe is approached or requested. There is no API key, live imagery service, or recurring imagery fee.
- Natural terrain colors remain visible through a neutral pulsing surface glow. The inner light continues to pulse, and rotation retains its time-based 0.075 radians/second speed, reduced-motion support, and pause while aiming at the globe.
- Existing location pins, geographic alignment, enlarged invisible click targets, case files, desktop side-by-side layout, and stacked phone layout are preserved. No additional renderer, geometry, postprocessing, or continuous animation loop was added.
- The archive credits NASA Earth Observatory separately from the supplied film-location notes. Original imagery and full provenance are retained under `tools/earth-source/` and `textures/globe-PROVENANCE.json`.

NASA source: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/

## Preview and upload

Preview: http://localhost:8106/ISWAS_v17.9/locations/

Unzip `ISWAS_v17.9-release.zip` and upload its contents to the repository root, including `.nojekyll`. Do not nest the version folder inside the repository. Authoring sources and test tools are omitted from the upload ZIP. No deployment is performed automatically.

## Verification

All 27 focused test files pass. Checks cover globe material and light pulses, rotation at 30/60/120 fps, pin selection and occlusion, resource cleanup, startup, loader, tour navigation, responsive layout logic, and existing gallery features. The release checker validates JavaScript syntax and local asset references.

Browser review covered 1280 × 720 desktop, 390 × 844 phone, and 320 × 620 narrow phone viewports, including a globe-pin case-file selection. No browser errors were recorded during this review. Physical mobile devices and every browser/GPU combination are not covered.
