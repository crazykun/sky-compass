import { FEATURES } from './data.js';
import { addAnimation, reducedMotion } from './animation.js';

const DISPLAY_SIZE = 760;
const DRAG_SIZE = 320;
const STILL_SIZE = 520;
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 512;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalizeYaw = angle => ((angle % TAU) + TAU) % TAU;

const featurePoints = FEATURES.map(feature => {
  const lat = feature.lat * DEG, lon = feature.lon * DEG;
  return {
    x: Math.cos(lat) * Math.sin(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lon)
  };
});

export function initMoonDetail() {
  const dc = document.getElementById('detailCanvas');
  const autoButton = document.getElementById('mdAuto');
  const frontButton = document.getElementById('mdFront');
  const backButton = document.getElementById('mdBack');
  const resetButton = document.getElementById('mdReset');
  const hint = document.getElementById('mdHint');
  const tags = document.getElementById('mdTags');
  const info = document.getElementById('mdInfo');
  if (!dc || !autoButton || !frontButton || !backButton || !resetButton || !hint || !tags || !info) return;

  dc.width = DISPLAY_SIZE;
  dc.height = DISPLAY_SIZE;
  const dctx = dc.getContext('2d');
  if (!dctx) return;

  let yaw = 0, pitch = 0, auto = !reducedMotion, active = -1;
  let pointerId = null, lastX = 0, lastY = 0;
  let texture = null, loadError = false, dirty = true;
  const surfaces = new Map(), tagButtons = [];

  // 仅接受有限数字；非法 mdyaw 保留默认朝向与自转状态。
  const rawYaw = new URLSearchParams(globalThis.location?.search || '').get('mdyaw');
  if (rawYaw !== null && rawYaw.trim() !== '') {
    const degrees = Number(rawYaw);
    if (Number.isFinite(degrees)) {
      yaw = normalizeYaw((degrees % 360) * DEG);
      auto = false;
    }
  }

  function syncButtons() {
    autoButton.classList.toggle('on', auto);
    autoButton.textContent = auto ? '🔄 自转' : '⏸ 已暂停';
    autoButton.setAttribute('aria-pressed', String(auto));
    const settled = !auto && pointerId === null && Math.abs(pitch) < 1e-6;
    const front = settled && yaw < 1e-6;
    const back = settled && Math.abs(yaw - Math.PI) < 1e-6;
    frontButton.classList.toggle('on', front);
    backButton.classList.toggle('on', back);
    frontButton.setAttribute('aria-pressed', String(front));
    backButton.setAttribute('aria-pressed', String(back));
  }

  function syncTags() {
    tagButtons.forEach((button, index) => {
      const selected = index === active;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function clearFeature() {
    active = -1;
    info.textContent = '';
    syncTags();
  }

  function updateHint() {
    if (loadError) {
      hint.textContent = '月面纹理加载失败，请检查网络后刷新重试。';
      return;
    }
    if (!texture) {
      hint.textContent = '月面纹理加载中…';
      return;
    }
    const degrees = yaw / DEG;
    const face = degrees < 45 || degrees > 315 ? '正面' : degrees > 135 && degrees < 225 ? '背面' : '侧面';
    hint.textContent = `拖动月球可旋转 · 当前：${face}（转过 ${Math.round(degrees)}°）`;
  }

  // 每种分辨率只计算一次球面坐标、有效像素和输出缓冲区。
  function getSurface(size) {
    if (surfaces.has(size)) return surfaces.get(size);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const count = size * size;
    const xs = new Float32Array(count), ys = new Float32Array(count), zs = new Float32Array(count);
    const pixels = new Int32Array(count);
    const center = size / 2, radius = size * 350 / DISPLAY_SIZE;
    let valid = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const X = (x - center) / radius, Y = (center - y) / radius;
        const q = X * X + Y * Y;
        if (q > 1) continue;
        const index = y * size + x;
        xs[index] = X;
        ys[index] = Y;
        zs[index] = Math.sqrt(1 - q);
        pixels[valid++] = index;
      }
    }
    const surface = {
      canvas, ctx, xs, ys, zs,
      pixels: pixels.subarray(0, valid),
      image: ctx.createImageData(size, size)
    };
    surfaces.set(size, surface);
    return surface;
  }

  function draw(size) {
    if (!texture) return;
    const surface = getSurface(size);
    if (!surface) return;
    const { xs, ys, zs, pixels, image } = surface;
    const out = image.data;
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);

    for (let n = 0; n < pixels.length; n++) {
      const index = pixels[n], X = xs[index], Y = ys[index], Z = zs[index];
      const y1 = Y * cp + Z * sp, z1 = -Y * sp + Z * cp;
      const bx = X * cy - z1 * sy, bz = X * sy + z1 * cy;
      const lat = Math.asin(clamp(y1, -1, 1));
      const lon = Math.atan2(bx, bz);
      let u = Math.floor((lon + Math.PI) * TEXTURE_WIDTH / TAU);
      let v = Math.floor((Math.PI / 2 - lat) * TEXTURE_HEIGHT / Math.PI);
      u = clamp(u, 0, TEXTURE_WIDTH - 1);
      v = clamp(v, 0, TEXTURE_HEIGHT - 1);
      const ti = (v * TEXTURE_WIDTH + u) * 4, oi = index * 4;
      const shade = .6 + .4 * Z;
      out[oi] = texture[ti] * shade;
      out[oi + 1] = texture[ti + 1] * shade;
      out[oi + 2] = texture[ti + 2] * shade;
      out[oi + 3] = 255;
    }

    surface.ctx.putImageData(image, 0, 0);
    dctx.save();
    dctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    dctx.imageSmoothingEnabled = true;
    dctx.imageSmoothingQuality = size === STILL_SIZE ? 'high' : 'medium';
    dctx.drawImage(surface.canvas, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    dctx.strokeStyle = 'rgba(255,240,200,.35)';
    dctx.lineWidth = 2;
    dctx.beginPath();
    dctx.arc(380, 380, 350, 0, TAU);
    dctx.stroke();

    featurePoints.forEach((point, index) => {
      const y1 = point.y * cp - point.z * sp, z1 = point.y * sp + point.z * cp;
      const x2 = point.x * cy + z1 * sy, z2 = -point.x * sy + z1 * cy;
      if (z2 <= 0) return;
      const x = 380 + x2 * 350, y = 380 - y1 * 350;
      if (index === active) {
        dctx.strokeStyle = '#ffda8a';
        dctx.lineWidth = 2;
        dctx.beginPath();
        dctx.arc(x, y, 13, 0, TAU);
        dctx.stroke();
      }
      dctx.fillStyle = FEATURES[index].t === '月海' ? 'rgba(120,180,255,.95)' : 'rgba(255,220,140,.95)';
      dctx.beginPath();
      dctx.arc(x, y, 5, 0, TAU);
      dctx.fill();
      dctx.fillStyle = 'rgba(0,0,0,.75)';
      dctx.font = 'bold 12px sans-serif';
      dctx.textAlign = 'center';
      dctx.textBaseline = 'middle';
      dctx.fillText(String(index + 1), x, y);
    });
    dctx.restore();
    syncButtons();
    updateHint();
  }

  FEATURES.forEach((feature, index) => {
    const button = document.createElement('button');
    button.className = 'md-tag';
    button.textContent = `${index + 1} ${feature.n}`;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      active = index;
      auto = false;
      yaw = normalizeYaw(-feature.lon * DEG);
      pitch = -feature.lat * DEG;
      syncTags();
      info.innerHTML = `<b>${feature.n}</b> · ${feature.en}<br>类型：${feature.t}　位置：${Math.abs(feature.lat)}°${feature.lat >= 0 ? 'N' : 'S'} / ${Math.abs(feature.lon)}°${feature.lon >= 0 ? 'E' : 'W'}　·　月球${Math.abs(feature.lon) > 90 ? '背面' : '正面'}`;
      dirty = true;
      syncButtons();
    });
    tagButtons.push(button);
    tags.appendChild(button);
  });

  function setView(angle) {
    auto = false;
    yaw = angle;
    pitch = 0;
    clearFeature();
    dirty = true;
    syncButtons();
  }

  autoButton.addEventListener('click', () => {
    auto = !auto;
    if (auto) clearFeature();
    dirty = true;
    syncButtons();
  });
  frontButton.addEventListener('click', () => setView(0));
  backButton.addEventListener('click', () => setView(Math.PI));
  resetButton.addEventListener('click', () => {
    auto = !reducedMotion;
    yaw = 0;
    pitch = 0;
    clearFeature();
    dirty = true;
    syncButtons();
  });

  dc.addEventListener('pointerdown', event => {
    if (pointerId !== null) return;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    auto = false;
    clearFeature();
    dirty = true;
    dc.setPointerCapture?.(event.pointerId);
    syncButtons();
    event.preventDefault();
  });
  dc.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    yaw = normalizeYaw(yaw + (event.clientX - lastX) * .009);
    pitch = clamp(pitch + (event.clientY - lastY) * .009, -1.3, 1.3);
    lastX = event.clientX;
    lastY = event.clientY;
    dirty = true;
  });

  function endDrag(event) {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const id = pointerId;
    pointerId = null;
    if (dc.hasPointerCapture?.(id)) dc.releasePointerCapture(id);
    dirty = true;
    syncButtons();
  }
  dc.addEventListener('pointerup', endDrag);
  dc.addEventListener('pointercancel', endDrag);
  dc.addEventListener('lostpointercapture', endDrag);

  const image = new Image();
  function textureFailed() {
    texture = null;
    loadError = true;
    auto = false;
    syncButtons();
    updateHint();
  }
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = TEXTURE_WIDTH;
      canvas.height = TEXTURE_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(image, 0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
      texture = ctx.getImageData(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT).data;
      loadError = false;
      dirty = true;
      updateHint();
    } catch {
      textureFailed();
    }
  };
  image.onerror = textureFailed;

  syncButtons();
  updateHint();
  addAnimation((time, dt) => {
    if (!texture) return;
    if (auto && pointerId === null && !document.body?.classList.contains('kid')) {
      yaw = normalizeYaw(yaw + dt * .00035);
      draw(DRAG_SIZE);
      dirty = false;
    } else if (dirty) {
      draw(pointerId === null ? STILL_SIZE : DRAG_SIZE);
      dirty = false;
    }
  }, { element: dc, fps: 15 });
  image.src = './assets/moon-texture.jpg';
}
