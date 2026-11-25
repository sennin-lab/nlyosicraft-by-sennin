// 昼夜サイクル（1周 480 秒）。daylight: 0=夜 1=昼
const CYCLE = 480;

export function createClock(startT = 0.2) {
  let t = startT;
  const smooth = (a, b, x) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  return {
    tick(dt) { t = (t + dt / CYCLE) % 1; },
    setTime(v) { t = ((v % 1) + 1) % 1; },
    get t() { return t; },
    get daylight() { return smooth(-0.25, 0.25, Math.sin(2 * Math.PI * t)); },
    get isNight() { return this.daylight < 0.35; }
  };
}
