# v18.1 — Gold Room guests, local VHS playback and performance

Created from the completed v18; earlier versions are preserved. This is a local GitHub Pages release. Nothing has been pushed or deployed.

## Requested changes

The cigar chairs now sit more than 3.5 metres from the screen and point directly at it. The rug and low table were repositioned to preserve clear space between the viewers and TV.

The original walnut console TV now plays the supplied Ring MP4 directly on a Three VideoTexture in the shared gallery renderer. There is no external player or CSS3D overlay for this TV. The video source is assigned only when the gallery is ready and the TV is nearby and visible. Playback loops silently in view. Clicking the screen or the keyboard-accessible entry enables sound and opens play/pause, sound, restart, power and close controls. Leaving view, navigation, a competing player, Lloyd's dialog or a hidden tab pauses and silences it. Compass controls release the close viewing camera.

The supplied 640×480 H.264/AAC capture is preserved without transcoding; its MP4 container was remuxed for fast-start delivery. The delivery file is 14,676,960 bytes and about 95.75 seconds. It retains the original 4:3 aspect ratio. Source path, original/delivery hashes and conversion details are in media/PROVENANCE.json.

Jack Torrance, resembling Jack Nicholson in the supplied film still, sits on the guest side of the Gold Room bar in his burgundy jacket and plaid shirt. He is a fixed transparent image plane, not a full 3D character rig. Lloyd and his nameplate are clickable. His accessible dialog opens with “WELCOME TO THE GOLD ROOM, I'M LLOYD” and offers recommendations, information about the guest, and navigation to the bar, cigar lounge or library. Escape and outside clicks close it. Dialog text is local; no remote chat or generated speech is used.

The existing COMING SOON screen and PIN 1023 remain, with the previously accepted client-side protection limitation. The Gold Room design, all presentation sections, Morgan, globe, books, records and existing gallery features are retained. Runtime filenames are versioned for this release.

## New loading and rendering improvements

- The public gate uses a 39,241-byte stylesheet extracted from the unchanged 151,320-byte presentation stylesheet. That is 112,079 fewer raw CSS bytes (74.07%) before PIN entry. All seven restored presentation documents still use the complete stylesheet. The deterministic extractor preserves matching rules, layers, responsive states, fonts and keyframes.
- The loader's progress cadence is shorter, while preserving all 100 distinct progress steps, the readiness cap at 95%, and the existing final hold/fade. A synthetic 60Hz run of the actual shipped code with an already decoded poster reveals at 2,267ms versus 3,933ms in v18: 1,667ms less fixed waiting. This is a simulation, not a network or GPU loading-time claim; late assets still delay the reveal.
- The shelf wood texture now clones the already loaded texture source and retains its independent repeat settings. This removes a duplicate load/decode path; browsers may already deduplicate its network transfer.
- The TV uses native video frames and the existing renderer. It avoids external YouTube code, performs cheap visibility checks before projection, and stops decoding when offscreen. Jack uses bounded desktop/mobile WebP assets with no per-frame animation.
- Existing adaptive rendering now has an extra response for sustained frame times over 45ms: it can reduce the scene's pixel ratio to 0.6. Ordinary slow rendering retains the 0.75 floor; capable devices retain the prior ceiling and recovery. Text and controls stay at normal browser resolution. This trades some scene sharpness for reduced pixel work on struggling graphics hardware.

The inherited desktop 2048 texture tiers, mobile 1024 tiers, batching and existing render-loop optimizations are retained. Their savings were already present in v18 and are not counted as new improvements here.

## Validation and delivery

All 47 test scripts pass. They cover the gate and restored routes, loader readiness, rendering recovery, texture sharing, seating direction/clearance, character assets, TV media lifecycle and controls, Lloyd dialog branches, keyboard behavior and inherited gallery features. The packaging validator checks all runtime references and JavaScript syntax, 100 book covers, 100 record covers and 200 locations.

Local browser checks cover Jack and Lloyd at the bar, clicking Lloyd's actual avatar, conversation choices, the MP4 visibly playing on the CRT, sound/pause controls, wider seating and phone-width controls/dialog layout. Screenshots and browser performance samples are retained in tools/ and excluded from the release. The settled five-second local browser comparison measured median frame intervals of 120.95ms in v18 at scene DPR 0.75, and 91.3ms in v18.1 at scene DPR 0.6: about 24.5% shorter intervals. Both samples remained slow in this test environment. This is an environment-specific sample, not a universal frame-rate guarantee. The startup simulation is retained separately in tools/performance-startup-report.json.

Run `python3 tools/package_release.py --check` to validate. Extract the contents of ISWAS_v18.1-release.zip into the GitHub Pages publishing root, preserving CNAME, .nojekyll and relative paths. No build is needed. Packaging does not deploy the site or modify DNS.

## Generated assets and provenance

Jack was generated with the built-in ImageGen tool. Native source and desktop delivery are 1024×1536; mobile delivery is 512×768. No upscaling is claimed. Final assets are characters/jack-torrance/jack.webp and jack-mobile.webp. Exact prompt and source master are tools/asset-sources/jack-prompt.txt and jack-source.png; details are characters/jack-torrance/PROVENANCE.json.

The inherited Lloyd assets remain characters/lloyd/lloyd.webp and lloyd-mobile.webp, with their original prompt, source master and provenance. The supplied stills guide character/costume and console modeling; the reference photos are not embedded in the scene.
