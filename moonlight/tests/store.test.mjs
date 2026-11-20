import './load-astronomy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

const NOW = new Date('2026-11-20T04:00:00Z');

test('real view exposes scientific values and actual month length', () => {
  const store = createStore({ now: NOW });
  const view = store.getView();
  assert.equal(view.mode, 'real');
  assert.equal(view.dayIndex, 11);
  assert.equal(view.dayCount, 30);
  assert.ok(Math.abs(view.illumination - 0.759101672126782) < 1e-8);
  assert.equal(view.phaseName, '盈凸月');
  assert.ok(view.monthLengthDays > 29 && view.monthLengthDays < 30);
});

test('real day selection uses local noon and exact phase selection uses quarter time', () => {
  const store = createStore({ now: NOW });
  store.setDay(0);
  assert.equal(store.getView().dayIndex, 0);
  assert.equal(store.getView().date.getHours(), 12);
  store.setPhase(0.5);
  assert.equal(store.getView().date.toISOString(), '2026-11-24T14:54:04.191Z');
  assert.ok(Math.abs(store.getView().phase - 0.5) < 1e-6);
});

test('simulation preserves its 29.53-day teaching semantics', () => {
  const store = createStore({ now: NOW, mode: 'sim' });
  store.setDay(14);
  assert.equal(store.getView().phase, 14 / 29.53);
  assert.equal(store.getView().dayCount, 30);
  store.setPhase(0.75);
  assert.equal(store.getView().phase, 0.75);
  store.setMonthProgress(2);
  assert.equal(store.getView().monthProgress, 1);
  assert.equal(store.getView().dayIndex, 29);
});

test('mode switching and subscribers are deterministic', () => {
  const store = createStore({ now: NOW });
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  store.setMode('sim');
  assert.ok(Math.abs(store.getView().phase - 0.336462435419) < 1e-6);
  store.setDay(7);
  store.setMode('real');
  assert.equal(store.getView().date.toISOString(), NOW.toISOString());
  assert.equal(notifications, 3);
  unsubscribe();
  store.setDay(1);
  assert.equal(notifications, 3);
  assert.throws(() => store.setMode('unknown'), /模式/);
  assert.throws(() => store.setDate(new Date('invalid')), /有效日期/);
});
