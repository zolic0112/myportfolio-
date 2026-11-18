"use client";

import { useT } from "@/lib/useLang";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { games } from "@/games/registry";
import { useInteractive, useJunkOn } from "@/interactive/store";
import { T, UI, type L } from "@/lib/i18n";
import { placeholderHue } from "@/lib/labels";
import AdGate from "./AdGate";
import { usePresence } from "@/interactive/presence";

type Embed =
  | { discriminant: "none"; value: null }
  | { discriminant: "internal"; value: string }
  | { discriminant: "iframe"; value: string };

type Props = {
  slug: string;
  title: L;
  cover: string | null;
  video: string;
  gallery: string[];
  embed: Embed;
  mobilePlayable: boolean;
};

const subscribeNoop = () => () => {};
const isMobile = () => matchMedia("(pointer: coarse) and (max-width: 900px)").matches;

function videoSrc(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return { kind: "iframe" as const, src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { kind: "iframe" as const, src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { kind: "file" as const, src: url };
}

// Media first, like a video watch page / game page. Playable things show a
// cover and only load on "▶". On brain rot a fake ad plays first.
export default function WorkMedia({ slug, title, cover, video, gallery, embed, mobilePlayable }: Props) {
  const junk = useJunkOn();
  const launchGame = useInteractive((s) => s.launchGame);
  const mobile = useSyncExternalStore(subscribeNoop, isMobile, () => false);
  const [started, setStarted] = useState(false);
  const [ad, setAd] = useState(false);

  const playable = embed.discriminant !== "none" && !(mobile && !mobilePlayable);
  const blockedOnMobile = embed.discriminant !== "none" && mobile && !mobilePlayable;
  const hasPlayer = playable || Boolean(video);

  const go = () => {
    if (embed.discriminant === "internal" && playable && games[embed.value]) launchGame(embed.value);
    else setStarted(true);
  };
  const start = () => (junk ? setAd(true) : go());

  let stage: React.ReactNode;
  if (started && playable && embed.discriminant === "iframe") {
    stage = <iframe src={embed.value} title={title.en} allow="fullscreen; autoplay; gamepad" className="absolute inset-0 h-full w-full" />;
  } else if (started && video) {
    const v = videoSrc(video);
    stage =
      v.kind === "iframe" ? (
        <iframe src={v.src} title={title.en} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
      ) : (
        <video src={v.src} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black" />
      );
  } else {
    stage = (
      <>
        {cover ? (
          <Image src={cover} alt="" fill priority className="object-cover" sizes="(min-width: 1024px) 66vw, 100vw" />
        ) : gallery[0] ? (
          <Image src={gallery[0]} alt="" fill priority className="object-cover" sizes="(min-width: 1024px) 66vw, 100vw" />
        ) : (
          <div className="ph" style={{ "--h": placeholderHue(slug) } as React.CSSProperties}>
            <span><T v={title} /></span>
          </div>
        )}
        {hasPlayer && (
          <div className="absolute inset-0 z-[2] grid place-items-center">
            <button className="skin-btn" onClick={start}>
              <T v={playable ? UI.play : UI.watch} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="skin-panel overflow-hidden">
        <div className="skin-titlebar">
          <span className="t"><T v={title} /> — <T v={UI.mediaPlayer} /></span>
          <span className="win-btn" aria-hidden>_</span>
          <span className="win-btn" aria-hidden>□</span>
          <span className="win-btn" aria-hidden>×</span>
        </div>
        <div className="skin-media relative aspect-video" data-vt="work-hero" style={{ viewTransitionName: "work-hero" }}>
          {stage}
          {ad && (
            <AdGate
              onDone={() => {
                setAd(false);
                go();
              }}
            />
          )}
        </div>
      </div>
      {blockedOnMobile && (
        <p className="text-sm text-muted">
          <T v={UI.noMobile} /> {video && <T v={UI.demoVideo} />}
        </p>
      )}
      {gallery.length > 0 && <Gallery images={gallery} />}
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);
  const [shownIdx, setShownIdx] = useState(0);
  if (open !== null && open !== shownIdx) setShownIdx(open);
  const { mounted, state } = usePresence(open !== null, 220);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i! + 1) % images.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i! - 1 + images.length) % images.length);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, images.length]);
  return (
    <>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {images.map((src, i) => (
          <button key={src} onClick={() => setOpen(i)} className="skin-media relative aspect-[4/3] w-40 flex-none snap-start overflow-hidden rounded-xl sm:w-52">
            <Image src={src} alt={`${t(UI.image)} ${i + 1}`} fill className="object-cover" sizes="208px" />
          </button>
        ))}
      </div>
      {mounted && (
        <div role="dialog" aria-label={t(UI.image)} data-state={state} className="vt-backdrop fixed inset-0 z-[56] grid place-items-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          <div data-state={state} className="vt-sheet relative h-[85vh] w-full max-w-5xl">
            <Image key={shownIdx} src={images[shownIdx]} alt={`${t(UI.image)} ${shownIdx + 1}`} fill className="vt-step object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </>
  );
}
