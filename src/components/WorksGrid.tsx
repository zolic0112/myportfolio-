import Image from "next/image";
import Link from "next/link";
import type { getWorks } from "@/lib/content";

const CATEGORY_LABEL = { game: "小遊戲", app: "Web 應用", design: "視覺設計" } as const;

type Works = Awaited<ReturnType<typeof getWorks>>;

export default function WorksGrid({ works }: { works: Works }) {
  return (
    <section id="works" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-display text-2xl font-semibold tracking-tight">作品</h2>
      {works.length === 0 ? (
        <p className="mt-8 text-sm text-muted">還沒有作品,到 /keystatic 新增第一個吧。</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {works.map(({ slug, entry }) => (
            <Link
              key={slug}
              href={`/works/${slug}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-video bg-border">
                {entry.cover && (
                  <Image src={entry.cover} alt="" fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-muted">{CATEGORY_LABEL[entry.category]}</p>
                <h3 className="mt-1 font-semibold">{entry.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{entry.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
