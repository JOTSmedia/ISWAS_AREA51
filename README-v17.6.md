# ISWAS v17.6 — continuously illuminated blue ocean

Created from v17.5 in a separate folder. Earlier completed versions remain intact.

The NASA base image contains very dark navy ocean pixels. The globe now lifts those dark, blue-dominant pixels into a visible ocean blue in its surface material and its emitted light. This correction follows the map through every rotation and keeps a nonzero illumination floor through the pulse, so the sea stays readable without a sun, moon, or additional scene light.

The original NASA textures are unchanged. Vegetation, deserts, and ice retain their satellite colors. The globe keeps its three-dimensional shading, pulse, rotation speed, location pins, and drag/selection behavior. No extra texture download, renderer, geometry, scene light, or animation loop is introduced. The mobile map remains 46,030 bytes; the desktop 4K map remains 611,840 bytes.

The material display treatment is documented separately from the source imagery in `textures/globe-PROVENANCE.json`. All v17.5 features, including the Instagram link, are retained.

Preview: http://localhost:8106/ISWAS_v17.13/locations/

For GitHub Pages, unzip `ISWAS_v17.13-release.zip` and upload its contents to the repository root, including `.nojekyll`. Do not nest the version folder inside the repository. No deployment is performed automatically.

Verification: all 28 focused test files pass, including shader compatibility, ocean illumination with no external lighting at the pulse minimum, land and ice color preservation, rotation, and pin interaction. Desktop and phone browser previews render the illuminated ocean without shader errors. The release checker validates syntax and local asset references. Physical mobile devices and every browser/GPU combination are not covered.
