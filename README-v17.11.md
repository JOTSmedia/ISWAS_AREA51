# ISWAS v17.11 — globe arrival timing and shorter tour stops

Created from completed v17.10 in a new folder.

Activating Locations leaves the globe seated in its table until both the camera position and its aim have reached their destinations. The globe then rises smoothly. Arrival is latched for that visit so the camera following the rising globe cannot interrupt the lift. Each new Locations visit waits for its own arrival. Existing free 360 viewing behavior is preserved.

Tour stops now last 5.5 seconds after camera arrival, including Overview. Camera travel duration is unchanged. Manual reading/scrolling still pauses the tour until explicitly resumed. Morgan’s tour instructions match the new duration.

Local preview: http://localhost:8106/ISWAS_v17.11/locations/

Upload: extract ISWAS_v17.11-release.zip and upload its contents to the GitHub Pages repository root, preserving relative paths and .nojekyll. No deployment is performed.

Validation: all 33 regression files pass. The lift tests cover camera travel, stale arrival rejection, continuous rising after arrival, repeated visits and reduced motion at 30/60/120fps. Tour timing tests confirm 5.5-second stops and manual pause behavior. Release validation passes 301 local references and 63 script syntax checks. Browser navigation from Contact to Locations confirmed the globe rises after the camera reaches it, with no console errors.
