/** Life and civilisations. A habitable world accumulates `lifeAge` (years of unbroken habitability) and climbs through stages.
 *  Timescales are compressed about threefold from Earth's so a civilisation is reachable inside a one-billion-year run, with Earth's order kept. */
export const STAGES=[
  { key:'none',         name:'No life yet',    after:0,     rate:0,  impactDeath:0,   lights:0 },
  { key:'microbial',    name:'Microbial',      after:1e8,   rate:1,  impactDeath:0,   lights:0 },
  { key:'complex',      name:'Complex life',   after:5e8,   rate:2,  impactDeath:.55, lights:0 },
  { key:'civilised',    name:'Civilisation',   after:1.5e9, rate:5,  impactDeath:.30, lights:.6 },
  { key:'spacefaring',  name:'Spacefaring',    after:2e9,   rate:10, impactDeath:.10, lights:1 },
  { key:'interstellar', name:'Interstellar',   after:2.5e9, rate:20, impactDeath:0,   lights:1 },
];
/** Stage index for a given life age; a recent extinction (within 200 Myr) holds the world below civilisation. */
export function stageFor(lifeAge,sinceExtinction=Infinity){ let i=0; for(let k=0;k<STAGES.length;k++) if(lifeAge>=STAGES[k].after) i=k; if(i>=3&&sinceExtinction<2e8) i=2; return i; }
export function stageOf(i){ return STAGES[Math.max(0,Math.min(STAGES.length-1,i))]; }
/** Legacy points earned per year by a world at stage i. */
export function legacyRate(i){ return stageOf(i).rate/1e6; }
/** Does an impact winter end the civilisation at this stage? Returns the probability. */
export function impactDeathChance(i){ return stageOf(i).impactDeath; }
/** Tech level 0..10 within the civilised stages, for display. */
export function techLevel(lifeAge){ if(lifeAge<1.5e9) return 0; return Math.min(10,Math.round((lifeAge-1.5e9)/1.2e8)); }
