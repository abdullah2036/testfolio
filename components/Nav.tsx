"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { Content } from "@/content/types";
import { galleryHref, localeHref } from "@/lib/paths";
import { Roll } from "./primitives";

type Page = "home" | "gallery";

const GLYPHS = "01<>/{}[]$%&?=+";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const num = (n: number, locale: string) => {
  const s = String(n).padStart(2, "0");
  return locale === "ar" ? s.replace(/\d/g, (d) => ARABIC_DIGITS[+d]) : s;
};

/** Local time in Saudi Arabia, minutes only, with a softly blinking colon. */
function Clock({ clock, className }: { clock: Content["nav"]["clock"]; className: string }) {
  const hh = useRef<HTMLSpanElement>(null);
  const mm = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => {
      const [h, m] = fmt.format(new Date()).split(":");
      if (hh.current) hh.current.textContent = h;
      if (mm.current) mm.current.textContent = m;
    };
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className={`clock ${className}`} title={clock.aria}>
      <span className="clock__label">{clock.label}</span>
      <span className="clock__time" dir="ltr" aria-hidden="true">
        <span ref={hh}>--</span>
        <span className="clock__colon">:</span>
        <span ref={mm}>--</span>
      </span>
      <span className="sr-only">{clock.aria}</span>
    </span>
  );
}

/*
 * The bar: wordmark, sections, local time, language, and the call to talk.
 *  - A liquid indicator glides to the section in view, and previews the link under the pointer.
 *  - English labels scramble through glyphs on hover and settle back (Arabic letters join, so they only glide).
 *  - A thin aurora line along the bottom fills as the page is read.
 *  - On phones the menu opens as a full sheet of large, numbered links.
 */
export default function Nav({ nav, locale, page }: { nav: Content["nav"]; locale: string; page: Page }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const headerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 960px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    document.documentElement.toggleAttribute("data-menu-open", true);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      document.documentElement.removeAttribute("data-menu-open");
    };
  }, [open]);

  useEffect(() => {
    const header = headerRef.current, list = listRef.current, ind = indRef.current;
    if (!header || !list || !ind) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const links = [...list.querySelectorAll<HTMLAnchorElement>(".nav__link")];
    let hovered: HTMLElement | null = null;

    const current = () => list.querySelector<HTMLElement>(".nav__link[aria-current]");
    const place = () => {
      const a = hovered ?? current();
      if (!a) {
        ind.style.opacity = "0";
        return;
      }
      ind.style.opacity = "1";
      ind.style.width = `${a.offsetWidth}px`;
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
      ind.dataset.mode = hovered && hovered !== current() ? "preview" : "here";
    };

    const scramble = (label: HTMLElement) => {
      if (reduced || locale === "ar" || label.dataset.busy) return;
      const text = label.dataset.text ?? label.textContent ?? "";
      label.dataset.text = text;
      label.dataset.busy = "1";
      label.style.minWidth = `${label.offsetWidth}px`;
      const start = performance.now();
      const step = (now: number) => {
        const f = (now - start) / 28;
        let out = "";
        for (let k = 0; k < text.length; k++) {
          const st = f - k * 1.2;
          out += text[k] === " " ? " " : st > 5 ? text[k] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        label.textContent = out;
        if (f < text.length * 1.2 + 5) requestAnimationFrame(step);
        else {
          label.textContent = text;
          label.style.minWidth = "";
          delete label.dataset.busy;
        }
      };
      requestAnimationFrame(step);
    };

    const enter = (e: Event) => {
      hovered = e.currentTarget as HTMLElement;
      place();
      const label = hovered.querySelector<HTMLElement>(".nav__label");
      if (label) scramble(label);
    };
    const leave = () => {
      hovered = null;
      place();
    };
    for (const a of links) {
      a.addEventListener("pointerenter", enter);
      a.addEventListener("focus", enter);
      a.addEventListener("blur", leave);
    }
    list.addEventListener("pointerleave", leave);

    // The indicator follows the section in view (Motion marks the link aria-current).
    const watch = new MutationObserver(place);
    watch.observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });

    // Reading progress along the bottom of the bar.
    let frame = 0;
    const progress = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.style.setProperty("--read", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(progress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    progress();
    place();

    return () => {
      for (const a of links) {
        a.removeEventListener("pointerenter", enter);
        a.removeEventListener("focus", enter);
        a.removeEventListener("blur", leave);
      }
      list.removeEventListener("pointerleave", leave);
      watch.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", place);
      cancelAnimationFrame(frame);
    };
  }, [locale]);

  const home = localeHref(locale);
  // On the home page, section links stay in-page; elsewhere they lead back to it.
  const at = (hash: string) => (page === "home" ? hash : `${home}${hash}`);
  const switchTo = page === "gallery" ? galleryHref(nav.switchLocale) : localeHref(nav.switchLocale);

  // Keep the reader's place when switching language, and remember the choice for "/".
  const switchLanguage = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.cookie = `lang=${nav.switchLocale}; path=/; max-age=31536000; samesite=lax`;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${switchTo}${window.location.hash}`);
  };

  const links = [
    { href: at("#about"), label: nav.about, key: "about" },
    { href: at("#work"), label: nav.work, key: "work" },
    { href: galleryHref(locale), label: nav.gallery, key: "gallery" },
    { href: at("#certificates"), label: nav.certificates, key: "certificates" },
    { href: at("#contact"), label: nav.contact, key: "contact" },
  ];

  const langLink = (
    <a
      href={switchTo}
      hrefLang={nav.switchLocale}
      lang={nav.switchLocale}
      aria-label={nav.switchAria}
      className="nav__lang"
      onClick={switchLanguage}
    >
      {nav.switchLabel}
    </a>
  );

  return (
    <header className="nav" data-nav data-open={open || undefined} ref={headerRef}>
      <div className="nav__inner">
        <a href={page === "home" ? "#top" : home} className="wordmark" onClick={close}>
          <svg className="wordmark__mark" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#39ff9f" />
                <stop offset=".5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path d="M18 48 L32 14 L46 48" fill="none" stroke="url(#logo-grad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 37 H40" fill="none" stroke="url(#logo-grad)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          {nav.wordmark}
        </a>
        <nav className="nav__links" aria-label={nav.menuLabel} ref={listRef}>
          <span className="nav__ind" ref={indRef} aria-hidden="true" />
          {links.map((l, i) => (
            <a
              key={l.key}
              href={l.href}
              className="nav__link"
              data-section={l.key}
              aria-current={page === "gallery" && l.key === "gallery" ? "page" : undefined}
            >
              <span className="nav__num" aria-hidden="true">
                {num(i + 1, locale)}
              </span>
              <span className="nav__label">{l.label}</span>
            </a>
          ))}
        </nav>
        <div className="nav__end">
          <Clock clock={nav.clock} className="nav__clock" />
          {langLink}
          <a href={at("#contact")} className="btn btn--primary btn--sm nav__cta">
            <Roll>{nav.cta}</Roll>
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-label={open ? nav.closeLabel : nav.menuLabel}
            aria-expanded={open}
            aria-controls="menu-sheet"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <span className="nav__read" aria-hidden="true" />
      <div id="menu-sheet" className="menu-sheet" hidden={!open}>
        <div className="menu-sheet__links">
          {links.map((l, i) => (
            <a key={l.key} href={l.href} onClick={close} style={{ animationDelay: `${60 + i * 45}ms` }}>
              <span className="menu-sheet__num">{num(i + 1, locale)}</span>
              <span className="menu-sheet__label">{l.label}</span>
            </a>
          ))}
        </div>
        <div className="menu-sheet__foot">
          <Clock clock={nav.clock} className="menu-sheet__clock" />
          {langLink}
        </div>
        <a href={at("#contact")} className="btn btn--primary menu-sheet__cta" onClick={close}>
          {nav.cta}
        </a>
      </div>
    </header>
  );
}
