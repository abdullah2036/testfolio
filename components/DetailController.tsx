"use client";

import { useEffect } from "react";

const CLOSE_MS = 240;

/** Opens and closes every DetailSheet on the page, with an exit animation. */
export default function DetailController() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const close = (d: HTMLDialogElement) => {
      if (!d.open || d.hasAttribute("data-closing")) return;
      if (reduced) return d.close();
      d.setAttribute("data-closing", "");
      window.setTimeout(() => {
        d.close();
        d.removeAttribute("data-closing");
      }, CLOSE_MS);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const opener = target.closest<HTMLElement>("[data-dialog-open]");
      if (opener) {
        const d = document.getElementById(opener.dataset.dialogOpen!);
        if (d instanceof HTMLDialogElement) {
          e.preventDefault();
          d.showModal();
          d.scrollTop = 0;
        }
        return;
      }
      const closer = target.closest("[data-dialog-close]");
      const dialog = (closer?.closest("dialog") ?? (target instanceof HTMLDialogElement ? target : null)) as
        | HTMLDialogElement
        | null;
      // Clicks on the dimmed backdrop land on the <dialog> element itself.
      if (dialog) close(dialog);
    };

    // Esc: animate out instead of the browser's instant close.
    const onCancel = (e: Event) => {
      if (e.target instanceof HTMLDialogElement) {
        e.preventDefault();
        close(e.target);
      }
    };

    document.addEventListener("click", onClick);
    document.addEventListener("cancel", onCancel, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("cancel", onCancel, true);
    };
  }, []);

  return null;
}
