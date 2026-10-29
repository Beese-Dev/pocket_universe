/* ---------- actions ---------- */
function plantStar(pt){
  const d=genStar(+pt.x.toFixed(2),+pt.z.toFixed(2)); const s=makeStar(d,true);
  burst(s.group.position,s.col,180,16,.9); shock(s.group.position,s.col,s.T.r*16);
  chime(s.T.hz,2.4,.07,s.d.cls); select(s,false);
  toast(d.binary?`Two stars ignite together: ${d.name}`:`A ${s.T.desc} ignites: ${d.name}`); changed();
  discover(d.cls); if(d.binary){ discover('binary'); discover(d.binary.cls); }
  let near=null,nd=1e9; for(const h of holes){ const dd=pt.distanceTo(h.group.position); if(dd<nd){ nd=dd; near=h; } }
  if(near&&nd<tidalR(s,near)){ setTimeout(()=>{ if(stars.includes(s)) disruptStar(s,near); },1400); }
  else if(near&&nd<bindRange(near)) setTimeout(()=>{ if(stars.includes(s)) bindStar(s,near); },600);
}
/* planting onto a system adds a companion star; planting onto the star itself is a collision */
function formBinary(s,pt){ const d=s.d;
  if(!unlocked('companions')){ toast('Companion stars unlock at tier 1: complete three missions.'); return; }
  if(d.cls==='P'||d.cls==='D'){ toast(`${d.name} is a compact remnant; nothing can share its orbit.`); return; }
  if(d.binary){ toast(`${d.name} is already a pair.`); return; }
  const cls=rollClass(), T2=STAR_TYPES[cls], dist=pt.distanceTo(s.group.position);
  const sep=+Math.max(s.T.r+T2.r+.5,Math.min(dist,innerR(s)*2)).toFixed(1);
  const m2=+(T2.m*rand(.85,1.15)).toFixed(2);
  d.binary={cls,sep,seed:rand(0,60),since:d.age}; d.mass=+(d.mass+m2).toFixed(2);
  buildBody(s); refreshLabel(s); chime(T2.hz,2.2,.06,cls); burst(s.group.position,new THREE.Color(T2.col),160,12,.8);
  const lim=circumbinaryLimit(sep); const lost=[];
  for(const p of [...s.planets]) if(p.d.orbit<lim){ stripMoons(p); fling(s,p,.5); lost.push(p.d.name); }
  if(lost.length) toast(`${d.name} is now a pair; ${lost.join(', ')} ${lost.length===1?'was':'were'} flung from the unstable inner orbits`); else toast(`${d.name} is now a ${d.cls}+${cls} pair`);
  discover('binary'); discover(cls); select(s,false); changed();
  if(dist<s.T.r*1.3){ setTimeout(()=>{ if(stars.includes(s)&&s.d.binary) mergeStars(s,true); },900); } }
function plantHole(pt){
  const d={name:makeName(),mass:+rand(4,14).toFixed(1),x:+pt.x.toFixed(2),z:+pt.z.toFixed(2),seed:rand(0,60)};
  const h=makeHole(d,true); rebuildAllOrbits(); bindNearby(h);
  shock(h.group.position,new THREE.Color(1,.6,.3),60); burst(h.group.position,new THREE.Color(1,.7,.4),120,10,.7);
  boom(.35,h.group.position); select(h,false); toast(`${d.name} collapses into a black hole. Nearby orbits bend.`); changed(); discover('hole');
}
function growPlanet(s,auto){
  if(s.planets.length>=8){ if(!auto) toast(`${s.d.name} already has 8 planets`); return; }
  if(!hasDisc(s)){ toast(s.d.giant?`${s.d.name} is dying; nothing forms around it now`:`${s.d.name}'s disc has dissipated. Only a captured rogue world can join it now.`); return; }
  const type0=pickType(s,outerR(s)+6);
  const size=type0==='gas'?rand(1.7,2.6):rand(.6,1.15);
  const gap=rand(4.5,7.5);
  const orbit=(s.planets.length?outerR(s):innerR(s))+gap+(type0==='gas'?size*1.4:size);
  const type=pickType(s,orbit);
  for(const o of stars){ if(o===s) continue;
    if(s.group.position.distanceTo(o.group.position)-outerR(o)<orbit+size*2.5+8){ toast(`No room left: ${o.d.name} is too close`); updatePanel(); return; } }
  for(const h of holes){ if(s.group.position.distanceTo(h.group.position)<orbit+h.r*5+4){ toast(`No room left: ${h.d.name} is too close`); updatePanel(); return; } }
  if(s.tidal!==undefined&&orbit>s.tidal){ toast(`Beyond ${s.d.name}'s tidal limit: a black hole's gravity would strip that orbit`); updatePanel(); return; }
  const pd=genPlanet(s,orbit,type==='gas'?Math.max(size,1.7):Math.min(size,1.15),type);
  s.d.planets.push(pd); const p=makePlanet(s,pd,true);
  const wp=lp(p.holder,new THREE.Vector3());
  burst(wp,new THREE.Color(1,.5,.15),70,4,.45);
  chime(s.T.hz/2*(type==='gas'?.75:1),3,.06,s.d.cls); toast(`${pd.name} ${auto?'condensed from the disc':'is forming'} · ${TYPE_LABEL[type]}`);
  if(!auto&&desiredDist===null && camera.position.distanceTo(controls.target)<orbit*1.6) desiredDist=orbit*2.2+10;
  updatePanel(); changed(); discover(type); if(pd.rings) discover('ringed'); if(pd.locked) discover('locked');
}
function addMoon(p){
  if(p.moons.length>=4){ toast(`${p.d.name} has all the moons it can hold`); return; }
  const sz=p.d.size, i=p.moons.length;
  const base=(p.d.rings?sz*2.6:sz*1.9)+.5;
  const md={orbit:+(base+i*(sz*.6+.55)).toFixed(2),size:+(rand(.12,.24)*(p.d.type==='gas'?1.7:1)).toFixed(2),angle:rand(0,TAU),incl:rand(-.3,.3),speed:rand(.35,.8),seed:rand(0,60),
    colors:pick([['#3b3a3f','#77757d','#bdb9c2'],['#3d332b','#8a7663','#cdbba4'],['#2f3640','#6c7a8a','#c3ccd6']])};
  p.d.moons.push(md); const m=makeMoon(p,md,true);
  burst(lp(m.mesh,new THREE.Vector3()),new THREE.Color(.9,.9,1),40,2,.3);
  chime(p.star.T.hz*1.5,1.6,.05,p.star.d.cls); toast(`${md.name} joins the orbit`);
  updatePanel(); changed(); discover('moon');
}
function removeHole(h){
  world.remove(h.group); h.labelEl.remove(); holes=holes.filter(x=>x!==h); hitTargets=hitTargets.filter(x=>x!==h.hit);
  stars.forEach(s=>{ if(s.boundHole===h){ s.boundHole=null; s.d.bound=null; dropStream(s); } });
  burst(h.group.position,new THREE.Color(.8,.9,1),160,14,.6); chime(1760,1.2,.04);
  rebuildAllOrbits(); if(sel===h) select(null); toast(`${h.d.name} evaporated. Orbits settle.`); changed();
}
/* black holes: binding, tidal disruption */
function bindRange(h){ return 70+h.d.mass*5; }
function tidalR(s,h){ return tidalRadius(s.T.r,s.d.mass,h.d.mass,h.r); }
function bindStar(s,h){ const dx=s.d.x-h.d.x, dz=s.d.z-h.d.z; s.d.bound={hole:h.d.seed,r:+Math.hypot(dx,dz).toFixed(2),angle:Math.atan2(dz,dx)}; s.boundHole=h;
  toast(`${s.d.name} is now bound to ${h.d.name}`); discover('bound'); }
function bindNearby(h){ for(const s of stars){ if(!s.d.bound&&Math.hypot(s.d.x-h.d.x,s.d.z-h.d.z)<bindRange(h)) bindStar(s,h); } }
function growHole(h,dm){ h.d.mass=+(h.d.mass+dm).toFixed(1); const nr=1.2+h.d.mass*.1; h.group.scale.setScalar(nr/h.r0); h.r=nr; refreshLabel(h); }
function disruptStar(s,h){ const a=s.group.position.clone(), b=h.group.position.clone(), mid=a.clone().lerp(b,.5); slowEvent(`${h.d.name} tore ${s.d.name} apart`); focusEvent(h,`Tidal disruption: ${s.d.name}`,h.d.seed+':tde'+s.d.catalog);
  burst(a,s.col,220,10,.8); burst(mid,new THREE.Color(1,.8,.5),200,14,.7); flash(b,h.r*16); shock(b,new THREE.Color(1,.7,.4),80); boom(.8,b);
  dropStream(s); world.remove(s.group); s.labelEl.remove(); s.planets.forEach(killPlanet); stars=stars.filter(x=>x!==s); hitTargets=hitTargets.filter(x=>x!==s.hit);
  if(sel===s||(sel&&sel.star===s)) select(h); growHole(h,s.d.mass*.5);
  mstat('tde'); toast(`${h.d.name} tore ${s.d.name} apart. Half its mass fell into the black hole.`); discover('tde'); changed(); }
/* mass transfer: a donor star overflowing its Roche lobe onto the hole */
function rocheR(s,h){ return tidalR(s,h)*2.3; }
function feeding(s){ return !!(s.d.bound&&s.boundHole&&s.d.cls!=='P'&&s.d.cls!=='D'&&s.d.bound.r<rocheR(s,s.boundHole)); }
function makeStream(s,h){ const N=90, P=new Float32Array(N*3), C=new Float32Array(N*3), T=new Float32Array(N);
  for(let i=0;i<N;i++) T[i]=Math.random();
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.9,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); world.add(pts);
  s.stream={pts,P,C,T,N,g}; }
function dropStream(s){ if(!s.stream) return; world.remove(s.stream.pts); s.stream.g.dispose(); s.stream=null; }
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _perp=new THREE.Vector3();
function stepStream(s,h,dt){ const st=s.stream, k=s.body.scale.x; _a.copy(h.group.position).sub(s.group.position); const dist=_a.length(); _a.normalize();
  _perp.set(-_a.z,0,_a.x); const col=s.col;
  for(let i=0;i<st.N;i++){ st.T[i]+=dt*(.28+(i%7)*.03); if(st.T[i]>1) st.T[i]-=1; const t=st.T[i], e=t*t;
    const x=s.d.x+_a.x*(s.T.r*k+e*(dist-h.r*2.2))+_perp.x*(Math.sin(Math.PI*t)*dist*.16+(1-t)*h.r*.6), z=s.d.z+_a.z*(s.T.r*k+e*(dist-h.r*2.2))+_perp.z*(Math.sin(Math.PI*t)*dist*.16+(1-t)*h.r*.6);
    st.P[i*3]=x+(Math.random()-.5)*.5; st.P[i*3+1]=(Math.random()-.5)*.5*(1-t); st.P[i*3+2]=z+(Math.random()-.5)*.5;
    st.C[i*3]=col.r+(1.2-col.r)*t; st.C[i*3+1]=col.g+(1.2-col.g)*t; st.C[i*3+2]=col.b+(1.5-col.b)*t; }
  st.g.attributes.position.needsUpdate=true; st.g.attributes.color.needsUpdate=true; }
function consumeStar(s,h){ const pos=s.group.position.clone(); slowEvent(`${h.d.name} swallowed ${s.d.name}`); focusEvent(h,`${h.d.name} swallows ${s.d.name}`,h.d.seed+':eat'); burst(pos,s.col,160,8,.6); flash(h.group.position,h.r*12); boom(.5,pos);
  for(const p of [...s.planets]){ stripMoons(p); fling(s,p,1.5); }
  dropStream(s); world.remove(s.group); s.labelEl.remove(); stars=stars.filter(x=>x!==s); hitTargets=hitTargets.filter(x=>x!==s.hit);
  if(sel===s) select(h); growHole(h,s.d.mass); toast(`${h.d.name} swallowed what was left of ${s.d.name}.`); discover('consumed'); changed(); }
function transferRate(s,h){ return (s.d.mass0||s.d.mass)*1e-8*(1+(rocheR(s,h)-s.d.bound.r)/rocheR(s,h)*2); } /* solar masses per year */
function stepTransfer(s,h,dy,dt){ const d=s.d; if(!d.mass0) d.mass0=d.mass; if(!s.stream){ makeStream(s,h); toast(`${d.name} is overflowing onto ${h.d.name}: an X-ray binary`); discover('xray'); mstat('xray'); focusEvent(h,`X-ray binary: ${d.name} feeds ${h.d.name}`,h.d.seed+':xray'+d.catalog); }
  const rate=transferRate(s,h); const dm=Math.min(d.mass,rate*dy); d.mass=+(d.mass-dm).toFixed(4); h.d.mass=+(h.d.mass+dm).toFixed(4);
  s.massK=Math.pow(d.mass/d.mass0,.6); h.feed=Math.min(1,h.feed+dt); if(h.feed>=1&&Math.random()<dt*.5) refreshLabel(h);
  if(!d.unbound&&d.mass<d.mass0*.5&&s.planets.length){ d.unbound=true; for(const p of [...s.planets]){ stripMoons(p); fling(s,p,1); } toast(`${d.name} has lost half its mass; its planets drift free`); discover('rogue'); changed(); }
  stepStream(s,h,dt);
  if(d.mass<.08) consumeStar(s,h); }
function clearUniverse(){
  stars.forEach(s=>{ dropStream(s); world.remove(s.group); s.labelEl.remove(); s.planets.forEach(killPlanet); });
  holes.forEach(h=>{ world.remove(h.group); h.labelEl.remove(); });
  comets.forEach(c=>c.dispose()); comets=[];
  rogues.forEach(p=>{ world.remove(p.holder); killPlanet(p); }); remnants.forEach(r=>{ world.remove(r.mesh); r.mat.dispose(); }); probes.forEach(pr=>world.remove(pr.head,pr.trail)); probes=[];
  stars=[]; holes=[]; rogues=[]; remnants=[]; hitTargets=[]; select(null); catalogN=1; legacy=0; changed();
}
