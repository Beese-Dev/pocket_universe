import { test } from 'node:test';
import assert from 'node:assert/strict';
import { periodYears, lifetimeYears, luminosityOf, habitableZoneAU, equilibriumTemp, whiteDwarfMass, unbindsPlanets, tidalRadius, moonPeriodYears, UNITS_PER_AU } from '../src/lib/physics.js';

test('Earth takes a year to orbit a solar-mass star at 1 AU', () => {
  assert.ok(Math.abs(periodYears(UNITS_PER_AU, 1) - 1) < 1e-9);
});
test('Jupiter at 5.2 AU takes about 11.9 years', () => {
  const p = periodYears(5.2 * UNITS_PER_AU, 1);
  assert.ok(p > 11.5 && p < 12.2, p);
});
test('lifetimes: the Sun 10 Gyr, a 16-solar-mass star about 10 Myr, a red dwarf far longer', () => {
  assert.equal(lifetimeYears(1), 1e10);
  assert.ok(Math.abs(lifetimeYears(16) - 9.77e6) < 1e5);
  assert.ok(lifetimeYears(0.3) > 1e11);
});
test('luminosity scales steeply with mass; remnants are dim; giants are bright', () => {
  assert.equal(luminosityOf(1, 'G'), 1);
  assert.ok(luminosityOf(2, 'A') > 10);
  assert.ok(luminosityOf(1, 'D') < 0.01);
  assert.ok(luminosityOf(1, 'G', 5) > 50);
});
test('the habitable zone of a Sun-like star brackets 1 AU', () => {
  const hz = habitableZoneAU(1);
  assert.ok(hz.inner < 1 && hz.outer > 1, JSON.stringify(hz));
});
test('equilibrium temperature at 1 AU around the Sun is near 278 K and falls with distance', () => {
  assert.ok(Math.abs(equilibriumTemp(1, 1) - 278) < 1);
  assert.ok(equilibriumTemp(1, 4) < equilibriumTemp(1, 1));
});
test('white dwarf mass follows the initial-final relation and never exceeds the Chandrasekhar limit', () => {
  assert.equal(whiteDwarfMass(1), 0.55);
  assert.equal(whiteDwarfMass(20), 1.3);
});
test('planets unbind only when more than half the mass is lost', () => {
  assert.equal(unbindsPlanets(1, 0.55), false);
  assert.equal(unbindsPlanets(2.1, 0.66), true);
});
test('tidal radius grows with the hole-to-star mass ratio', () => {
  assert.ok(tidalRadius(3, 1, 10, 2) < tidalRadius(3, 1, 80, 2));
});
test('a moon at 2.4 units around an Earth-mass world takes about 27 days', () => {
  const days = moonPeriodYears({ size: 1, type: 'rocky' }, { orbit: 2.4 }) * 365.25;
  assert.ok(Math.abs(days - 27.3) < 0.1, days);
});

import { hillRadius, stableLimit } from '../src/lib/physics.js';
test('Hill radius: a 10-solar-mass hole 60 units from a Sun-like star leaves about 19 units bound, 9.7 stable', () => {
  assert.ok(Math.abs(hillRadius(60, 1, 10) - 19.3) < 0.2);
  assert.ok(Math.abs(stableLimit(60, 1, 10) - 9.66) < 0.1);
});
test('the Hill radius shrinks as the hole gets closer or heavier', () => {
  assert.ok(hillRadius(30, 1, 10) < hillRadius(60, 1, 10));
  assert.ok(hillRadius(60, 1, 40) < hillRadius(60, 1, 10));
});

import { mergeTimeYears, classForMass, circumbinaryLimit } from '../src/lib/physics.js';
test('binary merge times: contact pairs in tens of Myr, wide pairs never; a black hole speeds it up', () => {
  assert.ok(mergeTimeYears(5, 2.5, 2.5) < 3e7);
  assert.equal(mergeTimeYears(40, 3, 2), Infinity);
  assert.ok(mergeTimeYears(8, 3, 2, true) < mergeTimeYears(8, 3, 2));
});
test('a merged star is reclassified by mass', () => {
  const cat = { O:{m:16}, B:{m:9}, A:{m:2.1}, F:{m:1.3}, G:{m:1}, K:{m:.72}, M:{m:.33}, P:{m:1.4}, D:{m:.6} };
  assert.equal(classForMass(1.29, cat), 'F');
  assert.equal(classForMass(9.5, cat), 'B');
  assert.equal(classForMass(0.5, cat), 'K');
});
test('circumbinary planets need about 2.3 separations of room', () => {
  assert.equal(circumbinaryLimit(8), 18.4);
});
