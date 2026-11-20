import './load-astronomy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { phaseAt, lunarMonthAround, dateForMonthDay, dateAtPhase } from '../js/astro.js';

const minutesBetween = (a, b) => Math.abs(a.getTime() - b.getTime()) / 60000;

test('finds the April 2024 eclipse new moon within two minutes', () => {
  const month = lunarMonthAround(new Date('2024-04-08T18:30:00Z'));
  assert.equal(minutesBetween(month.start, new Date('2024-04-08T18:21:00Z')) < 2, true);
});

test('finds the September 2024 full moon within two minutes', () => {
  const month = lunarMonthAround(new Date('2024-09-18T03:00:00Z'));
  const full = month.quarters.find(q => q.fraction === 0.5);
  assert.ok(full);
  assert.equal(minutesBetween(full.date, new Date('2024-09-18T02:34:00Z')) < 2, true);
});

test('computes real elongation and illuminated fraction for 2026-11-20', () => {
  const result = phaseAt(new Date('2026-11-20T04:00:00Z'));
  assert.ok(Math.abs(result.elongation - 121.126476750864) < 1e-8);
  assert.ok(Math.abs(result.phase - 121.126476750864 / 360) < 1e-12);
  assert.ok(Math.abs(result.illumination - 0.759101672126782) < 1e-8);
});

test('returns ordered quarter anchors and a valid local month length', () => {
  const month = lunarMonthAround(new Date('2026-11-20T04:00:00Z'));
  assert.equal(month.start.toISOString(), '2026-11-09T07:02:42.392Z');
  assert.equal(month.end.toISOString(), '2026-12-09T00:52:31.284Z');
  assert.deepEqual(month.quarters.map(q => q.fraction), [0, 0.25, 0.5, 0.75, 1]);
  assert.equal(month.dayCount, 30);
  assert.ok(month.lengthDays > 29 && month.lengthDays < 30);
});

test('selects local month days and maps exact quarter fractions', () => {
  const now = new Date('2026-11-20T04:00:00Z');
  const month = lunarMonthAround(now);
  const firstDay = dateForMonthDay(now, 0);
  assert.equal(firstDay.getHours(), 12);
  const mapped = dateAtPhase(now, 0.5);
  assert.equal(mapped.toISOString(), month.quarters[2].date.toISOString());
  assert.equal(dateAtPhase(now, -1).toISOString(), month.start.toISOString());
  assert.equal(dateAtPhase(now, 2).toISOString(), month.end.toISOString());
});

test('rejects invalid and unsupported dates', () => {
  assert.throws(() => phaseAt(new Date('invalid')), /有效日期/);
  assert.throws(() => lunarMonthAround(new Date('1800-01-01T00:00:00Z')), /1900/);
});
