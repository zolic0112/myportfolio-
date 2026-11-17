"use client";

import { useEffect, useState } from "react";

// Keeps something mounted for a moment after it is closed, so it can play a
// closing animation instead of vanishing in one frame. Style the two states
// with [data-state="open"] / [data-state="closed"].
export function usePresence(open: boolean, ms = 240) {
  const [lingering, setLingering] = useState(false);
  const [prev, setPrev] = useState(open);
  if (prev !== open) {
    setPrev(open);
    setLingering(!open);
  }
  useEffect(() => {
    if (!lingering) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setLingering(false), reduce ? 0 : ms);
    return () => clearTimeout(t);
  }, [lingering, ms]);
  return { mounted: open || lingering, state: (open ? "open" : "closed") as "open" | "closed" };
}

/** Runs a DOM change inside a browser view transition when there is one. */
export function withViewTransition(update: () => void, className?: string) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!d.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  const root = document.documentElement;
  if (className) root.classList.add(className);
  d.startViewTransition(update).finished.finally(() => className && root.classList.remove(className));
}
