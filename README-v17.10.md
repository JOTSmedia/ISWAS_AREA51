# ISWAS v17.10 — hovering Earth globe

Created from completed v17.9 in its own folder; earlier versions are preserved.

This version deepens the ocean blue, strengthens the globe’s spherical shading and atmospheric glow, and replaces floating marker dots with needle pins. Each needle points into its geographic location and carries a colored marker at its outer end. Existing location data, marker search/filtering, rotation and zoom remain available.

When Locations is active, or the viewer approaches the table in 360 mode, the globe rises clear of the tabletop so its full surface can be seen. Leaving the globe returns it to the table. The globe, pins, atmospheric shell, click targets and labels move together. Camera framing follows the changing height. Reduced-motion preferences skip the lift animation.

The surface and cloud images remain the existing NASA assets; no new image downloads are added. The atmosphere and instanced needle stems add lightweight geometry to the existing renderer. No extra rendering context or postprocessing chain is used.

Local preview: http://localhost:8106/ISWAS_v17.11/locations/

For GitHub Pages, extract `ISWAS_v17.11-release.zip` and upload its contents to the repository root, preserving relative paths and `.nojekyll`. Open through HTTP(S), rather than directly as a file. Packaging does not deploy the site.

Mobile scrolling: touching reading content now pauses the tour before the first move. Section changes have one immediate scroll-to-top reset, with duplicate delayed/router resets removed from normal navigation, so subsequent gestures continue native scrolling.

Validation: all 33 regression files pass, including globe lift timing at 30/60/120fps, needle picking/occlusion, reduced-motion behavior, camera clearance, and touch-before-arrival scrolling. Static validation checks 301 local references, 63 script syntax checks, 100 movie covers and 200 locations. Browser checks cover desktop 1280 × 720, phone 390 × 844, and compact 320 × 568 layouts; the mobile needle selection opened The Hills Have Eyes case file, and native page/Locations panel scrolling remained usable. These are responsive browser checks, not physical-device performance benchmarks.
