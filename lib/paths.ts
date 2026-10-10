/** The site's base path ("" locally, "/testfolio" on GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes a root-relative URL (images, files, page links) with the base path. */
export const withBase = (path: string) => `${BASE_PATH}${path}`;

/** URL of a language's home page. */
export const localeHref = (locale: string) => withBase(`/${locale}/`);
