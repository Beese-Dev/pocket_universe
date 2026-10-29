/* ---------- supernova ---------- */
function scorch(p){ const d=p.d; d.type='lava'; d.scorched=true; d.clouds=false; d.colors=pick(PALETTES.lava).map(jitter); d.atmo=ATMO.lava;
  const u=p.mat.uniforms; u.uType.value=3; u.uClouds.value=0; u.uA.value.set(d.colors[0]); u.uB.value.set(d.colors[1]); u.uC.value.set(d.colors[2]); p.atmo.material.uniforms.uColor.value.set(d.atmo);
  if(p.ring){ p.tilt.remove(p.ring); p.ring=null; d.rings=false; } }
function killMoon(m){ m.labelEl.remove(); hitTargets=hitTargets.filter(x=>x!==m.hit); if(sel===m) select(m.planet); }
function killPlanet(p){ p.labelEl.remove(); hitTargets=hitTargets.filter(x=>x!==p.hit); p.moons.forEach(killMoon); }
function stripMoons(p){ if(!p.moons.length) return; burst(lp(p.holder,new THREE.Vector3()),new THREE.Color(.85,.85,.95),40,4,.35);
  for(const m of p.moons){ killMoon(m); p.holder.remove(m.pivot.parent); } p.moons=[]; p.d.moons=[]; }
function detachPlanet(s,p){ s.group.remove(p.orbitLine); s.planets=s.planets.filter(x=>x!==p); s.d.planets=s.d.planets.filter(x=>x!==p.d); }
function vaporise(s,p){ const w=lp(p.holder,new THREE.Vector3()); burst(w,new THREE.Color(p.d.colors[1]).lerp(new THREE.Color(1,.8,.6),.5),140,9,.6);
  detachPlanet(s,p); s.group.remove(p.holder); killPlanet(p); if(sel===p||(sel&&sel.kind==='moon'&&sel.planet===p)) select(s); }
function fling(s,p,kick){ const a=p.angle, v=omega(s,p.d.orbit)*p.d.orbit; kick*=40; /* orbital speed in units per year, under the star's mass as it was */
  detachPlanet(s,p); world.attach(p.holder);
  p.rogue={vel:new THREE.Vector3(-Math.sin(a)*v+Math.cos(a)*kick,0,Math.cos(a)*v+Math.sin(a)*kick),from:s.d.name,origin:s.group.position.clone()};
  rogues.push(p); refreshLabel(p); }
function supernova(s){
  const pos=s.group.position.clone(), col=new THREE.Color(1,.85,.7); slowEvent(`${s.d.name} went supernova`); focusEvent(s,`Supernova: ${s.d.name}`,s.d.catalog+':sn');
  burst(pos,col,600,42,1.5); shock(pos,new THREE.Color(.8,.9,1),170); flash(pos,110); boom(1,pos);
  const Rv=s.T.r*4.5, lost=[], cores=[], flung=[];
  for(const p of [...s.planets]){ const d=p.d;
    stripMoons(p);
    if(d.orbit<Rv&&d.type!=='gas'){ vaporise(s,p); lost.push(d.name); continue; }
    if(d.orbit<Rv){ d.core=true; d.size=+(d.size*.35).toFixed(2); p.mesh.scale.setScalar(d.size); p.atmo.scale.setScalar(d.size*1.08); p.hit.scale.setScalar(Math.max(d.size*1.8,1.6)); cores.push(d.name); }
    scorch(p); fling(s,p,2.5+rand(0,2)); flung.push(d.name);
  }
  const d=s.d; const hadBinary=!!d.binary; const M=primaryMass(s); const collapse=M>20;
  makeRemnant({x:pos.x,z:pos.z,t:0,seed:rand(0,60),kind:0});
  const parts=[]; if(lost.length) parts.push(`${lost.join(', ')} vaporised`); if(cores.length) parts.push(`${cores.join(', ')} stripped to the core`); if(flung.length) parts.push(`${flung.length} world${flung.length===1?'':'s'} flung loose`);
  if(collapse){ dropStream(s); world.remove(s.group); s.labelEl.remove(); stars=stars.filter(x=>x!==s); hitTargets=hitTargets.filter(x=>x!==s.hit); if(sel===s) select(null);
    const h=makeHole({name:d.name,mass:+(M*.3).toFixed(1),x:pos.x,z:pos.z,seed:rand(0,60)},true); rebuildAllOrbits(); bindNearby(h); eventKey=null; focusEvent(h,`Collapse: ${d.name} became a black hole`,h.d.seed+':collapse');
    toast(`${d.name} went supernova. ${parts.length?parts.join('; ')+'.':''} Its core collapsed into a black hole.`); discover('collapse'); discover('hole'); }
  else { d.binary=null; d.cls='P'; d.temp=Math.round(rand(6,12))*100000; d.mass=1.4; d.age=0; d.giant=false; s.giantF=1; s.suns.forEach(x=>x.mat.uniforms.uSwell.value=0);
    buildBody(s); refreshLabel(s);
    toast(`${d.name} went supernova. ${parts.length?parts.join('; ')+'.':''} A pulsar remains.`); discover('pulsar'); }
  discover('supernova'); if(flung.length){ discover('scorched'); discover('rogue'); } if(cores.length) discover('core');
  if(hadBinary) setTimeout(()=>toast('Its companion star was thrown clear of the blast.'),3500);
  updatePanel(); changed();
}
function whiteDwarf(s){ const d=s.d, pos=s.group.position.clone(), M0=d.mass; slowEvent(`${d.name} shed its outer layers`); focusEvent(s,`Planetary nebula: ${d.name}`,d.catalog+':wd');
  burst(pos,s.col,320,14,.9); shock(pos,new THREE.Color(.5,1,.85),70); flash(pos,40); chime(s.T.hz*2,3,.06,'D');
  makeRemnant({x:pos.x,z:pos.z,t:0,seed:rand(0,60),kind:1});
  const Mwd=whiteDwarfMass(M0); const flung=[];
  for(const p of [...s.planets]){ if(unbindsPlanets(M0,Mwd)){ stripMoons(p); fling(s,p,.4); flung.push(p.d.name); } else { p.d.orbit=+(p.d.orbit*M0/Mwd).toFixed(2); } }
  d.binary=null; d.cls='D'; d.mass=Mwd; d.temp=Math.round(rand(20,40))*1000; d.age=0; d.giant=false; s.giantF=1;
  buildBody(s); s.planets.forEach(rebuildOrbit); refreshLabel(s);
  toast(`${d.name} shed its outer layers. A white dwarf remains${flung.length?`; ${flung.length} world${flung.length===1?'':'s'} drift free`:'; its surviving orbits widen'}.`);
  discover('whitedwarf'); discover('nebula'); if(flung.length) discover('rogue'); updatePanel(); changed(); }
function makeRogue(rd){ const s=stars.find(x=>x.d.name===rd.from)||stars[0]; if(!s) return;
  const p=makePlanet(s,rd.d,false); detachPlanet(s,p); world.attach(p.holder); p.holder.position.set(rd.x,0,rd.z);
  p.rogue={vel:new THREE.Vector3(rd.vx,0,rd.vz),from:rd.from,origin:new THREE.Vector3(rd.ox,0,rd.oz)}; rogues.push(p); refreshLabel(p); }
function removeRogue(p){ world.remove(p.holder); killPlanet(p); rogues=rogues.filter(x=>x!==p); if(sel===p) select(p.star); }
function capture(p,o,dist){
  rogues=rogues.filter(x=>x!==p); o.group.attach(p.holder);
  p.star=o; p.rogue=null; p.d.orbit=+dist.toFixed(2); p.angle=Math.atan2(p.holder.position.z,p.holder.position.x);
  const og=new THREE.BufferGeometry(); og.setAttribute('position',new THREE.BufferAttribute(new Float32Array(161*3),3));
  p.orbitLine=new THREE.Line(og,new THREE.LineBasicMaterial({color:o.col,transparent:true,opacity:.17,depthWrite:false})); o.group.add(p.orbitLine);
  p.mat.uniforms.uStarPos.value=o.group.position; p.mat.uniforms.uStarCol.value=o.lightCol; p.atmo.material.uniforms.uStarPos.value=o.group.position;
  o.planets.push(p); o.planets.sort((a,b)=>a.d.orbit-b.d.orbit); o.d.planets=o.planets.map(x=>x.d);
  rebuildOrbit(p); refreshLabel(p); toast(`${o.d.name} captured ${p.d.name}`); focusEvent(p,`${o.d.name} captured a rogue world`,p.d.seed+':cap'); chime(o.T.hz*.75,2.2,.05,o.d.cls); discover('captured'); updatePanel(); changed(); }
function stepRogue(p,dy){ const r=p.rogue, h=p.holder.position;
  _v.copy(p.star.group.position).sub(h); const d2=_v.lengthSq()+1; _v.normalize().multiplyScalar(GM_UNITS*p.star.d.mass/d2*dy); r.vel.add(_v);
  h.addScaledVector(r.vel,dy); spinPlanet(p,dy); p.mat.uniforms.uTime.value=now;
  for(const bh of holes){ if(h.distanceTo(bh.group.position)<bh.r*3.2){ burst(h,new THREE.Color(p.d.colors[1]),120,8,.6); flash(bh.group.position,bh.r*8); toast(`${bh.d.name} tore ${p.d.name} apart`); growHole(bh,.1); removeRogue(p); return false; } }
  for(const o of stars){ if(o===p.star) continue; const dist=h.distanceTo(o.group.position);
    if(dist<outerR(o)+9&&dist>innerR(o)+2&&o.planets.length<8&&r.vel.length()<omega(o,dist)*dist*1.9){ capture(p,o,dist); return false; } }
  const far=h.distanceTo(r.origin); if(far>210){ toast(`${p.d.name} drifted into interstellar space`); removeRogue(p); return false; }
  p.grow.scale.setScalar(clamp((210-far)/45)); return true; }
const REM_GEO=new THREE.SphereGeometry(1,64,48);
function remLife(d){ return d.kind===1?2e4:5e4; }
function makeRemnant(d){ d.kind=d.kind||0; const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:d.t},uLife:{value:remLife(d)},uSeed:{value:d.seed},uKind:{value:d.kind}},vertexShader:VS,fragmentShader:REM_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(REM_GEO,mat); mesh.position.set(d.x,0,d.z); mesh.renderOrder=2; world.add(mesh); remnants.push({d,mesh,mat}); }
function stepRemnant(r,dy){ r.d.t+=dy; const L=remLife(r.d); if(r.d.t>L){ world.remove(r.mesh); r.mat.dispose(); return false; } r.mat.uniforms.uT.value=r.d.t; const k=r.d.t/L;
  r.mesh.scale.setScalar(r.d.kind===1?3+25*Math.sqrt(k):5+70*Math.pow(k,.4)); return true; }
