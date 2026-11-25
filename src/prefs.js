import { CONFIG } from './config.js';

// 描画距離（チャンク数）の設定。端末ごとの既定値は main.js 側で渡す
const KEY = 'nlyo.renderDist';
const OPTS = CONFIG.RENDER_DIST_OPTIONS;

export function loadRD(fallback) {
  try {
    const v = Number(localStorage.getItem(KEY));
    if (OPTS.includes(v)) return v;
  } catch (_) { /* 保存できない環境では既定値 */ }
  return fallback;
}

export function saveRD(v) {
  try { localStorage.setItem(KEY, String(v)); } catch (_) { /* 無視 */ }
}

export function nextRD(v) {
  const i = OPTS.indexOf(v);
  return OPTS[(i + 1) % OPTS.length];
}
