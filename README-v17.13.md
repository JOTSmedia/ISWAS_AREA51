# ISWAS v17.13 — Stars arrival without overshoot

Created from v17.12 in its own folder.

Fixed the Stars approach activating the absolute Stars camera early based on the nearest gallery section, then adding the current section’s travel offset a second time. Stars now activates its reading/scroll camera only when that route is active. The automatic approach blends camera position and aim toward the exact Stars opening preset, with one consistent physical waypoint at x20.15. The final transition frame retains its destination even while the route-change event is dispatched.

The 5.5-second stops, manual scroll pause, Locations continuation, camera-first globe lift, and custom-domain CNAME are preserved.

Preview: http://localhost:8106/ISWAS_v17.17/need/

All 35 regression checks pass, including approach bounds for each camera/aim coordinate and an exact match between the end of travel and the Stars opening view.
