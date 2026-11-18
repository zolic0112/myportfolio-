"use client";

import { useEffect, useId, useRef } from "react";

// The brand mark: a corner bracket (a viewfinder corner) and a box with two
// slots tucked into it. Drawn in currentColor. The pieces are separate so CSS
// can animate them: the corner draws itself, the box drops in, the slots
// open like eyes (and blink now and then), and with `follow` they glance
// toward the pointer. The slots are cut with a mask so they stay see-through.
export const MARK_CORNER =
  "M98.4286 14C98.4286 12.8954 97.5332 12 96.4286 12L42.8095 12C41.705 12 40.8095 12.8954 40.8095 14V40.8095H14C12.8954 40.8095 12 41.705 12 42.8095V96.4286C12 97.5331 12.8954 98.4286 14 98.4286H40.8095L40.8095 373C40.8095 374.105 41.705 375 42.8095 375H96.4286C97.5331 375 98.4286 374.105 98.4286 373L98.4286 98.4286H373C374.105 98.4286 375 97.5331 375 96.4286V42.8095C375 41.705 374.105 40.8095 373 40.8095H98.4286V14Z";
export const MARK_BOX =
  "M127.238 123.476C127.238 122.372 128.134 121.476 129.238 121.476H373C374.105 121.476 375 122.372 375 123.476V373C375 374.105 374.105 375 373 375H129.238C128.134 375 127.238 374.105 127.238 373V123.476ZM190.619 192.619C190.619 191.514 191.514 190.619 192.619 190.619H309.619C310.724 190.619 311.619 191.514 311.619 192.619V217.429C311.619 218.533 310.724 219.429 309.619 219.429H192.619C191.514 219.429 190.619 218.533 190.619 217.429V192.619ZM192.619 282.81C191.514 282.81 190.619 283.705 190.619 284.81V309.619C190.619 310.724 191.514 311.619 192.619 311.619H309.619C310.724 311.619 311.619 310.724 311.619 309.619V284.81C311.619 283.705 310.724 282.81 309.619 282.81H192.619Z";

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
