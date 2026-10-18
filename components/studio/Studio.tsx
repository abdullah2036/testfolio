"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { GalleryEvent, GalleryItem } from "@/lib/gallery";
import { withBase } from "@/lib/paths";

/*
 * Gallery studio: drop photos in, write captions in both languages, pick the event (and
 * optionally a date and place), reorder, choose the featured photo, then Save. Saving writes content/gallery.json
 * and the photos in public/gallery/, ready to commit and deploy.
 */

type Filter = string;
type Uploaded = { id: string; src: string; width: number; height: number; name: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

export default function Studio({ projects }: { projects: { id: string; title: string }[] }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [saved, setSaved] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text: string }>({ kind: "idle", text: "" });
  const [dragging, setDragging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const snapshot = JSON.stringify({ events, items });
  const dirty = loaded && snapshot !== saved;
  const eventName = (id: string) => events.find((e) => e.id === id)?.name.en ?? id;

  useEffect(() => {
    fetch("/api/gallery/")
      .then((r) => r.json())
      .then((d: { events: GalleryEvent[]; items: GalleryItem[] }) => {
        setItems(d.items);
        setEvents(d.events);
        setSaved(JSON.stringify({ events: d.events, items: d.items }));
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
                event: filter === "all" ? (events[0]?.id ?? "") : filter,
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
    [filter, events],
  );

  const save = async () => {
    const missing = items.filter((i) => !i.caption.en.trim() || !i.caption.ar.trim()).length;
    setStatus({ kind: "busy", text: "Saving…" });
    try {
      const res = await fetch("/api/gallery/", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events, items }),
      });
      const data = (await res.json()) as { error?: string; count?: number; moved?: number };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(snapshot);
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

  const shown = useMemo(() => (filter === "all" ? items : items.filter((i) => i.event === filter)), [items, filter]);

  const updateEvent = (id: string, patch: Partial<GalleryEvent>) => setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const addEvent = () => {
    const en = window.prompt("Event name in English (e.g. Black Hat MEA)")?.trim();
    if (!en) return;
    let id = slug(en) || "event";
    while (events.some((e) => e.id === id)) id += "-2";
    setEvents((prev) => [...prev, { id, name: { en, ar: "" }, short: { en, ar: "" } }]);
  };
  const moveEvent = (id: string, d: number) =>
    setEvents((prev) => {
      const from = prev.findIndex((e) => e.id === id);
      const to = Math.max(0, Math.min(prev.length - 1, from + d));
      const next = [...prev];
      const [e] = next.splice(from, 1);
      next.splice(to, 0, e);
      return next;
    });
  const removeEvent = (id: string) => {
    if (items.some((i) => i.event === id)) return window.alert("Move or remove this event's photos first.");
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

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

      <details className="studio__events">
        <summary>Events ({events.length}): the gallery&apos;s filters, in this order</summary>
        <ol>
          {events.map((ev, k) => (
            <li key={ev.id} className="sevent">
              <code>{ev.id}</code>
              <label>
                Name (English)
                <input value={ev.name.en} onChange={(e) => updateEvent(ev.id, { name: { ...ev.name, en: e.target.value } })} />
              </label>
              <label>
                Name (العربية)
                <input dir="rtl" lang="ar" value={ev.name.ar} onChange={(e) => updateEvent(ev.id, { name: { ...ev.name, ar: e.target.value } })} />
              </label>
              <label>
                Filter label (English)
                <input value={ev.short.en} onChange={(e) => updateEvent(ev.id, { short: { ...ev.short, en: e.target.value } })} />
              </label>
              <label>
                Filter label (العربية)
                <input dir="rtl" lang="ar" value={ev.short.ar} onChange={(e) => updateEvent(ev.id, { short: { ...ev.short, ar: e.target.value } })} />
              </label>
              <div className="scard__tools">
                <button type="button" onClick={() => moveEvent(ev.id, -1)} disabled={k === 0} aria-label="Move earlier">
                  ↑
                </button>
                <button type="button" onClick={() => moveEvent(ev.id, 1)} disabled={k === events.length - 1} aria-label="Move later">
                  ↓
                </button>
                <button type="button" className="scard__remove" onClick={() => removeEvent(ev.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="studio__add" onClick={addEvent}>
          + Add an event
        </button>
      </details>

      <nav className="studio__filters" aria-label="Filter">
        {["all", ...events.map((e) => e.id)].map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : eventName(f)} <span>{f === "all" ? items.length : items.filter((i) => i.event === f).length}</span>
          </button>
        ))}
      </nav>

      {loaded && shown.length === 0 && (
        <p className="studio__empty">
          {items.length === 0 ? "No photos yet. Drop some in to start." : "No photos for this event yet."}
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
                    Event
                    <select value={item.event} onChange={(e) => update(item.id, { event: e.target.value })}>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name.en}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date (optional)
                    <input type="date" value={item.date ?? ""} onChange={(e) => update(item.id, { date: e.target.value || undefined })} />
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
