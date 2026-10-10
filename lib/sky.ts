/*
 * The page's sky: one full-screen WebGL2 shader, drawn behind the content.
 *
 * Hero: a backlit Earth (NASA Blue Marble + cloud imagery, packed by channel into
 * public/earth/*.jpg) seen from orbit, spinning slowly, with a thin atmosphere and
 * aurora curtains rising off its limb.
 * Below the hero: the globe sinks away and the aurora lifts off into a faint band
 * that drifts and changes shape as the page scrolls.
 *
 * The globe is ray-cast analytically (no mesh), so it is sharp at any size; the
 * texture lookup uses explicit gradients so the date-line seam never shows.
 */

export type SkyState = {
  /** Globe centre and radius, in units of viewport height from the screen centre (y up). */
  globe: [number, number, number];
  /** 0–1: how much of the globe scene is shown. */
  globeK: number;
  /** Direction of the sun behind the planet (screen x, y; x before mirroring). */
  sun: [number, number];
  spin: number;
  /** 0–1: strength of the free-floating aurora band. */
  free: number;
  /** Scroll-driven shape parameter for the free band. */
  shape: number;
  mirror: 1 | -1;
  time: number;
};

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uTex;
uniform float uTexK;
uniform vec3 uGlobe;
uniform float uGlobeK;
uniform float uSpin;
uniform float uFree;
uniform float uShape;
uniform float uMirror;
uniform vec2 uSun;
out vec4 outColor;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

// Aurora palette: 0 green-teal, 0.5 blue, 1 violet.
vec3 aur(float h) {
  vec3 a = vec3(0.16, 0.95, 0.72), b = vec3(0.24, 0.62, 1.0), c = vec3(0.64, 0.46, 1.0);
  return h < 0.5 ? mix(a, b, h * 2.0) : mix(b, c, (h - 0.5) * 2.0);
}

// Aurora curtain above a base line: s runs along the line, h is the height above it.
vec3 curtain(float s, float h, float t, float hue, float height) {
  if (h < -0.04 || h > height * 4.0) return vec3(0.0);
  float n = fbm(vec2(s * 5.0 + t * 0.05, h * 1.1 - t * 0.07));
  // Curtains gather in patches along the line rather than running evenly.
  float clump = smoothstep(0.32, 0.72, fbm(vec2(s * 1.3 + t * 0.025, 3.7)));
  float rays = fbm(vec2(s * 20.0 + n * 3.2 + t * 0.08, h * 0.9));
  float folds = 0.5 + 0.5 * sin(s * 3.8 + n * 5.0 + t * 0.15);
  float bottom = smoothstep(-0.035, 0.015, h);
  float fall = exp(-max(h, 0.0) / (height * (0.6 + 0.8 * rays)));
  float k = bottom * fall * (0.15 + 0.85 * clump) * (0.3 + 0.9 * rays * rays) * (0.4 + 0.6 * folds);
  vec3 col = aur(clamp(hue + h / height * 0.3 + (n - 0.5) * 0.3, 0.0, 1.0)) * k;
  col += vec3(0.45, 1.0, 0.85) * exp(-abs(h) * 70.0) * 0.25 * folds; // bright lower hem
  return col;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  // Teal on the reading-start side, violet toward the far side.
  float sx = gl_FragCoord.x / uRes.x;
  float hueX = clamp(((uMirror > 0.0 ? sx : 1.0 - sx) - 0.3) / 0.65, 0.0, 1.0);

  vec3 glow = vec3(0.0);
  vec3 body = vec3(0.0);
  float bodyA = 0.0;

  if (uGlobeK > 0.001) {
    vec2 d = p - uGlobe.xy;
    float r = uGlobe.z;
    float dist = length(d);
    vec3 n = vec3(d, sqrt(max(r * r - dist * dist, 0.0))) / r;
    vec3 L = normalize(vec3(uSun.x * uMirror, uSun.y, -0.3)); // sun behind the planet

    // Geographic coordinates: axial tilt, then spin.
    float ct = cos(0.41), st = sin(0.41);
    vec3 q = vec3(ct * n.x - st * n.y, st * n.x + ct * n.y, n.z);
    float lat = asin(clamp(q.y, -1.0, 1.0));
    float u = (atan(q.x, q.z) + uSpin) / 6.2831853;
    float v = 0.5 - lat / 3.1415927;
    // Seam-safe derivatives: take whichever longitude wrap changes least.
    float u1 = fract(u);
    float u2 = fract(u + 0.5) - 0.5;
    vec2 g1x = dFdx(vec2(u1, v)), g1y = dFdy(vec2(u1, v));
    vec2 g2x = dFdx(vec2(u2, v)), g2y = dFdy(vec2(u2, v));
    vec2 gx = abs(g1x.x) <= abs(g2x.x) ? g1x : g2x;
    vec2 gy = abs(g1y.x) <= abs(g2y.x) ? g1y : g2y;
    vec3 tex = textureGrad(uTex, vec2(u1, v), gx, gy).rgb * uTexK;

    float lum = tex.r, cloud = tex.g, land = tex.b;
    // Kept deliberately low-contrast: a dim planet the text can sit beside.
    vec3 ocean = vec3(0.01, 0.025, 0.04);
    vec3 ground = vec3(0.03, 0.055, 0.065) + lum * vec3(0.06, 0.09, 0.1);
    vec3 surf = mix(ocean, ground, land);
    surf = mix(surf, vec3(0.26, 0.34, 0.4), cloud * 0.32);
    float lit = smoothstep(-0.35, 0.65, dot(n, L));
    float rim = pow(1.0 - n.z, 2.6);
    surf *= 0.08 + 0.62 * lit;
    surf += aur(hueX) * rim * (0.25 + 0.9 * lit);

    float px = 1.5 / uRes.y;
    bodyA = smoothstep(r + px, r - px, dist) * uGlobeK;
    body = surf * uGlobeK;

    // Outside the planet: atmosphere halo and aurora curtains, strongest on the sunlit limb.
    float h = dist - r;
    vec2 dirN = normalize(vec2(d.x * uMirror, d.y));
    float sunlit = smoothstep(-0.45, 0.55, dot(dirN, normalize(uSun)));
    float ang = atan(dirN.y, dirN.x);
    glow += aur(hueX) * exp(-max(h, 0.0) * 22.0) * 0.8 * (0.3 + 0.7 * sunlit) * step(0.0, h);
    glow += curtain(ang * r, h, t, hueX, 0.09) * (0.2 + 1.0 * sunlit);
    glow *= uGlobeK;
  }

  if (uFree > 0.001) {
    // A free aurora band whose base line drifts and reshapes with scroll.
    float x = p.x * uMirror;
    float base = -0.2 + 0.13 * sin(x * 1.5 + uShape * 1.3 + t * 0.05) + 0.06 * sin(x * 3.4 - uShape * 0.8 + t * 0.07);
    glow += curtain(x * 0.75 + uShape * 0.15, p.y - base, t, clamp(hueX + 0.15 * sin(uShape * 0.7), 0.0, 1.0), 0.3) * uFree;
  }

  glow = 1.0 - exp(-glow * 1.35);
  float glowA = clamp(max(glow.r, max(glow.g, glow.b)) * 1.1, 0.0, 1.0);
  // Premultiplied: the planet sits over the glow behind it.
  outColor = vec4(body * bodyA + glow * (1.0 - bodyA), bodyA + glowA * (1.0 - bodyA));
}`;

const UNIFORMS = ["uRes", "uTime", "uTex", "uTexK", "uGlobe", "uGlobeK", "uSpin", "uFree", "uShape", "uMirror", "uSun"] as const;

export function createSky(canvas: HTMLCanvasElement, opts: { mobile: boolean; textureUrl: string }) {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
  gl.useProgram(program);
  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<
    (typeof UNIFORMS)[number],
    WebGLUniformLocation | null
  >;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Earth texture: a 1×1 placeholder until the image arrives, then faded in.
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.uniform1i(u.uTex, 0);
  let texLoadedAt = 0;
  let disposed = false;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    texLoadedAt = performance.now();
  };
  img.src = opts.textureUrl;

  return {
    resize(quality: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 1.75) * quality;
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    },
    /** True while the texture is still fading in (the caller keeps drawing). */
    get fading() {
      return texLoadedAt > 0 && performance.now() - texLoadedAt < 1600;
    },
    draw(s: SkyState) {
      const texK = texLoadedAt ? Math.min(1, (performance.now() - texLoadedAt) / 1500) : 0;
      gl.useProgram(program);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, s.time % 1000);
      gl.uniform1f(u.uTexK, texK * texK * (3 - 2 * texK));
      gl.uniform3f(u.uGlobe, s.globe[0], s.globe[1], s.globe[2]);
      gl.uniform1f(u.uGlobeK, s.globeK);
      gl.uniform1f(u.uSpin, s.spin);
      gl.uniform1f(u.uFree, s.free);
      gl.uniform1f(u.uShape, s.shape);
      gl.uniform1f(u.uMirror, s.mirror);
      gl.uniform2f(u.uSun, s.sun[0], s.sun[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      disposed = true;
      img.onload = null;
    },
  };
}

export type Sky = NonNullable<ReturnType<typeof createSky>>;
