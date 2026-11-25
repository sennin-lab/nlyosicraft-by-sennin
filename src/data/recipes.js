import { IDS as I } from './ids.js';

// shape: 行の配列（空白は空マス）、key: 記号→アイテムID、shapeless: 材料の多重集合
// 2x2（持ち物）でも作れるレシピは、3x3（作業台）でも同じ形で作れる
export const RECIPES = [
  { out: [I.oak_planks, 4], shapeless: [I.oak_log] },
  { out: [I.stick, 4], shape: ['P', 'P'], key: { P: I.oak_planks } },
  { out: [I.crafting_table, 1], shape: ['PP', 'PP'], key: { P: I.oak_planks } },
  { out: [I.furnace, 1], shape: ['CCC', 'C C', 'CCC'], key: { C: I.cobblestone } },
  { out: [I.wooden_pickaxe, 1], shape: ['PPP', ' S ', ' S '], key: { P: I.oak_planks, S: I.stick } },
  { out: [I.wooden_axe, 1], shape: ['PP', 'PS', ' S'], key: { P: I.oak_planks, S: I.stick } },
  { out: [I.wooden_shovel, 1], shape: ['P', 'S', 'S'], key: { P: I.oak_planks, S: I.stick } },
  { out: [I.wooden_sword, 1], shape: ['P', 'P', 'S'], key: { P: I.oak_planks, S: I.stick } },
  { out: [I.wooden_hoe, 1], shape: ['PP', ' S', ' S'], key: { P: I.oak_planks, S: I.stick } },
  { out: [I.stone_pickaxe, 1], shape: ['CCC', ' S ', ' S '], key: { C: I.cobblestone, S: I.stick } },
  { out: [I.stone_axe, 1], shape: ['CC', 'CS', ' S'], key: { C: I.cobblestone, S: I.stick } },
  { out: [I.stone_shovel, 1], shape: ['C', 'S', 'S'], key: { C: I.cobblestone, S: I.stick } },
  { out: [I.stone_sword, 1], shape: ['C', 'C', 'S'], key: { C: I.cobblestone, S: I.stick } },
  { out: [I.stone_hoe, 1], shape: ['CC', ' S', ' S'], key: { C: I.cobblestone, S: I.stick } },
  { out: [I.iron_pickaxe, 1], shape: ['III', ' S ', ' S '], key: { I: I.iron_ingot, S: I.stick } },
  { out: [I.iron_axe, 1], shape: ['II', 'IS', ' S'], key: { I: I.iron_ingot, S: I.stick } },
  { out: [I.iron_shovel, 1], shape: ['I', 'S', 'S'], key: { I: I.iron_ingot, S: I.stick } },
  { out: [I.iron_sword, 1], shape: ['I', 'I', 'S'], key: { I: I.iron_ingot, S: I.stick } },
  { out: [I.iron_hoe, 1], shape: ['II', ' S', ' S'], key: { I: I.iron_ingot, S: I.stick } },
  { out: [I.arrow, 4], shape: ['F', 'S', 'B'], key: { F: I.feather, S: I.stick, B: I.iron_ingot } },
  { out: [I.torch, 4], shape: ['C', 'S'], key: { C: I.coal, S: I.stick } },
  { out: [I.cobblestone_stairs, 4], shape: ['C  ', 'CC ', 'CCC'], key: { C: I.cobblestone } },
  { out: [I.oak_slab, 6], shape: ['PPP'], key: { P: I.oak_planks } }
];

// かまどの精錬（入力 → 出力、秒）
export const SMELT = {
  [I.raw_iron]: { out: I.iron_ingot, time: 10 },
  [I.raw_beef]: { out: I.cooked_beef, time: 10 },
  [I.raw_porkchop]: { out: I.cooked_porkchop, time: 10 },
  [I.raw_chicken]: { out: I.cooked_chicken, time: 10 },
  [I.cobblestone]: { out: I.stone, time: 10 },
  [I.sand]: { out: I.glass, time: 10 }
};

// 燃料の燃焼時間（秒）
export const FUEL = {
  [I.coal]: 80,
  [I.oak_log]: 15,
  [I.oak_planks]: 15,
  [I.stick]: 5
};
