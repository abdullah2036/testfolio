import data from "@/content/gallery.json";
import type { GalleryCategory, Locale } from "@/content/types";
import { withBase } from "./paths";

/**
 * One photograph in the gallery. Edited with the studio (`npm run dev`, then /studio/),
 * stored in content/gallery.json, with the image file in public/gallery/.
 */
export type GalleryItem = {
  id: string;
  /** Root-relative path, e.g. "/gallery/hackathon-01.webp" (the base path is added when rendering). */
  src: string;
  width: number;
  height: number;
  caption: { en: string; ar: string };
  category: GalleryCategory;
  /** ISO date, e.g. "2026-09-17". */
  date: string;
  location?: { en: string; ar: string };
  /** Shown large: at the top of the gallery and on the home page. */
  featured?: boolean;
  /** Id of a related project on the home page, e.g. "scinvites". */
  project?: string;
};

export const CATEGORIES: GalleryCategory[] = ["hackathons", "events", "projects", "behind-the-scenes"];

export const galleryItems = (data as { items: GalleryItem[] }).items;

/** The photo shown first and largest: the first one marked featured, else the first one. */
export const featuredItem = (items: GalleryItem[] = galleryItems) => items.find((i) => i.featured) ?? items[0];

export const imageSrc = (item: GalleryItem) => withBase(item.src);

/** A localised, human date, e.g. "September 2026" / "سبتمبر ٢٠٢٦". */
export function formatDate(iso: string, locale: Locale) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-arab" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
