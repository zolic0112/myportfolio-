"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sound } from "./sound";
import { useT } from "@/lib/useLang";
import { J } from "./junk-text";
import { MiniGame, Reels } from "./PopupExtras";
import { useInteractive, useJunkOn, type Popup, type PopupKind, type PopupSize } from "./store";

// Junk popup system (brief §5). Most popups close in one click; a few make
// you work for it. Fake close buttons open one of the profile links in a new
// tab, like real junk ads, so the portfolio itself never goes away.

type Props = { links: string[]; reels: string[]; memes: string[] };

const WEIGHTS: [PopupKind, number][] = [
  ["prize", 2],
  ["virus", 2],
  ["download", 2],
  ["visitor", 1],
  ["multix", 1],
  ["premium", 1],
  ["game", 1.5],
  ["reels", 1.5],
  ["meme", 2],
  ["ad", 1.5],
  ["cookie", 1.2],
  ["captcha", 1.5],
  ["aura", 1.5],
  ["error", 1.5],
];
// At most one of each of these at a time.
const SINGLE: PopupKind[] = ["premium", "game", "reels", "ad", "cookie"];
// These always come at one size; the rest vary.
const FIXED: Partial<Record<PopupKind, PopupSize>> = { game: "m", reels: "m", meme: "m", error: "s", ad: "l", cookie: "l" };

function pickSize(kind: PopupKind): PopupSize {
  if (FIXED[kind]) return FIXED[kind]!;
  const r = Math.random();
  return r < 0.25 ? "s" : r < 0.65 ? "m" : "l";
}

/** Window width: phones get (nearly) the full width; big screens get real estate. */
export function popupWidth(kind: PopupKind, size: PopupSize = "m") {
  if (innerWidth < 640) return Math.min(320, innerWidth - 32);
  if (kind === "ad") return Math.min(760, innerWidth * 0.6);
  if (kind === "cookie") return Math.min(620, innerWidth - 64);
  if (kind === "reels") return 320;
  const w = { s: 300, m: 400, l: 500 }[size];
  return Math.min(w, innerWidth - 64);
}

function pickKind(open: Popup[], hasReels: boolean, hasMemes: boolean): PopupKind {
  const pool = WEIGHTS.filter(
    ([k]) =>
      (k !== "reels" || hasReels) &&
      (k !== "meme" || hasMemes) &&
      !(SINGLE.includes(k) && open.some((p) => p.kind === k)),
  );
  let r = Math.random() * pool.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of pool) if ((r -= w) <= 0) return k;
  return "prize";
}

// Random spot that keeps clear of the cage (bottom-right) and the escape
// door (bottom-left), so neither is ever covered.
function spot(kind: PopupKind = "visitor", size: PopupSize = "m") {
  const w = popupWidth(kind, size);
  // Reels is a tall 9:16 window; the video ad is 16:9; the rest are roughly this high.
  const h = kind === "reels" ? Math.min(innerHeight * 0.62, 540) + 34 : kind === "ad" ? w * 0.5625 + 90 : w * 0.62 + 40;
  for (let i = 0; i < 12; i++) {
    const x = 16 + Math.random() * Math.max(0, innerWidth - w - 32);
    const y = 80 + Math.random() * Math.max(0, innerHeight - h - 92);
    const hitsCage = x + w > innerWidth - 190 && y + h > innerHeight - 220;
    const hitsDoor = x < 230 && y + h > innerHeight - 70;
    if (!hitsCage && !hitsDoor) return { x, y };
  }
  return { x: 16, y: 80 };
}

function useFakeLink(links: string[]) {
  return () => {
    const url = links.length ? links[(Math.random() * links.length) | 0] : "https://www.linkedin.com";
    window.open(url, "_blank", "noopener,noreferrer");
  };
}

export default function Popups({ links, reels, memes }: Props) {
  const junk = useJunkOn();
  const popups = useInteractive((s) => s.popups);
  const phase = useInteractive((s) => s.phase);
  const addPopup = useInteractive((s) => s.addPopup);

  // Scheduler: fewer, slower popups on phones ("block the way, not the road").
  useEffect(() => {
    if (!junk) return;
    const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 640;
    // Big screens get a proper blizzard; phones are left with enough page to use.
    const big = !coarse && innerWidth >= 1024;
    const max = coarse ? 2 : big ? 6 : 4;
    let timer: ReturnType<typeof setTimeout>;
    // One popup now; `again` decides whether this call also books the next.
    // (Only the main chain reschedules, so cleanup always has the one timer.)
    const spawn = (again: boolean) => {
      const open = useInteractive.getState().popups;
      if (open.length < max) {
        const kind = pickKind(open, reels.length > 0, memes.length > 0);
        const size = pickSize(kind);
        addPopup({ kind, size, ...spot(kind, size) });
        sound.play("ding");
      }
      if (again) timer = setTimeout(() => spawn(true), coarse ? 10000 + Math.random() * 6000 : big ? 2600 + Math.random() * 3400 : 5000 + Math.random() * 5000);
    };
    timer = setTimeout(() => spawn(true), 1300);
    // big screens: a second one right behind the first, so it lands as a wall
    const second = big ? setTimeout(() => spawn(false), 2100) : undefined;
    return () => {
      clearTimeout(timer);
      clearTimeout(second);
    };
  }, [junk, addPopup, reels.length, memes.length]);

  const sucking = phase === "returning";

  return (
    <>
      {popups.map((p) => (
        <PopupWindow key={p.id} p={p} links={links} reels={reels} memes={memes} sucked={sucking} />
      ))}
      <Clippy />
    </>
  );
}

function PopupWindow({
  p,
  links,
  reels,
  memes,
  sucked,
}: {
  p: Popup;
  links: string[];
  reels: string[];
  memes: string[];
  sucked: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Aim the suck-in animation at the cage centre.
  useLayoutEffect(() => {
    const el = ref.current;
    const cage = document.getElementById("pet-cage")?.getBoundingClientRect();
    if (!sucked || !el || !cage) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--dx", `${cage.left + cage.width / 2 - (r.left + r.width / 2)}px`);
    el.style.setProperty("--dy", `${cage.top + cage.height / 2 - (r.top + r.height / 2)}px`);
  }, [sucked]);
  const close = useInteractive((s) => s.closePopup);
  const addPopup = useInteractive((s) => s.addPopup);
  const openPremium = useInteractive((s) => s.openPremium);
  const fake = useFakeLink(links);
  const [pos, setPos] = useState({ x: p.x, y: p.y });
  const [dodges, setDodges] = useState(0);
  const [xOff, setXOff] = useState(0);
  // Decided once per popup: how often its close button runs away, and (on
  // touch) whether a big fake X sits where the thumb expects the real one.
  const [traits] = useState(() => {
    const plain = p.kind !== "game" && p.kind !== "reels";
    return {
      maxDodges: p.kind === "premium" ? 3 : p.kind === "prize" ? 1 : plain && Math.random() < 0.3 ? 1 : 0,
      decoy: plain && matchMedia("(pointer: coarse)").matches && Math.random() < 0.4,
      meme: memes.length ? memes[(Math.random() * memes.length) | 0] : "",
    };
  });
  const maxDodges = traits.maxDodges;

  // Windows shrink away (in the same chunky steps they pop in with) before
  // they are removed.
  const [leaving, setLeaving] = useState(false);
  const done = () => {
    if (leaving) return;
    setLeaving(true);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => close(p.id), reduce ? 0 : 160);
  };

  // Cat-Mario close button: runs from a hovering mouse; on touch the whole
  // window jumps somewhere else instead.
  const onXEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || dodges >= maxDodges) return;
    setDodges((d) => d + 1);
    setXOff(-(60 + Math.random() * 160));
  };
  const [nag, setNag] = useState(false);
  const onX = (e: React.MouseEvent) => {
    // Mini-game popups only close by winning.
    if (p.kind === "game") {
      sound.play("error");
      setNag(true);
      return;
    }
    const touch = (e.nativeEvent as PointerEvent).pointerType === "touch";
    if (touch && dodges < maxDodges) {
      setDodges((d) => d + 1);
      setPos(spot(p.kind, p.size));
      // No hover on phones, so the hardest popup fights back by multiplying.
      if (p.kind === "premium") addPopup({ kind: "visitor", ...spot() });
      return;
    }
    done();
  };

  const t = useT();
  const title = t(p.kind === "game" && nag ? J.title.gameNag : J.title[p.kind]);
  const size = p.size ?? "m";
  // Reels sizes itself in CSS (nearly full screen on phones).
  const width = p.kind === "reels" ? undefined : popupWidth(p.kind, size);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      data-size={size}
      data-kind={p.kind}
      className={`popup ${p.kind === "reels" ? "popup-reels" : ""} ${sucked ? "sucked" : ""} ${leaving ? "leaving" : ""}`}
      style={{ left: pos.x, top: pos.y, width, zIndex: 45 + (p.id % 9), viewTransitionName: `popup-${p.id}`, viewTransitionClass: "keep" } as React.CSSProperties}
    >
      <div className="skin-titlebar" data-perch>
        <span className="t">{title}</span>
        {traits.decoy ? (
          <>
            {/* Phones: the real close hides on the left, a fat fake one waits for the thumb. */}
            <button className="win-btn x-real" aria-label={t(J.close)} onClick={onX} style={{ order: -1 }}>
              ×
            </button>
            <button className="fake-x decoy" aria-label={t(J.close)} onClick={() => { fake(); done(); }}>
              ✕
            </button>
          </>
        ) : (
          <>
            <span className="win-btn" aria-hidden>_</span>
            <span className="win-btn" aria-hidden>□</span>
            <button
              className="win-btn x-real x-dodge"
              aria-label={t(J.close)}
              onPointerEnter={onXEnter}
              onClick={onX}
              style={{ transform: `translateX(${xOff}px)` }}
            >
              ×
            </button>
          </>
        )}
      </div>
      <div className="popup-body">
        {p.kind === "game" ? (
          <MiniGame done={done} />
        ) : p.kind === "reels" ? (
          <Reels urls={reels} />
        ) : p.kind === "meme" ? (
          // Your own brain rot memes, deep-fried by CSS.
          <div className="skin-media meme">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={traits.meme} alt="" />
          </div>
        ) : (
          <Body p={p} kind={p.kind} done={done} fake={fake} openPremium={() => { openPremium(); done(); }} />
        )}
      </div>
    </div>
  );
}

function Body({
  p,
  kind,
  done,
  fake,
  openPremium,
}: {
  p: Popup;
  kind: Exclude<PopupKind, "game" | "reels" | "meme">;
  done: () => void;
  fake: () => void;
  openPremium: () => void;
}) {
  const t = useT();
  switch (kind) {
    case "prize":
      return (
        <div className="grid gap-3 text-center">
          <p className="wordart">{t(J.prizeBig)}</p>
          <p>{t(J.prizeText)}</p>
          <Countdown />
          <button className="win-button justify-self-center" onClick={() => { fake(); done(); }}>
            {t(J.prizeBtn)}
          </button>
        </div>
      );
    case "virus":
      return (
        <div className="grid gap-3">
          <div className="flex gap-3">
            <span className="text-3xl" aria-hidden>⚠️</span>
            <p>
              {t(J.virusText)}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button className="win-button" onClick={() => { fake(); done(); }}>{t(J.virusFix)}</button>
            <button className="win-button" onClick={done}>{t(J.virusIgnore)}</button>
          </div>
        </div>
      );
    case "download":
      return <Download done={done} />;
    case "visitor":
      return (
        <div className="grid gap-2 text-center">
          <p className="wordart">{t(J.visitorBig)}</p>
          <p>
            {t(J.visitorText)(<b style={{ color: "red", fontSize: 20 }}>1,000,000</b>)}
          </p>
          <p className="text-xs">{t(J.visitorNote)}</p>
          <button className="win-button justify-self-center" onClick={done}>{t(J.visitorOk)}</button>
        </div>
      );
    case "multix":
      return <MultiX done={done} fake={fake} />;
    case "premium":
      return <PremiumNag done={done} openPremium={openPremium} />;
    case "ad":
      return <VideoAd done={done} fake={fake} />;
    case "cookie":
      return <Cookies done={done} />;
    case "captcha":
      return <Captcha done={done} />;
    case "aura":
      return <Aura done={done} />;
    case "error":
      return <ErrorCascade p={p} done={done} />;
  }
}

// A pre-roll ad you cannot skip for five seconds. Clicking the ad itself is
// a fake link, like the real thing.
function VideoAd({ done, fake }: { done: () => void; fake: () => void }) {
  const t = useT();
  const [left, setLeft] = useState(5);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <div className="vad">
      <button className="vad-screen" onClick={fake} aria-label={t(J.ad)}>
        <span className="vad-tag">{t(J.ad)} · 1/3</span>
        <span className="vad-big">{t(J.vadBig)}</span>
        <span className="vad-sub">{t(J.vadSub)}</span>
        <span className="vad-cta">{t(J.vadCta)}</span>
        <i className="vad-bar" />
      </button>
      <div className="vad-foot">
        <span>{t(J.vadSound)}</span>
        <button className="win-button" disabled={left > 0} onClick={done}>
          {left > 0 ? t(J.vadWait)(left) : t(J.vadSkip)}
        </button>
      </div>
    </div>
  );
}

// Every option is "accept". "Manage" shows switches you cannot turn off.
function Cookies({ done }: { done: () => void }) {
  const t = useT();
  const [manage, setManage] = useState(false);
  const kinds = t(J.cookieKinds);
  return manage ? (
    <div className="grid gap-2">
      {kinds.map((k) => (
        <label key={k} className="flex items-center justify-between gap-3 border-b border-neutral-400 pb-1">
          <span>🍪 {k}</span>
          <input type="checkbox" checked disabled readOnly />
        </label>
      ))}
      <p className="text-xs">{t(J.cookieLocked)}</p>
      <button className="win-button justify-self-end" onClick={done}>{t(J.cookieSave)}</button>
    </div>
  ) : (
    <div className="grid gap-3">
      <p>
        {t(J.cookieText)}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <button className="text-[11px] underline" onClick={() => setManage(true)}>{t(J.cookieManage)}</button>
        <button className="win-button" onClick={done}>{t(J.cookieAcceptAll)}</button>
        <button className="win-button" style={{ fontWeight: 700 }} onClick={done}>{t(J.cookieAllAccept)}</button>
      </div>
    </div>
  );
}

// "Select every image with a dog." All of them are dogs.
function Captcha({ done }: { done: () => void }) {
  const t = useT();
  const tiles = ["🐶", "🐕", "🌭", "🐩", "🐶", "🦮", "🐕‍🦺", "🐶", "🐺"];
  const [picked, setPicked] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const verify = () => {
    if (tries >= 1) {
      setMsg(t(J.capPass));
      setTimeout(done, 1100);
      return;
    }
    setTries(1);
    setPicked([]);
    setMsg(t(picked.length === 9 ? J.capTooMany : J.capWrong));
  };
  return (
    <div className="grid gap-2">
      <div className="captcha-head">
        <span>{t(J.capHead)}</span>
        <small>{t(J.capSub)}</small>
      </div>
      <div className="captcha-grid">
        {tiles.map((t, i) => (
          <button
            key={i}
            aria-pressed={picked.includes(i)}
            onClick={() => setPicked((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="text-xs font-bold">{msg}</p>}
      <button className="win-button justify-self-end" onClick={verify}>{t(J.verify)}</button>
    </div>
  );
}

// Three answers, all the same. You win anyway.
function Aura({ done }: { done: () => void }) {
  const t = useT();
  const [res, setRes] = useState(false);
  return res ? (
    <div className="grid gap-2 text-center">
      <p className="wordart">Aura +∞ 🗿</p>
      <p>{t(J.auraRes)}</p>
      <p className="text-xs">{t(J.auraNote)}</p>
      <button className="win-button justify-self-center" onClick={done}>{t(J.auraOk)}</button>
    </div>
  ) : (
    <div className="grid gap-2">
      <p className="font-bold">{t(J.auraQ)}</p>
      {t(J.auraA).map((a) => (
        <button key={a} className="win-button text-left" onClick={() => setRes(true)}>{a}</button>
      ))}
    </div>
  );
}

// "OK" makes two more of it; only the title bar × really closes it.
function ErrorCascade({ p, done }: { p: Popup; done: () => void }) {
  const t = useT();
  const addPopup = useInteractive((s) => s.addPopup);
  const ok = () => {
    const depth = p.depth ?? 0;
    if (depth < 2) {
      for (let i = 1; i <= 2; i++) {
        addPopup({
          kind: "error",
          size: "s",
          depth: depth + 1,
          x: Math.min(innerWidth - 320, p.x + 26 * i),
          y: Math.min(innerHeight - 200, p.y + 26 * i),
        });
      }
    }
    sound.play("error");
    done();
  };
  return (
    <div className="grid gap-3">
      <div className="flex gap-3">
        <span className="text-3xl" aria-hidden>⛔</span>
        <p>{t(J.errText)}</p>
      </div>
      <button className="win-button justify-self-end" onClick={ok}>{t(J.ok)}</button>
    </div>
  );
}

// "Offer ends in 00:59", forever.
function Countdown() {
  const tr = useT();
  const [t, setT] = useState(59);
  useEffect(() => {
    const id = setInterval(() => setT((v) => (v <= 1 ? 59 : v - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <p className="countdown">{tr(J.countdown)} 00:{String(t).padStart(2, "0")}</p>;
}

function Download({ done }: { done: () => void }) {
  const t = useT();
  const [pct, setPct] = useState(12);
  useEffect(() => {
    const id = setInterval(() => {
      setPct((v) => (v >= 99 ? 12 : Math.min(99, v + Math.random() * 18)));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid gap-2">
      <p>{t(J.downloading)}</p>
      <div className="progress">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs">{t(J.timeLeft)(pct > 90 ? "∞" : t(J.minutes)(Math.round((100 - pct) / 3)))}</p>
      <button className="win-button justify-self-end" onClick={done}>{t(J.cancel)}</button>
    </div>
  );
}

// Several fake close buttons; only the small grey one is real.
function MultiX({ done, fake }: { done: () => void; fake: () => void }) {
  const t = useT();
  const [spots] = useState(() =>
    Array.from({ length: 5 }, () => ({ l: 8 + Math.random() * 80, t: 8 + Math.random() * 60 })),
  );
  return (
    <div className="relative h-36" style={{ background: "#fff200" }}>
      <p className="p-3 font-bold" style={{ fontFamily: "Impact, sans-serif", fontSize: 22, color: "#f00" }}>
        {t(J.multixText)}
      </p>
      {spots.map((s, i) => (
        <button
          key={i}
          className="fake-x"
          style={{ left: `${s.l}%`, top: `${s.t}%` }}
          onClick={() => { fake(); done(); }}
          aria-label={t(J.close)}
        >
          ✕
        </button>
      ))}
      <button
        onClick={done}
        className="absolute bottom-0.5 right-1 text-[9px] text-neutral-500"
        aria-label={t(J.reallyClose)}
      >
        close
      </button>
    </div>
  );
}

// The hardest popup to close: three rounds of "are you sure?".
function PremiumNag({ done, openPremium }: { done: () => void; openPremium: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const lines = t(J.nagNo);
  return (
    <div className="grid gap-3 text-center">
      <p className="wordart">{t(J.nagBig)}</p>
      <p>{t(J.nagText)}</p>
      <button className="win-button justify-self-center" onClick={openPremium} style={{ fontWeight: 700 }}>
        {t(J.nagBtn)}
      </button>
      <button
        className="justify-self-center text-[11px] underline"
        onClick={() => (step >= 3 ? done() : setStep(step + 1))}
      >
        {lines[step]}
      </button>
    </div>
  );
}

// Brain rot's take on the paperclip helper: lives by the cage, every answer
// is useless, but it does point at the real exit.
function Clippy() {
  const t = useT();
  const junk = useJunkOn();
  const addPopup = useInteractive((s) => s.addPopup);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!junk) return;
    const schedule = (ms: number) => {
      timer.current = setTimeout(() => {
        setReply(null);
        setOpen(true);
      }, ms);
    };
    schedule(9000);
    const again = () => schedule(25000 + Math.random() * 15000);
    window.addEventListener("clippy:closed", again);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("clippy:closed", again);
    };
  }, [junk]);

  const shut = () => {
    setOpen(false);
    window.dispatchEvent(new Event("clippy:closed"));
  };
  if (!junk || !open) return null;
  return (
    <div className="clippy" role="dialog" aria-label={t(J.clippyLabel)}>
      {reply ? (
        <>
          <p>{reply}</p>
          <button className="win-button mt-2" onClick={shut}>{t(J.clippyOk)}</button>
        </>
      ) : (
        <>
          <p>{t(J.clippyAsk)}</p>
          <div className="mt-2 grid gap-1">
            <button className="win-button" onClick={() => setReply(t(J.clippyCatchReply))}>
              {t(J.clippyCatch)}
            </button>
            <button
              className="win-button"
              onClick={() => {
                for (let i = 0; i < 3; i++) addPopup({ kind: "visitor", ...spot() });
                shut();
              }}
            >
              {t(J.clippyMore)}
            </button>
            <button className="win-button" onClick={shut}>{t(J.clippyNo)}</button>
          </div>
        </>
      )}
    </div>
  );
}
