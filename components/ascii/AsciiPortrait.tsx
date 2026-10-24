"use client";

import { useEffect, useRef } from "react";
import { PORTRAIT_TALL, PORTRAIT_WIDE, type PortraitData } from "./portraitData";

/*
 * The hero's ASCII portrait. Every character is a particle, drawn in one WebGL call.
 *  - Arrives as a single stream that swims in from below and lays the portrait down.
 *  - A band of light sweeps down it now and then; the pointer pushes glyphs aside; a tap ripples it.
 *  - Scrolling away scatters it softly, and it re-forms on the way back.
 *  - Draws nothing while off screen. Reduced motion gets the still portrait.
 * Wide boxes use the head-and-hand crop, tall ones (phones) the crop that runs down to the lanyard.
 */

const ASPECT = 1.667; // glyph cell height / width
const RAMP = ".,:;-~=+*cxoeO#@"; // light -> dense
const FLY = "01<>/{}[]$%&?=+"; // glyphs while in motion
const GLYPHS = RAMP + FLY;
const NR = RAMP.length;
const NF = FLY.length;
const LEVELS = " !#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJ"; // portraitData encoding

const VS = `
attribute vec2 aPos; attribute vec3 aDat;
uniform vec2 uRes; uniform vec2 uCell; uniform float uSize;
varying vec3 vDat; varying vec2 vP;
void main(){
  vec2 p = aPos + uCell * 0.5; vP = p; vDat = aDat;
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = uSize;
}`;

// The site's light: teal-green, blue, violet, lavender, cyan — cycled across the portrait.
const FS = `
precision mediump float;
uniform sampler2D uTex; uniform float uNG; uniform float uAsp; uniform float uTime; uniform float uNR; uniform float uFill;
varying vec3 vDat; varying vec2 vP;
vec3 pal(float f){
  f = fract(f) * 5.0;
  vec3 g = vec3(.204,.902,.745), b = vec3(.251,.706,.941), v = vec3(.627,.482,1.), l = vec3(.706,.608,1.), c = vec3(.373,.847,.902);
  if (f < 1.0) return mix(g, b, f);
  if (f < 2.0) return mix(b, v, f - 1.0);
  if (f < 3.0) return mix(v, l, f - 2.0);
  if (f < 4.0) return mix(l, c, f - 3.0);
  return mix(c, g, f - 4.0);
}
void main(){
  vec2 pc = gl_PointCoord;
  float x = (pc.x - 0.5) / uAsp + 0.5;
  if (x < 0.0 || x > 1.0) discard;
  float m = texture2D(uTex, vec2((vDat.x + x) / uNG, pc.y)).a;
  float inCell = step(0.07, x) * step(x, 0.93) * step(0.05, pc.y) * step(pc.y, 0.95);
  float fill = vDat.x < uNR ? uFill * smoothstep(0.3, 1.0, vDat.y) * inCell : 0.0;
  float a = max(m * vDat.y, fill);
  if (a < 0.01) discard;
  vec3 col = pal(vP.x * 0.0034 + vP.y * 0.0021 + uTime * 0.045 + 0.12 * sin(uTime * 0.5 + vP.y * 0.006));
  if (vDat.z < 0.5) col *= 0.72; else if (vDat.z > 1.5) col = mix(col, vec3(1.0), 0.34);
  gl_FragColor = vec4(col, a);
}`;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const tierOf = (g: number) => (g >= NR ? 2 : g < 5 ? 0 : g < 11 ? 1 : 2);
const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/** Cells of the portrait, histogram-equalised so the face's mid-tones use the full glyph range. */
function decode(p: PortraitData) {
  const out: { c: number; r: number; v: number }[] = [];
  for (let i = 0; i < p.cells.length; i++) {
    const lv = LEVELS.indexOf(p.cells.charAt(i));
    if (lv > 0) out.push({ c: i % p.cols, r: Math.floor(i / p.cols), v: lv / 40 });
  }
  const order = out.map((_, i) => i).sort((a, b) => out[a].v - out[b].v);
  order.forEach((ix, n) => (out[ix].v = 0.72 * (n / (order.length - 1)) + 0.28 * out[ix].v));
  return out;
}

export default function AsciiPortrait({ mirror = false }: { mirror?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) {
      wrap.dataset.fallback = "";
      return;
    }

    // ---- WebGL setup: glyphs are point sprites sampled from a one-row atlas ----
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      wrap.dataset.fallback = "";
      return;
    }
    gl.useProgram(prog);
    const U = Object.fromEntries(
      ["uRes", "uCell", "uSize", "uTex", "uNG", "uAsp", "uTime", "uNR", "uFill"].map((n) => [n, gl.getUniformLocation(prog, n)]),
    );
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const aPos = gl.getAttribLocation(prog, "aPos");
    const aDat = gl.getAttribLocation(prog, "aDat");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(aDat);
    gl.vertexAttribPointer(aDat, 3, gl.FLOAT, false, 20, 8);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uTex, 0);
    gl.uniform1f(U.uNG, GLYPHS.length);
    gl.uniform1f(U.uNR, NR);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d")!;
    const monoFont = () => getComputedStyle(wrap).getPropertyValue("--font-mono").trim() || "ui-monospace, monospace";

    // ---- layout state ----
    let W = 0, H = 0, DPR = 1, CW = 0, CH = 0, N = 0, dataKey = "";
    let cells: { c: number; r: number; v: number }[] = [];
    let TX = new Float32Array(0), TY = new Float32Array(0), TA = new Float32Array(0);
    let TG = new Uint8Array(0), SIG = new Float32Array(0), WOF = new Float32Array(0), GD = new Float32Array(0);
    let box = { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 };

    const buildAtlas = () => {
      const gw = Math.ceil(CW * DPR * 2), gh = Math.ceil(CH * DPR * 2);
      atlas.width = GLYPHS.length * gw;
      atlas.height = gh;
      actx.clearRect(0, 0, atlas.width, atlas.height);
      actx.font = `500 ${(gh * 0.92).toFixed(2)}px ${monoFont()}`;
      actx.textAlign = "center";
      actx.textBaseline = "middle";
      actx.fillStyle = "#fff";
      for (let j = 0; j < GLYPHS.length; j++) actx.fillText(GLYPHS.charAt(j), j * gw + gw / 2, gh / 2 + gh * 0.04);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    };

    const layout = () => {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width;
      H = r.height;
      DPR = Math.min(W < 760 ? 3 : 2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      // A tall box (phones) is a cover: the portrait fills the hero from the top and the
      // words sit over its lower part. Otherwise it is centred in its half of the hero.
      const cover = H > W * 1.25;
      const data = cover || H > W * 1.15 ? PORTRAIT_TALL : PORTRAIT_WIDE;
      const key = `${data.cols}x${data.rows}`;
      if (key !== dataKey) {
        dataKey = key;
        cells = decode(data);
        N = cells.length;
        TX = new Float32Array(N); TY = new Float32Array(N); TA = new Float32Array(N); TG = new Uint8Array(N);
        SIG = new Float32Array(N); WOF = new Float32Array(N); GD = new Float32Array(N * 5);
        for (let i = 0; i < N; i++) {
          SIG[i] = i / N;
          WOF[i] = hash(i * 3.3) + hash(i * 7.1) - 1;
        }
      }
      CW = cover
        ? Math.min(W / data.cols, (H * 0.74) / (data.rows * ASPECT))
        : Math.min((W * 0.92) / data.cols, (H * 0.86) / (data.rows * ASPECT));
      CH = CW * ASPECT;
      const bw = data.cols * CW, bh = data.rows * CH;
      const x = (W - bw) / 2, y = cover ? Math.max(52, H * 0.05) : (H - bh) / 2;
      box = { x, y, w: bw, h: bh, cx: x + bw / 2, cy: y + bh / 2 };
      for (let i = 0; i < N; i++) {
        const cell = cells[i], tv = Math.pow(cell.v, 1.05);
        TX[i] = x + (mirror ? data.cols - 1 - cell.c : cell.c) * CW;
        TY[i] = y + cell.r * CH;
        TG[i] = Math.min(NR - 1, Math.floor(tv * NR));
        TA[i] = 0.28 + 0.72 * tv;
      }
      buildAtlas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, W, H);
      gl.uniform2f(U.uCell, CW, CH);
      gl.uniform1f(U.uSize, CH * DPR);
      gl.uniform1f(U.uAsp, CW / CH);
      gl.uniform1f(U.uFill, CW < 3 ? 0.5 : 0.26); // tiny glyphs lean on the tonal mosaic for clarity
    };

    // ---- the arrival stream: a spine the particles gather into, ride, and spray out of ----
    const NSP = 64;
    const SPX = new Float32Array(NSP + 1), SPY = new Float32Array(NSP + 1), SNX = new Float32Array(NSP + 1), SNY = new Float32Array(NSP + 1);
    const WL = 0.55, ENT = 0.24, EXT = 0.24;
    const buildSpine = (time: number) => {
      // swims in from the bottom corner on the reading side's start, mirrored for Arabic
      const side = mirror ? -1 : 1;
      const ax = mirror ? W * 1.08 : -W * 0.08, ay = H * 1.08, bx = box.cx, by = box.cy;
      const x1 = mirror ? W * 0.8 : W * 0.2, y1 = H * 1.02, x2 = bx - side * box.w * 0.7, y2 = by + box.h * 0.45;
      for (let s = 0; s <= NSP; s++) {
        const t = s / NSP;
        SPX[s] = bez(ax, x1, x2, bx, t);
        SPY[s] = bez(ay, y1, y2, by, t);
      }
      for (let s = 0; s <= NSP; s++) {
        const s0 = Math.max(0, s - 1), s1 = Math.min(NSP, s + 1);
        const dx = SPX[s1] - SPX[s0], dy = SPY[s1] - SPY[s0], l = Math.hypot(dx, dy) || 1;
        SNX[s] = -dy / l;
        SNY[s] = dx / l;
      }
      const und = W < 760 ? 7 : 14;
      for (let s = 0; s <= NSP; s++) {
        const q = s / NSP, w = Math.sin(q * Math.PI * 3.4 - time * 6.5) * und * Math.sin(Math.PI * q);
        SPX[s] += SNX[s] * w;
        SPY[s] += SNY[s] * w;
      }
    };

    // ---- input ----
    let mx = -1e4, my = -1e4, mouseOn = false, pulse = 0, pcx = 0, pcy = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      mouseOn = true;
    };
    const onLeave = () => (mouseOn = false);
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      const r = canvas.getBoundingClientRect();
      pulse = 1;
      pcx = e.clientX - r.left;
      pcy = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);

    // ---- render loop (idle while off screen) ----
    let visible = true, raf = 0, last = 0, time = 0, intro = reduced ? 1 : 0, scatter = 0;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(wrap);

    function frame(now: number) {
      raf = 0;
      if (!visible || !N) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.12, (now - (last || now)) / 1000);
      last = now;
      time += dt;
      if (intro < 1) intro = Math.min(1, intro + dt / 2.6);
      pulse *= Math.exp(-dt * 2.4);
      // scrolling the hero away scatters the portrait; scrolling back re-forms it
      const r = wrap.getBoundingClientRect();
      const target = reduced ? 0 : clamp01(-r.top / (r.height * 0.8));
      scatter += (target - scatter) * (1 - Math.exp(-dt * 8));

      const introOn = intro < 1;
      const tw = easeIO(intro);
      if (introOn) buildSpine(time);
      const head = -ENT + tw * (1 + WL + ENT + EXT);
      const thick = Math.min(W < 760 ? 12 : 22, box.w * 0.05);
      const sweepY = box.y + ((time * 0.16) % 1.5) * box.h;
      const flick = (time * 16) | 0;
      const R = Math.max(70, box.w * 0.22), R2 = R * R;
      const mOn = mouseOn && !reduced && !introOn;
      const pul = pulse > 0.01;
      const sc = scatter * scatter;
      let o = 0;

      for (let i = 0; i < N; i++) {
        let x = TX[i], y = TY[i], g = TG[i], a = TA[i];
        if (introOn) {
          const p = head - SIG[i] * WL;
          if (p <= -ENT) continue; // still waiting off screen
          if (p < 0) {
            const u = easeIn((p + ENT) / ENT);
            x = SPX[0]; y = SPY[0]; a = 0.9 * u; g = NR + ((i + flick) % NF);
          } else if (p <= 1) {
            const fs = p * NSP, s0 = fs | 0, s1 = Math.min(NSP, s0 + 1), fr = fs - s0;
            const px = SPX[s0] + (SPX[s1] - SPX[s0]) * fr, py = SPY[s0] + (SPY[s1] - SPY[s0]) * fr;
            const off = WOF[i] * (Math.pow(Math.sin(Math.PI * p), 0.7) * thick + 2), along = (hash(i * 5.7) - 0.5) * 6;
            x = px + SNX[s0] * off - SNY[s0] * along;
            y = py + SNY[s0] * off + SNX[s0] * along;
            g = NR + ((i + flick) % NF);
            a = 0.62 + 0.33 * Math.sin(Math.PI * p);
          } else if (p < 1 + EXT) {
            const u = easeOut((p - 1) / EXT), ex = SPX[NSP], ey = SPY[NSP];
            x = ex + (TX[i] - ex) * u;
            y = ey + (TY[i] - ey) * u;
            g = u < 0.75 ? NR + ((i + flick) % NF) : TG[i];
            a = 0.9 + (TA[i] - 0.9) * u;
          }
        } else if (!reduced) {
          const d = y - sweepY;
          if (d > -CH * 2 && d < CH * 2) {
            a = Math.min(1, a + 0.4);
            if (g < NR - 3) g += 3;
          }
        }
        if (sc > 0.0005) {
          const k = sc * (120 + 160 * hash(i * 2.3));
          x += (hash(i * 4.1) - 0.5) * k;
          y -= (0.4 + hash(i * 6.7)) * k;
          a *= 1 - Math.min(1, scatter * 1.1);
          if (scatter > 0.08) g = NR + ((i + flick) % NF);
        }
        if (mOn) {
          const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const dd = Math.sqrt(d2) + 0.001, f = 1 - dd / R;
            x += (dx / dd) * f * 26;
            y += (dy / dd) * f * 26;
            a = Math.min(1, a + 0.45 * f);
          }
        }
        if (pul) {
          const dx = x - pcx, dy = y - pcy, d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const off = Math.sin(d * 0.045 - time * 9) * pulse * 9 * Math.max(0, 1 - d / 700);
          x += (dx / d) * off;
          y += (dy / d) * off;
        }
        if (a < 0.02) continue;
        GD[o++] = x; GD[o++] = y; GD[o++] = g; GD[o++] = a; GD[o++] = tierOf(g);
      }
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(U.uTime, time);
      gl!.bufferData(gl!.ARRAY_BUFFER, GD.subarray(0, o), gl!.DYNAMIC_DRAW);
      gl!.drawArrays(gl!.POINTS, 0, o / 5);
    }

    const ro = new ResizeObserver(() => layout());
    ro.observe(wrap);
    layout();
    // redraw the atlas once Geist Mono has arrived
    document.fonts?.ready.then(() => W && buildAtlas());
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
    };
  }, [mirror]);

  return (
    <div ref={wrapRef} className="ascii-portrait" aria-hidden="true">
      <canvas ref={canvasRef} className="ascii-portrait__canvas" />
    </div>
  );
}
