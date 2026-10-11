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
    const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".nav__link"));
    let navActive = "";
    let navHidden = false;
    let lastRawY = window.scrollY;
    const heroText = $("[data-hero-text]");
    const stack = $("[data-stack]");
    const laptop = $("[data-laptop]");
    // Projects rail: pinned, moved horizontally by vertical scroll.
    const hrail = $("[data-hrail]");
    const hTrack = $("[data-hrail-track]");
    const hCards = $$("[data-pcard]").map((el) => ({ el, body: el.firstElementChild as HTMLElement, c: 0, w: 1 }));
    const hIndex = $("[data-hrail-index]");
    const hBar = $("[data-hrail-bar]");
    let hTop = 0;
    let hDist = 0;
    let hSpan = 1;
    let hPad = 0;
    let hCardW = 1;
    let hWidth = 1;
    let hShown = -1;
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
    let debugSky: { force: number } | null = null;
    let lastSkySy = -1;
    let skyTick = 0;
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
      if (hrail && hTrack) {
        hTrack.style.transform = "none";
        hWidth = hTrack.clientWidth || 1;
        hCards.forEach((c) => {
          c.w = c.el.offsetWidth || 1;
          c.c = c.el.offsetLeft + c.w / 2;
        });
        hPad = parseFloat(getComputedStyle(hTrack).paddingLeft) || 0;
        // Travel from the cards themselves (scrollWidth drops a flex row's end padding):
        // the whole run of cards plus padding on both sides, minus what fits on screen.
        const lefts = hCards.map((c) => c.el.offsetLeft);
        const run = Math.max(...lefts.map((l, i) => l + hCards[i].w)) - Math.min(...lefts);
        hDist = Math.max(0, run + 2 * hPad - hWidth);
        hCardW = hCards[0]?.w ?? 1;
        // Travel is 1:1 with scroll (quick), then a short hold so the last card lands
        // fully before the page moves on.
        hSpan = hDist;
        const hold = vh * 0.2;
        const want = `${Math.round(hSpan + hold + vh)}px`;
        if (hrail.style.height !== want) hrail.style.height = want;
        hTop = absTop(hrail);
        hrail.dataset.ready = "";
      }
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

      // Nav marks the section in view…
      const probe = sy + vh * 0.4;
      const active = (["contact", "certs", "work", "about"] as const).find((k) => probe >= m![k].top) ?? "";
      const id = active === "certs" ? "certificates" : active;
      if (id !== navActive) {
        navActive = id;
        navLinks.forEach((a) => a.setAttribute("aria-current", String(a.hash === `#${id}`)));
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
      // Projects rail: the cards travel across as you scroll, on a gentle arc.
      if (hTrack && hCards.length) {
        // Follows the real scroll position, not the smoothed one, so it never lags.
        const p = hSpan ? clamp((window.scrollY - hTop) / hSpan) : 0;
        const x = -mirror * p * hDist;
        hTrack.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
        // The "current" spot slides from the start edge to the end edge with progress,
        // so the first and last cards sit level at either end and the rest arc past.
        const startC = mirror === 1 ? hPad + hCardW / 2 : hWidth - hPad - hCardW / 2;
        const endC = mirror === 1 ? hWidth - hPad - hCardW / 2 : hPad + hCardW / 2;
        const focus = lerp(startC, endC, p);
        hCards.forEach((c) => {
          const t = (c.c + x - focus) / c.w;
          const a = Math.min(Math.abs(t), 2);
          if (!c.body) return;
          c.body.style.transform = reduced
            ? ""
            : `translate3d(0,${(a * a * 22).toFixed(1)}px,0) rotate(${(t * 3.2).toFixed(2)}deg) scale(${(1 - a * 0.05).toFixed(3)})`;
          c.body.style.opacity = String(1 - a * 0.3);
        });
        const idx = Math.round(p * (hCards.length - 1));
        if (idx !== hShown && hIndex) {
          hShown = idx;
          hIndex.textContent = String(idx + 1).padStart(2, "0");
        }
        if (hBar) hBar.style.transform = `scaleX(${p.toFixed(4)})`;
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
     * The sky for a scroll position: one continuous change, never a cut. Through the
     * hero and About the black hole recedes and dissolves while a calm aurora in the
     * same light rises in its place behind the content; near Contact it gives way to
     * that section's arc.
     */
    const skyState = (sy: number, t: number): HoleState => {
      const C = m!.contact;
      const presence = 1 - smooth(0, m!.about.top + vh * 1.1, sy);
      const handOff = smooth(C.top - vh * 1.2, C.top - vh * 0.3, sy);
      return {
        presence,
        aurora: 0.42 * (1 - 0.7 * handOff),
        shape: (sy / vh) * 0.4,
        intensity: lerp(0.55, 1, presence) * (1 - 0.55 * handOff),
        mirror,
        time: t,
      };
    };

    if (process.env.NODE_ENV !== "production") {
      // Dev-only handle for inspecting the sky from the console.
      const dbg = { sky, force: -1, draw: (y: number, time: number) => sky?.draw(skyState(y, time)) };
      (window as unknown as { __sky?: unknown }).__sky = dbg;
      debugSky = dbg;
    }

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
    // Keyboard: focusing a card in the rail scrolls the page to the point where it is centred.
    const onRailFocus = (e: FocusEvent) => {
      const i = hCards.findIndex((c) => c.el.contains(e.target as Node));
      if (i < 0 || hCards.length < 2) return;
      window.scrollTo({ top: hTop + (i / (hCards.length - 1)) * hSpan, behavior: reduced ? "auto" : "smooth" });
    };
    hTrack?.addEventListener("focusin", onRailFocus);
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
      // …and tucks away while reading down, returning as soon as you scroll up.
      if (nav && m && Math.abs(target - lastRawY) > 6) {
        const hide = target > lastRawY && target > m.hero.h * 0.7;
        if (hide !== navHidden) {
          navHidden = hide;
          nav.toggleAttribute("data-hidden", hide);
        }
        lastRawY = target;
      }
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

      if (sky) {
        const scrolled = sy !== lastSkySy;
        // While the lensing map bakes, keep drawing: each draw bakes another band.
        if (!sky.ready || scrolled || skyDirty || ambient) {
          const st = skyState(debugSky && debugSky.force >= 0 ? debugSky.force : sy, t);
          // Once it is background atmosphere and the page is still, half rate is plenty.
          const halfRate = sky.ready && st.presence < 0.05 && !scrolled && !skyDirty;
          if (!halfRate || ++skyTick % 2 === 0) sky.draw(st);
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
      hTrack?.removeEventListener("focusin", onRailFocus);
      ro.disconnect();
      cancelAnimationFrame(pending);
      arc?.dispose();
      sky?.dispose();
    };
  }, []);

  return null;
}
