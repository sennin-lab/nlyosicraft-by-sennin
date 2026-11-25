// 入力は inputState に書き込むだけ（ゲーム側が読んで反映する）
export const inputState = {
  moveX: 0, moveY: 0,
  lookDX: 0, lookDY: 0,
  jumpHeld: false, jumpPressed: false,
  breakHeld: false,
  placeHeld: false, placeTap: false,
  slotRequest: -1, slotDelta: 0,
  toggleDebugRequested: false,
  bagRequest: false, closeRequest: false,
  logs: []
};

export function pushInputLog(msg) {
  if (inputState.logs.length >= 30) inputState.logs.shift();
  inputState.logs.push(`${performance.now().toFixed(0)}ms: ${msg}`);
}

export function consumeLook() {
  inputState.lookDX = 0;
  inputState.lookDY = 0;
}

const $ = (id) => document.getElementById(id);
const MAX_R = 40;
const keys = new Set();
let stickX = 0, stickY = 0;
// マウス由来と画面ボタン由来を別々に持ち、両方を OR して反映する
const mouse = { break: false, place: false };
const btn = { break: false, place: false, jump: false };

function applyFlags() {
  inputState.breakHeld = mouse.break || btn.break;
  inputState.placeHeld = btn.place;
  inputState.jumpHeld = btn.jump || keys.has('Space');
}

function applyMove() {
  let kx = 0, ky = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) ky -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) ky += 1;
  let x = stickX + kx, y = stickY + ky;
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  inputState.moveX = x;
  inputState.moveY = y;
}

function hold(el, down, up) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* 旧Safari対策 */ }
    down();
  });
  const end = () => up();
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

export function initInput(canvas) {
  const stickZone = $('stick-zone');
  const stickBase = $('stick-base');
  const stickKnob = $('stick-knob');

  // ── 左スティック（移動）
  let stickId = null, stickOrigin = { x: 0, y: 0 };
  stickZone.addEventListener('pointerdown', (e) => {
    if (stickId !== null) return;
    stickId = e.pointerId;
    stickZone.setPointerCapture(e.pointerId);
    stickOrigin = { x: e.clientX, y: e.clientY };
    stickBase.style.display = 'block';
    stickBase.style.left = `${e.clientX - 48}px`;
    stickBase.style.top = `${e.clientY - 48}px`;
    stickKnob.style.transform = 'translate(0px, 0px)';
  });
  stickZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - stickOrigin.x;
    let dy = e.clientY - stickOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX_R) { dx = (dx / dist) * MAX_R; dy = (dy / dist) * MAX_R; }
    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    stickX = dx / MAX_R;
    stickY = dy / MAX_R;
    applyMove();
  });
  const endStick = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    stickX = 0; stickY = 0;
    stickBase.style.display = 'none';
    applyMove();
  };
  stickZone.addEventListener('pointerup', endStick);
  stickZone.addEventListener('pointercancel', endStick);

  // ── 視点（画面の右側をドラッグ）。PCではマウス左=破壊、右ドラッグ=視点、右クリック=設置
  let lookId = null, lastLook = { x: 0, y: 0 }, lookMoved = 0, lookIsMouse = false;
  let lastTopLeftTap = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.x <= 120 && e.y <= 64) {
      const now = performance.now();
      if (now - lastTopLeftTap < 350) { inputState.toggleDebugRequested = true; lastTopLeftTap = 0; }
      else lastTopLeftTap = now;
    }
    if (e.pointerType === 'mouse') {
      if (e.button === 0) { mouse.break = true; applyFlags(); }
      if (e.button === 2 && lookId === null) {
        lookId = e.pointerId; lookIsMouse = true; lookMoved = 0;
        lastLook = { x: e.clientX, y: e.clientY };
      }
      return;
    }
    if (lookId !== null) return;
    lookId = e.pointerId;
    lookIsMouse = false;
    lastLook = { x: e.clientX, y: e.clientY };
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    const dx = e.clientX - lastLook.x, dy = e.clientY - lastLook.y;
    inputState.lookDX += dx;
    inputState.lookDY += dy;
    lookMoved += Math.abs(dx) + Math.abs(dy);
    lastLook = { x: e.clientX, y: e.clientY };
  });
  const endLook = (e) => {
    if (e.pointerId === lookId) {
      if (lookIsMouse && lookMoved < 6) inputState.placeTap = true;
      lookId = null;
    }
    if (e.pointerType === 'mouse' && e.button === 0) { mouse.break = false; applyFlags(); }
  };
  canvas.addEventListener('pointerup', endLook);
  canvas.addEventListener('pointercancel', endLook);

  // ── 画面右下のボタン
  hold($('btn-break'), () => { btn.break = true; applyFlags(); }, () => { btn.break = false; applyFlags(); });
  hold($('btn-jump'), () => {
    btn.jump = true; inputState.jumpPressed = true; applyFlags();
  }, () => { btn.jump = false; applyFlags(); });
  hold($('btn-place'), () => {
    btn.place = true; inputState.placeTap = true; applyFlags();
  }, () => { btn.place = false; applyFlags(); });

  // ── キーボード（外付けキーボード・PC用）
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) inputState.jumpPressed = true; }
    if (/^Digit[1-9]$/.test(e.code)) inputState.slotRequest = Number(e.code.slice(5)) - 1;
    if (e.code === 'KeyF') btn.break = true;
    if (e.code === 'KeyE' && !e.repeat) inputState.placeTap = true;
    if (e.code === 'KeyI' && !e.repeat) inputState.bagRequest = true;
    if (e.code === 'Escape') inputState.closeRequest = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      keys.add(e.code);
    }
    applyMove();
    applyFlags();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    if (e.code === 'KeyF') btn.break = false;
    applyMove();
    applyFlags();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    stickX = 0; stickY = 0;
    btn.break = btn.place = btn.jump = false;
    mouse.break = false;
    applyMove();
    applyFlags();
  });
  window.addEventListener('wheel', (e) => {
    inputState.slotDelta += e.deltaY > 0 ? 1 : -1;
  }, { passive: true });
  $('btn-bag').addEventListener('pointerdown', (e) => { e.preventDefault(); inputState.bagRequest = true; });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}
