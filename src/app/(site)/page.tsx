import Hero from "@/components/Hero";
import WorksGrid from "@/components/WorksGrid";
import Contact from "@/components/Contact";
import { getProfile, getWorks } from "@/lib/content";

export default async function Home() {
  const [profile, works] = await Promise.all([getProfile(), getWorks()]);
  return (
    <>
      <Hero name={profile.name} title={profile.title} tagline={profile.tagline} />
      <WorksGrid works={works} />
      <Contact email={profile.email} links={profile.links} />
    </>
  );
}
