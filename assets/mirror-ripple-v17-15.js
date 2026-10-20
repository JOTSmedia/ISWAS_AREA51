// One texture sample in the existing gallery pass. The original image supplies
// the mirror's specular detail; these short radial waves only move the glass.
export const MIRROR_LAYOUT=Object.freeze({radiusX:.7488,radiusY:1.1328,imageAspect:.8,imageWidth:.94,handU:.82,handV:.62});
export function createMirrorRipple(){
 const x=1/MIRROR_LAYOUT.imageWidth;
 const y=MIRROR_LAYOUT.radiusY*MIRROR_LAYOUT.imageAspect/(MIRROR_LAYOUT.radiusX*MIRROR_LAYOUT.imageWidth);
 const uniforms={iswasMirrorTime:{value:0},iswasMirrorActive:{value:1},iswasMirrorHover:{value:0},iswasMirrorFit:{value:[x,y]},iswasMirrorHand:{value:[MIRROR_LAYOUT.handU,1-MIRROR_LAYOUT.handV]}};
 return{
  uniforms,
  hover(value){uniforms.iswasMirrorHover.value=value?1:0},
  advance(delta,{visible=true,hidden=false,reduced=false}={}){
   uniforms.iswasMirrorActive.value=reduced?0:1;
   if(!visible||hidden||reduced)return;
   // Resume from the frozen phase after a hidden tab; never catch up in a jump.
   uniforms.iswasMirrorTime.value=(uniforms.iswasMirrorTime.value+Math.min(.05,Math.max(0,Number(delta)||0)))%4096;
  },
  compile(shader){
   Object.assign(shader.uniforms,uniforms);
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>',`#include <map_pars_fragment>
uniform float iswasMirrorTime;
uniform float iswasMirrorActive;
uniform float iswasMirrorHover;
uniform vec2 iswasMirrorFit;
uniform vec2 iswasMirrorHand;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec2 mirrorUv=(vMapUv-0.5)*iswasMirrorFit+0.5;
 vec2 handDelta=(mirrorUv-iswasMirrorHand)*vec2(0.8,1.0);
 float radius=length(handDelta);
 float wave=sin(radius*66.0-iswasMirrorTime*2.8);
 float envelope=exp(-radius*6.0)*smoothstep(0.012,0.055,radius)*(1.0-smoothstep(0.38,0.55,radius));
 vec2 direction=handDelta/max(radius,0.001)/vec2(0.8,1.0);
 vec2 rippleUv=mirrorUv+direction*wave*envelope*0.0055*iswasMirrorActive;
 float inside=step(0.0,mirrorUv.x)*step(mirrorUv.x,1.0)*step(0.0,mirrorUv.y)*step(mirrorUv.y,1.0);
 vec4 sampledDiffuseColor=texture2D(map,clamp(rippleUv,0.0,1.0));
 sampledDiffuseColor.rgb*=inside*(1.0+iswasMirrorHover*0.14);
 sampledDiffuseColor.rgb+=vec3(0.15,0.32,0.48)*max(wave,0.0)*envelope*0.055*inside*iswasMirrorActive;
 diffuseColor*=sampledDiffuseColor;
#endif`);
  }
 };
}
