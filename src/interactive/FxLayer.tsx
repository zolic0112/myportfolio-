"use client";

import { useEffect, useRef } from "react";
import { on, useInteractive } from "./store";

// Full-screen, click-through canvas for the brain rot garnish: confetti burst
// when the dog breaks out, emoji bouncing around, a rainbow cursor trail, and
// the reverse "everything gets sucked into the cage" on capture. The loop
// sleeps whenever there is nothing to draw.

type P = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number;
  kind: "confetti" | "emoji" | "trail";
  color: string; glyph?: string; rot: number; vr: number;
};

const COLORS = ["#ff2bd6", "#00f5ff", "#fff200", "#39ff14", "#ff3b30", "#7c63db", "#ffa033"];
const EMOJI = ["💀", "😭", "🔥", "🤡", "💯", "🗿", "😂", "🚨", "👁️", "🍔"];

export default function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    let ps: P[] = [];
    let raf = 0;
    let last = performance.now();
    let sink: { x: number; y: number; t: number } | null = null;
    let DPR = 1;

    const resize = () => {
      DPR = Math.min(2, devicePixelRatio || 1);
      cv.width = innerWidth * DPR;
      cv.height = innerHeight * DPR;
    };
    resize();
    addEventListener("resize", resize);

    const cageCenter = () => {
      const r = document.getElementById("pet-cage")?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth - 60, y: innerHeight - 60 };
    };

    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const confetti = (x: number, y: number, n: number, spread = 1) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6 * spread;
        const sp = 400 + Math.random() * 900;
        ps.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, max: 2 + Math.random() * 1.5, size: 5 + Math.random() * 7,
          kind: "confetti", color: COLORS[(Math.random() * COLORS.length) | 0],
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 20,
        });
      }
      wake();
    };

    const bouncers = (n: number) => {
      for (let i = 0; i < n; i++) {
        ps.push({
          x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.6,
          vx: (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 160),
          vy: (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 160),
          life: 0, max: Infinity, size: 26 + Math.random() * 18,
          kind: "emoji", color: "", glyph: EMOJI[(Math.random() * EMOJI.length) | 0],
          rot: 0, vr: (Math.random() - 0.5) * 3,
        });
      }
      wake();
    };

    let hue = 0;
    const onMove = (e: PointerEvent) => {
      if (useInteractive.getState().persona !== "rot" || reduce || sink) return;
      hue = (hue + 14) % 360;
      ps.push({
        x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 40, vy: 30 + Math.random() * 40,
        life: 0, max: 0.6, size: 7, kind: "trail", color: `hsl(${hue} 100% 55%)`, rot: 0, vr: 0,
      });
      wake();
    };
    addEventListener("pointermove", onMove, { passive: true });

    function loop(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const c = sink ? cageCenter() : null;
      if (sink) sink.t += dt;

      for (const p of ps) {
        p.life += dt;
        if (c) {
          // Suck everything into the cage.
          const k = Math.min(1, dt * (6 + sink!.t * 20));
          p.x += (c.x - p.x) * k;
          p.y += (c.y - p.y) * k;
          p.size *= 1 - Math.min(0.5, dt * 5);
        } else if (p.kind === "confetti") {
          p.vy += 1400 * dt;
          p.vx *= 1 - dt * 1.5;
          p.vy *= 1 - dt * 1.2;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
        } else if (p.kind === "emoji") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.x < 20 || p.x > innerWidth - 20) p.vx = -p.vx;
          if (p.y < 80 || p.y > innerHeight - 20) p.vy = -p.vy;
          p.x = Math.min(innerWidth - 20, Math.max(20, p.x));
          p.y = Math.min(innerHeight - 20, Math.max(80, p.y));
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        const fade = p.max === Infinity ? 1 : Math.max(0, 1 - p.life / p.max);
        ctx.globalAlpha = fade;
        if (p.kind === "emoji") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(p.rot) * 0.4);
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.glyph!, 0, 0);
          ctx.restore();
        } else if (p.kind === "confetti") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * fade, p.size * fade);
        }
      }
      ctx.globalAlpha = 1;
      ps = ps.filter((p) => p.life < p.max && p.size > 0.6 && p.y < innerHeight + 200);
      if (sink && sink.t > 0.55) {
        ps = [];
        sink = null;
      }
      if (ps.length) raf = requestAnimationFrame(loop);
      else {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        raf = 0;
      }
    }

    const offRelease = on("release", () => {
      if (reduce) return;
      const c = cageCenter();
      confetti(c.x, c.y, coarse ? 90 : 180);
      setTimeout(() => {
        confetti(innerWidth / 2, innerHeight * 0.45, coarse ? 60 : 120, 2);
        bouncers(coarse ? 3 : 6);
      }, 260);
    });
    const offSuck = on("suck", () => {
      sink = { ...cageCenter(), t: 0 };
      wake();
    });
    const offThanks = on("thanks", () => {
      if (reduce) return;
      for (let i = 0; i < 5; i++) setTimeout(() => confetti(Math.random() * innerWidth, innerHeight * 0.3, 60, 2), i * 150);
    });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      offRelease();
      offSuck();
      offThanks();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="fx-layer" />;
}
