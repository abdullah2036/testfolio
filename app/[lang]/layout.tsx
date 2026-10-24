import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import Backdrop from "@/components/Backdrop";
import { getContent, hasLocale, locales } from "@/content";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

// Latin: a clean contemporary grotesque. Mono only for metadata.
const geist = Geist({ variable: "--font-latin", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "500"] });
// Accent words in titles: an italic serif, the designer's hand beside the developer's mono.
const instrumentSerif = Instrument_Serif({ variable: "--font-serif-face", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
// Arabic: a calm, highly legible sans that pairs with Geist. Loaded on demand, so the English page doesn't pay for it.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

const pageUrl = (lang: string) => `${SITE_URL}/${lang}/`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const c = getContent(lang);
  return {
    metadataBase: new URL(`${SITE_URL}/`),
    title: c.meta.title,
    description: c.meta.description,
    alternates: {
      canonical: pageUrl(lang),
      languages: { en: pageUrl("en"), ar: pageUrl("ar"), "x-default": pageUrl("en") },
    },
    openGraph: {
      type: "website",
      title: c.meta.title,
      description: c.meta.description,
      url: pageUrl(lang),
      locale: lang === "ar" ? "ar_SA" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar_SA",
    },
  };
}

export const viewport: Viewport = { themeColor: "#04060c", colorScheme: "dark" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { dir, nav } = getContent(lang);
  return (
    <html
      lang={lang}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} ${plexArabic.variable} is-loading`}
      suppressHydrationWarning
    >
      <body>
        {/* Entrance animations start hidden; without JavaScript, show everything. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}.loader{display:none!important}"}</style>
        </noscript>
        {/* Loading screen, shown until the page has loaded (Motion hides it). */}
        <div className="loader" data-loader aria-hidden="true">
          <svg className="loader__mark" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="loader-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#39ff9f" />
                <stop offset=".5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path d="M18 48 L32 14 L46 48" pathLength="1" fill="none" stroke="url(#loader-grad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 37 H40" pathLength="1" fill="none" stroke="url(#loader-grad)" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
          <span className="loader__name">{nav.wordmark}</span>
          <span className="loader__bar">
            <span />
          </span>
        </div>
        {/* Faint drifting light behind every page (see .ambient in globals.css). */}
        <div className="ambient" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {/* The dotted grid and drifting specks that answer the pointer. */}
        <Backdrop />
        {children}
        {/* Vercel Analytics: page views on the Vercel deployment (not in the GitHub Pages export). */}
        {process.env.GITHUB_PAGES !== "true" && <Analytics />}
      </body>
    </html>
  );
}
