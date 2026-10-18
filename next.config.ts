import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// `GITHUB_PAGES=true npm run build` produces a static site in out/ for
// https://abdullah2036.github.io/testfolio/. Without it, the app builds normally (Vercel).
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/testfolio" : "";

export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Files named *.dev.tsx / *.dev.ts (the gallery studio and its API) only exist
    // while running `next dev`. Production builds never include them.
    pageExtensions: dev ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
    // Partial prerendering can't run in a static export, and every page here is static anyway.
    cacheComponents: !pages,
    partialPrefetching: !pages,
    trailingSlash: true,
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    ...(pages && {
      output: "export",
      basePath,
      images: { unoptimized: true },
    }),
  };
}
