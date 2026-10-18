"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Content, GalleryCategory, Locale } from "@/content/types";
import { CATEGORIES, formatDate, imageSrc, type GalleryItem } from "@/lib/gallery";
import { localeHref } from "@/lib/paths";

type Filter = GalleryCategory | "all";
type Props = {
  items: GalleryItem[];
  g: Content["gallery"];
  arrows: Content["arrows"];
  projects: Record<string, string>;
  locale: Locale;
  rtl: boolean;
};

const withViewTransition = (fn: () => void) => {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(fn);
  else fn();
};

export default function GalleryView({ items, g, arrows, projects, locale, rtl }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const k of CATEGORIES) c[k] = items.filter((i) => i.category === k).length;
    return c;
  }, [items]);
  const shown = useMemo(() => (filter === "all" ? items : items.filter((i) => i.category === filter)), [items, filter]);
  const leadId = filter === "all" ? (items.find((i) => i.featured) ?? items[0])?.id : undefined;
  // The featured photo always opens the collage.
  const ordered = useMemo(() => {
    if (!leadId) return shown;
    const lead = shown.find((i) => i.id === leadId)!;
    return [lead, ...shown.filter((i) => i.id !== leadId)];
  }, [shown, leadId]);

  // A filter in the URL (#events) opens the page on that category.
  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(window.location.hash.slice(1)) as Filter;
      setFilter(CATEGORIES.includes(h as GalleryCategory) ? h : "all");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const choose = (f: Filter) => {
    if (f === filter) return;
    history.replaceState(null, "", f === "all" ? window.location.pathname : `#${f}`);
    withViewTransition(() => setFilter(f));
  };

  const show = useCallback((i: number) => {
    setOpen(i);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + ordered.length) % ordered.length)),
    [ordered.length],
  );

  // Keyboard: arrows follow the reading direction.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(rtl ? -1 : 1);
      else if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
      else return;
      e.preventDefault();
    };
    const onClose = () => {
      setOpen((i) => {
        if (i !== null) tiles.current[i]?.focus({ preventScroll: true });
        return null;
      });
    };
    d.addEventListener("keydown", onKey);
    d.addEventListener("close", onClose);
    return () => {
      d.removeEventListener("keydown", onKey);
      d.removeEventListener("close", onClose);
    };
  }, [rtl, step]);

  const lead = leadId ? ordered[0] : undefined;
  const current = open === null ? null : ordered[open];
  const neighbours = open === null ? [] : [ordered[(open + 1) % ordered.length], ordered[(open - 1 + ordered.length) % ordered.length]];
  const homeProjects = localeHref(locale);

  return (
    <>
      <div className="gfilters" role="toolbar" aria-label={g.eyebrow}>
        {(["all", ...CATEGORIES] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className="gfilter"
            aria-pressed={filter === f}
            onClick={() => choose(f)}
          >
            {f === "all" ? g.all : g.categories[f]}
            <span className="gfilter__n">{counts[f].toLocaleString(locale === "ar" ? "ar-SA" : "en")}</span>
          </button>
        ))}
      </div>

      <p className="gcount" aria-live="polite">
        {g.count.replace("{n}", ordered.length.toLocaleString(locale === "ar" ? "ar-SA" : "en"))}
      </p>

      {ordered.length === 0 ? (
        <div className="gempty">
          <span className="beyond__frames" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <p>{items.length === 0 ? g.empty : g.emptyFilter}</p>
          {items.length > 0 && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => choose("all")}>
              {g.all}
            </button>
          )}
        </div>
      ) : (
        <>
          {lead && (
            <figure className="glead" style={{ viewTransitionName: `g-${lead.id}` }}>
              <button
                type="button"
                className="glead__img"
                ref={(el) => {
                  tiles.current[0] = el;
                }}
                onClick={() => show(0)}
                aria-label={`${g.viewer.label}: ${lead.caption[locale]}`}
              >
                <Image
                  src={imageSrc(lead)}
                  alt=""
                  width={lead.width}
                  height={lead.height}
                  sizes="(min-width: 960px) 760px, 100vw"
                  priority
                />
              </button>
              <figcaption className="glead__cap">
                <span className="glead__num" aria-hidden="true">
                  01
                </span>
                <span className="gitem__meta">
                  {g.categories[lead.category]} · {formatDate(lead.date, locale)}
                  {lead.location && ` · ${lead.location[locale]}`}
                </span>
                <span className="glead__title">{lead.caption[locale]}</span>
                {lead.project && projects[lead.project] && (
                  <a className="text-link" href={`${homeProjects}#p-${lead.project}`}>
                    {g.relatedProject}: {projects[lead.project]} <span aria-hidden="true">{arrows.forward}</span>
                  </a>
                )}
              </figcaption>
            </figure>
          )}
          <ul className="ggrid">
            {ordered.map((item, i) =>
              item === lead ? null : (
                <li
                  key={item.id}
                  className="gitem"
                  style={{ viewTransitionName: `g-${item.id}`, "--i": i % 6, "--ar": `${item.width} / ${item.height}` } as CSSProperties}
                >
                  <button
                    type="button"
                    className="gitem__btn"
                    ref={(el) => {
                      tiles.current[i] = el;
                    }}
                    onClick={() => show(i)}
                    aria-label={`${g.viewer.label}: ${item.caption[locale]}`}
                  >
                    <Image
                      src={imageSrc(item)}
                      alt=""
                      width={item.width}
                      height={item.height}
                      sizes="(min-width: 960px) 400px, 50vw"
                      loading={i < 4 ? "eager" : "lazy"}
                    />
                    <span className="gitem__num" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="gitem__cap" aria-hidden="true">
                      <span className="gitem__meta">
                        {g.categories[item.category]} · {formatDate(item.date, locale)}
                      </span>
                      <span className="gitem__title">{item.caption[locale]}</span>
                    </span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </>
      )}

      <dialog ref={dialog} className="viewer" aria-label={g.viewer.label} onClick={(e) => e.target === e.currentTarget && close()}>
        {current && (
          <div className="viewer__inner">
            <figure
              className="viewer__figure"
              onPointerDown={(e) => {
                swipe.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                const s = swipe.current;
                swipe.current = null;
                if (!s) return;
                const dx = e.clientX - s.x;
                if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
                // Swiping towards the reading start brings the next photo, like turning a page.
                step((dx < 0) !== rtl ? 1 : -1);
              }}
            >
              <Image
                key={current.id}
                src={imageSrc(current)}
                alt={current.caption[locale]}
                width={current.width}
                height={current.height}
                sizes="100vw"
                className="viewer__img"
                draggable={false}
                priority
              />
              <figcaption className="viewer__cap">
                <span className="viewer__meta">
                  <span dir="ltr">
                    {(open! + 1).toLocaleString(locale === "ar" ? "ar-SA" : "en")} {g.viewer.of}{" "}
                    {ordered.length.toLocaleString(locale === "ar" ? "ar-SA" : "en")}
                  </span>
                  <span>{g.categories[current.category]}</span>
                  <span>{formatDate(current.date, locale)}</span>
                  {current.location && <span>{current.location[locale]}</span>}
                </span>
                <span className="viewer__title">{current.caption[locale]}</span>
                {current.project && projects[current.project] && (
                  <a className="text-link" href={`${homeProjects}#p-${current.project}`}>
                    {g.relatedProject}: {projects[current.project]} <span aria-hidden="true">{arrows.forward}</span>
                  </a>
                )}
              </figcaption>
            </figure>
            {/* Warm the neighbours so stepping through is instant. */}
            <div hidden>
              {neighbours.map((n) => (
                <Image key={n.id} src={imageSrc(n)} alt="" width={n.width} height={n.height} sizes="100vw" loading="eager" />
              ))}
            </div>
            <div className="viewer__bar">
              <button type="button" className="viewer__btn" onClick={() => step(-1)} aria-label={g.viewer.prev} disabled={ordered.length < 2}>
                <span aria-hidden="true">{arrows.back}</span>
              </button>
              <button type="button" className="viewer__btn" onClick={() => step(1)} aria-label={g.viewer.next} disabled={ordered.length < 2}>
                <span aria-hidden="true">{arrows.forward}</span>
              </button>
              <button type="button" className="viewer__btn viewer__close" onClick={close} aria-label={g.viewer.close}>
                <span aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
