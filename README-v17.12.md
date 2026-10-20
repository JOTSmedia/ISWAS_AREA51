# ISWAS v17.12 — Locations tour continuation and custom domain

Created from v17.11 in a new folder.

Fixed the automatic tour becoming stuck at Locations. The split-screen viewport may remain active while the tour clock runs. Locations retains its 5.5-second camera-arrival stop, then continues to Form. Manual scrolling/touch still pauses the tour, and an open location archive blocks automatic navigation. The previous camera-first globe lift remains intact.

Included CNAME for itstartedwithascream.com and updated HTML social metadata to the production domain. Runtime paths remain relative so GitHub project paths and the production domain root both work. See CUSTOM-DOMAIN-SETUP.md for exact GitHub Pages and Squarespace steps. No DNS, repository, hosting, or deployment settings were changed.

Preview: http://localhost:8106/ISWAS_v17.17/locations/

Validation: all 34 regression files pass, including the actual camera/tour frame loop leaving Locations while its split viewport is active. Browser observation confirmed automatic progress beyond Locations to Comparison without clicking navigation. No console errors appeared. Release checks cover 301 local references, 63 scripts, 100 movie covers and 200 locations.
