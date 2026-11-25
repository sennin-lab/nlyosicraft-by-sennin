import { CONFIG } from './config.js';
import { IDS as I } from './data/ids.js';
import { moveAxis, collides } from './physics.js';

export function createPlayer(x, y, z) {
  return {
    x, y, z, vy: 0, yaw: 0, pitch: -0.2,
    onGround: false, inWater: false, jumpBuf: 0,
    fallStart: null,
    exhaust: 0,          // このフレームで発生した疲労（main.js が吸い上げる）
    pendingDamage: 0     // 落下ダメージ（main.js が適用）
  };
}

// 目の前が1ブロック分の段差なら、その場でジャンプして乗り越えられるか（頭の上が空いているか）
function canHop(world, p) {
  return !collides(world, p.x, p.y + 1.05, p.z);
}

// 1固定ステップ分の更新（視点・移動・ジャンプ・重力・段差ジャンプ・落下ダメージ）
export function updatePlayer(p, dt, inp, world) {
  p.yaw -= inp.lookDX * CONFIG.LOOK_SENSITIVITY;
  p.pitch -= inp.lookDY * CONFIG.LOOK_SENSITIVITY;
  const lim = Math.PI * 0.49;
  if (p.pitch > lim) p.pitch = lim;
  if (p.pitch < -lim) p.pitch = -lim;

  // 胴体の位置で判定する（頭だけ水面から出た時は水中扱いを外し、水から上がれるようにする）
  p.inWater = world.getBlock(Math.floor(p.x), Math.floor(p.y + 0.5), Math.floor(p.z)) === I.water;

  // 先行入力（タッチの取りこぼし防止）
  if (inp.jumpPressed) { p.jumpBuf = 0.15; inp.jumpPressed = false; }
  p.jumpBuf = Math.max(0, p.jumpBuf - dt);
  if (p.jumpBuf > 0 && p.onGround) {
    p.vy = CONFIG.JUMP_VEL;
    p.onGround = false;
    p.jumpBuf = 0;
    p.exhaust += 0.2;
  }

  let mx = inp.moveX, my = inp.moveY;
  const m = Math.hypot(mx, my);
  if (m > 1) { mx /= m; my /= m; }
  const speed = p.inWater ? CONFIG.SWIM_SPEED : CONFIG.MOVE_SPEED;
  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  const fx = -sy, fz = -cy, rx = cy, rz = -sy;
  const dx = (rx * mx + fx * -my) * speed * dt;
  const dz = (rz * mx + fz * -my) * speed * dt;

  if (p.inWater) {
    if (inp.jumpHeld) p.vy = Math.min(p.vy + 40 * dt, 3.0);
    else p.vy = Math.max(p.vy - 4 * dt, -2.0);
  } else {
    p.vy = Math.max(p.vy - CONFIG.GRAVITY * dt, -CONFIG.MAX_FALL);
  }

  // 水平移動。段差や壁に当たり、地面または水中にいて頭上が空いていれば、ジャンプして乗り越える（水中なら水から上がる）
  const bx = p.x, bz = p.z;
  const hx = moveAxis(world, p, 0, dx);
  const hz = moveAxis(world, p, 2, dz);
  const blocked = (dx !== 0 && hx) || (dz !== 0 && hz);
  if (blocked && (p.onGround || p.inWater) && canHop(world, p)) {
    p.vy = CONFIG.JUMP_VEL;
    p.onGround = false;
    p.jumpBuf = 0;
    if (!p.inWater) p.exhaust += 0.2;
  }
  const walked = Math.hypot(p.x - bx, p.z - bz);
  if (p.onGround) p.exhaust += walked * 0.01;

  // 落下の記録: 地面を離れた高さから着地した高さまでの差
  const prevY = p.y;
  if (!p.onGround && p.fallStart === null && p.vy < 0) p.fallStart = prevY;
  const hy = moveAxis(world, p, 1, p.vy * dt);
  if (hy) {
    if (p.vy < 0) {
      p.onGround = true;
      if (p.fallStart !== null && !p.inWater) {
        const fall = p.fallStart - p.y;
        if (fall > 3) p.pendingDamage += Math.floor(fall - 3);
      }
      p.fallStart = null;
    }
    p.vy = 0;
  } else {
    p.onGround = false;
  }
  if (p.inWater) p.fallStart = null;
}
