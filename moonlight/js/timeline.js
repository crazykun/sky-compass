import { drawMoon } from './moon.js';
import { addAnimation } from './animation.js';
import { CN, solarToLunar } from './lunar.js';

export function initTimeline({ store, onPlayStart = () => {}, onManual = () => {} }) {
  const range = document.getElementById('tlRange');
  const canvas = document.getElementById('tlMoon');
  const ctx = canvas.getContext('2d');
  const playButton = document.getElementById('tlPlay');
  let playing = false, anchorsKey = '', anchors = [];

  function syncButton() {
    playButton.textContent = playing ? '⏸ 暂停' : '▶ 播放';
    playButton.classList.toggle('on', playing);
    playButton.setAttribute('aria-pressed', String(playing));
  }

  function pause() { if (playing) { playing = false; syncButton(); } }

  function buildAnchors(view) {
    const key = view.mode === 'real' ? view.month.start.toISOString() : 'sim';
    if (key === anchorsKey) return;
    anchorsKey = key;
    const fractions = [0, .25, .5, .75, 1];
    const names = view.mode === 'real' ? ['朔', '上弦', '望', '下弦', '次朔'] : ['朔', '上弦', '望', '下弦', '晦'];
    anchors = fractions.map((fraction, index) => {
      let date = null, dayIndex = [0, 7, 14, 22, 29][index];
      if (view.mode === 'real') {
        const quarter = view.month.quarters[index];
        date = quarter.date;
        dayIndex = solarToLunar(date).d - 1;
      }
      return { fraction, date, dayIndex, name: names[index] };
    });

    const ticks = document.getElementById('tlTicks'), mini = document.getElementById('tlMini');
    ticks.replaceChildren(); mini.replaceChildren();
    anchors.forEach((anchor, index) => {
      const tick = document.createElement('span');
      tick.textContent = `${anchor.name} · ${CN[anchor.dayIndex]}`;
      ticks.appendChild(tick);
      const item = document.createElement('div');
      item.setAttribute('role', 'button'); item.tabIndex = 0;
      item.setAttribute('aria-label', `跳到${anchor.name}，${CN[anchor.dayIndex]}`);
      const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72;
      drawMoon(cv.getContext('2d'), 36, 36, 29, anchor.fraction, false);
      const text = document.createElement('div'); text.textContent = CN[anchor.dayIndex];
      item.append(cv, text);
      const select = () => {
        onManual(); pause();
        if (anchor.date) store.setDate(anchor.date, 'timeline-key');
        else store.setMonthProgress(anchor.fraction, 'timeline-key');
      };
      item.addEventListener('click', select);
      item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
      mini.appendChild(item);
    });
  }

  function render(view) {
    buildAnchors(view);
    range.value = String(Math.round(view.monthProgress * 10000));
    document.getElementById('tlRead').textContent = `第 ${(view.monthProgress * view.monthLengthDays).toFixed(2)} 天 / ${view.monthLengthDays.toFixed(2)}`;
    document.getElementById('tlPhase').textContent = view.phaseName;
    document.getElementById('tlIllum').textContent = `${Math.round(view.illumination * 100)}%`;
    document.getElementById('tlDay').textContent = CN[view.dayIndex];
    document.getElementById('tlMoonLabel').textContent = `农历${CN[view.dayIndex]} · ${view.phaseName}`;
    ctx.clearRect(0, 0, 360, 360);
    const glow = ctx.createRadialGradient(180, 180, 120, 180, 180, 178);
    glow.addColorStop(0, `rgba(255,238,180,${.05 + view.illumination * .16})`);
    glow.addColorStop(1, 'rgba(255,238,180,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 360, 360);
    drawMoon(ctx, 180, 180, 132, view.phase, true);
    let nearest = 0;
    anchors.forEach((anchor, index) => {
      if (Math.abs(anchor.fraction - view.monthProgress) < Math.abs(anchors[nearest].fraction - view.monthProgress)) nearest = index;
    });
    document.querySelectorAll('#tlTicks span').forEach((el, index) => el.classList.toggle('hot', index === nearest));
    document.querySelectorAll('#tlMini > div').forEach((el, index) => el.classList.toggle('hot', index === nearest));
  }

  range.addEventListener('input', event => {
    onManual(); pause();
    store.setMonthProgress(Number(event.currentTarget.value) / 10000, 'timeline-input');
  });
  playButton.addEventListener('click', () => {
    playing = !playing;
    if (playing) onPlayStart();
    syncButton();
  });
  addAnimation((time, dt) => {
    if (!playing) return;
    let next = store.getView().monthProgress + dt / 20000;
    if (next >= 1) next -= 1;
    store.setMonthProgress(next, 'timeline');
  }, { element: canvas, fps: 30 });
  store.subscribe(render);
  render(store.getView());
  syncButton();
  return { pause };
}
