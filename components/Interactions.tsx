"use client";

import { useEffect } from "react";

/*
 * Two light-weight behaviours, no per-frame work and no React state:
 *  - Entrance reveals: every [data-anim] element gets .is-in once it enters the
 *    viewport; CSS does the motion (transforms, clip-path, opacity only).
 *  - Magnetic CTAs: [data-magnetic] links lean their round button toward the pointer.
 */
export default function Interactions() {
  useEffect(() => {
    // Transitions are enabled only now, so nothing animates during hydration.
    document.documentElement.classList.add("anim-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-anim]").forEach((el) => io.observe(el));

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current: HTMLElement | null = null;
    const release = () => {
      if (!current) return;
      current.style.setProperty("--mx", "0px");
      current.style.setProperty("--my", "0px");
      current = null;
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-magnetic]");
      if (el !== current) release();
      if (!el) return;
      current = el;
      const circle = el.querySelector(".circle")?.getBoundingClientRect();
      if (!circle) return;
      const dx = e.clientX - (circle.left + circle.width / 2);
      const dy = e.clientY - (circle.top + circle.height / 2);
      const pull = (v: number) => Math.max(-10, Math.min(10, v * 0.32));
      el.style.setProperty("--mx", `${pull(dx).toFixed(1)}px`);
      el.style.setProperty("--my", `${pull(dy).toFixed(1)}px`);
    };
    if (fine && !reduced) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", release);
    }

    return () => {
      io.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", release);
    };
  }, []);

  return null;
}
