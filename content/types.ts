export type Locale = "en" | "ar";

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
  /** Desktop screenshot. */
  image: ImageInfo;
  /** Phone screenshot, shown beside the desktop one. */
  phone: ImageInfo;
  /** Who did what, for work done with others. */
  credits?: { mine: string; theirs: string };
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

export type GalleryCategory = "hackathons" | "events" | "projects" | "behind-the-scenes";

export type Section = { eyebrow: string; title: string; body?: string };

export type Content = {
  locale: Locale;
  dir: "ltr" | "rtl";
  meta: { title: string; description: string; galleryTitle: string; galleryDescription: string };
  arrows: { forward: string; back: string; external: string; up: string };
  ui: {
    details: string;
    close: string;
    openDetails: string;
    highlights: string;
    stack: string;
    role: string;
    issued: string;
    mine: string;
    theirs: string;
    view: string;
  };
  nav: {
    wordmark: string;
    about: string;
    work: string;
    gallery: string;
    certificates: string;
    contact: string;
    cta: string;
    menuLabel: string;
    closeLabel: string;
    home: string;
    switchLabel: string;
    switchAria: string;
    switchLocale: Locale;
  };
  hero: {
    eyebrow: string;
    title: string;
    lede: string;
    primary: string;
    secondary: string;
    status: string;
    mosaicLabel: string;
  };
  tape: { label: string };
  work: Section & {
    featuredBadge: string;
    caseStudy: string;
    projects: Project[];
    allWork: { label: string; handle: string; href: string };
  };
  about: Section & {
    steps: { title: string; text: string }[];
  };
  beyond: Section & { cta: string; empty: string };
  certificates: Section & { items: Certificate[] };
  contact: Section & {
    email: string;
    cta: string;
    socials: LinkItem[];
  };
  footer: { name: string; credit: string; backToTop: string };
  gallery: {
    eyebrow: string;
    title: string;
    intro: string;
    all: string;
    categories: Record<GalleryCategory, string>;
    empty: string;
    emptyFilter: string;
    relatedProject: string;
    backHome: string;
    /** "{n}" is replaced with the number of photos. */
    count: string;
    viewer: { label: string; prev: string; next: string; close: string; of: string };
    moreTitle: string;
  };
};
