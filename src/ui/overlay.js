// 被ダメージの赤フラッシュと死亡画面
export function createOverlay(onRespawn) {
  const flashEl = document.getElementById('flash');
  const deathEl = document.getElementById('death');
  deathEl.innerHTML = `
    <div class="death-title">死亡しました</div>
    <div class="death-cause"></div>
    <button class="menu-btn" type="button">リスポーン</button>`;
  const causeEl = deathEl.querySelector('.death-cause');
  deathEl.querySelector('button').addEventListener('pointerdown', (e) => { e.preventDefault(); onRespawn(); });
  const causes = {
    zombie: 'ゾンビ', skeleton: 'スケルトン', creeper: 'クリーパーの爆発', spider: 'クモ',
    arrow: '矢', starve: '空腹', drown: '溺死', fall: '落下', void: '奈落', explosion: '爆発'
  };
  return {
    flash(strength) { flashEl.style.opacity = String(Math.min(0.6, strength)); },
    showDeath(cause) {
      causeEl.textContent = `原因: ${causes[cause] || '不明'}`;
      deathEl.classList.remove('hidden');
    },
    hideDeath() { deathEl.classList.add('hidden'); }
  };
}
