import Image from "next/image";
import type { CSSProperties } from "react";
import type { Content } from "@/content/types";
import { SHOTS } from "@/content/shared";
import { galleryHref } from "@/lib/paths";
import { Button, reveal } from "./primitives";

type Shot = { src: string; width: number; height: number };
type Tile = { img: Shot; href: string; label: string; kind: "shot" | "cert" };

/** Titles as they appear on the tiles; they match the cards each tile links to. */
function tilesFor(c: Content) {
  const p = Object.fromEntries(c.work.projects.map((x) => [x.id, x.title]));
  const cert = Object.fromEntries(c.certificates.items.map((x) => [x.id, x.title]));
  const t = (img: Shot, id: string, kind: Tile["kind"] = "shot"): Tile => ({
    img,
    href: kind === "cert" ? `#c-${id}` : `#p-${id}`,
    label: kind === "cert" ? cert[id] : p[id],
    kind,
  });
  // Three columns; each loops on its own, at its own pace.
  return [
    [t(SHOTS.scinvitesInvite, "scinvites"), t(SHOTS.ibm, "ibm", "cert"), t(SHOTS.maherOs, "maher-os"), t(SHOTS.eloria, "eloria")],
    [t(SHOTS.pairingBoard, "pairing-board"), t(SHOTS.ine, "ine", "cert"), t(SHOTS.scinvitesCard, "scinvites"), t(SHOTS.maherOsChooser, "maher-os")],
    [t(SHOTS.eloria, "eloria"), t(SHOTS.scinvitesInvite, "scinvites"), t(SHOTS.ibm, "ibm", "cert"), t(SHOTS.pairingBoard, "pairing-board")],
  ];
}

function TileLink({ tile, copy, eager }: { tile: Tile; copy: boolean; eager: boolean }) {
  return (
    <a
      href={tile.href}
      className={`tile tile--${tile.kind}`}
      aria-label={copy ? undefined : tile.label}
      aria-hidden={copy || undefined}
      tabIndex={copy ? -1 : undefined}
      style={{ "--ar": `${tile.img.width} / ${tile.img.height}` } as CSSProperties}
    >
      <Image
        src={tile.img.src}
        alt=""
        width={tile.img.width}
        height={tile.img.height}
        sizes="(min-width: 960px) 200px, 45vw"
        loading={eager ? "eager" : "lazy"}
        draggable={false}
      />
      <span className="tile__label" aria-hidden="true">
        {tile.label}
      </span>
    </a>
  );
}

export default function Hero({ c }: { c: Content }) {
  const { hero, arrows } = c;
  const cols = tilesFor(c);
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__text">
        <p className="status" {...reveal(0)}>
          <span className="status__dot" aria-hidden="true" />
          {hero.status}
        </p>
        <p className="eyebrow hero__eyebrow" {...reveal(1)}>
          {hero.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title" {...reveal(2)}>
          {hero.title}
        </h1>
        <p className="hero__lede" {...reveal(3)}>
          {hero.lede}
        </p>
        <div className="hero__actions" {...reveal(4)}>
          <Button href="#work" arrow={arrows.forward}>
            {hero.primary}
          </Button>
          <Button href={galleryHref(c.locale)} variant="ghost">
            {hero.secondary}
          </Button>
        </div>
      </div>

      <div className="mosaic" role="group" aria-label={hero.mosaicLabel} data-mosaic {...reveal(2)}>
        {cols.map((col, ci) => (
          <div key={ci} className="mcol" style={{ "--speed": `${[62, 74, 68][ci]}s` } as CSSProperties}>
            <div className="mcol__track">
              {[false, true].map((copy) => (
                <div key={String(copy)} className="mcol__group">
                  {col.map((tile, i) => (
                    <TileLink key={i} tile={tile} copy={copy} eager={!copy && i < 2} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
