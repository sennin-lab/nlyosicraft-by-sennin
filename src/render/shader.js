const VS_SRC = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aData;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

out vec2 vUv;
out float vAo;
out float vAlpha;
out vec3 vNormal;
out float vDist;

void main() {
  vec4 worldPos = uModel * vec4(aPos, 1.0);
  vec4 viewPos = uView * worldPos;
  vDist = length(viewPos.xyz);
  vNormal = mat3(uModel) * aNormal;
  vUv = aData.xy;
  vAo = aData.z;
  vAlpha = aData.w;
  gl_Position = uProj * viewPos;
}`;

// 面の向きによる陰影（上1.0 / 南北0.8 / 東西0.6 / 下0.5）はMinecraftと同じ比率
const FS_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
in float vAo;
in float vAlpha;
in vec3 vNormal;
in float vDist;

uniform sampler2D uAtlas;
uniform vec3 uFogColor;
uniform float uFogStart;
uniform float uFogEnd;

out vec4 fragColor;

void main() {
  vec4 tex = texture(uAtlas, vUv);
  float alpha = tex.a * vAlpha;
  if (alpha < 0.5) discard;
  vec3 n = normalize(vNormal);
  float shade = n.y > 0.5 ? 1.0 : (n.y < -0.5 ? 0.5 : (abs(n.x) > 0.5 ? 0.6 : 0.8));
  vec3 lit = tex.rgb * shade * vAo;
  float fog = clamp((vDist - uFogStart) / max(uFogEnd - uFogStart, 0.001), 0.0, 1.0);
  fragColor = vec4(mix(lit, uFogColor, fog), alpha);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export function createMainShader(gl) {
  const vs = compile(gl, gl.VERTEX_SHADER, VS_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS_SRC);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return {
    prog,
    uProj: gl.getUniformLocation(prog, 'uProj'),
    uView: gl.getUniformLocation(prog, 'uView'),
    uModel: gl.getUniformLocation(prog, 'uModel'),
    uAtlas: gl.getUniformLocation(prog, 'uAtlas'),
    uFogColor: gl.getUniformLocation(prog, 'uFogColor'),
    uFogStart: gl.getUniformLocation(prog, 'uFogStart'),
    uFogEnd: gl.getUniformLocation(prog, 'uFogEnd')
  };
}
