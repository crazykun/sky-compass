import { createStore } from './store.js';
import { solarToLunar, formatLunar, WEEK } from './lunar.js';
import { POEMS, CN_LUNAR_MONTH } from './data.js';
import { initCalendar } from './lunar-calendar.js';
import { initCause } from './cause.js';
import { initTimeline } from './timeline.js';
import { initSolar } from './solar-system.js';
import { initStarfield } from './starfield.js';
import { initMoonDetail } from './moon-detail.js';
import { initKids } from './kids.js';

const params = new URLSearchParams(location.search);
if (params.get('space') === '1') document.body.classList.add('space');

function localDateFromInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError('请输入有效日期');
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) throw new RangeError('请输入有效日期');
  return date;
}

let initialDate = new Date();
let initialError = '';
if (params.has('date')) {
  try { initialDate = localDateFromInput(params.get('date')); solarToLunar(initialDate); }
  catch (error) { initialError = error.message; initialDate = new Date(); }
}
const store = createStore({ now: initialDate, mode: params.get('mode') === 'sim' ? 'sim' : 'real' });
let timeline, solar;

function stopOtherPlayback() {
  timeline?.pause();
  solar?.pause();
}

function initModeControls() {
  const realButton = document.getElementById('realMode'), simButton = document.getElementById('simMode');
  const input = document.getElementById('astroDate'), error = document.getElementById('dateError');
  error.textContent = initialError;
  realButton.addEventListener('click', () => { stopOtherPlayback(); store.setMode('real'); });
  simButton.addEventListener('click', () => { stopOtherPlayback(); store.setMode('sim'); });
  input.addEventListener('change', event => {
    try {
      const date = localDateFromInput(event.currentTarget.value);
      stopOtherPlayback(); store.setDate(date, 'date-input'); error.textContent = '';
    } catch (exception) { error.textContent = exception.message; }
  });
  document.getElementById('todayBtn').addEventListener('click', () => { stopOtherPlayback(); store.setDate(new Date(), 'today'); error.textContent = ''; });

  function render(view) {
    const real = view.mode === 'real';
    for (const [button, selected] of [[realButton, real], [simButton, !real]]) {
      button.classList.toggle('on', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    document.body.dataset.mode = view.mode;
    input.disabled = !real;
    document.getElementById('modeBadge').textContent = real ? '真实天文' : '教学模拟';
    document.getElementById('modeNote').textContent = real
      ? '真实模式：关键月相由 Astronomy Engine 计算；手动选日展示当地 12:00，回到今天展示当前时刻。'
      : '教学模式：使用平均朔望月 29.53 天和固定三十日，仅用于理解月相变化，不作为天文历表。';
    document.getElementById('calendarTitle').textContent = real ? '🌙 真实月相历 · 点击探索' : '🌙 教学月相历 · 点击探索';
    document.getElementById('calendarSubtitle').textContent = real ? '按当前朔望月展示真实的 29 或 30 个农历日' : '固定三十天与平均周期，名称和日期仅作教学示意';
    document.getElementById('timelineSubtitle').textContent = real ? `当前朔望月 ${view.monthLengthDays.toFixed(2)} 天，关键时刻按真实时刻定位` : '平均朔望月 29.53 天，关键时刻为教学近似值';
  }
  store.subscribe(render);
  render(store.getView());
}

function initToday() {
  const now = new Date(), lunar = solarToLunar(now);
  document.getElementById('todaySolar').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${WEEK[now.getDay()]}`;
  document.getElementById('todayLunar').textContent = `· 农历${formatLunar(lunar)}`;
}

function initTheme() {
  const button = document.getElementById('themeBtn');
  const sync = () => { button.textContent = document.body.classList.contains('space') ? '🌙 返回夜空' : '🌌 切换到太空'; };
  button.addEventListener('click', () => { document.body.classList.toggle('space'); sync(); });
  sync();
}

function initPoems() {
  let current = solarToLunar(new Date()).m - 1;
  const box = document.getElementById('poemMonths');
  function render() {
    const row = POEMS[current];
    document.getElementById('pmBig').textContent = row[0];
    document.getElementById('pmLab').textContent = `农历${CN_LUNAR_MONTH[current]} · 别称`;
    document.getElementById('pmLines').textContent = row[2];
    document.getElementById('pmAuthor').textContent = `—— ${row[3]}`;
    document.getElementById('pmStory').textContent = row[4];
    document.querySelectorAll('.pm-tab').forEach((button, index) => {
      button.classList.toggle('on', index === current);
      button.setAttribute('aria-pressed', String(index === current));
    });
  }
  CN_LUNAR_MONTH.forEach((month, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'pm-tab'; button.textContent = month;
    button.addEventListener('click', () => { current = index; render(); });
    box.appendChild(button);
  });
  render();
}

initToday();
initTheme();
initModeControls();
initCalendar({ store, onManual: stopOtherPlayback });
initCause({ store, onManual: stopOtherPlayback });
timeline = initTimeline({ store, onPlayStart: () => solar?.pause(), onManual: stopOtherPlayback });
solar = initSolar({ store, onLinkedStart: () => timeline?.pause(), onReset: () => timeline?.pause() });
initStarfield();
initMoonDetail();
initPoems();
initKids({ onModeChange: active => { if (active) stopOtherPlayback(); } });
