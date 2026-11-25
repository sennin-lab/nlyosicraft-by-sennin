import { CONFIG } from '../config.js';

const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

// 9x9 のハート（X が描画点）
const HEART = [
  '..XX.XX..',
  '.XXXXXXX.',
  'XXXXXXXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '...XXX...',
  '....X....'
];

export function createHUD(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  let dpr = 1, cssW = 1, cssH = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    if (canvasEl.width !== w || canvasEl.height !== h) {
      canvasEl.width = w;
      canvasEl.height = h;
    }
  }

  function project(vp, x, y, z) {
    const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
    const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
    const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (cw <= 0.01) return null;
    return [(cx / cw * 0.5 + 0.5) * cssW, (1 - (cy / cw * 0.5 + 0.5)) * cssH];
  }

  // 半分単位（value は 0..max の整数）でハート/肉を描く
  function drawRow(x0, y0, value, color, bg, kind) {
    const S = 2;
    for (let i = 0; i < 10; i++) {
      const v = value - i * 2;
      const x = x0 + i * 9 * S + i * 2;
      const rows = HEART;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (rows[r][c] !== 'X') continue;
          if (kind === 'food') {
            const ok = v >= 2 || (v === 1 && c < 5);
            ctx.fillStyle = ok ? color : bg;
          } else {
            const ok = v >= 2 || (v === 1 && c < 5);
            ctx.fillStyle = ok ? color : bg;
          }
          ctx.fillRect(x + c * S, y0 + r * S, S, S);
        }
      }
    }
  }

  function drawBubbles(x0, y0, air) {
    const n = Math.ceil((air / 15) * 10);
    for (let i = 0; i < 10; i++) {
      if (i >= n) continue;
      ctx.fillStyle = 'rgba(150,220,255,0.9)';
      ctx.fillRect(x0 + i * 19, y0, 14, 14);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x0 + i * 19 + 3, y0 + 3, 4, 4);
    }
  }

  function render({ vp, target, progress, hp, food, air, hotbarRect }) {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const cx = Math.round(cssW / 2), cy = Math.round(cssH / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - 8, cy - 2, 16, 4);
    ctx.fillRect(cx - 2, cy - 8, 4, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 7, cy - 1, 14, 2);
    ctx.fillRect(cx - 1, cy - 7, 2, 14);

    if (target && vp) {
      const corners = [];
      for (let i = 0; i < 8; i++) {
        corners.push(project(vp, target.x + (i & 1), target.y + ((i >> 1) & 1), target.z + ((i >> 2) & 1)));
      }
      if (corners.every(Boolean)) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        for (const [a, b] of EDGES) {
          ctx.moveTo(corners[a][0], corners[a][1]);
          ctx.lineTo(corners[b][0], corners[b][1]);
        }
        ctx.stroke();
      }
    }

    if (progress > 0) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress));
      ctx.stroke();
    }

    // 体力（左）と空腹（右）をホットバーの上に並べる
    if (hotbarRect && hp !== undefined) {
      const y = hotbarRect.top - 22;
      const barW = 10 * 18 + 9 * 2;
      if (air < 15) drawBubbles(hotbarRect.left, y - 20, air);
      drawRow(hotbarRect.left, y, hp, '#d62a2a', '#3a0d0d', 'hp');
      drawRow(hotbarRect.right - barW, y, food, '#b8702e', '#3a2410', 'food');
    }
  }

  return { render, resize };
}
