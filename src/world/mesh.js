import { BLOCKS } from '../data/blocks.js';

// 面: 0:+X 1:-X 2:+Y(上) 3:-Y(下) 4:+Z 5:-Z
const AX = [0, 0, 1, 1, 2, 2];
const SG = [1, -1, 1, -1, 1, -1];
const CORN = [[0, 0], [1, 0], [1, 1], [0, 1]];
const AO = [0.5, 0.67, 0.83, 1.0];
const TS = 1 / 16, EPS = 0.002;

const OPAQUE = new Uint8Array(256);
for (let i = 0; i < 256; i++) if (BLOCKS[i] && BLOCKS[i].isOpaque) OPAQUE[i] = 1;

// パディング済み配列(18^3)のインデックス。座標は -1..16
const P = (x, y, z) => ((y + 1) * 18 + (z + 1)) * 18 + (x + 1);

const mk = () => ({ pos: [], nor: [], dat: [] });

function pushV(B, x, y, z, nx, ny, nz, u, v, shade, alpha) {
  B.pos.push(x, y, z);
  B.nor.push(nx, ny, nz);
  B.dat.push(u, v, shade, alpha);
}

// 上空が開けているかで明るさを決める（地下は暗く）
function skyLight(hpad, lx, ly, lz, oy) {
  const top = hpad[(lz + 1) * 18 + (lx + 1)];
  return oy + ly > top ? 1.0 : 0.6;
}

function emitFace(B, pad, hpad, lx, ly, lz, ox, oy, oz, f, uv, id, alpha) {
  const a = AX[f], s = SG[f];
  const t1 = (a + 1) % 3, t2 = (a + 2) % 3;
  const q = [lx, ly, lz];
  q[a] += s;
  const light = skyLight(hpad, q[0], q[1], q[2], oy);
  const base = [ox + lx, oy + ly, oz + lz];
  const ti = (id * 6 + f) * 2;
  const u0 = uv[ti], v0 = uv[ti + 1];

  const pos = [], uvs = [], ao = [];
  for (let k = 0; k < 4; k++) {
    const c1 = CORN[k][0], c2 = CORN[k][1];
    const p = base.slice();
    p[a] += s > 0 ? 1 : 0;
    p[t1] += c1;
    p[t2] += c2;

    // 頂点AO: 面の外側にある3ブロックの遮蔽数から算出
    const d1 = c1 ? 1 : -1, d2 = c2 ? 1 : -1;
    const s1 = q.slice(); s1[t1] += d1;
    const s2 = q.slice(); s2[t2] += d2;
    const sc = q.slice(); sc[t1] += d1; sc[t2] += d2;
    const o1 = OPAQUE[pad[P(s1[0], s1[1], s1[2])]];
    const o2 = OPAQUE[pad[P(s2[0], s2[1], s2[2])]];
    const oc = OPAQUE[pad[P(sc[0], sc[1], sc[2])]];
    const aoV = (o1 && o2) ? 0 : 3 - (o1 + o2 + oc);
    ao.push(AO[aoV] * light);
    pos.push(p);

    let uu, vv;
    if (a === 1) { uu = c2; vv = c1; }
    else if (a === 0) { uu = c2; vv = 1 - c1; }
    else { uu = c1; vv = 1 - c2; }
    uvs.push([u0 + EPS + uu * (TS - 2 * EPS), v0 + EPS + vv * (TS - 2 * EPS)]);
  }

  // 外向きに反時計回りになる順序
  const order = s > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
  const n = [0, 0, 0];
  n[a] = s;
  // AOの見栄えが良い方の対角線で分割
  const flip = ao[order[0]] + ao[order[2]] > ao[order[1]] + ao[order[3]];
  const tris = flip ? [[1, 2, 3], [1, 3, 0]] : [[0, 1, 2], [0, 2, 3]];
  for (const tri of tris) {
    for (const k of tri) {
      const i = order[k];
      pushV(B, pos[i][0], pos[i][1], pos[i][2], n[0], n[1], n[2], uvs[i][0], uvs[i][1], ao[i], alpha);
    }
  }
}

// 草・花などのクロス形状（両面描画）
function emitCross(B, x, y, z, uv, id, light) {
  const ti = (id * 6 + 1) * 2;
  const u0 = uv[ti], v0 = uv[ti + 1];
  const L = u0 + EPS, R = u0 + TS - EPS, T = v0 + EPS, Bm = v0 + TS - EPS;
  const quads = [
    [[x + 0.15, y, z + 0.15], [x + 0.85, y, z + 0.85], [x + 0.85, y + 1, z + 0.85], [x + 0.15, y + 1, z + 0.15]],
    [[x + 0.15, y, z + 0.85], [x + 0.85, y, z + 0.15], [x + 0.85, y + 1, z + 0.15], [x + 0.15, y + 1, z + 0.85]]
  ];
  const uvq = [[L, Bm], [R, Bm], [R, T], [L, T]];
  for (const q of quads) {
    const seq = [[0, 1, 2], [0, 2, 3]];
    for (const t of seq) for (const k of t) pushV(B, q[k][0], q[k][1], q[k][2], 0, 1, 0, uvq[k][0], uvq[k][1], light, 1);
    for (const t of [[0, 2, 1], [0, 3, 2]]) for (const k of t) pushV(B, q[k][0], q[k][1], q[k][2], 0, 1, 0, uvq[k][0], uvq[k][1], light, 1);
  }
}


// 箱状の形（松明の棒・ハーフブロック・階段）。セル内座標の箱の組
const BOX_SHAPES = {
  torch: [[0.4, 0, 0.4, 0.6, 0.75, 0.6]],
  slab: [[0, 0, 0, 1, 0.5, 1]],
  stairs: [[0, 0, 0, 1, 0.5, 1], [0, 0.5, 0.5, 1, 1, 1]]
};

// 箱の1面を描く（頂点順・UVの取り方は emitFace と同じ）。隣が不透明な境界面は呼び出し側で省く
function emitBoxFace(B, b, f, base, uv, id, light, alpha) {
  const a = AX[f], s = SG[f];
  const t1 = (a + 1) % 3, t2 = (a + 2) % 3;
  const ti = (id * 6 + f) * 2;
  const u0 = uv[ti], v0 = uv[ti + 1];
  const pos = [], uvs = [];
  for (let k = 0; k < 4; k++) {
    const c1 = CORN[k][0], c2 = CORN[k][1];
    const p = base.slice();
    p[a] += s > 0 ? b[a + 3] : b[a];
    p[t1] += b[t1] + c1 * (b[t1 + 3] - b[t1]);
    p[t2] += b[t2] + c2 * (b[t2 + 3] - b[t2]);
    pos.push(p);
    let uu, vv;
    if (a === 1) { uu = c2; vv = c1; }
    else if (a === 0) { uu = c2; vv = 1 - c1; }
    else { uu = c1; vv = 1 - c2; }
    uvs.push([u0 + EPS + uu * (TS - 2 * EPS), v0 + EPS + vv * (TS - 2 * EPS)]);
  }
  const order = s > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
  const n = [0, 0, 0];
  n[a] = s;
  for (const tri of [[0, 1, 2], [0, 2, 3]]) {
    for (const k of tri) {
      const i = order[k];
      pushV(B, pos[i][0], pos[i][1], pos[i][2], n[0], n[1], n[2], uvs[i][0], uvs[i][1], light, alpha);
    }
  }
}

function emitBoxes(B, pad, lx, ly, lz, ox, oy, oz, boxes, uv, id, light, alpha) {
  const base = [ox + lx, oy + ly, oz + lz];
  for (const b of boxes) {
    for (let f = 0; f < 6; f++) {
      const a = AX[f], s = SG[f];
      const atEdge = s > 0 ? b[a + 3] >= 1 : b[a] <= 0;
      if (atEdge) {
        const nid = pad[P(lx + (a === 0 ? s : 0), ly + (a === 1 ? s : 0), lz + (a === 2 ? s : 0))];
        if (OPAQUE[nid]) continue;
      }
      emitBoxFace(B, b, f, base, uv, id, light, alpha);
    }
  }
}

// pad: 18^3の隣接込みブロックID, hpad: 18^2の列の最上段, uv: アトラスのUV表
export function buildSection(pad, hpad, ox, oy, oz, uv) {
  const out = { opaque: mk(), cutout: mk(), trans: mk() };
  let any = false;
  for (let ly = 0; ly < 16; ly++) {
    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const id = pad[P(lx, ly, lz)];
        if (id === 0) continue;
        const def = BLOCKS[id];
        if (!def) continue;
        const B = def.trans === 'trans' ? out.trans : def.trans === 'cutout' ? out.cutout : out.opaque;
        any = true;

        if (BOX_SHAPES[def.shape]) {
          const alpha = def.trans === 'trans' ? 0.8 : 1.0;
          emitBoxes(B, pad, lx, ly, lz, ox, oy, oz, BOX_SHAPES[def.shape], uv, id,
            skyLight(hpad, lx, ly, lz, oy), alpha);
          continue;
        }
        if (def.shape === 'cross') {
          emitCross(B, ox + lx, oy + ly, oz + lz, uv, id, skyLight(hpad, lx, ly, lz, oy));
          continue;
        }
        for (let f = 0; f < 6; f++) {
          const a = AX[f], s = SG[f];
          const nid = pad[P(lx + (a === 0 ? s : 0), ly + (a === 1 ? s : 0), lz + (a === 2 ? s : 0))];
          if (OPAQUE[nid]) continue;
          if (nid === id && def.trans !== 'false') continue;
          emitFace(B, pad, hpad, lx, ly, lz, ox, oy, oz, f, uv, id, def.trans === 'trans' ? 0.8 : 1.0);
        }
      }
    }
  }
  return any ? out : null;
}
