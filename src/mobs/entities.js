import { MOBS } from '../data/mobs.js';
import { rayBox } from '../physics.js';
import { updateMob, updateArrow, moveBody } from './ai.js';

const HOSTILE_CAP = 12, PASSIVE_CAP = 8, DESPAWN_DIST = 80;
const HOSTILE_TYPES = ['zombie', 'zombie', 'skeleton', 'creeper', 'spider'];
const PASSIVE_TYPES = ['pig', 'cow', 'chicken'];

// モブ・矢の管理（湧き・更新・ダメージ・死亡ドロップ）
export function createMobs(world, rand = Math.random) {
  const list = [];
  let nextId = 1;
  let spawnT = 0;

  function spawn(type, x, y, z) {
    const def = MOBS[type];
    const e = {
      id: nextId++, kind: 'mob', type, def, x, y, z, vy: 0,
      yaw: rand() * Math.PI * 2, pitch: 0, mx: 0, mz: 0, kx: 0, kz: 0,
      w: def.w, h: def.h, hp: def.hp, hurt: 0, walk: 0, cd: 0,
      fuse: 0, wanderT: rand() * 3, wanderYaw: 0, moveT: 0,
      fleeT: 0, fleeX: 0, fleeZ: 0, shootT: 2, burnT: 0,
      onGround: false, dead: false, age: 0
    };
    list.push(e);
    return e;
  }

  function spawnArrow(x, y, z, vx, vy, vz) {
    list.push({
      id: nextId++, kind: 'arrow', type: 'arrow', x, y, z, vx, vy, vz,
      yaw: 0, pitch: 0, life: 6, dead: false, w: 0.1, h: 0.1
    });
  }

  function drop(e, ctx) {
    for (const [id, min, max] of e.def.drops || []) {
      const n = min + Math.floor(rand() * (max - min + 1));
      if (n > 0) ctx.dropItem(id, n);
    }
  }

  // ダメージを与える（逃げる・ノックバック・死亡処理）
  function damageMob(e, dmg, fromX, fromZ, ctx) {
    if (e.dead || e.kind !== 'mob') return;
    e.hp -= dmg;
    e.hurt = 0.4;
    const len = Math.hypot(e.x - fromX, e.z - fromZ) || 1;
    e.kx = ((e.x - fromX) / len) * 5;
    e.kz = ((e.z - fromZ) / len) * 5;
    if (!e.def.hostile) { e.fleeT = 4; e.fleeX = fromX; e.fleeZ = fromZ; }
    if (e.hp <= 0) {
      e.dead = true;
      drop(e, ctx);
    }
  }

  function hitTest(ox, oy, oz, dx, dy, dz, maxDist) {
    let best = null, bestT = maxDist;
    for (const e of list) {
      if (e.kind !== 'mob' || e.dead) continue;
      const hw = e.w / 2;
      const t = rayBox(ox, oy, oz, dx, dy, dz, e.x - hw, e.y, e.z - hw, e.x + hw, e.y + e.h, e.z + hw);
      if (t !== null && t <= bestT) { best = e; bestT = t; }
    }
    return best ? { e: best, dist: bestT } : null;
  }

  function inLoaded(e) {
    return !!world.getChunk(Math.floor(e.x) >> 4, Math.floor(e.z) >> 4);
  }

  function update(dt, ctx) {
    const full = {
      ...ctx,
      damageMob: (e, dmg, fx, fz) => damageMob(e, dmg, fx, fz, ctx),
      spawnArrow,
      rand
    };
    for (const e of list) {
      if (e.dead) continue;
      e.age += dt;
      if (!inLoaded(e)) continue;
      const dp = Math.hypot(e.x - ctx.player.x, e.z - ctx.player.z);
      if (e.kind === 'mob' && dp > DESPAWN_DIST) { e.dead = true; continue; }
      if (e.kind === 'arrow') { updateArrow(e, dt, full); continue; }
      updateMob(e, dt, full);
      if (e.dead) continue;
      if (e.mx !== 0 || e.mz !== 0) e.walk += dt * 9;
      moveBody(e, dt, world);
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
  }

  // 数が少なければ、プレイヤーの周囲に湧かせる（夜は敵、昼は動物）
  function trySpawn(dt, ctx) {
    spawnT -= dt;
    if (spawnT > 0) return;
    spawnT = 0.4;
    let hostile = 0, passive = 0;
    for (const e of list) if (e.kind === 'mob') { if (e.def.hostile) hostile++; else passive++; }
    const wantHostile = ctx.night && hostile < HOSTILE_CAP;
    const wantPassive = !ctx.night && ctx.daylight > 0.5 && passive < PASSIVE_CAP;
    if (!wantHostile && !wantPassive) return;

    const ang = rand() * Math.PI * 2;
    const dist = 20 + rand() * 16;
    const x = Math.floor(ctx.player.x + Math.cos(ang) * dist);
    const z = Math.floor(ctx.player.z + Math.sin(ang) * dist);
    if (!world.getChunk(x >> 4, z >> 4)) return;
    const top = world.getHeight(x, z);
    const ground = world.getBlock(x, top, z);
    if (top < 1 || ground === 0 || ground === 31) return;
    if (wantHostile) {
      const type = HOSTILE_TYPES[Math.floor(rand() * HOSTILE_TYPES.length)];
      spawn(type, x + 0.5, top + 1, z + 0.5);
    } else if (ground === 5) {
      const type = PASSIVE_TYPES[Math.floor(rand() * PASSIVE_TYPES.length)];
      spawn(type, x + 0.5, top + 1, z + 0.5);
    }
  }

  function clear() { list.length = 0; }

  return {
    list, spawn, spawnArrow, update, trySpawn, hitTest, damageMob, clear,
    get count() { return list.length; }
  };
}
