import { IDS as I } from './data/ids.js';

// ホットバー9スロットの中身（ブロックID）
export const HOTBAR_IDS = [
  I.grass_block, I.dirt, I.stone, I.cobblestone, I.oak_planks,
  I.oak_log, I.oak_leaves, I.glass, I.bricks
];

export function createInventory() {
  const counts = new Map(HOTBAR_IDS.map((id) => [id, 64]));
  let creative = false;
  return {
    get creative() { return creative; },
    setCreative(v) { creative = !!v; },
    count(id) { return counts.get(id) || 0; },
    // 掘ったブロックはホットバーに入っている種類だけ回収する
    add(id) {
      if (!counts.has(id)) return;
      counts.set(id, Math.min(999, counts.get(id) + 1));
    },
    take(id) {
      if (creative) return true;
      const n = counts.get(id) || 0;
      if (n <= 0) return false;
      counts.set(id, n - 1);
      return true;
    }
  };
}
