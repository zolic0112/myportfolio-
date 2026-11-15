import Hero from "@/components/Hero";
import Bento from "@/components/Bento";
import WorksBrowser from "@/components/WorksBrowser";
import Contact from "@/components/Contact";
import { getProfile, getWorks } from "@/lib/content";

export default async function Home() {
  const [profile, works] = await Promise.all([getProfile(), getWorks()]);
  return (
    <>
      <Hero name={profile.name} title={profile.title} tagline={profile.tagline} />
      <Bento works={works} />
      {/* brain rot only: the banner ads every GeoCities page had */}
      <div className="junk-banners rot-only mx-auto mt-8 max-w-6xl px-4 sm:px-6" aria-hidden>
        <span className="jb jb-green">★彡 FREE SMILEYS 彡★ CLICK HERE!!!</span>
        <span className="jb jb-red">⚠ 你的電腦有 37 隻病毒 ⚠</span>
        <span className="jb jb-yellow">HOT SINGLE DOGS IN YOUR AREA 🐶</span>
        <span className="jb jb-blue">下載更多 RAM · 100% 免費 · 無毒</span>
      </div>
      <WorksBrowser works={works} />
      <Contact email={profile.email} links={profile.links} />
    </>
  );
}
