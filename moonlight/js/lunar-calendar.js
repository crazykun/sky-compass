import { drawMoon, phaseOf } from './moon.js';
import { CN, LMON } from './lunar.js';
import { DATA } from './data.js';
import { dateForMonthDay, phaseAt, phaseLabel } from './astro.js';

const sameLocalDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const pad = value => String(value).padStart(2, '0');
const dateInputValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatTime = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

export function initCalendar({ store, onManual = () => {} }) {
  const grid = document.getElementById('grid');
  const canvas = document.getElementById('moonCanvas');
  const ctx = canvas.getContext('2d');
  let gridKey = '';

  function buildGrid(view) {
    grid.replaceChildren();
    for (let index = 0; index < view.dayCount; index++) {
      let phase, label, date = null;
      if (view.mode === 'real') {
        date = dateForMonthDay(view.date, index);
        const science = phaseAt(date);
        phase = science.phase;
        label = phaseLabel(phase).short;
      } else {
        phase = phaseOf(index);
        label = DATA[index][1];
      }
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.day = String(index);
      cell.setAttribute('aria-label', `农历${CN[index]}，${label}`);
      if (date && view.month.quarters.some(q => sameLocalDay(q.date, date))) cell.classList.add('key');
      const cv = document.createElement('canvas'); cv.width = 80; cv.height = 80; cv.setAttribute('aria-hidden', 'true');
      drawMoon(cv.getContext('2d'), 40, 40, 32, phase, false);
      const day = document.createElement('div'); day.className = 'd'; day.textContent = CN[index];
      const name = document.createElement('div'); name.className = 'n'; name.textContent = label;
      cell.append(cv, day, name);
      cell.addEventListener('click', () => { onManual(); store.setDay(index, 'calendar'); });
      grid.appendChild(cell);
    }
  }

  function render(view) {
    const nextGridKey = view.mode === 'real' ? `${view.month.start.toISOString()}-${view.month.dayCount}` : 'sim';
    if (nextGridKey !== gridKey) { gridKey = nextGridKey; buildGrid(view); }
    for (const cell of grid.children) {
      const selected = Number(cell.dataset.day) === view.dayIndex;
      cell.classList.toggle('active', selected);
      cell.setAttribute('aria-pressed', String(selected));
    }

    ctx.clearRect(0, 0, 400, 400);
    const glow = ctx.createRadialGradient(200, 200, 130, 200, 200, 196);
    glow.addColorStop(0, `rgba(255,238,180,${.05 + view.illumination * .16})`);
    glow.addColorStop(1, 'rgba(255,238,180,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 400, 400);
    drawMoon(ctx, 200, 200, 142, view.phase);

    const isToday = view.mode === 'real' && sameLocalDay(view.date, new Date());
    const lunarDay = CN[view.dayIndex];
    document.getElementById('dayTitle').textContent = view.mode === 'real'
      ? `${isToday ? '今日 · ' : ''}农历${LMON[view.lunar.m - 1]}月${lunarDay} · ${view.phaseName}`
      : `教学模拟 · 农历${lunarDay} · ${view.phaseName}`;
    document.getElementById('alias').textContent = `✦ ${view.alias}`;
    document.getElementById('desc').textContent = view.description;
    document.getElementById('phaseName').textContent = view.phaseName;
    document.getElementById('illumVal').textContent = `${Math.round(view.illumination * 100)}%`;
    document.getElementById('dayVal').textContent = pad(view.dayIndex + 1);
    document.getElementById('illumBar').style.width = `${view.illumination * 100}%`;
    document.getElementById('astroFacts').textContent = view.mode === 'real'
      ? `月龄 ${view.ageDays.toFixed(2)} 天 · 朔望月 ${view.monthLengthDays.toFixed(2)} 天；下一关键月相「${view.next.name}」：${formatTime(view.next.date)}`
      : '平均朔望月 29.53 天的等比例教学模型，不对应某个真实月份的精确时刻。';
    canvas.setAttribute('aria-label', `${lunarDay}，${view.phaseName}，亮面比例${Math.round(view.illumination * 100)}%`);

    const dateInput = document.getElementById('astroDate');
    if (view.mode === 'real' && document.activeElement !== dateInput) dateInput.value = dateInputValue(view.date);
  }

  store.subscribe(render);
  render(store.getView());
}
