import { CONFIG } from './config.js';
import { IDS as I } from './data/ids.js';
import { BLOCKS } from './data/blocks.js';
import { itemInfo } from './data/items.js';
import { initGL } from './render/gl.js';
import { createMainShader } from './render/shader.js';
import { createCamera } from './render/camera.js';
import { createAtlas } from './render/atlas.js';
import { createHUD } from './render/hud.js';
import { createEntityRenderer } from './render/entity.js';
import { itemIcon } from './render/itemicons.js';
import { createWorld } from './world/world.js';
import { createPlayer, updatePlayer } from './player.js';
import { raycast, overlapsCell, isLiquid } from './physics.js';
import { inputState, initInput, consumeLook } from './input.js';
import { createInventory } from './inventory.js';
import { createSurvival, hurt, eat, addExhaustion, tickSurvival, MAX_FOOD } from './survival.js';
import { createMobs } from './mobs/entities.js';
import { explode } from './mobs/combat.js';
import { createClock } from './time.js';
import { getFurnace, removeFurnace, tickFurnaces } from './furnace.js';
import { createHotbar } from './ui/hotbar.js';
import { createInventoryUI } from './ui/inventory.js';
import { createOverlay } from './ui/overlay.js';
import { initPauseUI } from './ui/pause.js';
import { createDebugOverlay } from './debug/overlay.js';
import { buildBugReport } from './debug/report.js';
import { QUALITY_SCALE, loadQuality, saveQuality, nextQuality, qualityLabel } from './quality.js';
import { loadRD, saveRD, nextRD } from './prefs.js';

// 水中の見え方（色・霧の距離）
const UNDER_SKY = [0.09, 0.3, 0.55], UNDER_FOG_NEAR = 1.5, UNDER_FOG_FAR = 20;

const IS_TOUCH = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
let RD = loadRD(IS_TOUCH ? CONFIG.RENDER_DIST_TOUCH : CONFIG.RENDER_DIST_PC);
const GEN_PER_FRAME = IS_TOUCH ? CONFIG.GEN_PER_FRAME_TOUCH : CONFIG.GEN_PER_FRAME_PC;
const REACH_BLOCK = CONFIG.REACH, REACH_ENTITY = 3.5, ATTACK_CD = 0.5;
const PLACE_FIRST = 0.3;
const CREATIVE_BLOCKS = [I.grass_block, I.dirt, I.stone, I.cobblestone, I.oak_planks, I.oak_log, I.oak_leaves, I.glass, I.bricks];

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
const atlas = await createAtlas(gl, CONFIG.DEBUG_ATLAS);
const entityRenderer = createEntityRenderer(gl, glCtx.createSimpleMesh);
const camera = createCamera();
const hud = createHUD(hudCanvas);
const inv = createInventory();
const survival = createSurvival();
const clock = createClock(0.2);
const world = createWorld(CONFIG.WORLD_SEED);
const mobs = createMobs(world);
const upload = (b) => (b.pos.length
  ? glCtx.createMesh(new Float32Array(b.pos), new Float32Array(b.nor), new Float32Array(b.dat))
  : null);

const iconFor = (id) => itemIcon(id) || atlas.icon(id);
const hotbarEl = document.getElementById('hotbar');
const hotbar = createHotbar(hotbarEl, (i) => { selected = i; });
const overlay = createOverlay(() => respawn());
const invUI = createInventoryUI(document.getElementById('inv-modal'), {
  inv, iconOf: iconFor, onClose: () => { uiMode = null; }
});

let player = null, spawn = { x: 8.5, z: 8.5 };
let selected = 0, placeTimer = 0, attackCd = 0;
let mineKey = null, mineProgress = 0, target = null;
let uiMode = null; // null | 'bag' | 'table' | 'furnace'
let quality = loadQuality();

// ── 世界・プレイヤーの初期化
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

function placeAtSpawn() {
  const s = findSpawn();
  world.ensureArea(s.x >> 4, s.z >> 4, 1);
  spawn = { x: s.x + 0.5, z: s.z + 0.5, top: s.top };
  player = createPlayer(spawn.x, s.top + 1.05, spawn.z);
}

function respawn() {
  Object.assign(survival, createSurvival());
  mobs.clear();
  placeAtSpawn();
  overlay.hideDeath();
  uiMode = null;
  invUI.close();
}

function newWorld(seed) {
  world.reset(seed);
  mobs.clear();
  mineKey = null; mineProgress = 0;
  respawn();
}

// ── ダメージ・死亡
function die() {
  if (uiMode === 'dead') return;
  invUI.close();          // 先に閉じる（閉じたときのコールバックで uiMode が戻るため）
  uiMode = 'dead';
  overlay.showDeath(survival.cause);
}

function hurtPlayer(dmg, fx, fz, cause = '') {
  if (inv.creative || survival.dead) return;
  if (hurt(survival, dmg, cause)) player.vy = Math.max(player.vy, 3.5);
  if (survival.dead) die();
}

function mobCtx() {
  return {
    world, player,
    daylight: clock.daylight, night: clock.isNight, creative: inv.creative,
    openSky: (x, y, z) => Math.floor(y) >= world.getHeight(Math.floor(x), Math.floor(z)),
    hurtPlayer,
    explode: (x, y, z, r) => explode(world, x, y, z, r, player, (d, cx, cz) => hurtPlayer(d, cx, cz, 'creeper')),
    dropItem: (id, n) => inv.add(id, n)
  };
}

// ── 採掘・設置・使用
function lookDir(yaw, pitch) {
  const cp = Math.cos(pitch);
  return [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
}

// 道具の種類と段階が必要な硬さに足りるか
function harvestable(def, tool) {
  if (def.tier === 0) return true;
  return !!tool && tool.kind === def.tool && tool.tier >= def.tier;
}

function mineTime(id, tool) {
  const def = BLOCKS[id];
  if (!def || def.hardness < 0 || isLiquid(id)) return -1;
  if (inv.creative) return 0.05;
  const base = Math.max(0.05, def.hardness * 1.5);
  const ok = harvestable(def, tool);
  if (ok && tool && tool.kind === def.tool) return base / tool.speed;
  if (!ok) return base * 3.33;
  return base;
}

function heldTool() {
  const s = inv.slots[selected];
  const info = s && itemInfo(s.id);
  return info && info.tool ? info.tool : null;
}

function breakBlock(t) {
  const def = BLOCKS[t.id];
  const tool = heldTool();
  world.setBlock(t.x, t.y, t.z, 0);
  if (t.id === I.furnace) {
    for (const s of removeFurnace(t.x, t.y, t.z)) inv.add(s.id, s.n, s.dmg || 0);
  }
  if (t.id === I.oak_leaves) {
    if (Math.random() < 0.02) inv.add(I.stick, 1);
    if (Math.random() < 0.005) inv.add(I.apple, 1);
  } else if (def.drop && harvestable(def, tool) && itemInfo(def.drop)) {
    inv.add(def.drop, def.dropCount || 1);
  }
  if (tool) inv.damageTool(selected, 1);
  addExhaustion(survival, 0.005);
}

function attackMob(e) {
  const s = inv.slots[selected];
  const info = s && itemInfo(s.id);
  const dmg = info && info.atk ? info.atk : 1;
  mobs.damageMob(e, dmg, player.x, player.z, mobCtx());
  if (info && info.tool) inv.damageTool(selected, 2);
  addExhaustion(survival, 0.1);
}

// 設置先に動く生き物が重なっていないか
function mobInCell(x, y, z) {
  for (const e of mobs.list) {
    if (e.kind !== 'mob' || e.dead) continue;
    const hw = e.w / 2;
    if (e.x + hw > x && e.x - hw < x + 1 && e.y + e.h > y && e.y < y + 1 && e.z + hw > z && e.z - hw < z + 1) return true;
  }
  return false;
}

function tryPlace() {
  if (!target || (target.nx === 0 && target.ny === 0 && target.nz === 0)) return false;
  const s = inv.slots[selected];
  if (!s || s.id <= 0 || s.id >= 100 || !BLOCKS[s.id]) return false;
  const px = target.x + target.nx, py = target.y + target.ny, pz = target.z + target.nz;
  const cur = world.getBlock(px, py, pz);
  if (cur !== 0 && !isLiquid(cur)) return false;
  if (py < 0 || py >= CONFIG.WORLD_H) return false;
  if (overlapsCell(player, px, py, pz) || mobInCell(px, py, pz)) return false;
  if (!inv.creative) {
    s.n -= 1;
    if (s.n <= 0) inv.slots[selected] = null;
  }
  world.setBlock(px, py, pz, s.id);
  return true;
}

function eatSelected() {
  const s = inv.slots[selected];
  const info = s && itemInfo(s.id);
  if (!info || !info.food || survival.food >= MAX_FOOD) return false;
  eat(survival, info);
  s.n -= 1;
  if (s.n <= 0) inv.slots[selected] = null;
  return true;
}

function openBlockUI(t) {
  if (t.id === I.crafting_table) {
    uiMode = 'table';
    invUI.open('table');
  } else {
    uiMode = 'furnace';
    invUI.open('furnace', { furnace: getFurnace(t.x, t.y, t.z) });
  }
}

// 「置く」: 作業台・かまど → 食べる → 設置 の順
function useAction() {
  if (target && (target.id === I.crafting_table || target.id === I.furnace)) { openBlockUI(target); return; }
  if (eatSelected()) return;
  tryPlace();
}

// ── 1固定ステップ分の進行
function step(dt) {
  clock.tick(dt);
  updatePlayer(player, dt, inputState, world, true);
  consumeLook();
  addExhaustion(survival, player.exhaust);
  player.exhaust = 0;
  if (player.pendingDamage) { hurtPlayer(player.pendingDamage, 0, 0, 'fall'); player.pendingDamage = 0; }
  if (player.y < -20) hurtPlayer(100, 0, 0, 'void');

  const headWater = world.getBlock(Math.floor(player.x), Math.floor(player.y + 1.6), Math.floor(player.z)) === I.water;
  tickSurvival(survival, dt, { headWater, creative: inv.creative });
  if (survival.dead) { die(); return; }

  if (inputState.slotRequest >= 0) { selected = inputState.slotRequest; inputState.slotRequest = -1; }
  if (inputState.slotDelta) {
    selected = (selected + Math.sign(inputState.slotDelta) + 9) % 9;
    inputState.slotDelta = 0;
  }

  const d = lookDir(player.yaw, player.pitch);
  const ex = player.x, ey = player.y + CONFIG.EYE_HEIGHT, ez = player.z;
  target = raycast(world, ex, ey, ez, d[0], d[1], d[2], REACH_BLOCK);
  const hit = mobs.hitTest(ex, ey, ez, d[0], d[1], d[2], REACH_ENTITY);
  const entityFirst = hit && (!target || hit.dist <= target.dist);

  // 使う/設置（タップは即時、長押しは連打）
  placeTimer -= dt;
  if (inputState.placeTap) {
    inputState.placeTap = false;
    useAction();
    placeTimer = PLACE_FIRST;
    if (uiMode) return;
  } else if (inputState.placeHeld && placeTimer <= 0) {
    tryPlace();
    placeTimer = CONFIG.PLACE_REPEAT_S;
  }

  // 攻撃（生き物を狙っている時）か採掘（ブロック）
  attackCd = Math.max(0, attackCd - dt);
  if (inputState.breakHeld) {
    if (entityFirst && attackCd <= 0) {
      attackMob(hit.e);
      attackCd = ATTACK_CD;
      mineKey = null; mineProgress = 0;
    } else if (target && !entityFirst) {
      const key = `${target.x},${target.y},${target.z}`;
      if (key !== mineKey) { mineKey = key; mineProgress = 0; }
      const need = mineTime(target.id, heldTool());
      if (need > 0) {
        mineProgress += dt / need;
        if (mineProgress >= 1) {
          breakBlock(target);
          mineProgress = 0; mineKey = null;
        }
      } else {
        mineProgress = 0;
      }
    } else {
      mineKey = null; mineProgress = 0;
    }
  } else {
    mineKey = null; mineProgress = 0;
  }

  mobs.trySpawn(dt, mobCtx());
  mobs.update(dt, mobCtx());
}

// ── 初期化・ポーズ・描画
const pauseUI = initPauseUI(document.getElementById('btn-pause'), document.getElementById('pause-modal'), {
  onNewWorld: () => newWorld(Math.floor(Math.random() * 1e9)),
  onToggleCreative: () => {
    inv.setCreative(!inv.creative);
    if (inv.creative) CREATIVE_BLOCKS.forEach((id, i) => { if (!inv.slots[i]) inv.slots[i] = { id, n: 64, dmg: 0 }; });
  },
  isCreative: () => inv.creative,
  onToggleDebug: () => overlay.toggle(),
  renderDistLabel: () => `${RD}チャンク`,
  onCycleRenderDist: () => { RD = nextRD(RD); saveRD(RD); },
  qualityLabel: () => qualityLabel(quality),
  onCycleQuality: () => {
    quality = nextQuality(quality);
    saveQuality(quality);
    aspect = glCtx.setScale(QUALITY_SCALE[quality]);
  },
  onBuildReport: () => { stats.seed = world.seed; return buildBugReport(stats); }
});
const overlayDbg = createDebugOverlay(document.getElementById('debug-hud'));
const stats = { fps: 60, frameMs: 16.6, draws: 0, tris: 0, chunks: 0, scale: CONFIG.RES_START, seed: CONFIG.WORLD_SEED, pos: { x: 0, y: 0, z: 0 } };
initInput(canvas);

document.addEventListener('visibilitychange', () => { if (document.hidden) pauseUI.open(); });

function lerpColor(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
const DAY_SKY = [0.5, 0.7, 1.0], NIGHT_SKY = [0.02, 0.03, 0.09];
const IDENT = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

let aspect = glCtx.setScale(QUALITY_SCALE[quality]);
hud.resize();
window.addEventListener('resize', () => { aspect = glCtx.resize(); hud.resize(); });
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { aspect = glCtx.resize(); });

let lastTime = performance.now(), acc = 0;
let fpsFrames = 0, fpsTime = 0, msSum = 0, warmup = 3;
let lastBagKey = '';

function handleUIRequests() {
  if (inputState.bagRequest) {
    inputState.bagRequest = false;
    if (uiMode === 'bag') { invUI.close(); }
    else if (uiMode === null && !pauseUI.isPaused) { uiMode = 'bag'; invUI.open('bag'); inputState.placeTap = false; }
  }
  if (inputState.closeRequest) {
    inputState.closeRequest = false;
    if (uiMode && uiMode !== 'dead') invUI.close();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;
  const dt = Math.min(rawDt, CONFIG.MAX_FRAME_DT);

  if (inputState.toggleDebugRequested) { inputState.toggleDebugRequested = false; overlayDbg.toggle(); }
  handleUIRequests();

  const paused = pauseUI.isPaused;
  if (!paused) tickFurnaces(dt);
  const gameplay = !paused && uiMode === null && !survival.dead;
  if (gameplay) {
    acc += dt;
    while (acc >= CONFIG.FIXED_DT) { step(CONFIG.FIXED_DT); acc -= CONFIG.FIXED_DT; if (uiMode || survival.dead) { acc = 0; break; } }
  } else {
    acc = 0;
    consumeLook();
    inputState.placeTap = false;
    inputState.jumpPressed = false;
    if (!survival.dead) target = null;
  }

  const pcx = Math.floor(player.x / 16), pcz = Math.floor(player.z / 16);
  world.stream(pcx, pcz, RD, GEN_PER_FRAME);
  world.buildMeshes(pcx, pcz, RD, CONFIG.BUILDS_PER_FRAME, CONFIG.BUILD_BUDGET_MS, atlas.uvTable, upload);

  camera.build({ x: player.x, y: player.y + CONFIG.EYE_HEIGHT, z: player.z }, player.yaw, player.pitch, aspect);

  // 昼夜で空と霧の色を変える
  // 頭が水中にあるかで、空・霧の色と距離を切り替える
  const underwater = world.getBlock(Math.floor(player.x), Math.floor(player.y + CONFIG.EYE_HEIGHT), Math.floor(player.z)) === I.water;
  const sky = underwater ? UNDER_SKY : lerpColor(NIGHT_SKY, DAY_SKY, clock.daylight);
  const fogNear = underwater ? UNDER_FOG_NEAR : RD * 16 * 0.55;
  const fogFar = underwater ? UNDER_FOG_FAR : RD * 16 * 0.95;
  gl.clearColor(sky[0], sky[1], sky[2], 1);
  glCtx.clear();

  gl.useProgram(shader.prog);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas.tex);
  gl.uniform1i(shader.uAtlas, 0);
  gl.uniformMatrix4fv(shader.uProj, false, camera.proj);
  gl.uniformMatrix4fv(shader.uView, false, camera.view);
  gl.uniformMatrix4fv(shader.uModel, false, IDENT);
  gl.uniform3fv(shader.uFogColor, sky);
  gl.uniform1f(shader.uFogStart, fogNear);
  gl.uniform1f(shader.uFogEnd, fogFar);
  gl.uniform1f(shader.uDaylight, clock.daylight);

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

  // モブ・矢
  entityRenderer.draw(mobs.list, {
    view: camera.view, proj: camera.proj, daylight: clock.daylight,
    fogColor: sky, fogStart: fogNear, fogEnd: fogFar,
    player, maxDist: RD * 16
  });

  const hb = hotbarEl.getBoundingClientRect();
  hud.render({
    vp: camera.vp, target, progress: mineProgress,
    hp: survival.hp, food: survival.food, air: survival.air, hotbarRect: hb
  });
  hotbar.update(inv, selected, iconFor, itemInfo);
  overlay.flash(survival.flash * 1.7);

  // ボタン表示（使う動作に合わせて文言を変える）
  const s = inv.slots[selected];
  const info = s && itemInfo(s.id);
  const key = !uiMode && target && (target.id === I.crafting_table || target.id === I.furnace) ? '開く'
    : (info && info.food && survival.food < MAX_FOOD ? '食べる' : '置く');
  if (key !== lastBagKey) {
    lastBagKey = key;
    document.getElementById('btn-place').textContent = key;
  }

  fpsFrames++; fpsTime += rawDt; msSum += rawDt * 1000;
  if (fpsTime >= 1) {
    const fps = fpsFrames / fpsTime;
    stats.fps = fps;
    stats.frameMs = msSum / fpsFrames;
    if (warmup > 0) warmup--;
    else {
      // 自動のときだけ、重い時に解像度を下げる（固定の画質では下げない）
      const sc = glCtx.getScale();
      if (quality === 'auto') {
        if (fps < 45 && sc > CONFIG.RES_MIN + 1e-3) aspect = glCtx.setScale(sc - 0.1);
        else if (fps > 57 && sc < 1.0 - 1e-3) aspect = glCtx.setScale(sc + 0.05);
      }
    }
    stats.scale = glCtx.getScale();
    stats.chunks = chunkCount;
    stats.pos = { x: player.x, y: player.y, z: player.z };
    fpsFrames = 0; fpsTime = 0; msSum = 0;
    overlayDbg.update(stats);
  }
  stats.draws = draws;
  stats.tris = tris;
  invUI.refresh();
}

// 縦持ちのスマホでは横向きを案内する（一度「このまま遊ぶ」を押せば隠す）
const rotateHint = document.getElementById('rotate-hint');
const portraitTouch = matchMedia('(orientation: portrait) and (pointer: coarse)');
let rotateDismissed = false;
function syncRotateHint() {
  if (!portraitTouch.matches) rotateDismissed = false;
  rotateHint.classList.toggle('hidden', !portraitTouch.matches || rotateDismissed);
}
document.getElementById('rotate-ok').addEventListener('click', () => { rotateDismissed = true; syncRotateHint(); });
window.addEventListener('resize', syncRotateHint);
window.addEventListener('orientationchange', syncRotateHint);
syncRotateHint();

placeAtSpawn();
const help = document.getElementById('help');
setTimeout(() => help && help.classList.add('hidden'), 9000);
requestAnimationFrame((t) => { lastTime = t; frame(t); });

// 動作確認用（コンソールから状態を覗ける）
window.__game = {
  world, player: () => player, inv, stats, input: inputState, target: () => target,
  selectedSlot: () => selected, setSelected: (i) => { selected = i; }, survival, mobs, clock, uiMode: () => uiMode,
  openBag: () => { if (!uiMode) { uiMode = 'bag'; invUI.open('bag'); } }
};
