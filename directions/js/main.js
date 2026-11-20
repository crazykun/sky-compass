/* 第二章入口：星空背景 + 太阳场景 + 八方方位卡 + 辨向闯关 */
import { PERIODS, angleOf, facingCard } from './compass.js';
import { initScene } from './scene.js';
import { initQuiz } from './quiz.js';

/* 星空背景：DPR 自适应，后台标签页暂停，尊重减少动画偏好 */
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0, height = 0, stars = [], rafId = 0, last = 0;

  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = reduced ? 80 : width < 600 ? 120 : 220;
    stars = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() > 0.88 ? Math.random() * 1.1 + 1.3 : Math.random() * 1.1 + 0.4,
      ph: Math.random() * Math.PI * 2,
      sp: 0.0006 + Math.random() * 0.002,
      tw: 0.12 + Math.random() * 0.5,
      base: 0.3 + Math.random() * 0.6
    }));
    if (reduced) drawFrame(0);
  }

  function drawFrame(time) {
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      const wave = 0.5 + 0.5 * Math.sin(time * s.sp + s.ph);
      const flash = reduced ? 0.5 : wave * wave * wave;
      ctx.fillStyle = `hsla(38,80%,88%,${s.base * (1 - s.tw + s.tw * flash)})`;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(time) {
    drawFrame(time);
    rafId = requestAnimationFrame(loop);
  }

  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(resize, 150);
  });
  document.addEventListener('visibilitychange', () => {
    if (reduced) return;
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  });

  resize();
  if (!reduced) rafId = requestAnimationFrame(loop);
}

/* 八方方位卡：转向 + 面向太阳 + 方位句 */
function initCompass() {
  const needle = document.getElementById('needle');
  const sunMarker = document.getElementById('sunMarker');
  const sentence = document.getElementById('facingSentence');
  const cards = {
    front: document.getElementById('cardFront'),
    back: document.getElementById('cardBack'),
    left: document.getElementById('cardLeft'),
    right: document.getElementById('cardRight')
  };
  const dirButtons = document.querySelectorAll('.dir-btn:not(.face-sun)');
  const dirLabels = document.querySelectorAll('.dir-label');
  const faceSunBtn = document.getElementById('btnFaceSun');
  let facing = '东';
  let period = 'morning';

  function render() {
    const card = facingCard(facing);
    needle.style.transform = `rotate(${angleOf(facing)}deg)`;
    sentence.innerHTML = `小探险家面朝 <b>${facing}</b> —— 前面是${card.face}，后面是${card.back}，左面是${card.left}，右面是${card.right}。`;
    cards.front.textContent = card.face;
    cards.back.textContent = card.back;
    cards.left.textContent = card.left;
    cards.right.textContent = card.right;
    for (const btn of dirButtons) {
      btn.classList.toggle('on', btn.dataset.dir === facing);
      btn.setAttribute('aria-pressed', String(btn.dataset.dir === facing));
    }
  }

  function renderSun(dir) {
    sunMarker.style.setProperty('--sa', `${angleOf(dir)}deg`);
    for (const label of dirLabels) {
      label.classList.toggle('sun-here', label.dataset.dir === dir);
    }
  }

  for (const btn of dirButtons) {
    btn.addEventListener('click', () => {
      facing = btn.dataset.dir;
      render();
    });
  }

  faceSunBtn.addEventListener('click', () => {
    facing = PERIODS[period].dir;
    render();
  });

  document.addEventListener('periodchange', event => {
    period = event.detail.period;
    renderSun(PERIODS[period].dir);
  });

  render();
  renderSun(PERIODS[period].dir);
}

initStarfield();
initScene();
initCompass();
initQuiz();
