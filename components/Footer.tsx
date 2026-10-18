import type { Content } from "@/content/types";
import { galleryHref, localeHref } from "@/lib/paths";

export default function Footer({ c, page }: { c: Content; page: "home" | "gallery" }) {
  const { footer, nav, arrows } = c;
  const at = (hash: string) => (page === "home" ? hash : `${localeHref(c.locale)}${hash}`);
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__id">
          <div className="footer__name">{footer.name}</div>
          <div className="footer__credit">{footer.credit}</div>
        </div>
        <nav className="footer__links" aria-label={nav.menuLabel}>
          <a href={at("#about")}>{nav.about}</a>
          <a href={at("#work")}>{nav.work}</a>
          <a href={galleryHref(c.locale)}>{nav.gallery}</a>
          <a href={at("#certificates")}>{nav.certificates}</a>
          <a href="#top">
            {footer.backToTop} <span aria-hidden="true">{arrows.up}</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
