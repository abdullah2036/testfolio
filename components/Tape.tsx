import { STACK } from "@/content/shared";

/** One strip of tape: the words run in a seamless loop. Only the first copy on the first strip is read out. */
function Strip({ words, variant }: { words: string[]; variant: "a" | "b" }) {
  const run = (copy: boolean) => (
    <span className="tape__run" aria-hidden={copy || undefined}>
      {words.map((w) => (
        <span key={w} className="tape__word">
          {w}
          <span className="tape__sep" aria-hidden="true" />
        </span>
      ))}
    </span>
  );
  return (
    <div className={`tape__strip tape__strip--${variant}`} dir="ltr" aria-hidden={variant === "b" || undefined}>
      <div className="tape__track">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}

/** Crossed "caution tape" of the tools I use. It loops on its own; the page never stops scrolling here. */
export default function Tape({ label }: { label: string }) {
  const half = Math.ceil(STACK.length / 2);
  const second = [...STACK.slice(half), ...STACK.slice(0, half)];
  return (
    <section className="tape" aria-label={label} data-pause-offscreen>
      <Strip words={STACK} variant="a" />
      <Strip words={second} variant="b" />
    </section>
  );
}
