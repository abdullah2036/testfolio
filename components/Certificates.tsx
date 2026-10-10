import Image from "next/image";
import type { Certificate, Content } from "@/content/types";
import DetailSheet from "./DetailSheet";
import { Display, Eyebrow } from "./primitives";

type Props = { certificates: Content["certificates"]; arrows: Content["arrows"]; ui: Content["ui"] };

function CertLinks({ c, arrows }: { c: Certificate; arrows: Content["arrows"] }) {
  return (
    <div className="cert__links">
      {c.links.map((l) => (
        <a key={l.href} className="text-link" href={l.href} target="_blank" rel="noopener">
          {l.label} <span aria-hidden="true">{arrows.external}</span>
        </a>
      ))}
    </div>
  );
}

export default function Certificates({ certificates, arrows, ui }: Props) {
  const sheetId = (c: Certificate) => `cert-${c.id}`;
  return (
    <section id="certificates" className="certs">
      <div className="stack-col">
        <Eyebrow {...certificates.eyebrow} reveal={0} />
        <Display heading={certificates.heading} reveal={1} />
        <p className="body-text" data-reveal={2}>
          {certificates.body}
        </p>
      </div>
      <div className="certs__grid">
        {certificates.items.map((c, i) => (
          <article key={c.id} className="cert" data-reveal={i % 2} data-cert>
            {/* Stretched button: the whole card opens the details; the links sit above it. */}
            <button
              type="button"
              className="cert__open"
              data-dialog-open={sheetId(c)}
              aria-label={`${ui.openDetails}: ${c.title}`}
            />
            <div className="cert__media">
              <Image src={c.image.src} alt={c.image.alt} width={c.image.width} height={c.image.height} sizes="(min-width: 900px) 560px, 100vw" />
            </div>
            <div className="cert__mid">
              <div className="cert__issuer" dir="ltr">
                {c.issuer}
              </div>
              <h3 className="cert__title">{c.title}</h3>
              <div className="cert__kind">{c.kind}</div>
            </div>
            <div className="cert__bottom">
              <div className="cert__cred">
                <span>{c.credentialLabel}</span>
                <span className="cert__id" dir="ltr">
                  {c.credentialId}
                </span>
              </div>
              <CertLinks c={c} arrows={arrows} />
            </div>
          </article>
        ))}
      </div>

      {certificates.items.map((c) => (
        <DetailSheet key={c.id} id={sheetId(c)} label={c.title} closeLabel={ui.close}>
          <figure className="sheet__media sheet__media--paper">
            <Image src={c.image.src} alt={c.image.alt} width={c.image.width} height={c.image.height} sizes="(min-width: 900px) 820px, 100vw" />
          </figure>
          <div className="sheet__body">
            <div className="pinfo__label" dir="ltr">
              {c.issuer}
            </div>
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
            <div className="sheet__links">
              <CertLinks c={c} arrows={arrows} />
            </div>
          </div>
        </DetailSheet>
      ))}
    </section>
  );
}
