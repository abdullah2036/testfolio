import data from "@/content/gallery.json";
import type { Locale } from "@/content/types";
import { withBase } from "./paths";

type Text = { en: string; ar: string };

/** An event the photos belong to. The gallery's filters are these events, in this order. */
export type GalleryEvent = {
  id: string;
  /** Full name, shown with each photo. */
  name: Text;
  /** Short name, used on the filter buttons. */
  short: Text;
};

/**
 * One photograph in the gallery. Edited with the studio (`npm run dev`, then /studio/),
 * stored in content/gallery.json, with the image file in public/gallery/.
 */
export type GalleryItem = {
  id: string;
  /** Root-relative path, e.g. "/gallery/miyahthon-01.webp" (the base path is added when rendering). */
  src: string;
  width: number;
  height: number;
  caption: Text;
  /** Id of a GalleryEvent. */
  event: string;
  /** ISO date, e.g. "2026-09-17". Optional. */
  date?: string;
  location?: Text;
  /** Shown large: first in the gallery and on the home page. */
  featured?: boolean;
  /** Id of a related project on the home page, e.g. "scinvites". */
  project?: string;
};

export type GalleryData = { events: GalleryEvent[]; items: GalleryItem[] };

const gallery = data as unknown as GalleryData;
export const galleryEvents = gallery.events;
export const galleryItems = gallery.items;

/** The photo shown first and largest: the first one marked featured, else the first one. */
export const featuredItem = (items: GalleryItem[] = galleryItems) => items.find((i) => i.featured) ?? items[0];

export const imageSrc = (item: GalleryItem) => withBase(item.src);

export const eventOf = (item: GalleryItem, events: GalleryEvent[] = galleryEvents) => events.find((e) => e.id === item.event);

/** A localised, human date, e.g. "September 2026" / "سبتمبر ٢٠٢٦". Empty when there's no date. */
export function formatDate(iso: string | undefined, locale: Locale) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-arab" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** "Event · date · place", skipping whatever is missing. */
export function metaLine(item: GalleryItem, locale: Locale, events: GalleryEvent[] = galleryEvents) {
  return [eventOf(item, events)?.name[locale], formatDate(item.date, locale), item.location?.[locale]]
    .filter(Boolean)
    .join(" · ");
}
