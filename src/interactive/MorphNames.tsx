"use client";

import { useEffect } from "react";

// Shared-element morph from a work card to its page. The same work can show up
// more than once on a page (bento and shelf), and view transition names must be
// unique, so the name goes on whichever card was actually clicked, right before
// the navigation snapshots the old page. The work page names its hero and title
// the same way (inline), so a card in its sidebar can take the names over.
const NAMES = ["work-hero", "work-title"] as const;

export default function MorphNames() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const card = (e.target as Element).closest?.("a.skin-card");
      if (!card) return;
      for (const n of NAMES) {
        document.querySelectorAll<HTMLElement>(`[data-vt="${n}"]`).forEach((el) => {
          el.style.viewTransitionName = "";
          delete el.dataset.vt;
        });
      }
      const set = (el: HTMLElement | null, n: string) => {
        if (!el) return;
        el.style.viewTransitionName = n;
        el.dataset.vt = n;
      };
      set(card.querySelector<HTMLElement>(".skin-media"), "work-hero");
      set(card.querySelector<HTMLElement>(".skin-card-title"), "work-title");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
