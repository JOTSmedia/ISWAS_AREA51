# ISWAS v16

New version copied from completed v15; earlier versions preserved.

- Speech-bubble pointers capped at 24px rather than spanning the full gap to Morgan. His introductory perch is aligned beside the bubble to reduce the gap.
- Morgan initially remains at the library shelf. Entering 360 mode still triggers the control introduction; subsequent movements retain the existing library/home-base behavior.
- Router startup preserves the version-folder base path instead of overwriting it with an empty path. index.html is canonicalized to its containing folder before hydration/history locking. This prevents the initial Overview route from being treated as an unknown route in a version subfolder.

Preview: http://localhost:8106/ISWAS_v16/
No deployment performed.
Validation: JavaScript syntax checks pass. Browser opened /ISWAS_v16/index.html, canonicalized to /ISWAS_v16/, and rendered the presentation without Not Found. Overview and Need navigation verified with version-prefixed links.
