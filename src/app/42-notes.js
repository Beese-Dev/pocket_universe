/* ---------- field notes ---------- */
const WEATHER={
  rocky:['Dust storms sweep the lowlands each {d}-hour day.','Thin clouds, cold nights, long twilights.','Clear skies most days; hail in the highlands.','Salt winds and a permanent haze over the plains.'],
  ocean:['Warm rain over the equator; typhoons in the open sea.','Fog banks the size of continents.','Monsoon half the year, glass-calm the other half.','Storms track the terminator; the dayside is mild.'],
  gas:['Winds near {w} km/h in the upper bands.','Lightning storms wider than a rocky world.','Ammonia snow in the cold belts; metallic rain below.','A storm has circled the equator for centuries.'],
  lava:['Rock vapour condenses as glass hail on the nightside.','Sulphur rain; the lakes are molten iron.','Constant eruptions keep the sky orange.','The dayside glows; the nightside crusts over by dawn.'],
  ice:['Nitrogen snow drifts in near-vacuum.','Clear and still. Nothing has moved here in ages.','Methane fog lifts at noon, if you can call it noon.','Cryovolcanoes vent water ice into orbit.'],
};
const ATMOS={rocky:['Nitrogen and oxygen, thin','Carbon dioxide, dense','Nitrogen and argon haze','Almost none'],ocean:['Nitrogen and oxygen, humid','Water vapour over nitrogen','Oxygen-rich, breathable'],
  gas:['Hydrogen and helium, ammonia clouds','Hydrogen, helium and methane haze','Hydrogen with water-ice clouds'],lava:['Vaporised rock and sulphur dioxide','Sodium and silicon monoxide','Carbon monoxide, searing'],ice:['Thin nitrogen frost','Methane snow in near vacuum','None; surface ice sublimates slowly']};
const FORMS=['filter-feeding drifters','six-limbed grazers','bioluminescent reef builders','burrowing colonies','slow armoured browsers','kite-like gliders','translucent swimmers','singing mound dwellers'];
const HABITS=['that migrate with the tides','that only surface at night','that farm a kind of fungus','that communicate by colour','that live for centuries','that hibernate through each long winter','that build towers of silica','that follow the storms'];
function notesFor(p){ const d=p.d, s=p.star, R=mulberry(Math.floor(d.seed*9973)); const r=arr=>arr[Math.floor(R()*arr.length)];
  const au=d.orbit/15; const L=luminosityOf(s.d.mass,s.d.cls,s.giantF||1); let T=equilibriumTemp(L,au);
  T+={lava:260,gas:-30,ice:-70,ocean:18,rocky:12}[d.type]; if(d.scorched) T+=180; if(s.d.cls==='P') T=Math.max(T*.1,30); if(p.rogue) T=Math.max(T*.3,40); T=Math.round(clamp(T,20,2600));
  const day=d.day||24; const dayS=(day>=48?`${(day/24).toFixed(1)} days`:`${Math.round(day)} h`)+(d.locked?' · tidally locked':'');
  const g=(d.type==='gas'?d.size*1.08:d.size*1.05).toFixed(2);
  let weather=r(WEATHER[d.type]).replace('{d}',Math.round(day)).replace('{w}',Math.round(300+R()*1500));
  if(d.dust>.25) weather='Impact winter: dust veils the sky and noon is dusk. '+weather;
  if(d.locked) weather='One face always sunward; a ring of twilight is the only mild ground. '+weather;
  if(s.giantF>1) weather='The star fills a third of the sky. '+weather;
  let life, species=null;
  if(d.scorched) life='Sterilised by the supernova. Glass plains where oceans were.';
  else if((d.type==='rocky'||d.type==='ocean')&&T>235&&T<335){ species=`${makeName(R)} ${r(FORMS)} ${r(HABITS)}`; life=d.extinct?`Fossil record only: ${species} went extinct in a comet impact.`:species+'.'; }
  else if(d.type==='ocean'&&T>=335&&T<420) life=R()<.6?'Heat-loving microbial mats along the shallows.':'No life detected.';
  else if(d.type==='ice') life=R()<.45?'Chemosynthetic life suspected under the ice shell.':'No life detected.';
  else if(d.type==='gas') life=R()<.3?'Drifting aerial microbes, unconfirmed.':'No life detected.';
  else if(d.type==='lava') life='Nothing survives the surface.';
  else life=R()<.25?'Lichen-like crusts in sheltered valleys.':'No life detected.';
  const rows=[['Day length',dayS],['Surface gravity',`${g} g`],['Mean temperature',`${T} K · ${Math.round(T-273)} °C`],['Atmosphere',r(ATMOS[d.type])],['Weather',weather],['Life',life]];
  if(d.impacts) rows.splice(4,0,['Impacts',`${d.impacts} recorded comet strike${d.impacts===1?'':'s'}`]);
  return {rows,species:d.extinct?null:species}; }
function speciesOf(p){ return notesFor(p).species; }
