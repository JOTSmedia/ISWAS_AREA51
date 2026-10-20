# ISWAS v11 — Morgan's voice

Copied from v10 into a new version folder. Morgan's read-aloud now prefers a known male English voice, prioritizing British Daniel/George voices when installed. Lower pitch (0.65) and slower rate (0.78) give the butler a deeper, ominous delivery. Voice availability is device-dependent; systems without a recognized male voice fall back to their English voice with the same pitch and rate. This is device speech, not a cloned actor voice.

Handles voice lists loaded asynchronously. Existing close/Escape behavior cancels speech. Validation: JS syntax and speech-call smoke checks for voice choice, pitch, rate, and fallback. Actual sound depends on the browser and installed voices.

Preview: http://localhost:8101/
No deployment performed; v10 preserved.

Morgan's position is moved beyond the front end of the library shelves into the aisle-side edge (world x -3.2, z 1.25). His full avatar plane sits clear of the shelf's book-spine range. The “Find me by the library” camera is reframed to show both Morgan and the shelves.
