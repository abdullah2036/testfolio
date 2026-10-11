import Image from "next/image";
import type { CSSProperties } from "react";
import type { Content, Project } from "@/content/types";
import DetailSheet from "./DetailSheet";
import { CircleLink, Display, Eyebrow, GitHubIcon, Roll } from "./primitives";

type Props = { work: Content["work"]; arrows: Content["arrows"]; ui: Content["ui"] };

const sheetId = (p: Project) => `project-${p.id}`;

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

function DetailsButton({ p, label }: { p: Project; label: string }) {
  return (
    <button type="button" className="chip-btn" data-dialog-open={sheetId(p)}>
      {label}
      <span className="chip-btn__plus" aria-hidden="true" />
    </button>
  );
}

export default function Projects({ work, arrows, ui }: Props) {
  const featured = work.projects.find((p) => p.featured) ?? work.projects[0];
  const rest = work.projects.filter((p) => p !== featured);

  return (
    <section id="work" className="work">
      <div className="work__inner">
        <div className="stack-col">
          <Eyebrow {...work.eyebrow} reveal={0} />
          <Display heading={work.heading} reveal={1} />
        </div>

        {/* Featured: the one project that gets the laptop. */}
        <div className="featured">
          <div className="pinfo featured__info" data-anim="rise" style={{ "--d": "0.1s" } as CSSProperties}>
            <Label p={featured} badge={work.featuredBadge} />
            <h3 className="pinfo__title">{featured.title}</h3>
            <p className="pinfo__desc">{featured.description}</p>
            {featured.stats && (
              <dl className="stats">
                {featured.stats.map((s) => (
                  <div key={s.label} className="stats__item">
                    <dt>{s.value}</dt>
                    <dd>{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="tech" dir="ltr">
              {featured.tech.join(" · ")}
            </div>
            <div className="pinfo__links">
              <ProjectLinks p={featured} arrows={arrows} />
              <DetailsButton p={featured} label={ui.details} />
            </div>
          </div>

          <div className="laptop-wrap" data-anim="screen">
            <div className="laptop" data-laptop>
              <div className="laptop__lid">
                <div className="laptop__screen">
                  <button
                    type="button"
                    className="pshot"
                    data-dialog-open={sheetId(featured)}
                    aria-label={`${ui.openDetails}: ${featured.title}`}
                    style={{ "--tint": featured.tint } as CSSProperties}
                  >
                    <Image
                      src={featured.image.src}
                      alt=""
                      width={featured.image.width}
                      height={featured.image.height}
                      sizes="(min-width: 900px) 700px, 100vw"
                      className="pshot__img"
                    />
                    <span className="pshot__hint" aria-hidden="true">
                      {ui.details} +
                    </span>
                  </button>
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

      {/*
        The rest: a pinned horizontal sequence. Scrolling down moves the cards across,
        synchronised with the scroll; the page carries on vertically afterwards.
      */}
      <div className="hrail" data-hrail aria-label={work.moreTitle}>
        <div className="hrail__sticky">
          <div className="hrail__head">
            <h3 className="more__title" data-anim="rise">
              {work.moreTitle}
            </h3>
            <div className="hrail__meter" aria-hidden="true">
              <span className="hrail__count" dir="ltr">
                <span data-hrail-index>01</span> / {String(rest.length).padStart(2, "0")}
              </span>
              <span className="hrail__bar">
                <span data-hrail-bar />
              </span>
            </div>
          </div>
          <div className="hrail__track" data-hrail-track>
            {rest.map((p) => (
              <article key={p.id} className="pcard" data-pcard>
                <div className="pcard__body">
                  <button
                    type="button"
                    className="pcard__open"
                    data-dialog-open={sheetId(p)}
                    aria-label={`${ui.openDetails}: ${p.title}`}
                  />
                  <div className="pcard__media" style={{ "--tint": p.tint } as CSSProperties}>
                    <Image
                      src={p.image.src}
                      alt={p.image.alt}
                      width={p.image.width}
                      height={p.image.height}
                      sizes="(min-width: 900px) 460px, 82vw"
                      draggable={false}
                    />
                  </div>
                  <div className="pcard__text">
                    <Label p={p} badge={work.featuredBadge} />
                    <h4 className="pcard__title">{p.title}</h4>
                    <p className="pcard__desc">{p.description}</p>
                    <div className="tech" dir="ltr">
                      {p.tech.join(" · ")}
                    </div>
                  </div>
                  <div className="pinfo__links pcard__links">
                    <ProjectLinks p={p} arrows={arrows} />
                    <DetailsButton p={p} label={ui.details} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="work__foot">
        <a className="gh-btn" href={work.allWork.href} target="_blank" rel="noopener" data-anim="rise">
          <GitHubIcon className="gh-btn__icon" />
          <Roll>{work.allWork.label}</Roll>
          <span className="gh-btn__handle" dir="ltr">
            {work.allWork.handle}
          </span>
        </a>
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
