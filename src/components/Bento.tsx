import type { WorkCard as Work } from "@/lib/content";
import WorkCard from "./WorkCard";

// Top-of-page showcase: 2–3 featured works, product-page style.
export default function Bento({ works }: { works: Work[] }) {
  const picks = works.filter((w) => w.featured && !w.rotOnly).slice(0, 3);
  if (!picks.length) return null;
  const [main, ...rest] = picks;
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="代表作">
      <div className="grid gap-4 lg:grid-cols-5 lg:grid-rows-2">
        <WorkCard work={main} size="lg" glass className="lg:col-span-3 lg:row-span-2" />
        {rest.map((w) => (
          <WorkCard key={w.slug} work={w} glass className="lg:col-span-2" />
        ))}
      </div>
    </section>
  );
}
