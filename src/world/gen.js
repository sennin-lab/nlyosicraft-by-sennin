import { IDS as I } from '../data/ids.js';
import { CONFIG } from '../config.js';
import { fbm2, vnoise3, hash3 } from './noise.js';

const W = 16, H = CONFIG.WORLD_H, SEA = CONFIG.SEA_LEVEL;
export const BIOME = Object.freeze({ PLAINS: 0, FOREST: 1, DESERT: 2, SNOW: 3, MOUNTAIN: 4 });

// 鉱石はノイズの塊として出るので、岩盤・石の中でも鉱脈状になる
function stoneOrOre(x, y, z, seed) {
  const n = vnoise3(x * 0.23, y * 0.23, z * 0.23, seed + 311);
  if (y <= 16 && n > 0.94) return I.diamond_ore;
  if (y <= 32 && n > 0.92) return I.gold_ore;
  if (y <= 64 && n > 0.88) return I.iron_ore;
  if (n > 0.84) return I.coal_ore;
  if (n < 0.06 && y >= 40 && y <= 90) return I.copper_ore;
  return I.stone;
}

function placeTree(blocks, lx, top, lz, wx, wz, seed) {
  const trunk = 4 + Math.floor(hash3(wx, 5, wz, seed + 9) * 3);
  const at = (x, y, z) => (y << 8) | (z << 4) | x;
  const put = (x, y, z, id, onlyAir) => {
    if (y < 0 || y >= H) return;
    const i = at(x, y, z);
    if (!onlyAir || blocks[i] === 0) blocks[i] = id;
  };
  const layers = [[trunk - 2, 2], [trunk - 1, 2], [trunk, 1], [trunk + 1, 1]];
  for (const [dy, r] of layers) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        put(lx + dx, top + dy, lz + dz, I.oak_leaves, true);
      }
    }
  }
  for (let dy = 1; dy <= trunk; dy++) put(lx, top + dy, lz, I.oak_log, false);
}

export function generateChunk(cx, cz, seed) {
  const blocks = new Uint8Array(W * H * W);
  const topSolid = new Int16Array(W * W);
  const surf = new Uint8Array(W * W);
  const biomes = new Uint8Array(W * W);
  const at = (lx, y, lz) => (y << 8) | (lz << 4) | lx;

  // 1段目: 地形の柱
  for (let lz = 0; lz < W; lz++) {
    for (let lx = 0; lx < W; lx++) {
      const c = lz * W + lx;
      const wx = cx * W + lx, wz = cz * W + lz;
      const base = fbm2(wx * 0.0042, wz * 0.0042, seed, 4);
      const detail = fbm2(wx * 0.03, wz * 0.03, seed + 7, 2);
      const mtn = Math.max(0, fbm2(wx * 0.0075, wz * 0.0075, seed + 13, 3) - 0.04);
      let top = Math.round(SEA - 3 + base * 26 + detail * 3 + mtn * 110);
      top = Math.max(4, Math.min(H - 16, top));
      const temp = fbm2(wx * 0.005, wz * 0.005, seed + 21, 2);
      const humid = fbm2(wx * 0.005, wz * 0.005, seed + 33, 2);

      let biome = BIOME.PLAINS;
      if (top >= 96) biome = BIOME.MOUNTAIN;
      else if (temp > 0.3 && humid < -0.05) biome = BIOME.DESERT;
      else if (temp < -0.38) biome = BIOME.SNOW;
      else if (humid > 0.08) biome = BIOME.FOREST;
      biomes[c] = biome;

      let topId = I.grass_block, subId = I.dirt;
      if (biome === BIOME.DESERT) { topId = I.sand; subId = I.sandstone; }
      else if (biome === BIOME.SNOW) { topId = I.snow_block; subId = I.dirt; }
      else if (biome === BIOME.MOUNTAIN) { topId = top >= 104 ? I.snow_block : I.stone; subId = I.stone; }
      if (top <= SEA + 1) { topId = I.sand; subId = I.sand; }
      surf[c] = topId;
      topSolid[c] = top;

      for (let y = 0; y <= top; y++) {
        let id;
        if (y === 0) id = I.bedrock;
        else if (y < top - 3) id = stoneOrOre(wx, y, wz, seed);
        else if (y < top) id = subId;
        else id = topId;
        blocks[at(lx, y, lz)] = id;
      }
      for (let y = top + 1; y <= SEA; y++) blocks[at(lx, y, lz)] = I.water;

      // 洞窟: 3Dノイズで空洞を抜く（地表近くは残す）
      for (let y = 2; y < top - 3; y++) {
        if (vnoise3(wx * 0.05, y * 0.07, wz * 0.05, seed + 77) > 0.7) blocks[at(lx, y, lz)] = 0;
      }
    }
  }

  // 2段目: 植生（木は外周3ブロックを除いて置くので、チャンク境界をまたがない）
  for (let lz = 2; lz < 14; lz++) {
    for (let lx = 2; lx < 14; lx++) {
      const c = lz * W + lx;
      const top = topSolid[c];
      const wx = cx * W + lx, wz = cz * W + lz;
      const b = biomes[c];
      const r = hash3(wx, 0, wz, seed + 101);
      const p = hash3(wx, 1, wz, seed + 102);
      if (surf[c] === I.grass_block && top >= SEA) {
        const inTreeZone = lx >= 3 && lx <= 12 && lz >= 3 && lz <= 12;
        if (inTreeZone && ((b === BIOME.FOREST && r < 0.045) || (b === BIOME.PLAINS && r < 0.006))) {
          placeTree(blocks, lx, top, lz, wx, wz, seed);
        } else if (p < 0.2) {
          blocks[at(lx, top + 1, lz)] = I.short_grass;
        } else if (p < 0.205) {
          blocks[at(lx, top + 1, lz)] = I.poppy;
        } else if (p < 0.21) {
          blocks[at(lx, top + 1, lz)] = I.dandelion;
        }
      } else if (b === BIOME.DESERT && surf[c] === I.sand && top > SEA + 1 && r < 0.01) {
        const h = 2 + Math.floor(p * 2);
        for (let dy = 1; dy <= h; dy++) blocks[at(lx, top + dy, lz)] = I.cactus;
      }
    }
  }

  // 3段目: 列の最上段（水含む）を記録
  const heights = new Int16Array(W * W);
  for (let c = 0; c < W * W; c++) {
    const lx = c & 15, lz = c >> 4;
    let y = H - 1;
    while (y > 0 && blocks[at(lx, y, lz)] === 0) y--;
    heights[c] = y;
  }
  return { blocks, heights };
}
