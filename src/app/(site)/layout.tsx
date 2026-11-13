import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveLayer from "@/interactive/InteractiveLayer";
import { getProfile } from "@/lib/content";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return { title: `${profile.name} | 作品集`, description: profile.tagline };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  const links = profile.links.map((l) => l.url).filter((u): u is string => Boolean(u));
  return (
    // Every visit starts on the cool persona; the dog decides the rest.
    <html
      lang="zh-Hant"
      data-persona="cool"
      className={`${inter.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="starfield" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <Nav name={profile.name} />
        <div className="marquee rot-only" aria-hidden>
          <span>
            🚧 網站施工中 🚧 歡迎光臨我的首頁!!! 🔥🔥🔥 本站最佳瀏覽解析度 800×600 💾 請用 IE 開啟 🤡 你是第 000,001 位訪客 🎉 狗跑出來了 請幫忙抓 🐶
          </span>
        </div>
        <main className="flex-1">{children}</main>
        <Footer name={profile.name} />
        <InteractiveLayer links={links} sponsorUrl={profile.sponsorUrl} />
      </body>
    </html>
  );
}
