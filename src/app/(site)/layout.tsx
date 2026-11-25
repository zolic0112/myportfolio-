import type { Metadata } from "next";
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

// The site typeface: Zev Hei TC (宙黑體, variant N), self-hosted in
// public/fonts/zev-hei (SIL OFL 1.1). Its CSS splits the font into ~150
// unicode-range slices, so a page downloads only the slices for the
// characters it shows.
const ZEV_HEI_CSS = "/fonts/zev-hei/css/zevheitc_n.css";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    // Absolute URLs for the share image. On Vercel this falls back to the
    // project's production URL by itself; set NEXT_PUBLIC_SITE_URL for a custom domain.
    metadataBase: site ? new URL(site) : undefined,
    title: `${profile.name} | Portfolio`,
    description: profile.tagline.en,
    openGraph: { type: "website", title: profile.name, description: profile.tagline.en },
  };
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
      className="h-full antialiased"
    >
      <head>
        <link rel="stylesheet" href={ZEV_HEI_CSS} />
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
