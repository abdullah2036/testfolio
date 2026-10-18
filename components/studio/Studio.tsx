"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { GalleryCategory } from "@/content/types";
import { CATEGORIES, type GalleryItem } from "@/lib/gallery";
import { withBase } from "@/lib/paths";

/*
 * Gallery studio: drop photos in, write captions in both languages, pick a category and
 * date, reorder, choose the featured photo, then Save. Saving writes content/gallery.json
 * and the photos in public/gallery/, ready to commit and deploy.
 */

const LABELS: Record<GalleryCategory, string> = {
  hackathons: "Hackathons",
  events: "Events",
  projects: "Projects",
  "behind-the-scenes": "Behind the scenes",
};

type Filter = GalleryCategory | "all";
type Uploaded = { id: string; src: string; width: number; height: number; name: string; lastModified: number };

const today = () => new Date().toISOString().slice(0, 10);
const isoDate = (ms: number) => (Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString().slice(0, 10) : today());

export default function Studio({ projects }: { projects: { id: string; title: string }[] }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [saved, setSaved] = useState("[]");
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text: string }>({ kind: "idle", text: "" });
  const [dragging, setDragging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const dirty = loaded && JSON.stringify(items) !== saved;

  useEffect(() => {
    fetch("/api/gallery/")
      .then((r) => r.json())
      .then((d: { items: GalleryItem[] }) => {
        setItems(d.items);
        setSaved(JSON.stringify(d.items));
        setLoaded(true);
      })
      .catch(() => setStatus({ kind: "error", text: "Couldn't load the gallery. Is `npm run dev` running?" }));
  }, []);

  // Don't lose work by closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const upload = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp|avif|tiff?)$/i.test(f.name));
      if (!images.length) return;
      setStatus({ kind: "busy", text: `Uploading ${images.length} photo${images.length > 1 ? "s" : ""}…` });
      const added: GalleryItem[] = [];
      const errors: string[] = [];
      // A few at a time, so big batches don't stall.
      for (let i = 0; i < images.length; i += 4) {
        const form = new FormData();
        images.slice(i, i + 4).forEach((f) => form.append("files", f));
        try {
          const res = await fetch("/api/gallery/", { method: "POST", body: form });
          const data = (await res.json()) as { saved?: (Uploaded | { error: string })[]; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Upload failed");
          for (const s of data.saved ?? []) {
            if ("error" in s) errors.push(s.error);
            else
              added.push({
                id: s.id,
                src: s.src,
                width: s.width,
                height: s.height,
                caption: { en: "", ar: "" },
                category: filter === "all" ? "events" : filter,
                date: isoDate(s.lastModified),
              });
          }
        } catch (e) {
          errors.push(e instanceof Error ? e.message : "Upload failed");
        }
        setStatus({ kind: "busy", text: `Uploading… ${Math.min(i + 4, images.length)} / ${images.length}` });
      }
      setItems((prev) => [...prev, ...added]);
      setStatus(
        errors.length
          ? { kind: "error", text: errors.join(" ") }
          : { kind: "ok", text: `Added ${added.length} photo${added.length === 1 ? "" : "s"}. Write the captions, then Save.` },
      );
    },
    [filter],
  );

  const save = async () => {
    const missing = items.filter((i) => !i.caption.en.trim() || !i.caption.ar.trim()).length;
    setStatus({ kind: "busy", text: "Saving…" });
    try {
      const res = await fetch("/api/gallery/", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json()) as { error?: string; count?: number; moved?: number };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(JSON.stringify(items));
      setStatus({
        kind: "ok",
        text:
          `Saved ${data.count} photo${data.count === 1 ? "" : "s"}.` +
          (data.moved ? ` ${data.moved} unused file(s) moved to .gallery-trash/.` : "") +
          (missing ? ` ${missing} still need a caption in English or Arabic.` : ""),
      });
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Save failed" });
    }
  };

  const update = (id: string, patch: Partial<GalleryItem>) =>
    setItems((prev) =>
      prev.map((i) => {
        if (patch.featured && i.id !== id) return { ...i, featured: false };
        return i.id === id ? { ...i, ...patch } : i;
      }),
    );
  const remove = (id: string) => {
    if (window.confirm("Remove this photo from the gallery? The file is moved to .gallery-trash/ when you save.")) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };
  const move = (id: string, delta: number) =>
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === id);
      const to = Math.max(0, Math.min(prev.length - 1, from + delta));
      if (from === to) return prev;
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setItems((prev) => {
      const next = [...prev];
      const from = next.findIndex((i) => i.id === dragId);
      const [it] = next.splice(from, 1);
      next.splice(next.findIndex((i) => i.id === targetId), 0, it);
      return next;
    });
    setDragId(null);
  };

  const shown = useMemo(() => (filter === "all" ? items : items.filter((i) => i.category === filter)), [items, filter]);

  // Files dropped anywhere on the page.
  const onDrop = (e: DragEvent) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    setDragging(false);
    upload([...e.dataTransfer.files]);
  };

  return (
    <div
      className="studio"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <header className="studio__bar">
        <div>
          <h1>Gallery studio</h1>
          <p>Only on your computer. Save here, then commit and deploy.</p>
        </div>
        <div className="studio__actions">
          <a href="/en/gallery/" target="_blank" rel="noopener">
            Preview EN ↗
          </a>
          <a href="/ar/gallery/" target="_blank" rel="noopener">
            Preview AR ↗
          </a>
          <button type="button" className="studio__save" onClick={save} disabled={!dirty || status.kind === "busy"}>
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </header>

      {status.text && (
        <p className={`studio__status studio__status--${status.kind}`} role="status">
          {status.text}
        </p>
      )}

      <button type="button" className={`studio__drop ${dragging ? "is-over" : ""}`} onClick={() => fileInput.current?.click()}>
        <strong>Drop photos here</strong>
        <span>or click to choose. JPG, PNG, WebP or AVIF; resized to 2400 px and saved as WebP. (iPhone HEIC: export or share as JPG first.)</span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/tiff,image/gif"
        multiple
        hidden
        onChange={(e) => {
          upload([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <nav className="studio__filters" aria-label="Filter">
        {(["all", ...CATEGORIES] as Filter[]).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : LABELS[f]}{" "}
            <span>{f === "all" ? items.length : items.filter((i) => i.category === f).length}</span>
          </button>
        ))}
      </nav>

      {loaded && shown.length === 0 && (
        <p className="studio__empty">
          {items.length === 0 ? "No photos yet. Drop some in to start." : "No photos in this category."}
        </p>
      )}

      <ol className="studio__list">
        {shown.map((item) => {
          const index = items.indexOf(item);
          return (
            <li
              key={item.id}
              className={`scard ${dragId === item.id ? "is-dragging" : ""}`}
              draggable
              onDragStart={(e) => {
                setDragId(item.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                if (dragId) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                dropOn(item.id);
              }}
            >
              <div className="scard__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={withBase(item.src)} alt="" loading="lazy" />
                <span className="scard__num">{index + 1}</span>
                {item.featured && <span className="scard__star">Featured</span>}
              </div>
              <div className="scard__fields">
                <label>
                  Caption (English)
                  <input value={item.caption.en} onChange={(e) => update(item.id, { caption: { ...item.caption, en: e.target.value } })} placeholder="What's happening here?" />
                </label>
                <label>
                  Caption (العربية)
                  <input dir="rtl" lang="ar" value={item.caption.ar} onChange={(e) => update(item.id, { caption: { ...item.caption, ar: e.target.value } })} placeholder="ماذا يحدث هنا؟" />
                </label>
                <div className="scard__row">
                  <label>
                    Category
                    <select value={item.category} onChange={(e) => update(item.id, { category: e.target.value as GalleryCategory })}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date
                    <input type="date" value={item.date} onChange={(e) => update(item.id, { date: e.target.value || today() })} />
                  </label>
                </div>
                <div className="scard__row">
                  <label>
                    Location (English, optional)
                    <input
                      value={item.location?.en ?? ""}
                      onChange={(e) => update(item.id, { location: { en: e.target.value, ar: item.location?.ar ?? "" } })}
                    />
                  </label>
                  <label>
                    Location (العربية)
                    <input
                      dir="rtl"
                      lang="ar"
                      value={item.location?.ar ?? ""}
                      onChange={(e) => update(item.id, { location: { en: item.location?.en ?? "", ar: e.target.value } })}
                    />
                  </label>
                </div>
                <div className="scard__row">
                  <label>
                    Related project
                    <select value={item.project ?? ""} onChange={(e) => update(item.id, { project: e.target.value || undefined })}>
                      <option value="">None</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="scard__check">
                    <input type="checkbox" checked={!!item.featured} onChange={(e) => update(item.id, { featured: e.target.checked })} />
                    Featured (big, and on the home page)
                  </label>
                </div>
                <div className="scard__tools">
                  <span className="scard__handle" aria-hidden="true">
                    ⠿ drag to reorder
                  </span>
                  <button type="button" onClick={() => move(item.id, -1)} disabled={index === 0} aria-label="Move earlier">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(item.id, 1)} disabled={index === items.length - 1} aria-label="Move later">
                    ↓
                  </button>
                  <button type="button" className="scard__remove" onClick={() => remove(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
