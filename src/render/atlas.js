import { IDS as I } from '../data/ids.js';

// 16x16の手描き調テクスチャを手続き生成（Minecraft風の色味と模様）
const TILE_NAMES = [
  'stone', 'cobble', 'dirt', 'grass_top', 'grass_side', 'sand', 'gravel',
  'sandstone_top', 'sandstone_side', 'log_top', 'oak_side', 'planks', 'leaves',
  'ore_coal', 'ore_iron', 'ore_gold', 'ore_diamond', 'ore_copper', 'glass',
  'water', 'bedrock', 'short_grass', 'poppy', 'dandelion', 'bricks', 'snow',
  'cactus_top', 'cactus_side', 'clay', 'obsidian', 'wool', 'ice',
  'crafting_top', 'crafting_side', 'furnace_top', 'furnace_side'
];
const TI = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i]));

// 任意のテクスチャ差し替え: ./assets/blocks/<タイル名>.png（16x16推奨）があれば、その絵を使う
function loadPackTile(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `./assets/blocks/${name}.png`;
  });
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const H = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
const jit = (c, d) => [cl(c[0] + d), cl(c[1] + d), cl(c[2] + d), 255];
const rgba = (c, a = 255) => [c[0], c[1], c[2], a];

// 隣接平均で少しまとまりのあるノイズ場を作る
function field(r) {
  const raw = new Float32Array(256);
  for (let i = 0; i < 256; i++) raw[i] = r();
  const out = new Float32Array(256);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const avg = (raw[y * 16 + ((x + 1) & 15)] + raw[y * 16 + ((x + 15) & 15)] +
        raw[((y + 1) & 15) * 16 + x] + raw[((y + 15) & 15) * 16 + x]) / 4;
      out[y * 16 + x] = 0.5 * raw[y * 16 + x] + 0.5 * avg;
    }
  }
  return out;
}

// 近い2つのセル中心からボロノイ境界を判定する（石畳・砂利用）
function voronoi(r, count) {
  const pts = [];
  for (let i = 0; i < count; i++) pts.push({ x: r() * 16, y: r() * 16, s: (r() - 0.5) * 34 });
  return (x, y) => {
    let d1 = 1e9, d2 = 1e9, best = pts[0];
    for (const p of pts) {
      const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y);
      if (d < d1) { d2 = d1; d1 = d; best = p; }
      else if (d < d2) d2 = d;
    }
    return { edge: d2 - d1 < 1.1, cell: best };
  };
}

// 鉱石: 石の上に色の斑点を散らす
function oreFactory(hex) {
  return (r) => {
    const spots = [];
    for (let i = 0; i < 7; i++) spots.push({ x: 1 + r() * 14, y: 1 + r() * 14 });
    const col = H(hex);
    return (x, y, n) => {
      for (const s of spots) {
        if (Math.hypot(x + 0.5 - s.x, y + 0.5 - s.y) < 1.5 && n > 0.25) return jit(col, (n - 0.5) * 30);
      }
      return jit(H('#7d7d7d'), (n - 0.5) * 40);
    };
  };
}

function plantFactory(stemFlower) {
  return (r) => {
    const heights = Array.from({ length: 16 }, () => 6 + Math.floor(r() * 7));
    return (x, y, n) => {
      if (stemFlower) return flower(x, y, n, stemFlower);
      if (y >= 16 - heights[x] && x % 3 !== 2) return jit(H('#5a9e35'), (n - 0.5) * 30);
      return [0, 0, 0, 0];
    };
  };
}

function flower(x, y, n, color) {
  const dx = x - 7.5, dy = y - 5.5;
  if (x === 7 || x === 8) { if (y >= 8) return jit(H('#4a8a2a'), (n - 0.5) * 16); }
  if ((x === 6 && y === 12) || (x === 9 && y === 11)) return jit(H('#4a8a2a'), 0);
  if (dx * dx + dy * dy < 9) {
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return rgba(H('#3a1a10'));
    return jit(H(color), (n - 0.5) * 20);
  }
  return [0, 0, 0, 0];
}

const PAINTERS = {
  stone: () => (x, y, n) => jit(H('#7d7d7d'), (n - 0.5) * 46),
  cobble: (r) => {
    const v = voronoi(r, 9);
    return (x, y, n) => {
      const { edge, cell } = v(x, y);
      if (edge) return jit(H('#4f4f4f'), (n - 0.5) * 22);
      return jit(H('#858585'), cell.s + (n - 0.5) * 26);
    };
  },
  dirt: () => (x, y, n) => jit(H('#866043'), (n - 0.5) * 34),
  grass_top: () => (x, y, n) => jit(H('#7cbd48'), (n - 0.5) * 36),
  grass_side: (r) => {
    const edge = Array.from({ length: 16 }, () => 3 + Math.floor(r() * 2));
    return (x, y, n) => {
      if (y < edge[x]) return jit(H('#7cbd48'), (n - 0.5) * 36);
      if (y === edge[x]) return jit(H('#6b8f3c'), (n - 0.5) * 20);
      return jit(H('#866043'), (n - 0.5) * 34);
    };
  },
  sand: () => (x, y, n) => jit(H('#dcd29c'), (n - 0.5) * 20),
  gravel: (r) => {
    const v = voronoi(r, 14);
    const cols = ['#7f7b78', '#6c6865', '#948f8c', '#5f5b58'];
    return (x, y, n) => {
      const { cell } = v(x, y);
      const idx = Math.floor((cell.s + 17) / 9) & 3;
      return jit(H(cols[idx]), (n - 0.5) * 18);
    };
  },
  sandstone_top: () => (x, y, n) => jit(H('#d9cf9d'), (n - 0.5) * 14),
  sandstone_side: () => (x, y, n) => jit(y % 4 === 0 ? H('#c3b78a') : H('#d9cf9d'), (n - 0.5) * 14),
  log_top: () => (x, y, n) => {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    const c = Math.floor(d) % 2 ? '#9d7d4b' : '#b8955c';
    return jit(H(d >= 7 ? '#7d5f34' : c), (n - 0.5) * 14);
  },
  oak_side: () => (x, y, n) => {
    const c = (x % 4 === 0 || x % 4 === 3) ? '#5b4327' : '#6e5330';
    return jit(H(n > 0.9 ? '#4a3720' : c), (n - 0.5) * 12);
  },
  planks: () => (x, y, n) => {
    const band = Math.floor(y / 4);
    if (y % 4 === 0) return jit(H('#6f5030'), (n - 0.5) * 8);
    const seamX = band % 2 ? 4 : 12;
    if (x === seamX) return rgba(H('#6f5030'));
    const base = ['#a07a48', '#ae8a53', '#9a7243', '#b08e58'][band % 4];
    return jit(H(base), (n - 0.5) * 18);
  },
  leaves: () => (x, y, n) => {
    if (n < 0.14) return [0, 0, 0, 0];
    const c = n < 0.45 ? '#3a8a20' : n < 0.8 ? '#4ea22d' : '#5fb63a';
    return rgba(H(c));
  },
  ore_coal: oreFactory('#222222'),
  ore_iron: oreFactory('#d8a88f'),
  ore_gold: oreFactory('#fcee4b'),
  ore_diamond: oreFactory('#5decf5'),
  ore_copper: oreFactory('#c66b43'),
  glass: () => (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return rgba(H('#c8ecf6'));
    if ((x === 2 && y === 3) || (x === 3 && y === 2)) return [255, 255, 255, 140];
    return [0, 0, 0, 0];
  },
  water: () => (x, y, n) => jit(H('#3d74e0'), (n - 0.5) * 26),
  bedrock: () => (x, y, n) => jit(H('#565656'), (n - 0.5) * 70),
  short_grass: plantFactory(null),
  poppy: () => (x, y, n) => flower(x, y, n, '#d12b21'),
  dandelion: () => (x, y, n) => flower(x, y, n, '#f2d02b'),
  bricks: () => (x, y, n) => {
    const mortar = y % 4 === 3 || ((x + ((y >> 2) & 1) * 4) % 8 === 0);
    return mortar ? rgba(H('#b5ada3')) : jit(H('#97493c'), (n - 0.5) * 26);
  },
  snow: () => (x, y, n) => jit(H('#f4f9fc'), (n - 0.5) * 12),
  cactus_top: () => (x, y, n) => jit(H('#4f9b34'), (n - 0.5) * 20),
  cactus_side: () => (x, y, n) => {
    if (n > 0.93) return rgba(H('#e6e6c8'));
    return jit(H(x % 4 === 2 ? '#2e7220' : '#3f8c2a'), (n - 0.5) * 16);
  },
  clay: () => (x, y, n) => jit(H('#a0a7b5'), (n - 0.5) * 16),
  obsidian: () => (x, y, n) => (n > 0.85 ? rgba(H('#3c2a5c')) : jit(H('#15101f'), (n - 0.5) * 10)),
  wool: () => (x, y, n) => jit(H('#ececec'), (n - 0.5) * 14),
  ice: () => (x, y, n) => jit(H('#8fb4ec'), (n - 0.5) * 16),
  // 作業台: 板材に格子の刻み目
  crafting_top: () => (x, y, n) => {
    if (x === 0 || y === 0 || x === 15 || y === 15 || x === 5 || x === 10 || y === 5 || y === 10) return rgba(H('#4a3218'));
    return jit(H('#a57e4c'), (n - 0.5) * 16);
  },
  crafting_side: () => (x, y, n) => {
    if (x > 3 && x < 12 && y > 4 && y < 12) return jit(H('#5c4426'), (n - 0.5) * 12);
    return jit(H('#9a7445'), (n - 0.5) * 16);
  },
  // かまど: 石に炉の口
  furnace_top: () => (x, y, n) => jit(H('#7d7d7d'), (n - 0.5) * 40),
  furnace_side: () => (x, y, n) => {
    if (x > 3 && x < 12 && y > 5 && y < 13) return y > 9 ? rgba(H('#ff8a1f')) : rgba(H('#2a2a2a'));
    return jit(H('#737373'), (n - 0.5) * 40);
  }
};

const rep = (n) => [n, n, n];
const BLOCK_TILES = {
  [I.bedrock]: rep('bedrock'),
  [I.stone]: rep('stone'),
  [I.cobblestone]: rep('cobble'),
  [I.dirt]: rep('dirt'),
  [I.grass_block]: ['grass_top', 'grass_side', 'dirt'],
  [I.sand]: rep('sand'),
  [I.gravel]: rep('gravel'),
  [I.sandstone]: ['sandstone_top', 'sandstone_side', 'sandstone_top'],
  [I.oak_log]: ['log_top', 'oak_side', 'log_top'],
  [I.oak_planks]: rep('planks'),
  [I.oak_leaves]: rep('leaves'),
  [I.coal_ore]: rep('ore_coal'),
  [I.iron_ore]: rep('ore_iron'),
  [I.gold_ore]: rep('ore_gold'),
  [I.diamond_ore]: rep('ore_diamond'),
  [I.copper_ore]: rep('ore_copper'),
  [I.glass]: rep('glass'),
  [I.water]: rep('water'),
  [I.short_grass]: rep('short_grass'),
  [I.poppy]: rep('poppy'),
  [I.dandelion]: rep('dandelion'),
  [I.bricks]: rep('bricks'),
  [I.snow_block]: rep('snow'),
  [I.cactus]: ['cactus_top', 'cactus_side', 'cactus_top'],
  [I.clay]: rep('clay'),
  [I.obsidian]: rep('obsidian'),
  [I.white_wool]: rep('wool'),
  [I.ice]: rep('ice'),
  [I.crafting_table]: ['crafting_top', 'crafting_side', 'planks'],
  [I.furnace]: ['furnace_top', 'furnace_side', 'furnace_top'],
  [I.torch]: rep('planks'),
  [I.cobblestone_stairs]: rep('cobble'),
  [I.oak_slab]: rep('planks')
};

function tileOf(name) { return TI[name] ?? TI.stone; }

export async function createAtlas(gl, debugShow = false) {
  const SIZE = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const cctx = cv.getContext('2d');
  const img = cctx.createImageData(SIZE, SIZE);

  TILE_NAMES.forEach((name, t) => {
    const r = rng(7001 + t * 97);
    const painter = (PAINTERS[name] || PAINTERS.stone)(r);
    const f = field(r);
    const tx = (t & 15) * 16, ty = (t >> 4) * 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const c = painter(x, y, f[y * 16 + x]);
        const di = ((ty + y) * SIZE + tx + x) * 4;
        img.data[di] = c[0]; img.data[di + 1] = c[1]; img.data[di + 2] = c[2]; img.data[di + 3] = c[3];
      }
    }
  });
  cctx.putImageData(img, 0, 0);

  // 差し替え用のPNGがあれば、該当タイルの上に描き直す
  const packs = await Promise.all(TILE_NAMES.map(loadPackTile));
  cctx.imageSmoothingEnabled = false;
  packs.forEach((pimg, t) => {
    if (!pimg) return;
    const tx = (t & 15) * 16, ty = (t >> 4) * 16;
    cctx.clearRect(tx, ty, 16, 16);
    cctx.drawImage(pimg, tx, ty, 16, 16);
  });

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // [id][面] -> タイルのUV原点（面: 0..5, 上=2, 下=3）
  const uvTable = new Float32Array(256 * 6 * 2);
  for (let id = 0; id < 256; id++) {
    const names = BLOCK_TILES[id] || BLOCK_TILES[I.stone];
    for (let f = 0; f < 6; f++) {
      const name = f === 2 ? names[0] : f === 3 ? names[2] : names[1];
      const t = tileOf(name);
      uvTable[(id * 6 + f) * 2] = (t & 15) / 16;
      uvTable[(id * 6 + f) * 2 + 1] = (t >> 4) / 16;
    }
  }

  if (debugShow) {
    cv.style.cssText = 'position:fixed;right:8px;top:8px;width:256px;height:256px;z-index:30;border:2px solid #0f0;';
    document.body.appendChild(cv);
  }

  // ホットバー用の等角投影アイコン（上面・左面・右面をアトラスから描く）
  const iconCache = new Map();
  function icon(id) {
    if (iconCache.has(id)) return iconCache.get(id);
    const names = BLOCK_TILES[id] || BLOCK_TILES[I.stone];
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const tileRect = (name) => [(tileOf(name) & 15) * 16, (tileOf(name) >> 4) * 16];
    const isCross = BLOCK_TILES[id] && (id === I.short_grass || id === I.poppy || id === I.dandelion);
    if (isCross) {
      const [sx, sy] = tileRect(names[0]);
      g.drawImage(cv, sx, sy, 16, 16, 2, 2, 28, 28);
    } else {
      const face = (tile, mat, clip, shadeA) => {
        g.save();
        g.beginPath();
        g.moveTo(clip[0][0], clip[0][1]);
        for (const p of clip.slice(1)) g.lineTo(p[0], p[1]);
        g.closePath();
        g.clip();
        g.setTransform(...mat);
        const [sx, sy] = tile;
        g.drawImage(cv, sx, sy, 16, 16, 0, 0, 16, 16);
        g.restore();
        if (shadeA) { g.fillStyle = `rgba(0,0,0,${shadeA})`; g.beginPath(); g.moveTo(clip[0][0], clip[0][1]); for (const p of clip.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); }
      };
      face(tileRect(names[1]), [1, 0.5, 0, 1, 0, 8], [[0, 8], [16, 16], [16, 32], [0, 24]], 0.2);
      face(tileRect(names[1]), [1, -0.5, 0, 1, 16, 16], [[16, 16], [32, 8], [32, 24], [16, 32]], 0.4);
      face(tileRect(names[0]), [1, 0.5, -1, 0.5, 16, 0], [[16, 0], [32, 8], [16, 16], [0, 8]], 0);
    }
    const url = c.toDataURL();
    iconCache.set(id, url);
    return url;
  }

  return { tex, uvTable, icon, canvas: cv, tileIndex: tileOf };
}
