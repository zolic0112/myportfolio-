import { create } from "zustand";

export const THEMES = ["minimal", "night", "retro"] as const;
export type Theme = (typeof THEMES)[number];

type InteractiveState = {
  theme: Theme;
  activeGame: string | null;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  launchGame: (id: string) => void;
  closeGame: () => void;
};

// Wraps DOM-affecting updates in the View Transitions API when available,
// which is what gives theme switches their animated cross-fade.
function withTransition(update: () => void) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

export const useInteractive = create<InteractiveState>((set, get) => ({
  theme: "minimal",
  activeGame: null,
  setTheme: (theme) =>
    withTransition(() => {
      document.documentElement.dataset.theme = theme;
      set({ theme });
    }),
  cycleTheme: () => {
    const next = THEMES[(THEMES.indexOf(get().theme) + 1) % THEMES.length];
    get().setTheme(next);
  },
  launchGame: (id) => set({ activeGame: id }),
  closeGame: () => set({ activeGame: null }),
}));
