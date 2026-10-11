import type { CSSProperties } from "react";
import type { Content } from "@/content/types";
import { CircleLink, Display, Eyebrow, Roll } from "./primitives";

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
          <p className="body-text body-text--contact" data-anim="rise" style={{ "--d": "0.45s" } as CSSProperties}>
            {contact.body}
          </p>
          <a className="email" href={mailto} dir="ltr" data-anim="rise" style={{ "--d": "0.55s" } as CSSProperties}>
            <Roll>{contact.email}</Roll>
          </a>
          <div className="contact__actions" data-anim="rise" style={{ "--d": "0.65s" } as CSSProperties}>
            <CircleLink href={mailto} arrow={arrows.forward} className="contact__cta">
              {contact.cta}
            </CircleLink>
            {contact.socials.map((s) => (
              <a key={s.href} className="pill" href={s.href} target="_blank" rel="noopener">
                <Roll>{s.label}</Roll>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
