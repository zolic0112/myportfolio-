import type { Category } from "./content";
import { UI, type L } from "./i18n";

export const CATEGORY_LABEL: Record<Category, L> = {
  game: UI.game,
  interactive: UI.interactive,
  video: UI.video,
  graphic: UI.graphic,
};

// Deterministic placeholder art for works without a cover, so the grid still
// has rhythm before real images exist.
export function placeholderHue(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
