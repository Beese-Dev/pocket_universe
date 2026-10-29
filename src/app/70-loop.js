/* ---------- loop ---------- */
const tmp=new THREE.Vector3(), wp=new THREE.Vector3(), delta=new THREE.Vector3(), off=new THREE.Vector3();
function worldPos(o,out){ return o.kind==='planet'?(o.smeared?o.star.group.getWorldPosition(out):o.holder.getWorldPosition(out)):o.kind==='moon'?o.mesh.getWorldPosition(out):o.group.getWorldPosition(out); }
function spinPlanet(p,dy){ if(dy<=0) return; const revs=365.25*24/(p.d.day||24); p.mesh.rotation.y+=Math.min(TAU*revs*dy,.12); }
function setSmear(p,on){ if(p.smeared===on) return; p.smeared=on; p.holder.visible=!on; const m=p.orbitLine.material; m.opacity=on?.45:.17; m.color.set(on?p.d.colors[1]:p.star.col);
  if(on&&p.smearStale) rebuildSmear(p); p.smear.visible=on;
  if(on&&!smearTold){ smearTold=true; toast('At this speed planets orbit faster than frames: each shows as a band along its orbit. Slow the clock to see them again.'); } }
let smearTold=false;
function placeLabel(o,pos,lift,alpha){
  const el=o.labelEl; if(alpha<=.01){ if(el.style.opacity!=='0') el.style.opacity='0'; return; }
  tmp.copy(pos); tmp.y+=lift; tmp.project(camera);
  if(tmp.z>1||tmp.z<-1){ el.style.opacity='0'; return; }
  el.style.transform=`translate(${((tmp.x*.5+.5)*innerWidth).toFixed(1)}px,${((-tmp.y*.5+.5)*innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
  el.style.opacity=alpha.toFixed(2);
}
let last=performance.now(), nearT=0, orbitT=0, massT=0;
function frame(t){
  requestAnimationFrame(frame);
  const dt=Math.min(.1,(t-last)/1000); last=t; now+=dt;
  const ev=eventSoon(); if(ev&&slowAnnounced!==ev.what){ slowAnnounced=ev.what; toast(ev.what); focusEvent(ev.s,ev.what,ev.s.d.catalog+':'+ev.what); } if(!ev&&slowHold<=0) slowAnnounced=null;
  if(eventView){ eventT+=dt; if(eventT>30||(keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright)) eventDismiss(); }
  slowHold=Math.max(0,slowHold-dt); const slowTarget=(ev||slowHold>0)?Math.min(.2,2000/ypr):1; /* 20% at kyr/s; at Myr/s deeper, so a 20,000-year nebula still gets ten seconds on screen */ slowK+=(slowTarget-slowK)*Math.min(1,dt*(slowTarget<slowK?6:1.5));
  if(ev) slowReason=ev.what; const badge=$('#slowBadge'); const showBadge=slowK<.9&&slowReason; if(badge.hidden===!!showBadge){ badge.hidden=!showBadge; } if(showBadge) badge.textContent=`Slow motion ${Math.round(slowK*100)>=1?Math.round(slowK*100)+'%':'<1%'} · ${slowReason}`;
  const dy=dt*ypr*slowK; simT+=dy;
  if(dy>0){ setGalaxyRot(simT); toWorld(anchorLocal,_ta).sub(controls.target); controls.target.add(_ta); camera.position.add(_ta); }
  galaxyFade(); perfTick(dt);
  orbitT+=dt; const doOrbits=orbitT>.4; if(doOrbits){ orbitT=0; if(dy>0) updateCounts(); }
  for(const s of [...stars]){
    s.d.age+=dy; s.body.rotation.y+=.04*dt;
    if(s.d.bound){ if(!s.boundHole){ s.boundHole=holes.find(h=>h.d.seed===s.d.bound.hole)||null; if(!s.boundHole) s.d.bound=null; }
      if(s.boundHole){ const b=s.d.bound,h=s.boundHole; b.angle=(b.angle+TAU/periodYears(b.r,h.d.mass+s.d.mass)*dy)%TAU;
        s.d.x=h.d.x+Math.cos(b.angle)*b.r; s.d.z=h.d.z+Math.sin(b.angle)*b.r; s.group.position.set(s.d.x,0,s.d.z); if(doOrbits&&dy>0) s.planets.forEach(rebuildOrbit); } }
    if(feeding(s)){ stepTransfer(s,s.boundHole,dy,dt); if(!stars.includes(s)) continue; } else if(s.stream) dropStream(s);
    for(const sun of s.suns){ sun.mat.uniforms.uTime.value=now; if(sun.beams) sun.beams.rotation.y+=dt*9; if(s.d.giant&&sun===s.suns[0]) sun.corona.material.color.copy(sun.col).lerp(new THREE.Color(1,.45,.2),sun.mat.uniforms.uSwell.value*.8); if(sun.flare>0){ sun.flare=Math.max(0,sun.flare-dt/2.5); } }
    if(s.pair) s.pair.rotation.y+=Math.min(TAU/periodYears(s.d.binary.sep,s.d.mass)*dy,.25);
    const a=(now-s.born)/1.4;
    let k=1;
    /* stellar evolution: main sequence, then a giant phase a tenth as long, then the end */
    const L=lifetime(s); let gf=1;
    if(isFinite(L)){ const G=L*.1, age=s.d.age, massive=primaryMass(s)>=8;
      if(age>=L+G){ massive?supernova(s):whiteDwarf(s); if(!stars.includes(s)) continue; }
      else if(age>=L){ const kk=(age-L)/G; gf=1+(massive?3:4)*easeOut(kk); s.suns[0].mat.uniforms.uSwell.value=clamp(kk*1.5);
        if(!s.d.giant){ s.d.giant=true; s.d.temp=massive?3600:3200; refreshLabel(s); slowEvent(`${s.d.name} is swelling`); focusEvent(s,`Red ${massive?'supergiant':'giant'}: ${s.d.name}`,s.d.catalog+':giant'); toast(`${s.d.name} is swelling into a red ${massive?'supergiant':'giant'}`); discover('giant'); if(sel===s) updatePanel(); }
        const Rg=s.T.r*gf*1.1; for(const p of [...s.planets]) if(p.d.orbit<Rg){ vaporise(s,p); toast(`${s.d.name} swallowed ${p.d.name}`); changed(); } } }
    s.giantF=gf;
    if(doOrbits){ updateDisc(s); updateHZ(s); if(holes.length||s.hillRing.visible) updateTidal(s); for(const p of s.planets) p.alive=!!speciesOf(p); }
    if(hasDisc(s)&&dy>0&&s.planets.length<s.d.discN&&s.d.age>2e5&&Math.random()<1-Math.exp(-dy/(DISC_LIFE*.5/s.d.discN))) growPlanet(s,true);
    if(a<1){ k=reduce?1:Math.max(.001,easeBack(clamp(a))); s.suns.forEach(sun=>{ sun.corona.material.opacity=Math.min(1,.8+(1-a)); sun.corona.scale.setScalar(sun.T.r*7*(1+(1-a)*1.6)); }); }
    else { const farK=Math.max(1,camera.position.distanceTo(s.group.getWorldPosition(_tb))/140); s.suns.forEach(sun=>{ const fl=sun.flare||0; sun.corona.material.opacity=.8+fl*.4; sun.corona.scale.setScalar(sun.T.r*7*gf*farK*(1+.035*Math.sin(now*1.2+s.d.seed)+fl*.9)); }); }
    s.body.scale.setScalar(k*gf*(s.massK||(s.d.mass0?Math.pow(s.d.mass/s.d.mass0,.6):1)));
    for(const p of s.planets){
      p.angle=(p.angle+omega(s,p.d.orbit)*dy)%TAU; orbitPos(s,p,p.angle,p.holder.position);
      setSmear(p,ypr>0&&periodYears(p.d.orbit,s.d.mass)/ypr<.6); if(p.smeared&&p.smearStale&&doOrbits) rebuildSmear(p);
      spinPlanet(p,dy); p.mat.uniforms.uTime.value=now;
      if(p.d.dust>0){ p.d.dust=Math.max(0,p.d.dust-dy/10); p.mat.uniforms.uDust.value=p.d.dust; }
      if(ypr>=1e3&&dy>0&&Math.random()<1-Math.exp(-dy/1e8)){ lp(p.holder,wp); impact(null,p,wp); }
      const g=now-p.born;
      if(g<5){ p.grow.scale.setScalar(.18+.82*easeOut(clamp(g/1.8))); p.growU.value=clamp((g-1.1)/3.2); }
      for(const m of p.moons){ const Pm=moonPeriodYears(p,m.d); m.pivot.rotation.y=(m.pivot.rotation.y+TAU/Pm*dy)%TAU; m.mesh.visible=!(ypr>0&&Pm/ypr<.4); m.mesh.material.uniforms.uTime.value=now;
        const mg=now-m.born; if(mg<3){ m.mesh.scale.setScalar(m.d.size*Math.max(.001,easeBack(clamp(mg/1.2)))); m.growU.value=clamp((mg-.6)/1.8); } }
    }
  }
  for(const h of holes){ h.disk.material.uniforms.uTime.value=now; h.arc.material.uniforms.uTime.value=now*1.3; h.ring.quaternion.copy(camera.quaternion);
    if(!stars.some(s=>s.boundHole===h&&s.stream)) h.feed=Math.max(0,h.feed-dt*.3); h.disk.material.uniforms.uFeed.value=h.feed; h.arc.material.uniforms.uFeed.value=h.feed; h.jetMat.opacity=h.feed*.45; h.jets.scale.y=.6+h.feed*.6+(reduce?0:Math.sin(now*7)*.05*h.feed);
    const a=(now-h.born)/1.2; h.group.scale.setScalar(a<1?Math.max(.001,easeOut(clamp(a))):1); }
  if(stars.length){ nextComet-=dy; if(nextComet<=0&&ypr<100&&now-lastCometReal>4){ nextComet=rand(1,4); lastCometReal=now; const withP=stars.filter(s=>s.planets.length); spawnComet(pick(withP.length?withP:stars)); } }
  for(let i=comets.length-1;i>=0;i--){ if(!stepComet(comets[i],dy)){ comets[i].dispose(); comets.splice(i,1); } }
  for(let i=rogues.length-1;i>=0;i--){ const p=rogues[i]; if(p&&p.rogue&&!stepRogue(p,dy)) changed(); }
  for(let i=remnants.length-1;i>=0;i--){ if(!stepRemnant(remnants[i],dy)) remnants.splice(i,1); }
  if(dy>0) for(const pr of [...probes]){ if(probes.includes(pr)) stepProbe(pr,dy); }
  for(let i=effects.length-1;i>=0;i--){ const e=effects[i]; e.t+=dt; if(e.t>=e.life){ e.done(); effects.splice(i,1); } else e.step(dt); }

  if(sel){ worldPos(sel,wp);
    if(following){ delta.copy(wp).sub(controls.target); const k=delta.length()<2?1:1-Math.exp(-dt*(reduce?30:4.5));
      delta.multiplyScalar(k); controls.target.add(delta); camera.position.add(delta); }
    marker.position.copy(wp); marker.quaternion.copy(camera.quaternion);
    const r=sel.kind==='star'?(sel.d.binary&&sel.d.cls!=='P'&&sel.d.cls!=='D'?sel.d.binary.sep/2+sel.T.r*1.6:sel.T.r*1.9*(sel.giantF||1)):sel.kind==='hole'?sel.r*5:sel.d.size*(sel.d.rings?2.6:1.75);
    marker.scale.setScalar(r*(1+.035*Math.sin(now*3)));
    const camD=camera.position.distanceTo(wp); marker.material.opacity=sel.kind==='planet'?(sel.smeared?0:clamp((camD-sel.d.size*4)/(sel.d.size*4))*.7):.7;
  }
  if(desiredDist!==null){ off.copy(camera.position).sub(controls.target); const L=off.length(), nl=L+(desiredDist-L)*(1-Math.exp(-dt*(reduce?30:2.6)));
    off.setLength(nl); camera.position.copy(controls.target).add(off); if(Math.abs(nl-desiredDist)<desiredDist*.01) desiredDist=null; }
  keyPan(dt);
  if(overviewTarget){ delta.copy(overviewTarget).sub(controls.target); const k=delta.length()<.5?1:1-Math.exp(-dt*3); delta.multiplyScalar(k); controls.target.add(delta); camera.position.add(delta); if(k===1) overviewTarget=null; }
  _ta2.copy(controls.target); controls.update(); if(sel&&following&&controls.target.distanceTo(_ta2)>camera.position.distanceTo(controls.target)*.003) following=false; /* the player dragged away: stop chasing */
  world.worldToLocal(anchorLocal.copy(controls.target));
  sky.position.copy(camera.position);

  /* ambient: follow whatever is nearest the camera's focus */
  nearT+=dt; if(nearT>.5){ nearT=0; let best=null,bd=1e9,isHole=false; world.worldToLocal(_tb.copy(controls.target));
    for(const s of stars){ const d=s.group.position.distanceTo(_tb); if(d<bd){ bd=d; best=s; isHole=false; } }
    for(const h of holes){ const d=h.group.position.distanceTo(_tb)*.7; if(d<bd){ bd=d; best=h; isHole=true; } }
    if(best) droneSet(isHole?34:best.T.hz/4,isHole?'hole':best.d.cls); nearPulsar=best&&!isHole&&best.d.cls==='P'; }
  if(nearPulsar&&soundOn&&drone&&now>nextTick){ tick(); nextTick=now+.36; }
  tourTick(dt); atlasTick(dt); dailyTick(dy); if(doOrbits) dailyStatus();
  if(sel&&sel.kind==='hole'&&sel.feed>0&&massT++%30===0) updatePanel();
  if(sel&&sel.kind==='star'&&massT%20===0) updateHZ(sel);
  if(sel&&sel.kind==='star'){ const f=document.getElementById('pFate'), ag=document.getElementById('pAge'); if(f) f.textContent=fateText(sel); if(ag) ag.textContent=fmtYears(sel.d.age); if(feeding(sel)&&massT++%30===0) updatePanel(); }

  for(const s of stars){
    s.group.getWorldPosition(_ta); const dS=camera.position.distanceTo(_ta);
    placeLabel(s,_ta,(s.d.binary&&s.d.cls!=='P'&&s.d.cls!=='D'?s.d.binary.sep/2:0)+s.T.r*(s.giantF||1)*1.55,clamp((now-s.born-.6)/.6)*(sel===s?1:clamp((2600-dS)/1200)));
    const sysOn=sel&&(sel===s||sel.star===s);
    for(const p of s.planets){
      if(p.smeared){ /* label the band at the orbit's far side so smeared worlds stay identifiable */ orbitPos(s,p,Math.PI*.5,_loc); _loc.add(s.group.position); toWorld(_loc,wp); const dP=camera.position.distanceTo(wp);
        placeLabel(p,wp,p.d.size+.6,(sysOn?.9:clamp((160-dP)/60))*.8); continue; }
      p.holder.getWorldPosition(wp); const dP=camera.position.distanceTo(wp);
      const vis=sysOn?1:clamp((90-dP)/30); const close=clamp((dP-p.d.size*3)/(p.d.size*3));
      placeLabel(p,wp,p.d.size*(p.d.rings?1.4:1.25)+.4,vis*close*clamp((now-p.born-1.2)/.8));
      for(const m of p.moons){ if(!m.mesh.visible){ m.labelEl.style.opacity='0'; continue; } m.mesh.getWorldPosition(_tb); const dM=camera.position.distanceTo(_tb);
        placeLabel(m,_tb,m.d.size*1.3+.15,(sel===m||sel===p?1:clamp((p.d.size*14-dM)/(p.d.size*5)))*clamp((dM-m.d.size*3)/(m.d.size*3))); } }
  }
  for(const h of holes){ h.group.getWorldPosition(_ta); const d=camera.position.distanceTo(_ta); placeLabel(h,_ta,h.r*5.2,clamp((now-h.born-.4)/.6)*(sel===h?1:clamp((2600-d)/1200))); }
  for(const p of rogues){ p.holder.getWorldPosition(_ta); const dP=camera.position.distanceTo(_ta); placeLabel(p,_ta,p.d.size*1.25+.4,(sel===p?1:clamp((160-dP)/50))*clamp((dP-p.d.size*3)/(p.d.size*3))); }
  composer.render();
}
let nearPulsar=false;

function start(snap){
  const state=(snap&&Array.isArray(snap.stars))?snap:(loadSaved()||sample());
  loadState(state); desiredDist=null;
  try{ const sv=localStorage.getItem(STORE+'-sound'); if(sv==='0'){ soundOn=false; $('#sound').setAttribute('aria-pressed','false'); $('#soundT').textContent='Sound off'; $('#wave').style.display='none'; } }catch(e){}
  renderDisc(); layout(); barH(); try{ if(localStorage.getItem(STORE+'-tour')==='1'&&!localStorage.getItem(STORE+'-lessons')) tourSave({lesson:2,step:0}); }catch(e){} setTimeout(tourStart,1200);
  requestAnimationFrame(t=>{ last=t; frame(t); });
}
try{ window.claude?.hot?.snapshot?.(()=>serialize()); }catch(e){}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
