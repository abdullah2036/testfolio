import type { ReactNode } from "react";

/**
 * A glass detail card rendered as a native <dialog>. It is server-rendered closed;
 * DetailController opens it from any element with data-dialog-open="<id>".
 */
export default function DetailSheet({
  id,
  label,
  closeLabel,
  children,
}: {
  id: string;
  label: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <dialog id={id} className="sheet" aria-label={label}>
      <div className="sheet__card">
        <button type="button" className="sheet__close" data-dialog-close aria-label={closeLabel}>
          <span aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
