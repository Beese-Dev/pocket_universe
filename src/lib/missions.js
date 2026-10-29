/** Missions are generated from a snapshot of the live universe and checked against later snapshots.
 *  A snapshot (ctx) is plain data: { stars:[{id,name,cls,binary,bound,disc,planets:[{id,name,type,rings,moons,stage,alive,inHZ}]}], holes, rogues, found:{}, flags:{renamed,rateMax,arrivals:[{from,to}],survived:[names],captured:n,merged:n} } */
export const TIER_REWARD=[50,150,400,1000];
export const UNLOCKS=[
  { tier:0, items:['G, K and M stars','rocky, ocean, gas, lava and ice worlds','moons','the time dial'] },
  { tier:1, items:['A and F stars','companion stars','probes'] },
  { tier:2, items:['O and B stars (blue giants)','black holes'] },
  { tier:3, items:['everything; missions keep coming'] },
];
export const UNLOCK_CLASSES=[['G','K','M'],['A','F'],['O','B'],[]];
export function classesForTier(t){ const out=[]; for(let i=0;i<=Math.min(t,3);i++) out.push(...UNLOCK_CLASSES[i]); return out; }
export function tierFor(completed){ return Math.min(3,Math.floor(completed/3)); }
export function featureUnlocked(feature,tier){ const need={companions:1,probes:1,holes:2,bluegiants:2}[feature]; return need===undefined?true:tier>=need; }

const first=(arr,f)=>arr.find(f)||null;
const anyPlanet=(ctx,f)=>{ for(const s of ctx.stars) for(const p of s.planets) if(f(p,s)) return true; return false; };
const planets=ctx=>ctx.stars.flatMap(s=>s.planets.map(p=>({p,s})));
const star=(ctx,id)=>first(ctx.stars,s=>s.id===id);
const planet=(ctx,id)=>{ for(const s of ctx.stars) for(const p of s.planets) if(p.id===id) return p; return null; };
/** Current name of a body by id, falling back to the name recorded when the mission was drawn. */
const nm=(ctx,id,fallback)=>{ if(ctx){ const b=star(ctx,id)||planet(ctx,id); if(b) return b.name; } return fallback; };

export const TEMPLATES=[
  // tier 0: the basics
  { id:'plant', tier:0, pick:ctx=>({n:ctx.stars.length}), text:()=>'Plant a star of your own', check:(ctx,q)=>ctx.stars.length>q.n },
  { id:'three-planets', tier:0, pick:ctx=>{ const s=first(ctx.stars,s=>s.disc&&s.planets.length<3); return s?{star:s.id,starName:s.name,n:3}:null; }, text:(q,ctx)=>`Grow three planets around ${nm(ctx,q.star,q.starName)} while its disc lasts`, check:(ctx,q)=>{ const s=star(ctx,q.star); return !!s&&s.planets.length>=q.n; } },
  { id:'ocean-hz', tier:0, pick:ctx=>{ const s=first(ctx.stars,s=>s.disc&&!s.planets.some(p=>p.type==='ocean'&&p.inHZ)); return s?{star:s.id,starName:s.name}:null; }, text:(q,ctx)=>`Grow an ocean world inside ${nm(ctx,q.star,q.starName)}'s habitable zone`, check:(ctx,q)=>{ const s=star(ctx,q.star); return !!s&&s.planets.some(p=>p.type==='ocean'&&p.inHZ); } },
  { id:'moon', tier:0, pick:ctx=>{ const e=first(planets(ctx),e=>e.p.moons===0&&!e.p.scorched); return e?{planet:e.p.id,planetName:e.p.name}:null; }, text:(q,ctx)=>`Give ${nm(ctx,q.planet,q.planetName)} a moon`, check:(ctx,q)=>{ const p=planet(ctx,q.planet); return !!p&&p.moons>0; } },
  { id:'rename', tier:0, pick:()=>({}), text:()=>'Name a world yourself (tap its name in the panel)', check:ctx=>!!ctx.flags.renamed },
  { id:'fast', tier:0, pick:()=>({}), text:()=>'Run the clock at a million years per second', check:ctx=>ctx.flags.rateMax>=4 },
  // tier 1: life and tools
  { id:'life', tier:1, pick:ctx=>{ const e=first(planets(ctx),e=>e.p.alive&&e.p.stage===0); return e?{planet:e.p.id,planetName:e.p.name}:null; }, text:(q,ctx)=>`Keep ${nm(ctx,q.planet,q.planetName)} habitable until life appears (100 Myr)`, check:(ctx,q)=>{ const p=planet(ctx,q.planet); return !!p&&p.stage>=1; } },
  { id:'complex', tier:1, pick:ctx=>anyPlanet(ctx,p=>p.stage>=2)?null:{}, text:()=>'Raise complex life somewhere (500 Myr of unbroken habitability)', check:ctx=>anyPlanet(ctx,p=>p.stage>=2) },
  { id:'probe', tier:1, pick:ctx=>{ const e=first(planets(ctx),e=>!e.p.scorched); const t=first(ctx.stars,s=>e&&s.id!==e.s.id); return e&&t?{from:e.p.id,fromName:e.p.name,to:t.id,toName:t.name}:null; }, text:(q,ctx)=>`Send a probe from ${nm(ctx,q.from,q.fromName)} to ${nm(ctx,q.to,q.toName)}`, check:(ctx,q)=>ctx.flags.arrivals.some(a=>a.from===q.from&&a.to===q.to) },
  { id:'companion', tier:1, pick:ctx=>{ const s=first(ctx.stars,s=>!s.binary&&!['P','D'].includes(s.cls)); return s?{star:s.id,starName:s.name}:null; }, text:(q,ctx)=>`Give ${nm(ctx,q.star,q.starName)} a companion star (arm Plant and tap inside its system)`, check:(ctx,q)=>{ const s=star(ctx,q.star); return !!s&&s.binary; } },
  { id:'ringed', tier:1, pick:ctx=>anyPlanet(ctx,p=>p.type==='gas'&&p.rings&&p.moons>=3)?null:{}, text:()=>'Build a system with a ringed gas giant that has three moons', check:ctx=>anyPlanet(ctx,p=>p.type==='gas'&&p.rings&&p.moons>=3) },
  { id:'survive', tier:1, pick:ctx=>{ const e=first(planets(ctx),e=>e.p.stage>=1); return e?{planet:e.p.id,planetName:e.p.name}:null; }, text:(q,ctx)=>`Keep life on ${nm(ctx,q.planet,q.planetName)} alive through a comet strike`, check:(ctx,q)=>ctx.flags.survived.includes(q.planet) },
  // tier 2: the big events
  { id:'civ', tier:2, pick:ctx=>anyPlanet(ctx,p=>p.stage>=3)?null:{}, text:()=>'Raise a civilisation (1.5 Gyr of life with no recent extinction)', check:ctx=>anyPlanet(ctx,p=>p.stage>=3) },
  { id:'supernova', tier:2, pick:ctx=>({n:ctx.counts.supernovae}), text:()=>'Witness a supernova (plant an O or B star and wait, or merge your way past eight solar masses)', check:(ctx,q)=>ctx.counts.supernovae>q.n },
  { id:'bind', tier:2, pick:ctx=>({n:ctx.stars.filter(s=>s.bound).length}), text:()=>'Plant a black hole and let it capture a star', check:(ctx,q)=>ctx.stars.filter(s=>s.bound).length>q.n },
  { id:'merge', tier:2, pick:ctx=>({n:ctx.flags.merged}), text:()=>'Merge a close binary into one heavier star', check:(ctx,q)=>ctx.flags.merged>q.n },
  { id:'capture', tier:2, pick:ctx=>({n:ctx.flags.captured}), text:()=>'Get a rogue world captured by another star', check:(ctx,q)=>ctx.flags.captured>q.n },
  // tier 3: mastery
  { id:'spacefaring', tier:3, pick:ctx=>anyPlanet(ctx,p=>p.stage>=4)?null:{}, text:()=>'Raise a spacefaring civilisation (2 Gyr)', check:ctx=>anyPlanet(ctx,p=>p.stage>=4) },
  { id:'evacuate', tier:3, pick:ctx=>({n:ctx.counts.evacuated}), text:()=>'Evacuate an interstellar civilisation to a new world before its star dies', check:(ctx,q)=>ctx.counts.evacuated>q.n },
  { id:'massive', tier:3, pick:ctx=>({n:ctx.counts.massiveMade}), text:()=>'Build a star of more than eight solar masses by merging', check:(ctx,q)=>ctx.counts.massiveMade>q.n },
  { id:'tde', tier:3, pick:ctx=>({n:ctx.counts.tde}), text:()=>'Watch a black hole tear a star apart', check:(ctx,q)=>ctx.counts.tde>q.n },
  { id:'xray', tier:3, pick:ctx=>({n:ctx.counts.xray}), text:()=>'Set up an X-ray binary: a star feeding a black hole', check:(ctx,q)=>ctx.counts.xray>q.n },
  { id:'legacy', tier:3, pick:ctx=>({target:Math.round((ctx.legacy+2000)/500)*500}), text:q=>`Reach a Legacy of ${q.target.toLocaleString('en-US')}`, check:(ctx,q)=>ctx.legacy>=q.target },
];

/** Draw up to `want` new missions for a tier from the templates not already active or completed. Missions from lower tiers fill in when the current tier runs dry. */
export function draw(ctx,tier,activeIds,doneIds,want,rng=Math.random){
  const out=[]; const used=new Set([...activeIds,...doneIds]);
  for(let t=tier;t>=0&&out.length<want;t--){
    const pool=TEMPLATES.filter(m=>m.tier===t&&!used.has(m.id));
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    for(const m of pool){ if(out.length>=want) break; const q=m.pick(ctx,rng); if(q){ out.push({id:m.id,q,tier:m.tier}); used.add(m.id); } }
  }
  return out;
}
export function describe(mission,ctx){ const m=TEMPLATES.find(t=>t.id===mission.id); return m?m.text(mission.q,ctx):mission.id; }
export function isDone(ctx,mission){ const m=TEMPLATES.find(t=>t.id===mission.id); return !!m&&m.check(ctx,mission.q); }
/** A mission whose subject no longer exists cannot be completed; it is re-rolled. */
export function isStale(ctx,mission){ const q=mission.q||{}; const ids=new Set(); for(const s of ctx.stars){ ids.add(s.id); for(const p of s.planets) ids.add(p.id); }
  for(const k of ['star','planet','from','to']) if(q[k]&&!ids.has(q[k])) return true; return false; }
