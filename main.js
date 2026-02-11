const snapShell = document.getElementById("snapShell");
const goForwardBtn = document.getElementById("goForwardBtn");
const goBackBtn = document.getElementById("goBackBtn");
const root = document.documentElement;

const EDGE_SWIPE_ZONE = 28;
const COMPLETE_DISTANCE_THRESHOLD = 0.33;
const COMPLETE_VELOCITY_THRESHOLD = 0.7;
const PUSH_DURATION_MS = 340;
const POP_DURATION_MS = 300;

let progress = 0;
let currentScreen = 1;
let animFrame = null;
let isAnimating = false;
let isSyncingScroll = false;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const gesture = {
  active: false,
  pointerId: null,
  startX: 0,
  lastX: 0,
  lastTime: 0,
  velocityX: 0
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setSnapEnabled(enabled) {
  snapShell.classList.toggle("no-snap", !enabled);
}

function width() {
  return snapShell.clientWidth || window.innerWidth;
}

function setProgress(nextValue, options = {}) {
  const { syncScroll = true } = options;
  progress = clamp(nextValue, 0, 1);
  const frontShiftPercent = -32 * progress;
  const parallaxShiftPx = -18 * progress;
  const parallaxTiltDeg = -5 * progress;

  root.style.setProperty("--push-progress", progress.toFixed(4));
  root.style.setProperty("--front-shift", `${frontShiftPercent.toFixed(3)}%`);
  root.style.setProperty("--parallax-shift", `${parallaxShiftPx.toFixed(3)}px`);
  root.style.setProperty("--parallax-tilt", `${parallaxTiltDeg.toFixed(3)}deg`);

  if (syncScroll) {
    isSyncingScroll = true;
    snapShell.scrollLeft = width() * progress;
    isSyncingScroll = false;
  }

  currentScreen = progress >= 0.5 ? 2 : 1;
}

function finishAnimation(target) {
  isAnimating = false;
  setProgress(target, { syncScroll: true });
  setSnapEnabled(true);
}

function animateTo(target, durationMs) {
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }

  if (prefersReducedMotion) {
    finishAnimation(target);
    return;
  }

  const from = progress;
  const delta = target - from;
  const start = performance.now();

  if (Math.abs(delta) < 0.0001) {
    finishAnimation(target);
    return;
  }

  isAnimating = true;
  setSnapEnabled(false);

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const t = clamp((now - start) / durationMs, 0, 1);
    const eased = easeOutCubic(t);
    setProgress(from + delta * eased, { syncScroll: true });

    if (t < 1) {
      animFrame = requestAnimationFrame(tick);
      return;
    }

    animFrame = null;
    finishAnimation(target);
  }

  animFrame = requestAnimationFrame(tick);
}

function navigateToScreen2() {
  animateTo(1, PUSH_DURATION_MS);
}

function navigateBackToScreen1() {
  animateTo(0, POP_DURATION_MS);
}

function startBackGesture(event) {
  if (currentScreen !== 2) {
    return;
  }

  if (event.clientX > EDGE_SWIPE_ZONE) {
    return;
  }

  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }

  isAnimating = false;
  gesture.active = true;
  gesture.pointerId = event.pointerId;
  gesture.startX = event.clientX;
  gesture.lastX = event.clientX;
  gesture.lastTime = event.timeStamp;
  gesture.velocityX = 0;

  setSnapEnabled(false);
  snapShell.setPointerCapture(event.pointerId);
}

function moveBackGesture(event) {
  if (!gesture.active || event.pointerId !== gesture.pointerId) {
    return;
  }

  const dx = event.clientX - gesture.startX;
  const distanceProgress = clamp(dx / width(), 0, 1);
  const nextProgress = clamp(1 - distanceProgress, 0, 1);

  const dt = Math.max(1, event.timeStamp - gesture.lastTime);
  gesture.velocityX = (event.clientX - gesture.lastX) / dt;
  gesture.lastX = event.clientX;
  gesture.lastTime = event.timeStamp;

  setProgress(nextProgress, { syncScroll: true });
  event.preventDefault();
}

function endBackGesture(event) {
  if (!gesture.active || event.pointerId !== gesture.pointerId) {
    return;
  }

  const traveledRatio = clamp((event.clientX - gesture.startX) / width(), 0, 1);
  const shouldPop =
    traveledRatio > COMPLETE_DISTANCE_THRESHOLD || gesture.velocityX > COMPLETE_VELOCITY_THRESHOLD;

  gesture.active = false;

  if (snapShell.hasPointerCapture(event.pointerId)) {
    snapShell.releasePointerCapture(event.pointerId);
  }

  if (shouldPop) {
    navigateBackToScreen1();
    return;
  }

  animateTo(1, 220);
}

function onScroll() {
  if (isSyncingScroll || gesture.active || isAnimating) {
    return;
  }

  const rawProgress = width() > 0 ? snapShell.scrollLeft / width() : 0;
  setProgress(rawProgress, { syncScroll: false });
}

function onResize() {
  setProgress(progress, { syncScroll: true });
}

goForwardBtn.addEventListener("click", navigateToScreen2);
goBackBtn.addEventListener("click", navigateBackToScreen1);
snapShell.addEventListener("scroll", onScroll, { passive: true });
snapShell.addEventListener("pointerdown", startBackGesture);
snapShell.addEventListener("pointermove", moveBackGesture);
snapShell.addEventListener("pointerup", endBackGesture);
snapShell.addEventListener("pointercancel", endBackGesture);
window.addEventListener("resize", onResize);

setProgress(0, { syncScroll: true });
