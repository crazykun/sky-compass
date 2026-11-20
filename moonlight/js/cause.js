import { drawMoon, illumOf } from './moon.js';

const PHASES = [
  { a: Math.PI, fraction: 0, tag: '朔', sub: '初一附近 · 看不见', text: '月球运行到<b>太阳和地球之间</b>，被照亮的半球背对我们，朝向地球的一面全黑。' },
  { a: Math.PI / 2, fraction: .25, tag: '上弦', sub: '初八附近 · 右半亮', text: '日—地—月成<b>直角</b>，从地球看到亮面的一半：右半明亮，左半黑暗。' },
  { a: 0, fraction: .5, tag: '望', sub: '十五附近 · 满月', text: '<b>地球在太阳和月球之间</b>，被照亮的半球正对我们，整轮明月高挂夜空。' },
  { a: -Math.PI / 2, fraction: .75, tag: '下弦', sub: '廿三附近 · 左半亮', text: '月球走到另一侧直角位置，露出的是<b>另一半</b>亮面：左半明亮，右半黑暗。' }
];
const SUN = { x: 62, y: 150, r: 32 }, EARTH = { x: 470, y: 150, r: 30 }, ORX = 248, ORY = 108;
const CXS = [170, 370, 570, 770], CY = 390;
const moonPosition = phase => ({ x: EARTH.x + Math.cos(phase.a) * ORX, y: EARTH.y + Math.sin(phase.a) * ORY });

function litHalf(ctx, x, y, r) {
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, -Math.PI / 2, Math.PI / 2, true); ctx.closePath(); ctx.clip();
  const gradient = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .05, x, y, r * 1.2);
  gradient.addColorStop(0, '#fffdf0'); gradient.addColorStop(.6, '#f2ecd9'); gradient.addColorStop(1, '#c7bda4');
  ctx.fillStyle = gradient; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}

export function initCause({ store, onManual = () => {} }) {
  const canvas = document.getElementById('causeCanvas'), ctx = canvas.getContext('2d');
  let selected = -1;

  function draw() {
    ctx.clearRect(0, 0, 960, 470);
    ctx.save(); ctx.strokeStyle = 'rgba(255,205,100,.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([9, 7]);
    [95, 150, 205].forEach(y => {
      ctx.beginPath(); ctx.moveTo(108, y); ctx.lineTo(918, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(918, y); ctx.lineTo(908, y - 4); ctx.moveTo(918, y); ctx.lineTo(908, y + 4); ctx.stroke();
    }); ctx.restore();
    ctx.fillStyle = 'rgba(255,214,130,.85)'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('阳光从太阳射向右侧 →', 500, 75);
    ctx.save(); ctx.strokeStyle = 'rgba(180,195,235,.28)'; ctx.setLineDash([5, 6]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(EARTH.x, EARTH.y, ORX, ORY, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

    PHASES.forEach((phase, index) => {
      const moon = moonPosition(phase), dx = moon.x - EARTH.x, dy = moon.y - EARTH.y, length = Math.hypot(dx, dy);
      ctx.save(); ctx.strokeStyle = index === selected ? 'rgba(255,218,138,.9)' : 'rgba(169,192,255,.3)'; ctx.lineWidth = index === selected ? 1.8 : 1; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(EARTH.x, EARTH.y); ctx.lineTo(EARTH.x + dx / length * (length + 70), EARTH.y + dy / length * (length + 70)); ctx.stroke(); ctx.restore();
    });

    let gradient = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * .5, SUN.x, SUN.y, SUN.r * 2.6);
    gradient.addColorStop(0, 'rgba(255,200,90,.38)'); gradient.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r * 2.6, 0, Math.PI * 2); ctx.fill();
    gradient = ctx.createRadialGradient(SUN.x - SUN.r * .3, SUN.y - SUN.r * .3, SUN.r * .1, SUN.x, SUN.y, SUN.r);
    gradient.addColorStop(0, '#fff6cf'); gradient.addColorStop(.55, '#ffcb57'); gradient.addColorStop(1, '#e5791c');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,130,.9)'; ctx.font = '12px sans-serif'; ctx.fillText('太阳', SUN.x, SUN.y + SUN.r + 19);

    ctx.fillStyle = '#1a2a4a'; ctx.beginPath(); ctx.arc(EARTH.x, EARTH.y, EARTH.r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(EARTH.x, EARTH.y, EARTH.r, EARTH.r, 0, -Math.PI / 2, Math.PI / 2, true); ctx.closePath(); ctx.clip();
    gradient = ctx.createRadialGradient(EARTH.x - EARTH.r * .3, EARTH.y - EARTH.r * .3, EARTH.r * .05, EARTH.x, EARTH.y, EARTH.r * 1.2);
    gradient.addColorStop(0, '#8fd0ff'); gradient.addColorStop(.6, '#3f86c9'); gradient.addColorStop(1, '#1d4c86');
    ctx.fillStyle = gradient; ctx.fillRect(EARTH.x - EARTH.r, EARTH.y - EARTH.r, EARTH.r * 2, EARTH.r * 2);
    ctx.fillStyle = 'rgba(70,155,110,.55)'; ctx.beginPath(); ctx.ellipse(EARTH.x - EARTH.r * .45, EARTH.y - EARTH.r * .25, EARTH.r * .28, EARTH.r * .16, -.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(140,190,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(EARTH.x, EARTH.y, EARTH.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(150,190,255,.95)'; ctx.font = '12px sans-serif'; ctx.fillText('地球', EARTH.x, EARTH.y + EARTH.r + 19);

    PHASES.forEach((phase, index) => {
      const moon = moonPosition(phase), r = 15, on = index === selected;
      if (on) { ctx.save(); ctx.strokeStyle = 'rgba(255,218,138,.95)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(moon.x, moon.y, r + 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#2a3046'; ctx.beginPath(); ctx.arc(moon.x, moon.y, r, 0, Math.PI * 2); ctx.fill(); litHalf(ctx, moon.x, moon.y, r);
      ctx.strokeStyle = 'rgba(235,235,245,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(moon.x, moon.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = on ? '#ffda8a' : 'rgba(228,234,255,.88)'; ctx.font = `${on ? 'bold ' : ''}14px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${index + 1} ${phase.tag}`, moon.x, moon.y - r - 16);
    });

    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.setLineDash([]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, 345); ctx.lineTo(920, 345); ctx.stroke();
    ctx.fillStyle = 'rgba(160,175,215,.85)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('↓ 从地球看到的月相（点击可切换）', 40, 337);
    PHASES.forEach((phase, index) => {
      const x = CXS[index], on = index === selected;
      if (on) { ctx.fillStyle = 'rgba(255,218,138,.12)'; ctx.beginPath(); ctx.arc(x, CY, 40, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,218,138,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, CY, 40, 0, Math.PI * 2); ctx.stroke(); }
      drawMoon(ctx, x, CY, 26, phase.fraction, false);
      ctx.fillStyle = on ? '#ffda8a' : 'rgba(228,234,255,.9)'; ctx.font = `${on ? 'bold ' : ''}13px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${phase.tag} · ${phase.sub}`, x, CY + 55);
    });
  }

  canvas.addEventListener('click', event => {
    const box = canvas.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 960, y = (event.clientY - box.top) / box.height * 470;
    let hit = -1;
    PHASES.forEach((phase, index) => {
      const moon = moonPosition(phase);
      if (Math.hypot(x - moon.x, y - moon.y) < 32 || Math.hypot(x - CXS[index], y - CY) < 42) hit = index;
    });
    if (hit < 0) return;
    selected = hit;
    const phase = PHASES[hit];
    document.getElementById('causeRead').innerHTML = `<b>${phase.tag} · ${phase.sub}</b>　${phase.text}　理想亮面比例约 <b>${Math.round(illumOf(phase.fraction) * 100)}%</b>。`;
    draw(); onManual(); store.setPhase(phase.fraction, 'cause');
  });
  draw();
}
