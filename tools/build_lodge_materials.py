"""Native 4096px procedural surface maps; no source image upscaling."""
from pathlib import Path
from PIL import Image
import numpy as np,json
out=Path(__file__).resolve().parent.parent/'textures'/'black-lodge'
out.mkdir(exist_ok=True)
n=4096;rng=np.random.default_rng(163)
y,x=np.mgrid[:n,:n].astype(np.float32)
# Seamless broad chevrons with fine mineral variation and subtle wear.
tri=np.abs((x/n*2)%2-1)
band=((y/n*4+tri*2)%1)<.49
noise=rng.normal(0,1.6,(n,n)).astype(np.float32)
variation=1.6*np.sin(x*.038)*np.sin(y*.051)+noise
base=np.where(band,24,220)+variation
floor=np.stack([np.where(band,68+variation,base*1.02),np.where(band,5+variation*.25,base*.995),np.where(band,14+variation*.4,base*.96)],axis=-1).clip(0,255).astype('uint8')
# Subtle black weave, meant to be physically shaded, not a flat photograph.
weave=2*np.sin(x*np.pi/2)+1.7*np.sin(y*np.pi/2)+rng.normal(0,1.2,(n,n))
cloth=np.stack([31+weave,30+weave,28+weave],axis=-1).clip(0,255).astype('uint8')
# Red velvet: fine vertical pile; actual curtain folds are modeled geometry.
pile=2.2*np.sin(x*.28)+rng.normal(0,1.4,(n,n))
velvet=np.stack([108+pile*2,7+pile*.2,13+pile*.25],axis=-1).clip(0,255).astype('uint8')
for name,arr in [('chevron',floor),('upholstery',cloth),('velvet',velvet)]:
 im=Image.fromarray(arr)
 for size in (4096,1024):
  img=im if size==4096 else im.resize((size,size),Image.Resampling.LANCZOS)
  img.save(out/f'{name}-{size}.webp',quality=88,method=6)
(out/'PROVENANCE.json').write_text(json.dumps({'version':'16.3','type':'procedural PBR albedo surfaces','source_resolution':[4096,4096],'exports':[4096,1024],'upscaled':False,'reference':'User-provided Twin Peaks Black Lodge still: ivory/deep-scarlet chevron floor (user revision), red drapery, black upholstery with wood trim','generator':'tools/build_lodge_materials.py','note':'Surface maps are generated at native resolution. Real-time render resolution is device-adaptive; no claim of photographic scans.'},indent=2))
print([(p.name,p.stat().st_size) for p in out.glob('*.webp')])
