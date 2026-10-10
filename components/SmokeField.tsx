"use client";

import { useEffect, useRef } from "react";
import { createFluid } from "@/lib/fluid";

/** Full-screen smoke that follows the pointer or finger, behind the page content. */
export default function SmokeField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fluid: ReturnType<typeof createFluid> = null;
    try {
      fluid = createFluid(canvas, {
        mobile: window.innerWidth < 900 || window.matchMedia("(pointer: coarse)").matches,
      });
    } catch (e) {
      console.warn("smoke", e);
    }
    if (!fluid) canvas.style.display = "none";
    return () => fluid?.dispose();
  }, []);

  return <canvas ref={ref} className="smoke" aria-hidden="true" />;
}
