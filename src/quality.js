// 画質設定（描画解像度の倍率）。標準=1.0、高=2.0（縦横2倍）、低=0.6、自動=fpsに応じて0.5〜1.0
const KEY = 'nlyo.quality';
const ORDER = ['std', 'high', 'low', 'auto'];
const LABEL = { std: '標準', high: '高（2倍）', low: '低', auto: '自動' };
export const QUALITY_SCALE = { std: 1.0, high: 2.0, low: 0.6, auto: 1.0 };

export function loadQuality() {
  try {
    const v = localStorage.getItem(KEY);
    if (ORDER.includes(v)) return v;
  } catch (_) { /* 保存できない環境では標準のまま */ }
  return 'std';
}

export function saveQuality(q) {
  try { localStorage.setItem(KEY, q); } catch (_) { /* 無視 */ }
}

export function nextQuality(q) {
  return ORDER[(ORDER.indexOf(q) + 1) % ORDER.length];
}

export function qualityLabel(q) {
  return LABEL[q] || LABEL.std;
}
