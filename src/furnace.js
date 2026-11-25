import { SMELT, FUEL } from './data/recipes.js';

const furnaces = new Map();
const keyOf = (x, y, z) => `${x},${y},${z}`;

export function getFurnace(x, y, z) {
  const k = keyOf(x, y, z);
  if (!furnaces.has(k)) {
    furnaces.set(k, { input: null, fuel: null, output: null, burn: 0, burnMax: 0, progress: 0 });
  }
  return furnaces.get(k);
}

// 壊されたかまど: 中身を返して記録を消す
export function removeFurnace(x, y, z) {
  const k = keyOf(x, y, z);
  const f = furnaces.get(k);
  furnaces.delete(k);
  if (!f) return [];
  return [f.input, f.fuel, f.output].filter(Boolean);
}

function canAccept(f, outId) {
  return !f.output || (f.output.id === outId && f.output.n < 64);
}

// 燃焼と精錬を進める（燃料が切れたら次の燃料を自動で入れる）
export function tickFurnaces(dt) {
  for (const f of furnaces.values()) {
    if (f.burn > 0) f.burn = Math.max(0, f.burn - dt);
    const rec = f.input ? SMELT[f.input.id] : null;
    if (f.burn <= 0 && rec && f.fuel && FUEL[f.fuel.id] && canAccept(f, rec.out)) {
      f.burnMax = FUEL[f.fuel.id];
      f.burn = f.burnMax;
      f.fuel.n -= 1;
      if (f.fuel.n <= 0) f.fuel = null;
    }
    if (f.burn > 0 && rec && canAccept(f, rec.out)) {
      f.progress += dt;
      if (f.progress >= rec.time) {
        f.progress = 0;
        if (f.output) f.output.n += 1;
        else f.output = { id: rec.out, n: 1 };
        f.input.n -= 1;
        if (f.input.n <= 0) f.input = null;
      }
    } else {
      f.progress = Math.max(0, f.progress - dt * 2);
    }
  }
}

export function furnaceBurnFraction(f) {
  return f.burnMax > 0 ? f.burn / f.burnMax : 0;
}
