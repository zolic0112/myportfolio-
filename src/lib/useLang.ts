"use client";

import { useSyncExternalStore } from "react";
import { LANGS, type Lang } from "./i18n";

// The current language as React state, for client components whose text is
// built at runtime (popups, the premium window): they can't use <T>'s
// render-every-language-and-hide trick for attributes, alerts or text that
// changes as you click. Server HTML is Chinese; the client catches up on
// hydration. Follows <html data-lang>, which LangSwitch sets.

function read(): Lang {
  const l = document.documentElement.dataset.lang as Lang | undefined;
  return l && (LANGS as readonly string[]).includes(l) ? l : "zh";
}

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
  return () => mo.disconnect();
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, read, () => "zh");
}

/** `const t = useT();  t({ zh, en, ja, es })` → the current language's value. */
export function useT() {
  const lang = useLang();
  return <V,>(v: Record<Lang, V>): V => v[lang];
}
