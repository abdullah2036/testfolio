import type { Content } from "@/content/types";
import { Button, Roll, reveal } from "./primitives";

export default function Contact({ contact, arrows }: { contact: Content["contact"]; arrows: Content["arrows"] }) {
  const mailto = `mailto:${contact.email}`;
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="contact__card" data-glow>
        <p className="eyebrow" {...reveal(0)}>
          {contact.eyebrow}
        </p>
        <h2 id="contact-title" className="contact__title" {...reveal(1)}>
          {contact.title} <span className="accent">{contact.accent}</span>
        </h2>
        <p className="shead__body" {...reveal(2)}>
          {contact.body}
        </p>
        <a className="email" href={mailto} dir="ltr" {...reveal(3)}>
          <Roll>{contact.email}</Roll>
        </a>
        <div className="contact__actions" {...reveal(4)}>
          <Button href={mailto} arrow={arrows.forward}>
            {contact.cta}
          </Button>
          {contact.socials.map((s) => (
            <Button key={s.href} href={s.href} variant="ghost" external>
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
