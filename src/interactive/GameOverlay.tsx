"use client";

import { Suspense, useEffect } from "react";
import { games } from "@/games/registry";
import { T, UI } from "@/lib/i18n";
import { useInteractive } from "./store";

export default function GameOverlay() {
  const activeGame = useInteractive((s) => s.activeGame);
  const closeGame = useInteractive((s) => s.closeGame);

  useEffect(() => {
    if (!activeGame) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeGame();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeGame, closeGame]);

  const entry = activeGame ? games[activeGame] : null;
  if (!entry) return null;
  const Game = entry.component;

  return (
    <div
      role="dialog"
      aria-label={entry.title}
      className="fixed inset-0 z-[56] flex items-center justify-center bg-black/60 p-4"
      onClick={closeGame}
    >
      <div
        className="skin-panel relative h-[min(80vh,600px)] w-[min(90vw,800px)] overflow-hidden text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeGame}
          aria-label="關閉"
          className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-sm opacity-60 hover:opacity-100"
        >
          ✕
        </button>
        <Suspense fallback={<p className="p-6 text-sm opacity-60"><T v={UI.loading} /></p>}>
          <Game onExit={closeGame} />
        </Suspense>
      </div>
    </div>
  );
}
