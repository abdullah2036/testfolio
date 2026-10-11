import type { CSSProperties } from "react";
import type { Content } from "@/content/types";
import { Display, Eyebrow } from "./primitives";

// Bottom → top: Idea & design, Code, Deployment, Maintenance.
const plateArt = [
  <div key="idea" className="plate__wire">
    <div />
    <div />
    <div />
    <div />
  </div>,
  <div key="code" className="plate__code">
    {[55, 38, 62, 30, 48, 22].map((w, i) => (
      <div key={i} style={{ width: `${w}%` }} />
    ))}
  </div>,
  <div key="deploy" className="plate__chip-wrap">
    <div className="plate__trace plate__trace--h" />
    <div className="plate__trace plate__trace--v" />
    <div className="plate__chip">
      <div className="pins pins--top" />
      <div className="pins pins--bottom" />
      <div className="pins pins--start" />
      <div className="pins pins--end" />
      <div className="plate__chip-core" />
    </div>
  </div>,
  <div key="maint" className="plate__rings-wrap">
    <div className="plate__sheen" />
    <div className="plate__status">
      <span />
      <span />
      <span />
      <span className="plate__status-bar" />
    </div>
  </div>,
];

const plateMods = ["idea", "code", "deploy", "maint"];

export default function About({ about }: { about: Content["about"] }) {
  return (
    <section id="about" className="about scrolly scrolly--about">
      <div className="scrolly__sticky">
        <div className="split split--about">
          <div className="stack-col">
            <Eyebrow {...about.eyebrow} reveal={0} />
            <Display heading={about.heading} reveal={1} />
            <p className="body-text" data-anim="rise" style={{ "--d": "0.4s" } as CSSProperties}>
              {about.body}
            </p>
            <div className="bars" aria-hidden="true">
              {about.steps.map((s) => (
                <div key={s.label} className="bars__track bars__track--step">
                  <div className="bars__fill" data-stepbar />
                </div>
              ))}
            </div>
            <ol className="layered steps">
              {about.steps.map((s) => (
                <li key={s.label} className="step" data-step>
                  <div className="step__label">{s.label}</div>
                  <div className="step__text">{s.text}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="stage" aria-hidden="true">
            <div className="stage__glow" />
            {/* Plates stack bottom → top in DOM order, so step 1 goes last and sits on top:
                the highlight then travels down the stack as the reader scrolls down. */}
            <div className="stack" data-stack>
              {about.steps.map((_, j) => {
                const i = about.steps.length - 1 - j;
                const s = about.steps[i];
                return (
                <div key={s.label} className="plate" data-plate={i}>
                  <div className={`plate__face plate__face--${plateMods[i]}`}>{plateArt[i]}</div>
                  <div className="plate__glow" data-glow />
                  <div className="plate__label wide-only">
                    <span />
                    {s.plate}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
