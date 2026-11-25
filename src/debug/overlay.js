export function createDebugOverlay(hudEl) {
  let visible = false;

  function toggle() {
    visible = !visible;
    hudEl.classList.toggle('hidden', !visible);
  }

  function update(stats) {
    if (!visible) return;
    const fps = Math.round(stats.fps);
    const cls = fps >= 55 ? 'fps-good' : fps >= 35 ? 'fps-warn' : 'fps-bad';
    const mem = performance.memory
      ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)}MB`
      : 'N/A (Safari)';
    const p = stats.pos;
    hudEl.innerHTML =
      `<span class="${cls}">FPS: ${fps}</span> (${stats.frameMs.toFixed(1)}ms)\n` +
      `Draws: ${stats.draws} | Tris: ${stats.tris}\n` +
      `Chunks: ${stats.chunks} | Res: ${(stats.scale * 100).toFixed(0)}% | Mem: ${mem}\n` +
      `XYZ: ${p.x.toFixed(2)} / ${p.y.toFixed(2)} / ${p.z.toFixed(2)}`;
  }

  return {
    get isVisible() { return visible; },
    toggle,
    update
  };
}
