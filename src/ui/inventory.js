import { matchCraft, consumeCraft } from '../crafting.js';
import { SMELT, FUEL } from '../data/recipes.js';
import { itemInfo, maxStack } from '../data/items.js';
import { furnaceBurnFraction } from '../furnace.js';

// 持ち物・作業台(3x3)・持ち物の2x2・かまどを1つの画面で扱う
export function createInventoryUI(root, { inv, iconOf, onClose }) {
  const cursor = { s: null };
  let mode = null, size = 2, craft = [], furnace = null;

  root.innerHTML = `
    <div class="inv-panel">
      <div class="inv-head"><span class="inv-title"></span><button class="inv-close" type="button">閉じる</button></div>
      <div class="inv-top">
        <div class="craft-wrap"><div class="craft"></div></div>
        <div class="arrow">→</div>
        <div class="out"></div>
      </div>
      <div class="furnace-wrap hidden">
        <div class="f-in"></div>
        <div class="f-fuel"><div class="flame"><div></div></div><div class="f-fuel-slot"></div></div>
        <div class="arrow">→</div>
        <div class="f-out"></div>
        <div class="f-prog"><div></div></div>
      </div>
      <div class="inv-label">持ち物</div>
      <div class="inv-main"></div>
      <div class="inv-hint"></div>
    </div>
    <div class="cursor-item hidden"></div>`;

  const $ = (sel) => root.querySelector(sel);
  const titleEl = $('.inv-title'), craftEl = $('.craft'), outEl = $('.out');
  const furnWrap = $('.furnace-wrap'), mainEl = $('.inv-main');
  const curEl = root.querySelector('.cursor-item');

  $('.inv-close').addEventListener('pointerdown', (e) => { e.preventDefault(); close(); });
  root.addEventListener('pointermove', (e) => {
    curEl.style.left = `${e.clientX + 10}px`;
    curEl.style.top = `${e.clientY + 10}px`;
  });

  function makeSlot(item, onClick, cls = '') {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `islot ${cls}`;
    if (item) {
      const img = document.createElement('img');
      img.src = iconOf(item.id);
      img.draggable = false;
      el.appendChild(img);
      if (item.n > 1) {
        const c = document.createElement('span');
        c.className = 'cnt';
        c.textContent = String(item.n);
        el.appendChild(c);
      }
      const info = itemInfo(item.id);
      if (info && info.tool && item.dmg) {
        const d = document.createElement('div');
        d.className = 'dur';
        d.innerHTML = `<div style="width:${Math.max(0, 1 - item.dmg / info.tool.dur) * 100}%"></div>`;
        el.appendChild(d);
      }
    }
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); onClick(); });
    return el;
  }

  function render() {
    lastRender = performance.now();
    const isFurnace = mode === 'furnace';
    furnWrap.classList.toggle('hidden', !isFurnace);
    root.querySelector('.craft-wrap').classList.toggle('hidden', isFurnace);
    root.querySelector('.out').classList.toggle('hidden', isFurnace);
    root.querySelector('.arrow').classList.toggle('hidden', isFurnace);
    titleEl.textContent = mode === 'furnace' ? 'かまど' : mode === 'table' ? '作業台' : '持ち物';
    root.querySelector('.inv-hint').textContent = isFurnace
      ? '燃料（石炭など）を下に入れると精錬されます'
      : '2×2 は持ち物の中で作れます。作業台では 3×3 で作れます';

    if (!isFurnace) {
      craftEl.innerHTML = '';
      craftEl.style.gridTemplateColumns = `repeat(${size}, 48px)`;
      craft.forEach((s, i) => {
        craftEl.appendChild(makeSlot(s, () => { inv.clickSlot(craft, i, cursor); render(); }));
      });
      const res = matchCraft(craft, size);
      outEl.innerHTML = '';
      outEl.appendChild(makeSlot(res ? { id: res.id, n: res.n, dmg: 0 } : null, () => takeResult(res), 'out-slot'));
    } else {
      const f = furnace;
      const fin = root.querySelector('.f-in'), ffu = root.querySelector('.f-fuel-slot'), fout = root.querySelector('.f-out');
      fin.innerHTML = ''; ffu.innerHTML = ''; fout.innerHTML = '';
      fin.appendChild(makeSlot(f.input, () => fieldClick('input', (id) => !!SMELT[id])));
      ffu.appendChild(makeSlot(f.fuel, () => fieldClick('fuel', (id) => !!FUEL[id])));
      fout.appendChild(makeSlot(f.output, () => fieldTake(), 'out-slot'));
      root.querySelector('.flame > div').style.height = `${furnaceBurnFraction(f) * 100}%`;
      root.querySelector('.f-prog > div').style.width = `${Math.min(1, f.progress / 10) * 100}%`;
    }

    mainEl.innerHTML = '';
    for (let i = 9; i < 36; i++) mainEl.appendChild(makeSlot(inv.slots[i], () => { inv.clickSlot(inv.slots, i, cursor); render(); }));
    for (let i = 0; i < 9; i++) mainEl.appendChild(makeSlot(inv.slots[i], () => { inv.clickSlot(inv.slots, i, cursor); render(); }, 'hot'));

    if (cursor.s) {
      curEl.classList.remove('hidden');
      curEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = iconOf(cursor.s.id);
      curEl.appendChild(img);
      if (cursor.s.n > 1) {
        const c = document.createElement('span');
        c.className = 'cnt';
        c.textContent = String(cursor.s.n);
        curEl.appendChild(c);
      }
    } else {
      curEl.classList.add('hidden');
    }
  }

  // 完成品: カーソルに置ける場合のみ受け取り、材料を消費する
  function takeResult(res) {
    if (!res) return;
    if (cursor.s) {
      if (cursor.s.id !== res.id || cursor.s.n + res.n > maxStack(res.id)) return;
      cursor.s.n += res.n;
    } else {
      cursor.s = { id: res.id, n: res.n, dmg: 0 };
    }
    consumeCraft(craft);
    render();
  }

  // かまどの入力・燃料: 対象のものだけ入れられる
  function fieldClick(key, accepts) {
    if (cursor.s && !accepts(cursor.s.id)) return;
    const tmp = [furnace[key]];
    inv.clickSlot(tmp, 0, cursor);
    furnace[key] = tmp[0];
    render();
  }

  function fieldTake() {
    if (cursor.s) return;
    const tmp = [furnace.output];
    inv.clickSlot(tmp, 0, cursor);
    furnace.output = tmp[0];
    render();
  }

  function open(m, opts = {}) {
    mode = m;
    size = m === 'table' ? 3 : 2;
    craft = new Array(size * size).fill(null);
    furnace = opts.furnace || null;
    root.classList.remove('hidden');
    render();
  }

  // 閉じると持っているもの・作業台の材料は持ち物へ戻す（かまどの中身は残す）
  function close() {
    if (root.classList.contains('hidden')) return;
    if (cursor.s) { inv.addTo(inv.slots, cursor.s.id, cursor.s.n, cursor.s.dmg || 0); cursor.s = null; }
    for (let i = 0; i < craft.length; i++) {
      const s = craft[i];
      if (s) inv.addTo(inv.slots, s.id, s.n, s.dmg || 0);
      craft[i] = null;
    }
    root.classList.add('hidden');
    mode = null;
    onClose();
  }

  // 他の画面からかまどの表示を更新するため、開いている間に呼ぶ
  let lastRender = 0;
  function refresh() {
    if (root.classList.contains('hidden')) return;
    const now = performance.now();
    if (now - lastRender < 200) return;
    lastRender = now;
    render();
  }

  return {
    open, close, refresh,
    get isOpen() { return !root.classList.contains('hidden'); },
    get mode() { return mode; }
  };
}
