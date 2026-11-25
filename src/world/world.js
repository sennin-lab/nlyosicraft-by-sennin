import { generateChunk } from './gen.js';
import { buildSection } from './mesh.js';
import { CONFIG } from '../config.js';

const H = CONFIG.WORLD_H;
const key = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768);
const SECTIONS = H >> 4;

const ringCache = new Map();
function ringOffsets(R) {
  if (!ringCache.has(R)) {
    const arr = [];
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) arr.push([dx, dz]);
    arr.sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]));
    ringCache.set(R, arr);
  }
  return ringCache.get(R);
}

export function createWorld(initialSeed) {
  let seed = initialSeed;
  const chunks = new Map();
  const pad = new Uint8Array(18 * 18 * 18);
  const hpad = new Uint8Array(18 * 18);

  function getChunk(cx, cz) { return chunks.get(key(cx, cz)) || null; }

  function getBlock(x, y, z) {
    if (y < 0 || y >= H) return 0;
    const c = chunks.get(key(x >> 4, z >> 4));
    return c ? c.blocks[(y << 8) | ((z & 15) << 4) | (x & 15)] : 0;
  }

  function getHeight(x, z) {
    const c = chunks.get(key(x >> 4, z >> 4));
    return c ? c.heights[((z & 15) << 4) | (x & 15)] : 0;
  }

  function ensure(cx, cz) {
    const k = key(cx, cz);
    if (chunks.has(k)) return;
    const g = generateChunk(cx, cz, seed);
    chunks.set(k, {
      cx, cz,
      blocks: g.blocks,
      heights: g.heights,
      meshes: new Array(SECTIONS).fill(null),
      dirty: new Uint8Array(SECTIONS).fill(1),
      edited: false
    });
  }

  function ready(cx, cz) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!chunks.has(key(cx + dx, cz + dz))) return false;
      }
    }
    return true;
  }

  function markDirty(c, sec) {
    if (sec < 0 || sec >= SECTIONS) return;
    c.dirty[sec] = 1;
  }

  function setBlock(x, y, z, id) {
    if (y < 0 || y >= H) return false;
    const cx = x >> 4, cz = z >> 4;
    const c = chunks.get(key(cx, cz));
    if (!c) return false;
    const lx = x & 15, lz = z & 15;
    const i = (y << 8) | (lz << 4) | lx;
    if (c.blocks[i] === id) return false;
    c.blocks[i] = id;
    c.edited = true;

    const hi = (lz << 4) | lx;
    if (id !== 0) {
      if (y > c.heights[hi]) c.heights[hi] = y;
    } else if (y === c.heights[hi]) {
      let yy = y - 1;
      while (yy > 0 && c.blocks[(yy << 8) | (lz << 4) | lx] === 0) yy--;
      c.heights[hi] = yy;
    }

    const sec = y >> 4;
    markDirty(c, sec);
    if ((y & 15) === 0) markDirty(c, sec - 1);
    if ((y & 15) === 15) markDirty(c, sec + 1);

    // 境界に面する場合は隣接チャンクの面も作り直す
    const dxs = lx === 0 ? [-1, 0] : lx === 15 ? [1, 0] : [0];
    const dzs = lz === 0 ? [-1, 0] : lz === 15 ? [1, 0] : [0];
    for (const dx of dxs) for (const dz of dzs) {
      if (dx === 0 && dz === 0) continue;
      const n = chunks.get(key(cx + dx, cz + dz));
      if (n) for (let s = sec - 1; s <= sec + 1; s++) markDirty(n, s);
    }
    return true;
  }

  function disposeSection(s) {
    if (!s) return;
    if (s.opaque) s.opaque.dispose();
    if (s.cutout) s.cutout.dispose();
    if (s.trans) s.trans.dispose();
  }

  function dropMeshes(c) {
    for (let s = 0; s < SECTIONS; s++) {
      disposeSection(c.meshes[s]);
      c.meshes[s] = null;
      c.dirty[s] = 1;
    }
  }

  // 生成とアンロード（描画距離+1まで生成、+3を超えたら解放）
  function stream(pcx, pcz, rd, budget) {
    let made = 0;
    for (const [dx, dz] of ringOffsets(rd + 1)) {
      if (made >= budget) break;
      if (!chunks.has(key(pcx + dx, pcz + dz))) {
        ensure(pcx + dx, pcz + dz);
        made++;
      }
    }
    const uR = rd + 3;
    for (const [k, c] of chunks) {
      if (Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) <= uR) continue;
      dropMeshes(c);
      // 変更のないチャンクは次回生成し直せるので捨てる（編集済みは保持）
      if (!c.edited) chunks.delete(k);
    }
  }

  function fillPad(c, sec) {
    const ox = c.cx * 16, oz = c.cz * 16, oy = sec * 16;
    for (let y = -1; y <= 16; y++) {
      const wy = oy + y;
      for (let z = -1; z <= 16; z++) {
        for (let x = -1; x <= 16; x++) {
          pad[((y + 1) * 18 + (z + 1)) * 18 + (x + 1)] = (wy < 0 || wy >= H) ? 0 : getBlock(ox + x, wy, oz + z);
        }
      }
    }
    for (let z = -1; z <= 16; z++) {
      for (let x = -1; x <= 16; x++) {
        hpad[(z + 1) * 18 + (x + 1)] = getHeight(ox + x, oz + z);
      }
    }
  }

  // 汚れたセクションを近い順に作り直す（時間予算内）
  function buildMeshes(pcx, pcz, rd, maxBuilds, budgetMs, uvTable, upload) {
    const todo = [];
    for (const c of chunks.values()) {
      const dx = c.cx - pcx, dz = c.cz - pcz;
      if (Math.max(Math.abs(dx), Math.abs(dz)) > rd) continue;
      let any = false;
      for (let s = 0; s < SECTIONS; s++) if (c.dirty[s]) any = true;
      if (!any || !ready(c.cx, c.cz)) continue;
      for (let s = 0; s < SECTIONS; s++) if (c.dirty[s]) todo.push([dx * dx + dz * dz, c, s]);
    }
    if (!todo.length) return 0;
    todo.sort((a, b) => a[0] - b[0]);

    const t0 = performance.now();
    let built = 0;
    for (const [, c, s] of todo) {
      if (built >= maxBuilds || performance.now() - t0 > budgetMs) break;
      fillPad(c, s);
      const res = buildSection(pad, hpad, c.cx * 16, s * 16, c.cz * 16, uvTable);
      disposeSection(c.meshes[s]);
      c.meshes[s] = res ? {
        opaque: upload(res.opaque),
        cutout: upload(res.cutout),
        trans: upload(res.trans)
      } : null;
      c.dirty[s] = 0;
      built++;
    }
    return built;
  }

  // 同期で周辺を生成（スポーン直後の足場確保）
  function ensureArea(cx, cz, r) {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) ensure(cx + dx, cz + dz);
  }

  function reset(newSeed) {
    for (const c of chunks.values()) dropMeshes(c);
    chunks.clear();
    seed = newSeed;
  }

  return {
    chunks,
    getChunk, getBlock, getHeight, setBlock, ensure, ensureArea,
    stream, buildMeshes, reset,
    get seed() { return seed; }
  };
}
