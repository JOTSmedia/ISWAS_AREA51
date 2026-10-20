/* A smooth overhead route clears the globe, its pins, and the table rim. */
export const GLOBE_CLEARANCE = Object.freeze({x:21.5,z:1.5,radius:2.8,approach:6.2,height:4.1});
export function globeClearanceHeight(x,z,elevation=1.49){
 const d=Math.hypot(x-GLOBE_CLEARANCE.x,z-GLOBE_CLEARANCE.z);
 const t=Math.min(1,Math.max(0,(d-GLOBE_CLEARANCE.radius)/(GLOBE_CLEARANCE.approach-GLOBE_CLEARANCE.radius)));
 // Quintic easing makes both slope and acceleration zero at the boundaries.
 const smooth=t*t*t*(t*(t*6-15)+10);
 const center=Number.isFinite(elevation)?Math.max(1.49,Math.min(3.05,elevation)):1.49;
 const height=Math.max(GLOBE_CLEARANCE.height,center+1.65);
 return 1.4+(height-1.4)*(1-smooth);
}
export function clearGlobeCamera(position,elevation=1.49){
 const lift=Math.max(0,globeClearanceHeight(position.x,position.z,elevation)-position.y);
 position.y+=lift;
 return lift;
}
