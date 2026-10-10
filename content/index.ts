import ar from "./ar";
import en from "./en";
import type { Content, Locale } from "./types";

export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";

const content: Record<Locale, Content> = { en, ar };

export const hasLocale = (value: string): value is Locale => value in content;

export const getContent = (locale: Locale): Content => content[locale];

export type { Content, Locale };
