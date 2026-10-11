import type { CSSProperties } from "react";
import type { Content } from "@/content/types";
import { CircleLink, Display, Eyebrow } from "./primitives";

export default function Hero({ hero, arrows }: { hero: Content["hero"]; arrows: Content["arrows"] }) {
  return (
    <section id="top" className="hero">
      <div className="hero__inner">
        <div className="hero__text" data-hero-text>
          <Eyebrow {...hero.eyebrow} delay={0.15} />
          <Display as="h1" variant="hero" heading={hero.heading} delay={0.25} />
          <p className="hero__lede" data-anim="rise" style={{ "--d": "0.62s" } as CSSProperties}>
            {hero.lede}
          </p>
          <div className="hero__actions" data-anim="rise" style={{ "--d": "0.78s" } as CSSProperties}>
            <CircleLink href="#work" arrow={arrows.forward} kind="forward">
              {hero.cta}
            </CircleLink>
            <div className="meta-line">{hero.meta}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
