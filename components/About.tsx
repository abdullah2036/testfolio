import type { Content } from "@/content/types";
import { SectionHead, reveal } from "./primitives";

/** About, as a short note and the three steps every project goes through. */
export default function About({ about, locale }: { about: Content["about"]; locale: string }) {
  const num = (i: number) => (i + 1).toLocaleString(locale === "ar" ? "ar-SA" : "en", { minimumIntegerDigits: 2 });
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <SectionHead id="about-title" eyebrow={about.eyebrow} title={about.title} body={about.body} />
      <ol className="steps">
        {about.steps.map((s, i) => (
          <li key={s.title} className="step" data-glow {...reveal(i)}>
            <span className="step__num">{num(i)}</span>
            <h3 className="step__title">{s.title}</h3>
            <p className="step__text">{s.text}</p>
            <span className="step__line" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}
