import { BLOCKS } from './data/blocks.js';
import { IDS as I } from './data/ids.js';
import { CONFIG } from './config.js';

const SOLID = new Uint8Array(256);
for (let i = 0; i < 256; i++) if (BLOCKS[i] && BLOCKS[i].solid) SOLID[i] = 1;

export const isLiquid = (id) => id === I.water || id === I.lava;

// 当たり判定の箱（セル内座標 0..1 の [x0,y0,z0,x1,y1,z1]）。ハーフブロック・階段は形どおりの箱を持つ
const FULL = [[0, 0, 0, 1, 1, 1]];
const SHAPE_BOXES = {
  slab: [[0, 0, 0, 1, 0.5, 1]],
  stairs: [[0, 0, 0, 1, 0.5, 1], [0, 0.5, 0.5, 1, 1, 1]]
};
const BOXES = [];
for (let i = 0; i < 256; i++) {
  BOXES[i] = SOLID[i] ? (SHAPE_BOXES[BLOCKS[i].shape] || FULL) : null;
}

const PW = CONFIG.PLAYER_W, PH = CONFIG.PLAYER_H;

// AABB（足元基準、幅w、高さh）が固体と重なるか。プレイヤー・モブ共通
export function collides(world, x, y, z, w = PW, h = PH) {
  const hw = w / 2;
  const x0 = Math.floor(x - hw), x1 = Math.floor(x + hw - 1e-4);
  const y0 = Math.floor(y), y1 = Math.floor(y + h - 1e-4);
  const z0 = Math.floor(z - hw), z1 = Math.floor(z + hw - 1e-4);
  for (let by = y0; by <= y1; by++) {
    for (let bx = x0; bx <= x1; bx++) {
      for (let bz = z0; bz <= z1; bz++) {
        const boxes = BOXES[world.getBlock(bx, by, bz)];
        if (!boxes) continue;
        for (const b of boxes) {
          if (x - hw < bx + b[3] && x + hw > bx + b[0] &&
            y < by + b[4] && y + h > by + b[1] &&
            z - hw < bz + b[5] && z + hw > bz + b[2]) return true;
        }
      }
    }
  }
  return false;
}

// 下へ落ちて固体に当たった時の着地面（y0 → y1 の間で一番高い上面）。無ければ -Infinity
function floorAt(world, x, y0, z, y1, w, h) {
  const hw = w / 2;
  let best = -Infinity;
  for (let by = Math.floor(y1) - 1; by <= Math.floor(y0); by++) {
    for (let bx = Math.floor(x - hw); bx <= Math.floor(x + hw - 1e-6); bx++) {
      for (let bz = Math.floor(z - hw); bz <= Math.floor(z + hw - 1e-6); bz++) {
        const boxes = BOXES[world.getBlock(bx, by, bz)];
        if (!boxes) continue;
        for (const b of boxes) {
          if (!(x - hw < bx + b[3] && x + hw > bx + b[0] && z - hw < bz + b[5] && z + hw > bz + b[2])) continue;
          const top = by + b[4];
          if (top <= y0 + 1e-4 && top > best) best = top;
        }
      }
    }
  }
  return best;
}

// 上へ動いて固体に当たった時の天井（y0 → y1 の間で一番低い下面）。無ければ Infinity
function ceilAt(world, x, y0, z, y1, w, h) {
  const hw = w / 2;
  let best = Infinity;
  for (let by = Math.floor(y0 + h) - 1; by <= Math.floor(y1 + h); by++) {
    for (let bx = Math.floor(x - hw); bx <= Math.floor(x + hw - 1e-6); bx++) {
      for (let bz = Math.floor(z - hw); bz <= Math.floor(z + hw - 1e-6); bz++) {
        const boxes = BOXES[world.getBlock(bx, by, bz)];
        if (!boxes) continue;
        for (const b of boxes) {
          if (!(x - hw < bx + b[3] && x + hw > bx + b[0] && z - hw < bz + b[5] && z + hw > bz + b[2])) continue;
          const bottom = by + b[1];
          if (bottom >= y0 + h - 1e-4 && bottom < best) best = bottom;
        }
      }
    }
  }
  return best;
}

// 1軸だけ移動し、衝突したら面まで押し戻す。戻り値: 衝突したか
export function moveAxis(world, p, axis, d, w = PW, h = PH) {
  if (d === 0) return false;
  const k = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z';
  const hw = w / 2;
  const oldY = p.y;
  p[k] += d;
  if (!collides(world, p.x, p.y, p.z, w, h)) return false;
  if (axis === 0) {
    p.x = d > 0 ? Math.floor(p.x + hw) - hw - 1e-4 : Math.floor(p.x - hw) + 1 + hw + 1e-4;
  } else if (axis === 2) {
    p.z = d > 0 ? Math.floor(p.z + hw) - hw - 1e-4 : Math.floor(p.z - hw) + 1 + hw + 1e-4;
  } else if (d < 0) {
    const top = floorAt(world, p.x, oldY, p.z, p.y, w, h);
    p.y = top > -Infinity ? top + 1e-4 : Math.floor(p.y) + 1;
  } else {
    const c = ceilAt(world, p.x, oldY, p.z, p.y, w, h);
    p.y = c < Infinity ? c - h - 1e-4 : Math.floor(p.y + h) - h - 1e-4;
  }
  return true;
}

// 段差を1ブロック瞬間的に上る（モブ用。プレイヤーはジャンプで上る）
export function moveWithStep(world, p, dx, dz, w = PW, h = PH) {
  const bx = p.x, bz = p.z, by = p.y;
  const hx = moveAxis(world, p, 0, dx, w, h);
  const hz = moveAxis(world, p, 2, dz, w, h);
  if (!(hx || hz)) return false;
  const q = { x: bx, y: Math.floor(by + 0.01) + 1, z: bz };
  if (collides(world, q.x, q.y, q.z, w, h)) return true;
  moveAxis(world, q, 0, dx, w, h);
  moveAxis(world, q, 2, dz, w, h);
  if (Math.hypot(q.x - bx, q.z - bz) > Math.hypot(p.x - bx, p.z - bz) + 1e-4) {
    p.x = q.x; p.y = q.y; p.z = q.z;
  }
  return true;
}

// プレイヤーの箱と1セルが重なるか（設置可否）
export function overlapsCell(p, cx, cy, cz) {
  const hw = PW / 2;
  return p.x + hw > cx && p.x - hw < cx + 1 &&
    p.y + PH > cy && p.y < cy + 1 &&
    p.z + hw > cz && p.z - hw < cz + 1;
}

// 線分（単位方向ベクトル）とAABBの交差距離。外れなら null
export function rayBox(ox, oy, oz, dx, dy, dz, mnx, mny, mnz, mxx, mxy, mxz) {
  let tmin = -Infinity, tmax = Infinity;
  const axes = [[ox, dx, mnx, mxx], [oy, dy, mny, mxy], [oz, dz, mnz, mxz]];
  for (const [o, d, mn, mx] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (o < mn || o > mx) return null;
    } else {
      let t1 = (mn - o) / d, t2 = (mx - o) / d;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  if (tmax < 0) return null;
  return Math.max(tmin, 0);
}

// Amanatides-Wooのグリッド走査。当たったブロック・面の法線・距離を返す
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
    if (id !== 0 && !isLiquid(id)) return { x, y, z, nx, ny, nz, id, dist: t };
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
