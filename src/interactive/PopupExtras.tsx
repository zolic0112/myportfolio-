"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sound } from "./sound";
import { useInteractive } from "./store";

// The two heavier popup types: one you have to play to close, and one you
// can actually scroll like a short-video feed.

// ---------------------------------------------------------------- mini-games

export function MiniGame({ done }: { done: () => void }) {
  // Pick the variant once per popup.
  const [variant] = useState(() => (Math.random() < 0.5 ? "whack" : "captcha"));
  return variant === "whack" ? <Whack done={done} /> : <Captcha done={done} />;
}

const HITS = 5;

/** Catch the dog five times; it teleports after every hit. */
function Whack({ done }: { done: () => void }) {
  const [hits, setHits] = useState(0);
  const [at, setAt] = useState({ l: 40, t: 40 });
  const hit = () => {
    sound.play("squeak");
    if (hits + 1 >= HITS) return done();
    setHits(hits + 1);
    setAt({ l: Math.random() * 82, t: Math.random() * 70 });
  };
  return (
    <div className="grid gap-2">
      <p>
        <b>抓到狗 {HITS} 次</b>才能關閉這個視窗。({hits}/{HITS})
      </p>
      <div className="relative h-32 border-2 border-black bg-[#39ff14]">
        <button
          onClick={hit}
          aria-label="狗"
          className="absolute text-3xl leading-none transition-none"
          style={{ left: `${at.l}%`, top: `${at.t}%` }}
        >
          🐶
        </button>
      </div>
    </div>
  );
}

const DECOYS = ["🐱", "🦊", "🐻", "🐹", "🐰", "🐺"];

function newGrid() {
  const cells = Array.from({ length: 9 }, () => DECOYS[(Math.random() * DECOYS.length) | 0]);
  const dogs = new Set<number>();
  while (dogs.size < 3) dogs.add((Math.random() * 9) | 0);
  dogs.forEach((i) => (cells[i] = "🐶"));
  return cells;
}

/** "Prove you are not a robot": pick every dog. A wrong answer reshuffles. */
function Captcha({ done }: { done: () => void }) {
  const [cells, setCells] = useState(newGrid);
  const [picked, setPicked] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const check = () => {
    const ok = cells.every((c, i) => (c === "🐶") === picked.includes(i));
    if (ok) return done();
    sound.play("error");
    setWrong(true);
    setPicked([]);
    setCells(newGrid());
  };
  return (
    <div className="grid gap-2">
      <p>
        <b>請證明你不是機器人:</b>選出所有的狗。{wrong && <span style={{ color: "red" }}> 錯了,再來。</span>}
      </p>
      <div className="grid grid-cols-3 gap-1">
        {cells.map((c, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            aria-pressed={picked.includes(i)}
            className="h-12 border-2 bg-white text-2xl"
            style={{ borderColor: picked.includes(i) ? "#0000ee" : "#808080", outline: picked.includes(i) ? "2px solid #0000ee" : "none" }}
          >
            {c}
          </button>
        ))}
      </div>
      <button className="win-button justify-self-end" onClick={check}>驗證</button>
    </div>
  );
}

// ---------------------------------------------------------------- reels

function ytId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=|embed\/))([\w-]{11})/)?.[1] ?? null;
}

/**
 * A feed you scroll yourself: platforms have no "random feed" embed, so the
 * site plays a hand-kept list one video at a time. Only the current video is
 * loaded. A deleted/blocked video (player error) or the end of a video skips
 * to the next one.
 */
export function Reels({ urls }: { urls: string[] }) {
  const ids = urls.map(ytId).filter((x): x is string => Boolean(x));
  const muted = useInteractive((s) => s.muted);
  const [i, setI] = useState(() => (Math.random() * Math.max(1, ids.length)) | 0);
  const frame = useRef<HTMLIFrameElement>(null);
  const drag = useRef<number | null>(null);
  const wheelAt = useRef(0);

  const go = useCallback((d: number) => setI((v) => (v + d + ids.length) % ids.length), [ids.length]);

  // Listen to the YouTube player: error → next, ended → next.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname) || typeof e.data !== "string") return;
      try {
        const m = JSON.parse(e.data);
        if (m.event === "onError" || (m.event === "onStateChange" && m.info === 0)) go(1);
      } catch {}
    };
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, [go]);

  // On phones the popup is nearly full screen: lock the page behind it.
  useEffect(() => {
    if (!matchMedia("(max-width: 640px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!ids.length) return <p>沒有影片。</p>;
  const id = ids[i % ids.length];
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;

  const listen = () => {
    const w = frame.current?.contentWindow;
    w?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    for (const ev of ["onError", "onStateChange"])
      w?.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: [ev], id: 1, channel: "widget" }), "*");
  };

  return (
    <div className="reels">
      <iframe key={id} ref={frame} src={src} title="short video" allow="autoplay; encrypted-media" onLoad={listen} />
      {/* Swipe / wheel surface over the player (the iframe would swallow the gestures). */}
      <div
        className="reels-touch"
        onPointerDown={(e) => (drag.current = e.clientY)}
        onPointerUp={(e) => {
          const dy = drag.current === null ? 0 : e.clientY - drag.current;
          drag.current = null;
          if (Math.abs(dy) > 40) go(dy < 0 ? 1 : -1);
        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) < 20 || e.timeStamp - wheelAt.current < 500) return;
          wheelAt.current = e.timeStamp;
          go(e.deltaY > 0 ? 1 : -1);
        }}
      />
      <div className="reels-nav">
        <button className="win-button" onClick={() => go(-1)} aria-label="上一支">▲</button>
        <button className="win-button" onClick={() => go(1)} aria-label="下一支">▼</button>
      </div>
      <div className="reels-side" aria-hidden>
        <span>❤️<br />9.9M</span>
        <span>💬<br />1</span>
        <span>↪️<br />分享</span>
      </div>
    </div>
  );
}
