# Abdullah Bokhary — portfolio

Next.js 16 (App Router) + TypeScript, built from the design handoff in `../Portfolio v2.dc.html`.

```bash
npm install
npm run dev      # http://localhost:3000 → redirects to /en or /ar
npm run build
```

## Two languages, two pages

`/en` (LTR) and `/ar` (RTL) are both prerendered. `/` picks one from the `lang` cookie (set by the language switch) or `Accept-Language` (`proxy.ts`).

- **Copy** lives in `content/en.ts` and `content/ar.ts`. They are written separately, not as a key-by-key translation, and share links/images through `content/shared.ts`.
- **Layout** mirrors through logical CSS properties and `[dir="rtl"]` rules in `app/globals.css`. Arabic gets its own type settings: Alexandria, no negative tracking, no uppercase, wider word spacing, taller line height, and a right-to-left accent gradient. English uses Bricolage Grotesque with DM Mono for labels.
- **3D** mirrors in `components/MotionEngine.tsx` (`mirror = -1`): the layer stack, the laptop tilt, certificate reveals, and the contact arc all flip.

## Where things are

| Path | What |
|---|---|
| `app/[lang]/layout.tsx` | `<html lang dir>`, fonts, metadata + hreflang |
| `app/[lang]/page.tsx` | Section order |
| `components/*.tsx` | One file per section |
| `components/MotionEngine.tsx` | The single rAF loop: smoothed scroll, sticky-section effects, reveals and the contact arc |
| `lib/blackhole.ts` | The sky: a ray-traced Schwarzschild black hole. A lensing map is baked once on the GPU; the accretion disk is re-shaded every frame with Keplerian flow, then recedes into background atmosphere on scroll |
| `lib/ribbon.ts` | The contact section's arc ribbon (the design prototype's shader) |
| `components/Interactions.tsx` | Entrance reveals (`data-anim`: lines, wipe, rise, screen) and magnetic CTAs |
| `components/DetailSheet.tsx`, `DetailController.tsx` | Glass detail cards (`<dialog>`) for projects and certificates |
| `public/projects/` | Laptop screenshots (16:10 crops from the top) |
| `public/certs/` | Certificate images |

Set `NEXT_PUBLIC_SITE_URL` in production so canonical and hreflang URLs are absolute.

## GitHub Pages

Every push to `main` builds a static export and publishes it to the `gh-pages` branch (`.github/workflows/pages.yml`), served at https://abdullah2036.github.io/testfolio/.

To build the same thing locally (bash):

```bash
GITHUB_PAGES=true NEXT_PUBLIC_SITE_URL=https://abdullah2036.github.io/testfolio npm run build   # → out/
```

In that mode the app is exported with the `/testfolio` base path; `withBase()` in `lib/paths.ts` prefixes image and file URLs, and `/` forwards to `/en/` or `/ar/` in the browser (`app/(root)/page.tsx`).
