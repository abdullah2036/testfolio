/*
 * Pointer smoke: a small GPU fluid solver (stable fluids, Stam 1999).
 *
 * Each frame: vorticity confinement keeps the curls alive, the velocity field is made
 * divergence-free with a Jacobi pressure solve, then velocity and dye are advected
 * through it. Pointer and finger movement inject velocity and coloured dye along the
 * path, more of both the faster you move, so opposing strokes collide and curl like
 * real smoke. Nothing runs until the first movement, and the loop sleeps again once
 * the smoke has faded.
 */

type GL = WebGLRenderingContext | WebGL2RenderingContext;

const CONFIG = {
  SIM_RES: 128,
  DYE_RES: 1024,
  DENSITY_DISSIPATION: 1.6, // per second: higher fades faster
  VELOCITY_DISSIPATION: 0.28,
  PRESSURE_DECAY: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 26,
  SPLAT_RADIUS: 0.0013,
  SPLAT_FORCE: 6000,
  IDLE_MS: 9000, // keep simulating this long after the last movement
};

// Aurora palette (linear RGB), cycled slowly so a long stroke drifts through all three.
const PALETTE: [number, number, number][] = [
  [0.1, 0.92, 0.8],
  [0.3, 0.7, 1.0],
  [0.62, 0.48, 1.0],
];

const VERT = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEAD = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
`;

const FRAG = {
  clear: `${HEAD}
uniform sampler2D uTexture;
uniform float value;
void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`,

  splat: `${HEAD}
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 s = exp(-dot(p, p) / radius) * color;
  gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.0);
}`,

  advection: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;
vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}
void main () {
#ifdef MANUAL_FILTERING
  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
  vec4 result = bilerp(uSource, coord, dyeTexelSize);
#else
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  vec4 result = texture2D(uSource, coord);
#endif
  gl_FragColor = result / (1.0 + dissipation * dt);
}`,

  divergence: `${HEAD}
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  // Solid walls at the screen edges.
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,

  curl: `${HEAD}
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,

  vorticity: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;
  gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`,

  pressure: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`,

  gradientSubtract: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}`,

  // Soft tone curve so dense smoke glows instead of clipping; alpha follows brightness.
  display: `${HEAD}
uniform sampler2D uTexture;
void main () {
  vec3 c = texture2D(uTexture, vUv).rgb;
  c = 1.0 - exp(-c * 1.4);
  float a = clamp(max(c.r, max(c.g, c.b)) * 0.9, 0.0, 1.0);
  gl_FragColor = vec4(c, a);
}`,
};

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelX: number;
  texelY: number;
  attach: (unit: number) => number;
};
type DoubleFBO = { read: FBO; write: FBO; swap: () => void; texelX: number; texelY: number; width: number; height: number };
type Format = { internal: number; format: number };

export function createFluid(canvas: HTMLCanvasElement, opts: { mobile: boolean }) {
  const ctxOpts = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true };
  let gl: GL | null = canvas.getContext("webgl2", ctxOpts) as WebGL2RenderingContext | null;
  const isGL2 = !!gl;
  if (!gl) gl = canvas.getContext("webgl", ctxOpts) as WebGLRenderingContext | null;
  if (!gl) return null;
  const g = gl;

  // ---- texture formats -------------------------------------------------------
  let halfFloat: number;
  let linear: boolean;
  if (isGL2) {
    g.getExtension("EXT_color_buffer_float");
    halfFloat = (g as WebGL2RenderingContext).HALF_FLOAT;
    linear = true; // 16-bit float textures are filterable in WebGL2
  } else {
    const ext = g.getExtension("OES_texture_half_float");
    if (!ext) return null;
    halfFloat = ext.HALF_FLOAT_OES;
    linear = !!g.getExtension("OES_texture_half_float_linear");
  }

  const renderable = (internal: number, format: number) => {
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texImage2D(g.TEXTURE_2D, 0, internal, 4, 4, 0, format, halfFloat, null);
    const fb = g.createFramebuffer();
    g.bindFramebuffer(g.FRAMEBUFFER, fb);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
    const ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    g.deleteFramebuffer(fb);
    g.deleteTexture(tex);
    return ok;
  };
  const pick = (candidates: Format[]): Format | null => candidates.find((f) => renderable(f.internal, f.format)) ?? null;

  let fRGBA: Format | null, fRG: Format | null, fR: Format | null;
  if (isGL2) {
    const g2 = g as WebGL2RenderingContext;
    fRGBA = pick([{ internal: g2.RGBA16F, format: g2.RGBA }]);
    fRG = pick([
      { internal: g2.RG16F, format: g2.RG },
      { internal: g2.RGBA16F, format: g2.RGBA },
    ]);
    fR = pick([
      { internal: g2.R16F, format: g2.RED },
      { internal: g2.RG16F, format: g2.RG },
      { internal: g2.RGBA16F, format: g2.RGBA },
    ]);
  } else {
    fRGBA = fRG = fR = pick([{ internal: g.RGBA, format: g.RGBA }]);
  }
  if (!fRGBA || !fRG || !fR) return null;

  // ---- programs --------------------------------------------------------------
  const compile = (type: number, src: string) => {
    const s = g.createShader(type)!;
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const vert = compile(g.VERTEX_SHADER, VERT);
  const program = (frag: string) => {
    const p = g.createProgram()!;
    g.attachShader(p, vert);
    g.attachShader(p, compile(g.FRAGMENT_SHADER, frag));
    g.bindAttribLocation(p, 0, "aPosition");
    g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) ?? "link");
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = g.getProgramParameter(p, g.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const name = g.getActiveUniform(p, i)!.name;
      u[name] = g.getUniformLocation(p, name);
    }
    return { p, u };
  };
  const P = {
    clear: program(FRAG.clear),
    splat: program(FRAG.splat),
    advection: program(linear ? FRAG.advection : `#define MANUAL_FILTERING\n${FRAG.advection}`),
    divergence: program(FRAG.divergence),
    curl: program(FRAG.curl),
    vorticity: program(FRAG.vorticity),
    pressure: program(FRAG.pressure),
    gradientSubtract: program(FRAG.gradientSubtract),
    display: program(FRAG.display),
  };

  // Full-screen quad.
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), g.STATIC_DRAW);
  g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), g.STATIC_DRAW);
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  g.enableVertexAttribArray(0);

  const blit = (target: FBO | null) => {
    if (target) {
      g.viewport(0, 0, target.width, target.height);
      g.bindFramebuffer(g.FRAMEBUFFER, target.fbo);
    } else {
      g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
      g.bindFramebuffer(g.FRAMEBUFFER, null);
    }
    g.drawElements(g.TRIANGLES, 6, g.UNSIGNED_SHORT, 0);
  };

  // ---- framebuffers ------------------------------------------------------------
  const textures: WebGLTexture[] = [];
  const framebuffers: WebGLFramebuffer[] = [];
  const fbo = (w: number, h: number, f: Format, filter: number): FBO => {
    g.activeTexture(g.TEXTURE0);
    const texture = g.createTexture()!;
    g.bindTexture(g.TEXTURE_2D, texture);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, filter);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, filter);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, halfFloat, null);
    const fb = g.createFramebuffer()!;
    g.bindFramebuffer(g.FRAMEBUFFER, fb);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
    g.viewport(0, 0, w, h);
    g.clearColor(0, 0, 0, 1);
    g.clear(g.COLOR_BUFFER_BIT);
    textures.push(texture);
    framebuffers.push(fb);
    return {
      texture,
      fbo: fb,
      width: w,
      height: h,
      texelX: 1 / w,
      texelY: 1 / h,
      attach(unit) {
        g.activeTexture(g.TEXTURE0 + unit);
        g.bindTexture(g.TEXTURE_2D, texture);
        return unit;
      },
    };
  };
  const doubleFbo = (w: number, h: number, f: Format, filter: number): DoubleFBO => {
    let a = fbo(w, h, f, filter);
    let b = fbo(w, h, f, filter);
    return {
      width: w,
      height: h,
      texelX: 1 / w,
      texelY: 1 / h,
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        [a, b] = [b, a];
      },
    };
  };

  const resolution = (res: number) => {
    let aspect = g.drawingBufferWidth / g.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(res);
    const max = Math.round(res * aspect);
    return g.drawingBufferWidth > g.drawingBufferHeight ? { w: max, h: min } : { w: min, h: max };
  };

  let velocity: DoubleFBO, dye: DoubleFBO, pressure: DoubleFBO, divergence: FBO, curl: FBO;
  const filter = linear ? g.LINEAR : g.NEAREST;
  const initBuffers = () => {
    textures.splice(0).forEach((t) => g.deleteTexture(t));
    framebuffers.splice(0).forEach((f) => g.deleteFramebuffer(f));
    const sim = resolution(opts.mobile ? 96 : CONFIG.SIM_RES);
    const dyeRes = resolution(opts.mobile ? 512 : CONFIG.DYE_RES);
    g.disable(g.BLEND);
    velocity = doubleFbo(sim.w, sim.h, fRG!, filter);
    dye = doubleFbo(dyeRes.w, dyeRes.h, fRGBA!, filter);
    pressure = doubleFbo(sim.w, sim.h, fR!, g.NEAREST);
    divergence = fbo(sim.w, sim.h, fR!, g.NEAREST);
    curl = fbo(sim.w, sim.h, fR!, g.NEAREST);
  };

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  };
  resizeCanvas();
  initBuffers();

  // ---- simulation --------------------------------------------------------------
  const bindProgram = (prog: { p: WebGLProgram }) => g.useProgram(prog.p);

  const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
    const aspect = canvas.width / canvas.height;
    const radius = CONFIG.SPLAT_RADIUS * (aspect > 1 ? aspect : 1);
    bindProgram(P.splat);
    g.uniform1i(P.splat.u.uTarget, velocity.read.attach(0));
    g.uniform1f(P.splat.u.aspectRatio, aspect);
    g.uniform2f(P.splat.u.point, x, y);
    g.uniform3f(P.splat.u.color, dx, dy, 0);
    g.uniform1f(P.splat.u.radius, radius);
    blit(velocity.write);
    velocity.swap();
    g.uniform1i(P.splat.u.uTarget, dye.read.attach(0));
    g.uniform3f(P.splat.u.color, color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  };

  const step = (dt: number) => {
    g.disable(g.BLEND);

    bindProgram(P.curl);
    g.uniform2f(P.curl.u.texelSize, velocity.texelX, velocity.texelY);
    g.uniform1i(P.curl.u.uVelocity, velocity.read.attach(0));
    blit(curl);

    bindProgram(P.vorticity);
    g.uniform2f(P.vorticity.u.texelSize, velocity.texelX, velocity.texelY);
    g.uniform1i(P.vorticity.u.uVelocity, velocity.read.attach(0));
    g.uniform1i(P.vorticity.u.uCurl, curl.attach(1));
    g.uniform1f(P.vorticity.u.curl, CONFIG.CURL);
    g.uniform1f(P.vorticity.u.dt, dt);
    blit(velocity.write);
    velocity.swap();

    bindProgram(P.divergence);
    g.uniform2f(P.divergence.u.texelSize, velocity.texelX, velocity.texelY);
    g.uniform1i(P.divergence.u.uVelocity, velocity.read.attach(0));
    blit(divergence);

    bindProgram(P.clear);
    g.uniform1i(P.clear.u.uTexture, pressure.read.attach(0));
    g.uniform1f(P.clear.u.value, CONFIG.PRESSURE_DECAY);
    blit(pressure.write);
    pressure.swap();

    bindProgram(P.pressure);
    g.uniform2f(P.pressure.u.texelSize, velocity.texelX, velocity.texelY);
    g.uniform1i(P.pressure.u.uDivergence, divergence.attach(0));
    for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
      g.uniform1i(P.pressure.u.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    bindProgram(P.gradientSubtract);
    g.uniform2f(P.gradientSubtract.u.texelSize, velocity.texelX, velocity.texelY);
    g.uniform1i(P.gradientSubtract.u.uPressure, pressure.read.attach(0));
    g.uniform1i(P.gradientSubtract.u.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    bindProgram(P.advection);
    g.uniform2f(P.advection.u.texelSize, velocity.texelX, velocity.texelY);
    if (!linear) g.uniform2f(P.advection.u.dyeTexelSize, velocity.texelX, velocity.texelY);
    const vId = velocity.read.attach(0);
    g.uniform1i(P.advection.u.uVelocity, vId);
    g.uniform1i(P.advection.u.uSource, vId);
    g.uniform1f(P.advection.u.dt, dt);
    g.uniform1f(P.advection.u.dissipation, CONFIG.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!linear) g.uniform2f(P.advection.u.dyeTexelSize, dye.texelX, dye.texelY);
    g.uniform1i(P.advection.u.uVelocity, velocity.read.attach(0));
    g.uniform1i(P.advection.u.uSource, dye.read.attach(1));
    g.uniform1f(P.advection.u.dissipation, CONFIG.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  };

  const render = () => {
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
    g.disable(g.BLEND);
    bindProgram(P.display);
    g.uniform1i(P.display.u.uTexture, dye.read.attach(0));
    blit(null);
  };

  // ---- input -------------------------------------------------------------------
  const pointer = { x: 0, y: 0, px: 0, py: 0, has: false, moved: false };
  let lastInput = -Infinity;
  let hue = Math.random() * 3;

  const move = (clientX: number, clientY: number) => {
    const x = clientX / window.innerWidth;
    const y = 1 - clientY / window.innerHeight;
    if (!pointer.has) {
      pointer.px = pointer.x = x;
      pointer.py = pointer.y = y;
      pointer.has = true;
      return;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.moved = true;
    lastInput = performance.now();
    wake();
  };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "touch") move(e.clientX, e.clientY);
  };
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    pointer.has = false;
    move(t.clientX, t.clientY);
  };
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  };
  const onLeave = () => (pointer.has = false);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);

  const color = (amount: number): [number, number, number] => {
    const h = hue % 3;
    const i = Math.floor(h);
    const f = h - i;
    const a = PALETTE[i];
    const b = PALETTE[(i + 1) % 3];
    return [(a[0] + (b[0] - a[0]) * f) * amount, (a[1] + (b[1] - a[1]) * f) * amount, (a[2] + (b[2] - a[2]) * f) * amount];
  };

  /** Turns this frame's pointer travel into splats along the path; faster strokes push harder and carry more dye. */
  const applyInput = (dt: number) => {
    if (!pointer.moved) return;
    pointer.moved = false;
    const aspect = canvas.width / canvas.height;
    let dx = pointer.x - pointer.px;
    let dy = pointer.y - pointer.py;
    if (aspect < 1) dx *= aspect;
    else dy /= aspect;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-5) return;
    const speed = dist / Math.max(dt, 1 / 240);
    // A slow drift leaves a faint wisp; a fast flick throws noticeably more.
    const amount = Math.min(0.36, 0.018 + speed * 0.11);
    hue += dist * 4.5;
    const steps = Math.min(10, Math.max(1, Math.ceil(dist / 0.012)));
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      splat(
        pointer.px + (pointer.x - pointer.px) * k,
        pointer.py + (pointer.y - pointer.py) * k,
        (dx / steps) * CONFIG.SPLAT_FORCE,
        (dy / steps) * CONFIG.SPLAT_FORCE,
        color(amount / Math.sqrt(steps)),
      );
    }
    pointer.px = pointer.x;
    pointer.py = pointer.y;
  };

  // ---- loop: runs only while there is smoke to move --------------------------------
  let raf = 0;
  let running = false;
  let last = 0;

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (resizeCanvas()) initBuffers();
    applyInput(dt);
    step(dt);
    render();
    if (now - lastInput > CONFIG.IDLE_MS) {
      running = false;
      g.bindFramebuffer(g.FRAMEBUFFER, null);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  function wake() {
    if (running || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  return {
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      textures.forEach((t) => g.deleteTexture(t));
      framebuffers.forEach((f) => g.deleteFramebuffer(f));
    },
  };
}
