"use client";

import { games } from "@/games/registry";
import { useInteractive } from "@/interactive/store";

type Embed =
  | { discriminant: "none"; value: null }
  | { discriminant: "internal"; value: string }
  | { discriminant: "iframe"; value: string };

export default function WorkEmbed({ embed, title }: { embed: Embed; title: string }) {
  const launchGame = useInteractive((s) => s.launchGame);

  if (embed.discriminant === "internal" && games[embed.value]) {
    return (
      <button
        onClick={() => launchGame(embed.value)}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-bg"
      >
        ▶ 開始玩
      </button>
    );
  }

  if (embed.discriminant === "iframe" && embed.value) {
    return (
      <iframe
        src={embed.value}
        title={title}
        allow="fullscreen; autoplay; gamepad"
        className="aspect-video w-full rounded-xl border border-border bg-card"
      />
    );
  }

  return null;
}
