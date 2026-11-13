import { createReader } from "@keystatic/core/reader";
import config from "../../keystatic.config";

export const reader = createReader(process.cwd(), config);

export async function getProfile() {
  const profile = await reader.singletons.profile.read();
  return {
    name: profile?.name || "你的名字",
    title: profile?.title ?? "",
    tagline: profile?.tagline ?? "",
    email: profile?.email ?? "",
    links: profile?.links ?? [],
    sponsorUrl: profile?.sponsorUrl ?? null,
  };
}

export type Category = "game" | "interactive" | "video" | "graphic";

// Plain, serialisable shape shared by the home page cards, the filter grid
// (a client component) and the "other works" rail.
export type WorkCard = {
  slug: string;
  title: string;
  summary: string;
  category: Category;
  year: number | null;
  role: string;
  cover: string | null;
  tags: string[];
  featured: boolean;
  rotOnly: boolean;
  playable: boolean;
  hasVideo: boolean;
};

export async function getWorks(): Promise<WorkCard[]> {
  const works = await reader.collections.works.all();
  return works
    .sort((a, b) => (a.entry.order ?? 0) - (b.entry.order ?? 0))
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      summary: entry.summary,
      category: entry.category,
      year: entry.year ?? null,
      role: entry.role,
      cover: entry.cover ?? null,
      tags: [...entry.tags],
      featured: entry.featured,
      rotOnly: entry.rotOnly,
      playable: entry.embed.discriminant !== "none",
      hasVideo: Boolean(entry.video),
    }));
}
