import { create } from "zustand";
import { sound } from "./sound";

// The site has two personas sharing one DOM. "cool" is the default every
// visit; "rot" only exists after the visitor lets the Space Dog out.
export type Persona = "cool" | "rot";

// caged     dog is in the corner cage, site is cool
// escaping  cage door just opened, dog is launching out (cool → rot)
// free      dog runs around, site is rot
// returning dog was dropped in the cage, everything is being sucked in (rot → cool)
export type Phase = "caged" | "escaping" | "free" | "returning";

export type PopupKind =
  | "prize"
  | "virus"
  | "download"
  | "visitor"
  | "multix"
  | "premium";

export type Popup = { id: number; kind: PopupKind; x: number; y: number };

// One-shot events the canvas layers (dog engine, confetti) react to.
type BusEvent = "release" | "suck" | "thanks" | "recall";
const bus = typeof window !== "undefined" ? new EventTarget() : null;
export function emit(e: BusEvent) {
  bus?.dispatchEvent(new Event(e));
}
export function on(e: BusEvent, fn: () => void) {
  bus?.addEventListener(e, fn);
  return () => bus?.removeEventListener(e, fn);
}

const PREMIUM_KEY = "sd-premium";
const ESCAPE_MS = 260;
const SUCK_MS = 620;

function readPremium() {
  try {
    return localStorage.getItem(PREMIUM_KEY) === "1";
  } catch {
    return false;
  }
}

function applyPersona(p: Persona) {
  const root = document.documentElement;
  root.dataset.persona = p;
  // Short "fried" flash on the way into brain rot; reduced motion skips it.
  if (p === "rot" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("frying");
    setTimeout(() => root.classList.remove("frying"), 700);
  }
}

type State = {
  persona: Persona;
  phase: Phase;
  muted: boolean;
  /** "我放棄 😭": popups off for this visit only. */
  gaveUp: boolean;
  /** Trust-based premium: popups off forever (stored in this browser). */
  premium: boolean;
  premiumOpen: boolean;
  popups: Popup[];
  activeGame: string | null;

  hydrate: () => void;
  release: () => void;
  capture: () => void;
  giveUp: () => void;
  toggleMute: () => void;
  openPremium: () => void;
  closePremium: () => void;
  subscribe: () => void;
  addPopup: (p: Omit<Popup, "id">) => void;
  closePopup: (id: number) => void;
  launchGame: (id: string) => void;
  closeGame: () => void;
};

let nextId = 1;

export const useInteractive = create<State>((set, get) => ({
  persona: "cool",
  phase: "caged",
  muted: false,
  gaveUp: false,
  premium: false,
  premiumOpen: false,
  popups: [],
  activeGame: null,

  hydrate: () => set({ premium: readPremium() }),

  release: () => {
    if (get().phase !== "caged") return;
    // This click is the user gesture that unlocks audio for the visit.
    sound.unlock();
    set({ phase: "escaping" });
    emit("release");
    sound.play("pop");
    setTimeout(() => {
      applyPersona("rot");
      set({ persona: "rot", phase: "free" });
      sound.play("airhorn");
      sound.startMusic();
    }, ESCAPE_MS);
  },

  capture: () => {
    if (get().phase !== "free") return;
    set({ phase: "returning", premiumOpen: false });
    // Meme sound cuts out the instant the door shuts.
    sound.stopAll();
    sound.play("clank");
    emit("suck");
    setTimeout(() => {
      applyPersona("cool");
      set({ persona: "cool", phase: "caged", popups: [], activeGame: null });
    }, SUCK_MS);
  },

  giveUp: () => set({ gaveUp: true, popups: [] }),
  toggleMute: () => {
    const muted = !get().muted;
    sound.setMuted(muted);
    set({ muted });
  },
  openPremium: () => set({ premiumOpen: true }),
  closePremium: () => set({ premiumOpen: false }),
  subscribe: () => {
    try {
      localStorage.setItem(PREMIUM_KEY, "1");
    } catch {}
    set({ premium: true, popups: [] });
    emit("thanks");
    sound.play("tada");
  },
  addPopup: (p) => set((s) => ({ popups: [...s.popups, { ...p, id: nextId++ }] })),
  closePopup: (id) => set((s) => ({ popups: s.popups.filter((p) => p.id !== id) })),
  launchGame: (id) => set({ activeGame: id }),
  closeGame: () => set({ activeGame: null }),
}));

/** True when junk (popups, fake ads) should be shown. */
export function useJunkOn() {
  return useInteractive(
    (s) => s.persona === "rot" && s.phase === "free" && !s.gaveUp && !s.premium,
  );
}
