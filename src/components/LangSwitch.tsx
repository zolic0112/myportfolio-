"use client";

import { HTML_LANG, LANG_KEY, LANG_LABEL, LANGS, type Lang } from "@/lib/i18n";

// Manual language switch. The pressed state is styled from <html data-lang>
// in CSS, so this needs no React state and never mismatches on hydration.
function setLang(l: Lang) {
  document.documentElement.setAttribute("data-lang", l);
  document.documentElement.setAttribute("lang", HTML_LANG[l]);
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {}
}

export default function LangSwitch() {
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} data-set={l} onClick={() => setLang(l)} lang={HTML_LANG[l]}>
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
