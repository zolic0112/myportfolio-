"use client";

import { useEffect, useRef, useState } from "react";
import { T, UI } from "@/lib/i18n";
import { BASE_Y, CX, INTERIOR, PLINTH_H, PLINTH_R, R, rig, SHOULDER_Y, DOME_H, SILHOUETTE, TILT } from "./cage3d";
import { sound } from "./sound";
import { emit, useInteractive } from "./store";

// The cage floats in the same corner on both personas and is never covered
// by popups. It is drawn in two layers so the dog canvas can sit between the
// back half (interior, far bars, plinth) and the front half (near bars, door,
// glass). The geometry is a real 3D model projected by cage3d.ts, which also
// turns it: idle sway, a lean toward the pointer, a rock when the dog bumps it.

const BARS = 16;
const HOOPS = 4;
const n = (k: number) => Array.from({ length: k }, (_, i) => i);

const PY = BASE_Y + PLINTH_H; // bottom of the plinth
const PRY = PLINTH_R * TILT;
const plinthSide = `M${CX - PLINTH_R},${BASE_Y} L${CX - PLINTH_R},${PY} A${PLINTH_R},${PRY} 0 0 0 ${CX + PLINTH_R},${PY} L${CX + PLINTH_R},${BASE_Y} A${PLINTH_R},${PRY} 0 0 1 ${CX - PLINTH_R},${BASE_Y} Z`;
const plinthRim = `M${CX - PLINTH_R},${BASE_Y} A${PLINTH_R},${PRY} 0 0 0 ${CX + PLINTH_R},${BASE_Y}`;
const TOP_Y = SHOULDER_Y - DOME_H;

function useLayer(kind: "back" | "front") {
  const bars = useRef<(SVGPathElement | null)[]>([]);
  const hoops = useRef<(SVGPathElement | null)[]>([]);
  const hl = useRef<(SVGPathElement | null)[]>([]);
  const frame = useRef<SVGPathElement>(null);
  const doorBars = useRef<SVGPathElement>(null);
  const latch = useRef<SVGPathElement>(null);
  useEffect(() => {
    rig[kind] = {
      bars: bars.current as SVGPathElement[],
      hoops: hoops.current as SVGPathElement[],
      hl: kind === "front" ? (hl.current as SVGPathElement[]) : undefined,
      door: kind === "front" ? { frame: frame.current!, bars: doorBars.current!, latch: latch.current! } : undefined,
    };
    rig.start();
    rig.draw();
    return () => {
      rig[kind] = null;
      rig.stop();
    };
  }, [kind]);
  return { bars, hoops, hl, frame, doorBars, latch };
}

export function CageBack() {
  const L = useLayer("back");
  return (
    <div className="cage-pos cage-back" aria-hidden>
      {/* cool side: frosts whatever is behind the jar (the dog is in front of this) */}
      <div className="cage-frost" />
      <svg viewBox="0 0 120 150">
        <defs>
          <radialGradient id="cage-dark" cx="50%" cy="72%" r="70%">
            <stop offset="0" stopColor="var(--cage-in-1)" />
            <stop offset="1" stopColor="var(--cage-in-2)" />
          </radialGradient>
          {/* a turned cylinder: light from the upper left */}
          <linearGradient id="c3-plinth" gradientUnits="userSpaceOnUse" x1={CX - PLINTH_R} x2={CX + PLINTH_R} y1="0" y2="0">
            <stop offset="0" stopColor="var(--plinth-1)" />
            <stop offset=".22" stopColor="var(--plinth-3)" />
            <stop offset=".5" stopColor="var(--plinth-2)" />
            <stop offset=".85" stopColor="var(--plinth-1)" />
            <stop offset="1" stopColor="var(--plinth-2)" />
          </linearGradient>
          <radialGradient id="c3-top" cx="40%" cy="35%" r="75%">
            <stop offset="0" stopColor="var(--plinth-top-1)" />
            <stop offset="1" stopColor="var(--plinth-top-2)" />
          </radialGradient>
          <radialGradient id="c3-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#000" stopOpacity=".55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={PY + 3} rx={PLINTH_R + 8} ry={PRY + 3} className="cage-glow" />
        <path d={plinthSide} fill="url(#c3-plinth)" className="c3-plinth-side" />
        <ellipse cx={CX} cy={BASE_Y} rx={PLINTH_R} ry={PRY} fill="url(#c3-top)" className="c3-plinth-top" />
        <path d={plinthRim} className="c3-rim" />
        <path d={INTERIOR} fill="url(#cage-dark)" className="c3-interior" />
        <ellipse cx={CX} cy={BASE_Y} rx={R * 0.9} ry={R * TILT * 0.9} fill="url(#c3-floor)" />
        <g className="c3-far" fill="none">
          {n(HOOPS).map((i) => (
            <path key={i} ref={(e) => void (L.hoops.current[i] = e)} className={`c3-hoop h${i}`} />
          ))}
          {n(BARS).map((i) => (
            <path key={i} ref={(e) => void (L.bars.current[i] = e)} className="c3-bar" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function CageFront() {
  const phase = useInteractive((s) => s.phase);
  const persona = useInteractive((s) => s.persona);
  const release = useInteractive((s) => s.release);
  const open = phase === "escaping";
  const L = useLayer("front");
  const { frame, doorBars, latch } = L;
  const host = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    rig.host = host.current;
    return () => void (rig.host = null);
  }, []);

  // Dragging the latch sideways opens the cage too (it follows the finger and
  // lets go past the end of its slot); a plain tap or click still works.
  const drag = useRef<{ x: number; id: number } | null>(null);
  const opened = useRef(false);
  const [, setSlide] = useState(0);
  const SLOT = 12;
  const slideTo = (v: number) => {
    rig.slide = v;
    rig.draw();
    setSlide(v);
  };

  function onPointerDown(e: React.PointerEvent) {
    if (phase !== "caged") return;
    drag.current = { x: e.clientX, id: e.pointerId };
    opened.current = false;
    // keep the drag on the cage, so sliding the door never sweeps over text
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || phase !== "caged") return;
    const dx = Math.abs(e.clientX - d.x);
    slideTo(Math.min(SLOT * 0.6, dx / 4));
    if (dx > SLOT * 2.5) {
      drag.current = null;
      opened.current = true;
      slideTo(0);
      release();
    }
  }
  function onPointerEnd() {
    drag.current = null;
    slideTo(0);
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
      ref={host}
      id="pet-cage"
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      data-open={open ? "1" : ""}
      className="cage-pos cage-front"
    >
      <span className="sr-only">
        <T v={persona === "cool" ? UI.cageCool : UI.cageRot} />
      </span>
      <svg viewBox="0 0 120 150" aria-hidden>
        <defs>
          {/* user-space units: a vertical bar has a zero-width box, and a
              bounding-box gradient on it would not paint at all. The light
              comes from the upper left, so bars darken toward the right. */}
          <linearGradient id="cage-metal" gradientUnits="userSpaceOnUse" x1={CX - R} y1="0" x2={CX + R} y2="0">
            <stop offset="0" stopColor="var(--cage-bar-1)" />
            <stop offset=".3" stopColor="var(--cage-bar-2)" />
            <stop offset=".62" stopColor="var(--cage-bar-1)" />
            <stop offset=".9" stopColor="var(--cage-bar-3)" />
            <stop offset="1" stopColor="var(--cage-bar-1)" />
          </linearGradient>
          <radialGradient id="cage-shade" cx="50%" cy="62%" r="62%">
            <stop offset="0" stopColor="#04050a" stopOpacity=".28" />
            <stop offset=".55" stopColor="#04050a" stopOpacity=".62" />
            <stop offset="1" stopColor="#04050a" stopOpacity=".94" />
          </radialGradient>
          {/* glass: brighter at the rims, where you look through more of it */}
          <linearGradient id="c3-glass" gradientUnits="userSpaceOnUse" x1={CX - R} x2={CX + R} y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity=".2" />
            <stop offset=".12" stopColor="#fff" stopOpacity=".05" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".01" />
            <stop offset=".88" stopColor="#fff" stopOpacity=".04" />
            <stop offset="1" stopColor="#fff" stopOpacity=".16" />
          </linearGradient>
          <radialGradient id="c3-knob" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="var(--cage-bar-2)" />
            <stop offset="1" stopColor="var(--cage-bar-1)" />
          </radialGradient>
        </defs>
        {/* cool side: the dog stays in the dark, only its glow reads */}
        <path d={SILHOUETTE} fill="url(#cage-shade)" className="cage-shade" />
        <path d={SILHOUETTE} fill="url(#c3-glass)" className="c3-glass" />
        <g className="c3-near" fill="none">
          {n(HOOPS).map((i) => (
            <path key={i} ref={(e) => void (L.hoops.current[i] = e)} className={`c3-hoop h${i}`} />
          ))}
          {n(BARS).map((i) => (
            <path key={i} ref={(e) => void (L.bars.current[i] = e)} className="c3-bar" />
          ))}
          {n(BARS).map((i) => (
            <path key={i} ref={(e) => void (L.hl.current[i] = e)} className="c3-hl" />
          ))}
        </g>
        <g className="c3-door" fill="none">
          <path ref={frame} className="c3-door-frame" />
          <path ref={doorBars} className="c3-door-bars" />
          <path ref={latch} className="c3-latch" />
        </g>
        {/* finial and hanging ring on top of the dome */}
        <g className="c3-top">
          <path d={`M${CX},${TOP_Y - 3} L${CX},${TOP_Y - 7}`} className="c3-stem" />
          <circle cx={CX} cy={TOP_Y - 11} r="4.2" className="c3-ring" />
          <ellipse cx={CX} cy={TOP_Y - 1} rx="5" ry="3" fill="url(#c3-knob)" className="c3-knob" />
        </g>
        {/* fixed reflections: they stay put while the bars turn, which is
            most of what makes it read as a round glass object */}
        <path d={`M${CX - R + 6},${BASE_Y - 8} L${CX - R + 6},${SHOULDER_Y} A${R - 6},${DOME_H - 4} 0 0 1 ${CX - 12},${TOP_Y + 6}`} className="cage-spec" />
        <path d={`M${CX + R - 4},${BASE_Y - 14} L${CX + R - 4},${SHOULDER_Y + 10}`} className="cage-spec dim" />
      </svg>
      <span className="cage-tag cool-only" aria-hidden><T v={UI.cageTag} /></span>
      <span className="cage-note rot-only" aria-hidden><T v={UI.cageNote} /></span>
    </button>
  );
}
