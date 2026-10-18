"use client";

import { useEffect, useState, type MouseEvent } from "react";
import type { Content } from "@/content/types";
import { galleryHref, localeHref } from "@/lib/paths";
import { Roll } from "./primitives";

type Page = "home" | "gallery";

export default function Nav({ nav, locale, page }: { nav: Content["nav"]; locale: string; page: Page }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 960px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

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
    <header className="nav" data-nav data-open={open || undefined}>
      <div className="nav__inner">
        <a href={page === "home" ? "#top" : home} className="wordmark" onClick={close}>
          <svg className="wordmark__mark" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#34e6be" />
                <stop offset=".5" stopColor="#40b4f0" />
                <stop offset="1" stopColor="#a07bff" />
              </linearGradient>
            </defs>
            <path d="M18 48 L32 14 L46 48" fill="none" stroke="url(#logo-grad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 37 H40" fill="none" stroke="url(#logo-grad)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          {nav.wordmark}
        </a>
        <nav className="nav__links" aria-label={nav.menuLabel}>
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              className="nav__link"
              data-section={l.key}
              aria-current={page === "gallery" && l.key === "gallery" ? "page" : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__end">
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
      <div id="menu-sheet" className="menu-sheet" hidden={!open}>
        {links.map((l, i) => (
          <a key={l.key} href={l.href} onClick={close} style={{ transitionDelay: `${i * 30}ms` }}>
            {l.label}
          </a>
        ))}
        <a href={at("#contact")} className="btn btn--primary menu-sheet__cta" onClick={close}>
          {nav.cta}
        </a>
      </div>
    </header>
  );
}
