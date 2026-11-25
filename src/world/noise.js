// 決定論的ノイズ: 同じシードなら常に同じ地形になる
function hash2(x, z, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function hash3(x, y, z, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 2246822519) ^ Math.imul(z, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export function vnoise2(x, z, s) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(z - zi);
  const a = hash2(xi, zi, s), b = hash2(xi + 1, zi, s);
  const c = hash2(xi, zi + 1, s), d = hash2(xi + 1, zi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

// 戻り値は概ね -1..1
export function fbm2(x, z, s, octaves) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += (vnoise2(x * freq, z * freq, s + i * 131) * 2 - 1) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// 戻り値は 0..1
export function vnoise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  const c00 = lerp(hash3(xi, yi, zi, s), hash3(xi + 1, yi, zi, s), u);
  const c10 = lerp(hash3(xi, yi + 1, zi, s), hash3(xi + 1, yi + 1, zi, s), u);
  const c01 = lerp(hash3(xi, yi, zi + 1, s), hash3(xi + 1, yi, zi + 1, s), u);
  const c11 = lerp(hash3(xi, yi + 1, zi + 1, s), hash3(xi + 1, yi + 1, zi + 1, s), u);
  return lerp(lerp(c00, c10, v), lerp(c01, c11, v), w);
}
