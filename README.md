# Abdullah Bokhary — portfolio

Next.js 16 (App Router) + TypeScript. English (LTR) and Arabic (RTL), each written natively.

```bash
npm install
npm run dev      # http://localhost:3000 → forwards to /en/ or /ar/
npm run build
```

## Adding gallery photos (the studio)

1. `npm run dev`, then open **http://localhost:3000/studio/**.
2. Drop photos onto the page (or click the drop area). Each is rotated upright, resized to at most 2400 px and saved as WebP in `public/gallery/`. iPhone HEIC photos need exporting as JPG first.
3. For each photo: an English and an Arabic caption and the event it's from; optionally a date, a location and a related project. Events (the gallery's filters) are edited in the **Events** panel: add one, name it in both languages, and set the order. Tick **Featured** on the one photo that should lead the gallery and appear on the home page. Drag cards (or use ↑ ↓) to set the order.
4. **Save changes**. This writes `content/gallery.json`. Removed photos go to `.gallery-trash/` (git-ignored), not straight to deletion.
5. Preview at `/en/gallery/` and `/ar/gallery/`, then commit `content/gallery.json` and `public/gallery/` and deploy.

The studio and its API (`app/(root)/studio/page.dev.tsx`, `app/(root)/api/gallery/route.dev.ts`) only exist under `next dev`. `pageExtensions` in `next.config.ts` leaves `*.dev.tsx` files out of production builds, so the live site has no way to change the gallery.

## Two languages

`/en/` and `/ar/` (and `/en/gallery/`, `/ar/gallery/`) are all prerendered. `/` and `/gallery/` forward to the visitor's language: the `lang` cookie set by the language switch, then the browser's languages, then English.

- **Copy** lives in `content/en.ts` and `content/ar.ts`, written separately rather than translated key by key. Links, images and the stack words are shared through `content/shared.ts`.
- **Layout** mirrors through logical CSS properties and `[dir="rtl"]` rules in `app/globals.css`. Arabic uses IBM Plex Sans Arabic with its own line heights and no letter-spacing; English uses Geist, with Geist Mono for metadata.

## Where things are

| Path | What |
|---|---|
| `app/[lang]/page.tsx` | Home: section order |
| `app/[lang]/gallery/page.tsx` | Gallery page |
| `components/Hero.tsx` | Headline and the looping mosaic of phone screenshots and certificates (each tile links to its card) |
| `components/Tape.tsx` | The crossed "caution tape" of tools |
| `components/Projects.tsx`, `Certificates.tsx` | Timelines; SCinvites first as the case study |
| `components/About.tsx`, `Beyond.tsx`, `Contact.tsx` | Understand / Build / Ship, the gallery preview, contact |
| `components/GalleryView.tsx` | Filters, featured photo, masonry, and the photo viewer (keyboard, swipe) |
| `components/Motion.tsx` | Reveals, timeline progress, card glow, nav state. CSS does the motion; reduced motion is respected |
| `components/DetailSheet.tsx`, `DetailController.tsx` | Detail dialogs for projects and certificates |
| `lib/gallery.ts` | Gallery item type and helpers |
| `public/shots/` | Phone screenshots and square certificate crops for the mosaic |
| `public/projects/`, `public/certs/` | Desktop screenshots, certificate images |

## Deploying

**Vercel**: import the repo; the defaults work. Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-domain.com`) so canonical and hreflang URLs are absolute.

**GitHub Pages** still works: every push to `main` runs `.github/workflows/pages.yml`, which builds a static export with the `/testfolio` base path and publishes it to the `gh-pages` branch. Locally:

```bash
GITHUB_PAGES=true NEXT_PUBLIC_SITE_URL=https://abdullah2036.github.io/testfolio npm run build   # → out/
```
