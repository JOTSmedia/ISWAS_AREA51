# ISWAS v14

New version folder copied from completed v13. No deployment performed.

- Clear circular LOOK AROUND arrows with an independent MOVE row and reset.
- Morgan flies onto a perch above the control when 360 mode opens. An uppercase bubble explains the controls, with a tap-to-continue action. Device speech reads the directions when initiated by the 360-mode click. He then flies to the library or home base according to location.
- Morgan's speech bubbles and guide content use uppercase text.
- Removed the obsolete flat mirror image that overlapped the live mirror; the stale .jpg filter was corrected for the WebP asset.
- Gallery toolbar sits below the measured header; controls occupy the lower left, home avatar the lower right. Mobile navigation wraps into two rows.
- Library search, heading, and results use uppercase text. Search/close stay in a fixed header while results scroll independently.
- All popup types dismiss on outside click, outside wheel scrolling, or an outside touch swipe. Inside scrolling stays inside the popup. Popup surroundings remain transparent.
- Mobile mirror reflection uses a smaller render target and updates at 15 fps, reducing the cost of the additional scene render. The main scene keeps its prior mobile pixel-ratio and texture limits.

Validation: JavaScript syntax checks; phone-sized browser preview; library internal scrolling and outside-wheel dismissal; control introduction, labels, and separate avatar/control positions. Small-phone test harness: tools/mobile-preview.html?width=320. No physical-device performance benchmark was run.

Preview: http://localhost:8104/

## Final avatar and mobile refinement

- Subtle mint rim glow on the in-room avatar and all corner, popup, flight, and control-perch avatars.
- Speech bubbles sit beside Morgan with an SVG tail ending at his mouth; bubbles and tails hide during flight.
- HIDE CONTROLS / SHOW CONTROLS toggles the mobile control dock. After acknowledging the introduction, small-screen controls collapse automatically. The next 360 entry expands them for the next introduction.
- Morgan explicitly explains click-and-drag navigation in his introductory speech and written guidance.
- Morgan also flies when his control perch moves during minimizing or resizing.
- Browser layout review at 320px and 390px phone widths. Library scrolling, outside-click and outside-wheel dismissal checked. Main mirror verified without the former flat-image overlap.

Final browser verification at 320px: two-row navigation fully visible; Morgan's glow and mouth-anchored introductory bubble remain separate from controls; GOT IT minimizes the dock to SHOW CONTROLS; expanding restores the look/move controls. The library header/search stay separate and results scroll. 390px layout was also inspected. No physical-phone benchmark was performed.
