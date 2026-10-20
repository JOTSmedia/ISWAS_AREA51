# v17.18 — Coming soon and PIN entry

Pulled from the current JOTSmedia/ISWAS_web GitHub source, commit 04ee802a070f6837d192438087aada452614ad99. The source matches the completed local v17.17 presentation. Earlier completed versions are preserved.

The public entrance reuses the existing loading screen's background, self-hosted fonts, logo, glow and hanging blood drops. COMING SOON replaces the book loader. ENTER WITH PIN opens an accessible dialog with four masked digits and a numeric phone keyboard. The code is 1023. Enter submits; Escape, the close button and the backdrop dismiss the popup. An incorrect code clears the input, closes the popup and returns to COMING SOON. A correct code starts the original Overview loader, then opens the presentation. First entry through a section link also goes through the Overview loader.

All seven entry pages are wrapped. Before entry, none of the gallery JavaScript, WebGL initialization, audio, poster preloads or loading sequence starts. The original presentation HTML is preserved byte-for-byte in assets/gated-pages-v17-18.json and restored at its original URL after entry; the existing application assets and animation timing are unchanged. The current tab remembers entry for four hours on subsequent page loads. If browser storage is disabled, the immediate entry works, but subsequent full page loads ask again. Already-open gallery pages do not automatically relock after four hours.

## Protection limit — chosen GitHub Pages version

Beth explicitly selected a GitHub-compatible PIN screen after being advised that it is bypassable. This is a client-side privacy screen, not secure authentication or encryption. Visitors can inspect the code, modify browser storage, fetch the preserved HTML or access assets directly. The public GitHub repository also exposes source and assets. The browser's PIN digest avoids showing the literal code in the entry script; four-digit codes can be guessed offline. Do not use this package to protect confidential material. Enforced protection requires server-side authentication and a protected origin.

## Preview and delivery

Open through HTTP(S), not file://. For local review, run `python3 -m http.server 8018 --bind 127.0.0.1 --directory ISWAS_v17.18` from the parent folder, then visit http://127.0.0.1:8018/.

Extract the contents of ISWAS_v17.18-release.zip into the GitHub Pages publishing root. Keep CNAME and .nojekyll. No build is required. The existing custom domain and social-preview image are retained. This task does not upload, push, change DNS, or deploy anything.

Run `node tools/test-access-gate.mjs` for gate behavior. The existing loader, deployment, HTTPS and Morgan bootstrap tests inspect the preserved post-PIN presentation. `python3 tools/package_release.py --check` validates both the public entrance and the preserved presentation documents. `python3 tools/build-access-gate.py` rebuilds the entrance pages from the preserved HTML; it does not modify the presentation.

Verification: 27 new gate scenarios cover all seven routes at domain, repository and nested roots; malformed, incorrect and correct codes; session expiry; storage-disabled entry; failed-download recovery; and HTTPS redirects. The full suite contains 43 test scripts. Browser review covers the incorrect-code return, correct-code loader and gallery, direct-section entry, Escape dismissal, cleared input, four masked digits, and desktop/narrow layouts. Screenshots are retained in tools/ and excluded from the upload ZIP.
