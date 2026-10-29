import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, stageFor, legacyRate, impactDeathChance, techLevel } from '../src/lib/civ.js';

test('stages rise with life age in Earth order', () => {
  assert.equal(STAGES[stageFor(0)].key, 'none');
  assert.equal(STAGES[stageFor(2e8)].key, 'microbial');
  assert.equal(STAGES[stageFor(6e8)].key, 'complex');
  assert.equal(STAGES[stageFor(1.6e9)].key, 'civilised');
  assert.equal(STAGES[stageFor(2.1e9)].key, 'spacefaring');
  assert.equal(STAGES[stageFor(3e9)].key, 'interstellar');
});
test('a recent extinction holds a world below civilisation', () => {
  assert.equal(STAGES[stageFor(1.6e9, 5e7)].key, 'complex');
  assert.equal(STAGES[stageFor(1.6e9, 3e8)].key, 'civilised');
});
test('legacy rates climb by stage; microbial earns 1 per Myr', () => {
  assert.equal(legacyRate(1) * 1e6, 1);
  assert.ok(legacyRate(5) > legacyRate(3) && legacyRate(3) > legacyRate(1));
});
test('impacts stop being fatal once a civilisation leaves its world', () => {
  assert.equal(impactDeathChance(1), 0);
  assert.ok(impactDeathChance(2) > impactDeathChance(3));
  assert.equal(impactDeathChance(5), 0);
});
test('tech level counts up from the civilised threshold', () => {
  assert.equal(techLevel(1e9), 0);
  assert.equal(techLevel(1.5e9), 0);
  assert.equal(techLevel(2.1e9), 5);
  assert.equal(techLevel(9e9), 10);
});
