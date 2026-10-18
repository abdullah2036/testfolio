import Image from "next/image";
import type { Certificate, Content } from "@/content/types";
import { SHOTS } from "@/content/shared";
import DetailSheet from "./DetailSheet";
import { SectionHead, reveal } from "./primitives";

type Props = { certificates: Content["certificates"]; arrows: Content["arrows"]; ui: Content["ui"] };

const sheetId = (c: Certificate) => `cert-${c.id}`;
const thumbs: Record<string, { src: string; width: number; height: number }> = { ibm: SHOTS.ibm, ine: SHOTS.ine };

function CertLinks({ c, arrows }: { c: Certificate; arrows: Content["arrows"] }) {
  return (
    <div className="ccard__links">
      {c.links.map((l) => (
        <a key={l.href} className="text-link" href={l.href} target="_blank" rel="noopener">
          {l.label} <span aria-hidden="true">{arrows.external}</span>
        </a>
      ))}
    </div>
  );
}

export default function Certificates({ certificates, arrows, ui }: Props) {
  return (
    <section id="certificates" className="section certs" aria-labelledby="certs-title">
      <SectionHead id="certs-title" eyebrow={certificates.eyebrow} title={certificates.title} body={certificates.body} />

      <div className="timeline timeline--certs" data-timeline>
        <span className="timeline__rail" aria-hidden="true">
          <span className="timeline__fill" data-timeline-fill />
        </span>
        <ol className="timeline__list">
          {certificates.items.map((c) => {
            const thumb = thumbs[c.id] ?? c.image;
            return (
              <li key={c.id} id={`c-${c.id}`} className="tl">
                <span className="tl__node" aria-hidden="true" />
                <p className="tl__index" aria-hidden="true">
                  {c.issued}
                </p>
                <article className="ccard" data-glow {...reveal(0)}>
                  <button
                    type="button"
                    className="ccard__media"
                    data-dialog-open={sheetId(c)}
                    aria-label={`${ui.openDetails}: ${c.title}`}
                  >
                    <Image src={thumb.src} alt={c.image.alt} width={thumb.width} height={thumb.height} sizes="(min-width: 960px) 180px, 30vw" />
                  </button>
                  <div className="ccard__body">
                    <p className="pcard__label" dir="ltr">
                      {c.issuer}
                    </p>
                    <h3 className="ccard__title">{c.title}</h3>
                    <p className="ccard__kind">{c.kind}</p>
                    <p className="ccard__cred">
                      <span>{c.credentialLabel}</span>
                      <span className="mono" dir="ltr">
                        {c.credentialId}
                      </span>
                    </p>
                    <div className="ccard__foot">
                      <CertLinks c={c} arrows={arrows} />
                      <button type="button" className="text-btn" data-dialog-open={sheetId(c)}>
                        {ui.details}
                        <span className="text-btn__plus" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>

      {certificates.items.map((c) => (
        <DetailSheet key={c.id} id={sheetId(c)} label={c.title} closeLabel={ui.close}>
          <figure className="sheet__media sheet__media--paper">
            <Image src={c.image.src} alt={c.image.alt} width={c.image.width} height={c.image.height} sizes="(min-width: 900px) 820px, 100vw" />
          </figure>
          <div className="sheet__body">
            <p className="pcard__label" dir="ltr">
              {c.issuer}
            </p>
            <h3 className="sheet__title">{c.title}</h3>
            <dl className="facts">
              <div>
                <dt>{ui.issued}</dt>
                <dd>{c.issued}</dd>
              </div>
              <div>
                <dt>{c.credentialLabel}</dt>
                <dd dir="ltr">{c.credentialId}</dd>
              </div>
            </dl>
            <p className="sheet__text">{c.about}</p>
            {c.list && (
              <>
                <h4 className="sheet__h">{c.list.label}</h4>
                <ol className="sheet__list sheet__list--numbered" dir={c.list.ltr ? "ltr" : undefined}>
                  {c.list.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </>
            )}
            <CertLinks c={c} arrows={arrows} />
          </div>
        </DetailSheet>
      ))}
    </section>
  );
}
