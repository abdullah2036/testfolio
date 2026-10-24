"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01<>/{}[]$%&?=+";

/**
 * The role beside the name, taking turns every few seconds and alternating between the mono
 * and serif voices. Latin roles scramble into the next one character by character; Arabic
 * letters join, so they cross-fade instead. Screen readers get the full list once.
 */
export default function RoleMorph({ roles, scramble }: { roles: string[]; scramble: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || roles.length < 2) return;
    let i = 0, raf = 0;

    const show = (next: number) => {
      el.dataset.voice = next % 2 ? "serif" : "mono";
      const to = roles[next];
      if (!scramble) {
        el.textContent = to;
        el.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 520, easing: "ease-out" });
        return;
      }
      const from = el.textContent ?? "";
      const start = performance.now();
      const step = (now: number) => {
        const f = (now - start) / 42;
        let out = "";
        for (let k = 0; k < to.length; k++) {
          const st = f - k * 1.6;
          out += st > 7 ? to[k] : st > 0 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : (from[k] ?? " ");
        }
        el.textContent = out;
        if (f < to.length * 1.6 + 8) raf = requestAnimationFrame(step);
        else el.textContent = to;
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    };

    const timer = window.setInterval(() => {
      i = (i + 1) % roles.length;
      show(i);
    }, 3200);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, [roles, scramble]);

  return (
    <>
      <span ref={ref} className="morph" data-voice="mono" aria-hidden="true">
        {roles[0]}
      </span>
      <span className="sr-only">{roles.join(", ")}</span>
    </>
  );
}
