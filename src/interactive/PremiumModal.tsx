"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/useLang";
import { J } from "./junk-text";
import { usePresence } from "./presence";
import { useInteractive } from "./store";

// Parody subscription page = "buy me a coffee". Trust based: whoever comes
// back and says they paid gets premium, stored in this browser for good.

const PLANS = [
  { id: "free", name: "Free", price: "$0" },
  { id: "premium", name: "Premium", price: "☕ ×1" },
  { id: "ultra", name: "Premium Ultra Max Pro", price: "☕ ×2" },
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
  const t = useT();
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
      aria-label={t(J.pmLabel)}
      data-state={state}
      className="vt-backdrop fixed inset-0 z-[55] grid place-items-center overflow-y-auto bg-black/60 p-4"
      onClick={close}
    >
      <div data-state={state} className="vt-sheet popup !static !w-[min(760px,100%)]" onClick={(e) => e.stopPropagation()}>
        <div className="skin-titlebar">
          <span className="t">{t(J.pmTitle)}</span>
          <button className="win-btn" onClick={close} aria-label={t(J.close)}>×</button>
        </div>
        <div key={step} className="popup-body vt-step">
          {step === "plans" && (
            <>
              <p className="wordart text-center">{t(J.pmHead)}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {PLANS.map((p) => (
                  <div key={p.id} className="grid gap-2 border-2 border-black bg-white p-3">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-2xl font-black">{p.price}</p>
                    <ul className="list-disc pl-5 text-xs">
                      {t(J.pmPerks[p.id]).map((x) => <li key={x}>{x}</li>)}
                    </ul>
                    <button className="win-button mt-auto" onClick={() => choose(p.id)}>
                      {t(p.id === "free" ? J.pmKeep : J.pmSub)}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === "pay" && (
            <div className="grid gap-3 text-center">
              <p className="text-lg font-bold">{t(J.pmPayHead)}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {sponsor.intl && (
                  <button className="win-button" onClick={() => pay(sponsor.intl!)}>🌏 International — Ko-fi</button>
                )}
                {sponsor.tw && (
                  <button className="win-button" onClick={() => pay(sponsor.tw!)}>{t(J.pmPayTw)}</button>
                )}
              </div>
              <button className="text-[11px] underline" onClick={() => setStep("paid")}>{t(J.pmNoPay)}</button>
            </div>
          )}
          {step === "paid" && (
            <div className="grid gap-3 text-center">
              <p className="text-lg font-bold">{t(J.pmPaidQ)}</p>
              {!sponsor.intl && !sponsor.tw && <p className="text-xs">{t(J.pmNoLinks)}</p>}
              <div className="flex flex-wrap justify-center gap-2">
                <button className="win-button" onClick={done}>{t(J.pmPaid)}</button>
                <button className="win-button" onClick={done}>{t(J.pmLied)}</button>
              </div>
            </div>
          )}
          {step === "manage" && (
            <div className="grid gap-3 text-center">
              <p className="text-lg font-bold">{t(J.pmMine)}</p>
              <div className="thanks-card justify-self-center">
                <span className="thanks-dog" aria-hidden>🐶</span>
                <div className="text-left">
                  <b>SPACE DOG PREMIUM</b>
                  <br />
                  {t(J.pmPlan)}
                  <br />
                  <small>{t(J.pmStatus)}</small>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button className="win-button" onClick={close}>{t(J.pmStayRich)}</button>
                <button className="win-button" onClick={() => setStep("cancel")}>{t(J.pmCancel)}</button>
              </div>
            </div>
          )}
          {step === "cancel" && (
            <div className="grid gap-3 text-center">
              <p className="wordart">{t(J.pmSure)}</p>
              <p>{t(J.pmSureText)}</p>
              <p className="text-xs">{t(J.pmDogHappy)}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button className="win-button" onClick={bye}>{t(J.pmYes)}</button>
                <button className="win-button" style={{ fontWeight: 700 }} onClick={() => setStep("manage")}>{t(J.pmNever)}</button>
              </div>
            </div>
          )}
          {step === "bye" && (
            <div className="grid gap-2 text-center">
              <p className="wordart">{t(J.pmBye)}</p>
              <p>{t(J.pmBack)}</p>
            </div>
          )}
          {step === "thanks" && (
            <div className="thanks">
              <div className="thanks-rays" aria-hidden />
              <p className="wordart thanks-title">{t(J.pmThanks)}</p>
              <div className="thanks-card">
                <span className="thanks-dog" aria-hidden>🐶</span>
                <div>
                  <b>SPACE DOG PREMIUM</b>
                  <br />
                  MEMBER No. 000001
                  <br />
                  <small>{t(J.pmValid)}</small>
                </div>
              </div>
              <p className="thanks-note">{t(J.pmGone)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
