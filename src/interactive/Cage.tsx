"use client";

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

  function onClick(e: React.MouseEvent) {
    if (phase === "caged") release();
    // In brain rot the real exit is catching the dog. Keyboard users (no
    // pointer, so detail === 0) get a whistle that calls it back instead.
    else if (phase === "free" && e.detail === 0) emit("recall");
  }

  return (
    <button
      id="pet-cage"
      type="button"
      onClick={onClick}
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
          <clipPath id="latch-clip">
            <rect x="80" y="82" width="14" height="10" rx="2" />
          </clipPath>
        </defs>
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
          <rect x="80" y="82" width="14" height="10" rx="2" className="latch" />
          <rect className="latch-sheen" x="70" y="80" width="8" height="14" fill="url(#cage-sheen)" stroke="none" clipPath="url(#latch-clip)" />
        </g>
        <rect x="8" y={BASE_Y} width="104" height="12" rx="3" className="cage-base" />
      </svg>
      <span className="cage-tag cool-only" aria-hidden>請勿打開。</span>
      <span className="cage-note rot-only" aria-hidden>請把我抓回來 🥺</span>
    </button>
  );
}
