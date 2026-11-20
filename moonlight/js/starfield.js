import { addAnimation, reducedMotion } from './animation.js';
import { fitCanvas } from './moon.js';

export function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let width = innerWidth, height = innerHeight;
  let themeMix = document.body.classList.contains('space') ? 1 : 0;
  let meteors = [], nextMeteor = 0;

  function makeStars(count, deep) {
    return Array.from({ length: count }, () => {
      const bright = Math.random() > (deep ? .84 : .9);
      return {
        x: Math.random(), y: Math.random(),
        r: bright ? Math.random() * 1.1 + 1.4 : Math.random() * 1.2 + .35,
        ph: Math.random() * Math.PI * 2,
        sp: (bright ? .0016 : .0006) + Math.random() * .0024,
        tw: bright ? .5 + Math.random() * .5 : .12 + Math.random() * .3,
        base: bright ? .75 + Math.random() * .25 : .3 + Math.random() * .35,
        cross: bright && Math.random() > .35,
        hue: deep ? (Math.random() > .78 ? 190 + Math.random() * 70 : 205 + Math.random() * 35) : (Math.random() > .82 ? 190 + Math.random() * 60 : 38 + Math.random() * 24)
      };
    });
  }

  const mobile = innerWidth < 600;
  const warmStars = makeStars(reducedMotion ? 70 : mobile ? 90 : 170, false);
  const deepStars = makeStars(reducedMotion ? 140 : mobile ? 240 : 430, true);

  function resize() {
    width = innerWidth; height = innerHeight;
    fitCanvas(canvas, width, height, 2);
    nextMeteor = performance.now() + 2500 + Math.random() * 4000;
  }

  function spawnMeteor() {
    const fromLeft = Math.random() > .5;
    meteors.push({ x: fromLeft ? -60 : width + 60, y: Math.random() * height * .6, vx: (fromLeft ? 1 : -1) * (620 + Math.random() * 420), vy: 200 + Math.random() * 180, len: 100 + Math.random() * 110, life: 0, max: .75 + Math.random() * .5 });
  }

  function paintSet(stars, mix, time) {
    if (mix < .01) return;
    for (const star of stars) {
      const wave = .5 + .5 * Math.sin(time * star.sp + star.ph);
      const flash = reducedMotion ? .5 : wave * wave * wave;
      const alpha = star.base * (1 - star.tw + star.tw * flash) * mix;
      const x = star.x * width, y = star.y * height, r = star.r * (.85 + flash * .35);
      ctx.fillStyle = `hsla(${star.hue},92%,88%,${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (star.cross && flash > .45) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
        gradient.addColorStop(0, `hsla(${star.hue},90%,90%,${alpha * .5})`);
        gradient.addColorStop(1, `hsla(${star.hue},90%,90%,0)`);
        ctx.fillStyle = gradient; ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
        const length = r * (2.2 + flash * 3.2);
        ctx.strokeStyle = `hsla(${star.hue},90%,92%,${alpha * .65})`;
        ctx.lineWidth = Math.max(.5, r * .28);
        ctx.beginPath(); ctx.moveTo(x - length, y); ctx.lineTo(x + length, y); ctx.moveTo(x, y - length); ctx.lineTo(x, y + length); ctx.stroke();
      }
    }
  }

  function draw(time, dt) {
    const target = document.body.classList.contains('space') ? 1 : 0;
    themeMix += (target - themeMix) * Math.min(1, dt * .0035);
    ctx.clearRect(0, 0, width, height);
    if (themeMix > .01) {
      ctx.save(); ctx.globalAlpha = themeMix;
      [[.22,.28,'rgba(90,70,190,.18)'],[.78,.62,'rgba(40,120,190,.15)'],[.5,.85,'rgba(120,60,160,.12)']].forEach(([px, py, color], i) => {
        const x = px * width + (reducedMotion ? 0 : Math.sin(time * .00006 + i) * 40), y = py * height;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.min(width, height) * .45);
        gradient.addColorStop(0, color); gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      });
      ctx.translate(width * .5, height * .5); ctx.rotate(-.5);
      const band = ctx.createLinearGradient(0, -height * .32, 0, height * .32);
      band.addColorStop(0, 'rgba(120,150,220,0)'); band.addColorStop(.5, 'rgba(150,175,235,.075)'); band.addColorStop(1, 'rgba(120,150,220,0)');
      ctx.fillStyle = band; ctx.fillRect(-width, -height * .32, width * 2, height * .64); ctx.restore();
    }
    paintSet(warmStars, 1 - themeMix, time);
    paintSet(deepStars, themeMix, time);
    if (!reducedMotion && themeMix > .35) {
      if (time > nextMeteor) { spawnMeteor(); nextMeteor = time + 3500 + Math.random() * 6500; }
      meteors = meteors.filter(meteor => meteor.life < meteor.max);
      for (const meteor of meteors) {
        meteor.life += dt / 1000;
        const progress = meteor.life / meteor.max;
        const x = meteor.x + meteor.vx * meteor.life, y = meteor.y + meteor.vy * meteor.life + meteor.vy * meteor.vy * meteor.life * meteor.life * .15;
        const angle = Math.atan2(meteor.vy, meteor.vx), fade = Math.sin(Math.PI * progress) * themeMix;
        const endX = x - Math.cos(angle) * meteor.len, endY = y - Math.sin(angle) * meteor.len;
        const gradient = ctx.createLinearGradient(x, y, endX, endY);
        gradient.addColorStop(0, `rgba(255,255,255,${.9 * fade})`); gradient.addColorStop(1, 'rgba(180,210,255,0)');
        ctx.strokeStyle = gradient; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
      }
    }
  }

  resize();
  addEventListener('resize', resize);
  addAnimation(draw, { element: canvas, fps: reducedMotion ? 15 : 45 });
}
