import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetailController from "@/components/DetailController";
import Footer from "@/components/Footer";
import GalleryView from "@/components/GalleryView";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import { Button, reveal } from "@/components/primitives";
import { getContent, hasLocale } from "@/content";
import { galleryItems } from "@/lib/gallery";
import { localeHref } from "@/lib/paths";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const pageUrl = (lang: string) => `${SITE_URL}/${lang}/gallery/`;

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const c = getContent(lang);
  return {
    title: c.meta.galleryTitle,
    description: c.meta.galleryDescription,
    alternates: {
      canonical: pageUrl(lang),
      languages: { en: pageUrl("en"), ar: pageUrl("ar"), "x-default": pageUrl("en") },
    },
    openGraph: { type: "website", title: c.meta.galleryTitle, description: c.meta.galleryDescription, url: pageUrl(lang) },
  };
}

export default async function GalleryPage({ params }: PageProps<"/[lang]/gallery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getContent(lang);
  const g = c.gallery;
  const projects = Object.fromEntries(c.work.projects.map((p) => [p.id, p.title]));

  return (
    <>
      <Nav nav={c.nav} locale={lang} page="gallery" />
      <main className="gallery">
        <header id="top" className="ghero">
          <a className="back-link" href={localeHref(lang)} {...reveal(0)}>
            <span aria-hidden="true">{c.arrows.back}</span> {g.backHome}
          </a>
          <p className="eyebrow" {...reveal(0)}>
            {g.eyebrow}
          </p>
          <h1 className="ghero__title" {...reveal(1)}>
            {g.title}
          </h1>
          <p className="ghero__intro" {...reveal(2)}>
            {g.intro}
          </p>
        </header>

        <GalleryView items={galleryItems} g={g} arrows={c.arrows} projects={projects} locale={lang} rtl={c.dir === "rtl"} />

        <div className="gallery__foot">
          <Button href={`${localeHref(lang)}#work`} arrow={c.arrows.forward}>
            {g.moreTitle}
          </Button>
        </div>
      </main>
      <Footer c={c} page="gallery" />
      <Motion />
      <DetailController />
    </>
  );
}
