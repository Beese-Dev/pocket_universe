/* ---------- world ---------- */
const SPHERE=new THREE.SphereGeometry(1,coarse?64:96,coarse?44:64);
const HIT=new THREE.SphereGeometry(1,12,8);
const HITK=coarse?1.6:1; /* thumbs need bigger targets than cursors */
const hitMat=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false,transparent:true,opacity:0});
const labelsEl=$('#labels');
let stars=[], holes=[], comets=[], rogues=[], remnants=[], hitTargets=[], sel=null, catalogN=1, now=0, desiredDist=null, seedMode='off', visiting=false, homeState=null;
const effects=[];

function makeLabel(o){ const el=document.createElement('div'); el.className='lbl '+(o.kind==='planet'||o.kind==='moon'?'planet':'star');
  const b=document.createElement('b'), i=document.createElement('i'); el.append(b,i); labelsEl.append(el);
  o.labelEl=el; o.labelB=b; o.labelI=i; refreshLabel(o); }
function refreshLabel(o){ o.labelB.textContent=o.d.name;
  o.labelI.textContent=o.kind==='star'?(o.d.cls==='P'?`Pulsar · ${o.d.catalog}`:o.d.cls==='D'?`White dwarf · ${o.d.catalog}`:o.d.giant?`Red giant · ${o.d.catalog}`:o.d.binary?`${o.d.cls}+${o.d.binary.cls} binary · ${o.d.catalog}`:`${o.d.cls}-type · ${o.d.catalog}`)
    :o.kind==='hole'?`Black hole · ${o.d.mass.toFixed(0)} M☉`:o.kind==='moon'?`Moon of ${o.planet.d.name}`:planetKind(o); }
function planetKind(p){ const base=p.rogue?(p.d.core?'Rogue core · drifting':'Rogue world · drifting'):p.d.core?'Stripped core':p.d.scorched?'Scorched world':TYPE_LABEL[p.d.type]; return (p.d.stage>=3&&!p.rogue)?`${base} · ${stageOf(p.d.stage).name}`:base; }

function buildSun(cls,seed,parent,x){
  const T=STAR_TYPES[cls], col=new THREE.Color(T.col);
  const mat=new THREE.ShaderMaterial({uniforms:{uCol:{value:col},uTime:{value:0},uSeed:{value:seed},uSwell:{value:0}},vertexShader:VS,fragmentShader:STAR_FS});
  const mesh=new THREE.Mesh(SPHERE,mat); mesh.scale.setScalar(T.r); mesh.position.x=x; parent.add(mesh);
  const corona=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.8}));
  corona.scale.setScalar(T.r*7); corona.position.x=x; parent.add(corona);
  const sun={T,col,mat,mesh,corona,x};
  if(cls==='P'){ const beams=new THREE.Group(); beams.rotation.z=.55; mesh.add(beams);
    const bm=new THREE.MeshBasicMaterial({color:0xbfe0ff,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    [1,-1].forEach(sg=>{ const cone=new THREE.Mesh(new THREE.ConeGeometry(1.1,24,24,1,true),bm); cone.position.y=sg*12; cone.rotation.x=sg>0?Math.PI:0; beams.add(cone); });
    sun.beams=beams; }
  return sun;
}
function buildBody(s){
  if(s.body){ s.group.remove(s.body); }
  const body=new THREE.Group(); s.group.add(body); s.body=body; s.suns=[];
  const d=s.d;
  if(d.binary&&d.cls!=='P'&&d.cls!=='D'){ const pair=new THREE.Group(); body.add(pair); s.pair=pair;
    const m1=STAR_TYPES[d.cls].m, m2=STAR_TYPES[d.binary.cls].m, sep=d.binary.sep;
    s.suns.push(buildSun(d.cls,d.seed,pair,-sep*m2/(m1+m2)), buildSun(d.binary.cls,d.binary.seed,pair,sep*m1/(m1+m2)));
  } else { s.pair=null; s.suns.push(buildSun(d.cls,d.seed,body,0)); }
  s.T=STAR_TYPES[d.cls]; s.col=s.suns[0].col; s.lightCol.copy(s.col).lerp(new THREE.Color(1,1,1),.55);
  const hr=d.binary&&d.cls!=='P'&&d.cls!=='D'?d.binary.sep/2+s.T.r*1.4:Math.max(s.T.r*1.6,2.2);
  s.hit.scale.setScalar(hr*HITK);
}
function makeStar(d,animate){ if(!d.uid) d.uid=newUid();
  const group=new THREE.Group(); group.position.set(d.x,0,d.z); world.add(group);
  const hit=new THREE.Mesh(HIT,hitMat); group.add(hit);
  const s={kind:'star',d,group,hit,planets:[],born:animate?now:-99,lightCol:new THREE.Color(),warned:false};
  buildBody(s);
  const hz=new THREE.Mesh(new THREE.RingGeometry(.02,1,128,1),new THREE.ShaderMaterial({uniforms:{uIn:{value:.5},uAlpha:{value:.14}},vertexShader:RING_VS,fragmentShader:HZ_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  hz.rotation.x=-Math.PI/2; hz.renderOrder=-1; group.add(hz); s.hz=hz;
  if(d.discN===undefined) d.discN=Math.floor(rand(2,7));
  const dr=discOuter(s), dIn=innerR(s)*.9;
  const disc=new THREE.Mesh(new THREE.RingGeometry(dIn,dr,160,1),new THREE.ShaderMaterial({uniforms:{uIn:{value:dIn},uOut:{value:dr},uT:{value:0},uSeed:{value:d.seed},uGap:{value:new Float32Array(8)},uN:{value:0},uAlpha:{value:1}},
    vertexShader:RING_VS,fragmentShader:PDISC_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  disc.rotation.x=-Math.PI/2; disc.renderOrder=-1; disc.visible=false; group.add(disc); s.disc=disc;
  const hillRing=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:129},(_,i)=>new THREE.Vector3(Math.cos(i/128*TAU),0,Math.sin(i/128*TAU)))),new THREE.LineDashedMaterial({color:0xff9a4a,transparent:true,opacity:.45,dashSize:.6,gapSize:.5,depthWrite:false}));
  hillRing.computeLineDistances(); hillRing.visible=false; group.add(hillRing); s.hillRing=hillRing;
  hit.userData.ref=s; hitTargets.push(hit); makeLabel(s); stars.push(s);
  d.planets.forEach(pd=>makePlanet(s,pd,false));
  return s;
}
const DISC_LIFE=5e6; /* years: a protoplanetary disc dissipates in a few million years */
function discOuter(s){ return 48*Math.sqrt(Math.max(s.d.mass,.2)); }
function hasDisc(s){ return s.d.cls!=='P'&&s.d.cls!=='D'&&!s.d.giant&&s.d.age<DISC_LIFE; }
function updateDisc(s){ const on=hasDisc(s); s.disc.visible=on; if(!on) return; const u=s.disc.material.uniforms; u.uT.value=s.d.age/DISC_LIFE; u.uAlpha.value=1-Math.pow(s.d.age/DISC_LIFE,2);
  const g=u.uGap.value; u.uN.value=Math.min(8,s.planets.length); for(let i=0;i<8;i++) g[i]=s.planets[i]?s.planets[i].d.orbit:0; }
function luminosity(s){ return luminosityOf(s.d.mass,s.d.cls,s.giantF||1); }
function updateHZ(s){ const L=luminosity(s); const hz=habitableZoneAU(L); const inner=hz.inner*UNITS_PER_AU, outer=hz.outer*UNITS_PER_AU; const ok=outer>s.T.r*(s.giantF||1)*1.3&&s.d.cls!=='P';
  s.hz.visible=ok; if(!ok) return; s.hz.scale.setScalar(outer); s.hz.material.uniforms.uIn.value=inner/outer; }
function innerR(s){ return s.d.binary&&s.d.cls!=='P'&&s.d.cls!=='D'?s.d.binary.sep*1.6+s.T.r*2:s.T.r*2.2; }
function outerR(s){ const l=s.planets[s.planets.length-1]; return l? l.d.orbit+(l.d.rings?l.d.size*2.4:l.d.size*1.5):innerR(s)+1; }
function omega(s,orbit){ return TAU/periodYears(orbit,s.d.mass); } /* radians per year */

/* gravity of black holes: a sideways pull on anything orbiting nearby */
/* black holes no longer shift orbits sideways; see tidalLimit() for what they really do */
const _loc=new THREE.Vector3();
function orbitPos(s,p,angle,out){ out.set(Math.cos(angle)*p.d.orbit,0,Math.sin(angle)*p.d.orbit); return out; }
/* tides from black holes: a star keeps only the planets inside its stability limit (half its Hill radius), which shrinks as a hole gets nearer or heavier */
function tidalLimit(s){ let lim=Infinity, by=null; for(const h of holes){ const d=Math.hypot(s.d.x-h.d.x,s.d.z-h.d.z); const L=stableLimit(d,s.d.mass,h.d.mass); if(L<lim){ lim=L; by=h; } } return {lim,by}; }
function updateTidal(s){ const {lim,by}=tidalLimit(s); s.tidal=lim; const show=isFinite(lim)&&lim<outerR(s)*2.5; s.hillRing.visible=show; if(show){ s.hillRing.scale.setScalar(lim); }
  if(!isFinite(lim)||ypr<=0) return;
  for(const p of [...s.planets]){ if(p.d.orbit>lim){ stripMoons(p); const sv=starVelocity(s,_sv); fling(s,p,0); p.rogue.vel.add(sv); p.rogue.from=s.d.name;
    toast(`${by.d.name}'s tides tore ${p.d.name} away from ${s.d.name}`); discover('stripped'); changed(); } } }
const _sv=new THREE.Vector3();
function starVelocity(s,out){ out.set(0,0,0); if(!s.d.bound||!s.boundHole) return out; const b=s.d.bound,h=s.boundHole; const v=TAU/periodYears(b.r,h.d.mass+s.d.mass)*b.r; return out.set(-Math.sin(b.angle)*v,0,Math.cos(b.angle)*v); }
function rebuildOrbit(p){ const pts=p.orbitLine.geometry.attributes.position.array; for(let i=0;i<=160;i++){ orbitPos(p.star,p,i/160*TAU,_loc); pts[i*3]=_loc.x; pts[i*3+1]=0; pts[i*3+2]=_loc.z; } p.orbitLine.geometry.attributes.position.needsUpdate=true; p.smearStale=true; }
/* the smear: at kyr/s and Myr/s a planet's year is shorter than a frame, so it is drawn as a glowing band along its whole orbit */
function rebuildSmear(p){ const pts=[]; const a=p.orbitLine.geometry.attributes.position.array; for(let i=0;i<160;i++) pts.push(new THREE.Vector3(a[i*3],0,a[i*3+2]));
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),160,Math.max(p.d.size*.7,.4),8,true); if(p.smear.geometry) p.smear.geometry.dispose(); p.smear.geometry=g; p.smearStale=false; }
function rebuildAllOrbits(){ stars.forEach(s=>s.planets.forEach(rebuildOrbit)); }

function planetMaterial(colors,type,seed,clouds,starPos,starCol,growU){
  return new THREE.ShaderMaterial({uniforms:{uA:{value:new THREE.Color(colors[0])},uB:{value:new THREE.Color(colors[1])},uC:{value:new THREE.Color(colors[2])},
    uStarPos:{value:starPos},uStarCol:{value:starCol},uType:{value:TYPE_CODE[type]},uSeed:{value:seed},uTime:{value:0},uGrow:growU,uClouds:{value:clouds?1:0},uDust:{value:0},uCiv:{value:0}},
    vertexShader:VS,fragmentShader:PLANET_FS});
}
function makePlanet(s,pd,animate){ if(!pd.uid) pd.uid=newUid();
  const holder=new THREE.Object3D(); s.group.add(holder);
  const grow=new THREE.Group(); holder.add(grow);
  const tilt=new THREE.Group(); tilt.rotation.z=pd.tilt; grow.add(tilt);
  const starPos=s.group.position;
  const growU={value:animate?0:1};
  const mat=planetMaterial(pd.colors,pd.type,pd.seed,pd.clouds,starPos,s.lightCol,growU);
  const mesh=new THREE.Mesh(SPHERE,mat); mesh.scale.setScalar(pd.size); tilt.add(mesh); mat.uniforms.uDust.value=pd.dust||0;
  const atmo=new THREE.Mesh(SPHERE,new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(pd.atmo)},uStarPos:{value:starPos},uGrow:growU},
    vertexShader:VS,fragmentShader:ATMO_FS,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));
  atmo.scale.setScalar(pd.size*1.08); tilt.add(atmo);
  let ring=null;
  if(pd.rings){ const rin=pd.size*1.4, rout=pd.size*2.35;
    ring=new THREE.Mesh(new THREE.RingGeometry(rin,rout,128,1),new THREE.ShaderMaterial({uniforms:{uA:{value:new THREE.Color(pd.colors[1])},uB:{value:new THREE.Color(pd.colors[0])},
      uIn:{value:rin},uOut:{value:rout},uSeed:{value:pd.seed},uGrow:growU},vertexShader:RING_VS,fragmentShader:RING_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; tilt.add(ring); }
  const hit=new THREE.Mesh(HIT,hitMat); hit.scale.setScalar(Math.max(pd.size*1.8,1.6)*HITK); holder.add(hit);
  const og=new THREE.BufferGeometry(); og.setAttribute('position',new THREE.BufferAttribute(new Float32Array(161*3),3));
  const orbitLine=new THREE.Line(og,new THREE.LineBasicMaterial({color:s.col,transparent:true,opacity:.17,depthWrite:false})); s.group.add(orbitLine);
  const smear=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({color:new THREE.Color(pd.colors[1]).lerp(new THREE.Color(1,1,1),.25),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false})); smear.visible=false; s.group.add(smear);
  const p={kind:'planet',d:pd,star:s,angle:pd.angle,holder,grow,tilt,mesh,mat,atmo,ring,hit,orbitLine,smear,smearStale:true,growU,moons:[],born:animate?now:-99};
  rebuildOrbit(p); orbitPos(s,p,p.angle,holder.position);
  hit.userData.ref=p; hitTargets.push(hit); makeLabel(p); s.planets.push(p);
  pd.moons.forEach(md=>makeMoon(p,md,false));
  return p;
}
function makeMoon(p,md,animate){ if(!md.uid) md.uid=newUid();
  const incl=new THREE.Object3D(); incl.rotation.x=md.incl; p.holder.add(incl);
  const pivot=new THREE.Object3D(); pivot.rotation.y=md.angle; incl.add(pivot);
  const growU={value:animate?0:1};
  const mesh=new THREE.Mesh(SPHERE,planetMaterial(md.colors||['#3b3a3f','#77757d','#bdb9c2'],'rocky',md.seed,false,p.star.group.position,p.star.lightCol,growU));
  mesh.position.x=md.orbit; mesh.scale.setScalar(md.size); pivot.add(mesh);
  if(!md.name) md.name=`${p.d.name} ${ROMAN[p.moons.length]||p.moons.length+1}`;
  const hit=new THREE.Mesh(HIT,hitMat); hit.scale.setScalar(Math.max(md.size*2.2,.5)*HITK); hit.position.x=md.orbit; pivot.add(hit);
  const m={kind:'moon',d:md,planet:p,pivot,mesh,hit,growU,born:animate?now:-99}; hit.userData.ref=m; hitTargets.push(hit); makeLabel(m); p.moons.push(m); return m;
}
function makeHole(d,animate){
  const group=new THREE.Group(); group.position.set(d.x,0,d.z); world.add(group);
  const r=1.2+d.mass*.1;
  const core=new THREE.Mesh(SPHERE,new THREE.MeshBasicMaterial({color:0x000000})); core.scale.setScalar(r); group.add(core);
  const diskMat=new THREE.ShaderMaterial({uniforms:{uIn:{value:r*1.5},uOut:{value:r*4.6},uTime:{value:0},uSeed:{value:d.seed},uFeed:{value:0}},vertexShader:RING_VS,fragmentShader:DISK_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const disk=new THREE.Mesh(new THREE.RingGeometry(r*1.5,r*4.6,160,1),diskMat); disk.rotation.x=-Math.PI/2+.38; disk.rotation.y=d.seed; group.add(disk);
  const arc=new THREE.Mesh(new THREE.RingGeometry(r*1.5,r*2.3,160,1),diskMat.clone()); arc.rotation.y=d.seed; arc.rotation.x=-.2; group.add(arc); /* light bent over the top */
  const ring=new THREE.Mesh(new THREE.RingGeometry(r*1.02,r*1.12,128),new THREE.MeshBasicMaterial({color:0xfff2d8,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); group.add(ring);
  const jetMat=new THREE.MeshBasicMaterial({color:0x9fd0ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const jets=new THREE.Group(); jets.rotation.copy(disk.rotation); jets.rotation.x+=Math.PI/2; group.add(jets);
  [1,-1].forEach(sg=>{ const cone=new THREE.Mesh(new THREE.ConeGeometry(r*.45,r*16,20,1,true),jetMat); cone.position.y=sg*r*8; cone.rotation.x=sg>0?0:Math.PI; jets.add(cone); });
  const hit=new THREE.Mesh(HIT,hitMat); hit.scale.setScalar(Math.max(r*2.2,3)*HITK); group.add(hit);
  const h={kind:'hole',d,group,core,disk,arc,ring,hit,jets,jetMat,r,r0:r,feed:0,born:animate?now:-99};
  hit.userData.ref=h; hitTargets.push(hit); makeLabel(h); holes.push(h); return h;
}
