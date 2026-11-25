import { CONFIG } from './config.js';
import { IDS as I } from './data/ids.js';
import { BLOCKS } from './data/blocks.js';
import { initGL } from './render/gl.js';
import { createMainShader } from './render/shader.js';
import { createCamera } from './render/camera.js';
import { createAtlas } from './render/atlas.js';
import { createHUD } from './render/hud.js';
import { createWorld } from './world/world.js';
import { createPlayer, updatePlayer } from './player.js';
import { raycast, overlapsCell, isLiquid } from './physics.js';
import { inputState, initInput, consumeLook } from './input.js';
import { createInventory, HOTBAR_IDS } from './inventory.js';
import { createHotbar } from './ui/hotbar.js';
import { initPauseUI } from './ui/pause.js';
import { createDebugOverlay } from './debug/overlay.js';
import { buildBugReport } from './debug/report.js';

// ── 端末判定と描画距離（タッチ端末は軽めに）
const IS_TOUCH = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
const RD = IS_TOUCH ? CONFIG.RENDER_DIST_TOUCH : CONFIG.RENDER_DIST_PC;
const GEN_PER_FRAME = IS_TOUCH ? CONFIG.GEN_PER_FRAME_TOUCH : CONFIG.GEN_PER_FRAME_PC;

// ダブルタップズームの抑止（iPad）
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = performance.now();
  if (now - lastTouchEnd <= 350 && e.cancelable) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
document.addEventListener('gesturestart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

const canvas = document.getElementById('glcanvas');
const hudCanvas = document.createElement('canvas');
hudCanvas.id = 'hud-canvas';
document.body.appendChild(hudCanvas);

const glCtx = initGL(canvas);
const { gl } = glCtx;
const shader = createMainShader(gl);
const atlas = createAtlas(gl, CONFIG.DEBUG_ATLAS);
const camera = createCamera();
const hud = createHUD(hudCanvas);
const inv = createInventory();
const world = createWorld(CONFIG.WORLD_SEED);
const upload = (b) => (b.pos.length
  ? glCtx.createMesh(new Float32Array(b.pos), new Float32Array(b.nor), new Float32Array(b.dat))
  : null);

let player = null;
let selected = 0;
let placeTimer = 0;
let mineKey = null, mineProgress = 0;
let target = null;

// 原点付近で草ブロックの地表を探す（海や雪原からのスタートを避ける）
function findSpawn() {
  for (let r = 0; r <= 160; r += 4) {
    for (let dz = -r; dz <= r; dz += 4) {
      for (let dx = -r; dx <= r; dx += 4) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = 8 + dx, z = 8 + dz;
        world.ensure(x >> 4, z >> 4);
        const top = world.getHeight(x, z);
        if (top > CONFIG.SEA_LEVEL + 2 && world.getBlock(x, top, z) === I.grass_block) return { x, top, z };
      }
    }
  }
  return { x: 8, top: world.getHeight(8, 8), z: 8 };
}

function spawnPlayer() {
  const s = findSpawn();
  world.ensureArea(s.x >> 4, s.z >> 4, 1);
  player = createPlayer(s.x + 0.5, s.top + 1.05, s.z + 0.5);
}

function newWorld(seed) {
  world.reset(seed);
  mineKey = null; mineProgress = 0;
  spawnPlayer();
}

// ── ホットバー・ポーズ・デバッグ
const hotbar = createHotbar(document.getElementById('hotbar'), HOTBAR_IDS, (id) => atlas.icon(id), (i) => { selected = i; });
const overlay = createDebugOverlay(document.getElementById('debug-hud'));
const stats = { fps: 60, frameMs: 16.6, draws: 0, tris: 0, chunks: 0, scale: CONFIG.RES_START, seed: CONFIG.WORLD_SEED, pos: { x: 0, y: 0, z: 0 } };
const pauseUI = initPauseUI(document.getElementById('btn-pause'), document.getElementById('pause-modal'), {
  onNewWorld: () => newWorld(Math.floor(Math.random() * 1e9)),
  onToggleCreative: () => inv.setCreative(!inv.creative),
  isCreative: () => inv.creative,
  onToggleDebug: () => overlay.toggle(),
  onBuildReport: () => { stats.seed = world.seed; return buildBugReport(stats); }
});
initInput(canvas);

// バックグラウンド（ホーム画面へ移動・タブ切替）では自動で一時停止
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseUI.open(); });

// ── 操作の反映（固定60Hz）
function lookDir(yaw, pitch) {
  const cp = Math.cos(pitch);
  return [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
}

function breakTime(id) {
  const def = BLOCKS[id];
  if (!def || def.hardness < 0 || isLiquid(id)) return -1;
  if (inv.creative) return 0.05;
  return Math.max(0.2, def.hardness * 0.7);
}

function tryPlace() {
  if (!target || (target.nx === 0 && target.ny === 0 && target.nz === 0)) return;
  const id = HOTBAR_IDS[selected];
  const px = target.x + target.nx, py = target.y + target.ny, pz = target.z + target.nz;
  const cur = world.getBlock(px, py, pz);
  if (cur !== 0 && !isLiquid(cur)) return;
  if (py < 0 || py >= CONFIG.WORLD_H) return;
  if (overlapsCell(player, px, py, pz)) return;
  if (!inv.take(id)) return;
  world.setBlock(px, py, pz, id);
}

function breakBlock() {
  const id = target.id;
  if (!world.setBlock(target.x, target.y, target.z, 0)) return;
  inv.add(id);
}

function step(dt) {
  updatePlayer(player, dt, inputState, world, true);
  consumeLook();
  if (player.y < -40) spawnPlayer();

  if (inputState.slotRequest >= 0) { selected = inputState.slotRequest; inputState.slotRequest = -1; }
  if (inputState.slotDelta) {
    selected = (selected + Math.sign(inputState.slotDelta) + HOTBAR_IDS.length) % HOTBAR_IDS.length;
    inputState.slotDelta = 0;
  }

  const d = lookDir(player.yaw, player.pitch);
  target = raycast(world, player.x, player.y + CONFIG.EYE_HEIGHT, player.z, d[0], d[1], d[2], CONFIG.REACH);

  // 設置（タップは即時、長押しは一定間隔で連打）
  placeTimer -= dt;
  if (inputState.placeTap) {
    inputState.placeTap = false;
    tryPlace();
    placeTimer = CONFIG.PLACE_REPEAT_S;
  } else if (inputState.placeHeld && placeTimer <= 0) {
    tryPlace();
    placeTimer = CONFIG.PLACE_REPEAT_S;
  }

  // 破壊（長押しで進捗が溜まり、満ちたら壊す）
  if (inputState.breakHeld && target) {
    const key = `${target.x},${target.y},${target.z}`;
    if (key !== mineKey) { mineKey = key; mineProgress = 0; }
    const need = breakTime(target.id);
    if (need < 0) {
      mineProgress = 0;
    } else {
      mineProgress += dt / need;
      if (mineProgress >= 1) {
        breakBlock();
        mineProgress = 0;
        mineKey = null;
      }
    }
  } else {
    mineKey = null;
    mineProgress = 0;
  }
}

// ── 描画ループ
const IDENT = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
let lastTime = performance.now(), acc = 0;
let fpsFrames = 0, fpsTime = 0, msSum = 0, warmup = 3;
let aspect = glCtx.resize();
hud.resize();
window.addEventListener('resize', () => { aspect = glCtx.resize(); hud.resize(); });
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { aspect = glCtx.resize(); });

function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;
  const dt = Math.min(rawDt, CONFIG.MAX_FRAME_DT);

  if (inputState.toggleDebugRequested) { inputState.toggleDebugRequested = false; overlay.toggle(); }

  if (!pauseUI.isPaused) {
    acc += dt;
    while (acc >= CONFIG.FIXED_DT) { step(CONFIG.FIXED_DT); acc -= CONFIG.FIXED_DT; }
  } else {
    acc = 0;
    consumeLook();
    inputState.placeTap = false;
    inputState.jumpPressed = false;
    target = null;
  }

  const pcx = Math.floor(player.x / 16), pcz = Math.floor(player.z / 16);
  world.stream(pcx, pcz, RD, GEN_PER_FRAME);
  world.buildMeshes(pcx, pcz, RD, CONFIG.BUILDS_PER_FRAME, CONFIG.BUILD_BUDGET_MS, atlas.uvTable, upload);

  camera.build({ x: player.x, y: player.y + CONFIG.EYE_HEIGHT, z: player.z }, player.yaw, player.pitch, aspect);

  glCtx.clear();
  gl.useProgram(shader.prog);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas.tex);
  gl.uniform1i(shader.uAtlas, 0);
  gl.uniformMatrix4fv(shader.uProj, false, camera.proj);
  gl.uniformMatrix4fv(shader.uView, false, camera.view);
  gl.uniformMatrix4fv(shader.uModel, false, IDENT);
  gl.uniform3fv(shader.uFogColor, CONFIG.FOG_COLOR);
  gl.uniform1f(shader.uFogStart, RD * 16 * 0.55);
  gl.uniform1f(shader.uFogEnd, RD * 16 * 0.95);

  const lists = { opaque: [], cutout: [], trans: [] };
  let chunkCount = 0;
  for (const c of world.chunks.values()) {
    if (Math.abs(c.cx - pcx) > RD || Math.abs(c.cz - pcz) > RD) continue;
    chunkCount++;
    for (let s = 0; s < 8; s++) {
      const m = c.meshes[s];
      if (!m || !camera.boxVisible(c.cx * 16, s * 16, c.cz * 16, 16)) continue;
      if (m.opaque) lists.opaque.push(m.opaque);
      if (m.cutout) lists.cutout.push(m.cutout);
      if (m.trans) lists.trans.push(m.trans);
    }
  }

  let draws = 0, tris = 0;
  const drawList = (arr) => {
    for (const m of arr) {
      gl.bindVertexArray(m.vao);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
      draws++;
      tris += m.count / 3;
    }
  };
  gl.disable(gl.BLEND);
  drawList(lists.opaque);
  drawList(lists.cutout);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawList(lists.trans);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);

  hud.render({ vp: camera.vp, target, progress: mineProgress });
  hotbar.update(selected, (id) => inv.count(id), inv.creative);

  // 統計と解像度の自動調整（1秒ごと、起動直後の3秒は除外）
  fpsFrames++; fpsTime += rawDt; msSum += rawDt * 1000;
  if (fpsTime >= 1) {
    const fps = fpsFrames / fpsTime;
    stats.fps = fps;
    stats.frameMs = msSum / fpsFrames;
    if (warmup > 0) warmup--;
    else {
      const s = glCtx.getScale();
      if (fps < 45 && s > CONFIG.RES_MIN + 1e-3) aspect = glCtx.setScale(s - 0.1);
      else if (fps > 57 && s < CONFIG.RES_MAX - 1e-3) aspect = glCtx.setScale(s + 0.05);
    }
    stats.scale = glCtx.getScale();
    stats.draws = draws;
    stats.tris = tris;
    stats.chunks = chunkCount;
    stats.pos = { x: player.x, y: player.y, z: player.z };
    fpsFrames = 0; fpsTime = 0; msSum = 0;
    overlay.update(stats);
  }
  stats.draws = draws;
  stats.tris = tris;
}

spawnPlayer();
const help = document.getElementById('help');
setTimeout(() => help && help.classList.add('hidden'), 9000);
requestAnimationFrame((t) => { lastTime = t; frame(t); });

// 動作確認用（コンソールから状態を覗ける）
window.__game = { world, player: () => player, inv, stats, input: inputState, target: () => target, selectedSlot: () => selected };
