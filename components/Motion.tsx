"use client";

import { useEffect } from "react";

/*
 * All the page's behaviour in one place, with no React state and no work while idle:
 *  - Reveals: [data-reveal] elements get .is-in once they enter the viewport; CSS does the motion.
 *  - Timelines: the rail fills as you scroll past it, and each item lights up as it's reached.
 *  - Glow: cards with [data-glow] keep a soft light under the pointer (mouse and pen only).
 *  - Nav: marks the section in view, and gains a backdrop once the page has scrolled.
 *  - Loops (mosaic, tape) pause while off screen.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("anim-ready");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const line = vh * 0.62;
      nav?.toggleAttribute("data-scrolled", window.scrollY > 8);
      for (const t of timelines) {
        const r = t.el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const p = reduced ? 1 : Math.min(1, Math.max(0, (line - r.top) / r.height));
        if (t.fill) t.fill.style.transform = `scaleY(${p.toFixed(4)})`;
        for (const item of t.items) item.toggleAttribute("data-lit", reduced || item.getBoundingClientRect().top < line);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

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
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
