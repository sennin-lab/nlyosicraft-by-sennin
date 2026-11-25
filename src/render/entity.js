import { MOB_MODELS } from '../data/mobs.js';

// モブ用の簡易シェーダ（箱モデル、色はユニフォームで指定）
const VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
out vec3 vNormal;
out float vDist;
void main() {
  vec4 viewPos = uView * (uModel * vec4(aPos, 1.0));
  vDist = length(viewPos.xyz);
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uProj * viewPos;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vDist;
uniform vec3 uColor;
uniform float uFlash;
uniform float uDaylight;
uniform vec3 uFogColor;
uniform float uFogStart;
uniform float uFogEnd;
out vec4 fragColor;
void main() {
  vec3 n = normalize(vNormal);
  float shade = n.y > 0.5 ? 1.0 : (n.y < -0.5 ? 0.5 : (abs(n.x) > 0.5 ? 0.6 : 0.8));
  vec3 base = mix(uColor, vec3(1.0, 0.25, 0.2), uFlash);
  vec3 lit = base * shade * mix(0.22, 1.0, uDaylight);
  float fog = clamp((vDist - uFogStart) / max(uFogEnd - uFogStart, 0.001), 0.0, 1.0);
  fragColor = vec4(mix(lit, uFogColor, fog), 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

// 列優先 4x4 行列
const I4 = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
const T = (x, y, z) => { const m = I4(); m[12] = x; m[13] = y; m[14] = z; return m; };
function RY(a) {
  const m = I4(), c = Math.cos(a), s = Math.sin(a);
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  return m;
}
function RX(a) {
  const m = I4(), c = Math.cos(a), s = Math.sin(a);
  m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
  return m;
}

const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// 箱（軸平行）の三角形列。pivot 基準の相対座標に変換して返す
function boxGeom(b, pv) {
  const [x0, y0, z0, x1, y1, z1] = [b[0] - pv[0], b[1] - pv[1], b[2] - pv[2], b[3] - pv[0], b[4] - pv[1], b[5] - pv[2]];
  const P = [], N = [];
  const quad = (a, bq, c, d, n) => {
    for (const v of [a, bq, c, a, c, d]) { P.push(...v); N.push(...n); }
  };
  quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
  quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
  return { P, N };
}

export function createEntityRenderer(gl, createSimpleMesh) {
  const prog = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const U = {};
  for (const n of ['uProj', 'uView', 'uModel', 'uColor', 'uFlash', 'uDaylight', 'uFogColor', 'uFogStart', 'uFogEnd']) {
    U[n] = gl.getUniformLocation(prog, n);
  }

  // モデルごとに部位のメッシュを一度だけ作る
  const models = {};
  for (const [type, m] of Object.entries(MOB_MODELS)) {
    models[type] = m.parts.map((p) => {
      const g = boxGeom(p.box, p.pivot);
      return {
        mesh: createSimpleMesh(new Float32Array(g.P), new Float32Array(g.N)),
        pivot: p.pivot,
        swing: p.swing || 0,
        base: p.base || 0,
        color: hex(p.color)
      };
    });
  }

  // 1体分を描く。e: {type,x,y,z,yaw,pitch,walk,hurt,fuse,dead}
  function drawEntity(e, uni) {
    const parts = models[e.type];
    if (!parts) return;
    const root = mul(T(e.x, e.y, e.z), RY(e.yaw));
    const rootM = e.kind === 'arrow' ? mul(root, RX(e.pitch || 0)) : root;
    const flash = e.kind === 'mob' && e.type === 'creeper' && e.fuse > 0 ? (Math.floor(e.fuse * 10) % 2) * 0.6 : (e.hurt > 0 ? 0.55 : 0);
    gl.uniform1f(U.uFlash, flash);
    for (const part of parts) {
      const ang = part.swing * Math.sin(e.walk || 0) * 0.7 + part.base;
      const pm = part.pivot[0] || part.pivot[1] || part.pivot[2]
        ? mul(mul(rootM, T(part.pivot[0], part.pivot[1], part.pivot[2])), RX(ang))
        : mul(rootM, RX(ang));
      gl.uniformMatrix4fv(U.uModel, false, pm);
      gl.uniform3f(U.uColor, part.color[0], part.color[1], part.color[2]);
      gl.bindVertexArray(part.mesh.vao);
      gl.drawArrays(gl.TRIANGLES, 0, part.mesh.count);
    }
  }

  // 全モブ・矢を描く（カリングは無効＝箱の向きに依存しない）
  function draw(list, { view, proj, daylight, fogColor, fogStart, fogEnd, player, maxDist }) {
    if (!list.length) return 0;
    gl.disable(gl.CULL_FACE);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(U.uProj, false, proj);
    gl.uniformMatrix4fv(U.uView, false, view);
    gl.uniform1f(U.uDaylight, daylight);
    gl.uniform3fv(U.uFogColor, fogColor);
    gl.uniform1f(U.uFogStart, fogStart);
    gl.uniform1f(U.uFogEnd, fogEnd);
    let n = 0;
    for (const e of list) {
      if (e.dead) continue;
      if (Math.hypot(e.x - player.x, e.z - player.z) > maxDist) continue;
      drawEntity(e, U);
      n++;
    }
    gl.enable(gl.CULL_FACE);
    gl.bindVertexArray(null);
    return n;
  }

  return { draw };
}
