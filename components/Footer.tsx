import type { Content } from "@/content/types";

export default function Footer({
  footer,
  nav,
  arrows,
}: {
  footer: Content["footer"];
  nav: Content["nav"];
  arrows: Content["arrows"];
}) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__id">
          <div className="footer__name">{footer.name}</div>
          <div className="footer__credit">{footer.credit}</div>
        </div>
        <nav className="footer__links">
          <a href="#about">{nav.about}</a>
          <a href="#work">{nav.work}</a>
          <a href="#certificates">{nav.certificates}</a>
          <a href="#top">
            {footer.backToTop} {arrows.up}
          </a>
        </nav>
      </div>
    </footer>
  );
}
