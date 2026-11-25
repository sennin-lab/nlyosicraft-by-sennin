import { CONFIG } from '../config.js';
import { inputState } from '../input.js';

export function buildBugReport(stats) {
  const errs = Array.isArray(window.__errBuf) ? window.__errBuf : [];
  const p = stats.pos;
  const canvas = document.getElementById('glcanvas');
  const cw = canvas ? canvas.width : 0;
  const ch = canvas ? canvas.height : 0;
  const dpr = window.devicePixelRatio || 1;
  const mem = performance.memory
    ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)}MB`
    : 'N/A (Safari)';

  return [
    '=== VOXEL SURVIVAL BUG REPORT ===',
    `Time: ${new Date().toISOString()}`,
    `UA: ${navigator.userAgent}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight} | Canvas: ${cw}x${ch} (scale=${stats.scale.toFixed(2)}, dpr=${dpr})`,
    `Seed: ${stats.seed}`,
    `FPS: ${stats.fps.toFixed(1)} (${stats.frameMs.toFixed(2)}ms)`,
    `Draws: ${stats.draws} | Tris: ${stats.tris} | Chunks: ${stats.chunks}`,
    `Memory: ${mem}`,
    `XYZ: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`,
    `Build: ${CONFIG.WORLD_H}h / sea=${CONFIG.SEA_LEVEL}`,
    '--- ERRORS (__errBuf) ---',
    errs.length ? errs.join('\n') : '(none)',
    '--- RECENT INPUTS (max 30) ---',
    inputState.logs.length ? inputState.logs.join('\n') : '(none)'
  ].join('\n');
}
