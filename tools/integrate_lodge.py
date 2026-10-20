from pathlib import Path
p=Path(__file__).resolve().parent.parent/'assets/lodge-canvas-v17-9.js'
s=p.read_text()
if 'createBlackLodge' in s:raise SystemExit('Already integrated')
s='import {createBlackLodge} from "./black-lodge-scene-v17-9.js";\nimport "./horror-globe-ui-v17-9.js";\n'+s
# Remove only the old library chair + rug; preserve the bookcase and ladder.
a=s.index('(0,$.jsxs)(`group`,{position:[.95,0,-1.72]')
b=s.index('(0,$.jsxs)(`group`,{position:[-3.58,0,-3.05]',a)
s=s[:a]+'(0,$.jsx)(LibrarySetting,{}),'+s[b:]
# Library wood panel behind portraits becomes pleated velvet; left wood stays.
a=s.index('function qy(');b=s.index('function loadFrame',a)
q=s[a:b]
start=q.index('(0,$.jsxs)(`mesh`,{position:[.2,2.15,-4.9]')
end=q.index('(0,$.jsxs)(`mesh`,{position:[-4,2.15,-2.7]',start)
q=q[:start]+q[end:]
q=q.replace('(0,$.jsx)(rb,{position:[-1.7,0,-2.55]}),','')
s=s[:a]+q+s[b:]
# Replace circular table and its small decorative sphere, retaining surrounding architecture.
a=s.index('(0,$.jsxs)(`group`,{position:[21.5,0,1.5],children:')
b=s.index('(0,$.jsxs)(`group`,{position:[11.2,.03,1.45]',a)
s=s[:a]+'(0,$.jsx)(GlobeTable,{}),(0,$.jsx)(LoungeSetting,{}),'+s[b:]
s=s.replace('position:[21.5,.03,1.5],rotation:[0,-.08,0]','position:[21.5,.03,1.5],rotation:[0,0,0]')
s=s.replace('args:[3.9,2.6]','args:[7.2,6.4]')
for item in ['(0,$.jsx)(nb,{position:[21.5,0,.15]}),','(0,$.jsx)(nb,{position:[21.5,0,2.85],rotation:[0,Math.PI,0]}),','(0,$.jsx)(Fy,{position:[21.5,.045,.15],size:[2.8,1.35]}),','(0,$.jsx)(Fy,{position:[21.5,.045,2.85],size:[2.8,1.35]}),']:
 assert item in s,item
 s=s.replace(item,'')
a=s.index('(0,$.jsxs)(`mesh`,{position:[21.5,.84,1.5]');b=s.index('Array.from({length:8}',a)
s=s[:a]+s[b:]
# Share existing runtime classes and maps: no new renderer or framework.
init='''const {LibrarySetting,LoungeSetting,GlobeTable}=createBlackLodge({React:u,jsx:$,useFrame:v_,useThree:__,RoundedBox:iy,Vector2:H,Vector3:U,Quaternion:On,Object3D:Tr,Color:q,Shape:Xs,Path:Ys,Curve:ks,loadTexture:loadFrame,woodMap:shelfMap,woodHeight:walnutHeight});\n'''
s=s.replace('function MorganV10(){',init+'function MorganV10(){')
s=s.replace('mouth:new U(.06668,.93,.005)','mouth:new U(.10002,.92,.005)')
# LOCATIONS tour route. The camera stands outside the new rug, facing down at the globe.
s=s.replace('"/form":{position:', '"/locations":{position:[24.5,4.6,8.4],target:[21.5,1.5,1.5]},"/form":{position:',1)
s=s.replace('["/stars",20.5],["/form",28.6]','["/stars",20.5],["/locations",24.5],["/form",28.6]')
s=s.replace('[`/stars`,20.5],[`/form`,28.6]','[`/stars`,20.5],[`/locations`,24.5],[`/form`,28.6]')
s=s.replace('window.__morganVisit=false};return window.addEventListener', 'window.__morganVisit=false;if(!e.target?.closest?.("dialog"))window.__globeVisit=false};return window.addEventListener',1)
s=s.replace('if(r.button!==0||n(r))return;', 'if(r.button!==0||n(r)||window.__globeDragging)return;',1)
s=s.replace('if(c.current){if(Math.hypot', 'if(c.current&&!window.__globeDragging){if(Math.hypot',1)
s=s.replace("window.__morganVisit=false;if(d.reset)","window.__morganVisit=false;window.__globeVisit=false;if(d.reset)",1)
s=s.replace("const visit=()=>{p.current=-.75;", "const globeVisit=()=>{p.current=24.5;m.current=0;h.current=0;window.__galleryDepth=0;window.__globeVisit=true};const visit=()=>{window.__globeVisit=false;p.current=-.75;",1)
s=s.replace("window.addEventListener('morgan-visit',visit);","window.addEventListener('horror-globe-visit',globeVisit);window.addEventListener('morgan-visit',visit);",1)
s=s.replace("window.removeEventListener('morgan-visit',visit);","window.removeEventListener('horror-globe-visit',globeVisit);window.removeEventListener('morgan-visit',visit);",1)
# Camera stays on the near side of the globe during general gallery travel.
s=s.replace('w.set(y+Math.sin(e)*(window.__galleryDepth||0),1.62,1.4-Math.cos(e)*(window.__galleryDepth||0))','w.set(y+Math.sin(e)*(window.__galleryDepth||0),1.62,(1.4+4.9*Math.exp(-Math.pow((y-21.5)/3.4,4)))-Math.cos(e)*(window.__galleryDepth||0))')
s=s.replace('if(v&&window.__morganVisit){', 'if((v&&window.__globeVisit)||(!v&&e===`/locations`&&t.aspect<1)){w.set(24.5,t.aspect<1?5.8:4.6,t.aspect<1?11.8:8.4);T.set(21.5,1.5,1.5)}if(v&&window.__morganVisit){',1)
p.write_text(s)
print('Integrated lodge, globe and camera route')
