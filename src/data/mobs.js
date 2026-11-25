import { IDS as I } from './ids.js';

// hostile: 夜に湧く敵 / passive: 昼に草原で湧く動物
// drops: [アイテムID, 最小, 最大]
export const MOBS = {
  zombie: { name: 'ゾンビ', hostile: true, hp: 20, speed: 2.3, w: 0.6, h: 1.95, dmg: 3, reach: 2.0, cd: 1.0, burns: true, drops: [[I.rotten_flesh, 0, 2]] },
  skeleton: { name: 'スケルトン', hostile: true, hp: 20, speed: 2.0, w: 0.6, h: 1.99, ranged: true, burns: true, drops: [[I.bone, 0, 2], [I.arrow, 0, 2]] },
  creeper: { name: 'クリーパー', hostile: true, hp: 20, speed: 2.2, w: 0.6, h: 1.7, fuse: 1.5, radius: 3, drops: [[I.gunpowder, 0, 2]] },
  spider: { name: 'クモ', hostile: true, hp: 16, speed: 3.0, w: 1.2, h: 0.9, dmg: 2, reach: 1.5, cd: 1.0, drops: [[I.string, 0, 2]] },
  pig: { name: 'ブタ', hostile: false, hp: 10, speed: 1.2, w: 0.9, h: 0.9, drops: [[I.raw_porkchop, 1, 3]] },
  cow: { name: 'ウシ', hostile: false, hp: 10, speed: 1.2, w: 0.9, h: 1.4, drops: [[I.raw_beef, 1, 3], [I.leather, 0, 2]] },
  chicken: { name: 'ニワトリ', hostile: false, hp: 4, speed: 1.2, w: 0.4, h: 0.7, drops: [[I.raw_chicken, 1, 1], [I.feather, 0, 2]] }
};

// 見た目: 箱の組み合わせ（単位はブロック）。pivot を中心に swing 方向へ揺れる
const H = (skin, shirt, pants, extra = {}) => ({
  parts: [
    { pivot: [-0.125, 0.75, 0], box: [-0.25, 0, -0.125, 0, 0.75, 0.125], color: pants, swing: 1 },
    { pivot: [0.125, 0.75, 0], box: [0, 0, -0.125, 0.25, 0.75, 0.125], color: pants, swing: -1 },
    { pivot: [0, 0, 0], box: [-0.25, 0.75, -0.125, 0.25, 1.5, 0.125], color: shirt },
    { pivot: [-0.375, 1.5, 0], box: [-0.5, 0.75, -0.125, -0.25, 1.5, 0.125], color: extra.armColor || skin, swing: -1, base: extra.armBase || 0 },
    { pivot: [0.375, 1.5, 0], box: [0.25, 0.75, -0.125, 0.5, 1.5, 0.125], color: extra.armColor || skin, swing: 1, base: extra.armBase || 0 },
    { pivot: [0, 1.5, 0], box: [-0.25, 1.5, -0.25, 0.25, 2.0, 0.25], color: skin },
    { pivot: [0, 0, 0], box: [-0.16, 1.66, -0.26, -0.06, 1.78, -0.25], color: '#1a1a1a' },
    { pivot: [0, 0, 0], box: [0.06, 1.66, -0.26, 0.16, 1.78, -0.25], color: '#1a1a1a' }
  ]
});

export const MOB_MODELS = {
  zombie: H('#5f9e4e', '#3b8ea5', '#2c4f8a'),
  skeleton: H('#d6d6d6', '#d6d6d6', '#c4c4c4', { armColor: '#c4c4c4' }),
  creeper: {
    parts: [
      { pivot: [0, 0, 0], box: [-0.25, 0.6, -0.125, 0.25, 1.25, 0.125], color: '#4caf3a' },
      { pivot: [0, 0, 0], box: [-0.25, 1.25, -0.25, 0.25, 1.75, 0.25], color: '#55c042' },
      { pivot: [0, 0, 0], box: [-0.15, 1.45, -0.26, -0.05, 1.6, -0.25], color: '#1a1a1a' },
      { pivot: [0, 0, 0], box: [0.05, 1.45, -0.26, 0.15, 1.6, -0.25], color: '#1a1a1a' },
      { pivot: [-0.12, 0.6, 0], box: [-0.25, 0, -0.1, -0.0, 0.6, 0.1], color: '#2f6e28', swing: 1 },
      { pivot: [0.12, 0.6, 0], box: [0, 0, -0.1, 0.25, 0.6, 0.1], color: '#2f6e28', swing: -1 }
    ]
  },
  spider: {
    parts: [
      { pivot: [0, 0, 0], box: [-0.45, 0.35, -0.4, 0.45, 0.9, 0.1], color: '#2b2b2b' },
      { pivot: [0, 0, 0], box: [-0.25, 0.35, 0.1, 0.25, 0.8, 0.5], color: '#1e1e1e' },
      { pivot: [0, 0, 0], box: [-0.14, 0.55, 0.5, -0.06, 0.65, 0.51], color: '#c81e1e' },
      { pivot: [0, 0, 0], box: [0.06, 0.55, 0.5, 0.14, 0.65, 0.51], color: '#c81e1e' },
      ...[-0.2, 0, 0.2].flatMap((z, k) => [
        { pivot: [0.25, 0.5, z], box: [0.25, 0.4, z - 0.03, 0.95, 0.56, z + 0.03], color: '#2b2b2b', swing: k % 2 ? 1 : -1 },
        { pivot: [-0.25, 0.5, z], box: [-0.95, 0.4, z - 0.03, -0.25, 0.56, z + 0.03], color: '#2b2b2b', swing: k % 2 ? -1 : 1 }
      ])
    ]
  },
  pig: {
    parts: [
      { pivot: [0, 0, 0], box: [-0.45, 0.4, -0.6, 0.45, 1.0, 0.6], color: '#eba0a4' },
      { pivot: [0, 0, 0], box: [-0.3, 0.5, -0.9, 0.3, 1.1, -0.6], color: '#eba0a4' },
      { pivot: [0, 0, 0], box: [-0.12, 0.6, -0.95, 0.12, 0.8, -0.9], color: '#c77a80' },
      { pivot: [-0.3, 0.4, -0.35], box: [-0.4, 0, -0.42, -0.2, 0.4, -0.28], color: '#dd8f94', swing: 1 },
      { pivot: [0.3, 0.4, -0.35], box: [0.2, 0, -0.42, 0.4, 0.4, -0.28], color: '#dd8f94', swing: -1 },
      { pivot: [-0.3, 0.4, 0.35], box: [-0.4, 0, 0.28, -0.2, 0.4, 0.42], color: '#dd8f94', swing: -1 },
      { pivot: [0.3, 0.4, 0.35], box: [0.2, 0, 0.28, 0.4, 0.4, 0.42], color: '#dd8f94', swing: 1 }
    ]
  },
  cow: {
    parts: [
      { pivot: [0, 0, 0], box: [-0.45, 0.8, -0.8, 0.45, 1.6, 0.8], color: '#f2f2f2' },
      { pivot: [0, 0, 0], box: [-0.2, 1.0, -0.6, 0.3, 1.5, -0.2], color: '#4b3420' },
      { pivot: [0, 0, 0], box: [-0.25, 1.0, -1.1, 0.25, 1.6, -0.8], color: '#f2f2f2' },
      { pivot: [0, 0, 0], box: [-0.25, 1.5, -1.15, 0.25, 1.6, -0.75], color: '#4b3420' },
      { pivot: [-0.3, 0.8, -0.5], box: [-0.4, 0, -0.6, -0.15, 0.8, -0.4], color: '#e6e6e6', swing: 1 },
      { pivot: [0.3, 0.8, -0.5], box: [0.15, 0, -0.6, 0.4, 0.8, -0.4], color: '#e6e6e6', swing: -1 },
      { pivot: [-0.3, 0.8, 0.5], box: [-0.4, 0, 0.4, -0.15, 0.8, 0.6], color: '#4b3420', swing: -1 },
      { pivot: [0.3, 0.8, 0.5], box: [0.15, 0, 0.4, 0.4, 0.8, 0.6], color: '#4b3420', swing: 1 }
    ]
  },
  chicken: {
    parts: [
      { pivot: [0, 0, 0], box: [-0.2, 0.35, -0.25, 0.2, 0.8, 0.25], color: '#f4f4f4' },
      { pivot: [0, 0, 0], box: [-0.15, 0.7, -0.3, 0.15, 1.0, -0.1], color: '#f4f4f4' },
      { pivot: [0, 0, 0], box: [-0.05, 0.75, -0.36, 0.05, 0.85, -0.3], color: '#f2a92b' },
      { pivot: [0, 0, 0], box: [-0.04, 1.0, -0.2, 0.04, 1.1, -0.15], color: '#d33a2c' },
      { pivot: [-0.1, 0.35, 0], box: [-0.13, 0, -0.03, -0.07, 0.35, 0.03], color: '#f2a92b', swing: 1 },
      { pivot: [0.1, 0.35, 0], box: [0.07, 0, -0.03, 0.13, 0.35, 0.03], color: '#f2a92b', swing: -1 }
    ]
  },
  arrow: {
    parts: [{ pivot: [0, 0, 0], box: [-0.03, -0.03, -0.4, 0.03, 0.03, 0.4], color: '#6b5230' }]
  }
};
