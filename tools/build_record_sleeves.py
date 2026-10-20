"""Original archival sleeve artwork in one native 4096px texture atlas."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,random,re
root=Path(__file__).resolve().parent.parent
rows=json.loads((root/'data/horror-soundtracks.json').read_text())
out=root/'textures'/'records';out.mkdir(exist_ok=True)
size=4096;atlas=Image.new('RGB',(size,size));d=ImageDraw.Draw(atlas)
font='/System/Library/Fonts/Supplemental/Georgia.ttf'
title_font=ImageFont.truetype(font,29);small=ImageFont.truetype(font,15);number=ImageFont.truetype(font,24)
palette=[(34,44,47),(61,30,33),(45,49,33),(65,45,31),(44,37,55),(28,47,46)]
def wrap(text,limit):
 words=text.split();lines=[];line=''
 for word in words:
  trial=(line+' '+word).strip()
  if len(trial)>limit and line:lines.append(line);line=word
  else:line=trial
 if line:lines.append(line)
 return lines
for row in rows:
 i=row['rank']-1;x0=round(i%10*size/10);y0=round(i//10*size/10);x1=round((i%10+1)*size/10);y1=round((i//10+1)*size/10)
 bg=palette[i%len(palette)];d.rectangle((x0,y0,x1,y1),fill=bg)
 d.rectangle((x0+9,y0+9,x1-9,y1-9),outline=(160,134,93),width=2)
 d.rectangle((x0+19,y0+19,x1-19,y0+60),fill=(15,15,14))
 d.text((x0+29,y0+25),f"{row['rank']:02d}  /  SCREAM SOUNDTRACK ARCHIVE",font=small,fill=(212,190,145))
 cx=x0+204;cy=y0+174
 d.ellipse((cx-83,cy-83,cx+83,cy+83),fill=(14,14,15),outline=(97,91,76),width=2)
 for r in range(35,82,6):d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(40,40,40),width=1)
 d.ellipse((cx-28,cy-28,cx+28,cy+28),fill=(148,120,79));d.ellipse((cx-3,cy-3,cx+3,cy+3),fill=(12,12,12))
 title=row['title'];english=re.search(r'\[([^]]+)\]',title)
 if english:title=english.group(1)
 lines=wrap(title.upper(),22)[:3]
 for j,line in enumerate(lines):d.text((x0+27,y0+266+j*31),line,font=title_font,fill=(236,226,204))
 composer=row['composer'];english=re.search(r'\[([^]]+)\]',composer)
 if english:composer=english.group(1)
 d.text((x0+27,y1-30),f"{composer.upper()[:35]}  ·  {row['year']}",font=small,fill=(196,173,135))
for tier in (1024,2048,4096):
 image=atlas if tier==4096 else atlas.resize((tier,tier),Image.Resampling.LANCZOS)
 image.save(out/f'sleeves-{tier}.webp',quality=90,method=4)
(out/'PROVENANCE.json').write_text(json.dumps({'native_resolution':[4096,4096],'exports':[1024,2048,4096],'upscaled':False,'artwork':'Original code-authored archival sleeve designs; not scans of commercial album artwork','catalogue':'FACT 100 Greatest Horror Soundtracks, ranked metadata from user-specified RYM list','source':'https://rateyourmusic.com/list/Outh9X/facts-100-greatest-horror-soundtracks/','generator':'tools/build_record_sleeves.py'},indent=2))
print('Created one atlas containing 100 distinct record sleeves.')
