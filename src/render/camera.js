import { CONFIG } from '../config.js';

export function createCamera() {
  const proj = new Float32Array(16);
  const view = new Float32Array(16);
  const vp = new Float32Array(16);
  const planes = Array.from({ length: 6 }, () => new Float32Array(4));

  function buildProj(aspect) {
    const f = 1.0 / Math.tan((CONFIG.FOV_DEG * Math.PI) / 360);
    const nf = 1.0 / (CONFIG.NEAR - CONFIG.FAR);
    proj.fill(0);
    proj[0] = f / aspect;
    proj[5] = f;
    proj[10] = (CONFIG.FAR + CONFIG.NEAR) * nf;
    proj[11] = -1;
    proj[14] = 2 * CONFIG.FAR * CONFIG.NEAR * nf;
  }

  function buildView(eye, yaw, pitch) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const fx = -sy * cp, fy = sp, fz = -cy * cp;
    const rx = cy, ry = 0, rz = -sy;
    const ux = ry * fz - rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy - ry * fx;
    const { x, y, z } = eye;
    view[0] = rx; view[4] = ry; view[8] = rz; view[12] = -(rx * x + ry * y + rz * z);
    view[1] = ux; view[5] = uy; view[9] = uz; view[13] = -(ux * x + uy * y + uz * z);
    view[2] = -fx; view[6] = -fy; view[10] = -fz; view[14] = fx * x + fy * y + fz * z;
    view[3] = 0; view[7] = 0; view[11] = 0; view[15] = 1;
  }

  function extractFrustum() {
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        vp[c * 4 + r] =
          proj[r] * view[c * 4] +
          proj[4 + r] * view[c * 4 + 1] +
          proj[8 + r] * view[c * 4 + 2] +
          proj[12 + r] * view[c * 4 + 3];
      }
    }
    const setP = (i, a, b, c, d) => {
      const len = Math.hypot(a, b, c) || 1;
      planes[i][0] = a / len; planes[i][1] = b / len; planes[i][2] = c / len; planes[i][3] = d / len;
    };
    setP(0, vp[3] + vp[0], vp[7] + vp[4], vp[11] + vp[8], vp[15] + vp[12]);
    setP(1, vp[3] - vp[0], vp[7] - vp[4], vp[11] - vp[8], vp[15] - vp[12]);
    setP(2, vp[3] + vp[1], vp[7] + vp[5], vp[11] + vp[9], vp[15] + vp[13]);
    setP(3, vp[3] - vp[1], vp[7] - vp[5], vp[11] - vp[9], vp[15] - vp[13]);
    setP(4, vp[3] + vp[2], vp[7] + vp[6], vp[11] + vp[10], vp[15] + vp[14]);
    setP(5, vp[3] - vp[2], vp[7] - vp[6], vp[11] - vp[10], vp[15] - vp[14]);
  }

  function build(eye, yaw, pitch, aspect) {
    buildProj(aspect);
    buildView(eye, yaw, pitch);
    extractFrustum();
  }

  // 1辺sの立方体がフラスタムに入るか（正の頂点判定）
  function boxVisible(x, y, z, s) {
    for (const p of planes) {
      const px = p[0] >= 0 ? x + s : x;
      const py = p[1] >= 0 ? y + s : y;
      const pz = p[2] >= 0 ? z + s : z;
      if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) return false;
    }
    return true;
  }

  return { proj, view, vp, build, boxVisible };
}
