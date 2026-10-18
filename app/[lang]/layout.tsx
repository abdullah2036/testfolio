import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { getContent, hasLocale, locales } from "@/content";
import "../globals.css";

// Latin: a clean contemporary grotesque. Mono only for metadata.
const geist = Geist({ variable: "--font-latin", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "500"] });
// Arabic: a calm, highly legible sans that pairs with Geist. Loaded on demand, so the English page doesn't pay for it.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

// Full public URL including any base path, e.g. https://abdullah2036.github.io/testfolio
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
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

export const viewport: Viewport = { themeColor: "#0b0c0e", colorScheme: "dark" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { dir } = getContent(lang);
  return (
    <html
      lang={lang}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable} ${plexArabic.variable}`}
    >
      <body>
        {/* Entrance animations start hidden; without JavaScript, show everything. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
