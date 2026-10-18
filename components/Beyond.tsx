import Image from "next/image";
import type { Content, Locale } from "@/content/types";
import { featuredItem, galleryItems, imageSrc, metaLine } from "@/lib/gallery";
import { galleryHref } from "@/lib/paths";
import { Button, SectionHead, reveal } from "./primitives";

/** "Beyond the screen": the gallery's featured photograph, a couple of others, and the way in. */
export default function Beyond({ c }: { c: Content }) {
  const { beyond, arrows } = c;
  const locale = c.locale as Locale;
  const lead = featuredItem();
  // Then the first photo of two other events, so the preview shows the range.
  const others = galleryItems
    .filter((i, k, all) => i.event !== lead?.event && all.findIndex((j) => j.event === i.event) === k)
    .slice(0, 2);
  const href = galleryHref(locale);

  return (
    <section id="beyond" className="section beyond" aria-labelledby="beyond-title">
      <SectionHead id="beyond-title" eyebrow={beyond.eyebrow} title={beyond.title} accent={beyond.accent} body={beyond.body}>
        <div className="shead__action" {...reveal(3)}>
          <Button href={href} arrow={arrows.forward}>
            {beyond.cta}
          </Button>
        </div>
      </SectionHead>

      {lead ? (
        <div className={`beyond__grid beyond__grid--${others.length}`}>
          {[lead, ...others].map((item, i) => (
            <a key={item.id} href={`${href}#${item.event}`} className={`photo ${i === 0 ? "photo--lead" : ""}`} {...reveal(i)}>
              <Image
                src={imageSrc(item)}
                alt={item.caption[locale]}
                width={item.width}
                height={item.height}
                sizes={i === 0 ? "(min-width: 960px) 760px, 100vw" : "(min-width: 960px) 380px, 50vw"}
              />
              <span className="photo__cap">
                <span className="photo__meta">{metaLine(item, locale)}</span>
                <span className="photo__title">{item.caption[locale]}</span>
              </span>
            </a>
          ))}
        </div>
      ) : (
        <a href={href} className="beyond__empty" {...reveal(0)}>
          <span className="beyond__frames" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="beyond__empty-text">{beyond.empty}</span>
        </a>
      )}
    </section>
  );
}
