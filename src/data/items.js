import { IDS as I } from './ids.js';
import { BLOCKS } from './blocks.js';

// 道具の素材: tier は blocks.js の tier と対応（木=1, 石=2, 鉄=3）
const MATS = {
  wood: { tier: 1, speed: 2, dur: 59, name: '木の' },
  stone: { tier: 2, speed: 4, dur: 131, name: '石の' },
  iron: { tier: 3, speed: 6, dur: 250, name: '鉄の' }
};
const ATK = {
  sword: { wood: 4, stone: 5, iron: 6 },
  axe: { wood: 3, stone: 4, iron: 5 },
  pickaxe: { wood: 2, stone: 3, iron: 4 },
  shovel: { wood: 2, stone: 3, iron: 4 },
  hoe: { wood: 1, stone: 1, iron: 1 }
};
const KIND_JP = { sword: '剣', axe: '斧', pickaxe: 'ツルハシ', shovel: 'シャベル', hoe: 'クワ' };
const TOOL_IDS = {
  wood: { sword: I.wooden_sword, pickaxe: I.wooden_pickaxe, axe: I.wooden_axe, shovel: I.wooden_shovel, hoe: I.wooden_hoe },
  stone: { sword: I.stone_sword, pickaxe: I.stone_pickaxe, axe: I.stone_axe, shovel: I.stone_shovel, hoe: I.stone_hoe },
  iron: { sword: I.iron_sword, pickaxe: I.iron_pickaxe, axe: I.iron_axe, shovel: I.iron_shovel, hoe: I.iron_hoe }
};

export const ITEMS = {};
function def(id, name, icon, extra = {}) {
  ITEMS[id] = { id, name, icon, stack: 64, ...extra };
}

for (const mat of Object.keys(MATS)) {
  for (const kind of Object.keys(ATK)) {
    const m = MATS[mat];
    def(TOOL_IDS[mat][kind], `${m.name}${KIND_JP[kind]}`, `tool_${kind}_${mat}`, {
      stack: 1,
      tool: { kind, tier: m.tier, speed: m.speed, dur: m.dur },
      atk: ATK[kind][mat]
    });
  }
}

def(I.stick, 'スティック', 'stick');
def(I.coal, '石炭', 'coal');
def(I.feather, '羽根', 'feather');
def(I.leather, '革', 'leather');
def(I.string, '糸', 'string');
def(I.bone, '骨', 'bone');
def(I.gunpowder, '火薬', 'gunpowder');
def(I.iron_ingot, '鉄インゴット', 'iron_ingot');
def(I.raw_iron, '粗い鉄', 'raw_iron');
def(I.arrow, '矢', 'arrow');
// 食べ物: food は空腹の回復量（1 = 半分の骨付き肉）
def(I.apple, 'りんご', 'apple', { food: 4 });
def(I.bread, 'パン', 'bread', { food: 5 });
def(I.raw_beef, '生の牛肉', 'raw_beef', { food: 3 });
def(I.cooked_beef, 'ステーキ', 'cooked_beef', { food: 8 });
def(I.raw_porkchop, '生の豚肉', 'raw_porkchop', { food: 3 });
def(I.cooked_porkchop, '焼き豚', 'cooked_porkchop', { food: 8 });
def(I.raw_chicken, '生の鶏肉', 'raw_chicken', { food: 2 });
def(I.cooked_chicken, '焼き鶏', 'cooked_chicken', { food: 6 });
def(I.rotten_flesh, '腐肉', 'rotten_flesh', { food: 4 });

const BLOCK_JP = {
  grass_block: '草ブロック', dirt: '土', stone: '石', cobblestone: '丸石', sand: '砂', gravel: '砂利',
  sandstone: '砂岩', oak_log: 'オークの原木', oak_planks: 'オークの板材', oak_leaves: 'オークの葉',
  coal_ore: '石炭鉱石', iron_ore: '鉄鉱石', copper_ore: '銅鉱石', gold_ore: '金鉱石', diamond_ore: 'ダイヤモンド鉱石',
  crafting_table: '作業台', furnace: 'かまど', glass: 'ガラス', bricks: 'レンガ', bedrock: '岩盤',
  snow_block: '雪ブロック', cactus: 'サボテン', clay: '粘土', obsidian: '黒曜石', white_wool: '羊毛', ice: '氷'
};

// アイテム情報。ブロックIDはブロック自身がアイテムになる
export function itemInfo(id) {
  if (!id) return null;
  if (ITEMS[id]) return ITEMS[id];
  const b = BLOCKS[id];
  if (!b) return null;
  return { id, name: BLOCK_JP[b.name] || b.name, stack: 64, block: true };
}

export function maxStack(id) {
  const d = itemInfo(id);
  return d ? d.stack : 64;
}

export function isTool(id) { return !!(ITEMS[id] && ITEMS[id].tool); }
export function isFood(id) { return !!(ITEMS[id] && ITEMS[id].food); }
