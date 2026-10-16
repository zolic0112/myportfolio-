"use client";

import { useEffect, useRef, useState } from "react";
import { gameIds } from "@/games/registry";
import { useInteractive } from "./store";

type PetAction = { say: string; run?: () => void };

const DRAG_THRESHOLD = 4;

export default function DesktopPet() {
  const cycleTheme = useInteractive((s) => s.cycleTheme);
  const launchGame = useInteractive((s) => s.launchGame);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(null), 2500);
    return () => clearTimeout(id);
  }, [bubble]);

  // Add new pet behaviours here; one is picked at random per click.
  const actions: PetAction[] = [
    { say: "嗨!要不要換個風格?", run: cycleTheme },
    { say: "來玩個小遊戲吧!", run: () => launchGame(gameIds[Math.floor(Math.random() * gameIds.length)]) },
    { say: "拖著我到處走走~" },
  ];

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, startX: e.clientX, startY: e.clientY, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) setPos({ x: e.clientX - d.dx, y: e.clientY - d.dy });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d && !d.moved) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      setBubble(action.say);
      action.run?.();
    }
  }

  // Until first dragged, the pet rests in the bottom-right corner via CSS.
  const style = pos ? { left: pos.x, top: pos.y } : { right: 32, bottom: 32 };

  return (
    <div className="fixed z-[80] touch-none select-none" style={style}>
      {bubble && (
        <div className="absolute bottom-full left-1/2 mb-2 w-max max-w-48 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--fg)] shadow-lg">
          {bubble}
        </div>
      )}
      <button
        aria-label="桌寵"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`block h-20 w-20 ${dragging ? "cursor-grabbing scale-110" : "cursor-grab pet-idle"} transition-transform`}
      >
        {/* Placeholder sprite: swap this SVG for your own character art or animation. */}
        <svg viewBox="0 0 80 80" className="h-full w-full drop-shadow-lg">
          <ellipse cx="40" cy="48" rx="30" ry="26" fill="var(--accent)" />
          <circle cx="30" cy="44" r="4" fill="var(--bg)" />
          <circle cx="50" cy="44" r="4" fill="var(--bg)" />
          <path d="M34 56 Q40 61 46 56" stroke="var(--bg)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
