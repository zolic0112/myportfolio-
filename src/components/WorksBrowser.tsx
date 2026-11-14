"use client";

import { useState } from "react";
import type { Category, WorkCard as Work } from "@/lib/content";
import { T, UI } from "@/lib/i18n";
import { CATEGORY_LABEL } from "@/lib/labels";
import WorkCard from "./WorkCard";

const FILTERS: (Category | "all")[] = ["all", "game", "interactive", "video", "graphic"];

// Platform-style shelf under the bento: filter chips + grid.
export default function WorksBrowser({ works }: { works: Work[] }) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const shown = works.filter((w) => filter === "all" || w.category === filter);
  return (
    <section id="works" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="skin-h2 text-3xl sm:text-4xl"><T v={UI.allWorks} /></h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f} className="skin-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              <T v={f === "all" ? UI.all : CATEGORY_LABEL[f]} />
            </button>
          ))}
        </div>
      </div>
      {works.length === 0 ? (
        <p className="mt-8 text-sm text-muted"><T v={UI.empty} /></p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((w) => (
            <WorkCard key={w.slug} work={w} />
          ))}
        </div>
      )}
    </section>
  );
}
