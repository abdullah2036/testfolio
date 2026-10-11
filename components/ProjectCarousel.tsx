"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const cardsOf = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-pcard]"));

/** Index of the card closest to the rail's centre. */
function nearestCard(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  const centre = box.left + box.width / 2;
  let best = 0;
  let bestDist = Infinity;
  cardsOf(el).forEach((c, i) => {
    const r = c.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - centre);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** Scrolls so card i sits in the centre; on-screen rects make it work in both reading directions. */
function scrollToCard(el: HTMLElement, i: number) {
  const card = cardsOf(el)[i];
  if (!card) return;
  const box = el.getBoundingClientRect();
  const r = card.getBoundingClientRect();
  el.scrollBy({ left: r.left + r.width / 2 - (box.left + box.width / 2), behavior: "smooth" });
}

/*
 * A horizontal project rail. Scrolling is native (touch swipe, trackpad, shift+wheel,
 * arrow keys) with CSS snap, so it is as fast and smooth as the browser allows; this
 * component only adds:
 *   - a gentle coverflow: cards turn and recede with distance from the centre
 *   - mouse drag on desktop, with a snap to the nearest card on release
 *   - previous/next buttons and dots
 * All positions come from on-screen rects, so it behaves the same in RTL.
 */
export default function ProjectCarousel({
  children,
  count,
  labels,
  arrows,
}: {
  children: ReactNode;
  count: number;
  labels: { prev: string; next: string; goTo: string; region: string };
  arrows: { prev: string; next: string };
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      let best = 0;
      let bestDist = Infinity;
      cardsOf(el).forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const t = (r.left + r.width / 2 - centre) / r.width;
        const a = Math.min(Math.abs(t), 1.6);
        if (Math.abs(t) < bestDist) {
          bestDist = Math.abs(t);
          best = i;
        }
        const body = card.firstElementChild as HTMLElement | null;
        if (!body || reduced) return;
        body.style.transform = `rotateY(${(-t * 14).toFixed(2)}deg) translateZ(${(-a * 60).toFixed(1)}px) scale(${(1 - a * 0.04).toFixed(3)})`;
        body.style.opacity = String(1 - a * 0.28);
      });
      setActive(best);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    // Mouse drag (touch and trackpads already scroll natively).
    let dragging = false;
    let moved = 0;
    let startX = 0;
    let startScroll = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4 && !el.classList.contains("is-dragging")) {
        el.classList.add("is-dragging");
        el.setPointerCapture(e.pointerId);
      }
      if (el.classList.contains("is-dragging")) el.scrollLeft = startScroll - dx;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      if (!el.classList.contains("is-dragging")) return;
      el.classList.remove("is-dragging");
      scrollToCard(el, nearestCard(el));
    };
    // A drag should not also count as a click on the card underneath.
    const click = (e: MouseEvent) => {
      if (moved > 4) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("click", click, true);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", click, true);
    };
  }, []);

  const snapTo = (i: number) => track.current && scrollToCard(track.current, i);

  return (
    <div className="carousel" role="region" aria-roledescription="carousel" aria-label={labels.region}>
      <div className="carousel__track" ref={track} tabIndex={0}>
        {children}
      </div>
      <div className="carousel__controls">
        <button
          type="button"
          className="carousel__btn"
          aria-label={labels.prev}
          disabled={active === 0}
          onClick={() => snapTo(Math.max(0, active - 1))}
        >
          <span aria-hidden="true">{arrows.prev}</span>
        </button>
        <div className="carousel__dots">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className="carousel__dot"
              aria-label={`${labels.goTo} ${i + 1}`}
              aria-current={i === active || undefined}
              onClick={() => snapTo(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="carousel__btn"
          aria-label={labels.next}
          disabled={active === count - 1}
          onClick={() => snapTo(Math.min(count - 1, active + 1))}
        >
          <span aria-hidden="true">{arrows.next}</span>
        </button>
      </div>
    </div>
  );
}
