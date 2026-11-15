"use client";

import { useRef, useState } from "react";
import { sound } from "./sound";
import { emit, useInteractive } from "./store";

// The cage floats in the same corner on both personas and is never covered
// by popups. It is drawn in two layers so the dog canvas can sit between the
// dark interior (back) and the bars (front).

const W = 120;
const DOME_Y = 44;
const BASE_Y = 132;
const BARS = Array.from({ length: 9 }, (_, i) => 14 + i * 11.5);
const DOOR = [37, 83] as const;

// y of the dome (a half-ellipse) at x.
function domeY(x: number) {
  const cx = W / 2;
  const rx = 46;
  const ry = 36;
  const u = (x - cx) / rx;
  return DOME_Y - ry * Math.sqrt(Math.max(0, 1 - u * u));
}

const domePath = `M14,${DOME_Y} A46,36 0 0 1 106,${DOME_Y} L106,${BASE_Y} L14,${BASE_Y} Z`;

export function CageBack() {
  return (
    <div className="cage-pos cage-back" aria-hidden>
      <svg viewBox="0 0 120 150">
        <defs>
          <radialGradient id="cage-dark" cx="50%" cy="70%" r="70%">
            <stop offset="0" stopColor="var(--cage-in-1)" />
            <stop offset="1" stopColor="var(--cage-in-2)" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="146" rx="58" ry="7" className="cage-glow" />
        <path d={domePath} fill="url(#cage-dark)" />
      </svg>
    </div>
  );
}

export function CageFront() {
  const phase = useInteractive((s) => s.phase);
  const persona = useInteractive((s) => s.persona);
  const release = useInteractive((s) => s.release);
  const open = phase === "escaping";

  // Dragging the latch sideways opens the cage too (it follows the finger and
  // lets go past the end of its slot); a plain tap or click still works.
  const drag = useRef<{ x: number; id: number } | null>(null);
  const opened = useRef(false);
  const [slide, setSlide] = useState(0);
  const SLOT = 12;

  function onPointerDown(e: React.PointerEvent) {
    if (phase !== "caged") return;
    drag.current = { x: e.clientX, id: e.pointerId };
    opened.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || phase !== "caged") return;
    const dx = Math.abs(e.clientX - d.x);
    setSlide(Math.min(SLOT, dx / 2.5));
    if (dx > SLOT * 2.5) {
      drag.current = null;
      opened.current = true;
      setSlide(0);
      release();
    }
  }
  function onPointerEnd() {
    drag.current = null;
    setSlide(0);
  }

  function onClick(e: React.MouseEvent) {
    if (opened.current) {
      // The drag already opened it; swallow the click that follows.
      opened.current = false;
      return;
    }
    if (phase === "caged") release();
    else if (phase === "free" && e.detail !== 0) sound.play("error");
    // In brain rot the real exit is catching the dog. Keyboard users (no
    // pointer, so detail === 0) get a whistle that calls it back instead.
    else if (phase === "free" && e.detail === 0) emit("recall");
  }

  return (
    <button
      id="pet-cage"
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      data-open={open ? "1" : ""}
      aria-label={persona === "cool" ? "籠子(請勿打開)" : "籠子:把狗抓回來放進去就能回到原本的網站"}
      className="cage-pos cage-front"
    >
      <svg viewBox="0 0 120 150" aria-hidden>
        <defs>
          <linearGradient id="cage-metal" x1="0" x2="1">
            <stop offset="0" stopColor="var(--cage-bar-1)" />
            <stop offset=".5" stopColor="var(--cage-bar-2)" />
            <stop offset="1" stopColor="var(--cage-bar-1)" />
          </linearGradient>
          <linearGradient id="cage-sheen" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="cage-shade" cx="50%" cy="62%" r="62%">
            <stop offset="0" stopColor="#04050a" stopOpacity=".28" />
            <stop offset=".55" stopColor="#04050a" stopOpacity=".62" />
            <stop offset="1" stopColor="#04050a" stopOpacity=".94" />
          </radialGradient>
          <linearGradient id="cage-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".2" />
            <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="latch-clip">
            <rect x="80" y="82" width="14" height="10" rx="2" />
          </clipPath>
        </defs>
        {/* cool side: the dog stays in the dark, only its glow reads */}
        <path d={domePath} fill="url(#cage-shade)" className="cage-shade" />
        <path d={domePath} fill="url(#cage-glass)" className="cage-shade" />
        <g className="cage-bars" stroke="url(#cage-metal)" fill="none">
          {/* hanging ring */}
          <circle cx="60" cy="5" r="4" />
          <line x1="60" y1="9" x2="60" y2="12" />
          <path d={`M14,${DOME_Y} A46,36 0 0 1 106,${DOME_Y}`} />
          <line x1="14" y1={DOME_Y} x2="106" y2={DOME_Y} className="thin" />
          {BARS.filter((x) => x < DOOR[0] || x > DOOR[1]).map((x) => (
            <line key={x} x1={x} y1={domeY(x)} x2={x} y2={BASE_Y} />
          ))}
          <line x1="14" y1="90" x2={DOOR[0]} y2="90" className="thin" />
          <line x1={DOOR[1]} y1="90" x2="106" y2="90" className="thin" />
        </g>
        {/* door swings on its left hinge */}
        <g className="cage-door" stroke="url(#cage-metal)" fill="none">
          <rect x={DOOR[0]} y={DOME_Y + 4} width={DOOR[1] - DOOR[0]} height={BASE_Y - DOME_Y - 6} rx="2" />
          {BARS.filter((x) => x > DOOR[0] && x < DOOR[1]).map((x) => (
            <line key={x} x1={x} y1={DOME_Y + 4} x2={x} y2={BASE_Y - 2} />
          ))}
          <line x1="78" y1="87" x2="98" y2="87" className="thin" />
          <rect x="80" y="82" width="14" height="10" rx="2" className="latch" transform={`translate(${-slide} 0)`} />
          <rect className="latch-sheen" x="70" y="80" width="8" height="14" fill="url(#cage-sheen)" stroke="none" clipPath="url(#latch-clip)" />
        </g>
        <rect x="8" y={BASE_Y} width="104" height="12" rx="3" className="cage-base" />
      </svg>
      <span className="cage-tag cool-only" aria-hidden>請勿打開。</span>
      <span className="cage-note rot-only" aria-hidden>請把我抓回來 🥺</span>
    </button>
  );
}
