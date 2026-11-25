import { itemInfo } from '../data/items.js';

// アイテムの平面アイコン（32x32）。道具は素材色で頭部を変える
const MAT_COL = { wood: '#b08a50', stone: '#8c8c8c', iron: '#e4e4e4' };
const MAT_OF = { 150: 'wood', 151: 'wood', 152: 'wood', 153: 'wood', 154: 'wood', 155: 'stone', 156: 'stone', 157: 'stone', 158: 'stone', 159: 'stone', 165: 'iron', 166: 'iron', 167: 'iron', 168: 'iron', 169: 'iron' };

function line(g, x1, y1, x2, y2, w, color) {
  g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
function blob(g, x, y, rx, ry, color) {
  g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
}

function drawTool(g, kind, mat, id) {
  const head = MAT_COL[mat];
  line(g, 6, 27, 22, 9, 3, '#6b4a2b');
  if (kind === 'sword') {
    g.fillStyle = head;
    g.beginPath(); g.moveTo(20, 4); g.lineTo(26, 3); g.lineTo(27, 9); g.lineTo(16, 17); g.lineTo(12, 13); g.closePath(); g.fill();
    line(g, 9, 19, 14, 24, 3, '#4a3520');
  } else if (kind === 'pickaxe') {
    line(g, 12, 6, 26, 14, 3, head);
    line(g, 6, 9, 22, 21, 3, head);
    line(g, 18, 6, 26, 14, 3, head);
    line(g, 26, 14, 28, 18, 3, head);
  } else if (kind === 'axe') {
    g.fillStyle = head;
    g.beginPath(); g.moveTo(14, 4); g.lineTo(26, 6); g.lineTo(24, 16); g.lineTo(14, 12); g.closePath(); g.fill();
  } else if (kind === 'shovel') {
    g.fillStyle = head;
    g.beginPath(); g.moveTo(18, 3); g.lineTo(27, 5); g.lineTo(25, 15); g.lineTo(17, 13); g.closePath(); g.fill();
  } else if (kind === 'hoe') {
    line(g, 15, 6, 25, 6, 3, head);
    line(g, 25, 6, 25, 14, 3, head);
  }
  return id;
}

function drawItem(g, icon, id) {
  switch (icon) {
    case 'stick': line(g, 8, 24, 24, 8, 4, '#8a5f33'); break;
    case 'coal': blob(g, 16, 16, 9, 8, '#1b1b1b'); blob(g, 13, 13, 2, 2, '#555'); break;
    case 'iron_ingot':
      g.fillStyle = '#dcdcdc';
      g.beginPath(); g.moveTo(6, 12); g.lineTo(10, 8); g.lineTo(26, 8); g.lineTo(22, 16); g.lineTo(4, 16); g.closePath(); g.fill();
      g.fillStyle = '#9d9d9d'; g.fillRect(6, 16, 18, 3); break;
    case 'raw_iron': blob(g, 16, 16, 9, 7, '#d8b08f'); blob(g, 12, 13, 2, 2, '#7a5a40'); blob(g, 20, 18, 2, 2, '#7a5a40'); break;
    case 'feather': line(g, 10, 28, 24, 6, 3, '#f4f4f4'); line(g, 14, 22, 22, 12, 6, '#e8e8e8'); break;
    case 'leather': g.fillStyle = '#9a6b3c'; g.fillRect(7, 8, 18, 16); g.fillStyle = '#7d5230'; g.fillRect(9, 10, 6, 4); break;
    case 'string':
      for (let i = 0; i < 3; i++) { g.strokeStyle = '#f0f0f0'; g.lineWidth = 2; g.beginPath(); g.arc(10 + i * 5, 16, 6 - i, 0, Math.PI * 2); g.stroke(); }
      break;
    case 'bone': line(g, 8, 24, 24, 8, 4, '#eeeedd'); blob(g, 7, 25, 3, 3, '#eeeedd'); blob(g, 25, 7, 3, 3, '#eeeedd'); break;
    case 'gunpowder': blob(g, 12, 12, 3, 3, '#444'); blob(g, 20, 14, 3, 3, '#444'); blob(g, 16, 22, 3, 3, '#444'); break;
    case 'arrow': line(g, 6, 26, 24, 8, 2, '#8a6a40'); line(g, 22, 10, 28, 4, 3, '#cfcfcf'); break;
    case 'apple': blob(g, 16, 18, 10, 9, '#d12b21'); line(g, 16, 9, 18, 3, 2, '#5a3a20'); blob(g, 22, 8, 4, 2, '#4caf3a'); break;
    case 'bread': blob(g, 16, 17, 12, 8, '#c98f4a'); blob(g, 16, 14, 9, 4, '#e0a862'); break;
    case 'raw_beef': blob(g, 16, 16, 11, 8, '#c24040'); blob(g, 22, 12, 3, 3, '#f0f0f0'); break;
    case 'cooked_beef': blob(g, 16, 16, 11, 8, '#7a4a2a'); blob(g, 22, 12, 3, 3, '#f0f0f0'); break;
    case 'raw_porkchop': blob(g, 16, 16, 10, 8, '#eaa0a6'); break;
    case 'cooked_porkchop': blob(g, 16, 16, 10, 8, '#b06a48'); break;
    case 'raw_chicken': blob(g, 16, 16, 9, 7, '#f0d0c0'); line(g, 10, 22, 6, 28, 3, '#f0f0f0'); break;
    case 'cooked_chicken': blob(g, 16, 16, 9, 7, '#b5783a'); line(g, 10, 22, 6, 28, 3, '#f0f0f0'); break;
    case 'rotten_flesh': blob(g, 16, 16, 10, 8, '#6f8a4a'); blob(g, 12, 13, 2, 2, '#4f6a30'); break;
    default: {
      const m = /^tool_(\w+)_(\w+)$/.exec(icon);
      if (m) drawTool(g, m[1], m[2], id);
    }
  }
}

const cache = new Map();
export function itemIcon(id) {
  if (cache.has(id)) return cache.get(id);
  const info = itemInfo(id);
  if (!info || info.block) return null;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  // 道具の素材は id から判定（tool_kind_mat 形式のアイコン名を使う）
  if (info.tool) {
    const mat = MAT_OF[id];
    drawTool(g, info.tool.kind, mat, id);
  } else {
    drawItem(g, info.icon, id);
  }
  const url = c.toDataURL();
  cache.set(id, url);
  return url;
}
