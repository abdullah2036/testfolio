"use client";

import { useEffect } from "react";

/*
 * All the page's behaviour in one place, with no React state and no work while idle:
 *  - Reveals: [data-reveal] elements get .is-in once they enter the viewport; CSS does the motion.
 *  - Timelines: the rail fills as you scroll past it, and each item lights up as it's reached.
 *  - Glow: cards with [data-glow] keep a soft light under the pointer (mouse and pen only).
 *  - Nav: marks the section in view, and gains a backdrop once the page has scrolled.
 *  - Loops (mosaic, tape) pause while off screen.
 *  - Phone project row: glides sideways with the vertical scroll until it's swiped.
 *  - Loading screen: fades out once the page has loaded (at least briefly shown).
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("anim-ready");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Loading screen: shown for at least ~0.7 s, gone once everything has loaded (or after 2.5 s).
    const loader = document.querySelector<HTMLElement>("[data-loader]");
    let loaded = false;
    const finishLoading = () => {
      if (loaded) return;
      loaded = true;
      window.setTimeout(() => {
        loader?.classList.add("is-done");
        root.classList.remove("is-loading");
      }, Math.max(0, 700 - performance.now()));
    };
    if (document.readyState === "complete") finishLoading();
    else window.addEventListener("load", finishLoading, { once: true });
    const loadCap = window.setTimeout(finishLoading, 2500);

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          reveal.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    const pause = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.toggleAttribute("data-paused", !e.isIntersecting);
    });
    document.querySelectorAll("[data-pause-offscreen], [data-mosaic]").forEach((el) => pause.observe(el));

    // Section in view → nav link marked current.
    const links = new Map<string, HTMLElement>();
    document.querySelectorAll<HTMLElement>("[data-nav] .nav__link[data-section]").forEach((a) => links.set(a.dataset.section!, a));
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const link = links.get(e.target.id);
          if (!link || link.getAttribute("aria-current") === "page") continue;
          if (e.isIntersecting) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach((_, id) => {
      const s = document.getElementById(id);
      if (s) spy.observe(s);
    });

    // Scroll-linked work, batched into one frame.
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    const timelines = [...document.querySelectorAll<HTMLElement>("[data-timeline]")].map((el) => ({
      el,
      fill: el.querySelector<HTMLElement>("[data-timeline-fill]"),
      items: [...el.querySelectorAll<HTMLElement>(".tl")],
    }));
    // Phone project row. While "linked" it follows the vertical scroll (no snapping, so it
    // moves freely); the moment it's touched it becomes an ordinary swipeable row.
    const phone = window.matchMedia("(max-width: 759px)");
    const rtl = root.dir === "rtl";
    const rails = [...document.querySelectorAll<HTMLElement>("[data-prail]")].map((el) => ({
      el,
      bar: el.parentElement?.querySelector<HTMLElement>("[data-prail-bar]") ?? null,
      cards: [...el.children] as HTMLElement[],
      linked: true,
      x: 0,
    }));
    const release = (r: (typeof rails)[number]) => {
      r.linked = false;
      r.el.style.scrollSnapType = "";
    };
    const paintRail = (r: (typeof rails)[number]) => {
      const max = r.el.scrollWidth - r.el.clientWidth;
      const at = Math.abs(r.el.scrollLeft);
      const frac = r.el.clientWidth / r.el.scrollWidth;
      if (r.bar) {
        r.bar.style.width = `${(frac * 100).toFixed(2)}%`;
        const shift = max > 0 ? (at / max) * ((1 - frac) / frac) * 100 : 0;
        r.bar.style.transform = `translateX(${rtl ? -shift : shift}%)`;
      }
      if (reduced) return;
      // Cards ease up to full size as they reach the middle of the row.
      const box = r.el.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      for (const c of r.cards) {
        const cb = c.getBoundingClientRect();
        const d = Math.min(1, Math.abs(cb.left + cb.width / 2 - mid) / cb.width);
        c.style.transform = `scale(${(1 - 0.05 * d).toFixed(3)})`;
        c.style.opacity = (1 - 0.3 * d).toFixed(3);
      }
    };
    const clearRail = (r: (typeof rails)[number]) => {
      r.el.style.scrollSnapType = "";
      for (const c of r.cards) {
        c.style.transform = "";
        c.style.opacity = "";
      }
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      let again = false;
      const vh = window.innerHeight;
      for (const r of rails) {
        if (!phone.matches) {
          clearRail(r);
          continue;
        }
        const box = r.el.getBoundingClientRect();
        const max = r.el.scrollWidth - r.el.clientWidth;
        if (box.bottom < 0 || box.top > vh) {
          // Off screen: next time it comes into view, it follows the scroll again.
          if (!r.linked) {
            r.linked = true;
            r.x = Math.abs(r.el.scrollLeft);
          }
          continue;
        }
        if (r.linked && !reduced && max > 0) {
          const p = Math.min(1, Math.max(0, (vh * 0.8 - box.top) / (vh * 0.6)));
          const target = p * max;
          r.x += (target - r.x) * 0.2;
          if (Math.abs(target - r.x) < 0.5) r.x = target;
          else again = true;
          r.el.style.scrollSnapType = "none";
          r.el.scrollLeft = rtl ? -r.x : r.x;
        }
        paintRail(r);
      }
      const line = vh * 0.62;
      nav?.toggleAttribute("data-scrolled", window.scrollY > 8);
      for (const t of timelines) {
        const r = t.el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const p = reduced ? 1 : Math.min(1, Math.max(0, (line - r.top) / r.height));
        if (t.fill) t.fill.style.transform = `scaleY(${p.toFixed(4)})`;
        for (const item of t.items) item.toggleAttribute("data-lit", reduced || item.getBoundingClientRect().top < line);
      }
      if (again) frame = requestAnimationFrame(update);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    const offs: (() => void)[] = [];
    for (const r of rails) {
      const grab = () => release(r);
      const moved = () => {
        if (!r.linked) onScroll();
      };
      r.el.addEventListener("touchstart", grab, { passive: true });
      r.el.addEventListener("pointerdown", grab, { passive: true });
      r.el.addEventListener("wheel", grab, { passive: true });
      r.el.addEventListener("scroll", moved, { passive: true });
      offs.push(() => {
        r.el.removeEventListener("touchstart", grab);
        r.el.removeEventListener("pointerdown", grab);
        r.el.removeEventListener("wheel", grab);
        r.el.removeEventListener("scroll", moved);
      });
    }

    // Pointer light on cards.
    let lit: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = (e.target as Element).closest<HTMLElement>("[data-glow]");
      if (lit && lit !== el) lit.removeAttribute("data-glowing");
      lit = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
      el.setAttribute("data-glowing", "");
    };
    if (!reduced) document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      reveal.disconnect();
      pause.disconnect();
      spy.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(loadCap);
      window.removeEventListener("load", finishLoading);
      offs.forEach((off) => off());
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
