import { CONFIG } from '../config.js';

const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7]
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

  // ワールド座標 → 画面座標（背後なら null）
  function project(vp, x, y, z) {
    const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
    const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
    const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (cw <= 0.01) return null;
    return [(cx / cw * 0.5 + 0.5) * cssW, (1 - (cy / cw * 0.5 + 0.5)) * cssH];
  }

  function render({ vp, target, progress }) {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const cx = Math.round(cssW / 2), cy = Math.round(cssH / 2);

    // 照準（黒縁付きの白十字）
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - 8, cy - 2, 16, 4);
    ctx.fillRect(cx - 2, cy - 8, 4, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 7, cy - 1, 14, 2);
    ctx.fillRect(cx - 1, cy - 7, 2, 14);

    // 狙っているブロックの輪郭
    if (target && vp) {
      const corners = [];
      for (let i = 0; i < 8; i++) {
        const x = target.x + (i & 1), y = target.y + ((i >> 1) & 1), z = target.z + ((i >> 2) & 1);
        corners.push(project(vp, x, y, z));
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

    // 採掘の進捗リング
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
  }

  return { render, resize };
}
