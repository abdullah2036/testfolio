/*
 * The page's sky: light bending around a Schwarzschild black hole.
 *
 * Each streak is a real photon path. Paths are traced once on the CPU from the orbit
 * equation for light around a non-rotating mass (Binet form, units G = c = M = 1):
 *
 *     d²u/dφ² + u = 3u²,   u = 1/r,   horizon at r = 2, photon sphere at r = 3
 *
 * Rays with impact parameter just above b = 3√3 swing round the photon sphere and
 * form the bright ring; rays below it spiral in and are swallowed. Each path also
 * stores coordinate time (dt = ds / (1 − 2/r)), so the light pulses that travel along
 * it slow and stall near the horizon the way a distant observer would see them.
 *
 * Paths are drawn as thin triangle strips with analytic anti-aliasing, so they stay
 * as sharp as vector lines at any resolution. A second, "relaxed" copy of every path
 * is traced with a tiny mass; blending toward it lets gravity fade out on scroll, so
 * the same light straightens into the background element for the rest of the page.
 */

export type HoleState = {
  /** Hole centre (viewport-height units from the screen centre, y up; before mirroring). */
  center: [number, number];
  /** Apparent radius of the dark disk (photon sphere), viewport-height units. */
  radius: number;
  /** 0–1: visibility of the dark disk and its ring. */
  hole: number;
  /** 0 = full gravity, 1 = straight light. */
  relax: number;
  /** Extra rotation of the light field (radians). */
  turn: number;
  /** Overall brightness of the light streaks. */
  intensity: number;
  mirror: 1 | -1;
  time: number;
};

const B_CRIT = 3 * Math.sqrt(3); // critical impact parameter (in M)
const R0 = 30; // rays start and end on this circle
// Light arrives from below, swings round the reading-start side of the hole and leaves upward.
const BASE_ROT = Math.PI + 0.2;

type Path = { x: number[]; y: number[]; t: number[]; r: number[] };

/** Integrates one photon path with RK4 in φ. */
function trace(b: number, mass: number): Path {
  let u = 1 / R0;
  let w = Math.sqrt(Math.max(1 / (b * b) - u * u * (1 - 2 * mass * u), 0));
  let phi = -Math.acos(Math.min(1, b / R0));
  const out: Path = { x: [], y: [], t: [], r: [] };
  let px = Math.cos(phi) / u;
  let py = Math.sin(phi) / u;
  let T = 0;
  out.x.push(px);
  out.y.push(py);
  out.t.push(0);
  out.r.push(1 / u);
  const f = (uu: number) => -uu + 3 * mass * uu * uu;
  for (let i = 0; i < 60000; i++) {
    const r = 1 / u;
    const h = r < 12 ? 0.0025 : 0.008;
    const k1u = w, k1w = f(u);
    const k2u = w + 0.5 * h * k1w, k2w = f(u + 0.5 * h * k1u);
    const k3u = w + 0.5 * h * k2w, k3w = f(u + 0.5 * h * k2u);
    const k4u = w + h * k3w, k4w = f(u + h * k3u);
    u += (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    w += (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    phi += h;
    const captured = u >= 1 / (2 * mass) - 1e-4;
    const escaped = w < 0 && u <= 1 / R0;
    const rr = captured ? 2 * mass : 1 / Math.max(u, 1e-6);
    const nx = Math.cos(phi) * rr;
    const ny = Math.sin(phi) * rr;
    const ds = Math.hypot(nx - px, ny - py);
    T += ds / Math.max(1 - (2 * mass) / rr, 0.03);
    if (ds > (rr < 8 ? 0.05 : 0.25) || captured || escaped) {
      out.x.push(nx);
      out.y.push(ny);
      out.t.push(T);
      out.r.push(rr);
      px = nx;
      py = ny;
    }
    if (captured || escaped) break;
  }
  return out;
}

/** Resamples a path to n points evenly spaced by arc length. */
function resample(p: Path, n: number) {
  const s = [0];
  for (let i = 1; i < p.x.length; i++) s.push(s[i - 1] + Math.hypot(p.x[i] - p.x[i - 1], p.y[i] - p.y[i - 1]));
  const total = s[s.length - 1] || 1;
  const x = new Float32Array(n), y = new Float32Array(n), t = new Float32Array(n), r = new Float32Array(n);
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    while (j < s.length - 2 && s[j + 1] < target) j++;
    const a = s[j + 1] > s[j] ? (target - s[j]) / (s[j + 1] - s[j]) : 0;
    x[k] = p.x[j] + (p.x[j + 1] - p.x[j]) * a;
    y[k] = p.y[j] + (p.y[j + 1] - p.y[j]) * a;
    t[k] = p.t[j] + (p.t[j + 1] - p.t[j]) * a;
    r[k] = p.r[j] + (p.r[j + 1] - p.r[j]) * a;
  }
  return { x, y, t, r };
}

/** Deterministic random numbers, so the field looks the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const FLOATS = 16; // per vertex: pc(2) pr(2) tc(2) tr(2) side t r frac seed hue bright pad

function buildField(rays: number, points: number) {
  const rand = rng(7);
  const data = new Float32Array(rays * points * 2 * FLOATS);
  const index = new Uint32Array(rays * (points - 1) * 6);
  let v = 0;
  let ix = 0;
  for (let i = 0; i < rays; i++) {
    // ~12% are swallowed; the rest crowd toward the critical orbit, thinning outward.
    const captured = i % 8 === 0;
    const b = captured
      ? B_CRIT - 0.02 - rand() * 1.1
      : B_CRIT + 0.0004 + Math.pow(rand(), 1.6) * 3.2;
    const curved = resample(trace(b, 1), points);
    const relaxed = resample(trace(b, 0.12), points);
    const seed = rand();
    const hue = (rand() - 0.5) * 0.3;
    const nearCrit = Math.exp(-Math.abs(b - B_CRIT) * 1.4);
    const bright = (0.22 + 0.78 * Math.pow(rand(), 3)) * (1 + 1.6 * nearCrit);
    const base = v;
    for (let k = 0; k < points; k++) {
      const k0 = Math.max(0, k - 1), k1 = Math.min(points - 1, k + 1);
      let tcx = curved.x[k1] - curved.x[k0], tcy = curved.y[k1] - curved.y[k0];
      let trx = relaxed.x[k1] - relaxed.x[k0], try_ = relaxed.y[k1] - relaxed.y[k0];
      const lc = Math.hypot(tcx, tcy) || 1, lr = Math.hypot(trx, try_) || 1;
      tcx /= lc; tcy /= lc; trx /= lr; try_ /= lr;
      for (const side of [-1, 1]) {
        const o = v * FLOATS;
        data.set(
          [curved.x[k], curved.y[k], relaxed.x[k], relaxed.y[k], tcx, tcy, trx, try_,
            side, curved.t[k], curved.r[k], k / (points - 1), seed, hue, bright, 0],
          o,
        );
        v++;
      }
    }
    for (let k = 0; k < points - 1; k++) {
      const a = base + k * 2;
      index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ix);
      ix += 6;
    }
  }
  return { data, index, count: ix };
}

const LINE_VS = `#version 300 es
layout(location=0) in vec2 aPC;
layout(location=1) in vec2 aPR;
layout(location=2) in vec2 aTC;
layout(location=3) in vec2 aTR;
layout(location=4) in vec4 aMeta;   // side, coordinate time, r, fraction along path
layout(location=5) in vec4 aRay;    // seed, hue shift, brightness, -
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uScale;
uniform float uRot;
uniform float uRelax;
uniform float uMirror;
uniform float uWidth;   // device pixels
out float vSide;
out float vAA;
out vec4 vMeta;
out vec4 vRay;
void main() {
  vec2 P = mix(aPC, aPR, uRelax);
  vec2 T = normalize(mix(aTC, aTR, uRelax) + vec2(1e-6, 0.0));
  vec2 N = vec2(-T.y, T.x);
  float c = cos(uRot), s = sin(uRot);
  mat2 R = mat2(c, s, -s, c);
  float px = 1.0 / uRes.y;
  float halfW = 0.5 * uWidth * px;
  vec2 w = R * P * uScale + uCenter + (R * N) * aMeta.x * (halfW + px);
  w.x *= uMirror;
  gl_Position = vec4(w.x * 2.0 * uRes.y / uRes.x, w.y * 2.0, 0.0, 1.0);
  vSide = aMeta.x * (halfW + px) / halfW;
  vAA = px / halfW;
  vMeta = aMeta;
  vRay = aRay;
}`;

const LINE_FS = `#version 300 es
precision highp float;
in float vSide;
in float vAA;
in vec4 vMeta;
in vec4 vRay;
uniform float uTime;
uniform float uAlpha;
uniform float uRelax;
uniform float uIntensity;
out vec4 outColor;
vec3 aur(float h) {
  vec3 a = vec3(0.30, 0.95, 0.86), b = vec3(0.28, 0.58, 1.0), c = vec3(0.62, 0.45, 1.0);
  return h < 0.5 ? mix(a, b, h * 2.0) : mix(b, c, (h - 0.5) * 2.0);
}
void main() {
  float edge = 1.0 - smoothstep(1.0 - vAA, 1.0 + vAA, abs(vSide));
  float r = vMeta.z;
  float frac = vMeta.w;
  // Light pulses travel along the path in coordinate time, so they crawl near the horizon.
  float f = fract(vMeta.y * 0.06 - uTime * 0.45 + vRay.x * 23.0);
  float pulse = pow(smoothstep(0.35, 1.0, f), 4.0) * (1.0 - smoothstep(0.985, 1.0, f));
  float near = smoothstep(10.0, 3.2, r) * (1.0 - uRelax);
  float hot = smoothstep(4.6, 3.05, r) * (1.0 - uRelax); // only the innermost paths run white-hot
  // Light thins out away from the hole, leaving a concentrated swoosh around it.
  float fade = smoothstep(9.0, 4.4, r) * smoothstep(0.0, 0.04, frac) * smoothstep(1.0, 0.96, frac);
  // Arriving light runs violet → blue; light leaving round the hole runs teal.
  float hue = clamp(mix(1.0, 0.0, smoothstep(0.15, 0.85, frac)) + vRay.y, 0.0, 1.0);
  vec3 col = mix(aur(hue), vec3(0.9, 0.97, 1.0), hot * 0.7);
  float I = (0.2 + 1.5 * pulse) * vRay.z * (0.55 + 1.6 * near) * fade * uIntensity * uAlpha * edge;
  outColor = vec4(col * I, I);
}`;

const HOLE_VS = `#version 300 es
layout(location=0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const HOLE_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uCenter;   // mirrored
uniform float uRadius;
uniform float uHole;
uniform float uMirror;
out vec4 outColor;
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 d = p - uCenter;
  float dist = length(d);
  float px = 1.0 / uRes.y;
  float disk = 1.0 - smoothstep(uRadius - px, uRadius + px, dist);
  // The ring is brightest on the side the light streams round.
  float side = -(d.x / max(dist, 1e-5)) * uMirror;
  float lit = 0.18 + 0.82 * smoothstep(-0.35, 0.85, side);
  float x = (dist - uRadius) / px;
  float core = exp(-x * x / 1.4);
  float out1 = step(uRadius, dist);
  float halo = (exp(-(dist - uRadius) / 0.016) * 0.5 + exp(-(dist - uRadius) / 0.07) * 0.12) * out1;
  float x2 = (dist - uRadius * 1.34) / px;
  float outer = exp(-x2 * x2 / 1.2) * 0.22;
  vec3 col = vec3(0.86, 0.98, 1.0) * core * 1.5 + vec3(0.35, 0.9, 0.95) * halo + vec3(0.6, 0.75, 1.0) * outer;
  col *= lit * uHole;
  float a = max(disk * uHole, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
  outColor = vec4(col, a);
}`;

export function createBlackHole(canvas: HTMLCanvasElement, opts: { mobile: boolean }) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const program = (vs: string, fs: string, names: string[]) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
    return { p, u: Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) };
  };
  const lines = program(LINE_VS, LINE_FS, [
    "uRes", "uCenter", "uScale", "uRot", "uRelax", "uMirror", "uWidth", "uTime", "uAlpha", "uIntensity",
  ]);
  const hole = program(HOLE_VS, HOLE_FS, ["uRes", "uCenter", "uRadius", "uHole", "uMirror"]);

  // Light field geometry (built once, right after first paint).
  const lineVao = gl.createVertexArray();
  let count = 0;
  const build = () => {
    const field = opts.mobile ? buildField(150, 120) : buildField(260, 160);
    gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, field.data, gl.STATIC_DRAW);
    const stride = FLOATS * 4;
    const attr = (loc: number, size: number, offset: number) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4);
    };
    attr(0, 2, 0);
    attr(1, 2, 2);
    attr(2, 2, 4);
    attr(3, 2, 6);
    attr(4, 4, 8);
    attr(5, 4, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, field.index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    count = field.count;
  };
  const buildTimer = window.setTimeout(build, 30);

  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  let dpr = 1;

  return {
    get ready() {
      return count > 0;
    },
    resize(quality: number) {
      dpr = Math.min(window.devicePixelRatio || 1, 2) * quality;
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    },
    draw(s: HoleState) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const scale = s.radius / 3; // the dark disk is the photon sphere, r = 3M
      const cx = s.center[0];
      const cy = s.center[1];

      if (count && s.intensity > 0.001) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(lines.p);
        gl.uniform2f(lines.u.uRes, canvas.width, canvas.height);
        gl.uniform2f(lines.u.uCenter, cx, cy);
        gl.uniform1f(lines.u.uScale, scale);
        gl.uniform1f(lines.u.uRot, BASE_ROT + s.turn);
        gl.uniform1f(lines.u.uRelax, s.relax);
        gl.uniform1f(lines.u.uMirror, s.mirror);
        gl.uniform1f(lines.u.uTime, s.time);
        gl.uniform1f(lines.u.uIntensity, s.intensity);
        gl.bindVertexArray(lineVao);
        // Soft glow, then the crisp core line.
        gl.uniform1f(lines.u.uWidth, 9 * dpr);
        gl.uniform1f(lines.u.uAlpha, 0.045);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
        gl.uniform1f(lines.u.uWidth, Math.max(1, 1.1 * dpr));
        gl.uniform1f(lines.u.uAlpha, 0.38);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
      }

      if (s.hole > 0.001) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(hole.p);
        gl.uniform2f(hole.u.uRes, canvas.width, canvas.height);
        gl.uniform2f(hole.u.uCenter, cx * s.mirror, cy);
        gl.uniform1f(hole.u.uRadius, s.radius);
        gl.uniform1f(hole.u.uHole, s.hole);
        gl.uniform1f(hole.u.uMirror, s.mirror);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
      }
    },
    dispose() {
      clearTimeout(buildTimer);
    },
  };
}

export type BlackHole = NonNullable<ReturnType<typeof createBlackHole>>;
