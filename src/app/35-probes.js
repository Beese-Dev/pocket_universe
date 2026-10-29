/* ---------- probes: a real trajectory under every star's gravity ---------- */
let probes=[], probeFrom=null; const _rel=new THREE.Vector3(), _tv=new THREE.Vector3();
function targetRadius(o){ return o.kind==='star'?o.T.r*(o.giantF||1)*2.2:o.kind==='hole'?o.r*3:o.kind==='moon'?o.d.size*2.5+.4:o.d.size*2.2+.6; }
function targetObj(o){ return o.kind==='star'||o.kind==='hole'?o.group:o.kind==='moon'?o.mesh:o.holder; }
function findTarget(kind,name){ if(kind==='star') return stars.find(s=>s.d.name===name); if(kind==='hole') return holes.find(h=>h.d.name===name);
  for(const s of stars) for(const p of s.planets){ if(kind==='planet'&&p.d.name===name) return p; if(kind==='moon'){ const m=p.moons.find(m=>m.d.name===name); if(m) return m; } }
  if(kind==='planet') return rogues.find(p=>p.d.name===name); return null; }
function makeProbe(pd){
  const head=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xbfffe8,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); head.scale.setScalar(1.3);
  const N=60, P=new Float32Array(N*3), C=new Float32Array(N*3); for(let i=0;i<N;i++){ const k=Math.pow(1-i/N,1.5)*.9; C.set([k*.6,k,k*.8],i*3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
  const trail=new THREE.Points(g,new THREE.PointsMaterial({size:.7,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  world.add(head,trail); const pr={d:pd,head,trail,P,N,filled:0,pos:new THREE.Vector3(pd.x,0,pd.z),vel:new THREE.Vector3(pd.vx,0,pd.vz),g};
  head.position.copy(pr.pos); probes.push(pr); return pr; }
function dropProbe(pr){ world.remove(pr.head,pr.trail); pr.g.dispose(); probes=probes.filter(x=>x!==pr); }
function launchProbe(o,target){
  const p=o.kind==='moon'?o.planet:o;
  const from=lp(targetObj(o),new THREE.Vector3()), to=lp(targetObj(target),new THREE.Vector3());
  const dir=to.clone().sub(from); const dist=dir.length(); dir.normalize();
  const s=p.star; const vOrb=omega(s,p.d.orbit)*p.d.orbit; const a=p.angle; const orbital=new THREE.Vector3(-Math.sin(a),0,Math.cos(a)).multiplyScalar(vOrb);
  /* a moon is a cheaper launch site: no deep planetary gravity well to climb out of */
  const dv=Math.max(vOrb*(o.kind==='moon'?2.0:2.2),Math.sqrt(2*GM_UNITS*s.d.mass/Math.max(p.d.orbit,1))*(o.kind==='moon'?1.05:1.15));
  const vel=orbital.add(dir.multiplyScalar(dv));
  const pd={x:from.x,z:from.z,vx:vel.x,vz:vel.z,from:o.d.name,tk:target.kind,tn:target.d.name,t0:simT,d0:dist,ox:from.x,oz:from.z,name:`${o.d.name} probe`};
  makeProbe(pd); tourFlags.probe=true; chime(1320,1.6,.05,'A'); toast(`${pd.name} launched toward ${target.d.name} at ${(dv/15*4.74).toFixed(0)} km/s`); discover('probe'); changed(); }
function stepProbe(pr,dy){ const d=pr.d; const target=findTarget(d.tk,d.tn);
  if(!target){ toast(`${d.name} lost its destination`); dropProbe(pr); return false; }
  const to=lp(targetObj(target),_ta);
  if(pr.lastTo) _tv.copy(to).sub(pr.lastTo).divideScalar(Math.max(dy,1e-9)); else { _tv.set(0,0,0); pr.lastTo=new THREE.Vector3(); } pr.lastTo.copy(to); if(_tv.length()>2000) _tv.set(0,0,0); /* the destination's own velocity */
  const spd0=pr.vel.length(); if(spd0*dy>pr.pos.distanceTo(to)*3+50){ probeArrives(pr,target); return false; } /* at high speeds the whole trip fits in one frame */
  const steps=Math.min(600,Math.max(1,Math.ceil(spd0*dy/.35))); const h=dy/steps; /* never move more than a third of a unit per step, so small targets cannot be skipped */
  for(let i=0;i<steps;i++){
    _tb.set(0,0,0);
    for(const s of stars){ const dx=s.d.x-pr.pos.x, dz=s.d.z-pr.pos.z, d2=dx*dx+dz*dz+2; const a=GM_UNITS*s.d.mass/d2/Math.sqrt(d2); _tb.x+=dx*a; _tb.z+=dz*a; }
    for(const bh of holes){ const dx=bh.d.x-pr.pos.x, dz=bh.d.z-pr.pos.z, d2=dx*dx+dz*dz+2; const a=GM_UNITS*bh.d.mass/d2/Math.sqrt(d2); _tb.x+=dx*a; _tb.z+=dz*a; }
    pr.vel.addScaledVector(_tb,h);
    /* course corrections: small thruster burns keep the nose on the destination without changing speed much */
    /* guidance works in the target's frame: match its motion, then close the gap, braking on approach */
    _rel.copy(pr.vel).sub(_tv); let sp=_rel.length(); const dist=pr.pos.distanceTo(to); const cap=Math.max(dist*10,30); if(sp>cap) sp=Math.max(cap,sp-sp*clamp(h*25));
    _ta2.copy(to).sub(pr.pos).normalize().multiplyScalar(sp); _rel.lerp(_ta2,clamp(h*30)).setLength(sp); pr.vel.copy(_tv).add(_rel);
    pr.pos.addScaledVector(pr.vel,h);
    if(pr.pos.distanceTo(to)<targetRadius(target)){ probeArrives(pr,target); return false; } }
  d.x=pr.pos.x; d.z=pr.pos.z; d.vx=pr.vel.x; d.vz=pr.vel.z; pr.head.position.copy(pr.pos);
  const P=pr.P; for(let i=pr.N-1;i>0;i--){ P[i*3]=P[i*3-3]; P[i*3+1]=0; P[i*3+2]=P[i*3-1]; } P[0]=pr.pos.x; P[1]=0; P[2]=pr.pos.z;
  if(pr.filled<pr.N){ pr.filled++; for(let i=pr.filled;i<pr.N;i++){ P[i*3]=pr.pos.x; P[i*3+2]=pr.pos.z; } } pr.trail.geometry.attributes.position.needsUpdate=true;
  for(const bh of holes){ if(pr.pos.distanceTo(bh.group.position)<bh.r*1.3){ toast(`${d.name} fell into ${bh.d.name}`); dropProbe(pr); return false; } }
  if(Math.hypot(pr.pos.x-d.ox,pr.pos.z-d.oz)>d.d0*3.5+200){ toast(`${d.name} missed and is lost to interstellar space`); dropProbe(pr); return false; }
  return true; }
function probeArrives(pr,target){ const d=pr.d; burst(pr.pos,new THREE.Color(.7,1,.85),50,3,.4); chime(1760,2,.05,'A'); dropProbe(pr);
  const years=simT-d.t0, au=d.d0/15; const rows=[];
  if(target.kind==='planet'){ rows.push(['Type',planetKind(target)],...notesFor(target).rows); }
  else if(target.kind==='moon'){ rows.push(['Type','Moon of '+target.planet.d.name],['Radius',`${Math.round(target.d.size*1.15*6371).toLocaleString('en-US')} km`],['Period',`${moonPeriodDays(target).toFixed(1)} days`],['Surface','Cratered regolith; no atmosphere to speak of.']); }
  else if(target.kind==='star'){ rows.push(['Class',target.d.cls==='P'?'Pulsar':target.d.cls==='D'?'White dwarf':`${target.d.cls} · ${target.T.desc}`],['Surface',`${target.d.temp.toLocaleString('en-US')} K`],['Mass',`${target.d.mass.toFixed(2)} M☉`],['Age',fmtYears(target.d.age)],['Fate',fateText(target)]); }
  else rows.push(['Mass',`${target.d.mass.toFixed(1)} M☉`],['Event horizon',`${(target.d.mass*2.95).toFixed(1)} km`],['Note','Signal red-shifted and faded as the probe crossed the horizon.']);
  $('#repH').textContent=`${d.name} · ${target.d.name}`;
  $('#repP').textContent=`Launched from ${d.from}, arrived after ${fmtYears(years)} and ${au.toFixed(1)} AU. Transmission follows.`;
  $('#repRows').innerHTML=rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join(''); openSheet('#repSheet'); }
