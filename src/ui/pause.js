import { pushInputLog } from '../input.js';

// handlers: { onNewWorld, onToggleCreative, isCreative, onToggleDebug, onBuildReport }
export function initPauseUI(btnEl, modalEl, handlers) {
  let paused = false;

  function renderMain() {
    modalEl.innerHTML = '';
    const items = [
      { label: '再開', action: close },
      { label: '新しいワールド', action: () => { handlers.onNewWorld(); close(); } },
      {
        label: `クリエイティブ: ${handlers.isCreative() ? 'ON' : 'OFF'}`,
        action: () => { handlers.onToggleCreative(); renderMain(); }
      },
      { label: 'デバッグ表示', action: () => handlers.onToggleDebug() },
      { label: 'バグ報告', action: showReport }
    ];
    for (const item of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu-btn';
      b.textContent = item.label;
      b.addEventListener('click', item.action);
      modalEl.appendChild(b);
    }
  }

  async function showReport() {
    pushInputLog('open_bug_report');
    const text = handlers.onBuildReport();
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) {
      copied = false;
    }
    modalEl.innerHTML = '';
    const info = document.createElement('div');
    info.textContent = copied ? 'クリップボードにコピーしました' : '下の文字を長押しして手動でコピーしてください';
    modalEl.appendChild(info);
    const ta = document.createElement('textarea');
    ta.className = 'report-box';
    ta.readOnly = true;
    ta.value = text;
    modalEl.appendChild(ta);
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'menu-btn';
    back.textContent = '戻る';
    back.addEventListener('click', renderMain);
    modalEl.appendChild(back);
  }

  function open() {
    if (paused) return;
    paused = true;
    pushInputLog('pause_open');
    renderMain();
    modalEl.classList.remove('hidden');
  }

  function close() {
    if (!paused) return;
    paused = false;
    pushInputLog('pause_close');
    modalEl.classList.add('hidden');
  }

  btnEl.addEventListener('click', open);

  return {
    get isPaused() { return paused; },
    open,
    close
  };
}
