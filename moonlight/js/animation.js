const tasks = new Set();
let frameId = 0;
let lastTime = 0;

export const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const observer = 'IntersectionObserver' in globalThis ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    for (const task of tasks) {
      if (task.element === entry.target) {
        task.visible = entry.isIntersecting;
        task.last = 0;
      }
    }
  }
}, { rootMargin: '120px' }) : null;

function frame(time) {
  frameId = 0;
  if (document.hidden) { lastTime = 0; return; }
  const globalDt = Math.min(50, time - lastTime || 16);
  lastTime = time;
  for (const task of [...tasks]) {
    if (!task.visible || (task.element && !task.element.isConnected)) continue;
    const interval = 1000 / task.fps;
    if (task.last && time - task.last < interval) continue;
    const dt = task.last ? Math.min(100, time - task.last) : globalDt;
    task.last = time;
    task.fn(time, dt);
  }
  if (tasks.size) frameId = requestAnimationFrame(frame);
}

function start() {
  if (!frameId && !document.hidden && tasks.size) {
    lastTime = 0;
    frameId = requestAnimationFrame(frame);
  }
}

export function addAnimation(fn, { element = null, fps = 60 } = {}) {
  const task = { fn, element, fps: Math.max(1, Math.min(60, fps)), visible: true, last: 0 };
  if (element && observer) {
    task.visible = false;
    observer.observe(element);
  }
  tasks.add(task);
  start();
  return () => {
    tasks.delete(task);
    if (element && observer) observer.unobserve(element);
    if (!tasks.size && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      lastTime = 0;
    }
  };
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    for (const task of tasks) task.last = 0;
  } else {
    start();
  }
});
