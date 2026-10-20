from pathlib import Path
import urllib.request,urllib.parse,json,concurrent.futures,io,time
from PIL import Image
root=Path(__file__).resolve().parents[1];out=root/'books';out.mkdir(exist_ok=True)
previous=json.loads((out/'SOURCES.json').read_text()) if (out/'SOURCES.json').exists() else []
rows=json.loads((root/'data/variety.json').read_text())
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ISWAS-gallery/9.0 (movie cover reference)'}),timeout=25).read()
def fetch(row):
 rank,title,year=row[:3]; slug=row[6] or title
 if (out/f'afi-{rank:03}.webp').exists():return next(x for x in previous if x['rank']==rank)
 time.sleep(2)
 try:
  d=json.loads(get('https://en.wikipedia.org/api/rest_v1/page/summary/'+urllib.parse.quote(slug.replace(' ','_'),safe='')))
  pic=d.get('thumbnail',{}).get('source')
  if not pic:raise ValueError('No thumbnail')
  im=Image.open(io.BytesIO(get(pic))).convert('RGB');im.thumbnail((650,950));im.save(out/f'afi-{rank:03}.webp',quality=91,method=6)
  return {'rank':rank,'title':title,'year':year,'page':d.get('content_urls',{}).get('desktop',{}).get('page'),'image_source':pic,'pixels':im.size,'status':'downloaded'}
 except Exception as ex:return {'rank':rank,'title':title,'slug':slug,'status':'error','error':str(ex)}
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool: results=list(pool.map(fetch,rows))
(out/'SOURCES.json').write_text(json.dumps(results,indent=2));print('Downloaded',sum(x['status']=='downloaded' for x in results),'of',len(results));print(json.dumps([x for x in results if x['status']=='error']))
