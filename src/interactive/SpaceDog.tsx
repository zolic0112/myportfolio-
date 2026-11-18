"use client";

import { useEffect, useRef, useState } from "react";
import { rig } from "./cage3d";
import { SpaceDogEngine, type EngineCallbacks } from "./pet/engine";
import { J } from "./junk-text";
import { sound } from "./sound";
import { on, useInteractive } from "./store";

// On big screens the loose dog splits in three after a while: two clones jump
// out of it and run off on their own. Catching a clone pops it ("fake!");
// only the real one goes back in the cage. Phones keep a single dog.
const SPLIT_AFTER = 14000;
const SPLIT_AGAIN = 30000;
const bigScreen = () =>
  innerWidth >= 1024 && matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;

function poof(x: number, y: number, text: string) {
  const el = document.createElement("div");
  el.className = "dog-poof";
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

export default function SpaceDog() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const main = useRef<SpaceDogEngine | null>(null);
  // each clone keeps its own direction: it must not change (and respawn the clone) when the other one goes
  const [clones, setClones] = useState<{ id: number; dir: number }[]>([]);
  const phase = useInteractive((s) => s.phase);
  // Clones go the moment the dog is caught (adjusted during render, not in an effect).
  const [seenPhase, setSeenPhase] = useState(phase);
  if (seenPhase !== phase) {
    setSeenPhase(phase);
    if (phase !== "free") setClones([]);
  }

  useEffect(() => {
    const getCage = () => document.getElementById("pet-cage");
    const engine = new SpaceDogEngine(canvas.current!, hit.current!, getCage, {
      onBump: () => {
        const c = getCage();
        if (!c) return;
        c.classList.remove("bump");
        void c.offsetWidth; // restart the shake animation
        c.classList.add("bump");
        rig.kick(Math.random() < 0.5 ? -1 : 1);
      },
      onDodge: () => sound.play("squeak"),
      onLand: (hard) => hard && sound.play("boing"),
      onCaptured: () => useInteractive.getState().capture(),
      onVoice: (v) => sound.play(v),
      onGrab: (g) => document.documentElement.classList.toggle("grabbing", g),
    });
    main.current = engine;
    const unsub = useInteractive.subscribe((s, prev) => {
      if (s.persona !== prev.persona) engine.setPersona(s.persona);
    });
    const offRelease = on("release", () => engine.launch());
    const offRecall = on("recall", () => engine.recall());
    return () => {
      engine.destroy();
      main.current = null;
      unsub();
      offRelease();
      offRecall();
    };
  }, []);

  // The split: while the dog is loose and no clones are about, wait, then
  // split (if it is not being held right then; otherwise try again shortly).
  const splits = useRef(0);
  useEffect(() => {
    if (phase !== "free") {
      splits.current = 0;
      return;
    }
    if (clones.length) return;
    let t: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const w = main.current?.where();
      if (!w?.ready || !bigScreen()) {
        t = setTimeout(attempt, 1500);
        return;
      }
      splits.current++;
      sound.play("pop");
      poof(w.x, w.y - 40, "×3!!");
      const now = Date.now();
      setClones([{ id: now, dir: -1 }, { id: now + 1, dir: 1 }]);
    };
    t = setTimeout(attempt, splits.current ? SPLIT_AGAIN : SPLIT_AFTER);
    return () => clearTimeout(t);
  }, [phase, clones.length]);

  return (
    <>
      {/* only the real dog takes part in page transitions (names must be unique) */}
      <canvas ref={canvas} aria-hidden className="pet-canvas main" />
      <div ref={hit} className="pet-hit" aria-hidden />
      {clones.map(({ id, dir }) => (
        <Clone
          key={id}
          from={main}
          dir={dir}
          gone={() => setClones((c) => c.filter((x) => x.id !== id))}
        />
      ))}
    </>
  );
}

function Clone({ from, dir, gone }: { from: React.RefObject<SpaceDogEngine | null>; dir: number; gone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const goneRef = useRef(gone);
  useEffect(() => {
    goneRef.current = gone;
  });
  useEffect(() => {
    const getCage = () => document.getElementById("pet-cage");
    let popped = false; // caught: it already went with a "fake!"
    const cb: EngineCallbacks = {
      onBump: () => {},
      onDodge: () => sound.play("squeak"),
      onLand: () => {},
      onCaptured: () => {},
      onVoice: (v) => Math.random() < 0.4 && sound.play(v),
      onGrab: () => {},
      onPoof: (x, y) => {
        popped = true;
        sound.play("pop");
        poof(x, y - 30, J.fake[(document.documentElement.dataset.lang as keyof typeof J.fake) || "zh"] ?? J.fake.zh);
        goneRef.current();
      },
    };
    const engine = new SpaceDogEngine(canvas.current!, hit.current!, getCage, cb, true);
    const born = Date.now();
    const w = from.current?.where();
    engine.spawnFree(w?.x ?? innerWidth / 2, w?.y ?? innerHeight / 2, dir);
    return () => {
      // vanish with a puff when the real one is caught or the page tidies up
      const p = engine.where();
      if (!popped && p.ready && Date.now() - born > 500) poof(p.x, p.y - 30, "💨");
      engine.destroy();
    };
  }, [from, dir]);
  return (
    <>
      <canvas ref={canvas} aria-hidden className="pet-canvas" />
      <div ref={hit} className="pet-hit" aria-hidden />
    </>
  );
}
