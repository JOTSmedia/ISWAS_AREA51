# Morgan avatar

Reference: user-supplied still from The Old Dark House, saved as reference.png.
Generated with the built-in image generation tool, at 1024 × 1536 with transparency.
Source: morgan-source.png. Desktop delivery: morgan.webp. Mobile delivery: morgan-mobile.webp (512 × 768).

Current v16.3 implementation: a genuinely volumetric, procedurally modeled character in `assets/morgan-model-v17-1.js`, anchored beside the library. The supplied generated likeness is projected onto the shaped front surfaces. The model has separate coat, sleeves, trousers, boots, palms/fingers, an angular head with modeled nose/brow/cheek relief, and separate side/back garment and hair surfaces. It is not a rigged or motion-captured human, and the front texture remains the original 1024 × 1536 source (512 × 768 on mobile), not a native 4K photograph. Shared geometry is merged by material into six draw calls.

The bottom-right avatar renders the same three-dimensional model into a transparent canvas and slowly rotates above ASK MORGAN. Only one small overlay renderer is created, lazily, and reused for home, controls, dialog and flight. It pauses while the document is hidden, does not rotate when reduced motion is enabled, and retains the original portrait as a fallback when WebGL is unavailable. The original billboard used by earlier versions is replaced in this version's world scene.

Prompt:
Create a full-body realistic character game avatar of Morgan the butler from The Old Dark House using the attached photograph as the likeness reference. Preserve this man's distinctive long angular face, dark disheveled hair, heavy brows, prominent nose, thick sideburns and short dark beard, weary sinister expression. Tall hunched imposing man in worn 1930s black butler tailcoat, black trousers, white collar. Three-quarter front view, face clearly visible, arms relaxed slightly apart, one open hand gently welcoming visitors. Entire body and shoes visible, no cropping. Photorealistic cinematic 3D character render, detailed fabric and facial texture, subtle pale ghostly rim light, muted natural colors, suitable for warm dark antique library gallery. Single isolated character on genuinely transparent background. No scenery, no floor, no objects, no text, no logos. Retain a solid detailed face and coat, only faint spectral wisps around the shoes.

## v16.4 display revision
The same image now appears on both faces of a shallow layered cutout. No new or upscaled image is introduced. Modeled side/back anatomy was removed at the user’s request.
