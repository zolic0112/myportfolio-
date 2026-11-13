import React from "react";
import Markdoc from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import WorkMedia from "@/components/WorkMedia";
import WorkCard from "@/components/WorkCard";
import { getWorks, reader } from "@/lib/content";
import { CATEGORY_LABEL } from "@/lib/labels";

export async function generateStaticParams() {
  const slugs = await reader.collections.works.list();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params;
  const work = await reader.collections.works.read(slug);
  return { title: work?.title, description: work?.summary };
}

export default async function WorkPage({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params;
  const [work, all] = await Promise.all([reader.collections.works.read(slug), getWorks()]);
  if (!work) notFound();

  const { node } = await work.body();
  const content = Markdoc.renderers.react(Markdoc.transform(node), React);
  const others = all.filter((w) => w.slug !== slug).slice(0, 6);
  const meta = [CATEGORY_LABEL[work.category], work.year, work.role].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <article className="min-w-0">
        <WorkMedia
          slug={slug}
          title={work.title}
          cover={work.cover ?? null}
          video={work.video}
          gallery={work.gallery.filter((g): g is string => Boolean(g))}
          embed={work.embed}
          mobilePlayable={work.mobilePlayable}
        />
        <p className="skin-meta mt-8">{meta}</p>
        <h1 className="skin-h1 mt-3 text-5xl sm:text-6xl">{work.title}</h1>
        <p className="skin-lede mt-4 text-lg leading-8">{work.summary}</p>
        {work.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {work.tags.map((tag) => (
              <li key={tag} className="skin-tag">{tag}</li>
            ))}
          </ul>
        )}
        {(work.liveUrl || work.repoUrl) && (
          <div className="mt-6 flex gap-3 text-sm">
            {work.liveUrl && <a href={work.liveUrl} target="_blank" rel="noopener noreferrer" className="skin-btn ghost">外部連結 ↗</a>}
            {work.repoUrl && <a href={work.repoUrl} target="_blank" rel="noopener noreferrer" className="skin-btn ghost">原始碼 ↗</a>}
          </div>
        )}
        <div className="skin-prose mt-10">{content}</div>
      </article>
      <aside aria-label="其他作品" className="grid content-start gap-4">
        <h2 className="skin-eyebrow">其他作品</h2>
        {others.map((w) => (
          <WorkCard key={w.slug} work={w} />
        ))}
      </aside>
    </div>
  );
}
