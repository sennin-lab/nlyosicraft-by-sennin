// ホットバー（持ち物の 0..8 を表示）。タップで選択、個数と道具の耐久を表示
export function createHotbar(root, onSelect) {
  root.innerHTML = '';
  const slots = [];
  for (let i = 0; i < 9; i++) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'slot';
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    const dur = document.createElement('div');
    dur.className = 'dur hidden';
    const bar = document.createElement('div');
    dur.appendChild(bar);
    el.append(img, cnt, dur);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); onSelect(i); });
    root.appendChild(el);
    slots.push({ el, img, cnt, dur, bar, id: -1 });
  }
  return {
    update(inv, selected, iconOf, info) {
      slots.forEach((s, i) => {
        const item = inv.slots[i];
        s.el.classList.toggle('sel', i === selected);
        const id = item ? item.id : 0;
        if (id !== s.id) {
          s.id = id;
          s.img.src = item ? iconOf(id) : '';
          s.img.style.visibility = item ? 'visible' : 'hidden';
        }
        const text = item && item.n > 1 && !inv.creative ? String(item.n) : '';
        if (s.cnt.textContent !== text) s.cnt.textContent = text;
        const max = item && info(id) && info(id).tool ? info(id).tool.dur : 0;
        if (max && item.dmg) {
          s.dur.classList.remove('hidden');
          s.bar.style.width = `${Math.max(0, 1 - item.dmg / max) * 100}%`;
        } else {
          s.dur.classList.add('hidden');
        }
      });
    }
  };
}
