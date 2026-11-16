import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif, IBM_Plex_Mono, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveLayer from "@/interactive/InteractiveLayer";
import Starfield from "@/interactive/Starfield";
import { getJunk, getProfile } from "@/lib/content";
import { LANG_SCRIPT } from "@/lib/i18n";

const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["300", "400", "500"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
// CJK glyphs for the thin display headings (Space Grotesk is Latin only).
const sansTc = Noto_Sans_TC({ variable: "--font-sans-tc", weight: ["200", "300", "400", "500"], preload: false });
const mono = IBM_Plex_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["300", "400", "500"] });

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return { title: `${profile.name} | 作品集`, description: profile.tagline.en };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [profile, junk] = await Promise.all([getProfile(), getJunk()]);
  const links = profile.links.map((l) => l.url).filter((u): u is string => Boolean(u));
  return (
    // Every visit starts on the cool persona; the dog decides the rest.
    <html
      lang="en"
      data-lang="en"
      data-persona="cool"
      suppressHydrationWarning
      className={`${grotesk.variable} ${serif.variable} ${sansTc.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Pick the language before first paint (see lib/i18n). */}
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
        {/* TEMP, for comparing heading weights: add ?type=medium to the URL. Remove once decided. */}
        <script dangerouslySetInnerHTML={{ __html: `if(/[?&]type=medium/.test(location.search))document.documentElement.setAttribute("data-type","medium")` }} />
        <div className="starfield" aria-hidden>
          <i />
          <i />
          <i />
          <Starfield />
        </div>
        {/* cool only: a quiet status line, like an instrument that is on */}
        <div className="status-bar cool-only" aria-hidden>
          <span className="live-dot" />
          <span>CONTAINMENT · STABLE</span>
        </div>
        <Nav name={profile.name} />
        <div className="marquee rot-only" aria-hidden>
          <span>
            🚧 網站施工中 🚧 歡迎光臨我的首頁!!! 🔥🔥🔥 本站最佳瀏覽解析度 800×600 💾 請用 IE 開啟 🤡 你是第 000,001 位訪客 🎉 狗跑出來了 請幫忙抓 🐶
          </span>
        </div>
        <main className="flex-1">{children}</main>
        <Footer name={profile.name} />
        <InteractiveLayer links={links} reels={junk.reels} memes={junk.memes} sponsor={profile.sponsor} />
      </body>
    </html>
  );
}
