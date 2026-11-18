"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sound } from "./sound";
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
    const spawn = () => {
      const open = useInteractive.getState().popups;
      if (open.length < max) {
        const kind = pickKind(open, reels.length > 0, memes.length > 0);
        const size = pickSize(kind);
        addPopup({ kind, size, ...spot(kind, size) });
        sound.play("ding");
      }
      timer = setTimeout(spawn, coarse ? 10000 + Math.random() * 6000 : big ? 2600 + Math.random() * 3400 : 5000 + Math.random() * 5000);
    };
    timer = setTimeout(spawn, 1300);
    // big screens: a second one right behind the first, so it lands as a wall
    const second = big ? setTimeout(spawn, 2100) : undefined;
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
      setPos(spot(p.kind));
      // No hover on phones, so the hardest popup fights back by multiplying.
      if (p.kind === "premium") addPopup({ kind: "visitor", ...spot() });
      return;
    }
    done();
  };

  const title: Record<PopupKind, string> = {
    prize: "🎉 恭喜!!!.exe",
    virus: "Windows 安全性警告",
    download: "下載中… 請勿關閉",
    visitor: "★ 特別通知 ★",
    multix: "廣告 廣告 廣告",
    premium: "💎 升級 Premium!!!",
    game: nag ? "不行!!先玩完!!" : "🎮 玩完才能關",
    reels: "📱 短影音 — 再滑一下就好",
    meme: "funny.jpg.exe",
    ad: "贊助內容 · 廣告",
    cookie: "🍪 Cookie 設定",
    captcha: "🤖 安全性驗證",
    aura: "🗿 Aura 測驗.exe",
    error: "狗.exe",
  };
  const size = p.size ?? "m";
  const width = popupWidth(p.kind, size);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title[p.kind]}
      data-size={size}
      data-kind={p.kind}
      className={`popup ${p.kind === "reels" ? "popup-reels" : ""} ${sucked ? "sucked" : ""} ${leaving ? "leaving" : ""}`}
      style={{ left: pos.x, top: pos.y, width, zIndex: 45 + (p.id % 9), viewTransitionName: `popup-${p.id}`, viewTransitionClass: "keep" } as React.CSSProperties}
    >
      <div className="skin-titlebar" data-perch>
        <span className="t">{title[p.kind]}</span>
        {traits.decoy ? (
          <>
            {/* Phones: the real close hides on the left, a fat fake one waits for the thumb. */}
            <button className="win-btn x-real" aria-label="關閉" onClick={onX} style={{ order: -1 }}>
              ×
            </button>
            <button className="fake-x decoy" aria-label="關閉" onClick={() => { fake(); done(); }}>
              ✕
            </button>
          </>
        ) : (
          <>
            <span className="win-btn" aria-hidden>_</span>
            <span className="win-btn" aria-hidden>□</span>
            <button
              className="win-btn x-real x-dodge"
              aria-label="關閉"
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
  switch (kind) {
    case "prize":
      return (
        <div className="grid gap-3 text-center">
          <p className="wordart">你中了 100 萬!!!</p>
          <p>你是今天被選中的幸運兒 🎰 點下方按鈕立即領取 💰💰💰</p>
          <Countdown />
          <button className="win-button justify-self-center" onClick={() => { fake(); done(); }}>
            立即領取 $$$
          </button>
        </div>
      );
    case "virus":
      return (
        <div className="grid gap-3">
          <div className="flex gap-3">
            <span className="text-3xl" aria-hidden>⚠️</span>
            <p>
              偵測到 <b>3,721</b> 個病毒!你的電腦已經被 <b>brain rot</b> 感染。
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button className="win-button" onClick={() => { fake(); done(); }}>立即清除</button>
            <button className="win-button" onClick={done}>忽略</button>
          </div>
        </div>
      );
    case "download":
      return <Download done={done} />;
    case "visitor":
      return (
        <div className="grid gap-2 text-center">
          <p className="wordart">恭喜!!</p>
          <p>
            你是第 <b style={{ color: "red", fontSize: 20 }}>1,000,000</b> 位訪客
          </p>
          <p className="text-xs">(每個人都是)</p>
          <button className="win-button justify-self-center" onClick={done}>好喔</button>
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
  const [left, setLeft] = useState(5);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <div className="vad">
      <button className="vad-screen" onClick={fake} aria-label="廣告">
        <span className="vad-tag">廣告 · 1/3</span>
        <span className="vad-big">設計師都在用的<br />神奇 AI 🤯</span>
        <span className="vad-sub">一鍵生成作品集!!!不用設計!!!不用努力!!!</span>
        <span className="vad-cta">了解詳情 ›</span>
        <i className="vad-bar" />
      </button>
      <div className="vad-foot">
        <span>🔇 有聲廣告效果更好</span>
        <button className="win-button" disabled={left > 0} onClick={done}>
          {left > 0 ? `${left} 秒後可略過廣告` : "略過廣告 ⏭"}
        </button>
      </div>
    </div>
  );
}

// Every option is "accept". "Manage" shows switches you cannot turn off.
function Cookies({ done }: { done: () => void }) {
  const [manage, setManage] = useState(false);
  const kinds = ["必要的餅乾", "非常必要的餅乾", "追蹤你 aura 的餅乾", "狗想吃的餅乾"];
  return manage ? (
    <div className="grid gap-2">
      {kinds.map((k) => (
        <label key={k} className="flex items-center justify-between gap-3 border-b border-neutral-400 pb-1">
          <span>🍪 {k}</span>
          <input type="checkbox" checked disabled readOnly />
        </label>
      ))}
      <p className="text-xs">(以上皆無法關閉)</p>
      <button className="win-button justify-self-end" onClick={done}>儲存偏好設定</button>
    </div>
  ) : (
    <div className="grid gap-3">
      <p>
        本網站與 <b>1,337</b> 個合作夥伴使用 🍪 餅乾來追蹤你的 aura、記住你看過幾次狗,以及提供你根本不需要的個人化體驗。
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <button className="text-[11px] underline" onClick={() => setManage(true)}>管理偏好設定</button>
        <button className="win-button" onClick={done}>接受全部</button>
        <button className="win-button" style={{ fontWeight: 700 }} onClick={done}>全部接受</button>
      </div>
    </div>
  );
}

// "Select every image with a dog." All of them are dogs.
function Captcha({ done }: { done: () => void }) {
  const tiles = ["🐶", "🐕", "🌭", "🐩", "🐶", "🦮", "🐕‍🦺", "🐶", "🐺"];
  const [picked, setPicked] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const verify = () => {
    if (tries >= 1) {
      setMsg("✅ 驗證失敗,但我們決定放過你");
      setTimeout(done, 1100);
      return;
    }
    setTries(1);
    setPicked([]);
    setMsg(picked.length === 9 ? "❌ 你選太多了。熱狗不是狗。" : "❌ 選錯了。答案:全部都是狗(包括你)");
  };
  return (
    <div className="grid gap-2">
      <div className="captcha-head">
        <span>選出所有包含<b>狗</b>的圖片</span>
        <small>如果沒有了,請按「驗證」</small>
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
      <button className="win-button justify-self-end" onClick={verify}>驗證</button>
    </div>
  );
}

// Three answers, all the same. You win anyway.
function Aura({ done }: { done: () => void }) {
  const [res, setRes] = useState(false);
  return res ? (
    <div className="grid gap-2 text-center">
      <p className="wordart">Aura +∞ 🗿</p>
      <p>恭喜你獲得 <b>Sigma 等級</b> 認證</p>
      <p className="text-xs">(測驗結果僅供參考,但你真的很 sigma)</p>
      <button className="win-button justify-self-center" onClick={done}>我知道我很 sigma</button>
    </div>
  ) : (
    <div className="grid gap-2">
      <p className="font-bold">Q1 / 1:看到這個作品集,你的第一個反應是?</p>
      {["A. 哇 好讚", "B. 哇 好讚", "C. 哇 好讚!!!"].map((a) => (
        <button key={a} className="win-button text-left" onClick={() => setRes(true)}>{a}</button>
      ))}
    </div>
  );
}

// "OK" makes two more of it; only the title bar × really closes it.
function ErrorCascade({ p, done }: { p: Popup; done: () => void }) {
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
        <p>
          狗.exe 已停止運作。
          <br />
          <small>錯誤代碼:0x00D06 — 狗跑出來了</small>
        </p>
      </div>
      <button className="win-button justify-self-end" onClick={ok}>確定</button>
    </div>
  );
}

// "Offer ends in 00:59", forever.
function Countdown() {
  const [t, setT] = useState(59);
  useEffect(() => {
    const id = setInterval(() => setT((v) => (v <= 1 ? 59 : v - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <p className="countdown">⏰ 限時領取 00:{String(t).padStart(2, "0")}</p>;
}

function Download({ done }: { done: () => void }) {
  const [pct, setPct] = useState(12);
  useEffect(() => {
    const id = setInterval(() => {
      setPct((v) => (v >= 99 ? 12 : Math.min(99, v + Math.random() * 18)));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid gap-2">
      <p>正在下載 FREE_RAM_2026_真的.exe</p>
      <div className="progress">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs">剩餘時間:{pct > 90 ? "∞" : `${Math.round((100 - pct) / 3)} 分鐘`}</p>
      <button className="win-button justify-self-end" onClick={done}>取消</button>
    </div>
  );
}

// Several fake close buttons; only the small grey one is real.
function MultiX({ done, fake }: { done: () => void; fake: () => void }) {
  const [spots] = useState(() =>
    Array.from({ length: 5 }, () => ({ l: 8 + Math.random() * 80, t: 8 + Math.random() * 60 })),
  );
  return (
    <div className="relative h-36" style={{ background: "#fff200" }}>
      <p className="p-3 font-bold" style={{ fontFamily: "Impact, sans-serif", fontSize: 22, color: "#f00" }}>
        辣妹在你附近 🔥 不對 是狗 🐶
      </p>
      {spots.map((s, i) => (
        <button
          key={i}
          className="fake-x"
          style={{ left: `${s.l}%`, top: `${s.t}%` }}
          onClick={() => { fake(); done(); }}
          aria-label="關閉"
        >
          ✕
        </button>
      ))}
      <button
        onClick={done}
        className="absolute bottom-0.5 right-1 text-[9px] text-neutral-500"
        aria-label="真的關閉"
      >
        close
      </button>
    </div>
  );
}

// The hardest popup to close: three rounds of "are you sure?".
function PremiumNag({ done, openPremium }: { done: () => void; openPremium: () => void }) {
  const [step, setStep] = useState(0);
  const lines = ["不了,謝謝", "你確定?", "真的確定??", "好啦 😢"];
  return (
    <div className="grid gap-3 text-center">
      <p className="wordart">訂閱 Premium 即可免廣告!</p>
      <p>只要一杯咖啡 ☕ 彈窗通通消失(真的)</p>
      <button className="win-button justify-self-center" onClick={openPremium} style={{ fontWeight: 700 }}>
        💎 立即升級
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
    <div className="clippy" role="dialog" aria-label="小幫手">
      {reply ? (
        <>
          <p>{reply}</p>
          <button className="win-button mt-2" onClick={shut}>好</button>
        </>
      ) : (
        <>
          <p>📎 看起來你正在瀏覽作品集,需要幫忙嗎?</p>
          <div className="mt-2 grid gap-1">
            <button className="win-button" onClick={() => setReply("自己抓 🙂 抓住狗、拖回這個籠子放開。")}>
              幫我把狗抓回來
            </button>
            <button
              className="win-button"
              onClick={() => {
                for (let i = 0; i < 3; i++) addPopup({ kind: "visitor", ...spot() });
                shut();
              }}
            >
              我想要更多彈窗
            </button>
            <button className="win-button" onClick={shut}>不用了</button>
          </div>
        </>
      )}
    </div>
  );
}
