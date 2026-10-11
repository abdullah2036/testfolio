import type { Metadata, Viewport } from "next";
import { Alexandria, Bricolage_Grotesque, DM_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { getContent, hasLocale, locales } from "@/content";
import "../globals.css";

// Latin: a grotesque with character (ink traps, optical sizes) that stays easy to read.
const bricolage = Bricolage_Grotesque({ variable: "--font-latin", subsets: ["latin"], axes: ["opsz"] });
const dmMono = DM_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["300", "400", "500"] });
// Arabic: a modern geometric face with distinct letterforms. Loaded on demand, so the English page doesn't pay for it.
const alexandria = Alexandria({ variable: "--font-arabic", subsets: ["arabic"], preload: false });

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

export const viewport: Viewport = { themeColor: "#05080A", colorScheme: "dark" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { dir } = getContent(lang);
  return (
    <html
      lang={lang}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${dmMono.variable} ${alexandria.variable}`}
    >
      <body>
        {/* Entrance animations start hidden; without JavaScript, show everything. */}
        <noscript>
          <style>
            {"[data-anim],[data-anim] *{opacity:1!important;translate:none!important;clip-path:none!important}[data-anim] .line__in{transform:none!important}"}
          </style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
