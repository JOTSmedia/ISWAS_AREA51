"""Author subtle, native 4096px aged brass; export smaller delivery tiers.

These are deterministic procedural PBR maps, not scans or upscaled photographs.
The model carries the seams, rolled lip, fasteners, and cabinet joinery in 3D.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

out = Path(__file__).resolve().parent.parent / 'textures' / 'gramophone'
out.mkdir(exist_ok=True)
n = 4096
rng = np.random.default_rng(1716)
y, x = np.mgrid[:n, :n].astype(np.float32)
x /= n
y /= n

def noise(size):
    source = Image.fromarray(rng.integers(0, 255, (size, size), dtype=np.uint8))
    return np.asarray(source.resize((n, n), Image.Resampling.BICUBIC), dtype=np.float32) / 255 - .5

cloud = noise(12)
wear = noise(96)
fine = noise(768)
# Restrained oxidation collects unevenly; there are no painted highlights.
patina = np.clip((cloud + wear * .24 - .17) * 1.8, 0, .22)
turned = np.sin(x * np.pi * 2 * 612 + wear * 1.5) * .7
base = cloud * 15 + wear * 5 + fine * 1.4 + turned
albedo = np.stack((174 + base - patina * 90,
                   132 + base * .78 - patina * 32,
                   66 + base * .55 + patina * 8), axis=-1).clip(0, 255).astype('uint8')
# Measured-looking, quiet roughness variation rather than shiny yellow plastic.
roughness = (90 + cloud * 21 + wear * 9 + fine * 3 + patina * 145).clip(66, 139).astype('uint8')
for name, data in [('aged-brass', albedo), ('brass-roughness', roughness)]:
    image = Image.fromarray(data)
    for tier in (1024, 2048, 4096):
        delivery = image if tier == n else image.resize((tier, tier), Image.Resampling.LANCZOS)
        delivery.save(out / f'{name}-{tier}.webp', quality=85, method=5)

(out / 'PROVENANCE.json').write_text(json.dumps({
    'type': 'Original code-authored physically based surface maps and native 3D model',
    'generator': 'tools/build_gramophone_materials.py',
    'model': 'assets/gramophone-scene-v17-17.js',
    'native_resolution': [4096, 4096],
    'exports': [1024, 2048, 4096],
    'upscaled': False,
    'seed': 1716,
    'reference': 'https://collection.sciencemuseumgroup.org.uk/objects/co117233/intermediate-monarch-gramophone-gramophone',
    'reference_use': 'Mechanical construction and overall proportions only; no reference photographs copied into textures.',
    'wood': 'Reuses native 4096px hospitality walnut map at the matching device tier.',
    'model_details': 'Thin eight-petal horn with inside/outside surfaces, rolled lip and raised seams; connected elbow and rear support; molded walnut motor case; winding crank; felt platter, spindle, brake, speed lever; acoustic tonearm, diaphragm soundbox and stylus.',
    'render_resolution': 'Adaptive real-time output; 4K source maps do not imply a fixed 4K browser canvas on every device.'
}, indent=2))
print('Created native 4096px aged-brass albedo and linear roughness maps, with 1024/2048 device tiers.')
