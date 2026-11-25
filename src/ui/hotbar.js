// ホットバー（9スロット）。タップ・クリックで選択、個数を表示
export function createHotbar(root, ids, iconOf, onSelect) {
  root.innerHTML = '';
  const slots = ids.map((id, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'slot';
    const img = document.createElement('img');
    img.src = iconOf(id);
    img.alt = '';
    img.draggable = false;
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    el.append(img, cnt);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onSelect(i);
    });
    root.appendChild(el);
    return { el, cnt };
  });
  return {
    update(selected, countOf, creative) {
      slots.forEach((s, i) => {
        s.el.classList.toggle('sel', i === selected);
        const text = creative ? '' : String(countOf(ids[i]));
        if (s.cnt.textContent !== text) s.cnt.textContent = text;
      });
    }
  };
}
