from pathlib import Path
from PIL import Image
import json,re
root=Path(__file__).resolve().parents[1]
# Originals remain available; references use visually lossless WebP deliveries.
manifest=[]
for folder in ['plates','portraits','textures','books']:
 for p in (root/folder).rglob('*'):
  if p.suffix.lower() not in ['.jpg','.png','.jpeg']:continue
  im=Image.open(p); out=p.with_suffix('.webp'); im.save(out,'WEBP',quality=91,method=6)
  manifest.append({'source':str(p.relative_to(root)),'delivery':str(out.relative_to(root)),'native_pixels':list(im.size),'source_bytes':p.stat().st_size,'delivery_bytes':out.stat().st_size})
for p in list((root/'assets').glob('*.js'))+list((root/'assets').glob('*.css'))+list(root.rglob('*.html')):
 s=p.read_text()
 for m in manifest:s=s.replace(m['source'],m['delivery'])
 s=s.replace('Explore the gallery','360 MODE')
 p.write_text(s)
(root/'ASSET_PROVENANCE.json').write_text(json.dumps(manifest,indent=2))
p=root/'assets/lodge-canvas-v17-15.js';s=p.read_text()
a=s.index('let rate=.33;');b=s.index('}else (window.__tourGlide=',a)
s=s[:a]+'''/* v9: discrete smooth camera travel, no automatic document scrolling. */
let nowTime=performance.now();window.__v9Stop??=e;
if(window.__v9Stop!==e){window.__v9Stop=e;window.__tourUntil=nowTime+14000;window.__v9Trip=null;p.current=_.position[0]}
window.__tourUntil||=nowTime+14000;
if(!window.__v9Paused&&!i&&nowTime>=window.__tourUntil){
 let trip=window.__v9Trip;
 if(!trip){let current=stops.findIndex(s=>s[0]===e);let next=current+dir;if(next>=stops.length){z.current=-1;next=current-1}if(next<0){z.current=1;next=1}trip=window.__v9Trip={start:nowTime,from:p.current,to:stops[next][1],section:stops[next][0]}}
 let progress=Math.min(1,(nowTime-trip.start)/2400),ease=progress*progress*(3-2*progress);
 window.__tourGlide=true;p.current=trip.from+(trip.to-trip.from)*ease;
 if(progress===1){window.__v9Trip=null;window.__tourGlide=false;window.__tourUntil=nowTime+14000;window.dispatchEvent(new CustomEvent('gallery-tour',{detail:trip.section}))}
}else{window.__tourGlide=false;p.current=Dn.damp(p.current,_.position[0],4,f)}
a.current=Dn.damp(a.current,0,4,f);s.current=Dn.damp(s.current,0,4,f);
''' +s[b:]
# Remove auto star-camera progression; users retain scrolling control.
s=s.replace('u=Math.min(1,(performance.now()-window.__starT)/18000)','u=0')
# Pause must block the idle-tour branch, but keep pointer/gallery controls functional.
s=s.replace('if(idle){p.current??=', 'if(idle&&!window.__v9Paused){p.current??=')
# Higher desktop render resolution; mobile stays efficient.
s=s.replace('dpr:[1,1],gl:{antialias:!1','dpr:[1,window.innerWidth<768?1:Math.min(1.75,window.devicePixelRatio||1)],gl:{antialias:window.innerWidth>=768')
s=s.replace('e.setPixelRatio(1),e.setClearColor','e.setPixelRatio(window.innerWidth<768?1:Math.min(1.75,window.devicePixelRatio||1)),e.setClearColor')
# Morgan is real scene geometry, placed beside the current camera view.
component='''
function MorganV9(){
 const ref=(0,u.useRef)(null),{camera}=__();
 v_(({clock})=>{if(!ref.current)return;let g=ref.current;let offset=new U(.95,-.58,-2.8).applyQuaternion(camera.quaternion);g.position.copy(camera.position).add(offset);g.quaternion.copy(camera.quaternion);g.scale.setScalar(window.innerWidth<768?.19:.27);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)g.position.y+=Math.sin(clock.elapsedTime*1.5)*.025;g.visible=!!window.__morganVisible;});
 const mesh=(geo,args,pos,scale,color,opacity=1,rotation=[0,0,0])=>(0,$.jsxs)('mesh',{position:pos,scale,rotation,children:[(0,$.jsx)(geo,{args}),(0,$.jsx)('meshStandardMaterial',{color,roughness:.7,transparent:true,opacity,emissive:'#5a8f88',emissiveIntensity:.16,depthWrite:opacity===1})]});
 return (0,$.jsxs)('group',{ref,children:[
 mesh('sphereGeometry',[1,32,24],[0,1.48,0],[.34,.48,.29],'#b5c8be',.88),
 mesh('sphereGeometry',[1,24,16],[0,1.83,-.08],[.35,.24,.28],'#262927',.9),
 mesh('sphereGeometry',[1,24,16],[0,1.32,.28],[.11,.16,.12],'#bfcdc0',.9),
 ...[-.15,.15].map(x=>mesh('sphereGeometry',[1,16,12],[x,1.54,.255],[.10,.055,.045],'#242d2a')),
 ...[-.15,.15].map(x=>mesh('sphereGeometry',[1,12,8],[x,1.54,.291],[.027,.02,.02],'#dbfff0')),
 mesh('boxGeometry',[1,1,1],[0,1.16,.27],[.25,.035,.025],'#414c46'),
 mesh('cylinderGeometry',[.39,.53,1.35,32],[0,.31,0],[1,1,.63],'#192a28',.78),
 mesh('coneGeometry',[.54,1.1,32],[0,-.8,0],[1,1,.65],'#a6ded2',.26,[0,0,Math.PI]),
 mesh('boxGeometry',[1,1,1],[0,.81,.26],[.22,.33,.035],'#e0e6d8',.9),
 ...[-1,1].map(x=>mesh('boxGeometry',[1,1,1],[x*.12,.94,.30],[.18,.10,.06],'#111a18',.95,[0,0,x*.35])),
 ...[-1,1].map(x=>mesh('cylinderGeometry',[.13,.10,.94,16],[x*.50,.27,.06],[1,1,1],'#253b36',.75,[0,0,x*.17])),
 ...[-1,1].map(x=>mesh('sphereGeometry',[1,16,12],[x*.58,-.20,.10],[.13,.18,.12],'#bed9ce',.7)),
 (0,$.jsx)('pointLight',{position:[0,1.7,1],color:'#c5ffe8',intensity:2,distance:3})]});}
'''
s=s.replace('function lb({onOpen:e})',component+'function lb({onOpen:e})')
s=s.replace('(0,$.jsx)(Xy,{})','(0,$.jsx)(MorganV9,{}),(0,$.jsx)(Xy,{})')
p.write_text(s)
p=root/'assets/index-v17-15.js';s=p.read_text();s=s.replace('sc.scrollTop=window.__tourDir<0?Math.max(0,sc.scrollHeight-sc.clientHeight):0','sc.scrollTop=0');p.write_text(s)
