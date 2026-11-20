import test from 'node:test';
import assert from 'node:assert/strict';
import { solarToLunar } from '../js/lunar.js';

test('converts known Gregorian dates to Chinese lunar dates', () => {
  assert.deepEqual(solarToLunar(new Date(2000, 0, 1)), { y: 1999, m: 11, d: 25, leap: false });
  assert.deepEqual(solarToLunar(new Date(2024, 1, 10)), { y: 2024, m: 1, d: 1, leap: false });
  assert.deepEqual(solarToLunar(new Date(2026, 10, 20)), { y: 2026, m: 10, d: 12, leap: false });
});

test('handles leap months and range boundaries', () => {
  assert.deepEqual(solarToLunar(new Date(2020, 4, 23)), { y: 2020, m: 4, d: 1, leap: true });
  assert.deepEqual(solarToLunar(new Date(1900, 0, 31)), { y: 1900, m: 1, d: 1, leap: false });
  assert.throws(() => solarToLunar(new Date(1899, 11, 31)), /1900/);
  assert.throws(() => solarToLunar(new Date(2101, 0, 1)), /2100/);
});
