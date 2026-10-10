import Image from "next/image";
import type { CSSProperties } from "react";
import type { Content, Project } from "@/content/types";
import DetailSheet from "./DetailSheet";
import { CircleLink, Display, Eyebrow, GitHubIcon } from "./primitives";

type Props = { work: Content["work"]; arrows: Content["arrows"]; ui: Content["ui"] };

function ProjectLinks({ p, arrows }: { p: Project; arrows: Content["arrows"] }) {
  return (
    <>
      <CircleLink href={p.primary.href} arrow={arrows.external} kind="external" size="sm" external>
        {p.primary.label}
      </CircleLink>
      {p.secondary && (
        <a className="text-link" href={p.secondary.href} target="_blank" rel="noopener">
          {p.secondary.label} <span aria-hidden="true">{arrows.external}</span>
        </a>
      )}
    </>
  );
}

function Label({ p, badge }: { p: Project; badge: string }) {
  return (
    <div className="pinfo__label">
      {p.label}
      {p.featured && <span className="badge">{badge}</span>}
    </div>
  );
}

export default function Projects({ work, arrows, ui }: Props) {
  const sheetId = (p: Project) => `project-${p.id}`;
  return (
    <section id="work" className="work scrolly scrolly--work">
      <div className="scrolly__sticky">
        <div className="split split--work">
          <div className="stack-col">
            <Eyebrow {...work.eyebrow} />
            <Display heading={work.heading} />
            <div className="layered">
              {work.projects.map((p) => (
                <article key={p.id} className="pinfo" data-pinfo>
                  <Label p={p} badge={work.featuredBadge} />
                  <h3 className="pinfo__title">{p.title}</h3>
                  <p className="pinfo__desc">{p.description}</p>
                  {p.stats && (
                    <dl className="stats">
                      {p.stats.map((s) => (
                        <div key={s.label} className="stats__item">
                          <dt>{s.value}</dt>
                          <dd>{s.label}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="tech" dir="ltr">
                    {p.tech.join(" · ")}
                  </div>
                  <div className="pinfo__links">
                    <ProjectLinks p={p} arrows={arrows} />
                    <button type="button" className="chip-btn" data-dialog-open={sheetId(p)}>
                      {ui.details}
                      <span className="chip-btn__plus" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="work__foot">
              <div className="bars" aria-hidden="true">
                {work.projects.map((p) => (
                  <span key={p.id} className="bars__dot" data-pdot />
                ))}
              </div>
              <a className="gh-btn" href={work.allWork.href} target="_blank" rel="noopener">
                <GitHubIcon className="gh-btn__icon" />
                <span>{work.allWork.label}</span>
                <span className="gh-btn__handle" dir="ltr">
                  {work.allWork.handle}
                </span>
              </a>
            </div>
          </div>

          <div className="laptop-wrap">
            <div className="laptop" data-laptop>
              <div className="laptop__lid">
                <div className="laptop__screen">
                  {work.projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="pshot"
                      data-pshot
                      data-dialog-open={sheetId(p)}
                      aria-label={`${ui.openDetails}: ${p.title}`}
                      style={{ "--tint": p.tint } as CSSProperties}
                    >
                      <Image
                        src={p.image.src}
                        alt=""
                        width={p.image.width}
                        height={p.image.height}
                        sizes="(min-width: 900px) 700px, 100vw"
                        className="pshot__img"
                      />
                      <span className="pshot__hint" aria-hidden="true">
                        {ui.details} +
                      </span>
                    </button>
                  ))}
                  <div className="laptop__glare" aria-hidden="true" />
                </div>
              </div>
              <div className="laptop__base" aria-hidden="true">
                <div className="laptop__notch" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {work.projects.map((p) => (
        <DetailSheet key={p.id} id={sheetId(p)} label={p.title} closeLabel={ui.close}>
          <figure className="sheet__media sheet__media--screen">
            <Image src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} sizes="(min-width: 900px) 820px, 100vw" />
          </figure>
          <div className="sheet__body">
            <Label p={p} badge={work.featuredBadge} />
            <h3 className="sheet__title">{p.title}</h3>
            {p.role && (
              <p className="sheet__role">
                <span>{ui.role}</span>
                {p.role}
              </p>
            )}
            {p.story.map((para) => (
              <p key={para.slice(0, 24)} className="sheet__text">
                {para}
              </p>
            ))}
            <h4 className="sheet__h">{ui.highlights}</h4>
            <ul className="sheet__list">
              {p.highlights.map((h) => (
                <li key={h.slice(0, 24)}>{h}</li>
              ))}
            </ul>
            <h4 className="sheet__h">{ui.stack}</h4>
            <ul className="chips" dir="ltr">
              {p.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="sheet__links">
              <ProjectLinks p={p} arrows={arrows} />
            </div>
          </div>
        </DetailSheet>
      ))}
    </section>
  );
}
