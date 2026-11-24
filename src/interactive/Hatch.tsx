"use client";

import { useT } from "@/lib/useLang";
import { J } from "./junk-text";
import { useState } from "react";
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
  // a short "fine, I'll stop" note so the button visibly did something
  const [note, setNote] = useState(false);
  const quit = () => {
    giveUp();
    setNote(true);
    setTimeout(() => setNote(false), 2800);
  };
  if (persona !== "rot") return null;
  return (
    <div className="hatch">
      {note && (
        <div className="giveup-note" role="status">
          <b>{t(J.giveUpNote)}</b>
          <small>{t(J.giveUpHint)}</small>
        </div>
      )}
      {junk && <button onClick={quit}>{t(J.giveUp)}</button>}
      <button onClick={toggleMute}>{t(muted ? J.unmute : J.mute)}</button>
    </div>
  );
}
