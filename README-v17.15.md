# ISWAS v17.15

Preserves the completed v17.14 folder. This is a local release package, not a deployment.

## Room additions

- A custom Steinway-style grand piano sits diagonally in the rear/east corner across from Moustapha Akkad. Its bench places the seated player’s back toward the corner. It has 88 modeled keys, an open lid, cast frame, strings, pedals, casters, a music desk and a bench. The local PIANO preview always uses the keyboard-facing angle.
- Wine racks, a bar with three stools, and a cigar lounge occupy the rear wall. Their walnut, stone, brass, leather and glass surfaces use physically based materials. Existing Black Lodge lamp geometry is reused.
- Three peripheral oriental rugs now follow their furniture groups with clear circulation space. The approved globe rug retains its exact position, rotation, size and texture.
- A gramophone and 100 selectable soundtrack sleeves occupy the rear-left corner opposite the Black Lodge/library. A selected record travels to the platter, spins at 33⅓ rpm during YouTube playback, and returns when the popup closes. The tonearm and horn respond to playback. Reduced motion disables continuous spinning.
- These are objects in the existing room. No navigation sections or feature tabs were added. The local furnishings preview has no navigation toolbar.

## Catalogs and playback

The record catalog follows all 100 ranked titles, composers and years from the user-specified RYM rendition of FACT’s list. Rank 57 is explicitly identified as Coil’s unused Hellraiser score. Sleeve artwork is original code-authored archival artwork, not commercial album-cover scans. Source metadata and the original FACT playlist metadata are preserved in tools/.

The record popup includes search, Previous/Next record controls, Play/Pause, a visible YouTube player, an external YouTube link, and an optional replacement YouTube URL. The YouTube API is requested only after a record is selected; media is not downloaded or bundled. Closing the popup destroys the player and ends playback. YouTube may restrict particular uploads by region or availability; the popup provides retry, external playback and replacement-link options.

Library search now has 12-result pages with Previous/Next. Open movie books also have Previous/Next controls, correct covers and a reset to the top when changing titles. Outside click/scroll dismissal remains supported.

## Quality and performance

Native 4096×4096 authored walnut, stone and leather detail maps have 2048 and 1024 WebP delivery tiers. The 4096×4096 sleeve atlas contains all 100 original designs; individual sleeves are atlas tiles, not individual 4K images. Full provenance and generation scripts are included in the source folder. Models are original code-authored meshes, not manufacturer CAD or photogrammetry. Browser output resolution adapts to device capabilities; this is not a claim of a fixed 4K canvas on phones.

The static hospitality meshes are batched into 22 material draws (106,268 triangles on desktop) and mount after the gallery’s first frame. The records share one atlas and one instanced mesh. Only the selected record animates; hidden tabs skip its animation work. Existing adaptive rendering and texture tiers are retained, with no additional WebGL renderer or model-loading framework.

The floating black rectangle in the furnishings preview was the unrelated CSS video layer using the tour camera while the authoring view used a different angle. The authoring preview now suppresses that layer; normal gallery video behavior remains intact.

## Verification

- All 38 tools/test-*.mjs checks passed, including the new furniture layout/material provenance and complete record catalog/flight/URL validation tests.
- Chrome rendered the new piano, cabinets, lounge and gramophone in the actual gallery scene. Its selected soundtrack reached the YouTube `NOW PLAYING` state. Record search, both catalog boundaries, Previous/Next, and player cleanup were verified.
- Chrome at 390×844 and 320×720 verified record popup sizing without horizontal overflow, a tap on the 3D gramophone, Previous/Next and outside-scroll dismissal. At 320 pixels, library search pagination, movie covers and open-book Previous/Next also worked.
- The release validator checks local dependencies, JavaScript syntax, all 100 movie covers and 200 location records. Representative desktop and phone-sized browser checks do not establish behavior on every physical device or a measured frame-rate guarantee.

## Shipping

Use the sibling `ISWAS_v17.15-release.zip`. Extract its contents into the GitHub Pages publishing root, including `CNAME` and `.nojekyll`. No build is needed. The approved text-message share card and HTTPS configuration are inherited from v17.14. The source-only tools and review screens are excluded from the upload ZIP. No files have been uploaded to GitHub by this task.
