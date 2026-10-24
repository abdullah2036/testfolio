"use client";

import { useEffect, useRef } from "react";

/*
 * The ground behind every page: a dotted grid with drifting specks, in the aurora colours.
 *  - Dots near the pointer brighten and lean away from it; a click or tap sends a ripple through the grid.
 *  - A few dozen specks drift slowly and twinkle, and step aside for the pointer too.
 *  - The grid fades towards the edges of the window, so content always sits on calm ground.
 *  - Nothing is drawn while the tab is hidden. Reduced motion gets the still grid, no specks.
 */

const GAP = 26; // grid spacing, px
const REACH = 150; // pointer influence radius, px
const AURORA: [number, number, number][] = [
  [57, 255, 159],
  [34, 211, 238],
  [96, 165, 250],
  [167, 139, 250],
];

type Speck = { x: number; y: number; vx: number; vy: number; s: number; c: number; ph: number };
type Ripple = { x: number; y: number; age: number };

const auroraAt = (x: number, y: number, W: number, H: number, t: number) => {
  const f = (((x / W) * 0.7 + (y / H) * 0.4 + t * 0.03) % 1 + 1) % 1;
  const p = f * AURORA.length, i = Math.floor(p), k = p - i;
  const a = AURORA[i % AURORA.length], b = AURORA[(i + 1) % AURORA.length];
  return `${(a[0] + (b[0] - a[0]) * k) | 0},${(a[1] + (b[1] - a[1]) * k) | 0},${(a[2] + (b[2] - a[2]) * k) | 0}`;
};

export default function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, DPR = 1;
    let specks: Speck[] = [];
    const ripples: Ripple[] = [];
    let mx = -1e4, my = -1e4, presence = 0, pointerOn = false;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      DPR = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = reduced ? 0 : Math.round(Math.min(90, (W * H) / 16000));
      specks = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 - Math.random() * 6,
        s: 0.8 + Math.random() * 1.6,
        c: Math.floor(Math.random() * AURORA.length),
        ph: Math.random() * Math.PI * 2,
      }));
      if (reduced) draw(0, 0);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;
      pointerOn = true;
    };
    const onLeave = () => (pointerOn = false);
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      ripples.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (ripples.length > 4) ripples.shift();
    };

    function draw(time: number, dt: number) {
      ctx!.clearRect(0, 0, W, H);
      presence += ((pointerOn ? 1 : 0) - presence) * Math.min(1, dt * 6);
      for (const r of ripples) r.age += dt;
      while (ripples.length && ripples[0].age > 1.6) ripples.shift();

      // grid: calm dots in one batched path per brightness band; lit dots drawn on their own
      const cx = W / 2, cy = H * 0.42, maxD = Math.hypot(W * 0.62, H * 0.62);
      const bands: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
      const off = GAP / 2;
      for (let y = off; y < H; y += GAP) {
        for (let x = off; x < W; x += GAP) {
          const edge = Math.min(1, Math.hypot(x - cx, y - cy) / maxD);
          let lift = 0, dx = 0, dy = 0;
          if (presence > 0.01) {
            const ddx = x - mx, ddy = y - my, d = Math.hypot(ddx, ddy);
            if (d < REACH) {
              const f = (1 - d / REACH) * presence;
              lift = f;
              dx = (ddx / (d || 1)) * f * 7;
              dy = (ddy / (d || 1)) * f * 7;
            }
          }
          for (const r of ripples) {
            const d = Math.hypot(x - r.x, y - r.y), front = r.age * 520;
            const w = Math.max(0, 1 - Math.abs(d - front) / 46) * (1 - r.age / 1.6);
            if (w > 0) {
              lift = Math.max(lift, w * 0.9);
              dx += ((x - r.x) / (d || 1)) * w * 5;
              dy += ((y - r.y) / (d || 1)) * w * 5;
            }
          }
          if (lift > 0.02) {
            ctx!.fillStyle = `rgba(${auroraAt(x, y, W, H, time)},${(0.1 + 0.75 * lift).toFixed(3)})`;
            const s = 1.4 + 1.8 * lift;
            ctx!.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
          } else {
            bands[edge < 0.55 ? 0 : edge < 0.8 ? 1 : 2].rect(x - 0.7, y - 0.7, 1.4, 1.4);
          }
        }
      }
      const tones = [0.11, 0.065, 0.03];
      bands.forEach((p, i) => {
        ctx!.fillStyle = `rgba(140,170,255,${tones[i]})`;
        ctx!.fill(p);
      });

      // specks: slow upward drift with a sideways sway, twinkling
      for (const p of specks) {
        p.x += (p.vx + Math.sin(time * 0.4 + p.ph) * 4) * dt;
        p.y += p.vy * dt;
        if (presence > 0.01) {
          const ddx = p.x - mx, ddy = p.y - my, d = Math.hypot(ddx, ddy);
          if (d < REACH) {
            const f = (1 - d / REACH) * presence * 60 * dt;
            p.x += (ddx / (d || 1)) * f;
            p.y += (ddy / (d || 1)) * f;
          }
        }
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        const a = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(time * 1.3 + p.ph));
        const [r, g, b] = AURORA[p.c];
        ctx!.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx!.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
    }

    let raf = 0, last = 0, time = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      time += dt;
      draw(time, dt);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={ref} className="backdrop" aria-hidden="true" />;
}
