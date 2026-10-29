/* ---------- the daily challenge: one seeded universe for everyone, one billion years, one score ---------- */
const LEADERBOARD_URL=(/(^|\.)starcradle\.space$/.test(location.hostname)||location.hostname==='beese-dev.github.io'||location.hostname==='localhost')?'https://pocket-universe-leaderboard.beese-dev.workers.dev':''; /* the shared leaderboard lives on the public site; elsewhere scores stay on this device */
/* one anonymous id per browser, so the leaderboard holds one entry per player whatever name they type */
function playerId(){ try{ let id=localStorage.getItem(STORE+'-pid'); if(!id){ id=Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join(''); localStorage.setItem(STORE+'-pid',id); } return id; }catch(e){ return 'anon'; } }
let mode='sandbox', daily=null;
function dailyKey(){ const d=new Date(); return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`; }
function dailyLabel(k){ return `${k.slice(0,4)}-${k.slice(4,6)}-${k.slice(6,8)}`; }
function genStarD(x,z,cls){ const T=STAR_TYPES[cls], n=catalogN++;
  return {name:makeName(),catalog:'PU-'+String(n).padStart(4,'0'),cls,temp:Math.round(rand(T.t[0],T.t[1])/10)*10,mass:+(T.m*rand(.85,cls==='O'?1.6:1.15)).toFixed(2),x:+x.toFixed(1),z:+z.toFixed(1),seed:rand(0,60),age:0,planets:[]}; }
function dailyUniverse(key){ const keep=RNG; RNG=mulberry(+key%2147483647); const saveN=catalogN; catalogN=1;
  const home=genStarD(0,0,pick(['G','G','K','F'])); home.age=+rand(2e5,8e5).toFixed(0);
  const side=rand(1,2)>1.5?1:-1; const other=genStarD(rand(75,115)*side,rand(-70,70),pick(['M','K','A','B','O','G'])); other.age=+rand(1e5,6e5).toFixed(0);
  if(other.cls==='B'||other.cls==='O'){ other.age=+(1e10*Math.pow(other.mass,-2.5)*rand(.6,.97)).toFixed(0); } /* a massive neighbour partway to its end */
  const st={v:3,t:0,catalogN,holes:[],stars:[home,other],rogues:[],remnants:[],probes:[]};
  if(RNG()<.4) st.holes.push({name:makeName(),mass:+rand(5,12).toFixed(1),x:+rand(-40,40).toFixed(1),z:+(rand(130,170)*-side).toFixed(1),seed:rand(0,60)});
  RNG=keep; catalogN=saveN; return st; }
function dailyRecord(){ try{ return JSON.parse(localStorage.getItem(STORE+'-daily')||'null'); }catch(e){ return null; } }
function dailySaveRec(){ if(!daily) return; try{ localStorage.setItem(STORE+'-daily',JSON.stringify(daily)); }catch(e){} }
function dailyBest(){ try{ return JSON.parse(localStorage.getItem(STORE+'-dailybest')||'{}')||{}; }catch(e){ return {}; } }
function dailyStart(resume){ if(visiting){ toast('Return home before starting a daily run.'); return; } const key=dailyKey();
  if(mode==='sandbox'){ save(); }
  const rec=dailyRecord();
  if(resume&&rec&&rec.key===key&&rec.state){ daily=rec; mode='daily'; loadState(rec.state); }
  else { daily={key,score:{life:0,alive:0,disc:0},done:false,used:{stars:0,holes:0},disc0:Object.keys(found).length,state:null}; mode='daily'; loadState(dailyUniverse(key)); setRate(-1); }
  closeSheets(); select(stars[0],true); resetB.hidden=true; $('#dailyBtn').classList.add('warn'); updateCounts();
  if(!resume||!rec||rec.key!==key) toast(`Daily ${dailyLabel(key)}: time is paused. Build while the discs last, then run the clock.`); }
function dailyExit(){ if(mode!=='daily') return; if(daily&&!daily.done){ daily.state=serialize(); dailySaveRec(); } mode='sandbox'; daily=null;
  loadState(loadSaved()||sample()); resetB.hidden=false; $('#dailyBtn').classList.remove('warn'); $('#dailyLine').hidden=true; closeSheets(); toast('Back in your sandbox.'); }
function dailyTick(dy){ if(mode!=='daily'||!daily||daily.done) return;
  let alive=0; for(const s of stars) for(const p of s.planets) if(p.alive) alive++;
  daily.score.life+=alive*dy/1e6; daily.score.alive=alive; daily.score.disc=Math.max(0,Object.keys(found).length-daily.disc0);
  if(simT>=DAILY_SPAN){ daily.done=true; daily.final=dailyTotal(daily.score); daily.state=null; dailySaveRec(); const best=dailyBest(); if(!best[daily.key]||daily.final>best[daily.key]){ best[daily.key]=daily.final; try{ localStorage.setItem(STORE+'-dailybest',JSON.stringify(best)); }catch(e){} }
    setRate(-1); dailySheet(); boom(.4); toast(`One billion years. Legacy: ${daily.final.toLocaleString('en-US')}`); } }
function dailyStatus(){ if(mode!=='daily'||!daily) return; const l=$('#dailyLine'); l.hidden=false; l.textContent=daily.done?`Daily ${dailyLabel(daily.key)} · finished · Legacy ${daily.final.toLocaleString('en-US')}`:`Daily ${dailyLabel(daily.key)} · ${fmtYears(simT)} of 1 Gyr · Legacy ${dailyTotal(daily.score).toLocaleString('en-US')} · ${daily.score.alive} living world${daily.score.alive===1?'':'s'}`; }
function scoreRows(sc,total){ return `<dl class="score"><dt>Life sustained</dt><dd>${Math.round(sc.life).toLocaleString('en-US')} <small>(1 per living world per Myr)</small></dd><dt>Worlds alive at the end</dt><dd>${sc.alive} × 50</dd><dt>Discoveries during the run</dt><dd>${sc.disc} × 25</dd><div class="tot" style="display:contents"><dt>Legacy</dt><dd>${total.toLocaleString('en-US')}</dd></div></dl>`; }
async function dailySheet(){ const key=dailyKey(), rec=dailyRecord(), best=dailyBest()[key]; let h='';
  if(mode==='daily'&&daily){ const total=daily.done?daily.final:dailyTotal(daily.score);
    h+=`<p><b style="color:var(--ink)">${dailyLabel(daily.key)}</b> · ${daily.done?'Run complete.':`${fmtYears(simT)} of 1 Gyr. Stars planted ${daily.used.stars}/${DAILY_BUDGET.stars}, black holes ${daily.used.holes}/${DAILY_BUDGET.holes}.`}</p>`+scoreRows(daily.score,total);
    if(daily.done) h+=`<div class="row"><button class="btn primary" id="dCopy">Copy score card</button><button class="btn ghost" id="dAgain">Try today again</button><button class="btn ghost" id="dExit">Back to sandbox</button></div>`;
    else h+=`<div class="row"><button class="btn primary" data-close>Keep playing</button><button class="btn ghost" id="dExit">Pause and leave</button></div>`;
  } else {
    h+=`<p>The same starting universe for everyone, every day: two young stars with fresh discs, and sometimes trouble nearby. You have <b style="color:var(--ink)">one billion years</b>, two extra stars and one black hole. Score comes from keeping worlds alive: one point per living world per million years, plus bonuses at the end. Build while the discs last (5 Myr), then run the clock.</p>`;
    h+=`<p>Today is <b style="color:var(--ink)">${dailyLabel(key)}</b>${best!==undefined?` · your best so far: <b style="color:var(--accent)">${best.toLocaleString('en-US')}</b>`:''}.</p>`;
    h+=`<div class="row"><button class="btn primary" id="dStart">${rec&&rec.key===key&&rec.state&&!rec.done?'Resume today\'s run':'Start today\'s run'}</button>${rec&&rec.key===key&&rec.state&&!rec.done?'<button class="btn ghost" id="dFresh">Start over</button>':''}</div>`;
  }
  h+=`<div class="rule"></div><div id="dBoard"><p class="eyebrow" style="margin-bottom:8px">Leaderboard · ${dailyLabel(key)}</p>${LEADERBOARD_URL?'<p>Loading…</p>':'<p>Scores stay on this device until the shared leaderboard is switched on.</p>'}</div>`;
  $('#dailyBody').innerHTML=h; openSheet('#dailySheet');
  const on=(id,f)=>{ const el=document.getElementById(id); if(el) el.addEventListener('click',f); };
  on('dStart',()=>dailyStart(true)); on('dFresh',()=>dailyStart(false)); on('dAgain',()=>dailyStart(false)); on('dExit',dailyExit);
  on('dCopy',async()=>{ const t=`Starcradle · Daily ${dailyLabel(daily.key)}\nLegacy ${daily.final.toLocaleString('en-US')} · ${Math.round(daily.score.life)} life-Myr · ${daily.score.alive} worlds alive · ${daily.score.disc} discoveries\nhttps://starcradle.space/`; try{ await navigator.clipboard.writeText(t); toast('Score card copied.'); }catch(e){ toast(t); } });
  if(LEADERBOARD_URL) loadBoard(key); }
async function loadBoard(key){ const el=$('#dBoard'); try{ const r=await fetch(`${LEADERBOARD_URL}?day=${key}&pid=${playerId()}`); const list=await r.json(); const me=playerId();
    el.innerHTML=`<p class="eyebrow" style="margin-bottom:8px">Leaderboard · ${dailyLabel(key)}</p>`+(list.length?`<ol class="board">${list.slice(0,10).map((e,i)=>`<li class="${e.me?'me':''}"><span>${i+1}.</span><span>${String(e.name).slice(0,16).replace(/[<>&]/g,'')}</span><span>${(+e.score).toLocaleString('en-US')}</span></li>`).join('')}</ol>`:'<p>No scores yet today. Be first.</p>')
      +(daily&&daily.done&&!daily.sent?`<div class="field" style="margin-top:10px"><input id="dName" maxlength="16" placeholder="Your name" aria-label="Your name"><button class="btn primary" id="dSend">Submit ${daily.final.toLocaleString('en-US')}</button></div>`:'');
    const b=document.getElementById('dSend'); if(b) b.addEventListener('click',async()=>{ const name=(document.getElementById('dName').value||'Anonymous').trim(); b.disabled=true;
      try{ await fetch(LEADERBOARD_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day:daily.key,name,pid:playerId(),score:daily.final,life:Math.round(daily.score.life),alive:daily.score.alive,disc:daily.score.disc})}); daily.sent=true; dailySaveRec(); toast('Score submitted.'); loadBoard(key); }catch(e){ b.disabled=false; toast('Could not reach the leaderboard.'); } });
  }catch(e){ el.innerHTML='<p>The leaderboard is not reachable right now.</p>'; } }
$('#dailyBtn').addEventListener('click',dailySheet);

/* the atlas: a live tree of everything in the universe; click to fly there */
let atlasRefs=[], atlasT=0, atlasSig=''; const atlasOpen={};
function aEnt(o,label,kind,cls){ const i=atlasRefs.push(o)-1; const col=o.kind==='star'?o.T.col:o.kind==='hole'?'#ff9a4a':(o.d.colors?o.d.colors[1]:'#bdb9c2');
  return `<button class="ent ${cls||''} ${o===sel?'on':''}" data-i="${i}"><span class="sw" style="color:${col}"></span><b>${label}</b><i>${kind}</i></button>`; }
function renderAtlas(){ if($('#atlasSheet').hidden) return; atlasRefs=[]; const keyOf=s=>s.d.catalog;
  let h='';
  h+=`<details open><summary>Stars<span class="n">${stars.length}</span></summary>`;
  if(!stars.length) h+='<div class="empty">No stars yet. Tap empty space to plant one.</div>';
  for(const st of stars){ const k=keyOf(st); const inside=sel&&(sel.star===st||(sel.planet&&sel.planet.star===st)); const open=inside||(atlasOpen[k]===undefined?true:atlasOpen[k]);
    const kind=st.d.cls==='P'?'pulsar':st.d.cls==='D'?'white dwarf':st.d.giant?'red giant':st.d.binary?`${st.d.cls}+${st.d.binary.cls}`:st.d.cls;
    h+=`<details class="sys" data-k="${keyOf(st)}" ${open?'open':''}><summary>${aEnt(st,st.d.name,`${kind} · ${st.planets.length}p`)}</summary><div class="row2">`;
    if(!st.planets.length) h+='<div class="empty">No planets</div>';
    for(const p of st.planets){ h+=aEnt(p,p.d.name,p.d.core?'core':p.d.scorched?'scorched':p.d.type); for(const m of p.moons) h+=aEnt(m,m.d.name,'moon','moon'); }
    h+='</div></details>'; }
  h+='</details>';
  h+=`<details ${holes.length?'open':''}><summary>Black holes<span class="n">${holes.length}</span></summary>`+(holes.length?holes.map(x=>aEnt(x,x.d.name,`${x.d.mass.toFixed(0)} M☉`)).join(''):'<div class="empty">None. Switch Plant to Black hole.</div>')+'</details>';
  h+=`<details ${rogues.length?'open':''}><summary>Rogue worlds<span class="n">${rogues.length}</span></summary>`+(rogues.length?rogues.map(x=>aEnt(x,x.d.name,'drifting')).join(''):'<div class="empty">None adrift.</div>')+'</details>';
  h+=`<details ${probes.length?'open':''}><summary>Probes in flight<span class="n">${probes.length}</span></summary>`+(probes.length?probes.map(x=>aEnt({kind:'probe',pr:x,d:x.d},x.d.name,`to ${x.d.tn}`)).join(''):'<div class="empty">None in flight.</div>')+'</details>';
  if(h===atlasSig) return; atlasSig=h; $('#atlasList').innerHTML=h; } /* only touch the DOM when something actually changed */
$('#atlasList').addEventListener('click',e=>{ const b=e.target.closest('.ent'); if(b){ e.preventDefault(); e.stopPropagation(); const o=atlasRefs[+b.dataset.i]; if(!o) return;
    if(o.kind==='probe'){ select(null); overviewTarget=toWorld(o.pr.pos,new THREE.Vector3()); desiredDist=18; toast(`${o.d.name}, bound for ${o.d.tn}`); }
    else { eventDismiss(); select(o,true); following=true; }
    if(mobile) closeSheets(); else renderAtlas(); return; }
  const sum=e.target.closest('summary'); if(sum&&sum.parentElement.classList.contains('sys')){ const det=sum.parentElement, k=det.dataset.k; setTimeout(()=>{ atlasOpen[k]=det.open; atlasSig=''; renderAtlas(); },0); } });
$('#atlasBtn').addEventListener('click',()=>{ const sh=$('#atlasSheet'); if(!sh.hidden){ closeSheets(); return; } openSheet('#atlasSheet'); atlasSig=''; renderAtlas(); });
function barH(){ const r=$('.top').getBoundingClientRect(); document.documentElement.style.setProperty('--barH',Math.round(r.bottom+10)+'px'); }
function atlasTick(dt){ atlasT+=dt; if(atlasT<1) return; atlasT=0; barH(); if(!$('#atlasSheet').hidden) renderAtlas(); $('#atlasBtn').setAttribute('aria-pressed',String(!$('#atlasSheet').hidden)); }

/* the guide: short chapters, plus a button that starts the guided lesson */
const GUIDE=[
  ['Planting','Tap empty space to plant a star; its class (and so its colour, mass and lifetime) is rolled for you, and about one in seven arrives as a binary pair. Each star is born with a protoplanetary disc that lasts five million years. Switch Plant to Black hole to plant one of those instead.'],
  ['Planets and moons','While the disc lasts, Grow a planet condenses a world from it, up to eight; at kyr/s and faster they condense on their own. Type depends on distance: lava and rocky worlds close in, gas and ice far out. Planets that hug their star are tidally locked. Add up to four moons to any planet. Once the disc is gone, only a captured rogue world can join a system.'],
  ['Naming and notes','Tap the name in the panel to rename a star, planet, moon or black hole. Field notes give day length, gravity, temperature, atmosphere, weather and life; life appears on rocky and ocean worlds inside the green habitable zone. Postcard renders the current view with the notes typeset on it.'],
  ['Time','The dial sets how much simulated time passes per real second, from a day to a million years. When a star changes state, a black hole feeds or tears something apart, or life is wiped out, the camera flies there and frames it; at kyr/s and Myr/s the clock also eases to a fifth of the dial speed just before and after. Return takes you back to where you were. Events: Ignore turns all of this off. At the two fastest speeds, planets whose year is shorter than a frame are drawn as a smear along their orbit. Space pauses; [ and ] step the dial on a keyboard. The T+ readout shows how much time has passed.'],
  ['How stars live and die','A star lives ten billion years divided by its mass to the power 2.5: red dwarfs effectively forever, the Sun ten billion years, a blue giant a few million. At the end it swells into a red giant and swallows its inner planets. Under eight solar masses it then sheds a planetary nebula and leaves a white dwarf; above eight it goes supernova, vaporising close planets, flinging the rest loose as rogue worlds, and leaving a pulsar, or a black hole above twenty solar masses.'],
  ['Black holes','A black hole captures stars within range, which then circle it with their whole systems. Each star keeps only the planets inside its tidal limit (half its Hill radius, drawn as a dashed orange ring when a hole is near); outer planets are torn away and then move under the hole\'s gravity. A star planted inside the tidal radius is torn apart; one a little further out overflows onto the hole as an X-ray binary, shrinking until it is swallowed. Rogue planets, comets and probes that stray too close are lost. Evaporate removes a hole and frees its stars.'],
  ['Comets and impacts','Comets fall through systems on their own. One that hits a planet raises a dust veil that lasts about a decade and can end any life there; one that hits a gas giant leaves a bruise; one in five plunges into the star. At high speeds, impacts are rolled statistically at about one major strike per planet per hundred million years.'],
  ['Probes','Select a planet or moon, press Launch probe, and tap any star, planet, moon or black hole as the destination. The probe leaves above escape velocity, is bent by every star on the way, corrects its course with small burns, and files a report on arrival. Probes in flight are saved with your universe.'],
  ['Rogue worlds','Planets freed by a supernova, a dying giant or a drained star drift away on their own momentum. One that passes slowly enough through another system can be captured into a new orbit there; otherwise it fades into interstellar space.'],
  ['Sharing and starting over','Share packs every star, planet, moon and name into a code. A friend pastes it into their own copy of the page to visit; their universe stays saved and Return home brings them back. New universe erases everything after a second confirmation; discoveries are kept. Everything is saved in this browser only.'],
  ['Daily challenge','Daily gives everyone the same seeded universe each day and one billion years. You may plant two extra stars and one black hole; planets, moons and probes are unlimited. Legacy score is one point per living world per million years, plus 50 per world still alive at the end and 25 per discovery made during the run. Build while the discs last, then run the clock; your sandbox is kept safe and restored when you leave.'],
  ['Getting around','The Atlas (L on a keyboard) lists every star, planet, moon, black hole, rogue world and probe; click one to fly to it. Desktop: drag to spin, scroll to zoom, right-drag or arrow keys to pan, O for Overview, Escape to deselect. Phone: one finger moves, two fingers spin, pinch to zoom; the menu can swap one-finger to spin. Selecting something makes the camera follow it; dragging away releases it, and tapping it again resumes. Zoom far enough out and the galaxy appears.'],
];
$('#guideList').innerHTML=GUIDE.map(([h,t])=>`<details><summary>${h}</summary><p>${t}</p></details>`).join('');
$('#guideBtn').addEventListener('click',()=>openSheet('#guideSheet'));
$('#guideLesson').addEventListener('click',()=>tourBegin(TOUR2,'-tour2',0));
$('#guideBasics').addEventListener('click',()=>tourBegin(TOUR1,'-tour',0));
/* mobile layout: the top bar keeps only Plant, Time and Menu; everything else moves into the menu sheet */
let mobile=false;
const RATE_NAMES=['Pause','day/s','mo/s','yr/s','kyr/s','Myr/s'];
function layout(){ const m=coarse&&Math.min(innerWidth,innerHeight)<700||innerWidth<620; if(m===mobile) return; mobile=m; document.body.classList.toggle('mobile',m);
  const tools=$('.tools'), menu=$('#menuGrid'), tg=$('#timeGrid');
  if(m){ tools.prepend($('#dailyBtn')); menu.append($('#overview'),$('#atlasBtn'),$('#guideBtn'),$('#discBtn'),$('#shareBtn'),$('#sound'),$('#slowSeg'),$('#touchSeg'),$('#reset'),$('#resetNo')); $('#touchSeg').hidden=!coarse; tg.append($('#timeSeg')); $('#timeChip').hidden=false; $('#menuChip').hidden=false; }
  else { tools.append($('#seedSeg'),$('#timeSeg'),$('#discBtn'),$('#dailyBtn'),$('#atlasBtn'),$('#guideBtn'),$('#shareBtn'),$('#sound'),$('#slowSeg'),$('#touchSeg'),$('#overview'),$('#reset'),$('#resetNo'),$('#homeBtn')); $('#touchSeg').hidden=true; $('#timeChip').hidden=true; $('#menuChip').hidden=true; closeSheets(); }
  applyCompact(); }
$('#menuChip').addEventListener('click',()=>openSheet('#menuSheet'));
$('#eventBack').addEventListener('click',eventReturn);
document.querySelectorAll('[data-slow]').forEach(b=>{ b.setAttribute('aria-pressed',String((b.dataset.slow==='1')===slowOn)); b.addEventListener('click',()=>{ slowOn=b.dataset.slow==='1'; if(!slowOn){ slowHold=0; }
  document.querySelectorAll('[data-slow]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); try{ localStorage.setItem(STORE+'-slow',slowOn?'1':'0'); }catch(e){} toast(slowOn?'The camera will fly to major events and ease time while they happen.':'Events are only mentioned; the camera and clock are yours.'); }); });
document.querySelectorAll('[data-touch]').forEach(b=>{ b.setAttribute('aria-pressed',String((b.dataset.touch==='pan')===oneFingerPan)); b.addEventListener('click',()=>{ oneFingerPan=b.dataset.touch==='pan'; applyTouch(); setHint();
  document.querySelectorAll('[data-touch]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); try{ localStorage.setItem(STORE+'-touch',oneFingerPan?'pan':'spin'); }catch(e){} }); });
$('#timeChip').addEventListener('click',()=>openSheet('#timeSheet'));
addEventListener('resize',()=>{ layout(); barH(); });
let toastT=0; function toast(msg,disc){ const t=$('#toast'); t.textContent=msg; t.classList.toggle('disc',!!disc); t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),disc?3200:2600); }
