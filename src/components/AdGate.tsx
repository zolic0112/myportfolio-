"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/useLang";
import { J } from "@/interactive/junk-text";

// Brain rot only: an "unskippable" fake ad before play. The countdown reaches
// 1, bounces back to 5 once, and only then lets you skip.
export default function AdGate({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(5);
  const [loops, setLoops] = useState(0);
  const canSkip = loops >= 1 && n <= 1;
  const t = useT();

  useEffect(() => {
    if (canSkip) return;
    const id = setTimeout(() => {
      if (n > 1) setN(n - 1);
      else {
        setLoops(loops + 1);
        setN(loops === 0 ? 5 : 1);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [n, loops, canSkip]);

  return (
    <div className="ad-gate" role="dialog" aria-label={t(J.ad)}>
      <div className="grid gap-2 px-6">
        <p className="wordart" style={{ fontSize: "clamp(28px,6vw,56px)" }}>{t(J.burgerBig)}</p>
        <p className="bg-white px-2 font-bold">{t(J.burgerText)}</p>
      </div>
      <button className="skip" onClick={() => canSkip && onDone()} disabled={!canSkip}>
        {canSkip ? t(J.burgerSkip) : t(J.burgerWait)(n)}
      </button>
    </div>
  );
}
