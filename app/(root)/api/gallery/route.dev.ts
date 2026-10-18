/*
 * The gallery studio's API. This file only exists under `next dev` (see pageExtensions
 * in next.config.ts), so production builds have no way to change the gallery.
 *
 *   GET  → the current gallery.json ({ events, items })
 *   POST → upload photos (multipart "files"); each is rotated upright, resized to at most
 *          2400 px and saved as WebP in public/gallery/
 *   PUT  → save events and photos; photos no longer used are moved to .gallery-trash/
 */
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { GalleryData, GalleryEvent, GalleryItem } from "@/lib/gallery";

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, "content", "gallery.json");
const PHOTO_DIR = path.join(ROOT, "public", "gallery");
const TRASH_DIR = path.join(ROOT, ".gallery-trash");

/** Only answer requests made from this computer. */
function local(request: Request) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  return ["localhost", "127.0.0.1", "[::1]"].includes(host);
}
const forbidden = () => Response.json({ error: "The studio only works on localhost." }, { status: 403 });

const slug = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "photo";

async function readData(): Promise<GalleryData> {
  const raw = JSON.parse(await readFile(JSON_PATH, "utf8")) as Partial<GalleryData>;
  return { events: raw.events ?? [], items: raw.items ?? [] };
}

export async function GET(request: Request) {
  if (!local(request)) return forbidden();
  return Response.json(await readData());
}

export async function POST(request: Request) {
  if (!local(request)) return forbidden();
  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "No files received." }, { status: 400 });
  await mkdir(PHOTO_DIR, { recursive: true });

  const saved = [];
  for (const file of files) {
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const { data, info } = await sharp(input, { failOn: "none" })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      const id = `${slug(file.name)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      await writeFile(path.join(PHOTO_DIR, `${id}.webp`), data);
      saved.push({ id, src: `/gallery/${id}.webp`, width: info.width, height: info.height, name: file.name });
    } catch {
      const heic = /\.hei[cf]$/i.test(file.name);
      saved.push({
        error: heic
          ? `${file.name}: HEIC can't be read here. Export it as JPG (on iPhone: Share › Options › Most Compatible) and drop it again.`
          : `Couldn't read ${file.name}. Is it an image?`,
        name: file.name,
      });
    }
  }
  return Response.json({ saved });
}

const isText = (t: unknown): t is { en: string; ar: string } =>
  !!t && typeof (t as { en: unknown }).en === "string" && typeof (t as { ar: unknown }).ar === "string";

const validEvent = (e: GalleryEvent) => typeof e.id === "string" && /^[a-z0-9-]+$/.test(e.id) && isText(e.name) && isText(e.short);

const validItem = (item: GalleryItem, events: Set<string>) =>
  typeof item.id === "string" &&
  /^[a-z0-9-]+$/.test(item.id) &&
  typeof item.src === "string" &&
  item.src.startsWith("/gallery/") &&
  Number.isFinite(item.width) &&
  Number.isFinite(item.height) &&
  events.has(item.event) &&
  isText(item.caption) &&
  (!item.date || /^\d{4}-\d{2}-\d{2}$/.test(item.date));

/** Keep only known fields, drop empty optional ones. */
function clean(item: GalleryItem): GalleryItem {
  const out: GalleryItem = {
    id: item.id,
    src: item.src,
    width: Math.round(item.width),
    height: Math.round(item.height),
    caption: { en: item.caption.en.trim(), ar: item.caption.ar.trim() },
    event: item.event,
  };
  if (item.date) out.date = item.date;
  if (item.location && (item.location.en.trim() || item.location.ar.trim()))
    out.location = { en: item.location.en.trim(), ar: item.location.ar.trim() };
  if (item.featured) out.featured = true;
  if (item.project) out.project = item.project;
  return out;
}

export async function PUT(request: Request) {
  if (!local(request)) return forbidden();
  const body = (await request.json()) as Partial<GalleryData>;
  if (!Array.isArray(body.items) || !Array.isArray(body.events))
    return Response.json({ error: "Expected { events: [...], items: [...] }." }, { status: 400 });
  if (!body.events.every(validEvent))
    return Response.json({ error: "Every event needs a short id and a name in both languages." }, { status: 400 });
  const ids = new Set(body.events.map((e) => e.id));
  const bad = body.items.filter((i) => !validItem(i, ids)).length;
  if (bad) return Response.json({ error: `${bad} photo(s) have missing or invalid fields.` }, { status: 400 });

  const events = body.events.map((e) => ({
    id: e.id,
    name: { en: e.name.en.trim(), ar: e.name.ar.trim() },
    short: { en: e.short.en.trim() || e.name.en.trim(), ar: e.short.ar.trim() || e.name.ar.trim() },
  }));
  const items = body.items.map(clean);
  await writeFile(JSON_PATH, `${JSON.stringify({ events, items }, null, 2)}\n`, "utf8");

  // Photos nobody uses any more go to .gallery-trash/ (git-ignored), not straight to deletion.
  const used = new Set(items.map((i) => path.basename(i.src)));
  let moved = 0;
  try {
    for (const f of await readdir(PHOTO_DIR)) {
      if (used.has(f) || !f.endsWith(".webp")) continue;
      await mkdir(TRASH_DIR, { recursive: true });
      await rename(path.join(PHOTO_DIR, f), path.join(TRASH_DIR, f));
      moved++;
    }
  } catch {
    // No photo folder yet: nothing to tidy.
  }
  return Response.json({ ok: true, count: items.length, moved });
}
