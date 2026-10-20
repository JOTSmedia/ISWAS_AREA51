#!/usr/bin/env python3
"""Wrap the shipped entry pages without running any gallery code before entry.
This is a GitHub Pages privacy screen, not server-enforced authorization.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
SHELLS = ROOT / 'assets/gated-pages-v18-1.json'
ROUTES = ['index.html'] + [f'{name}/index.html' for name in ['need', 'stars', 'locations', 'form', 'comparison', 'contact']]
# Save the exact upstream HTML once, so rebuilding never nests gate pages.
if SHELLS.exists():
    pages = json.loads(SHELLS.read_text())
else:
    pages = {route: (ROOT / route).read_text() for route in ROUTES}
    SHELLS.write_text(json.dumps(pages, ensure_ascii=False, separators=(',', ':')))

original = pages['index.html']
logo = original.split('<div class="load-lock hero-title">', 1)[1].split('<div class="load-meter">', 1)[0]
logo = '<div class="load-lock hero-title" aria-label="It Started With a Scream">' + logo
# Remove the loading dots, retaining the exact existing logo and hanging drops.
start = logo.index('<span class="load-dots"')
end = logo.index('</span>', start) + len('</span>')
logo = logo[:start] + logo[end:]

for route in ROUTES:
    prefix = '../' if '/' in route else ''
    head = original[original.index('<meta name="referrer"'):original.index('<link rel="stylesheet"')]
    # The public social preview remains unchanged. No gallery assets are preloaded.
    page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}
<title>It Started With a Scream — Coming Soon</title>
<meta name="description" content="It Started With a Scream. Coming soon.">
<meta name="theme-color" content="#07060a">
<style>body.access-gated::before{{content:none!important;background:none!important}}</style>
<link rel="icon" type="image/svg+xml" href="{prefix}favicon.svg">
<link rel="stylesheet" href="{prefix}assets/access-gate-base-v18-1.css">
<link rel="stylesheet" href="{prefix}assets/access-gate-v18-1.css">
<script src="{prefix}assets/access-gate-v18-1.js" data-entry="{route}" defer></script>
</head><body class="access-gated">
<main class="load-screen access-screen" aria-label="Coming soon">
{logo}
<div class="access-caption"><h1>COMING SOON</h1>
<button class="access-link" id="open-pin" type="button" aria-haspopup="dialog">ENTER WITH PIN <span aria-hidden="true">↗</span></button>
<p class="access-feedback" id="access-feedback" role="status" aria-live="polite"></p>
<noscript><p class="access-noscript">PLEASE ENABLE JAVASCRIPT TO ENTER.</p></noscript>
</div></main>
<dialog class="pin-dialog" id="pin-dialog" aria-labelledby="pin-title" aria-describedby="pin-help">
<form id="pin-form">
<button class="pin-close" type="button" aria-label="Close PIN entry">×</button>
<p class="pin-kicker">PRIVATE PREVIEW</p><h2 id="pin-title">ENTER YOUR PIN</h2>
<p id="pin-help">ENTER THE FOUR-DIGIT ACCESS CODE.</p>
<label class="sr-only" for="access-pin">Four-digit PIN</label>
<div class="pin-entry"><div class="pin-boxes" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
<input id="access-pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{{4}}" minlength="4" maxlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" required aria-describedby="pin-help pin-error"></div>
<p id="pin-error" class="pin-error" role="status" aria-live="polite"></p>
<button class="pin-submit" type="submit">ENTER <span aria-hidden="true">→</span></button>
</form></dialog>
</body></html>'''
    (ROOT / route).write_text(page)
# GitHub should serve these files as authored, including underscored paths.
(ROOT / '.nojekyll').write_text('# Serve the authored static files without Jekyll.\n')
print('Built COMING SOON gates for all seven presentation entry pages.')
