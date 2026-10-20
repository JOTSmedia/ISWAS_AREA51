// Face the visitor for 90% of a 15-second cycle; complete one smooth turn in the rest.
export function morganHomeAngle(seconds){
 const phase=((seconds%15)+15)%15;
 if(phase<=13.5)return 0;
 const t=(phase-13.5)/1.5;
 return Math.PI*2*t*t*(3-2*t);
}
