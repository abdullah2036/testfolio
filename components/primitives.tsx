import type { ComponentProps, CSSProperties, ReactNode } from "react";

/** Entrance motion: [data-reveal] elements rise in once they enter the viewport (see Motion). */
export const reveal = (step = 0): { "data-reveal": ""; style: CSSProperties } => ({
  "data-reveal": "",
  style: { "--d": `${step * 0.08}s` } as CSSProperties,
});

/** Section header: a mono eyebrow, a title and an optional lede. */
export function SectionHead({
  eyebrow,
  title,
  body,
  id,
  as: Tag = "h2",
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  id?: string;
  as?: "h1" | "h2";
  children?: ReactNode;
}) {
  return (
    <header className="shead">
      <p className="eyebrow" {...reveal(0)}>
        {eyebrow}
      </p>
      <Tag className="shead__title" id={id} {...reveal(1)}>
        {title}
      </Tag>
      {body && (
        <p className="shead__body" {...reveal(2)}>
          {body}
        </p>
      )}
      {children}
    </header>
  );
}

/** A label that rolls up to a fresh copy of itself on hover. */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll__a">{children}</span>
      <span className="roll__b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

/** Primary / secondary pill buttons with a small trailing arrow. */
export function Button({
  children,
  arrow,
  variant = "primary",
  external,
  className = "",
  ...rest
}: ComponentProps<"a"> & { arrow?: string; variant?: "primary" | "ghost"; external?: boolean; children: string }) {
  return (
    <a
      className={`btn btn--${variant} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      {...rest}
    >
      <Roll>{children}</Roll>
      {arrow && (
        <span className="btn__arrow" aria-hidden="true">
          {arrow}
        </span>
      )}
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
