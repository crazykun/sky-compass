/* 首页星空背景：独立实现，DPR 自适应，后台标签页暂停，尊重系统减少动画偏好 */
(function () {
  'use strict';
  var canvas = document.getElementById('starfield');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var width = 0, height = 0, dpr = 1;
  var stars = [], meteors = [], nextMeteor = 0, last = 0, rafId = 0;

  function makeStars() {
    var mobile = width < 600;
    var count = reduced ? 80 : mobile ? 120 : 230;
    stars = Array.from({ length: count }, function () {
      var bright = Math.random() > 0.88;
      return {
        x: Math.random(), y: Math.random(),
        r: bright ? Math.random() * 1.1 + 1.3 : Math.random() * 1.1 + 0.4,
        ph: Math.random() * Math.PI * 2,
        sp: (bright ? 0.0016 : 0.0006) + Math.random() * 0.002,
        tw: bright ? 0.5 + Math.random() * 0.5 : 0.12 + Math.random() * 0.3,
        base: bright ? 0.75 + Math.random() * 0.25 : 0.3 + Math.random() * 0.35,
        cross: bright && Math.random() > 0.4,
        hue: Math.random() > 0.8 ? 195 + Math.random() * 60 : 38 + Math.random() * 24
      };
    });
  }

  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars();
    if (reduced) drawFrame(0, 0); // 静态星空一帧
  }

  function drawFrame(time, dt) {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var wave = 0.5 + 0.5 * Math.sin(time * s.sp + s.ph);
      var flash = reduced ? 0.5 : wave * wave * wave;
      var alpha = s.base * (1 - s.tw + s.tw * flash);
      var x = s.x * width, y = s.y * height, r = s.r;
      ctx.fillStyle = 'hsla(' + s.hue + ',92%,88%,' + alpha + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (s.cross && flash > 0.45) {
        var l = r * (2.2 + flash * 3);
        ctx.strokeStyle = 'hsla(' + s.hue + ',90%,92%,' + alpha * 0.6 + ')';
        ctx.lineWidth = Math.max(0.5, r * 0.28);
        ctx.beginPath();
        ctx.moveTo(x - l, y); ctx.lineTo(x + l, y);
        ctx.moveTo(x, y - l); ctx.lineTo(x, y + l);
        ctx.stroke();
      }
    }
    if (reduced) return;
    for (var m = meteors.length - 1; m >= 0; m--) {
      var mt = meteors[m];
      mt.life += dt / 1000;
      if (mt.life >= mt.max) { meteors.splice(m, 1); continue; }
      var p = mt.life / mt.max;
      var mx = mt.x + mt.vx * mt.life, my = mt.y + mt.vy * mt.life;
      var ang = Math.atan2(mt.vy, mt.vx), fade = Math.sin(Math.PI * p);
      var ex = mx - Math.cos(ang) * mt.len, ey = my - Math.sin(ang) * mt.len;
      var grad = ctx.createLinearGradient(mx, my, ex, ey);
      grad.addColorStop(0, 'rgba(255,255,255,' + 0.9 * fade + ')');
      grad.addColorStop(1, 'rgba(180,210,255,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke();
    }
  }

  function spawnMeteor() {
    var fromLeft = Math.random() > 0.5;
    meteors.push({
      x: fromLeft ? -60 : width + 60,
      y: Math.random() * height * 0.6,
      vx: (fromLeft ? 1 : -1) * (560 + Math.random() * 380),
      vy: 190 + Math.random() * 170,
      len: 100 + Math.random() * 110,
      life: 0, max: 0.75 + Math.random() * 0.5
    });
  }

  function loop(time) {
    var dt = Math.min(64, time - last || 16);
    last = time;
    drawFrame(time, dt);
    if (time > nextMeteor) {
      spawnMeteor();
      nextMeteor = time + 4500 + Math.random() * 7000;
    }
    rafId = requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', function () {
    if (reduced) return;
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  if (!reduced) rafId = requestAnimationFrame(loop);
})();
