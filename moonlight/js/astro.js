const DAY = 86400000;
const MIN = new Date(1900, 0, 1);
const MAX = new Date(2101, 0, 1);
const monthCache = new Map();

function engine() {
  if (!globalThis.Astronomy) throw new Error('Astronomy Engine 未加载');
  return globalThis.Astronomy;
}

function assertDate(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new RangeError('请输入有效日期');
  if (date < MIN || date >= MAX) throw new RangeError('真实天文模式支持 1900—2100 年');
  return date;
}

const clamp01 = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const localDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const localKey = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export function phaseAt(date) {
  assertDate(date);
  const A = engine();
  const elongation = A.MoonPhase(date);
  return {
    elongation,
    phase: ((elongation % 360) + 360) % 360 / 360,
    illumination: A.Illumination(A.Body.Moon, date).phase_fraction
  };
}

function enumerateQuarters(date) {
  const A = engine();
  const result = [];
  let quarter = A.SearchMoonQuarter(new Date(date.getTime() - 36 * DAY));
  const endLimit = date.getTime() + 36 * DAY;
  for (let i = 0; i < 24 && quarter.time.date.getTime() <= endLimit; i++) {
    result.push({ quarter: quarter.quarter, fraction: quarter.quarter / 4, date: quarter.time.date });
    quarter = A.NextMoonQuarter(quarter);
  }
  return result;
}

export function lunarMonthAround(date) {
  assertDate(date);
  const key = localKey(date);
  if (monthCache.has(key)) return monthCache.get(key);

  const all = enumerateQuarters(date);
  const civilDay = localDay(date);
  const start = all.filter(q => q.quarter === 0 && localDay(q.date) <= civilDay).at(-1)?.date;
  const end = all.find(q => q.quarter === 0 && localDay(q.date) > civilDay)?.date;
  const phaseStart = all.filter(q => q.quarter === 0 && q.date <= date).at(-1)?.date || start;
  if (!start || !end) throw new Error('无法确定日期所在的朔望月');

  const quarters = all
    .filter(q => q.date >= start && q.date <= end)
    .map(q => ({ ...q, fraction: q.date.getTime() === end.getTime() ? 1 : q.fraction }));
  const value = {
    start,
    end,
    phaseStart,
    quarters,
    lengthDays: (end - start) / DAY,
    dayCount: Math.max(29, Math.min(30, Math.round((localDay(end) - localDay(start)) / DAY)))
  };
  monthCache.set(key, value);
  if (monthCache.size > 120) monthCache.delete(monthCache.keys().next().value);
  return value;
}

export function dateForMonthDay(date, dayIndex) {
  const month = lunarMonthAround(date);
  const index = Math.max(0, Math.min(month.dayCount - 1, Math.round(dayIndex)));
  return new Date(month.start.getFullYear(), month.start.getMonth(), month.start.getDate() + index, 12, 0, 0, 0);
}

export function dayIndexForDate(date) {
  const month = lunarMonthAround(date);
  return Math.max(0, Math.min(month.dayCount - 1, Math.round((localDay(date) - localDay(month.start)) / DAY)));
}

export function dateAtPhase(date, fraction) {
  const target = clamp01(fraction);
  const month = lunarMonthAround(date);
  const anchors = month.quarters;
  for (const anchor of anchors) {
    if (Math.abs(anchor.fraction - target) < 1e-9) return new Date(anchor.date);
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    const left = anchors[i], right = anchors[i + 1];
    if (target >= left.fraction && target <= right.fraction) {
      const ratio = (target - left.fraction) / (right.fraction - left.fraction);
      return new Date(left.date.getTime() + ratio * (right.date - left.date));
    }
  }
  return new Date(month.start);
}

export function nextKeyPhase(date) {
  const month = lunarMonthAround(date);
  const next = month.quarters.find(q => q.date > date) || month.quarters.at(-1);
  const names = { 0: '朔', 0.25: '上弦', 0.5: '望', 0.75: '下弦', 1: '朔' };
  return { date: next.date, name: names[next.fraction], fraction: next.fraction };
}

export function phaseLabel(phase) {
  const angle = ((phase % 1) + 1) % 1 * 360;
  const near = target => Math.abs(((angle - target + 540) % 360) - 180) <= 6;
  if (near(0)) return { name: '新月', alias: '朔月', short: '朔' };
  if (near(90)) return { name: '上弦月', alias: '弦月', short: '上弦' };
  if (near(180)) return { name: '满月', alias: '望月', short: '望' };
  if (near(270)) return { name: '下弦月', alias: '下弦', short: '下弦' };
  if (angle < 90) return { name: '蛾眉月', alias: '蛾眉', short: '蛾眉' };
  if (angle < 180) return { name: '盈凸月', alias: '渐盈', short: '盈凸' };
  if (angle < 270) return { name: '亏凸月', alias: '渐亏', short: '亏凸' };
  return { name: '残月', alias: '残月', short: '残月' };
}
