import type { Content } from "@/content/types";
import { CircleLink, Display, Eyebrow } from "./primitives";

export default function Hero({ hero, arrows }: { hero: Content["hero"]; arrows: Content["arrows"] }) {
  return (
    <section id="top" className="hero">
      <div className="hero__inner">
        <div className="hero__text" data-hero-text>
          <Eyebrow {...hero.eyebrow} />
          <Display as="h1" variant="hero" heading={hero.heading} />
          <p className="hero__lede">{hero.lede}</p>
          <div className="hero__actions">
            <CircleLink href="#work" arrow={arrows.forward} kind="forward">
              {hero.cta}
            </CircleLink>
            <div className="meta-line">{hero.meta}</div>
          </div>
        </div>
      </div>
      <div className="hero__rail wide-only" aria-hidden="true">
        <span className="hero__rail-line" />
        {hero.rail.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
    </section>
  );
}
