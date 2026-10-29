import { mulberry } from '../lib/rng.js';
import { sig3, fmtYears, fmtReal } from '../lib/format.js';
import { UNITS_PER_AU, GM_UNITS, periodYears, lifetimeYears, luminosityOf, habitableZoneAU, planetMass, moonPeriodYears as moonPeriodYearsLib, equilibriumTemp, unbindsPlanets, whiteDwarfMass, tidalRadius, stableLimit, mergeTimeYears, classForMass, circumbinaryLimit } from '../lib/physics.js';
import { DAILY_SPAN, DAILY_BUDGET, dailyTotal } from '../lib/score.js';
import { TEMPLATES, TIER_REWARD, UNLOCKS, classesForTier, tierFor, featureUnlocked, draw as drawMissions, describe as describeMission, isDone as missionDone, isStale as missionStale } from '../lib/missions.js';
import { STAGES, stageFor, stageOf, legacyRate, impactDeathChance, techLevel } from '../lib/civ.js';
