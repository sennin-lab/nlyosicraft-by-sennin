import { CONFIG } from '../config.js';

export function initGL(canvas) {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: true,
    powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('WebGL2が利用できません（iPadはiPadOS 15以降のSafariで動作します）');

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.frontFace(gl.CCW);
  const c = CONFIG.CLEAR_COLOR;
  gl.clearColor(c[0], c[1], c[2], c[3]);

  let scale = CONFIG.RES_START;

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); });
  canvas.addEventListener('webglcontextrestored', () => location.reload());

  // 画面のCSSサイズ × 端末ピクセル比 × 解像度係数 で描画バッファを決める
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
    let f = dpr * scale;
    const side = Math.max(window.innerWidth, window.innerHeight) * f;
    if (side > CONFIG.MAX_BUFFER_SIDE) f *= CONFIG.MAX_BUFFER_SIDE / side;
    const w = Math.max(1, Math.round(window.innerWidth * f));
    const h = Math.max(1, Math.round(window.innerHeight * f));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    return w / h;
  }

  function setScale(s) {
    scale = Math.min(CONFIG.RES_MAX, Math.max(CONFIG.RES_MIN, s));
    return resize();
  }

  function getScale() { return scale; }

  function clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  function createMesh(positions, normals, data) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const bufs = [];
    const bind = (loc, arr, size) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      bufs.push(b);
    };
    bind(0, positions, 3);
    bind(1, normals, 3);
    bind(2, data, 4);
    gl.bindVertexArray(null);
    return {
      vao,
      count: positions.length / 3,
      dispose() {
        for (const b of bufs) gl.deleteBuffer(b);
        gl.deleteVertexArray(vao);
      }
    };
  }

  // 位置と法線だけの簡易メッシュ（モブの箱モデル用、色はユニフォームで指定）
  function createSimpleMesh(positions, normals) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const bufs = [];
    const bind = (loc, arr) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
      bufs.push(b);
    };
    bind(0, positions);
    bind(1, normals);
    gl.bindVertexArray(null);
    return {
      vao,
      count: positions.length / 3,
      dispose() {
        for (const b of bufs) gl.deleteBuffer(b);
        gl.deleteVertexArray(vao);
      }
    };
  }

  return { gl, resize, setScale, getScale, clear, createMesh, createSimpleMesh };
}
