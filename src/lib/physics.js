/** Pure astrophysics used by the simulation. Distances in game units (15 units = 1 AU), masses in solar masses, time in years. */
export const UNITS_PER_AU=15;
export const GM_UNITS=133245; /* 4π² · 15³: gravitational parameter per solar mass, in game units³ per year² */
/** Kepler's third law: orbital period in years for a semi-major axis in game units around mass M. */
export function periodYears(aUnits,M){ const a=aUnits/UNITS_PER_AU; return Math.sqrt(a*a*a/Math.max(M,.01)); }
/** Main-sequence lifetime in years: 10 Gyr × M^-2.5. */
export function lifetimeYears(M){ return 1e10*Math.pow(Math.max(M,.01),-2.5); }
/** Luminosity in solar units from mass, with the giant phase and compact remnants. */
export function luminosityOf(M,cls,giantF=1){ let L=Math.pow(M,3.5); if(cls==='D') L=.001; if(cls==='P') L=.0001; if(giantF>1) L*=Math.pow(giantF,2)*3; return L; }
/** Habitable zone edges in AU (Kasting-style flux limits 1.1 and 0.53). */
export function habitableZoneAU(L){ return {inner:Math.sqrt(L/1.1),outer:Math.sqrt(L/.53)}; }
/** Rough planet mass in Earth masses from size and type. */
export function planetMass(d){ return d.size*d.size*d.size*(d.type==='gas'?25:1); }
/** Moon period in years from its orbit (in planet-radius-ish units) and its planet's mass. */
export function moonPeriodYears(planetD,md){ return 27.3*Math.pow(md.orbit/2.4,1.5)/Math.sqrt(planetMass(planetD))/365.25; }
/** Equilibrium temperature in kelvin at distance au from a star of luminosity L (albedo folded in). */
export function equilibriumTemp(L,au){ return 278*Math.pow(L,.25)/Math.sqrt(au); }
/** Does the star's mass loss unbind its planets? More than half the mass gone means yes. */
export function unbindsPlanets(massBefore,massAfter){ return massAfter<massBefore*.5; }
/** White-dwarf mass from the initial mass (initial–final mass relation, capped at the Chandrasekhar limit). */
export function whiteDwarfMass(M0){ return +Math.min(1.3,.45+.1*M0).toFixed(2); }
/** Tidal radius of a star near a black hole: a few stellar radii, scaled by the cube root of the mass ratio. */
export function tidalRadius(starR,starM,holeM,holeR){ return starR*Math.cbrt(holeM/Math.max(starM,.1))*1.6+holeR; }
