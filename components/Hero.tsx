import type { Content } from "@/content/types";
import AsciiPortrait from "./ascii/AsciiPortrait";
import RoleMorph from "./ascii/RoleMorph";
import { Button, reveal } from "./primitives";

export default function Hero({ c }: { c: Content }) {
  const { hero, arrows } = c;
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      {/* The site's light: soft teal, blue and violet, drifting slowly behind the hero. */}
      <div className="aura" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="hero__text">
        <p className="eyebrow hero__eyebrow" {...reveal(0)}>
          {hero.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title" {...reveal(1)}>
          {hero.title} <span className="accent">{hero.accent}</span>
        </h1>
        <p className="hero__role" {...reveal(2)}>
          {hero.name}
          {c.dir === "rtl" ? "،" : ","} <RoleMorph roles={hero.roles} scramble={c.locale !== "ar"} />
        </p>
        <p className="hero__lede" {...reveal(3)}>
          {hero.lede}
        </p>
        <div className="hero__actions" {...reveal(4)}>
          <Button href="#work" arrow={arrows.forward}>
            {hero.primary}
          </Button>
          <Button href="#contact" variant="ghost">
            {hero.secondary}
          </Button>
        </div>
      </div>

      {/* The portrait in characters. In Arabic the page reads right to left, so it is mirrored
          to face the words, as it does in English. */}
      <div className="hero__ascii">
        <AsciiPortrait mirror={c.dir === "rtl"} />
      </div>
    </section>
  );
}
