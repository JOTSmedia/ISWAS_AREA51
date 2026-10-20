"""Author native 4096px surface detail; export smaller device tiers. No upscaling."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter

out=Path(__file__).resolve().parent.parent/'textures'/'hospitality'
out.mkdir(exist_ok=True)
n=4096
rng=np.random.default_rng(1715)
y,x=np.mgrid[:n,:n].astype(np.float32)
x/=n;y/=n
def noise(size):
    a=Image.fromarray(rng.integers(0,255,(size,size),dtype=np.uint8))
    return np.asarray(a.resize((n,n),Image.Resampling.BICUBIC),dtype=np.float32)/255-.5
low=noise(16);mid=noise(128);fine=noise(1024)
micro=rng.normal(0,1,(n,n)).astype(np.float32)
warp=x+.012*np.sin(y*2*np.pi)+.006*low+.003*mid
growth=np.sin(warp*2*np.pi*59 + 6*np.sin(y*2*np.pi)+3*low)
pores=np.sin(warp*2*np.pi*391 + mid*8)
grain=growth*6+pores*2+low*15+fine*2+micro*.7
walnut=np.stack([94+grain,63+grain*.76,40+grain*.5],axis=-1).clip(0,255).astype('uint8')
# Fine irregular hide grain: creases in multiple directions, with pores.
crease=np.minimum(np.abs(np.sin((x+.005*low)*2*np.pi*109+mid*4)),np.abs(np.sin((y+.005*low)*2*np.pi*103+mid*5)))
hide=(139+crease*29+fine*8+micro*1.2).clip(0,255).astype('uint8')
# Very dark stone with thin, curved calcite veins; geometry carries highlights.
field=np.sin(x*31+y*11+low*8+mid*.9)
vein=np.exp(-np.square(field/.018))*25
secondary=np.exp(-np.square(np.sin(x*79-y*26+low*12)/.014))*8
stone=23+vein+secondary+low*4+mid*2+micro*.45
marble=np.stack([stone*.92,stone,stone*.98],axis=-1).clip(0,255).astype('uint8')
for name,data in [('walnut',walnut),('leather-height',hide),('marble',marble)]:
    image=Image.fromarray(data)
    for tier in (1024,2048,4096):
        resized=image if tier==n else image.resize((tier,tier),Image.Resampling.LANCZOS)
        resized.save(out/f'{name}-{tier}.webp',quality=87,method=4)
(out/'PROVENANCE.json').write_text(json.dumps({
    'type':'Code-authored PBR surface maps, not photographic scans',
    'native_resolution':[4096,4096],'exports':[1024,2048,4096],'upscaled':False,
    'generator':'tools/build_hospitality_materials.py','seed':1715,
    'note':'Native real-time 3D geometry; output canvas resolution adapts to the device. Existing leather albedo retains its original 1408px resolution; native 4096px microdetail is a separate bump map.'
},indent=2))
print('Created three native 4096px surface maps and their device tiers.')
