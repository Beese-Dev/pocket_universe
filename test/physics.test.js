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
