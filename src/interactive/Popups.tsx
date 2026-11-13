"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sound } from "./sound";
import { useInteractive, useJunkOn, type Popup, type PopupKind } from "./store";

// Junk popup system (brief §5). Most popups close in one click; a few make
// you work for it. Fake close buttons open one of the profile links in a new
// tab, like real junk ads, so the portfolio itself never goes away.

type Props = { links: string[] };

const WEIGHTS: [PopupKind, number][] = [
  ["prize", 2],
  ["virus", 2],
  ["download", 2],
  ["visitor", 1],
  ["multix", 1],
  ["premium", 1],
];

function pickKind(open: Popup[]): PopupKind {
  const pool = WEIGHTS.filter(([k]) => k !== "premium" || !open.some((p) => p.kind === "premium"));
  let r = Math.random() * pool.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of pool) if ((r -= w) <= 0) return k;
  return "prize";
}

// Random spot that keeps clear of the cage (bottom-right) and the escape
// door (bottom-left), so neither is ever covered.
function spot() {
  const w = Math.min(320, innerWidth - 32);
  const h = 230;
  for (let i = 0; i < 12; i++) {
    const x = 16 + Math.random() * Math.max(0, innerWidth - w - 32);
    const y = 80 + Math.random() * Math.max(0, innerHeight - h - 100);
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

export default function Popups({ links }: Props) {
  const junk = useJunkOn();
  const popups = useInteractive((s) => s.popups);
  const phase = useInteractive((s) => s.phase);
  const addPopup = useInteractive((s) => s.addPopup);

  // Scheduler: fewer, slower popups on phones ("block the way, not the road").
  useEffect(() => {
    if (!junk) return;
    const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 640;
    const max = coarse ? 2 : 4;
    let timer: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const open = useInteractive.getState().popups;
      if (open.length < max) {
        addPopup({ kind: pickKind(open), ...spot() });
        sound.play("ding");
      }
      timer = setTimeout(spawn, (coarse ? 10000 : 5000) + Math.random() * (coarse ? 6000 : 5000));
    };
    timer = setTimeout(spawn, 1300);
    return () => clearTimeout(timer);
  }, [junk, addPopup]);

  const sucking = phase === "returning";

  return (
    <>
      {popups.map((p) => (
        <PopupWindow key={p.id} p={p} links={links} sucked={sucking} />
      ))}
      <Clippy />
    </>
  );
}

function PopupWindow({
  p,
  links,
  sucked,
}: {
  p: Popup;
  links: string[];
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
  const openPremium = useInteractive((s) => s.openPremium);
  const fake = useFakeLink(links);
  const [pos, setPos] = useState({ x: p.x, y: p.y });
  const [dodges, setDodges] = useState(0);
  const [xOff, setXOff] = useState(0);
  const maxDodges = p.kind === "premium" ? 3 : p.kind === "prize" ? 1 : 0;

  const done = () => close(p.id);

  // Cat-Mario close button: runs from a hovering mouse; on touch the whole
  // window jumps somewhere else instead.
  const onXEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || dodges >= maxDodges) return;
    setDodges((d) => d + 1);
    setXOff(-(60 + Math.random() * 160));
  };
  const onX = (e: React.MouseEvent) => {
    const touch = (e.nativeEvent as PointerEvent).pointerType === "touch";
    if (touch && dodges < maxDodges) {
      setDodges((d) => d + 1);
      setPos(spot());
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
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title[p.kind]}
      className={`popup ${sucked ? "sucked" : ""}`}
      style={{ left: pos.x, top: pos.y, zIndex: 45 + (p.id % 9) }}
    >
      <div className="skin-titlebar" data-perch>
        <span className="t">{title[p.kind]}</span>
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
      </div>
      <div className="popup-body">
        <Body kind={p.kind} done={done} fake={fake} openPremium={() => { openPremium(); done(); }} />
      </div>
    </div>
  );
}

function Body({
  kind,
  done,
  fake,
  openPremium,
}: {
  kind: PopupKind;
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
  }
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
