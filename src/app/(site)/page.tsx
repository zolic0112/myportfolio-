import Hero from "@/components/Hero";
import Bento from "@/components/Bento";
import WorksBrowser from "@/components/WorksBrowser";
import Contact from "@/components/Contact";
import PageTransition from "@/components/PageTransition";
import { getProfile, getWorks } from "@/lib/content";
import { T, UI } from "@/lib/i18n";

export default async function Home() {
  const [profile, works] = await Promise.all([getProfile(), getWorks()]);
  return (
    <PageTransition>
      <Hero name={profile.name} title={profile.title} tagline={profile.tagline} />
      <Bento works={works} />
      {/* brain rot only: the banner ads every GeoCities page had */}
      <div className="junk-banners rot-only mx-auto mt-8 max-w-6xl px-4 sm:px-6" aria-hidden>
        <span className="jb jb-green">★彡 FREE SMILEYS 彡★ CLICK HERE!!!</span>
        <span className="jb jb-red"><T v={UI.bannerVirus} /></span>
        <span className="jb jb-yellow">HOT SINGLE DOGS IN YOUR AREA 🐶</span>
        <span className="jb jb-blue"><T v={UI.bannerRam} /></span>
      </div>
      <WorksBrowser works={works} />
      <Contact email={profile.email} links={profile.links} />
    </PageTransition>
  );
}
