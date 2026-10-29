/* ---------- collisions ---------- */
function sungraze(c,s){ const pos=c.pos.clone(); burst(pos,new THREE.Color(1,.95,.8),90,7,.7); flash(pos,s.T.r*9);
  s.suns.forEach(sun=>{ sun.flare=1; }); chime(s.T.hz*2,1.4,.05,s.d.cls); toast(`A sungrazing comet fell into ${s.d.name}`); discover('sungrazer'); }
function impact(c,p,where){ const d=p.d, pos=where.clone(); const big=d.type==='gas';
  burst(pos,new THREE.Color(1,.75,.45),big?60:130,big?3:6,.5); flash(pos,d.size*(big?5:9)); boom(big?.2:.45,pos); chime(110,1.8,.05,'M');
  d.impacts=(d.impacts||0)+1; if(!big){ d.dust=Math.min(1,(d.dust||0)+.8); }
  let msg=c?`A comet struck ${d.name}`:`An asteroid struck ${d.name}`;
  if(!big&&!d.extinct&&(d.stage||0)>=2){ if(Math.random()<impactDeathChance(d.stage)){ const wasSt=d.stage, was=stageOf(d.stage).name, sp=speciesOf(p)||'life'; d.extinct=true; d.extinctions=(d.extinctions||0)+1; d.sinceExt=0; d.lifeAge=0; d.stage=0; p.mat.uniforms.uCiv.value=0; refreshLabel(p); msg+=wasSt>=3?`. The ${was.toLowerCase()} of ${sp} did not survive the impact winter`:`. Its ${sp} did not survive the impact winter`; discover('extinction'); focusEvent(p,`Mass extinction on ${d.name}`,d.seed+':ext'+(d.extinctions||0)); } else msg+='. Dust veils the sky; life clings on'; }
  else if(big) msg+=': a dark bruise spreads across the cloud tops';
  else if(d.type==='ocean'||d.type==='rocky') msg+='. New craters, and a little more water';
  else msg+=', scattering debris';
  toast(msg+'.'); discover('impact'); if(sel===p) updatePanel(); changed(); }
