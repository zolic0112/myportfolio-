"use client";

import { useEffect, useId, useRef } from "react";

// The brand mark: a corner bracket (a viewfinder corner) and a box with two
// slots tucked into it. Drawn in currentColor. The pieces are separate so CSS
// can animate them: the corner draws itself, the box drops in, the slots
// open like eyes (and blink now and then), and with `follow` they glance
// toward the pointer. The slots are cut with a mask so they stay see-through.
import { MARK_BOX, MARK_CORNER } from "./brand-paths";

export { MARK_BOX, MARK_CORNER };

const SLOT = { x: 190.619, w: 121, h: 28.81, rx: 2 };
const SLOT_Y = [190.619, 282.81];

type Props = { className?: string; follow?: boolean };

export default function BrandMark({ className = "", follow = false }: Props) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);

  // The slots glance toward the pointer (fine pointers only, never while
  // reduced motion is on). One rAF per move, writes two custom properties.
  useEffect(() => {
    const el = ref.current;
    if (!follow || !el) return;
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) + 160;
      el.style.setProperty("--lx", `${((dx / d) * 16).toFixed(1)}px`);
      el.style.setProperty("--ly", `${((dy / d) * 12).toFixed(1)}px`);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.setProperty("--lx", "0px");
      el.style.setProperty("--ly", "0px");
    };
    addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [follow]);

  return (
    <svg ref={ref} className={`brand-mark ${className}`} viewBox="0 0 388 388" fill="currentColor" aria-hidden>
      <defs>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="388" height="388">
          <rect width="388" height="388" fill="#fff" />
          <g className="bm-eyes">
            {SLOT_Y.map((y, i) => (
              <rect key={y} className={`bm-slot bm-slot-${i}`} x={SLOT.x} y={y} width={SLOT.w} height={SLOT.h} rx={SLOT.rx} fill="#000" />
            ))}
          </g>
        </mask>
        <clipPath id={`${id}c`}>
          <path d={MARK_CORNER} />
          <path d={MARK_BOX} clipRule="evenodd" />
        </clipPath>
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="bm-corner" d={MARK_CORNER} pathLength={1} />
      <g className="bm-box">
        <rect x="127.238" y="121.476" width="247.762" height="253.524" rx="2" mask={`url(#${id}m)`} />
      </g>
      {/* a light sweep across the finished mark, once */}
      <g clipPath={`url(#${id}c)`} className="bm-glint-clip">
        <rect className="bm-glint" x="-160" y="-60" width="110" height="520" fill={`url(#${id}g)`} />
      </g>
    </svg>
  );
}
