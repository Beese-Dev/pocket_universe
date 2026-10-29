/* ---------- selection + panel ---------- */
const panel=$('#panel'), pName=$('#pName'), pStats=$('#pStats'), pNotes=$('#pNotes'), pNotesBtn=$('#pNotesBtn'), pProbe=$('#pProbe'), pCard=$('#pCard'), pPrimary=$('#pPrimary'), pSecondary=$('#pSecondary'), hint=$('#hint');
let notesOpen=false;
function minDistFor(o){ return !o?3:o.kind==='star'?o.T.r*1.6*(o.giantF||1):o.kind==='hole'?o.r*2.2:o.d.size*1.22; }
function moonPeriodDays(m){ return moonPeriodYears(m.planet,m.d)*365.25; }
function select(o,zoom=true){
  if(sel&&sel.labelEl) sel.labelEl.classList.remove('sel');
  if(o&&o!==sel) panelCompact=true; following=true;
  sel=o; marker.visible=!!o; controls.minDistance=minDistFor(o);
  if(o){ o.labelEl.classList.add('sel');
    if(zoom) desiredDist=o.kind==='star'?Math.max(42,outerR(o)*2.5):o.kind==='hole'?o.r*14:o.kind==='moon'?o.d.size*9+1:(o.d.rings?o.d.size*12:o.d.size*10)+7; }
  updatePanel();
}
function stat(k,v){ return `<div><dt>${k}</dt><dd>${v}</dd></div>`; }
function fateText(s){ const d=s.d; if(feeding(s)){ const y=(d.mass-.08)/transferRate(s,s.boundHole); return `consumed in ${fmtYears(y)}${realAt(y)}`; }
  const L=lifetime(s); if(!isFinite(L)) return 'stable for longer than the universe';
  const massive=primaryMass(s)>=8, G=L*.1;
  if(d.age<L){ const y=L-d.age; return `${massive?'red supergiant':'red giant'} in ${fmtYears(y)}${realAt(y)}`; }
  const y=L+G-d.age; return `${massive?(primaryMass(s)>20?'collapse to a black hole':'supernova'):'white dwarf'} in ${fmtYears(y)}${realAt(y)}`; }
let panelCompact=true;
$('#pMore').addEventListener('click',()=>{ panelCompact=!panelCompact; applyCompact(); });
function applyCompact(){ const on=mobile&&panelCompact; panel.classList.toggle('compact',on); $('#pMore').textContent=on?'More':'Less'; $('#pMore').setAttribute('aria-expanded',String(!on)); }
function updatePanel(){ applyCompact();
  hint.hidden=!!sel||tour.i!==-1; panel.hidden=!sel; if(!sel) return;
  const sw=$('#pSw');
  if(document.activeElement!==pName) pName.value=sel.d.name;
  pNotesBtn.hidden=sel.kind!=='planet'; pNotes.hidden=!(sel.kind==='planet'&&notesOpen); pNotesBtn.setAttribute('aria-expanded',String(notesOpen));
  pProbe.hidden=!((sel.kind==='planet'&&!sel.rogue&&!sel.smeared)||(sel.kind==='moon'&&!sel.planet.smeared)); pCard.hidden=!(sel.kind==='planet'||sel.kind==='moon');
  if(sel.kind==='star'){ const s=sel,d=s.d;
    sw.style.color=s.T.col; $('#pKind').textContent=`Star · ${d.catalog}`;
    const fate=`<div><dt>Fate</dt><dd id="pFate">${fateText(s)}</dd></div>`+(hasDisc(s)?stat('Disc',`dissipates in ${fmtYears(DISC_LIFE-d.age)}`):'');
    const cls=d.cls==='P'?'Pulsar':d.cls==='D'?'White dwarf':d.giant?`${d.cls} · red ${primaryMass(s)>=8?'supergiant':'giant'}`:d.binary?`${d.cls}+${d.binary.cls} · binary`:`${d.cls} · ${s.T.desc}`;
    pStats.innerHTML=stat('Class',cls)+stat('Surface',`${d.temp.toLocaleString('en-US')} K`)+stat('Mass',`${d.mass.toFixed(2)} M☉`)+stat('Planets',`${s.planets.length} of 8`)+`<div><dt>Age</dt><dd id="pAge">${fmtYears(d.age)}</dd></div>`+fate;
    pPrimary.textContent=s.planets.length>=8?'System is full':hasDisc(s)?'Grow a planet':'Disc dissipated'; pPrimary.disabled=s.planets.length>=8||!hasDisc(s);
    pSecondary.textContent='See whole system';
  } else if(sel.kind==='hole'){ const h=sel,d=h.d; const n=stars.filter(s=>s.boundHole===h).length;
    sw.style.color='#ff9a4a'; $('#pKind').textContent='Black hole';
    pStats.innerHTML=stat('Mass',`${d.mass.toFixed(1)} M☉`)+stat('Horizon',`${(d.mass*2.95).toFixed(1)} km`)+stat('Bound stars',`${n}`)+stat('Disk',`${Math.round(1e6+d.mass*2e5).toLocaleString('en-US')} K`);
    pPrimary.textContent='Fly closer'; pPrimary.disabled=false; pSecondary.textContent='Evaporate';
  } else if(sel.kind==='moon'){ const m=sel,d=m.d,p=m.planet;
    sw.style.color=d.colors?d.colors[1]:'#bdb9c2'; $('#pKind').textContent=`Moon · ${p.d.name}`;
    const days=moonPeriodDays(m);
    pStats.innerHTML=stat('Orbit',`${(d.orbit/p.d.size).toFixed(1)} planet radii`)+stat('Period',days<2?`${(days*24).toFixed(0)} h`:`${days.toFixed(1)} days`)+stat('Radius',`${Math.round(d.size*1.15*6371).toLocaleString('en-US')} km`)+stat('Parent',p.d.name);
    pPrimary.textContent='Fly down'; pPrimary.disabled=false; pSecondary.textContent=`Back to ${p.d.name}`;
  } else if(sel.rogue){ const p=sel,d=p.d,r=p.rogue;
    sw.style.color=d.colors[1]; $('#pKind').textContent=planetKind(p);
    pStats.innerHTML=stat('Speed',`${(r.vel.length()/15*4.74).toFixed(1)} km/s`)+stat('From',r.from)+stat('Travelled',`${(p.holder.position.distanceTo(r.origin)/15).toFixed(1)} AU`)+stat('Radius',`${(d.size*1.15).toFixed(2)} R⊕`);
    if(notesOpen) pNotes.innerHTML=notesFor(p).rows.map(([k,v])=>`<div><dt>${k}</dt><dd class="${k==='Life'?'sp':''}">${v}</dd></div>`).join('');
    pPrimary.textContent='Fly down'; pPrimary.disabled=false; pSecondary.textContent='Let it go';
  } else { const p=sel,d=p.d,au=d.orbit/15,yr=periodYears(d.orbit,p.star.d.mass);
    sw.style.color=d.colors[1]; $('#pKind').textContent=planetKind(p)+(p.smeared?' · too fast to see':'');
    pStats.innerHTML=stat('Orbit',`${au.toFixed(2)} AU`)+stat('Year',yr<2?`${Math.round(yr*365.25).toLocaleString('en-US')} days`:`${yr<100?yr.toFixed(1):Math.round(yr).toLocaleString('en-US')} years`)+
      stat('Radius',`${(d.type==='gas'?d.size*4.4:d.size*1.15).toFixed(2)} R⊕`)+stat('Moons',`${p.moons.length}${d.rings?' · ringed':''}`);
    if(notesOpen) pNotes.innerHTML=notesFor(p).rows.map(([k,v])=>`<div><dt>${k}</dt><dd class="${k==='Life'?'sp':''}">${v}</dd></div>`).join('');
    pPrimary.textContent=p.moons.length>=4?'Moon limit reached':'Add a moon'; pPrimary.disabled=p.moons.length>=4;
    pSecondary.textContent='Fly down';
  }
}
function flyDown(p){ if(p.smeared){ toast('Slow time down to visit a planet'); return; } following=true; desiredDist=p.d.size*(p.d.rings?3.2:2.3); toast(`Descending toward ${p.d.name}. Drag to look around.`); }
pPrimary.addEventListener('click',()=>{ if(!sel) return; following=true; if(sel.kind==='star') growPlanet(sel); else if(sel.kind==='hole') desiredDist=sel.r*4.5; else if(sel.kind==='moon') desiredDist=sel.d.size*2.4; else if(sel.rogue) flyDown(sel); else addMoon(sel); });
pSecondary.addEventListener('click',()=>{ if(!sel) return; following=true; if(sel.kind==='star') desiredDist=Math.max(42,outerR(sel)*2.6); else if(sel.kind==='hole') removeHole(sel); else if(sel.kind==='moon') select(sel.planet); else if(sel.rogue) select(sel.star); else flyDown(sel); });
pProbe.addEventListener('click',()=>{ if(!sel||(sel.kind!=='planet'&&sel.kind!=='moon')) return; probeFrom=sel; toast(`Probe armed on ${sel.d.name}. Tap a destination: any star, planet, moon or black hole.`); hint.hidden=false; hint.innerHTML='<span><b>Tap a destination</b> for the probe · tap empty space to cancel</span>'; });
pCard.addEventListener('click',()=>postcard(sel));
pNotesBtn.addEventListener('click',()=>{ notesOpen=!notesOpen; panelCompact=false; updatePanel(); });
$('#pClose').addEventListener('click',()=>select(null));
pName.addEventListener('input',()=>{ if(!sel) return; tourFlags.renamed=true; const v=pName.value.trim(); sel.d.name=v||sel.d.name; refreshLabel(sel); changed(); });
pName.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key==='Escape'){ pName.blur(); } e.stopPropagation(); });
pName.addEventListener('blur',()=>{ if(sel) pName.value=sel.d.name; });
addEventListener('keydown',e=>{ if(e.key==='Escape'){ if([...document.querySelectorAll('.sheet')].some(x=>!x.hidden)) closeSheets(); else if(probeFrom){ probeFrom=null; setHint(); toast('Probe stood down.'); } else if(sel) select(null); } });

function setHint(){ const what=seedMode==='hole'?'plant a black hole':'plant a star';
  hint.innerHTML=(coarse
    ?[`<span><b>Tap empty space</b> to ${what}</span>`,'<span><b>Tap a star twice</b> to grow a planet</span>',oneFingerPan?'<span>One finger moves · two fingers spin · pinch to zoom</span>':'<span>One finger spins · two fingers move · pinch to zoom</span>']
    :[`<span><b>Click empty space</b> to ${what}</span>`,'<span><b>Click a star twice</b> to grow a planet</span>','<span>Drag to spin · scroll to zoom · right-drag or arrow keys to pan</span>']).join(''); }
setHint();

/* a first-minute tour, shown once */
const TOUR1=[
  {t:'Welcome to Starcradle, your own small universe. Two systems are already here. Tap anywhere in empty space to plant a star of your own.',done:()=>stars.length>tour.n0},
  {t:'A new star is born with a disc of dust and gas. Tap the star again, or press Grow a planet, to condense a world out of it.',done:()=>countPlanets()>tour.p0},
  {t:'Tap a planet to select it, then open Field notes to read its weather, gravity, and whether anything lives there.',done:()=>notesOpen&&sel&&sel.kind==='planet'},
  {t:'Time runs on the dial at the top. Try Myr/s and watch stars age. The faint green band around each star is where liquid water can exist.',done:()=>rateIdx===4},
  {t:'That is the basics. The next lesson covers moons, black holes, probes and sharing, or open the Guide from the menu whenever you like.',done:null,next:'Next lesson'},
];
const TOUR2=[
  {t:'Going further. Planets form only while a star still has its disc, up to eight. Select a planet and press Add a moon; moons can be selected and renamed too.',done:()=>countMoons()>tour.m0},
  {t:'Anything can be renamed: tap the name at the top of the panel, type, and press Enter. Names appear in space and in share codes.',done:()=>tourFlags.renamed},
  {t:'Switch Plant to Black hole and tap open space near a system. Orbits bend toward it, nearby stars begin to circle it, and anything that strays too close is torn apart.',done:()=>holes.length>tour.h0},
  {t:'Select a star and read its Fate. Set the clock to Myr/s to watch it happen: red giants swallow their inner worlds, massive stars explode. Pause with the dial or the space bar.',done:()=>rateIdx===4&&sel&&sel.kind==='star'},
  {t:'Select a planet or a moon and press Launch probe, then tap any destination. The probe flies a real gravity-bent path and reports back on arrival.',done:()=>tourFlags.probe},
  {t:'Share in the menu packs your whole universe into a code a friend can paste to visit. New universe wipes the slate; it asks twice, and your discoveries survive.',done:()=>tourFlags.share},
  {t:'You know the controls now. Comets, impacts, X-ray binaries and galaxy-scale drift happen on their own; Discoveries lists everything left to find.',done:null},
];
const tourFlags={renamed:false,probe:false,share:false};
const tour={i:-1,n0:0,p0:0,m0:0,h0:0,t:0,list:TOUR1,key:'-tour'};
function countPlanets(){ return stars.reduce((a,s)=>a+s.planets.length,0); }
function countMoons(){ return stars.reduce((a,s)=>a+s.planets.reduce((b,p)=>b+p.moons.length,0),0); }
function tourSnap(){ tour.n0=stars.length; tour.p0=countPlanets(); tour.m0=countMoons(); tour.h0=holes.length; }
function tourShow(i){ const L=tour.list; tour.i=i; if(i>=L.length){ tourEnd(true); return; } const st=L[i]; tourSave({lesson:L===TOUR2?2:1,step:i}); $('#tourText').textContent=st.t; $('#tourDots').textContent=`${i+1} / ${L.length}`;
  $('#tourNext').textContent=st.next||(i===L.length-1?'Finish':'Next'); $('#tour').hidden=false; hint.hidden=true; }
/* lessons come back on every visit, resuming where you left off, until both are finished or you ask them not to */
function tourState(){ try{ return JSON.parse(localStorage.getItem(STORE+'-lessons')||'{}')||{}; }catch(e){ return {}; } }
function tourSave(patch){ try{ localStorage.setItem(STORE+'-lessons',JSON.stringify(Object.assign(tourState(),patch))); }catch(e){} }
function tourBegin(list,key,step){ closeSheets(); tour.list=list; tour.key=key; tourSnap(); $('#tourNever').checked=false; tourShow(step||0); }
function tourStart(){ if(visiting) return; const st=tourState(); if(st.never||st.done) return;
  if(st.lesson===2) tourBegin(TOUR2,'-tour2',Math.min(st.step||0,TOUR2.length-1)); else tourBegin(TOUR1,'-tour',Math.min(st.step||0,TOUR1.length-1)); }
function tourEnd(finished){ const list=tour.list; tour.i=-1; $('#tour').hidden=true; hint.hidden=!!sel;
  if($('#tourNever').checked) tourSave({never:true});
  else if(finished&&list===TOUR2) tourSave({done:true});
  else if(finished&&list===TOUR1) tourSave({lesson:2,step:0}); }
function tourTick(dt){ if(tour.i<0) return; tour.t+=dt; if(tour.t<.5) return; tour.t=0; const st=tour.list[tour.i]; if(st.done&&st.done()){ tourSnap(); const nxt=tour.i+1; tour.i=-2; setTimeout(()=>{ if(tour.i===-2) tourShow(nxt); },900); } }
$('#tourNext').addEventListener('click',()=>{ const st=tour.list[Math.max(tour.i,0)]; if(st&&st.next){ tourEnd(true); tourBegin(TOUR2,'-tour2'); return; } tourSnap(); tourShow(Math.max(tour.i,0)+1); });
$('#tourSkip').addEventListener('click',()=>tourEnd(false));
$('#tourNever').addEventListener('change',e=>{ if(e.target.checked){ tourSave({never:true}); toast('Lessons hidden. Replay them any time from the Guide.'); } else tourSave({never:false}); });
