import { CONFIG } from './config.js';
import { IDS as I } from './data/ids.js';
import { collides, moveAxis, isLiquid } from './physics.js';

export function createPlayer(x, y, z) {
  return { x, y, z, vy: 0, yaw: 0, pitch: -0.2, onGround: false, inWater: false, jumpBuf: 0 };
}

// 1固定ステップ分の更新（視点・移動・ジャンプ・重力・段差上り）
export function updatePlayer(p, dt, inp, world, autoStep) {
  // 視点
  p.yaw -= inp.lookDX * CONFIG.LOOK_SENSITIVITY;
  p.pitch -= inp.lookDY * CONFIG.LOOK_SENSITIVITY;
  const lim = Math.PI * 0.49;
  if (p.pitch > lim) p.pitch = lim;
  if (p.pitch < -lim) p.pitch = -lim;

  // 水中判定（頭の位置が水か）
  p.inWater = world.getBlock(Math.floor(p.x), Math.floor(p.y + 1.4), Math.floor(p.z)) === I.water;

  // ジャンプ入力は少し先行入力を許す（タッチ操作の取りこぼし防止）
  if (inp.jumpPressed) { p.jumpBuf = 0.15; inp.jumpPressed = false; }
  p.jumpBuf = Math.max(0, p.jumpBuf - dt);
  if (p.jumpBuf > 0 && p.onGround) {
    p.vy = CONFIG.JUMP_VEL;
    p.onGround = false;
    p.jumpBuf = 0;
  }

  // 移動方向（スティック/キーボードは正規化）
  let mx = inp.moveX, my = inp.moveY;
  const m = Math.hypot(mx, my);
  if (m > 1) { mx /= m; my /= m; }
  const speed = p.inWater ? CONFIG.SWIM_SPEED : CONFIG.MOVE_SPEED;
  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  const fx = -sy, fz = -cy, rx = cy, rz = -sy;
  const dx = (rx * mx + fx * -my) * speed * dt;
  const dz = (rz * mx + fz * -my) * speed * dt;

  // 重力（水中は浮力、ジャンプ長押しで浮上）
  if (p.inWater) {
    if (inp.jumpHeld) p.vy = Math.min(p.vy + 40 * dt, 3.0);
    else p.vy = Math.max(p.vy - 4 * dt, -2.0);
  } else {
    p.vy = Math.max(p.vy - CONFIG.GRAVITY * dt, -CONFIG.MAX_FALL);
  }

  // 水平移動 + 段差上り
  const bx = p.x, by = p.y, bz = p.z;
  const hx = moveAxis(world, p, 0, dx);
  const hz = moveAxis(world, p, 2, dz);
  if ((hx || hz) && p.onGround && autoStep && !p.inWater) {
    const q = { x: bx, y: Math.floor(by + 0.01) + 1, z: bz };
    if (!collides(world, q.x, q.y, q.z)) {
      moveAxis(world, q, 0, dx);
      moveAxis(world, q, 2, dz);
      const gain = Math.hypot(q.x - bx, q.z - bz);
      const base = Math.hypot(p.x - bx, p.z - bz);
      if (gain > base + 1e-4) { p.x = q.x; p.y = q.y; p.z = q.z; }
    }
  }

  // 垂直移動
  const hy = moveAxis(world, p, 1, p.vy * dt);
  if (hy) {
    if (p.vy < 0) p.onGround = true;
    p.vy = 0;
  } else {
    p.onGround = false;
  }
}
