"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { games } from "@/games/registry";
import { useInteractive, useJunkOn } from "@/interactive/store";
import { placeholderHue } from "@/lib/labels";
import AdGate from "./AdGate";

type Embed =
  | { discriminant: "none"; value: null }
  | { discriminant: "internal"; value: string }
  | { discriminant: "iframe"; value: string };

type Props = {
  slug: string;
  title: string;
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
    stage = <iframe src={embed.value} title={title} allow="fullscreen; autoplay; gamepad" className="absolute inset-0 h-full w-full" />;
  } else if (started && video) {
    const v = videoSrc(video);
    stage =
      v.kind === "iframe" ? (
        <iframe src={v.src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
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
            <span>{title}</span>
          </div>
        )}
        {hasPlayer && (
          <div className="absolute inset-0 z-[2] grid place-items-center">
            <button className="skin-btn" onClick={start}>
              {playable ? "▶ 開始玩" : "▶ 播放"}
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
          <span className="t">{title} — 媒體播放程式</span>
          <span className="win-btn" aria-hidden>_</span>
          <span className="win-btn" aria-hidden>□</span>
          <span className="win-btn" aria-hidden>×</span>
        </div>
        <div className="skin-media relative aspect-video">
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
          這件作品在手機上無法遊玩{video ? ",上面是示範影片" : ""},請用電腦開啟。
        </p>
      )}
      {gallery.length > 0 && <Gallery images={gallery} />}
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
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
            <Image src={src} alt={`圖 ${i + 1}`} fill className="object-cover" sizes="208px" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div role="dialog" aria-label="圖片" className="fixed inset-0 z-[56] grid place-items-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          <div className="relative h-[85vh] w-full max-w-5xl">
            <Image src={images[open]} alt={`圖 ${open + 1}`} fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </>
  );
}
