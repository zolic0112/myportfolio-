"use client";

import { rig } from "./cage3d";
import { useEffect, useRef } from "react";
import { SpaceDogEngine } from "./pet/engine";
import { sound } from "./sound";
import { on, useInteractive } from "./store";

export default function SpaceDog() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);

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
    const unsub = useInteractive.subscribe((s, prev) => {
      if (s.persona !== prev.persona) engine.setPersona(s.persona);
    });
    const offRelease = on("release", () => engine.launch());
    const offRecall = on("recall", () => engine.recall());
    return () => {
      engine.destroy();
      unsub();
      offRelease();
      offRecall();
    };
  }, []);

  return (
    <>
      <canvas ref={canvas} aria-hidden className="pet-canvas" />
      <div ref={hit} className="pet-hit" aria-hidden />
    </>
  );
}
