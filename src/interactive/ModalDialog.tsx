"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// A native modal <dialog> for the site's overlays (premium window, game,
// image viewer). showModal() gives what a hand-made overlay has to fake:
// the page behind becomes inert, focus moves in and Tab stays inside, Esc
// and the mobile back gesture close it, and focus returns to the button
// that opened it.
//
// The element itself is the full-screen dimmed layer (so a click on it,
// outside the sheet, closes), and keeps the site's own open/close animation:
// the parent keeps it mounted for the exit (usePresence) and drives
// data-state; Esc is routed through onClose so it animates too.
export default function ModalDialog({
  label,
  state,
  onClose,
  className = "",
  children,
}: {
  label: string;
  state: "open" | "closed";
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  // Open as a modal on mount; close natively just before unmount, so the
  // browser restores focus to whatever opened it.
  useLayoutEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-state={state}
      className={`modal-dialog ${className}`}
      // Esc / back gesture: let our state close it, with the exit animation
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      // a click on the dialog itself (not the sheet inside) is outside the content
      onClick={(e) => e.target === e.currentTarget && close.current()}
    >
      {children}
    </dialog>
  );
}
