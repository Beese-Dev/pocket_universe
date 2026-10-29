/* ---------- generators ---------- */
function rollClass(){ let r=RNG(),cls='M'; for(const k in STAR_TYPES){ r-=STAR_TYPES[k].w; if(r<=0){cls=k;break;} } return cls; }
function genStar(x,z){
  const cls=rollClass(), T=STAR_TYPES[cls], n=catalogN++;
  const d={name:makeName(),catalog:'PU-'+String(n).padStart(4,'0'),cls,temp:Math.round(rand(T.t[0],T.t[1])/10)*10,mass:+(T.m*rand(.85,cls==='O'?1.6:1.15)).toFixed(2),x,z,seed:rand(0,60),age:0,planets:[]};
  if(stars.length>=2&&RNG()<.14){ const c2=pick(['G','K','K','M','M','A','F']); d.binary={cls:c2,sep:+(T.r+STAR_TYPES[c2].r+rand(3,6)).toFixed(1),seed:rand(0,60)}; d.mass=+(d.mass+STAR_TYPES[c2].m*rand(.85,1.15)).toFixed(2); }
  return d;
}
function genPlanet(s,orbit,size,type){
  const colors=pick(PALETTES[type]).map(jitter);
  const rings=RNG()<({gas:.55,ice:.3}[type]||.06);
  const locked=(orbit/15)<.12*Math.cbrt(s.d.mass); const day=locked?+(periodYears(orbit,s.d.mass)*365.25*24).toFixed(1):+rand(8,60).toFixed(1);
  return {name:`${s.d.name} ${'bcdefghi'[s.planets.length]}`,type,orbit:+orbit.toFixed(2),angle:rand(0,TAU),size:+size.toFixed(2),seed:rand(0,60),
    tilt:locked?rand(-.05,.05):rand(-.45,.45),day,locked,rings,clouds:type==='ocean'||(type==='rocky'&&Math.random()<.7),colors,
    atmo:type==='gas'?colors[1]:ATMO[type],moons:[]};
}
function pickType(s,orbit){ const k=Math.sqrt(s.d.mass);
  if(orbit<11*k) return pick(['lava','lava','rocky','rocky','ocean']);
  if(orbit<24*k) return pick(['rocky','ocean','ocean','gas']);
  return pick(['gas','gas','ice','ice','rocky']); }
