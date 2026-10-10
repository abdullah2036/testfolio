import type { NextConfig } from "next";

// `GITHUB_PAGES=true npm run build` produces a static site in out/ for
// https://abdullah2036.github.io/testfolio/. Without it, the app builds normally.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/testfolio" : "";

const nextConfig: NextConfig = {
  // Partial prerendering can't run in a static export, and every page here is static anyway.
  cacheComponents: !pages,
  partialPrefetching: !pages,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(pages && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
