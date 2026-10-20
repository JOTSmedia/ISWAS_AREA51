"""Build the shelf atlas from verified, locally cached soundtrack album covers.

No illustrated/generic replacements are generated. The source manifest records
which released album edition supplied each of the100covers. The4096px atlas is
an export layout, not a claim that every original scan has4096px of detail.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'textures'/'records'
MANIFEST=ROOT/'tools'/'record-cover-sources.json'
SIZE=4096

def main():
    rows=json.loads((ROOT/'data'/'horror-soundtracks.json').read_text())
    sources=json.loads(MANIFEST.read_text())
    if len(sources)!=100 or {x['rank'] for x in sources}!=set(range(1,101)):
        raise ValueError('Exactly100verified album covers are required; no generated fallbacks.')
    atlas=Image.new('RGB',(SIZE,SIZE),(12,11,10))
    popup=OUT/'covers';popup.mkdir(parents=True,exist_ok=True)
    for source in sorted(sources,key=lambda x:x['rank']):
        rank=source['rank'];i=rank-1
        image=ImageOps.exif_transpose(Image.open(ROOT/source['localSource'])).convert('RGB')
        # Each tile has a2% gutter, matching the scene shader's.096UV sampling.
        x0=round(i%10*SIZE/10);y0=round(i//10*SIZE/10)
        x1=round((i%10+1)*SIZE/10);y1=round((i//10+1)*SIZE/10)
        pad=round(SIZE/10*.02)
        fitted=ImageOps.contain(image,(x1-x0-2*pad,y1-y0-2*pad),Image.Resampling.LANCZOS)
        atlas.paste(fitted,(x0+(x1-x0-fitted.width)//2,y0+(y1-y0-fitted.height)//2))
        # Individual covers are selected on demand; they never join startup requests.
        cover=image.copy()
        cover.thumbnail((512,512),Image.Resampling.LANCZOS)
        path=popup/f"soundtrack-{rank:03}.webp"
        cover.save(path,quality=88,method=6)
        source['nativeDimensions']=list(image.size)
        source['popupDimensions']=list(cover.size)
        source['popupAsset']=path.relative_to(ROOT).as_posix()
        rows[rank-1]['cover']={
            'src':path.relative_to(ROOT).as_posix(),
            'width':cover.width,'height':cover.height,
            'album':source['albumTitle'],'artist':source['albumArtist'],
            'source':source['releaseUrl'],
            **({'note':source['editionNote']} if source.get('editionNote') else {}),
        }
    for tier,quality in ((1024,85),(2048,87),(4096,88)):
        export=atlas if tier==SIZE else atlas.resize((tier,tier),Image.Resampling.LANCZOS)
        export.save(OUT/f'sleeves-{tier}.webp',quality=quality,method=6)
    (ROOT/'data'/'horror-soundtracks.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    MANIFEST.write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n')
    (OUT/'PROVENANCE.json').write_text(json.dumps({
        'artwork':'Actual released soundtrack album front covers and traceable historical archival release covers, matched to the reference films and composers; no generated sleeves or movie-poster substitutions.',
        'coverCount':100,'archivalEditionRanks':[35,40,71,82],'compilationEditionRanks':[10,85,90],'catalogue':'FACT 100 Greatest Horror Soundtracks, ranked metadata from user-specified RYM list',
        'source':'https://rateyourmusic.com/list/Outh9X/facts-100-greatest-horror-soundtracks/',
        'sourceManifest':'tools/record-cover-sources.json',
        'atlasExportDimensions':[1024,2048,4096],
        'atlasLayout':'10 by 10; original aspect ratio contained within each tile;2% gutter',
        'sourceResolution':'Per-cover nativeDimensions in sourceManifest; the4096atlas size is not a claim of native 4K original album artwork.',
        'popupExports':'At most 512px on the longest edge, loaded only when selected.',
        'rights':'Album-cover artwork remains copyright its respective rights holders; no new license or ownership is claimed.',
        'generator':'tools/build_record_sleeves.py'
    },ensure_ascii=False,indent=2)+'\n')
    print('Built100actual album covers, three shelf atlas tiers, and100on-demand popup images.')

if __name__=='__main__':main()
