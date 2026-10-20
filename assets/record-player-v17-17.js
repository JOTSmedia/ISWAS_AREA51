import './popup-behavior-v17-17.js';
import {loadRecordCatalogue,catalogueNeighbour,parseYouTubeId} from './record-catalogue-v17-17.js';
let dialog,player,apiPromise,rows=[],rank=1,generation=0,ready=false,returnFocus,playerTimer=0;
const customVideos=new Map();
const emit=(type,detail)=>window.dispatchEvent(new CustomEvent(type,{detail}));
const state=playing=>emit('gramophone-playback',{playing});
function youtubeAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  let done=false;const prior=window.onYouTubeIframeAPIReady;
  const timer=setTimeout(()=>{if(!done){done=true;apiPromise=null;reject(Error('YouTube could not load. Try again or open this track on YouTube.'))}},12000);
  window.onYouTubeIframeAPIReady=()=>{try{prior?.()}finally{if(!done){done=true;clearTimeout(timer);resolve(window.YT)}}};
  if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.async=true;s.onerror=()=>{clearTimeout(timer);done=true;apiPromise=null;s.remove();reject(Error('YouTube could not load.'))};document.head.append(s)}
 });return apiPromise;
}
function waitForRecordCamera(){
 if(window.__recordCameraReady)return Promise.resolve();
 return new Promise(resolve=>{const done=()=>{window.removeEventListener('record-camera-ready',done);dialog.removeEventListener('close',done);resolve()};window.addEventListener('record-camera-ready',done,{once:true});dialog.addEventListener('close',done,{once:true})});
}
function status(text){if(dialog)dialog.querySelector('[data-record-status]').textContent=text}
function stop(){clearTimeout(playerTimer);generation++;ready=false;state(false);if(player){try{player.destroy()}catch{}player=null}dialog?.querySelector('[data-video-stage]')?.replaceChildren()}
function createDialog(){
 if(dialog)return;
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./record-player-v17-17.css',import.meta.url).href;document.head.append(style);
 dialog=document.createElement('dialog');dialog.className='record-dialog';dialog.setAttribute('aria-labelledby','record-player-title');
 dialog.innerHTML=`<header class="record-head"><div><span class="record-kicker">THE HORROR RECORD COLLECTION</span><h2 id="record-player-title">CHOOSE A RECORD</h2></div><button class="record-close" aria-label="Close record collection">×</button></header>
 <div class="record-body"><section class="record-now"><div class="record-meta"><img class="record-sleeve" width="128" height="128" decoding="async" alt=""><div><p data-record-rank></p><h3 data-record-name></h3><p data-record-composer></p><p data-record-note></p></div></div>
 <div class="record-video" data-video-stage></div><p data-record-status role="status">SELECT A RECORD FROM THE COLLECTION.</p>
 <div class="record-actions"><button data-play>PLAY</button><button data-pause>PAUSE</button><a data-youtube target="_blank" rel="noopener noreferrer">OPEN ON YOUTUBE ↗</a></div>
 <nav class="record-pager" aria-label="Browse records"><button data-previous>← PREVIOUS RECORD</button><span data-position></span><button data-next>NEXT RECORD →</button></nav>
 <details><summary>USE ANOTHER YOUTUBE VIDEO</summary><form class="record-url"><label for="record-youtube-url">PASTE A YOUTUBE LINK</label><input id="record-youtube-url" type="url" placeholder="https://www.youtube.com/watch?v=…" autocomplete="off"><button>PUT ON THE GRAMOPHONE</button></form></details></section>
 <section class="record-browse"><label for="record-search">FIND A RECORD</label><input id="record-search" type="search" placeholder="FILM OR COMPOSER" autocomplete="off"><p data-record-count></p><div class="record-results" role="list" aria-label="Soundtrack records"></div><p class="record-source">COLLECTION: <a href="https://rateyourmusic.com/list/Outh9X/facts-100-greatest-horror-soundtracks/" target="_blank" rel="noopener noreferrer">FACT’S 100 GREATEST HORROR SOUNDTRACKS · RYM ↗</a></p></section></div>`;
 dialog.querySelector('.record-close').onclick=()=>dialog.close();
 dialog.querySelector('[data-previous]').onclick=()=>choose(catalogueNeighbour(rank,-1));
 dialog.querySelector('[data-next]').onclick=()=>choose(catalogueNeighbour(rank,1));
 dialog.querySelector('[data-play]').onclick=()=>{if(ready)player?.playVideo();else playCurrent()};
 dialog.querySelector('[data-pause]').onclick=()=>player?.pauseVideo();
 dialog.querySelector('#record-search').oninput=renderResults;
 dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const id=parseYouTubeId(dialog.querySelector('#record-youtube-url').value);if(!id){status('PLEASE USE A VALID YOUTUBE VIDEO LINK.');return}customVideos.set(rank,id);playCurrent()};
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('record-viewing');window.__recordCameraReady=false;stop();emit('gramophone-closed',{});returnFocus?.isConnected&&returnFocus.focus({preventScroll:true})});
 document.body.append(dialog);
}
function renderResults(){
 const needle=dialog.querySelector('#record-search').value.trim().toLocaleLowerCase(),filtered=rows.filter(r=>(r.title+' '+r.composer+' '+r.year+' '+r.rank).toLocaleLowerCase().includes(needle));
 const list=dialog.querySelector('.record-results'),fragment=document.createDocumentFragment();
 for(const r of filtered){const button=document.createElement('button');button.type='button';button.dataset.rank=r.rank;button.setAttribute('aria-label',`Record ${r.rank}: ${r.title}, ${r.composer}`);button.textContent=String(r.rank).padStart(2,'0')+' · '+r.title;button.className=r.rank===rank?'is-selected':'';button.onclick=()=>choose(r.rank);const entry=document.createElement('div');entry.setAttribute('role','listitem');entry.append(button);fragment.append(entry)}
 list.replaceChildren(fragment);dialog.querySelector('[data-record-count]').textContent=filtered.length+' OF 100 RECORDS';
}
async function playCurrent(){
 stop();const token=generation,record=rows[rank-1],id=customVideos.get(rank)||record.videoId;
 const link=dialog.querySelector('[data-youtube]');link.href='https://www.youtube.com/watch?v='+id;
 window.__recordCloseup=false;window.__recordCameraReady=false;status('MOVING TO THE GRAMOPHONE…');
 await waitForRecordCamera();if(token!==generation||!dialog.open)return;
 status('PUTTING THE RECORD ON THE GRAMOPHONE…');emit('gramophone-load',{rank});
 const selectedAt=performance.now();
 try{
  const YT=await youtubeAPI();if(token!==generation||!dialog.open)return;
  const holder=document.createElement('div');dialog.querySelector('[data-video-stage]').append(holder);
  playerTimer=setTimeout(()=>{if(token===generation&&!ready)status('YOUTUBE IS TAKING TOO LONG. TRY PLAY AGAIN, OPEN ON YOUTUBE, OR USE ANOTHER VIDEO LINK.')},12000);
  player=new YT.Player(holder,{width:480,height:270,host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{autoplay:0,playsinline:1,rel:0,origin:location.origin},events:{
   onReady:event=>{if(token!==generation||!dialog.open)return;clearTimeout(playerTimer);ready=true;event.target.setVolume(35);status('PRESS PLAY IF YOUR BROWSER DOES NOT START THE TRACK.');const iframe=event.target.getIframe();iframe.title=record.title+' soundtrack on YouTube';iframe.setAttribute('allow','autoplay; encrypted-media; fullscreen; picture-in-picture');setTimeout(()=>{if(token===generation&&dialog.open)event.target.playVideo()},Math.max(0,1000-(performance.now()-selectedAt)))},
   onStateChange:event=>{if(token!==generation)return;state(event.data===1);if(event.data===1)status('NOW PLAYING · '+record.title);else if(event.data===2)status('PAUSED');else if(event.data===0)status('RECORD FINISHED · CHOOSE ANOTHER OR PLAY AGAIN.')},
   onAutoplayBlocked:()=>{if(token===generation)status('PRESS PLAY TO START THE SOUNDTRACK.')},
   onError:()=>{if(token!==generation)return;state(false);status('THIS YOUTUBE VIDEO IS UNAVAILABLE HERE. OPEN IT ON YOUTUBE OR USE ANOTHER VIDEO LINK.')}
  }});
 }catch(error){if(token===generation)status(error.message)}
}
async function choose(nextRank){
 rank=catalogueNeighbour(nextRank,0);const r=rows[rank-1];if(!r)return;
 dialog.querySelector('[data-record-rank]').textContent='FACT COLLECTION · NO. '+r.rank+' · '+r.year;
 dialog.querySelector('#record-player-title').textContent='ON THE GRAMOPHONE';dialog.querySelector('[data-record-name]').textContent=r.title;dialog.querySelector('[data-record-composer]').textContent=r.composer;
 dialog.querySelector('[data-record-note]').textContent=[r.note,r.cover?.note].filter(Boolean).join(' ');
 dialog.querySelector('[data-position]').textContent=r.rank+' / 100';
 dialog.querySelector('[data-previous]').disabled=r.rank===1;dialog.querySelector('[data-next]').disabled=r.rank===100;
 const sleeve=dialog.querySelector('.record-sleeve');sleeve.src=new URL('../'+r.cover.src,import.meta.url).href;sleeve.alt=r.cover.album+' soundtrack album cover';sleeve.width=r.cover.width;sleeve.height=r.cover.height;
 renderResults();dialog.scrollTop=0;
 playCurrent();
}
export async function openRecordCollection(requestedRank=1){
 createDialog();if(!dialog.open){returnFocus=document.activeElement;window.__iswasTour?.pause('record-collection');document.documentElement.classList.add('record-viewing');window.__recordCameraReady=false;dialog.showModal();status('OPENING THE COLLECTION…')}
 try{rows=await loadRecordCatalogue();if(!dialog.open)return;choose(requestedRank)}catch(error){status(error.message)}
}
window.addEventListener('iswas:record-open',e=>openRecordCollection(e.detail?.rank||1));
window.addEventListener('pagehide',()=>{if(dialog?.open)dialog.close();else stop()});
