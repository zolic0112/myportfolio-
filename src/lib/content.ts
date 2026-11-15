import { createReader } from "@keystatic/core/reader";
import config from "../../keystatic.config";
import { withFallback, type L } from "./i18n";

export const reader = createReader(process.cwd(), config);

export async function getProfile() {
  const profile = await reader.singletons.profile.read();
  return {
    name: profile?.name || "你的名字",
    title: withFallback(profile?.title ?? "", pick(profile?.i18n, "title")),
    tagline: withFallback(profile?.tagline ?? "", pick(profile?.i18n, "tagline")),
    email: profile?.email ?? "",
    links: profile?.links ?? [],
    sponsor: { intl: profile?.sponsorUrl ?? null, tw: profile?.sponsorUrlTw ?? null },
  };
}

type Tr = Record<string, unknown>;
/** Pull one field out of the per-language translation objects. */
export function pick(i18n: { en: Tr; ja: Tr; es: Tr } | undefined, key: string) {
  const g = (t?: Tr) => (typeof t?.[key] === "string" ? (t[key] as string) : "");
  return { en: g(i18n?.en), ja: g(i18n?.ja), es: g(i18n?.es) };
}

export type Category = "game" | "interactive" | "video" | "graphic";

// Plain, serialisable shape shared by the home page cards, the filter grid
// (a client component) and the "other works" rail.
export type WorkCard = {
  slug: string;
  title: L;
  summary: L;
  category: Category;
  year: number | null;
  role: L;
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
      title: withFallback(entry.title, pick(entry.i18n, "title")),
      summary: withFallback(entry.summary, pick(entry.i18n, "summary")),
      category: entry.category,
      year: entry.year ?? null,
      role: withFallback(entry.role, pick(entry.i18n, "role")),
      cover: entry.cover ?? null,
      tags: [...entry.tags],
      featured: entry.featured,
      rotOnly: entry.rotOnly,
      playable: entry.embed.discriminant !== "none",
      hasVideo: Boolean(entry.video),
    }));
}

/** Hand-curated brain rot material: shorts for the Reels popup, images for the meme popup. */
export async function getJunk() {
  const r = await reader.singletons.reels.read();
  const keep = (xs?: readonly (string | null)[]) => (xs ?? []).filter((u): u is string => Boolean(u));
  return { reels: keep(r?.videos), memes: keep(r?.memes) };
}
