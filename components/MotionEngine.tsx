"use client";

import { useEffect } from "react";
import { createArc, type Arc } from "@/lib/ribbon";
import { createBlackHole, type BlackHole, type HoleState } from "@/lib/blackhole";

/*
 * One rAF loop drives every scroll effect on the page. The page scrolls natively;
 * effects read a smoothed copy of scrollY so they glide behind wheel steps.
 * Only transform and opacity are written, and only when the smoothed value moves.
 * Layout is measured on mount, resize and font load, never per frame.
 */

const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => {
  const s = clamp((x - a) / (b - a));
  return s * s * (3 - 2 * s);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Holds on each integer and eases between them. */
const stair = (q: number, max: number) => {
  const f = Math.floor(q);
  return Math.min(max, f + smooth(0.28, 0.72, q - f));
};

type Box = { top: number; h: number };
type Reveal = { el: HTMLElement; top: number; d: number; cert: boolean; a: number };

const absTop = (el: HTMLElement | null) => {
  let y = 0;
  while (el) {
    y += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
  }
  return y;
};

export default function MotionEngine() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-root]");
    if (!root) return;
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s);
    const $$ = <T extends HTMLElement = HTMLElement>(s: string) => Array.from(root.querySelectorAll<T>(s));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mirror: 1 | -1 = document.documentElement.dir === "rtl" ? -1 : 1;
    const touch = "ontouchstart" in window;

    const nav = document.querySelector<HTMLElement>("[data-nav]");
    const heroText = $("[data-hero-text]");
    const stack = $("[data-stack]");
    const laptop = $("[data-laptop]");
    // DOM order is bottom → top of the stack; data-plate is the step the plate stands for.
    const plates = $$("[data-plate]").map((el) => ({
      el,
      step: Number(el.dataset.plate),
      glow: el.querySelector<HTMLElement>("[data-glow]"),
    }));
    const steps = $$("[data-step]");
    const stepBars = $$("[data-stepbar]");

    let wide = window.innerWidth >= 900;
    let vh = window.innerHeight;
    let m: Record<"hero" | "about" | "work" | "certs" | "contact", Box> | null = null;
    let maxSy = 0;
    let laptopTop = 0;
    let reveals: Reveal[] = [];
    let dirty = true;
    let solid: boolean | null = null;

    // Contact: the original flower-like arc ribbon, drawn in its own section.
    let arc: Arc | null = null;
    const arcCanvas = $<HTMLCanvasElement>("canvas[data-arc]");
    if (arcCanvas) {
      try {
        arc = createArc(arcCanvas);
        if (arc) requestAnimationFrame(() => arcCanvas.classList.add("is-ready"));
        else arcCanvas.style.display = "none";
      } catch (e) {
        console.warn("arc", e);
        arcCanvas.style.display = "none";
      }
    }
    let arcDirty = true;

    // Sky: light bending round a black hole behind the hero, then the same light,
    // with gravity relaxed, as a faint moving field behind the rest of the page.
    let sky: BlackHole | null = null;
    const skyCanvas = $<HTMLCanvasElement>("canvas[data-sky]");
    if (skyCanvas) {
      try {
        sky = createBlackHole(skyCanvas, {
          mobile: window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches,
        });
        if (sky) requestAnimationFrame(() => skyCanvas.classList.add("is-ready"));
        else skyCanvas.style.display = "none";
      } catch (e) {
        console.warn("sky", e);
        skyCanvas.style.display = "none";
      }
    }
    let skyDirty = true;
    let lastSkySy = -1;
    let skyTick = 0;
    let skyCleared = false;
    let quality = 1;
    let lowPower = false;
    let lastArcScroll = -1;

    const measure = () => {
      vh = window.innerHeight;
      wide = window.innerWidth >= 900;
      const box = (id: string): Box => {
        const e = document.getElementById(id);
        return e ? { top: absTop(e), h: e.offsetHeight } : { top: 0, h: 1 };
      };
      m = { hero: box("top"), about: box("about"), work: box("work"), certs: box("certificates"), contact: box("contact") };
      maxSy = Math.max(0, document.documentElement.scrollHeight - vh);
      laptopTop = laptop ? absTop(laptop) : 0;
      reveals = $$("[data-reveal]").map((el) => ({
        el,
        top: absTop(el),
        d: Number(el.dataset.reveal) || 0,
        cert: el.hasAttribute("data-cert"),
        a: -1,
      }));
      arc?.resize(wide, quality);
      sky?.resize(quality);
      dirty = arcDirty = skyDirty = true;
    };

    const apply = (sy: number) => {
      if (!m) return;

      // Nav goes solid after 10px.
      const s = sy > 10;
      if (nav && s !== solid) {
        solid = s;
        nav.toggleAttribute("data-solid", s);
      }

      // Hero
      const hp = clamp(sy / Math.max(1, m.hero.h));
      if (heroText) {
        heroText.style.opacity = String(1 - smooth(0.05, 0.6, hp));
        heroText.style.transform = `translate3d(0,${sy * 0.22}px,0)`;
      }

      // About: exploding layer stack
      const A = m.about;
      const ap = clamp((sy - A.top) / Math.max(1, A.h - vh));
      const e = smooth(0, 0.22, ap);
      const gap = wide ? 62 : 40;
      const qa = stair(clamp((ap - 0.2) / 0.72) * 3, 3);
      if (stack) stack.style.transform = `rotateX(56deg) rotateZ(${-40 * mirror}deg) translate3d(0,0,${-1.5 * gap * e}px)`;
      const lit = smooth(0.1, 0.24, ap);
      plates.forEach((pl, i) => {
        const g = clamp(1 - Math.abs(qa - pl.step) * 1.3) * lit;
        pl.el.style.transform = `translate3d(0,0,${i * gap * e + g * 12}px)`;
        pl.el.style.opacity = String(0.5 + 0.5 * Math.max(g, 1 - e));
        if (pl.glow) pl.glow.style.opacity = String(g);
      });
      steps.forEach((st, i) => {
        const o = clamp(1 - Math.abs(qa - i) * 2.2);
        st.style.opacity = String(o);
        st.style.transform = `translate3d(0,${(i - qa) * 22}px,0)`;
        st.style.visibility = o < 0.01 ? "hidden" : "visible";
      });
      stepBars.forEach((b, i) => (b.style.transform = `scaleX(${clamp(qa - i + 1)})`));

      // Projects: the laptop settles from a tilt as it comes up the screen.
      const pre = clamp((sy - (laptopTop - vh)) / (vh * 0.7));
      if (laptop) {
        const rx = wide ? 22 - 14 * pre : 14 - 9 * pre;
        const ry = (wide ? -28 + 12 * pre : -10 + 5 * pre) * mirror;
        laptop.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0,${(1 - pre) * 40}px,0)`;
      }
      // Scroll reveals
      reveals.forEach((r) => {
        // Anything still short of fully shown at the very bottom of the page finishes there.
        const top = Math.min(r.top + r.d * vh * 0.05, maxSy + vh * 0.58);
        const rel = (sy + vh * 0.94 - top) / (vh * 0.32);
        const a = reduced ? 1 : smooth(0, 1, rel);
        if (Math.abs(a - r.a) < 0.001) return;
        r.a = a;
        const k = 1 - a;
        r.el.style.opacity = String(a);
        r.el.style.transform = r.cert
          ? `translate3d(0,${k * 70}px,0) rotateX(${k * 22}deg) rotateY(${k * -16 * mirror}deg) rotateZ(${k * 3 * mirror}deg)`
          : `translate3d(0,${k * 40}px,0)`;
      });
    };

    /*
     * The sky for a scroll position. In the hero the hole sits on the far side (top on
     * phones) with light streaming round it. Leaving the hero, the hole fades so slowly
     * it is hard to notice, gravity relaxes, and the same streams drift toward the
     * middle as a dim field that keeps flowing and reshapes as you read; near Contact
     * it gives way to that section's own arc.
     */
    const skyState = (sy: number, t: number): HoleState => {
      const H = m!.hero;
      const C = m!.contact;
      const k = smooth(0, H.h * 1.15, sy);
      const away = smooth(0.15, 1, k);
      const pv = sy / vh;
      const aspect = window.innerWidth / vh;
      const hero = wide ? [aspect * 0.5 + 0.13, 0.05, 0.42] : [aspect * 0.5 + 0.04, 0.34, 0.22];
      const mid = wide ? [aspect * 0.18, -0.05, 0.5] : [0.05, 0.05, 0.3];
      const handOff = smooth(C.top - vh * 1.1, C.top - vh * 0.35, sy);
      return {
        center: [lerp(hero[0], mid[0], away), lerp(hero[1], mid[1], away)],
        radius: lerp(hero[2], mid[2], away),
        hole: 1 - smooth(0.05, 0.9, k),
        relax: away * (0.62 + 0.28 * Math.sin(pv * 0.45)),
        turn: away * (0.35 * Math.sin(pv * 0.28) - 0.25),
        intensity: lerp(1, 0.3, away) * (1 - handOff),
        mirror,
        time: t,
      };
    };

    // Resize: ignore mobile URL-bar height changes.
    let lw = window.innerWidth;
    let lh = window.innerHeight;
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (touch && w === lw && Math.abs(h - lh) < 160) return;
      lw = w;
      lh = h;
      measure();
    };
    window.addEventListener("resize", onResize, { passive: true });
    // Re-measure when the page's height changes (images, fonts), batched to one per frame.
    let pending = 0;
    const ro = new ResizeObserver(() => {
      if (!pending) pending = requestAnimationFrame(() => ((pending = 0), measure()));
    });
    ro.observe(root);
    measure();
    document.fonts?.ready.then(measure);
    const late = window.setTimeout(measure, 700);

    let sy = window.scrollY;
    let lastSy: number | null = null;
    let last = performance.now();
    let t = 7;
    let frameAvg = 16;
    let frames = 0;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, Math.max(0, now - last));
      last = now;
      const target = window.scrollY;
      if (reduced) sy = target;
      else {
        sy += (target - sy) * (1 - Math.exp(-dt / 70));
        if (Math.abs(target - sy) < 0.2) sy = target;
      }
      if (sy !== lastSy || dirty) {
        apply(sy);
        lastSy = sy;
        dirty = false;
      }

      if (!m) return;
      const ambient = !reduced && !lowPower;
      if (ambient) t += dt / 1000;

      // Contact arc: draws only while its section is on screen.
      if (arc && arc.visible) {
        const sc = clamp((sy - (m.contact.top - vh)) / (vh * 1.5));
        if (ambient || arcDirty || sc !== lastArcScroll) {
          arc.draw(t, sc, wide, mirror);
          lastArcScroll = sc;
          arcDirty = false;
        }
      }

      if (sky && sky.ready) {
        const scrolled = sy !== lastSkySy;
        if (scrolled || skyDirty || ambient) {
          const st = skyState(sy, t);
          // Once the hole is gone and the field is dim, the drift renders at half rate.
          const halfRate = st.hole < 0.01 && !scrolled && !skyDirty;
          if (st.intensity < 0.003 && st.hole < 0.003) {
            if (!skyCleared) {
              sky.draw(st);
              skyCleared = true;
            }
          } else if (!halfRate || ++skyTick % 2 === 0) {
            sky.draw(st);
            skyCleared = false;
          }
          lastSkySy = sy;
          skyDirty = false;
        }
      }

      // Adaptive quality: drop resolution, then stop ambient motion.
      if (dt > 0) {
        frameAvg = frameAvg * 0.92 + dt * 0.08;
        if (++frames > 40 && frameAvg > 26) {
          frames = 0;
          frameAvg = 16;
          if (quality > 0.5) {
            quality *= 0.8;
            arc?.resize(wide, quality);
            sky?.resize(quality);
          } else lowPower = true;
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(pending);
      arc?.dispose();
      sky?.dispose();
    };
  }, []);

  return null;
}
