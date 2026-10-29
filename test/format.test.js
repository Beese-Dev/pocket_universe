import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtYears, fmtReal } from '../src/lib/format.js';
import { mulberry } from '../src/lib/rng.js';
import { dailyTotal } from '../src/lib/score.js';

test('years format at every scale without exponents', () => {
  assert.equal(fmtYears(0.5), '183 d');
  assert.equal(fmtYears(42), '42 yr');
  assert.equal(fmtYears(12_345), '12.3 kyr');
  assert.equal(fmtYears(999_999_999), '1 Gyr');
  assert.equal(fmtYears(4.6e9), '4.6 Gyr');
});
test('real time formats sensibly', () => {
  assert.equal(fmtReal(30), '30 s');
  assert.equal(fmtReal(600), '10 min');
  assert.equal(fmtReal(7200), '2.0 h');
});
test('the seeded generator is deterministic', () => {
  const a = mulberry(20261028), b = mulberry(20261028);
  assert.equal(a(), b());
  assert.notEqual(mulberry(1)(), mulberry(2)());
});
test('Legacy score weights life, survivors and discoveries', () => {
  assert.equal(dailyTotal({ life: 100.4, alive: 2, disc: 3 }), 275);
});
