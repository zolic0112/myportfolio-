"use client";

import { useEffect, useState } from "react";
import { usePresence } from "./presence";
import { useInteractive } from "./store";

// Parody subscription page = "buy me a coffee". Trust based: whoever comes
// back and says they paid gets premium, stored in this browser for good.

const PLANS = [
  { id: "free", name: "Free", price: "$0", perks: ["無限彈窗", "無限假叉叉", "狗"] },
  { id: "premium", name: "Premium", price: "☕ ×1", perks: ["彈窗永久消失", "狗", "作者會很開心"] },
  { id: "ultra", name: "Premium Ultra Max Pro", price: "☕ ×2", perks: ["內容跟 Premium 一樣", "但你會覺得自己比較有錢", "狗"] },
] as const;

/** Where the money goes: Ko-fi for international visitors, ECPay for Taiwan. */
export type Sponsor = { intl: string | null; tw: string | null };

export default function PremiumModal({ sponsor }: { sponsor: Sponsor }) {
  const open = useInteractive((s) => s.premiumOpen);
  // Mounted fresh on every open, so it always starts at the first step; kept
  // for a moment after closing so it can animate out.
  const { mounted, state } = usePresence(open, 200);
  return mounted ? <Modal sponsor={sponsor} state={state} /> : null;
}

function Modal({ sponsor, state }: { sponsor: Sponsor; state: "open" | "closed" }) {
  const premium = useInteractive((s) => s.premium);
  const close = useInteractive((s) => s.closePremium);
  const subscribe = useInteractive((s) => s.subscribe);
  const cancelPremium = useInteractive((s) => s.cancelPremium);
  // Members land on their account page, where they can also cancel.
  const [step, setStep] = useState<"plans" | "pay" | "paid" | "thanks" | "manage" | "cancel" | "bye">(
    premium ? "manage" : "plans",
  );
  const bye = () => {
    setStep("bye");
    setTimeout(cancelPremium, 1400);
  };

  useEffect(() => {
    if (step !== "thanks") return;
    const id = setTimeout(close, 5200);
    return () => clearTimeout(id);
  }, [step, close]);

  const choose = (id: string) => {
    if (id === "free") return close();
    setStep(sponsor.intl || sponsor.tw ? "pay" : "paid");
  };
  const pay = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setStep("paid");
  };
  const done = () => {
    subscribe();
    setStep("thanks");
  };

  return (
    <div
      role="dialog"
      aria-label="Premium 訂閱"
      data-state={state}
      className="vt-backdrop fixed inset-0 z-[55] grid place-items-center overflow-y-auto bg-black/60 p-4"
      onClick={close}
    >
      <div data-state={state} className="vt-sheet popup !static !w-[min(760px,100%)]" onClick={(e) => e.stopPropagation()}>
        <div className="skin-titlebar">
          <span className="t">💎 Space Dog Premium — 訂閱方案</span>
          <button className="win-btn" onClick={close} aria-label="關閉">×</button>
        </div>
        <div key={step} className="popup-body vt-step">
          {step === "plans" && (
            <>
              <p className="wordart text-center">訂閱即可免廣告</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {PLANS.map((p) => (
                  <div key={p.id} className="grid gap-2 border-2 border-black bg-white p-3">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-2xl font-black">{p.price}</p>
                    <ul className="list-disc pl-5 text-xs">
                      {p.perks.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                    <button className="win-button mt-auto" onClick={() => choose(p.id)}>
                      {p.id === "free" ? "維持現狀" : "訂閱"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === "pay" && (
            <div className="grid gap-3 text-center">
              <p className="text-lg font-bold">選一個付款方式 ☕</p>
              <div className="flex flex-wrap justify-center gap-2">
                {sponsor.intl && (
                  <button className="win-button" onClick={() => pay(sponsor.intl!)}>🌏 International — Ko-fi</button>
                )}
                {sponsor.tw && (
                  <button className="win-button" onClick={() => pay(sponsor.tw!)}>🇹🇼 台灣 — 綠界</button>
                )}
              </div>
              <button className="text-[11px] underline" onClick={() => setStep("paid")}>我不想付錢</button>
            </div>
          )}
          {step === "paid" && (
            <div className="grid gap-3 text-center">
              <p className="text-lg font-bold">付好了嗎?(信任制,我們不會檢查)</p>
              {!sponsor.intl && !sponsor.tw && <p className="text-xs">(作者還沒設定贊助連結,所以你也付不了)</p>}
              <div className="flex flex-wrap justify-center gap-2">
                <button className="win-button" onClick={done}>付好了 ✅</button>
                <button className="win-button" onClick={done}>其實沒付,但我想要免廣告</button>
              </div>
            </div>
          )}
          {step === "manage" && (
            <div className="grid gap-3 text-center">
              <p className="text-lg font-bold">⭐ 我的訂閱</p>
              <div className="thanks-card justify-self-center">
                <span className="thanks-dog" aria-hidden>🐶</span>
                <div className="text-left">
                  <b>SPACE DOG PREMIUM</b>
                  <br />
                  方案:彈窗永久消失
                  <br />
                  <small>狀態:有效 ✅ · 下次扣款:永遠不會</small>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button className="win-button" onClick={close}>繼續當有錢人</button>
                <button className="win-button" onClick={() => setStep("cancel")}>取消訂閱</button>
              </div>
            </div>
          )}
          {step === "cancel" && (
            <div className="grid gap-3 text-center">
              <p className="wordart">確定要取消嗎??</p>
              <p>取消後所有彈窗、假叉叉、迴紋針小幫手都會回來 😈</p>
              <p className="text-xs">(狗會很開心)</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button className="win-button" onClick={bye}>確定取消,我想念廣告</button>
                <button className="win-button" style={{ fontWeight: 700 }} onClick={() => setStep("manage")}>算了</button>
              </div>
            </div>
          )}
          {step === "bye" && (
            <div className="grid gap-2 text-center">
              <p className="wordart">已取消訂閱</p>
              <p>廣告正在回來的路上…… 📢📢📢</p>
            </div>
          )}
          {step === "thanks" && (
            <div className="thanks">
              <div className="thanks-rays" aria-hidden />
              <p className="wordart thanks-title">感謝訂閱 🎉</p>
              <div className="thanks-card">
                <span className="thanks-dog" aria-hidden>🐶</span>
                <div>
                  <b>SPACE DOG PREMIUM</b>
                  <br />
                  MEMBER No. 000001
                  <br />
                  <small>有效期限:永遠(存在這個瀏覽器裡)</small>
                </div>
              </div>
              <p className="thanks-note">彈窗已全部消失 ✨ 你現在是很有錢的人 ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
