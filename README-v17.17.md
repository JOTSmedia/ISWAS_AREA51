# v17.17 — Visible record flight and playback

The record popup shares the screen with the existing 3D scene. Desktop reserves the left 56% for the gramophone and shelf, with the scrollable album popup on the right. Phones reserve the upper 43% for the scene and use a scrollable bottom popup.

Selecting a record first frames the full shelf and pauses the tour. The flight starts only when the camera arrives, then the camera gently moves closer to show the platter. Selecting another record repeats the wide framing before its flight. Closing restores normal camera projection, stops audio and returns the record.

No second WebGL renderer or new textures. Existing YouTube controls, album artwork, catalogue browsing and outside dismissal retained. Reduced-motion record behavior retained.

Verification: 42 automated checks pass, including projection checks for every record's flight at 1512×789, 390×844, 320×720 and 844×390; resize recovery and close restoration. Chrome desktop and responsive phone views visually checked. YouTube embedding remained externally slow/unavailable during this local session; the existing retry and external playback link remain available. Actual third-party stream availability is not guaranteed.

Extract the release ZIP's contents into the Pages publishing root. Deployment has not been performed.
