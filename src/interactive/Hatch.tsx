"use client";

import { useT } from "@/lib/useLang";
import { J } from "./junk-text";
import { useInteractive, useJunkOn } from "./store";

// The free exit and the mute button: deliberately plain browser-default HTML,
// pinned bottom-left where a thumb reaches, above every popup.
export default function Hatch() {
  const persona = useInteractive((s) => s.persona);
  const muted = useInteractive((s) => s.muted);
  const toggleMute = useInteractive((s) => s.toggleMute);
  const giveUp = useInteractive((s) => s.giveUp);
  const junk = useJunkOn();
  const t = useT();
  if (persona !== "rot") return null;
  return (
    <div className="hatch">
      {junk && <button onClick={giveUp}>{t(J.giveUp)}</button>}
      <button onClick={toggleMute}>{t(muted ? J.unmute : J.mute)}</button>
    </div>
  );
}
