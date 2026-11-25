import { collides, moveAxis, moveWithStep } from '../physics.js';

const GRAVITY = 32, MAX_FALL = 55;

// 目標方向へ向きを変えて移動速度を設定する
function setMove(e, tx, tz, speed) {
  const len = Math.hypot(tx, tz) || 1;
  e.mx = (tx / len) * speed;
  e.mz = (tz / len) * speed;
  e.yaw = Math.atan2(-tx, -tz);
}

function faceTo(e, tx, tz) {
  e.yaw = Math.atan2(-tx, -tz);
}

// 重力・水平移動（段差上り）・垂直移動。モブの箱は e.w / e.h
export function moveBody(e, dt, world) {
  e.vy = Math.max(e.vy - GRAVITY * dt, -MAX_FALL);
  const dx = (e.mx + e.kx) * dt, dz = (e.mz + e.kz) * dt;
  const decay = Math.exp(-8 * dt);
  e.kx *= decay; e.kz *= decay;
  moveWithStep(world, e, dx, dz, e.w, e.h);
  const hy = moveAxis(world, e, 1, e.vy * dt, e.w, e.h);
  if (hy) {
    if (e.vy < 0) e.onGround = true;
    e.vy = 0;
  } else {
    e.onGround = false;
  }
}

function burnCheck(e, dt, ctx) {
  if (!e.def.burns || ctx.daylight < 0.7) { e.burnT = 0; return; }
  if (!ctx.openSky(e.x, e.y, e.z)) { e.burnT = 0; return; }
  e.burnT += dt;
  if (e.burnT >= 1) { e.burnT = 0; ctx.damageMob(e, 1, e.x, e.z); }
}

// 敵・動物の思考（移動方向の決定と攻撃）
export function updateMob(e, dt, ctx) {
  e.mx = 0; e.mz = 0;
  e.cd = Math.max(0, e.cd - dt);
  e.hurt = Math.max(0, e.hurt - dt);
  const def = e.def;
  const pl = ctx.player;
  const dx = pl.x - e.x, dz = pl.z - e.z;
  const dist = Math.hypot(dx, dz);

  if (!def.hostile) {
    // 動物: 攻撃されたら逃げ、そうでなければ時々うろつく
    if (e.fleeT > 0) {
      e.fleeT -= dt;
      setMove(e, e.x - e.fleeX, e.z - e.fleeZ, def.speed * 1.8);
      return;
    }
    e.wanderT -= dt;
    if (e.wanderT <= 0) {
      e.wanderT = 2 + ctx.rand() * 3;
      e.moveT = ctx.rand() < 0.5 ? 0 : 1.5 + ctx.rand() * 2;
      e.wanderYaw = ctx.rand() * Math.PI * 2;
    }
    if (e.moveT > 0) {
      e.moveT -= dt;
      setMove(e, -Math.sin(e.wanderYaw), -Math.cos(e.wanderYaw), def.speed);
    }
    return;
  }

  burnCheck(e, dt, ctx);
  const chase = dist < 16 && !ctx.creative;
  const aggro = dist < 16;

  if (e.type === 'creeper') {
    if (aggro) {
      faceTo(e, dx, dz);
      if (dist > 2.5) setMove(e, dx, dz, def.speed);
      if (dist <= 3) e.fuse += dt;
      else e.fuse = Math.max(0, e.fuse - dt * 2);
      if (e.fuse >= def.fuse) {
        e.dead = true;
        ctx.explode(e.x, e.y + 0.9, e.z, def.radius);
      }
    } else {
      e.fuse = 0;
    }
    return;
  }

  if (def.ranged) {
    if (!aggro) return;
    faceTo(e, dx, dz);
    if (dist > 9) setMove(e, dx, dz, def.speed);
    else if (dist < 5) setMove(e, -dx, -dz, def.speed);
    e.shootT -= dt;
    if (e.shootT <= 0) {
      e.shootT = 2.5;
      const ex = e.x, ey = e.y + 1.5, ez = e.z;
      const tx = pl.x - ex, ty = pl.y + 1.0 - ey, tz = pl.z - ez;
      const len = Math.hypot(tx, ty, tz) || 1;
      ctx.spawnArrow(ex, ey, ez, (tx / len) * 16, (ty / len) * 16, (tz / len) * 16);
    }
    return;
  }

  // 近接型（ゾンビ・クモ）
  if (chase) {
    const reach = (def.reach || 1.5) + def.w / 2;
    if (dist > reach - 0.3) setMove(e, dx, dz, def.speed);
    else faceTo(e, dx, dz);
    const vertical = Math.abs(pl.y - e.y) < 2.0;
    if (dist <= reach && vertical && e.cd <= 0) {
      e.cd = def.cd;
      ctx.hurtPlayer(def.dmg, e.x, e.z, e.type);
    }
  }
}

// 矢の飛行: 固体に当たるか、プレイヤーに当たると消える
export function updateArrow(e, dt, ctx) {
  e.life -= dt;
  if (e.life <= 0) { e.dead = true; return; }
  e.vy -= 6 * dt;
  const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt, nz = e.z + e.vz * dt;
  if (collides(ctx.world, nx, ny, nz, 0.06, 0.06)) { e.dead = true; return; }
  e.x = nx; e.y = ny; e.z = nz;
  const pl = ctx.player;
  if (Math.hypot(e.x - pl.x, e.y - (pl.y + 1.0), e.z - pl.z) < 0.7) {
    ctx.hurtPlayer(2, e.x, e.z, 'arrow');
    e.dead = true;
  }
  e.yaw = Math.atan2(-e.vx, -e.vz);
  e.pitch = Math.atan2(e.vy, Math.hypot(e.vx, e.vz));
}

