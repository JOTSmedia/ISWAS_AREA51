from pathlib import Path
import urllib.request,urllib.parse,re,html,json,io,time
from PIL import Image
r=Path(__file__).resolve().parents[1];rows=json.loads((r/'data/variety.json').read_text());source=json.loads((r/'books/SOURCES.json').read_text())
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ISWAS-gallery/9.0 (movie reference)'}),timeout=20).read()
for item in source:
 if item['status']=='downloaded':continue
 rank=item['rank'];row=rows[rank-1];slug=row[6] or row[1];page='https://en.wikipedia.org/wiki/'+urllib.parse.quote(slug.replace(' ','_'))
 try:
  time.sleep(1)
  text=get(page).decode();part=text[text.index('class="infobox-image"'):];url=html.unescape(re.search(r'<img[^>]*src="([^"]+)"',part)[1]);url='https:'+url if url.startswith('//') else url
  im=Image.open(io.BytesIO(get(url))).convert('RGB');im.thumbnail((650,950));im.save(r/f'books/afi-{rank:03}.webp',quality=91,method=6)
  item.update(status='downloaded',page=page,image_source=url,pixels=im.size);item.pop('error',None)
  print(rank,'OK',flush=True)
 except Exception as ex:item['error']=str(ex);print(rank,str(ex),flush=True)
 (r/'books/SOURCES.json').write_text(json.dumps(source,indent=2))
print('complete',sum(i['status']=='downloaded' for i in source))
