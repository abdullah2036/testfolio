import type { Content } from "@/content/types";
import { CircleLink, Display, Eyebrow } from "./primitives";

export default function Contact({ contact, arrows }: { contact: Content["contact"]; arrows: Content["arrows"] }) {
  const mailto = `mailto:${contact.email}`;
  return (
    <section id="contact" className="contact">
      <canvas className="arc" data-arc aria-hidden="true" />
      <div className="contact__scrim" aria-hidden="true" />
      <div className="contact__inner">
        <div className="contact__text">
          <Eyebrow {...contact.eyebrow} reveal={0} />
          <Display heading={contact.heading} variant="contact" reveal={1} />
          <p className="body-text body-text--contact" data-reveal={2}>
            {contact.body}
          </p>
          <a className="email" href={mailto} dir="ltr" data-reveal={3}>
            {contact.email}
          </a>
          <div className="contact__actions" data-reveal={4}>
            <CircleLink href={mailto} arrow={arrows.forward} className="contact__cta">
              {contact.cta}
            </CircleLink>
            {contact.socials.map((s) => (
              <a key={s.href} className="pill" href={s.href} target="_blank" rel="noopener">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
