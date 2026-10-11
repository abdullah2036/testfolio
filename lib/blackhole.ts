/*
 * The page's sky: a ray-traced Schwarzschild black hole with a thin accretion disk,
 * framed close and tilted so the hole runs off the edge of the screen.
 *
 * 1. Bake (once per size, spread over a few frames). For every pixel a light ray is
 *    traced backward from the camera through curved space-time. Units: Schwarzschild
 *    radius = 1. Null geodesics are integrated with the standard form
 *        a = −1.5 · h² · x / |x|⁵,   h = |x × v| (conserved)
 *    which reproduces Schwarzschild light bending exactly. Where the ray pierces the
 *    disk plane (up to twice: the direct image and the lensed image that wraps over
 *    the hole) we store the disk radius, angle and Doppler factor; we also keep the
 *    ray's closest approach (for the photon ring) and whether it fell in.
 * 2. Shade (every frame, cheap). The disk is drawn from the lensing map: luminous
 *    filaments in disk coordinates that orbit at Keplerian speed (ω ∝ r^−1.5), so
 *    inner rings outrun outer ones and the light shears and flows instead of
 *    rotating as a picture. Approaching gas is brightened and blue-shifted (D³).
 *
 * Scrolling never swaps the scene: the same image recedes (zooms out, drifts, dims,
 * loses filament detail) until only faint, slow light remains behind the content.
 */

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type HoleState = {
  /** Strength of the aurora once the hole has gone (fades near Contact). */
  aurora: number;
  /** Scroll-driven shape of the aurora. */
  shape: number;
  /** 1 = full hero presence, 0 = faint background. */
  presence: number;
  /** Overall brightness multiplier. */
  intensity: number;
  mirror: 1 | -1;
  time: number;
};

type Frame = {
  dist: number; // camera distance (Schwarzschild radii)
  elev: number; // camera elevation above the disk plane (degrees)
  roll: number; // camera roll (degrees)
  fov: number; // vertical field of view (degrees)
  shift: [number, number]; // lens shift: where the image window sits relative to the hole
};

// From outside the disk with a long lens: nearly edge-on, rolled, the hole pushed past the reading-end edge.
const FRAMES: Record<"wide" | "tall", Frame> = {
  wide: { dist: 15, elev: 4, roll: -9, fov: 30, shift: [-2.3, 0.04] },
  tall: { dist: 15, elev: 7, roll: 22, fov: 34, shift: [-0.62, -0.85] },
};

const DISK = { rin: 2.4, rout: 11 };

// Where the disk's light horizon runs on screen (fractions; x from the reading-start
// edge, y from the bottom): its point, then a point toward the hole. The aurora is
// born along this line.
const HORIZON: Record<"wide" | "tall", [number, number, number, number]> = {
  wide: [0.5, 0.35, 0.96, 0.5],
  tall: [0.12, 0.5, 0.95, 0.88],
};
const MARGIN = 1.35; // the baked map covers more than the screen so the scene can recede

const QUAD_VS = `#version 300 es
layout(location=0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const BAKE_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uCam;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform float uTan;
uniform vec2 uShift;
uniform float uMargin;
uniform float uRin;
uniform float uRout;
// Angles are stored as cos/sin so the map can be filtered smoothly (no wrap seam).
layout(location=0) out vec4 oHit1;   // r, cos phi, sin phi, D   (direct image)
layout(location=1) out vec4 oHit2;   // r, cos phi, sin phi, D   (lensed image)
layout(location=2) out vec4 oInfo;   // closest approach (negative if captured), hits
void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  uv *= uMargin;
  uv.x *= uRes.x / uRes.y;
  uv += uShift;
  vec3 v = normalize(uFwd + (uRight * uv.x + uUp * uv.y) * uTan);
  vec3 p = uCam;
  vec3 c = cross(p, v);
  float h2 = dot(c, c);
  vec4 h1 = vec4(-1.0, 1.0, 0.0, 0.0);
  vec4 h2v = vec4(-1.0, 1.0, 0.0, 0.0);
  float rmin = 1e4;
  float n = 0.0;
  float haze = 0.0;
  bool captured = false;
  for (int i = 0; i < 420; i++) {
    float r = length(p);
    rmin = min(rmin, r);
    if (r < 1.0) { captured = true; break; }
    if (r > 45.0 && dot(p, v) > 0.0) break;
    float dt = clamp(0.045 * r * r / (r + 3.0), 0.012, 0.9);
    vec3 a = -1.5 * h2 * p / pow(r, 5.0);
    vec3 pp = p;
    v += a * dt;
    p += v * dt;
    // The disk has thickness: gather the faint glow of gas just above and below its
    // plane, so it never collapses to a razor line when seen edge-on.
    float rh = length(p.xz);
    if (rh > uRin && rh < uRout) haze += exp(-abs(p.y) / 0.16) * pow(uRin / rh, 2.0) * smoothstep(uRout, uRout * 0.4, rh) * dt;
    if (pp.y * p.y < 0.0) {
      vec3 q = mix(pp, p, pp.y / (pp.y - p.y));
      float rq = length(q.xz);
      if (rq > uRin && rq < uRout) {
        // Keplerian gas (r_s = 1  ⇒  v = sqrt(0.5 / r)), Doppler + gravitational shift.
        float beta = min(sqrt(0.5 / rq), 0.7);
        vec3 orbit = normalize(vec3(-q.z, 0.0, q.x)); // the visible side approaches: brighter, blue-shifted
        float cosT = dot(orbit, -normalize(v));
        float gam = inversesqrt(1.0 - beta * beta);
        float D = sqrt(max(1.0 - 1.5 / rq, 0.05)) / (gam * (1.0 - beta * cosT));
        vec4 hit = vec4(rq, q.x / rq, q.z / rq, D);
        if (n < 0.5) h1 = hit; else h2v = hit;
        n += 1.0;
        if (n > 1.5) break;
      }
    }
  }
  oHit1 = h1;
  oHit2 = h2v;
  oInfo = vec4(captured ? -rmin : rmin, n, haze, 0.0);
}`;

// Tileable noise for the disk's filaments, generated once on the GPU.
const NOISE_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float vnoise(vec2 x, float period) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(mod(i, period));
  float b = hash(mod(i + vec2(1, 0), period));
  float c = hash(mod(i + vec2(0, 1), period));
  float d = hash(mod(i + vec2(1, 1), period));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 uv, float base, int oct) {
  float v = 0.0, a = 0.5, s = 0.0, per = base;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    v += a * vnoise(uv * per, per);
    s += a; a *= 0.5; per *= 2.0;
  }
  return v / s;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float soft = fbm(uv + 0.37, 4.0, 4);
  float mid = fbm(uv + 0.71, 8.0, 5);
  float ridge = 1.0 - abs(2.0 * fbm(uv + 0.13, 16.0, 5) - 1.0);
  float fine = 1.0 - abs(2.0 * fbm(uv + 0.53, 32.0, 4) - 1.0);
  o = vec4(soft, mid, ridge, fine);
}`;

const SHADE_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uHit1;
uniform sampler2D uHit2;
uniform sampler2D uInfo;
uniform sampler2D uNoise;
uniform float uTime;
uniform float uMirror;
uniform float uMargin;
uniform vec2 uAnchor;    // hole position in map uv
uniform float uZoom;     // < 1 recedes
uniform vec2 uDrift;
uniform float uDetail;   // 1 crisp filaments, 0 soft haze
uniform float uIntensity;
uniform float uClearSide;
uniform float uTall;
uniform float uRin;
uniform float uRout;
uniform float uHole;     // visibility of the black hole
uniform float uAurora;   // strength of the aurora that takes over below the hero
uniform float uShape;    // scroll-driven shape of the aurora
uniform float uMorph;    // 0 = aurora lies along the hole's horizon, 1 = free aurora
uniform vec4 uLine;      // the hole's horizon: disk point (xy) to hole side (zw), centred units
uniform float uAuroraGain;
uniform float uRoll;
uniform float uAspect;
out vec4 outColor;

const vec3 TEAL = vec3(0.30, 0.98, 0.86);
const vec3 CYAN = vec3(0.55, 0.92, 1.0);
const vec3 BLUE = vec3(0.24, 0.48, 1.0);
const vec3 VIOLET = vec3(0.55, 0.36, 1.0);

float flowNoise(float r, float phi, float phase, float bias) {
  // Keplerian shear: inner rings move faster. Coordinates wrap seamlessly in phi.
  float omega = 2.4 * pow(r, -1.5);
  float u = phi / 6.2831853 - omega * phase;
  float v = log(r) * 1.35;
  // Streams of gas, long along the orbit: broad, soft bands with gentler filaments
  // inside them, so the light reads as one flowing body rather than separate lines.
  float b = bias + 0.9;
  float soft = texture(uNoise, vec2(u * 1.0, v * 0.8), b).r;
  float mid = texture(uNoise, vec2(u * 1.0 + 0.4, v * 1.7 + 0.3), b).g;
  float ridge = texture(uNoise, vec2(u * 1.0 + 0.11, v * 2.6), b).b;
  float fine = texture(uNoise, vec2(u * 2.0 - 0.27, v * 4.0), b + 0.4).a;
  float filaments = pow(ridge, 2.2) * 0.75 + pow(fine, 3.0) * 0.25;
  // Clumps of brighter gas travelling round with the flow.
  float knots = texture(uNoise, vec2(u * 6.0 + 0.5, v * 1.3 - 0.2), b).g;
  float clump = 0.6 + 0.8 * smoothstep(0.38, 0.8, knots);
  return (soft * 0.55 + mid * 0.4 + filaments * mix(0.35, 1.0, uDetail)) * clump;
}

vec4 disk(float r, float phi, float D) {
  // Two phases cross-faded, so the shear never winds the pattern up over time.
  float cycle = 30.0;
  float t1 = fract(uTime / cycle), t2 = fract(uTime / cycle + 0.5);
  float w = abs(t1 * 2.0 - 1.0);
  float bias = (1.0 - uDetail) * 2.5;
  float n = mix(flowNoise(r, phi, t1 * cycle * 0.11, bias), flowNoise(r, phi + 1.7, t2 * cycle * 0.11, bias), w);
  float profile = smoothstep(uRin, uRin + 1.3, r) * pow(uRin / r, 1.8) * (1.0 - smoothstep(uRout * 0.22, uRout * 0.95, r));
  float beam = D * D * D;
  // Bright filaments over a faint haze of the same gas.
  float I = profile * (0.04 + 0.35 * n + 1.25 * n * n * n) * beam;
  // Hotter (whiter, cyan) inside and on the approaching side; violet outside and receding.
  vec3 col = mix(VIOLET, BLUE, smoothstep(uRout * 0.75, uRout * 0.35, r));
  col = mix(col, CYAN, smoothstep(6.5, 3.2, r) * 0.85);
  col = mix(col, TEAL, clamp((D - 1.0) * 1.6, 0.0, 1.0) * 0.7);
  col = mix(col, VIOLET, clamp((1.0 - D) * 1.8, 0.0, 1.0) * 0.75);
  col = mix(col, vec3(0.9, 0.98, 1.0), smoothstep(1.2, 3.2, I) * 0.45);
  return vec4(col * I, clamp(I * 1.4, 0.0, 1.0));
}

// The original aurora (from the globe version), ported as it was: curtains of rays
// above a wandering base line, gathered in patches, folding and drifting slowly.
float ahash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float anoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(ahash(i), ahash(i + vec2(1, 0)), u.x), mix(ahash(i + vec2(0, 1)), ahash(i + vec2(1, 1)), u.x), u.y);
}
float afbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * anoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
vec3 aurPal(float h) {
  vec3 a = vec3(0.16, 0.95, 0.72), b = vec3(0.24, 0.62, 1.0), c = vec3(0.64, 0.46, 1.0);
  return h < 0.5 ? mix(a, b, h * 2.0) : mix(b, c, (h - 0.5) * 2.0);
}
vec3 curtain(float s, float h, float t, float hue, float height) {
  if (h < -0.04 || h > height * 4.0) return vec3(0.0);
  float n = afbm(vec2(s * 5.0 + t * 0.05, h * 1.1 - t * 0.07));
  float clump = smoothstep(0.32, 0.72, afbm(vec2(s * 1.3 + t * 0.025, 3.7)));
  float rays = afbm(vec2(s * 20.0 + n * 3.2 + t * 0.08, h * 0.9));
  float folds = 0.5 + 0.5 * sin(s * 3.8 + n * 5.0 + t * 0.15);
  float bottom = smoothstep(-0.035, 0.015, h);
  float fall = exp(-max(h, 0.0) / (height * (0.6 + 0.8 * rays)));
  float k = bottom * fall * (0.15 + 0.85 * clump) * (0.3 + 0.9 * rays * rays) * (0.4 + 0.6 * folds);
  vec3 col = aurPal(clamp(hue + h / height * 0.3 + (n - 0.5) * 0.3, 0.0, 1.0)) * k;
  col += vec3(0.45, 1.0, 0.85) * exp(-abs(h) * 70.0) * 0.25 * folds;
  return col;
}
// The aurora's base line starts as the black hole's own light horizon (a straight
// line from the disk's point to the hole) and bends into the free, wandering line.
vec3 aurora(vec2 p, float sx) {
  float t = uTime;
  float x = p.x;
  float baseFree = -0.2 + 0.13 * sin(x * 1.5 + uShape * 1.3 + t * 0.05) + 0.06 * sin(x * 3.4 - uShape * 0.8 + t * 0.07);
  float slope = (uLine.w - uLine.y) / (uLine.z - uLine.x);
  float baseHole = uLine.y + (x - uLine.x) * slope;
  float base = mix(baseHole, baseFree, uMorph);
  float height = mix(0.045, 0.3, uMorph);
  float reach = mix(smoothstep(uLine.x - 0.06, uLine.x + 0.3, x), 1.0, uMorph);
  float hueX = clamp((sx - 0.3) / 0.65, 0.0, 1.0);
  return curtain(x * 0.75 + uShape * 0.15, p.y - base, t, clamp(hueX + 0.15 * sin(uShape * 0.7), 0.0, 1.0), height) * reach;
}

void main() {
  vec2 s = gl_FragCoord.xy / uRes;
  if (uMirror < 0.0) s.x = 1.0 - s.x;
  vec2 m = 0.5 + (s - 0.5) / uMargin;
  m = uAnchor + (m - uAnchor) / uZoom + uDrift;
  float inside = smoothstep(0.0, 0.16, m.x) * smoothstep(1.0, 0.84, m.x) * smoothstep(0.0, 0.16, m.y) * smoothstep(1.0, 0.84, m.y);
  vec4 A = texture(uHit1, m);
  vec4 B = texture(uHit2, m);
  vec4 F = texture(uInfo, m);

  vec3 col = vec3(0.0);
  float cover = 0.0;
  if (uHole > 0.001 && A.x > 0.0) {
    vec4 d = disk(A.x, atan(A.z, A.y), A.w);
    col += d.rgb;
    cover = d.a;
  }
  if (uHole > 0.001 && B.x > 0.0) {
    vec4 d = disk(B.x, atan(B.z, B.y), B.w);
    col += d.rgb * (1.0 - cover) * 0.9;
  }
  col += mix(BLUE, CYAN, 0.35) * F.z * 0.22;
  // Rays that skim the photon sphere squeeze the disk into hairline rings round the
  // shadow, too thin to draw cleanly: let them melt into the dark instead.
  float rmin = abs(F.x);
  col *= smoothstep(1.62, 2.5, rmin);
  // Photon ring: a soft glow only.
  // (Blending across the shadow's edge can yield values below the photon sphere;
  // only true escaping rays count, and the glow is clamped.)
  if (F.x > 1.5) {
    vec2 toHole = m - uAnchor;
    float side = smoothstep(-0.15, 0.7, -toHole.x / max(length(toHole), 1e-4));
    // A soft glow where light skims the photon sphere; no hard ring line.
    float skim = max(rmin - 1.5, 0.0);
    col += CYAN * exp(-skim * 3.2) * (0.02 + 0.1 * side) * smoothstep(1.5, 1.6, rmin);
    col += BLUE * exp(-skim * 1.4) * 0.03 * smoothstep(1.5, 1.6, rmin);
  }
  // Palette by arm: the upper arm (light lensed over the hole) runs cyan-teal,
  // the lower arm violet, meeting in blue at the point of the disk.
  // Measured across the band (the view is rolled), so the split follows its tilt.
  vec2 rel = vec2((m.x - uAnchor.x) * uAspect, m.y - uAnchor.y);
  float across = rel.y * cos(uRoll) + rel.x * sin(uRoll);
  float arm = smoothstep(-0.14, 0.2, across);
  // The far tail thins out gradually with distance from the hole, so the light
  // dissolves into the dark instead of ending where the disk's geometry stops.
  col *= 1.0 - smoothstep(0.4, 0.98, length(rel));
  float lum = max(col.r, max(col.g, col.b));
  vec3 tint = mix(mix(VIOLET, BLUE, smoothstep(0.0, 0.5, arm)), mix(BLUE, TEAL, 0.6), smoothstep(0.5, 1.0, arm));
  col = mix(col, tint * lum * 1.1, 0.55);
  // Keep the headline's side in near-darkness: the reading-start side on wide
  // screens, the bottom on tall ones (where the hero text sits on phones).
  float side = uTall > 0.5 ? smoothstep(0.22, 0.66, s.y) : 1.0;
  float clear = mix(1.0, side, uClearSide);
  col *= uIntensity * inside * clear * uHole;
  if (uAurora * uAuroraGain > 0.001) {
    vec2 pa = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float sx = gl_FragCoord.x / uRes.x;
    if (uMirror < 0.0) { pa.x = -pa.x; sx = 1.0 - sx; }
    col += aurora(pa, sx) * uAurora * uAuroraGain;
  }
  col = 1.0 - exp(-col * 1.15);
  float a = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 1.0);
  outColor = vec4(col, a);
}`;

// Bloom: a 9-tap Gaussian, run horizontally then vertically at quarter resolution.
const BLUR_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uStep;
uniform vec2 uRes;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 c = texture(uTex, uv) * 0.2270270;
  c += (texture(uTex, uv + uStep * 1.3846154) + texture(uTex, uv - uStep * 1.3846154)) * 0.3162162;
  c += (texture(uTex, uv + uStep * 3.2307692) + texture(uTex, uv - uStep * 3.2307692)) * 0.0702703;
  o = c;
}`;

const GLOW_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uStrength;
out vec4 o;
void main() {
  vec4 c = texture(uTex, gl_FragCoord.xy / uRes) * uStrength;
  o = vec4(c.rgb, max(c.r, max(c.g, c.b)));
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

function program(gl: WebGL2RenderingContext, fs: string, names: string[]) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, QUAD_VS));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return { p, u: Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) };
}

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Camera basis for a frame: on a circle round the hole, looking at it, then rolled. */
function cameraFor(f: Frame) {
  const el = (f.elev * Math.PI) / 180;
  const cam: V3 = [0, Math.sin(el) * f.dist, -Math.cos(el) * f.dist];
  const fwd = norm(sub([0, 0, 0], cam));
  let right = norm(cross([0, 1, 0], fwd));
  let up = cross(fwd, right);
  const rl = (f.roll * Math.PI) / 180;
  const c = Math.cos(rl), s = Math.sin(rl);
  const r2: V3 = [right[0] * c + up[0] * s, right[1] * c + up[1] * s, right[2] * c + up[2] * s];
  const u2: V3 = [up[0] * c - right[0] * s, up[1] * c - right[1] * s, up[2] * c - right[2] * s];
  right = r2;
  up = u2;
  return { cam, fwd, right, up, tan: Math.tan((f.fov * Math.PI) / 360) };
}

export function createBlackHole(canvas: HTMLCanvasElement, opts: { mobile: boolean }) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  if (!gl.getExtension("EXT_color_buffer_float")) return null;

  const bake = program(gl, BAKE_FS, ["uRes", "uCam", "uRight", "uUp", "uFwd", "uTan", "uShift", "uMargin", "uRin", "uRout"]);
  const noiseProg = program(gl, NOISE_FS, ["uRes"]);
  const blur = program(gl, BLUR_FS, ["uTex", "uStep", "uRes"]);
  const glow = program(gl, GLOW_FS, ["uTex", "uRes", "uStrength"]);
  const shade = program(gl, SHADE_FS, [
    "uRes", "uHit1", "uHit2", "uInfo", "uNoise", "uTime", "uMirror", "uMargin", "uAnchor", "uZoom", "uDrift", "uDetail", "uIntensity", "uClearSide", "uTall", "uHole", "uAurora", "uShape", "uAspect", "uMorph", "uLine", "uAuroraGain", "uRoll", "uRin", "uRout",
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = (w: number, h: number, internal: number, format: number, type: number, filter: number, wrap: number) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === gl.LINEAR_MIPMAP_LINEAR ? gl.LINEAR : filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  };

  // Filament noise (512², mipmapped so detail can soften as the scene recedes).
  const NOISE = 512;
  const noiseTex = texture(NOISE, NOISE, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR_MIPMAP_LINEAR, gl.REPEAT);
  {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, noiseTex, 0);
    gl.viewport(0, 0, NOISE, NOISE);
    gl.useProgram(noiseProg.p);
    gl.uniform2f(noiseProg.u.uRes, NOISE, NOISE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  // Lensing map: two float targets, baked in horizontal bands over several frames.
  let mapW = 0, mapH = 0;
  let hit1Tex: WebGLTexture | null = null;
  let hit2Tex: WebGLTexture | null = null;
  let infoTex: WebGLTexture | null = null;
  let mapFb: WebGLFramebuffer | null = null;
  let bakedRows = 0;
  let anchor: [number, number] = [0.5, 0.5];
  let tall = false;

  const startBake = () => {
    const w = canvas.width, h = canvas.height;
    tall = h > w * 1.05;
    const scale = opts.mobile ? 0.62 : 0.72; // lensing map at reduced res; the disk detail is shaded at full res
    mapW = Math.max(16, Math.round(w * MARGIN * scale));
    mapH = Math.max(16, Math.round(h * MARGIN * scale));
    [hit1Tex, hit2Tex, infoTex].forEach((t) => t && gl.deleteTexture(t));
    if (mapFb) gl.deleteFramebuffer(mapFb);
    // Half floats: renderable, and filterable in WebGL2, so the map interpolates smoothly.
    const mk = () => texture(mapW, mapH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR, gl.CLAMP_TO_EDGE);
    hit1Tex = mk();
    hit2Tex = mk();
    infoTex = mk();
    mapFb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, mapFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hit1Tex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, hit2Tex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, infoTex, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
    gl.clearBufferfv(gl.COLOR, 0, [-1, 1, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [-1, 1, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 2, [100, 0, 0, 0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    bakedRows = 0;
    // Where the hole lands in map uv (used as the centre the scene recedes toward).
    const f = FRAMES[tall ? "tall" : "wide"];
    const aspect = w / h;
    anchor = [0.5 + (-f.shift[0] / (MARGIN * aspect)) * 0.5, 0.5 + (-f.shift[1] / MARGIN) * 0.5];
  };

  const bakeStep = () => {
    if (!mapFb || bakedRows >= mapH) return;
    const band = Math.max(8, Math.ceil(mapH / (opts.mobile ? 10 : 7)));
    const f = FRAMES[tall ? "tall" : "wide"];
    const c = cameraFor(f);
    gl.bindFramebuffer(gl.FRAMEBUFFER, mapFb);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
    gl.viewport(0, 0, mapW, mapH);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, bakedRows, mapW, band);
    gl.disable(gl.BLEND);
    gl.useProgram(bake.p);
    gl.uniform2f(bake.u.uRes, mapW, mapH);
    gl.uniform3fv(bake.u.uCam, c.cam);
    gl.uniform3fv(bake.u.uRight, c.right);
    gl.uniform3fv(bake.u.uUp, c.up);
    gl.uniform3fv(bake.u.uFwd, c.fwd);
    gl.uniform1f(bake.u.uTan, c.tan);
    gl.uniform2f(bake.u.uShift, f.shift[0], f.shift[1]);
    gl.uniform1f(bake.u.uMargin, MARGIN);
    gl.uniform1f(bake.u.uRin, DISK.rin);
    gl.uniform1f(bake.u.uRout, DISK.rout);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    bakedRows += band;
  };

  // Two quarter-resolution targets for the glow pass.
  let bloomW = 0, bloomH = 0;
  const bloomTex: (WebGLTexture | null)[] = [null, null];
  const bloomFb: (WebGLFramebuffer | null)[] = [null, null];
  const sizeBloom = () => {
    bloomW = Math.max(8, Math.round(canvas.width / 4));
    bloomH = Math.max(8, Math.round(canvas.height / 4));
    for (let i = 0; i < 2; i++) {
      if (bloomTex[i]) gl.deleteTexture(bloomTex[i]);
      if (bloomFb[i]) gl.deleteFramebuffer(bloomFb[i]);
      bloomTex[i] = texture(bloomW, bloomH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR, gl.CLAMP_TO_EDGE);
      bloomFb[i] = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFb[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTex[i], 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  let quality = 1;
  const resize = (q: number) => {
    quality = q;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h || !mapFb) {
      canvas.width = w;
      canvas.height = h;
      startBake();
      sizeBloom();
    }
  };

  return {
    /** True once the lensing map is complete. */
    get ready() {
      return mapFb !== null && bakedRows >= mapH;
    },
    resize,
    draw(s: HoleState) {
      if (bakedRows < mapH) bakeStep();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (bakedRows < mapH) return;
      const k = 1 - s.presence;
      gl.bindVertexArray(vao);

      const shadeTo = (w: number, h: number, gain: number) => {
        gl.useProgram(shade.p);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, hit1Tex);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, hit2Tex);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, infoTex);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        gl.uniform1i(shade.u.uHit1, 0);
        gl.uniform1i(shade.u.uHit2, 1);
        gl.uniform1i(shade.u.uInfo, 2);
        gl.uniform1i(shade.u.uNoise, 3);
        gl.uniform2f(shade.u.uRes, w, h);
        gl.uniform1f(shade.u.uTime, s.time);
        gl.uniform1f(shade.u.uMirror, s.mirror);
        gl.uniform1f(shade.u.uMargin, MARGIN);
        gl.uniform2f(shade.u.uAnchor, anchor[0], anchor[1]);
        // Receding: smaller and further away, drifting in toward the middle of the
        // screen so a distant, dim hole stays in view, its filaments softening.
        gl.uniform1f(shade.u.uZoom, 1);
        gl.uniform2f(shade.u.uDrift, 0, 0);
        gl.uniform1f(shade.u.uDetail, 1 - 0.7 * k);
        gl.uniform1f(shade.u.uIntensity, s.intensity);
        gl.uniform1f(shade.u.uClearSide, s.presence);
        gl.uniform1f(shade.u.uTall, tall ? 1 : 0);
        // One light changing shape: the aurora is born thin along the hole's horizon as
        // the hole dissolves, then its line bends free and its curtains rise.
        gl.uniform1f(shade.u.uHole, smoothstep(0.12, 0.72, s.presence));
        // Born carrying the disk's brightness, then settling to its calm level.
        gl.uniform1f(shade.u.uAurora, smoothstep(0.04, 0.4, k) * s.aurora * (1 + 2.4 * (1 - smoothstep(0.45, 1, k))));
        gl.uniform1f(shade.u.uMorph, smoothstep(0.32, 0.96, k));
        gl.uniform1f(shade.u.uAuroraGain, gain);
        gl.uniform1f(shade.u.uRoll, (FRAMES[tall ? "tall" : "wide"].roll * Math.PI) / 180);
        gl.uniform1f(shade.u.uShape, s.shape);
        gl.uniform1f(shade.u.uAspect, canvas.width / canvas.height);
        const asp = canvas.width / canvas.height;
        const L = HORIZON[tall ? "tall" : "wide"];
        gl.uniform4f(shade.u.uLine, (L[0] - 0.5) * asp, L[1] - 0.5, (L[2] - 0.5) * asp, L[3] - 0.5);
        gl.uniform1f(shade.u.uRin, DISK.rin);
        gl.uniform1f(shade.u.uRout, DISK.rout);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      // 1. The scene at quarter resolution, blurred twice: the glow of the gas.
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFb[0]);
      gl.viewport(0, 0, bloomW, bloomH);
      shadeTo(bloomW, bloomH, 0); // the aurora stays out of the glow, as it was originally
      gl.useProgram(blur.p);
      gl.uniform1i(blur.u.uTex, 0);
      gl.uniform2f(blur.u.uRes, bloomW, bloomH);
      gl.activeTexture(gl.TEXTURE0);
      for (const spread of [1, 2.2]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFb[1]);
        gl.bindTexture(gl.TEXTURE_2D, bloomTex[0]);
        gl.uniform2f(blur.u.uStep, spread / bloomW, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFb[0]);
        gl.bindTexture(gl.TEXTURE_2D, bloomTex[1]);
        gl.uniform2f(blur.u.uStep, 0, spread / bloomH);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // 2. The scene at full resolution.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      shadeTo(canvas.width, canvas.height, 1);

      // 3. The glow laid over it, so the streams merge and bloom into the dark.
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(glow.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bloomTex[0]);
      gl.uniform1i(glow.u.uTex, 0);
      gl.uniform2f(glow.u.uRes, canvas.width, canvas.height);
      gl.uniform1f(glow.u.uStrength, 0.85 - 0.25 * k);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      [hit1Tex, hit2Tex, infoTex, noiseTex, ...bloomTex].forEach((t) => t && gl.deleteTexture(t));
      bloomFb.forEach((f) => f && gl.deleteFramebuffer(f));
      if (mapFb) gl.deleteFramebuffer(mapFb);
    },
  };
}

export type BlackHole = NonNullable<ReturnType<typeof createBlackHole>>;
