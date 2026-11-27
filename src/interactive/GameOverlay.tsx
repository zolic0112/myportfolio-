"use client";

import { Suspense, useState } from "react";
import { games } from "@/games/registry";
import { T, UI } from "@/lib/i18n";
import { useT } from "@/lib/useLang";
import { J } from "./junk-text";
import ModalDialog from "./ModalDialog";
import { usePresence } from "./presence";
import { useInteractive } from "./store";

export default function GameOverlay() {
  const activeGame = useInteractive((s) => s.activeGame);
  const closeGame = useInteractive((s) => s.closeGame);
  const t = useT();

  // Remember the last game so the window can animate out after it is closed.
  const [last, setLast] = useState(activeGame);
  if (activeGame && activeGame !== last) setLast(activeGame);
  const { mounted, state } = usePresence(Boolean(activeGame), 220);
  const entry = mounted && last ? games[last] : null;
  if (!entry) return null;
  const Game = entry.component;

  return (
    <ModalDialog
      label={entry.title}
      state={state}
      onClose={closeGame}
      className="vt-backdrop flex items-center justify-center bg-black/60 p-4"
    >
      <div
        data-state={state}
        className="vt-sheet skin-panel relative h-[min(80vh,600px)] w-[min(90vw,800px)] overflow-hidden text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeGame}
          aria-label={t(J.close)}
          className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-sm opacity-60 hover:opacity-100"
        >
          ✕
        </button>
        <Suspense fallback={<p className="p-6 text-sm opacity-60"><T v={UI.loading} /></p>}>
          <Game onExit={closeGame} />
        </Suspense>
      </div>
    </ModalDialog>
  );
}
