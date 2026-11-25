// 体力(hp 0..20)・空腹(food 0..20)・飽和度・疲労の管理
export const MAX_HP = 20;
export const MAX_FOOD = 20;

export function createSurvival() {
  return {
    hp: MAX_HP, food: MAX_FOOD, sat: 5, exhaust: 0,
    regenT: 0, starveT: 0, drownT: 0, air: 15,
    invuln: 0, flash: 0, dead: false, cause: ''
  };
}

export function addExhaustion(s, v) {
  s.exhaust += v;
  while (s.exhaust >= 4) {
    s.exhaust -= 4;
    if (s.sat > 0) s.sat = Math.max(0, s.sat - 1);
    else s.food = Math.max(0, s.food - 1);
  }
}

// 0.5秒の無敵時間。戻り値: 実際に減ったか
export function hurt(s, amount, cause = '') {
  if (s.dead || amount <= 0) return false;
  if (s.invuln > 0) return false;
  s.hp = Math.max(0, s.hp - amount);
  s.invuln = 0.5;
  s.flash = 0.35;
  if (s.hp <= 0) { s.dead = true; s.cause = cause; }
  return true;
}

export function eat(s, item) {
  if (s.food >= MAX_FOOD) return false;
  s.food = Math.min(MAX_FOOD, s.food + item.food);
  s.sat = Math.min(s.food, s.sat + item.food * 0.6);
  return true;
}

// 毎フレーム: 自然回復・飢餓・溺水・無敵/フラッシュの減衰
export function tickSurvival(s, dt, { headWater, creative, onDamage }) {
  if (s.dead) return;
  s.invuln = Math.max(0, s.invuln - dt);
  s.flash = Math.max(0, s.flash - dt);
  if (creative) { s.hp = MAX_HP; s.food = MAX_FOOD; s.air = 15; return; }

  // 空腹が満たされていれば約4秒に1回回復し、疲労が溜まる
  if (s.food >= 18 && s.hp < MAX_HP) {
    s.regenT += dt;
    if (s.regenT >= 4) { s.regenT = 0; s.hp = Math.min(MAX_HP, s.hp + 1); addExhaustion(s, 6); }
  } else {
    s.regenT = 0;
  }

  // 食料ゼロは約4秒に1ダメージ
  if (s.food <= 0) {
    s.starveT += dt;
    if (s.starveT >= 4) { s.starveT = 0; hurt(s, 1, 'starve'); }
  } else {
    s.starveT = 0;
  }

  // 水中では空気が減り、0になると約1秒に2ダメージ
  if (headWater) {
    s.air = Math.max(0, s.air - dt);
    if (s.air <= 0) {
      s.drownT += dt;
      if (s.drownT >= 1) { s.drownT = 0; hurt(s, 2, 'drown'); }
    }
  } else {
    s.air = Math.min(15, s.air + dt * 4);
    s.drownT = 0;
  }
  if (s.dead && onDamage) onDamage();
}
