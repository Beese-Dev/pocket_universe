/* ---------- missions and unlocks: goals drawn from the live universe; tools open up as they are completed ---------- */
const MKEY=STORE+'-missions';
let missions=null;
function missionsLoad(){ try{ missions=JSON.parse(localStorage.getItem(MKEY)||'null'); }catch(e){ missions=null; }
  if(!missions){ let veteran=false; try{ const sv=JSON.parse(localStorage.getItem(STORE)||'null'); veteran=!!(sv&&sv.stars&&(sv.stars.length>2||Object.keys(found).length>=8)); }catch(e){}
    missions={active:[],done:[],completed:0,veteran,counts:{supernovae:0,evacuated:0,massiveMade:0,tde:0,xray:0},flags:{rateMax:1,arrivals:[],survived:[],captured:0,merged:0}}; }
  missions.counts=Object.assign({supernovae:0,evacuated:0,massiveMade:0,tde:0,xray:0},missions.counts||{}); missions.flags=Object.assign({rateMax:1,arrivals:[],survived:[],captured:0,merged:0},missions.flags||{}); }
function missionsSave(){ try{ localStorage.setItem(MKEY,JSON.stringify(missions)); }catch(e){} }
function curTier(){ if(mode==='daily') return 3; return missions&&missions.veteran?3:tierFor(missions?missions.completed:0); }
function unlocked(feature){ return featureUnlocked(feature,curTier()); }
function mstat(k,n=1){ if(!missions) return; if(k in missions.counts) missions.counts[k]+=n; else if(k in missions.flags) missions.flags[k]+=n; missionsSave(); }
function missionCtx(){ return { stars:stars.map(s=>{ const hz=habitableZoneAU(luminosity(s)); return {id:s.d.uid,name:s.d.name,cls:s.d.cls,binary:!!s.d.binary,bound:!!s.d.bound,disc:hasDisc(s),
      planets:s.planets.map(p=>{ const au=p.d.orbit/15; return {id:p.d.uid,name:p.d.name,type:p.d.type,rings:!!p.d.rings,moons:p.moons.length,stage:p.d.stage||0,alive:!!p.alive,scorched:!!p.d.scorched,inHZ:au>=hz.inner&&au<=hz.outer}; })}; }),
    holes:holes.length, rogues:rogues.length, found, legacy, counts:missions.counts, flags:Object.assign({},missions.flags,{renamed:tourFlags.renamed||!!missions.flags.renamed}) }; }
let missT=0, lastCtx=null;
function missionsTick(dt){ if(!missions||mode!=='sandbox'||visiting) return; missT+=dt; if(missT<1) return; missT=0;
  const ctx=missionCtx(); let changedM=false; const tier=curTier(); lastCtx=ctx;
  missions.active=missions.active.filter(m=>{ if(missionStale(ctx,m)){ changedM=true; return false; } return true; });
  for(const m of [...missions.active]){ if(missionDone(ctx,m)){ missions.active=missions.active.filter(x=>x!==m); missions.done.push(m.id); missions.completed++; const reward=TIER_REWARD[m.tier]||50; legacy+=reward; changedM=true;
      const before=tier, after=curTier(); toast(`Mission complete: ${describeMission(m,ctx)} · +${reward} Legacy`,true); chime(880,2.2,.06,'A');
      if(after>before){ setTimeout(()=>toast(`Tier ${after} unlocked: ${UNLOCKS[after].items.join(', ')}`,true),2800); syncUnlockUI(); } } }
  if(missions.active.length<3){ const fresh=drawMissions(ctx,curTier(),missions.active.map(m=>m.id),missions.done,3-missions.active.length); if(fresh.length){ missions.active.push(...fresh); changedM=true; } }
  if(changedM){ missionsSave(); renderMissions(); updateCounts(); } }
function renderMissions(){ const el=$('#missList'); if(!el) return; const tier=curTier();
  $('#missN').textContent=`T${tier}`;
  if(!missions||mode!=='sandbox'||visiting){ el.innerHTML='<p>Missions run in your own sandbox universe.</p>'; return; }
  let h=`<p>Tier ${tier}${missions.veteran?' (veteran: everything is unlocked)':''} · ${missions.completed} completed${tier<3&&!missions.veteran?` · ${3-(missions.completed%3)} more to tier ${tier+1}`:''}</p>`;
  h+='<div class="mlist">'+(missions.active.length?missions.active.map(m=>`<div class="m"><span class="dot"></span><div><b>${describeMission(m,lastCtx||missionCtx())}</b><i>Tier ${m.tier} · +${TIER_REWARD[m.tier]} Legacy</i></div></div>`).join(''):'<p>Nothing to do right now; plant something and missions will follow.</p>')+'</div>';
  h+='<div class="rule"></div><p class="eyebrow" style="margin-bottom:6px">Unlocks</p><div class="unl">'+UNLOCKS.map(u=>`<div class="${tier>=u.tier?'on':''}"><b>Tier ${u.tier}</b><span>${u.items.join(' · ')}</span></div>`).join('')+'</div>';
  el.innerHTML=h; }
function syncUnlockUI(){ const holeBtn=$('#seedHole'); const ok=unlocked('holes'); holeBtn.disabled=!ok; holeBtn.title=ok?'Next tap on empty space plants a black hole (B)':'Black holes unlock at tier 2 (complete 6 missions)'; if(!ok&&seedMode==='hole') setSeed('off'); if(sel) updatePanel(); }
$('#missBtn').addEventListener('click',()=>{ renderMissions(); openSheet('#missSheet'); });
