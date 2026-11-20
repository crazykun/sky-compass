/* 太阳的一天：早/中/下午三个场景切换 */
import { PERIODS, facingCard } from './compass.js';

const NOTES = {
  morning: '太阳公公从<b>东方</b>升起 🌅',
  noon: '太阳升到最高，在我们的<b>南方</b>天空 🌞（中国大部分地区）',
  afternoon: '太阳向西边落去 🌇，影子越拉越长'
};

export function initScene() {
  const svg = document.getElementById('sceneSvg');
  const caption = document.getElementById('sceneCaption');
  const buttons = document.querySelectorAll('.period-btn');
  let current = 'morning';

  function render(period) {
    current = period;
    const info = PERIODS[period];
    const card = facingCard(info.dir);
    svg.classList.remove('p-morning', 'p-noon', 'p-afternoon');
    svg.classList.add(`p-${period}`);
    for (const btn of buttons) {
      const on = btn.dataset.period === period;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    caption.innerHTML = `${NOTES[period]}<br>面向它：<b>前面是${card.face}</b>，后面是${card.back}，左面是${card.left}，右面是${card.right}<span class="fact">影子指向${info.shadow}</span>`;
    document.dispatchEvent(new CustomEvent('periodchange', { detail: { period } }));
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => render(btn.dataset.period));
  }
  render(current);
}
