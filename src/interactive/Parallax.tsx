"use client";

import { useEffect } from "react";
import { useInteractive } from "./store";

// Cool side only: the page content leans a few pixels against the pointer,
// the heading most, so it reads as floating in front of the sky. Uses the
// standalone `translate` property so the cards' own hover transform still
// works. Off for touch, reduced motion and the rot persona.

const LAYERS: [className: string, px: number][] = [
  ["skin-h1", 12],
  ["skin-lede", 7],
  ["skin-card", 5],
];

export default function Parallax() {
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // live collections: they follow client-side navigation without re-querying
    const sets = LAYERS.map(([c, px]) => [document.getElementsByClassName(c), px] as const);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, last = 0;

    const apply = (clear: boolean) => {
      for (const [els, px] of sets) {
        for (let i = 0; i < els.length; i++) {
          // alternate cards sit at slightly different depths
          const d = px * (px === 5 && i % 2 ? 1.5 : 1);
          (els[i] as HTMLElement).style.translate = clear ? "" : `${(-x * d).toFixed(2)}px ${(-y * d).toFixed(2)}px`;
        }
      }
    };
    const tick = (now: number) => {
      // time-based easing, so it settles just as fast on a slow display
      const k = 1 - Math.exp(-Math.min(100, now - (last || now - 16)) * 0.0038);
      last = now;
      x += (tx - x) * k;
      y += (ty - y) * k;
      apply(false);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0;
      if (!raf) last = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (useInteractive.getState().persona !== "cool") return;
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const off = useInteractive.subscribe((s) => {
      if (s.persona === "cool") return;
      cancelAnimationFrame(raf);
      raf = 0;
      tx = ty = x = y = 0;
      apply(true);
    });
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      off();
      apply(true);
    };
  }, []);
  return null;
}
