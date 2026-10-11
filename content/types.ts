export type Locale = "en" | "ar";

/** A display heading: plain lines, then a final line whose tail carries the accent gradient. */
export type Heading = {
  lines: string[];
  lead?: string;
  accent: string;
};

export type Eyebrow = { num: string; label: string };

export type LinkItem = { label: string; href: string };

export type ImageInfo = { src: string; alt: string; width: number; height: number };

export type Project = {
  id: string;
  label: string;
  featured?: boolean;
  title: string;
  description: string;
  tech: string[];
  stats?: { value: string; label: string }[];
  primary: LinkItem;
  secondary?: LinkItem;
  image: ImageInfo;
  /** Tint behind the screenshot (rgba). */
  tint: string;
  /** Shown in the detail card. */
  role?: string;
  story: string[];
  highlights: string[];
};

export type Certificate = {
  id: string;
  issuer: string;
  title: string;
  kind: string;
  issued: string;
  credentialLabel: string;
  credentialId: string;
  links: LinkItem[];
  image: ImageInfo;
  about: string;
  list?: { label: string; items: string[]; ltr?: boolean };
};

export type Content = {
  locale: Locale;
  dir: "ltr" | "rtl";
  meta: { title: string; description: string };
  arrows: { forward: string; external: string; up: string };
  ui: {
    details: string;
    close: string;
    openDetails: string;
    highlights: string;
    stack: string;
    role: string;
    issued: string;
    prev: string;
    next: string;
    goTo: string;
  };
  nav: {
    wordmark: string;
    about: string;
    work: string;
    certificates: string;
    contact: string;
    cta: string;
    menuLabel: string;
    switchLabel: string;
    switchAria: string;
    switchLocale: Locale;
  };
  hero: {
    eyebrow: Eyebrow;
    heading: Heading;
    lede: string;
    cta: string;
    meta: string;
    rail: string[];
  };
  about: {
    eyebrow: Eyebrow;
    heading: Heading;
    body: string;
    steps: { label: string; plate: string; text: string }[];
  };
  work: {
    eyebrow: Eyebrow;
    heading: Heading;
    featuredBadge: string;
    moreTitle: string;
    projects: Project[];
    allWork: { label: string; handle: string; href: string };
  };
  certificates: {
    eyebrow: Eyebrow;
    heading: Heading;
    body: string;
    items: Certificate[];
  };
  contact: {
    eyebrow: Eyebrow;
    heading: Heading;
    body: string;
    email: string;
    cta: string;
    socials: LinkItem[];
  };
  footer: {
    name: string;
    credit: string;
    backToTop: string;
  };
};
