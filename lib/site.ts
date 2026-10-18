/**
 * The site's public URL (including any base path), for canonical and hreflang links.
 * NEXT_PUBLIC_SITE_URL wins; on Vercel it falls back to the production domain.
 */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000")
).replace(/\/$/, "");
