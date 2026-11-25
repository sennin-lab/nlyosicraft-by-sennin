import { BLOCKS } from './data/blocks.js';
import { IDS as I } from './data/ids.js';
import { CONFIG } from './config.js';

const SOLID = new Uint8Array(256);
for (let i = 0; i < 256; i++) if (BLOCKS[i] && BLOCKS[i].solid) SOLID[i] = 1;

export const isLiquid = (id) => id === I.water || id === I.lava;

const HW = CONFIG.PLAYER_W / 2;
const PH = CONFIG.PLAYER_H;

// プレイヤーのAABBが固体と重なるか
export function collides(world, x, y, z) {
  const x0 = Math.floor(x - HW + 1e-4), x1 = Math.floor(x + HW - 1e-4);
  const y0 = Math.floor(y + 1e-4), y1 = Math.floor(y + PH - 1e-4);
  const z0 = Math.floor(z - HW + 1e-4), z1 = Math.floor(z + HW - 1e-4);
  for (let by = y0; by <= y1; by++) {
    for (let bx = x0; bx <= x1; bx++) {
      for (let bz = z0; bz <= z1; bz++) {
        if (SOLID[world.getBlock(bx, by, bz)]) return true;
      }
    }
  }
  return false;
}

// 1軸だけ移動し、衝突したら面まで押し戻す。戻り値: 衝突したか
export function moveAxis(world, p, axis, d) {
  if (d === 0) return false;
  const k = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z';
  p[k] += d;
  if (!collides(world, p.x, p.y, p.z)) return false;
  if (axis === 0) {
    p.x = d > 0 ? Math.floor(p.x + HW) - HW - 1e-4 : Math.floor(p.x - HW) + 1 + HW + 1e-4;
  } else if (axis === 2) {
    p.z = d > 0 ? Math.floor(p.z + HW) - HW - 1e-4 : Math.floor(p.z - HW) + 1 + HW + 1e-4;
  } else if (d < 0) {
    p.y = Math.floor(p.y) + 1;
  } else {
    p.y = Math.floor(p.y + PH) - PH - 1e-4;
  }
  return true;
}

// 占有されているセルとプレイヤーが重なるか（設置の可否判定）
export function overlapsCell(p, cx, cy, cz) {
  return p.x + HW > cx && p.x - HW < cx + 1 &&
    p.y + PH > cy && p.y < cy + 1 &&
    p.z + HW > cz && p.z - HW < cz + 1;
}

// Amanatides-Wooのグリッド走査。当たったブロックと、入ってきた面の法線を返す
export function raycast(world, ox, oy, oz, dx, dy, dz, maxDist) {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  const tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  let tmx = dx > 0 ? (x + 1 - ox) * tdx : dx < 0 ? (ox - x) * tdx : Infinity;
  let tmy = dy > 0 ? (y + 1 - oy) * tdy : dy < 0 ? (oy - y) * tdy : Infinity;
  let tmz = dz > 0 ? (z + 1 - oz) * tdz : dz < 0 ? (oz - z) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  while (t <= maxDist) {
    const id = world.getBlock(x, y, z);
    if (id !== 0 && !isLiquid(id)) return { x, y, z, nx, ny, nz, id };
    if (tmx < tmy && tmx < tmz) {
      t = tmx; tmx += tdx; x += sx; nx = -sx; ny = 0; nz = 0;
    } else if (tmy < tmz) {
      t = tmy; tmy += tdy; y += sy; nx = 0; ny = -sy; nz = 0;
    } else {
      t = tmz; tmz += tdz; z += sz; nx = 0; ny = 0; nz = -sz;
    }
  }
  return null;
}
