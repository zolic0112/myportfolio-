"use client";

import { useEffect } from "react";
import { useInteractive } from "./store";

// Cool side only: the page content leans a few pixels against the pointer,
// the heading most, so it reads as floating in front of the sky. Uses the
// standalone `translate` property so the cards' own hover transform still
// works. It also tells each card where the pointer is (--mx / --my, in the
// card's own pixels) so the rim highlight can follow it like light on a glass
// edge. Off for touch, reduced motion and the rot persona.

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
    const REACH = 280; // px: the rim light's radius
    let rects: DOMRect[] | null = null;
    const lit = new Set<HTMLElement>();
    const invalidate = () => {
      rects = null;
    };

    const apply = (clear: boolean) => {
      for (const [els, px] of sets) {
        for (let i = 0; i < els.length; i++) {
          // alternate cards sit at slightly different depths
          const d = px * (px === 5 && i % 2 ? 1.5 : 1);
          const el = els[i] as HTMLElement;
          el.style.translate = clear ? "" : `${(-x * d).toFixed(2)}px ${(-y * d).toFixed(2)}px`;
          if (clear) {
            el.style.removeProperty("--mx");
            el.style.removeProperty("--my");
          }
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
      // Rim light: only cards within reach of the light get repainted (every
      // repaint re-blurs the glass behind them), and their boxes are measured
      // once per scroll or resize instead of on every pointer move.
      const cards = sets[2][0];
      if (!rects || rects.length !== cards.length) {
        rects = [];
        for (let i = 0; i < cards.length; i++) rects.push((cards[i] as HTMLElement).getBoundingClientRect());
      }
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i] as HTMLElement;
        const r = rects[i];
        const near = e.clientX > r.left - REACH && e.clientX < r.right + REACH && e.clientY > r.top - REACH && e.clientY < r.bottom + REACH;
        if (!near && !lit.has(el)) continue;
        if (near) {
          lit.add(el);
          el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
          el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
        } else {
          lit.delete(el);
          el.style.removeProperty("--mx");
          el.style.removeProperty("--my");
        }
      }
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
    addEventListener("scroll", invalidate, { passive: true });
    addEventListener("resize", invalidate);
    return () => {
      removeEventListener("scroll", invalidate);
      removeEventListener("resize", invalidate);
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      off();
      apply(true);
    };
  }, []);
  return null;
}
