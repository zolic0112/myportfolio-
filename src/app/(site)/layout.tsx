import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TabBar from "@/components/TabBar";
import InteractiveLayer from "@/interactive/InteractiveLayer";
import Starfield from "@/interactive/Starfield";
import Parallax from "@/interactive/Parallax";
import MorphNames from "@/interactive/MorphNames";
import { getJunk, getProfile } from "@/lib/content";
import { LANG_SCRIPT, T, UI } from "@/lib/i18n";

const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["300", "400", "500"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
// CJK glyphs for the thin display headings (Space Grotesk is Latin only).
// Noto Sans TC is loaded by the browser from Google Fonts instead of through
// next/font: it comes in ~100 unicode-range slices per weight, and having the
// build download all of them fails on slow or filtered networks.
const SANS_TC_CSS = "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500&display=swap";
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
      className={`${grotesk.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={SANS_TC_CSS} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Pick the language before first paint (see lib/i18n). */}
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
        <div className="starfield" aria-hidden>
          <i />
          <i />
          <i />
          <Starfield />
        </div>
        <Parallax />
        <MorphNames />
        {/* cool only: a quiet status line, like an instrument that is on */}
        <div className="status-bar cool-only" aria-hidden>
          <span className="live-dot" />
          <span>CONTAINMENT · STABLE</span>
        </div>
        <Nav name={profile.name} />
        <div className="marquee rot-only" aria-hidden>
          <span>
            <T v={UI.marquee} />
          </span>
        </div>
        <main className="flex-1">{children}</main>
        <Footer name={profile.name} />
        <TabBar />
        <InteractiveLayer links={links} reels={junk.reels} memes={junk.memes} sponsor={profile.sponsor} />
      </body>
    </html>
  );
}
