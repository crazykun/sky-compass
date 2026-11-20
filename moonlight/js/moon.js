let seed = 20261120;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

export const CRATERS = Array.from({ length: 26 }, () => {
  const angle = rnd() * Math.PI * 2, distance = Math.sqrt(rnd()) * 0.82;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    r: 0.025 + rnd() * 0.085,
    o: 0.05 + rnd() * 0.09
  };
});

export const phaseOf = day => day / 29.53;
export const illumOf = phase => (1 - Math.cos(phase * Math.PI * 2)) / 2;

// phase=0 为朔，0.25 为上弦，0.5 为望，0.75 为下弦。
export function drawMoon(ctx, cx, cy, r, phase, craters = true) {
  const p = ((phase % 1) + 1) % 1;
  ctx.save();
  ctx.fillStyle = '#1c2338';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  const k = Math.cos(p * Math.PI * 2);
  ctx.beginPath();
  if (p <= 0.5) {
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(cx, cy, Math.max(0.01, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  } else {
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true);
    ctx.ellipse(cx, cy, Math.max(0.01, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, k < 0);
  }
  ctx.closePath();
  ctx.save(); ctx.clip();
  const gradient = ctx.createRadialGradient(cx - r * .35, cy - r * .35, r * .08, cx, cy, r * 1.15);
  gradient.addColorStop(0, '#fffdf0');
  gradient.addColorStop(.58, '#f2ecd9');
  gradient.addColorStop(1, '#cfc6ae');
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  if (craters) {
    for (const crater of CRATERS) {
      ctx.fillStyle = `rgba(96,88,74,${crater.o})`;
      ctx.beginPath(); ctx.arc(cx + crater.x * r, cy + crater.y * r, crater.r * r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,244,205,.22)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

export function fitCanvas(canvas, cssWidth, cssHeight, maxDpr = 2) {
  const dpr = Math.min(globalThis.devicePixelRatio || 1, maxDpr);
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width; canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: cssWidth, height: cssHeight, dpr };
}
