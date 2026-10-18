import Image from "next/image";
import type { Content, Project } from "@/content/types";
import DetailSheet from "./DetailSheet";
import { Button, GitHubIcon, Roll, SectionHead, reveal } from "./primitives";

type Props = { work: Content["work"]; arrows: Content["arrows"]; ui: Content["ui"]; locale: string };

const sheetId = (p: Project) => `project-${p.id}`;

function Links({ p, arrows, ui, details = true }: { p: Project; arrows: Content["arrows"]; ui: Content["ui"]; details?: boolean }) {
  return (
    <div className="pcard__links">
      <Button href={p.primary.href} arrow={arrows.external} external variant="primary" className="btn--sm">
        {p.primary.label}
      </Button>
      {p.secondary && (
        <Button href={p.secondary.href} arrow={arrows.external} external variant="ghost" className="btn--sm">
          {p.secondary.label}
        </Button>
      )}
      {details && (
        <button type="button" className="text-btn" data-dialog-open={sheetId(p)}>
          {ui.details}
          <span className="text-btn__plus" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** A desktop screenshot with the phone version resting on its corner. */
function Media({ p, ui, featured }: { p: Project; ui: Content["ui"]; featured: boolean }) {
  return (
    <button
      type="button"
      className="pmedia"
      data-dialog-open={sheetId(p)}
      aria-label={`${ui.openDetails}: ${p.title}`}
    >
      <span className="pmedia__screen">
        <Image
          src={p.image.src}
          alt={p.image.alt}
          width={p.image.width}
          height={p.image.height}
          sizes={featured ? "(min-width: 960px) 640px, 92vw" : "(min-width: 960px) 460px, 92vw"}
        />
      </span>
      <span className="pmedia__phone">
        <Image src={p.phone.src} alt={p.phone.alt} width={p.phone.width} height={p.phone.height} sizes="(min-width: 960px) 180px, 32vw" />
      </span>
    </button>
  );
}

export default function Projects({ work, arrows, ui, locale }: Props) {
  const num = (i: number) => (i + 1).toLocaleString(locale === "ar" ? "ar-SA" : "en", { minimumIntegerDigits: 2 });
  const lead = work.projects.filter((p) => p.featured);
  const rest = work.projects.filter((p) => !p.featured);

  const item = (p: Project, i: number) => {
    const featured = !!p.featured;
    return (
      <li key={p.id} id={`p-${p.id}`} className={`tl ${featured ? "tl--featured" : ""}`}>
        <span className="tl__node" aria-hidden="true" />
        <p className="tl__index" aria-hidden="true">
          {num(i)}
        </p>
        <article className="pcard" data-glow {...reveal(0)}>
          <Media p={p} ui={ui} featured={featured} />
          <div className="pcard__body">
            <p className="pcard__label">
              <span>{p.label}</span>
              {featured && <span className="badge">{work.featuredBadge}</span>}
            </p>
            <h3 className="pcard__title">{p.title}</h3>
            <p className="pcard__desc">{p.description}</p>

            {p.credits && (
              <dl className="credits">
                <div className="credits__mine">
                  <dt>{ui.mine}</dt>
                  <dd>{p.credits.mine}</dd>
                </div>
                <div>
                  <dt>{ui.theirs}</dt>
                  <dd>{p.credits.theirs}</dd>
                </div>
              </dl>
            )}

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

            <ul className="chips" dir="ltr" aria-label={ui.stack}>
              {p.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <Links p={p} arrows={arrows} ui={ui} />
          </div>
        </article>
      </li>
    );
  };

  return (
    <section id="work" className="section work" aria-labelledby="work-title">
      <SectionHead id="work-title" eyebrow={work.eyebrow} title={work.title} accent={work.accent} body={work.body} />

      <div className="timeline" data-timeline>
        <span className="timeline__rail" aria-hidden="true">
          <span className="timeline__fill" data-timeline-fill />
        </span>
        <ol className="timeline__list">
          {lead.map((p) => item(p, work.projects.indexOf(p)))}
          {/* On phones the rest become a sideways row that glides along as you scroll
              (and can be swiped); on wider screens they continue the timeline. */}
          <li className="tl-group">
            <ol className="prail" data-prail>
              {rest.map((p) => item(p, work.projects.indexOf(p)))}
            </ol>
            <span className="prail__meter" aria-hidden="true">
              <span data-prail-bar />
            </span>
          </li>
        </ol>
      </div>

      <div className="work__foot" {...reveal(0)}>
        <a className="gh-btn" href={work.allWork.href} target="_blank" rel="noopener">
          <GitHubIcon className="gh-btn__icon" />
          <Roll>{work.allWork.label}</Roll>
          <span className="gh-btn__handle" dir="ltr">
            {work.allWork.handle}
          </span>
        </a>
      </div>

      {work.projects.map((p) => (
        <DetailSheet key={p.id} id={sheetId(p)} label={p.title} closeLabel={ui.close}>
          <figure className="sheet__media">
            <Image src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} sizes="(min-width: 900px) 820px, 100vw" />
          </figure>
          <div className="sheet__body">
            <p className="pcard__label">{p.label}</p>
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
            <Links p={p} arrows={arrows} ui={ui} details={false} />
          </div>
        </DetailSheet>
      ))}
    </section>
  );
}
