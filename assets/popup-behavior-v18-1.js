if(typeof document!=='undefined'){
// Dismiss outside the bounded popup; preserve wheel/touch scrolling inside it.
function activePopup() {
 const native=[...document.querySelectorAll('dialog[open]')].at(-1);
 if(native)return {box:native,close:()=>{const button=native.querySelector('.morgan-close');if(button)button.click();else native.close()}};
 const candidates=[['.gallery-dialog .gallery-card','.gallery-close'],['.tome-back:not(.is-shut) .open-book','.book-close'],['.magic-portal .magic-glass','.magic-close']];
 for(const [selector,closeSelector]of candidates){const box=document.querySelector(selector);if(box)return{box,close:()=>box.querySelector(closeSelector)?.click()}}
 return null;
}
let ignoreNextClick=false;
function dismissOutside(event) {
 if(event.type==='pointerdown')ignoreNextClick=false;
 const popup=activePopup();if(!popup)return;
 const point=event.touches?.[0]||event;
 if(!Number.isFinite(point.clientX)||!Number.isFinite(point.clientY))return;
 // The globe and its case file form one interactive workspace.
 if(popup.box.dataset.globeCompanion&&event.target?.closest?.('#globe-zoom-controls'))return;
 const globe=window.__locationsViewport;
 if(popup.box.dataset.globeCompanion&&globe&&point.clientX>=globe.left&&point.clientX<=globe.left+globe.width&&point.clientY>=globe.top&&point.clientY<=globe.top+globe.height)return;
 const rect=popup.box.getBoundingClientRect();
 if(point.clientX>=rect.left&&point.clientX<=rect.right&&point.clientY>=rect.top&&point.clientY<=rect.bottom)return;
 if(event.type==='pointerdown')ignoreNextClick=true;event.preventDefault();event.stopImmediatePropagation();popup.close();
}
document.addEventListener('pointerdown',dismissOutside,{capture:true,passive:false});
document.addEventListener('wheel',dismissOutside,{capture:true,passive:false});
document.addEventListener('touchmove',dismissOutside,{capture:true,passive:false});

document.addEventListener('click',event=>{if(!ignoreNextClick)return;ignoreNextClick=false;event.preventDefault();event.stopImmediatePropagation()},{capture:true});

}
