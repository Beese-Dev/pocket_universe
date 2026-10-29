/* ---------- persistence ---------- */
function serialize(){ stars.forEach(s=>s.planets.forEach(p=>{ p.d.angle=+(p.angle%TAU).toFixed(3); p.moons.forEach(m=>m.d.angle=+(m.pivot.rotation.y%TAU).toFixed(3)); }));
  return {v:3,t:+simT.toFixed(3),legacy:+legacy.toFixed(2),catalogN,stars:stars.map(s=>s.d),holes:holes.map(h=>h.d),
    rogues:rogues.map(p=>({d:p.d,x:+p.holder.position.x.toFixed(2),z:+p.holder.position.z.toFixed(2),vx:+p.rogue.vel.x.toFixed(3),vz:+p.rogue.vel.z.toFixed(3),from:p.rogue.from,ox:p.rogue.origin.x,oz:p.rogue.origin.z})),
    remnants:remnants.map(r=>({x:r.d.x,z:r.d.z,t:+r.d.t.toFixed(1),seed:r.d.seed,kind:r.d.kind})),probes:probes.map(pr=>pr.d)}; }
function migrate(state){ if((state.v||0)>=3) return state;
  const fixP=p=>{ if(!p.day) p.day=+(24*(.25/(p.spin||.25))).toFixed(1); };
  state.stars.forEach(d=>{ d.age=0; (d.planets||[]).forEach(fixP); }); (state.rogues||[]).forEach(r=>{ r.vx*=44; r.vz*=44; fixP(r.d); }); (state.remnants||[]).forEach(r=>{ r.t=r.t*500; }); state.t=0; state.v=3; return state; }
let saveT=0; function changed(){ updateCounts(); clearTimeout(saveT); saveT=setTimeout(save,500); if(!$('#atlasSheet').hidden) renderAtlas(); }
function save(){ if(visiting) return; if(mode==='daily'){ if(daily&&!daily.done){ daily.state=serialize(); dailySaveRec(); } return; } try{ localStorage.setItem(STORE,JSON.stringify(serialize())); }catch(e){} }
addEventListener('visibilitychange',()=>{ if(document.hidden) save(); });
addEventListener('pagehide',save);
function loadSaved(){ try{ const j=JSON.parse(localStorage.getItem(STORE)||'null'); if(j&&Array.isArray(j.stars)) return j; }catch(e){} return null; }
function loadState(state){
  stars.forEach(s=>{ dropStream(s); world.remove(s.group); s.labelEl.remove(); s.planets.forEach(killPlanet); });
  holes.forEach(h=>{ world.remove(h.group); h.labelEl.remove(); }); comets.forEach(c=>c.dispose());
  rogues.forEach(p=>{ world.remove(p.holder); killPlanet(p); }); remnants.forEach(r=>{ world.remove(r.mesh); r.mat.dispose(); });
  stars=[]; holes=[]; comets=[]; rogues=[]; remnants=[]; hitTargets=[]; if(sel) select(null);
  migrate(state); simT=state.t||0; legacy=state.legacy||0;
  (state.holes||[]).forEach(d=>makeHole(d,false));
  state.stars.forEach(d=>{ d.planets=d.planets||[]; d.age=d.age||0; d.planets.forEach(p=>p.moons=p.moons||[]); makeStar(d,false); });
  (state.rogues||[]).forEach(rd=>{ rd.d.moons=rd.d.moons||[]; makeRogue(rd); });
  (state.remnants||[]).forEach(d=>makeRemnant(d)); probes.forEach(pr=>{ world.remove(pr.head,pr.trail); }); probes=[]; (state.probes||[]).forEach(makeProbe);
  catalogN=Math.max(state.catalogN||1,stars.length+1);
  setGalaxyRot(simT); if(stars[0]){ toWorld(stars[0].group.position,controls.target); desiredDist=Math.max(60,outerR(stars[0])*2.6); } world.worldToLocal(anchorLocal.copy(controls.target));
  updateCounts(); updatePanel();
}
function sample(){ return {v:3,t:0,catalogN:3,holes:[],stars:[
  {name:'Ossira',catalog:'PU-0001',cls:'G',temp:5780,mass:1,x:0,z:0,seed:12.3,age:0,planets:[
    {name:'Ossira b',type:'lava',orbit:8.5,angle:.4,size:.62,seed:7.1,tilt:.02,day:708,locked:true,spin:.25,rings:false,clouds:false,colors:['#1c0e0a','#ff6a1a','#ffb35a'],atmo:'#ff7b3d',moons:[]},
    {name:'Ossira c',type:'ocean',orbit:14.5,angle:2.2,size:1,seed:21.7,tilt:.38,day:24,spin:.2,rings:false,clouds:true,colors:['#0b2a55','#1f6f9a','#c9b27a'],atmo:'#6fb2ff',
      moons:[{orbit:2.4,size:.24,angle:1,incl:.2,speed:.7,seed:3.3,colors:['#3b3a3f','#77757d','#bdb9c2']}]},
    {name:'Ossira d',type:'gas',orbit:24,angle:4.1,size:2.3,seed:33.9,tilt:-.32,day:10,spin:.35,rings:true,clouds:false,colors:['#c99a62','#f1dfbb','#8a4d2c'],atmo:'#f1d9b0',
      moons:[{orbit:6.6,size:.3,angle:2,incl:-.15,speed:.45,seed:9.1,colors:['#3d332b','#8a7663','#cdbba4']},{orbit:7.9,size:.2,angle:4.5,incl:.25,speed:.36,seed:5.5,colors:['#2f3640','#6c7a8a','#c3ccd6']}]},
    {name:'Ossira e',type:'ice',orbit:33,angle:5.6,size:.85,seed:44.4,tilt:.5,day:17,spin:.15,rings:false,clouds:false,colors:['#d7e8f2','#7fb0cf','#ffffff'],atmo:'#bfe6ff',moons:[]}]},
  {name:'Thalvos',catalog:'PU-0002',cls:'M',temp:3150,mass:.31,x:96,z:-58,seed:41.2,age:0,planets:[
    {name:'Thalvos b',type:'rocky',orbit:7.5,angle:1.4,size:.8,seed:18.2,tilt:.2,day:31,spin:.3,rings:false,clouds:true,colors:['#3a1d14','#8c3b22','#d08a5a'],atmo:'#ff9f7a',moons:[]}]}
]}; }
