"use client";

import { useEffect } from "react";

// Cool persona micro-interaction: starfield parallax (--mx/--my on <html>)
// and a soft spotlight that follows the pointer across cards (--sx/--sy).
// Skipped on touch and reduced motion.
export default function Ambient() {
  useEffect(() => {
    if (matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let raf = 0;
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          root.style.setProperty("--mx", mx.toFixed(3));
          root.style.setProperty("--my", my.toFixed(3));
        });
      const card = (e.target as Element | null)?.closest?.(".skin-card") as HTMLElement | null;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${e.clientX - r.left}px`);
        card.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
