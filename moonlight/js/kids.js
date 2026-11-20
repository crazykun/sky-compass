import { drawMoon, phaseOf } from './moon.js';
import { addAnimation, reducedMotion } from './animation.js';

const KID_PHASES = [
  {
    day: 0,
    name: '看不见',
    py: 'kàn bù jiàn',
    face: '🌑',
    say: '新月时，月球在太阳和地球之间，亮亮的一面背对地球，所以我们看不见它。'
  },
  {
    day: 7,
    name: '半个月亮',
    py: 'bàn gè yuè liàng',
    face: '🌓',
    say: '太阳公公照亮我一半，我像半个圆圆的饼干，这叫「上弦月」。'
  },
  {
    day: 14,
    name: '圆圆月亮',
    py: 'yuán yuán yuè liàng',
    face: '🌕',
    say: '我把亮亮的一面全给你看啦！中秋节的就是我，这叫「满月」。'
  },
  {
    day: 22,
    name: '半个月亮',
    py: 'bàn gè yuè liàng',
    face: '🌗',
    say: '我又变成半个啦，不过这次亮的是另一边，这叫「下弦月」。'
  }
];

const KID_QUIZ = [
  { day: 0, name: '看不见' },
  { day: 3, name: '弯弯月牙' },
  { day: 7, name: '半个月亮' },
  { day: 14, name: '圆圆月亮' },
  { day: 22, name: '半个月亮' }
];
const KID_OPTS = ['看不见', '弯弯月牙', '半个月亮', '圆圆月亮'];
const QUIZ_DELAY = 1400;

const KID_ORBIT_TIPS = {
  spin: '🙂 <b>自转</b>就是「自己原地转圈圈」。看球上的<u>小红点</u>绕着自己转——地球自转一圈 = 一天，转向太阳是<u>白天</u>，背对太阳是<u>黑夜</u>。',
  orbit: '🔄 <b>公转</b>就是「绕着别人转圈圈」。地球妈妈绕太阳公公转一圈 = 一年；月亮宝宝绕地球妈妈转一圈 = 一个月。看虚线轨道上的运动！',
  all: '🌞🌍🌙 <b>三个一起转</b>：太阳、地球、月亮都自己转（自转）；地球绕太阳跑，月亮绕地球跑（公转）。小黄箭头是照过来的阳光。'
};

function drawKidBall(c, x, y, r, dark, light, srcX, srcY, spin, sun) {
  if (sun) {
    c.save();
    c.translate(x, y);
    c.rotate(spin);
    c.strokeStyle = 'rgba(255,205,90,.65)';
    c.lineWidth = 3;
    c.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      c.rotate(Math.PI / 6);
      c.beginPath();
      c.moveTo(0, -r - 6);
      c.lineTo(0, -r - 14);
      c.stroke();
    }
    c.restore();
    const gradient = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
    gradient.addColorStop(0, '#fff3c4');
    gradient.addColorStop(1, light);
    c.fillStyle = gradient;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = dark;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();

    const angle = Math.atan2(srcY - y, srcX - x);
    c.save();
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.clip();
    c.translate(x, y);
    c.rotate(angle);
    const gradient = c.createRadialGradient(-r * .2, -r * .2, r * .05, 0, 0, r * 1.2);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, light);
    c.fillStyle = gradient;
    c.beginPath();
    c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    c.closePath();
    c.fill();
    c.restore();
  }

  const pointX = x + Math.cos(spin) * r * .62;
  const pointY = y + Math.sin(spin) * r * .62;
  c.fillStyle = '#ff5a5a';
  c.beginPath();
  c.arc(pointX, pointY, Math.max(2.4, r * .14), 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#3a2a1a';
  c.beginPath();
  c.arc(x - r * .26, y - r * .1, Math.max(1.8, r * .075), 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(x + r * .26, y - r * .1, Math.max(1.8, r * .075), 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#3a2a1a';
  c.lineWidth = Math.max(1.4, r * .06);
  c.lineCap = 'round';
  c.beginPath();
  c.arc(x, y + r * .06, r * .3, .15 * Math.PI, .85 * Math.PI);
  c.stroke();
}

export function initKids({ onModeChange = () => {} } = {}) {
  const view = document.getElementById('kidView');
  const grid = document.getElementById('kidGrid');
  const say = document.getElementById('kidSay');
  const quizMoon = document.getElementById('kidQuizMoon');
  const quizOptions = document.getElementById('kidOpts');
  const quizFeedback = document.getElementById('kidFb');
  const solarCanvas = document.getElementById('kidSolarCanvas');
  const solarPlay = document.getElementById('kidSolarPlay');
  const solarSpeed = document.getElementById('kidSolarSpeed');
  const solarSay = document.getElementById('kidSolarSay');
  const kidButton = document.getElementById('kidBtn');
  const kidBack = document.getElementById('kidBack');
  const orbitButtons = view.querySelectorAll('[data-kq]');
  const quizContext = quizMoon.getContext('2d');
  const solarContext = solarCanvas.getContext('2d');

  let active = false;
  let quizTimer = null;
  let stopAnimation = null;
  let needsDraw = true;

  function selectCard(card, phase) {
    for (const item of grid.querySelectorAll('.kid-card')) {
      const selected = item === card;
      item.classList.toggle('sel', selected);
      item.setAttribute('aria-pressed', String(selected));
    }
    say.innerHTML = `<b>${phase.face} ${phase.name}</b>：${phase.say}`;
    say.classList.remove('kid-pop');
    void say.offsetWidth;
    say.classList.add('kid-pop');
  }

  grid.replaceChildren();
  for (const phase of KID_PHASES) {
    const card = document.createElement('div');
    card.className = 'kid-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', `${phase.name}，${phase.py}`);

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    drawMoon(canvas.getContext('2d'), 100, 100, 82, phaseOf(phase.day), true);

    const face = document.createElement('div');
    face.className = 'kid-face';
    face.textContent = phase.face;
    const name = document.createElement('div');
    name.className = 'kid-name';
    name.textContent = phase.name;
    const pinyin = document.createElement('div');
    pinyin.className = 'kid-py';
    pinyin.textContent = phase.py;
    card.append(canvas, face, name, pinyin);

    card.addEventListener('click', event => {
      selectCard(event.currentTarget, phase);
    });
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      selectCard(event.currentTarget, phase);
    });
    grid.appendChild(card);
  }

  function clearQuizTimer() {
    if (quizTimer === null) return;
    clearTimeout(quizTimer);
    quizTimer = null;
  }

  function scheduleNextQuiz() {
    clearQuizTimer();
    quizTimer = setTimeout(() => {
      quizTimer = null;
      kidQuiz();
    }, QUIZ_DELAY);
  }

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'kid-opt kid-next';
  nextButton.textContent = '下一题';
  nextButton.addEventListener('click', event => {
    if (event.currentTarget.disabled) return;
    kidQuiz();
  });

  function kidQuiz() {
    clearQuizTimer();
    const phase = KID_QUIZ[Math.floor(Math.random() * KID_QUIZ.length)];
    quizContext.clearRect(0, 0, 320, 320);
    const glow = quizContext.createRadialGradient(160, 160, 110, 160, 160, 158);
    glow.addColorStop(0, 'rgba(255,238,180,.18)');
    glow.addColorStop(1, 'rgba(255,238,180,0)');
    quizContext.fillStyle = glow;
    quizContext.fillRect(0, 0, 320, 320);
    drawMoon(quizContext, 160, 160, 124, phaseOf(phase.day), true);

    quizFeedback.textContent = '';
    quizOptions.replaceChildren();
    for (const label of KID_OPTS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kid-opt';
      button.dataset.kidAnswer = label;
      button.textContent = label;
      button.addEventListener('click', event => {
        const selected = event.currentTarget;
        if (selected.disabled) return;
        const right = label === phase.name;
        selected.classList.add(right ? 'right' : 'wrong');

        if (right) {
          quizFeedback.textContent = '🎉 答对啦！你真棒！';
          for (const option of quizOptions.querySelectorAll('.kid-opt[data-kid-answer]')) {
            option.disabled = true;
          }
          scheduleNextQuiz();
        } else {
          selected.disabled = true;
          quizFeedback.textContent = `再想想～正确答案是「${phase.name}」。可以重试，或点「下一题」。`;
        }
      });
      quizOptions.appendChild(button);
    }
    nextButton.disabled = false;
    quizOptions.appendChild(nextButton);
  }

  const kidSim = {
    mode: 'spin',
    playing: !reducedMotion,
    speed: 1,
    earthOrbit: 0,
    earthSpin: 0,
    moonOrbit: 0,
    moonSpin: 0,
    sunSpin: 0,
    step(dt) {
      if (!this.playing) return;
      const orbitMotion = this.mode === 'spin' ? .1 : 1;
      const spinMotion = this.mode === 'orbit' ? .3 : 1;
      this.earthOrbit += dt * .00013 * this.speed * orbitMotion;
      this.earthSpin += dt * .0018 * this.speed * spinMotion;
      this.moonOrbit += dt * .00075 * this.speed * orbitMotion;
      this.moonSpin += dt * .0026 * this.speed * spinMotion;
      this.sunSpin += dt * .0005 * this.speed;
    },
    draw() {
      const c = solarContext;
      const width = 720;
      const height = 420;
      const centerX = 360;
      const centerY = 200;
      const earthOrbitRadius = 150;
      const moonOrbitRadius = 40;
      c.clearRect(0, 0, width, height);

      c.fillStyle = 'rgba(255,255,255,.35)';
      for (const [x, y] of [[60, 60], [140, 340], [600, 70], [660, 330], [230, 55], [520, 360]]) {
        c.beginPath();
        c.arc(x, y, 1.5, 0, Math.PI * 2);
        c.fill();
      }

      c.save();
      c.strokeStyle = 'rgba(143,214,255,.3)';
      c.setLineDash([6, 7]);
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(centerX, centerY, earthOrbitRadius, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      const earthX = centerX + Math.cos(this.earthOrbit) * earthOrbitRadius;
      const earthY = centerY + Math.sin(this.earthOrbit) * earthOrbitRadius;
      c.save();
      c.strokeStyle = 'rgba(238,232,214,.28)';
      c.setLineDash([4, 5]);
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(earthX, earthY, moonOrbitRadius, 0, Math.PI * 2);
      c.stroke();
      c.restore();
      const moonX = earthX + Math.cos(this.moonOrbit) * moonOrbitRadius;
      const moonY = earthY + Math.sin(this.moonOrbit) * moonOrbitRadius;

      c.save();
      c.strokeStyle = 'rgba(255,214,130,.7)';
      c.setLineDash([7, 6]);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(centerX + 50, centerY);
      c.lineTo(earthX - 24, earthY);
      c.stroke();
      c.restore();
      const middleX = (centerX + 50 + earthX - 24) / 2;
      const middleY = (centerY + earthY) / 2;
      c.fillStyle = 'rgba(255,224,150,.95)';
      c.font = '13px sans-serif';
      c.textAlign = 'center';
      c.fillText('阳光照过来 ☀', middleX, middleY - 10);

      drawKidBall(c, centerX, centerY, 44, '#c66a12', '#ffd257', centerX, centerY, this.sunSpin, true);
      drawKidBall(c, earthX, earthY, 24, '#164a86', '#5aa9ff', centerX, centerY, this.earthSpin, false);
      drawKidBall(c, moonX, moonY, 12, '#8a8578', '#f4efdc', earthX, earthY, this.moonSpin, false);

      c.font = 'bold 14px sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#ffd257';
      c.fillText('太阳公公', centerX, centerY + 62);
      c.fillStyle = '#8fd6ff';
      c.fillText('地球妈妈', earthX - 12, earthY + 42);
      c.fillStyle = '#f4efdc';
      c.fillText('月亮宝宝', moonX + 16, moonY - 10);
    }
  };

  for (const button of orbitButtons) {
    button.classList.toggle('on', button.dataset.kq === kidSim.mode);
    button.addEventListener('click', event => {
      const selected = event.currentTarget;
      for (const item of orbitButtons) item.classList.remove('on');
      selected.classList.add('on');
      kidSim.mode = selected.dataset.kq;
      solarSay.innerHTML = KID_ORBIT_TIPS[kidSim.mode];
      needsDraw = true;
    });
  }
  solarSay.innerHTML = KID_ORBIT_TIPS[kidSim.mode];

  solarPlay.textContent = kidSim.playing ? '⏸ 暂停' : '▶ 播放';
  solarPlay.addEventListener('click', event => {
    kidSim.playing = !kidSim.playing;
    event.currentTarget.textContent = kidSim.playing ? '⏸ 暂停' : '▶ 播放';
    needsDraw = true;
  });
  solarSpeed.textContent = '🐢 慢一点';
  solarSpeed.addEventListener('click', event => {
    kidSim.speed = kidSim.speed === 1 ? .5 : 1;
    event.currentTarget.textContent = kidSim.speed === .5 ? '🐇 快一点' : '🐢 慢一点';
  });

  function startAnimation() {
    if (stopAnimation || !active) return;
    needsDraw = true;
    stopAnimation = addAnimation((time, dt) => {
      if (!active || !document.body.classList.contains('kid')) return;
      if (!kidSim.playing && !needsDraw) return;
      kidSim.step(dt);
      kidSim.draw();
      needsDraw = false;
    }, { element: solarCanvas, fps: 30 });
  }

  function stopKidAnimation() {
    if (!stopAnimation) return;
    stopAnimation();
    stopAnimation = null;
  }

  function enterKid() {
    const changed = !active;
    active = true;
    document.body.classList.add('kid');
    globalThis.scrollTo?.(0, 0);
    kidQuiz();
    startAnimation();
    if (changed) onModeChange(true);
  }

  function exitKid() {
    if (!active) return;
    active = false;
    document.body.classList.remove('kid');
    clearQuizTimer();
    stopKidAnimation();
    globalThis.scrollTo?.(0, 0);
    onModeChange(false);
  }

  kidButton.addEventListener('click', enterKid);
  kidBack.addEventListener('click', exitKid);
  if (/[?&]kid=1/.test(globalThis.location?.search || '')) enterKid();
}
