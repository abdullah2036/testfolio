import type { ComponentProps, ReactNode } from "react";
import type { Eyebrow as EyebrowData, Heading } from "@/content/types";

type RevealProps = { reveal?: number };
const revealAttr = (reveal?: number) => (reveal === undefined ? {} : { "data-reveal": reveal });

export function Eyebrow({ num, label, reveal }: EyebrowData & RevealProps) {
  return (
    <div className="eyebrow" {...revealAttr(reveal)}>
      {num}
      {"  //  "}
      {label}
    </div>
  );
}

export function Display({
  as: Tag = "h2",
  heading,
  variant = "section",
  reveal,
}: {
  as?: "h1" | "h2";
  heading: Heading;
  variant?: "hero" | "section" | "contact";
} & RevealProps) {
  return (
    <Tag className={`display display--${variant}`} {...revealAttr(reveal)}>
      {heading.lines.map((line) => (
        <span key={line}>
          {line}
          <br />
        </span>
      ))}
      {heading.lead}
      <span className="accent">{heading.accent}</span>
    </Tag>
  );
}

export type ArrowKind = "forward" | "external";

/** A round button whose arrow slides out and back in on hover. */
export function ArrowCircle({ arrow, kind }: { arrow: string; kind: ArrowKind }) {
  return (
    <span className="circle" data-kind={kind} aria-hidden="true">
      <span className="circle__arrow">{arrow}</span>
      <span className="circle__arrow circle__arrow--next">{arrow}</span>
    </span>
  );
}

/** Text followed by a round arrow button, as in "Explore my work →". */
export function CircleLink({
  children,
  arrow,
  kind = "forward",
  size = "lg",
  external,
  className = "",
  ...rest
}: ComponentProps<"a"> & {
  arrow: string;
  kind?: ArrowKind;
  size?: "lg" | "sm";
  external?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      className={`circle-link circle-link--${size} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      {...rest}
    >
      <span className="circle-link__text">{children}</span>
      <ArrowCircle arrow={arrow} kind={kind} />
    </a>
  );
}

export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
