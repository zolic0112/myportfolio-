import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveLayer from "@/interactive/InteractiveLayer";
import { getProfile } from "@/lib/content";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return { title: `${profile.name} | 作品集`, description: profile.tagline };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  return (
    <html
      lang="zh-Hant"
      data-theme="minimal"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Nav name={profile.name} />
        <main className="flex-1">{children}</main>
        <Footer name={profile.name} />
        <InteractiveLayer />
      </body>
    </html>
  );
}
