import { RECIPES } from './data/recipes.js';

// グリッド（ID の 2D 配列）を最小の矩形に切り詰めて文字列化する
function normalize(rows) {
  let r0 = Infinity, r1 = -1, c0 = Infinity, c1 = -1;
  rows.forEach((row, r) => row.forEach((id, c) => {
    if (!id) return;
    r0 = Math.min(r0, r); r1 = Math.max(r1, r);
    c0 = Math.min(c0, c); c1 = Math.max(c1, c);
  }));
  if (r1 < 0) return '';
  const out = [];
  for (let r = r0; r <= r1; r++) {
    const line = [];
    for (let c = c0; c <= c1; c++) line.push(rows[r][c] || 0);
    out.push(line.join(','));
  }
  return out.join('|');
}

function patternRows(recipe) {
  return recipe.shape.map((line) => [...line].map((ch) => (ch === ' ' ? 0 : recipe.key[ch])));
}

const COMPILED = RECIPES.map((r) => {
  if (r.shapeless) {
    return { recipe: r, sorted: [...r.shapeless].sort((a, b) => a - b).join(',') };
  }
  const rows = patternRows(r);
  const mirror = rows.map((row) => [...row].reverse());
  return { recipe: r, keys: [normalize(rows), normalize(mirror)] };
});

// grid: 2x2 か 3x3 のスロット配列（{id,n}|null）。一致したら {id, n} を返す
export function matchCraft(grid, size) {
  const rows = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) row.push(grid[r * size + c] ? grid[r * size + c].id : 0);
    rows.push(row);
  }
  const flat = rows.flat().filter(Boolean);
  if (!flat.length) return null;
  const key = normalize(rows);
  const sorted = [...flat].sort((a, b) => a - b).join(',');
  for (const c of COMPILED) {
    const ok = c.recipe.shapeless ? c.sorted === sorted : c.keys.includes(key);
    if (ok) return { id: c.recipe.out[0], n: c.recipe.out[1] };
  }
  return null;
}

// 完成時: 使った材料を1つずつ減らす（空になったスロットは null）
export function consumeCraft(grid) {
  for (let i = 0; i < grid.length; i++) {
    const s = grid[i];
    if (!s) continue;
    s.n -= 1;
    if (s.n <= 0) grid[i] = null;
  }
}
