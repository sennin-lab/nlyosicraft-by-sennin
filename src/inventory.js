import { maxStack, isTool, itemInfo } from './data/items.js';
import { IDS as I } from './data/ids.js';

// 持ち物: 36 枠（0..8 がホットバー、9..35 が収納）。各枠は {id, n, dmg} | null
export const SLOTS = 36;
export const HOTBAR = 9;

export function createInventory() {
  const slots = new Array(SLOTS).fill(null);
  let creative = false;

  // 同じ種類を既存の枠へ積み、残りを空き枠へ入れる。戻り値: 入らなかった数
  function addTo(arr, id, n = 1, dmg = 0, order = null) {
    const max = maxStack(id);
    const idxs = order || arr.map((_, i) => i);
    let left = n;
    if (max > 1) {
      for (const i of idxs) {
        const s = arr[i];
        if (s && s.id === id && s.n < max) {
          const mv = Math.min(max - s.n, left);
          s.n += mv; left -= mv;
          if (left <= 0) return 0;
        }
      }
    }
    for (const i of idxs) {
      if (!arr[i]) {
        const mv = Math.min(max, left);
        arr[i] = { id, n: mv, dmg };
        left -= mv;
        if (left <= 0) return 0;
      }
    }
    return left;
  }

  // 枠をクリックしたときの動作（手に持つ → 置く → 重ねる/入れ替え）
  function clickSlot(arr, i, cur) {
    const s = arr[i], c = cur.s;
    if (!c) { if (s) { cur.s = s; arr[i] = null; } return; }
    if (!s) { arr[i] = c; cur.s = null; return; }
    if (s.id === c.id && !isTool(c.id) && s.n < maxStack(c.id)) {
      const mv = Math.min(maxStack(c.id) - s.n, c.n);
      s.n += mv; c.n -= mv;
      if (c.n <= 0) cur.s = null;
      return;
    }
    arr[i] = c; cur.s = s;
  }

  return {
    slots,
    get creative() { return creative; },
    setCreative(v) { creative = !!v; },
    add(id, n = 1, dmg = 0) { return addTo(slots, id, n, dmg); },
    addTo,
    clickSlot,
    count(id) {
      let c = 0;
      for (const s of slots) if (s && s.id === id) c += s.n;
      return c;
    },
    // 1個使う（クリエイティブでは減らない）。成功したら true
    take(id) {
      if (creative) return true;
      for (let i = 0; i < HOTBAR; i++) {
        const s = slots[i];
        if (s && s.id === id) { s.n -= 1; if (s.n <= 0) slots[i] = null; return true; }
      }
      for (let i = HOTBAR; i < SLOTS; i++) {
        const s = slots[i];
        if (s && s.id === id) { s.n -= 1; if (s.n <= 0) slots[i] = null; return true; }
      }
      return false;
    },
    // ホットバー（選択枠）の道具を消耗させる
    damageTool(i, amount = 1) {
      const s = slots[i];
      const info = s && itemInfo(s.id);
      if (!info || !info.tool) return;
      s.dmg = (s.dmg || 0) + amount;
      if (s.dmg >= info.tool.dur) slots[i] = null;
    }
  };
}

