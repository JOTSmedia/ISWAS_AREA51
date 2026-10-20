# ISWAS v17.2 — graphics startup recovery

Created from v17.1 without changing the earlier version.

The actual Chrome console on the user's Mac reported GL_VENDOR=Disabled, GL_RENDERER=Disabled and BindToCurrentSequence failed while creating WebGL. The same gallery rendered in the in-app browser. Chrome's graphics acceleration setting was reportedly already enabled. This is a browser graphics failure, not missing gallery files; a site cannot override a disabled graphics backend.

Changes:
- Let Chrome select the default graphics device instead of requesting the high-performance device.
- If antialiased context creation fails, retry once without antialiasing on the same canvas before constructing Three. Mobile makes one lean attempt. No automatic retry loop.
- Preserve the scene image and presentation on failure. Replace the disabled 360 notice with RESTORE 360, a focused help dialog and an explicit full-page retry. Reload recreates failed Morgan and shared scene resources safely.
- Preserve the caught initialization error for diagnosis.
- Give every runtime JS/CSS file a v17.2 filename to prevent stale bundles when uploading into an existing repository.

Validation:
- 16 focused code checks passed before final cache-name changes; repeated after those changes.
- Package validation resolves all local HTML, CSS and JS references and checks syntax.
- Live 360 rendering, library camera/navigation, desktop 1280px and mobile 390px layouts verified in the in-app browser (no horizontal overflow). The original Chrome session still refused all WebGL contexts, including the lighter fallback. User closed Chrome; verification after reopening remains pending.

Preview: http://localhost:8106/ISWAS_v17.2/

Upload the CONTENTS of ISWAS_v17.2-release.zip into the repository root (including .nojekyll). Do not nest the version folder inside the repository. The runtime detects the repository path. No deployment was performed.
