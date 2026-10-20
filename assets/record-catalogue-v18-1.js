export const RECORD_COUNT=100;
export const RECORD_STATION=Object.freeze({shelf:[-2.65,0,8.16],platter:[-2.65,1.18,6.35]});
export function catalogueNeighbour(rank,delta,count=RECORD_COUNT){return Math.min(count,Math.max(1,Math.round(rank)+delta))}
export function recordShelfPosition(rank){const i=Math.max(0,Math.min(99,rank-1));return[-2.65-(-2.275+(i%15)*.325),3.22-Math.floor(i/15)*.43,7.8]}
export function recordFlightPose(rank,progress){
 const start=recordShelfPosition(rank),end=RECORD_STATION.platter,t=Math.min(1,Math.max(0,progress)),e=t*t*(3-2*t);
 return {position:start.map((v,i)=>v+(end[i]-v)*e+(i===1?Math.sin(Math.PI*t)*.5:0)),tilt:(1-e)*Math.PI/2};
}
export function parseYouTubeId(value){
 const text=String(value||'').trim();if(/^[\w-]{11}$/.test(text))return text;
 try{const u=new URL(text);if(!['https:','http:'].includes(u.protocol))return null;const host=u.hostname.toLowerCase().replace(/^(www\.|m\.)/,'');
  let id;if(host==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','youtube-nocookie.com'].includes(host))id=u.searchParams.get('v')||(/^(?:\/embed\/|\/shorts\/|\/live\/)([\w-]{11})(?:\/|$)/.exec(u.pathname)||[])[1];
  return /^[\w-]{11}$/.test(id||'')?id:null;
 }catch{return null}
}
let catalogue;
export function loadRecordCatalogue(){
 if(!catalogue)catalogue=fetch(new URL('../data/horror-soundtracks.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('The record collection could not load.');return r.json()}).then(rows=>{if(rows.length!==100||new Set(rows.map(r=>r.rank)).size!==100)throw Error('The record collection is incomplete.');return rows.sort((a,b)=>a.rank-b.rank)}).catch(error=>{catalogue=null;throw error});
 return catalogue;
}
