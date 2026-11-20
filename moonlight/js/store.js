import { DATA } from './data.js';
import { phaseAt, lunarMonthAround, dateForMonthDay, dayIndexForDate, dateAtPhase, nextKeyPhase, phaseLabel } from './astro.js';
import { solarToLunar } from './lunar.js';

const DAY = 86400000;
const SYNODIC = 29.53;
const clamp01 = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const illuminationOf = phase => (1 - Math.cos(phase * Math.PI * 2)) / 2;

export function createStore({ now = new Date(), mode = 'real', simPhase = 0 } = {}) {
  let realDate = new Date(now);
  let currentMode = mode;
  let progress = clamp01(simPhase);
  let cachedView = null;
  const listeners = new Set();

  if (!['real', 'sim'].includes(currentMode)) throw new RangeError('未知月相模式');
  solarToLunar(realDate);

  function invalidate() { cachedView = null; }

  function notify(source) {
    const view = getView();
    for (const listener of [...listeners]) listener(view, { source });
  }

  function getView() {
    if (cachedView) return cachedView;
    if (currentMode === 'sim') {
      const dayIndex = Math.min(29, Math.round(progress * SYNODIC));
      const row = DATA[dayIndex];
      const nextFraction = [0.25, 0.5, 0.75, 1].find(value => value > progress + 1e-9) ?? 1;
      const names = { 0.25: '上弦', 0.5: '望', 0.75: '下弦', 1: '朔' };
      cachedView = {
        mode: 'sim', date: null, lunar: null, month: null,
        phase: progress, illumination: illuminationOf(progress),
        dayIndex, dayCount: 30, monthProgress: progress,
        monthLengthDays: SYNODIC, ageDays: progress * SYNODIC,
        phaseName: row[2], alias: row[1], shortName: row[2], description: row[3],
        next: { fraction: nextFraction, name: names[nextFraction] }
      };
      return cachedView;
    }

    const month = lunarMonthAround(realDate);
    const science = phaseAt(realDate);
    const label = phaseLabel(science.phase);
    const dayIndex = dayIndexForDate(realDate);
    const ageDays = (realDate - month.phaseStart) / DAY;
    cachedView = {
      mode: 'real', date: new Date(realDate), lunar: solarToLunar(realDate), month,
      phase: science.phase, elongation: science.elongation, illumination: science.illumination,
      dayIndex, dayCount: month.dayCount,
      monthProgress: clamp01((realDate - month.start) / (month.end - month.start)),
      monthLengthDays: month.lengthDays, ageDays,
      phaseName: label.name, alias: label.alias, shortName: label.short,
      description: `真实月龄 ${ageDays.toFixed(2)} 天，月相角 ${science.elongation.toFixed(2)}°。亮面比例来自太阳—月球—地球几何关系，并非肉眼感知亮度。`,
      next: nextKeyPhase(realDate)
    };
    return cachedView;
  }

  function setMode(value, source = 'mode') {
    if (!['real', 'sim'].includes(value)) throw new RangeError('未知月相模式');
    if (value === currentMode) return;
    if (value === 'sim' && currentMode === 'real') progress = phaseAt(realDate).phase;
    currentMode = value;
    invalidate();
    notify(source);
  }

  function setDate(value, source = 'manual') {
    const date = new Date(value);
    solarToLunar(date);
    lunarMonthAround(date);
    if (date.getTime() === realDate.getTime() && currentMode === 'real') return;
    realDate = date;
    currentMode = 'real';
    invalidate();
    notify(source);
  }

  function setDay(index, source = 'manual') {
    if (currentMode === 'real') {
      setDate(dateForMonthDay(realDate, index), source);
      return;
    }
    progress = clamp01(Math.round(index) / SYNODIC);
    invalidate();
    notify(source);
  }

  function setPhase(fraction, source = 'manual') {
    if (currentMode === 'real') {
      setDate(dateAtPhase(realDate, clamp01(fraction)), source);
      return;
    }
    const numeric = Number.isFinite(fraction) ? fraction : 0;
    progress = ((numeric % 1) + 1) % 1;
    invalidate();
    notify(source);
  }

  function setMonthProgress(fraction, source = 'timeline') {
    const value = clamp01(fraction);
    if (currentMode === 'real') {
      const month = lunarMonthAround(realDate);
      setDate(new Date(month.start.getTime() + value * (month.end - month.start)), source);
      return;
    }
    progress = value;
    invalidate();
    notify(source);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getView, setMode, setDate, setDay, setPhase, setMonthProgress, subscribe };
}
