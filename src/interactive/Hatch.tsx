"use client";

import { useInteractive, useJunkOn } from "./store";

// The free exit and the mute button: deliberately plain browser-default HTML,
// pinned bottom-left where a thumb reaches, above every popup.
export default function Hatch() {
  const persona = useInteractive((s) => s.persona);
  const muted = useInteractive((s) => s.muted);
  const toggleMute = useInteractive((s) => s.toggleMute);
  const giveUp = useInteractive((s) => s.giveUp);
  const junk = useJunkOn();
  if (persona !== "rot") return null;
  return (
    <div className="hatch">
      {junk && <button onClick={giveUp}>我放棄 😭</button>}
      <button onClick={toggleMute}>{muted ? "🔇 開聲音" : "🔊 靜音"}</button>
    </div>
  );
}
