import type { Category } from "./content";

export const CATEGORY_LABEL: Record<Category, string> = {
  game: "遊戲",
  interactive: "互動",
  video: "影像",
  graphic: "平面",
};

// Deterministic placeholder art for works without a cover, so the grid still
// has rhythm before real images exist.
export function placeholderHue(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
