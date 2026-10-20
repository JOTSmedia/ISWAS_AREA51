/* Keep a real gallery image visible until the live scene has painted. */
(()=>{
 const root=document.documentElement,base=window.__ISWAS_BASE||'/',poster=new Image();
 let requested=false,paint=0;
 const state=window.__iswasStartup={posterReady:false,live:false,
  startScene(){if(requested)return;requested=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__showLodge=true}))},
  sceneReady(){if(state.live||paint)return;paint=requestAnimationFrame(()=>{paint=0;state.live=true;root.classList.add('iswas-scene-ready');root.classList.remove('iswas-scene-lost')})},
  sceneLost(){cancelAnimationFrame(paint);paint=0;state.live=false;root.classList.remove('iswas-scene-ready');root.classList.add('iswas-scene-lost')}
 };
 const ready=()=>{state.posterReady=true;root.classList.add('iswas-poster-ready');if(window.__ISWAS_ROUTE!=='/')state.startScene()};
 poster.decoding='async';poster.onload=()=>{if(poster.decode)poster.decode().then(ready,ready);else ready()};
 poster.onerror=()=>{state.startScene()};poster.src=base+'textures/gallery-startup.webp';
 // Deep links keep working even if the lightweight poster request fails.
 if(window.__ISWAS_ROUTE!=='/')setTimeout(()=>state.startScene(),1500);
})();
