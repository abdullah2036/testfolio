"use client";

import { useEffect, useState, type MouseEvent } from "react";
import type { Content } from "@/content/types";
import { localeHref } from "@/lib/paths";

export default function Nav({ nav }: { nav: Content["nav"] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 900px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  // Keep the reader's place when switching language, and remember the choice for "/".
  const switchLanguage = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.cookie = `lang=${nav.switchLocale}; path=/; max-age=31536000; samesite=lax`;
    // A full load on purpose: the document's lang/dir flip and the motion engine re-measures from scratch.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${localeHref(nav.switchLocale)}${window.location.hash}`);
  };

  const links = [
    { href: "#about", label: nav.about },
    { href: "#work", label: nav.work },
    { href: "#certificates", label: nav.certificates },
    { href: "#contact", label: nav.contact },
  ];

  const langLink = (className: string) => (
    <a
      href={localeHref(nav.switchLocale)}
      hrefLang={nav.switchLocale}
      lang={nav.switchLocale}
      aria-label={nav.switchAria}
      className={className}
      onClick={switchLanguage}
    >
      {nav.switchLabel}
    </a>
  );

  return (
    <>
      <header className="nav" data-nav data-open={open || undefined}>
        <div className="nav__inner">
          <a href="#top" className="wordmark" onClick={close}>
            {nav.wordmark}
          </a>
          <nav className="nav__links wide-only">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="nav__link">
                {l.label}
              </a>
            ))}
            <a href="#contact" className="pill pill--nav">
              {nav.cta}
            </a>
            {langLink("nav__lang")}
          </nav>
          <div className="nav__narrow narrow-only">
            {langLink("nav__lang")}
            <button
              type="button"
              className="menu-btn"
              aria-label={nav.menuLabel}
              aria-expanded={open}
              aria-controls="menu-sheet"
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div id="menu-sheet" className="menu-sheet narrow-only">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
