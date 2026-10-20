/* Let the browser choose an available GPU and accept its software fallback. */
export function createGalleryRenderer(Renderer,options,antialias=true){
 const settings={...options,alpha:false,antialias,powerPreference:'default',failIfMajorPerformanceCaveat:false};
 if(settings.context)return new Renderer(settings);
 let context=null,failure;
 const request=()=>{try{context=settings.canvas.getContext('webgl2',settings)}catch(error){failure=error}};
 request();
 // A rejected request leaves the canvas unbound. Reusing it preserves Fiber's
 // sizing and pointer target. Construct Three only once a context exists, so a
 // failed attempt cannot leave its context-event listeners behind.
 if(!context&&antialias){settings.antialias=false;request()}
 if(!context)throw new Error('WebGL 2 is unavailable in this browser.',{cause:failure});
 return new Renderer({...settings,context});
}
