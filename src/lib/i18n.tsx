// Four languages, no routing: every translated string is rendered once per
// language and CSS shows the one matching <html data-lang>. An inline script
// in the layout picks the language before first paint (saved choice, else the
// browser's, else English), so there is no flash and pages stay static.
//
// Only "serious" content is translated: navigation, functional UI, work
// titles and descriptions. Brain rot junk stays untranslated on purpose.

export const LANGS = ["zh", "en", "ja", "es"] as const;
export type Lang = (typeof LANGS)[number];
export type L = Record<Lang, string>;

export const LANG_LABEL: L = { zh: "中", en: "EN", ja: "日", es: "ES" };
export const HTML_LANG: L = { zh: "zh-Hant", en: "en", ja: "ja", es: "es" };
export const LANG_KEY = "sd-lang";

/** Runs before paint. Keep in sync with LANGS / LANG_KEY / HTML_LANG. */
export const LANG_SCRIPT = `(function(){try{var s=["zh","en","ja","es"],h={zh:"zh-Hant",en:"en",ja:"ja",es:"es"},l=localStorage.getItem("${LANG_KEY}");if(s.indexOf(l)<0){l="en";var n=navigator.languages||[navigator.language];for(var i=0;i<n.length;i++){var c=(n[i]||"").slice(0,2).toLowerCase();if(s.indexOf(c)>=0){l=c;break}}}var d=document.documentElement;d.dataset.lang=l;d.lang=h[l]}catch(e){}})()`;

export const UI = {
  home: { zh: "首頁", en: "Home", ja: "ホーム", es: "Inicio" },
  works: { zh: "作品", en: "Works", ja: "作品", es: "Obras" },
  contact: { zh: "聯絡", en: "Contact", ja: "連絡先", es: "Contacto" },
  allWorks: { zh: "所有作品", en: "All works", ja: "すべての作品", es: "Todas las obras" },
  metaCategory: { zh: "類別", en: "Type", ja: "種類", es: "Tipo" },
  metaYear: { zh: "年份", en: "Year", ja: "年", es: "Año" },
  metaRole: { zh: "角色", en: "Role", ja: "担当", es: "Rol" },
  otherWorks: { zh: "其他作品", en: "More works", ja: "ほかの作品", es: "Más obras" },
  all: { zh: "全部", en: "All", ja: "すべて", es: "Todo" },
  game: { zh: "遊戲", en: "Game", ja: "ゲーム", es: "Juego" },
  interactive: { zh: "互動", en: "Interactive", ja: "インタラクティブ", es: "Interactivo" },
  video: { zh: "影像", en: "Film", ja: "映像", es: "Vídeo" },
  graphic: { zh: "平面", en: "Graphic", ja: "グラフィック", es: "Gráfico" },
  playable: { zh: "可玩", en: "Playable", ja: "プレイ可", es: "Jugable" },
  play: { zh: "▶ 開始玩", en: "▶ Play", ja: "▶ プレイ", es: "▶ Jugar" },
  watch: { zh: "▶ 播放", en: "▶ Watch", ja: "▶ 再生", es: "▶ Ver" },
  noMobile: {
    zh: "這件作品在手機上無法遊玩,請用電腦開啟。",
    en: "This piece can’t be played on a phone. Please open it on a computer.",
    ja: "この作品はスマートフォンではプレイできません。パソコンでご覧ください。",
    es: "Esta obra no se puede jugar en el móvil. Ábrela en un ordenador.",
  },
  demoVideo: {
    zh: "上面是示範影片。",
    en: "The video above is a demo.",
    ja: "上の映像はデモです。",
    es: "El vídeo de arriba es una demostración.",
  },
  external: { zh: "外部連結", en: "Visit", ja: "外部リンク", es: "Enlace" },
  source: { zh: "原始碼", en: "Source", ja: "ソースコード", es: "Código" },
  empty: {
    zh: "還沒有作品。",
    en: "No works yet.",
    ja: "作品はまだありません。",
    es: "Aún no hay obras.",
  },
  locked: {
    zh: "這件作品被關起來了。",
    en: "This piece is locked away.",
    ja: "この作品は閉じ込められています。",
    es: "Esta obra está encerrada.",
  },
  loading: { zh: "載入中…", en: "Loading…", ja: "読み込み中…", es: "Cargando…" },
  cageTag: { zh: "請勿打開。", en: "Do not open.", ja: "開けないでください。", es: "No abrir." },
  cageNote: { zh: "請把我抓回來 🥺", en: "Catch me, please 🥺", ja: "つかまえて 🥺", es: "¡Atrápame! 🥺" },
  cageCool: { zh: "籠子(請勿打開)", en: "Cage (do not open)", ja: "ケージ(開けないでください)", es: "Jaula (no abrir)" },
  cageRot: {
    zh: "籠子:把狗抓回來放進去就能回到原本的網站",
    en: "Cage: catch the dog and put it back to return to the normal site",
    ja: "ケージ:犬をつかまえて戻すと元のサイトに戻ります",
    es: "Jaula: atrapa al perro y devuélvelo para volver al sitio normal",
  },
} satisfies Record<string, L>;

/** Fill missing translations with the source (Chinese) text. */
export function withFallback(zh: string, t?: Partial<Record<Lang, string | null | undefined>>): L {
  return { zh, en: t?.en || zh, ja: t?.ja || zh, es: t?.es || zh };
}

/** Translated inline text. Works in server and client components. */
export function T({ v }: { v: L }) {
  // Same text in every language: nothing to switch.
  if (v.en === v.zh && v.ja === v.zh && v.es === v.zh) return <>{v.zh}</>;
  return (
    <>
      {LANGS.map((l) => (
        <span key={l} data-l={l} lang={HTML_LANG[l]}>
          {v[l]}
        </span>
      ))}
    </>
  );
}
