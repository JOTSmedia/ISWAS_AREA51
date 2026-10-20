import { BubbleLifetime } from './bubble-lifetime-v18-1.js';
const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
// The alpha asset has two connection points, measured in source-image space.
// Keep the actual path local to the chest instead of creating a viewport-sized
// surface. One static texture is shared by every visit and follows the bubble fade.
const WORMHOLE_IMAGE={aspect:2,start:{x:.051,y:.466},end:{x:.958,y:.506}};
export function wormholeGeometry(chest,rect,viewport,image=WORMHOLE_IMAGE){
 if(!chest||![chest.x,chest.y].every(Number.isFinite))return null;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n)),inset=8;
 const candidates=[
  {x:rect.left,y:clamp(chest.y,rect.top+inset,rect.bottom-inset)},
  {x:rect.right,y:clamp(chest.y,rect.top+inset,rect.bottom-inset)},
  {x:clamp(chest.x,rect.left+inset,rect.right-inset),y:rect.top},
  {x:clamp(chest.x,rect.left+inset,rect.right-inset),y:rect.bottom}
 ];
 let end=candidates[0],distance=Infinity;
 for(const candidate of candidates){const d=Math.hypot(candidate.x-chest.x,candidate.y-chest.y);if(d<distance){distance=d;end=candidate}}
 if(distance<16||distance>90)return null;
 const sourceX=image.end.x-image.start.x,sourceY=(image.end.y-image.start.y)/image.aspect;
 const width=distance/Math.hypot(sourceX,sourceY),height=width/image.aspect;
 const angle=Math.atan2(end.y-chest.y,end.x-chest.x)-Math.atan2(sourceY,sourceX),cos=Math.cos(angle),sin=Math.sin(angle);
 const left=chest.x-image.start.x*width*cos+image.start.y*height*sin,top=chest.y-image.start.x*width*sin-image.start.y*height*cos;
 const corners=[[0,0],[width,0],[0,height],[width,height]].map(([x,y])=>({x:left+x*cos-y*sin,y:top+x*sin+y*cos}));
 if(corners.some(point=>point.x<2||point.x>viewport.width-2||point.y<2||point.y>viewport.height-2))return null;
 return {left,top,width,height,angle,distance,start:chest,end};
}
const isOverview=()=>{const base=(window.__ISWAS_BASE||'/').replace(/\/$/,'');const path=(window.location?.pathname||'/').replace(/\/$/,'');return path===base;};
export function createMorganBubbles({guide,onAction,onDone}) {
 const life=new BubbleLifetime(),bubble=document.createElement('div');
 bubble.className='morgan-speech-bubble';bubble.hidden=true;bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');
 const action=document.createElement('button');action.type='button';action.className='morgan-bubble-action';
 const close=document.createElement('button');close.type='button';close.className='morgan-bubble-close';close.textContent='×';close.setAttribute('aria-label','Close Morgan’s speech bubble');
 bubble.append(action,close);guide.append(bubble);
 const tail=document.createElement('img');tail.className='morgan-wormhole-path';tail.src=(window.__ISWAS_BASE||'/')+'characters/morgan/wormhole-path.webp';tail.alt='';tail.setAttribute('aria-hidden','true');tail.decoding='async';tail.draggable=false;tail.style.display='none';guide.append(tail);
 let context=null,fadeTimer=0,endTimer=0,finishedKey=null,settledSince=null,lastAnchor=null,lastPlacement=null;
 const hide=()=>{bubble.hidden=true;tail.style.display='none';};
 const clearTimers=()=>{clearTimeout(fadeTimer);clearTimeout(endTimer);fadeTimer=endTimer=0;};
 const done=()=>{if(context?.key&&finishedKey!==context.key){finishedKey=context.key;onDone(context.kind)}};
 const dismiss=()=>{life.dismiss();clearTimers();hide();done()};
 close.onclick=event=>{event.stopPropagation();dismiss()};
 action.onclick=()=>{const kind=context?.kind;dismiss();if(kind!=='controls')onAction()};
 function place(anchor,kind){
  const a=anchor.rect,m=anchor.mouth,c=anchor.chest,margin=10,preferredWidth=Math.min(kind==='controls'?174:190,innerWidth-20);
  if(!c)return false;
  // The text stays clear of Morgan's head and body. Only the liquid connector
  // is allowed to cross his sternum, where its projected start point is fixed.
  const head={left:m.x-a.width*.22,right:m.x+a.width*.075,top:m.y-a.height*.12,bottom:m.y+a.height*.065};
  const body={left:a.left+a.width*(anchor.space==='portrait'?.25:.12),right:a.left+a.width*(anchor.space==='portrait'?.74:.92),top:a.top+a.height*.23,bottom:a.top+a.height*.99};
  const blockers=[document.querySelector('.gallery-controls'),document.querySelector('.mast')].filter(Boolean).map(el=>el.getBoundingClientRect());
  if(kind==='initial'){const hero=document.querySelector('.dossier-panel')?.getBoundingClientRect();if(hero)blockers.push(hero)}
  const valid=b=>{
   if(b.left<margin||b.right>innerWidth-margin||b.top<margin||b.bottom>innerHeight-margin||blockers.some(r=>intersects(b,r))||intersects(b,head)||intersects(b,body))return false;
   const connection=wormholeGeometry(c,b,{width:innerWidth,height:innerHeight});
   if(!connection)return false;
   bubble.style.left=b.left+'px';bubble.style.top=b.top+'px';
   tail.style.left=connection.left+'px';tail.style.top=connection.top+'px';tail.style.width=connection.width+'px';tail.style.height=connection.height+'px';tail.style.transform=`rotate(${connection.angle}rad)`;
   return true;
  };
  // Preserve a proven readable position through subpixel camera motion, while
  // the image's source endpoint continues to follow the live chest projection.
  if(lastPlacement&&Math.hypot(c.x-lastPlacement.chest.x,c.y-lastPlacement.chest.y)<6){
   const b=lastPlacement.rect;bubble.style.width=lastPlacement.width+'px';bubble.style.maxWidth=lastPlacement.width+'px';
   b.bottom=b.top+bubble.offsetHeight;
   if(valid(b))return true;
  }
  const sides=[{edge:Math.max(m.x+16,head.right+4),right:true},{edge:Math.min(m.x-16,head.left-4),right:false},{edge:body.right+6,right:true},{edge:body.left-6,right:false}];
  for(const side of sides){
   const available=side.right?innerWidth-margin-side.edge:side.edge-margin;
   if(available<106||Math.abs(side.edge-c.x)>90)continue;
   const widths=[...new Set([Math.min(preferredWidth,available),160,140,120,106].filter(width=>width<=preferredWidth&&width<=available))];
   for(const width of widths){
    bubble.style.width=width+'px';bubble.style.maxWidth=width+'px';
    const height=bubble.offsetHeight,x=side.right?side.edge:side.edge-width;
    for(const y of [m.y-height+8,m.y-height*.5,body.top-height-4,c.y-height*.5,m.y-12]){
     const b={left:x,right:x+width,top:y,bottom:y+height};
     if(valid(b)){lastPlacement={rect:b,width,chest:{x:c.x,y:c.y}};return true;}
    }
   }
  }
  return false;
 }
 function initialReady(next,now,started){
  if(next?.kind!=='initial')return true;
  const live=document.documentElement.classList.contains('iswas-scene-ready')&&window.__morgan3D?.isReady===true&&!document.querySelector('.is-intro');
  if(!live){settledSince=null;lastAnchor=null;return false}
  if(started)return true;
  if('__tourStopStartedAt' in window&&!window.__v9Paused)return window.__tourStopSection==='/'&&Number.isFinite(window.__tourStopStartedAt)&&window.__tourStopStartedAt>0&&now-window.__tourStopStartedAt>=100;
  const a=next.anchor,m=a?.mouth;
  if(!a?.visible||!m){settledSince=null;lastAnchor=null;return false}
  if(lastAnchor){
   const elapsed=Math.max(1,now-lastAnchor.at),movement=Math.hypot(m.x-lastAnchor.x,m.y-lastAnchor.y)+Math.abs(a.rect.width-lastAnchor.width);
   if(elapsed>250||movement>Math.max(.75,elapsed*.04))settledSince=now;
  }
  settledSince??=now;lastAnchor={x:m.x,y:m.y,width:a.rect.width,at:now};
  // The canvas has a 450ms reveal. The greeting starts only once its owner is
  // both painted and settled, so loading and camera travel consume no read time.
  return now-settledSince>=500;
 }
 return { update(next,now=performance.now()){
  // On a slow GPU the guide can outpace the 3D paint. Its last explicit visible
  // projection still describes the displayed avatar; a stale timestamp alone
  // is not evidence that the user looked away. A new offscreen frame wins.
  if(next?.kind==='initial'&&!next.anchor&&window.__morganProjection?.visible)next={...next,anchor:window.__morganProjection};
  if(next?.key!==context?.key){clearTimers();hide();finishedKey=null;settledSince=null;lastAnchor=null;lastPlacement=null;}
  context=next;
  // The welcome belongs to Overview and runs inside its existing tour hold.
  // Leaving that route ends it even before its first usable placement.
  if(next?.kind==='initial'&&!isOverview()){life.sync(next.key,false,now);life.dismiss();clearTimers();hide();done();return;}
  const key=next?.key||null,starting=life.key!==key||life.started===null,startedForKey=life.key===key&&life.started!==null;
  const ownerVisible=!!(next?.anchor?.visible&&!window.__morganInTransit&&!document.hidden&&!document.querySelector('dialog[open],.gallery-dialog,.tome-back,.magic-portal'));
  if(!ownerVisible&&!startedForKey){settledSince=null;lastAnchor=null}
  let eligible=ownerVisible&&initialReady(next,now,startedForKey),placed=false;
  // A valid placement is part of readiness. Never spend or cancel the opening
  // greeting just because the first loading/camera frame has no usable space.
  if(eligible&&(!life.closed||life.key!==key)){
   if(action.textContent!==next.text)action.textContent=next.text;
   const label=next.kind==='controls'?'Dismiss direction-control tip':`Ask Morgan: ${next.text}`;
   if(action.getAttribute('aria-label')!==label)action.setAttribute('aria-label',label);
   bubble.hidden=false;bubble.style.visibility='hidden';
   placed=place(next.anchor,next.kind);bubble.style.visibility='';
   if(!startedForKey)eligible=eligible&&placed;
  }
  life.duration=next?.kind==='initial'?8000:3000;
  const phase=life.sync(key,eligible,now);
  if(phase==='hidden'||phase==='expired'){hide();if(phase==='expired'||startedForKey&&!eligible){clearTimers();done()}return;}
  if(!placed){hide();return;}
  bubble.hidden=false;bubble.classList.toggle('is-fading',phase==='fading');
  tail.style.display='block';tail.classList.toggle('is-fading',phase==='fading');
  if(starting&&life.started!==null){const key=next.key;fadeTimer=setTimeout(()=>{if(context?.key===key){bubble.classList.add('is-fading');tail.classList.add('is-fading')}},life.duration-life.fade);endTimer=setTimeout(()=>{if(context?.key===key){life.dismiss();hide();done()}},life.duration);}
 }, dismiss, destroy(){clearTimers();bubble.remove();tail.remove();} };
}
