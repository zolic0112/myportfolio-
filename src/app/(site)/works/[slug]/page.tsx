import React from "react";
import Markdoc from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import WorkMedia from "@/components/WorkMedia";
import WorkCard from "@/components/WorkCard";
import PageTransition from "@/components/PageTransition";
import { getWorks, pick, reader } from "@/lib/content";
import { HTML_LANG, LANGS, T, UI, withFallback } from "@/lib/i18n";
import { CATEGORY_LABEL } from "@/lib/labels";

export async function generateStaticParams() {
  const slugs = await reader.collections.works.list();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params;
  const work = await reader.collections.works.read(slug);
  return {
    title: work?.i18n.en.title || work?.title,
    description: work?.i18n.en.summary || work?.summary,
  };
}

export default async function WorkPage({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params;
  const [work, all] = await Promise.all([reader.collections.works.read(slug), getWorks()]);
  if (!work) notFound();

  const { node } = await work.body();
  const content = Markdoc.renderers.react(Markdoc.transform(node), React);
  const others = all.filter((w) => w.slug !== slug).slice(0, 6);
  const title = withFallback(work.title, pick(work.i18n, "title"));
  const summary = withFallback(work.summary, pick(work.i18n, "summary"));
  const role = withFallback(work.role, pick(work.i18n, "role"));
  // Translated bodies are plain text (blank line = new paragraph); languages
  // without one fall back to the Chinese Markdoc body.
  const bodies = pick(work.i18n, "body");

  return (
    <PageTransition>
    {work.rotOnly && (
      // Hidden pieces only exist on the brain rot side, even by direct link.
      <div className="cool-only mx-auto max-w-6xl px-4 py-32 text-center sm:px-6">
        <p className="skin-eyebrow">404</p>
        <p className="skin-h2 mt-4 text-3xl"><T v={UI.locked} /></p>
      </div>
    )}
    <div className={`mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] ${work.rotOnly ? "rot-only" : ""}`}>
      <article className="min-w-0">
        <WorkMedia
          slug={slug}
          title={title}
          cover={work.cover ?? null}
          video={work.video}
          gallery={work.gallery.filter((g): g is string => Boolean(g))}
          embed={work.embed}
          mobilePlayable={work.mobilePlayable}
        />
        {/* cool side: the facts as instrument chips (label over value) */}
        <dl className="metric-row cool-only mt-8">
          <div className="metric-chip">
            <dt><T v={UI.metaCategory} /></dt>
            <dd><T v={CATEGORY_LABEL[work.category]} /></dd>
          </div>
          {work.year ? (
            <div className="metric-chip">
              <dt><T v={UI.metaYear} /></dt>
              <dd className="num">{work.year}</dd>
            </div>
          ) : null}
          {work.role && (
            <div className="metric-chip">
              <dt><T v={UI.metaRole} /></dt>
              <dd><T v={role} /></dd>
            </div>
          )}
        </dl>
        <p className="skin-meta rot-only mt-8">
          <T v={CATEGORY_LABEL[work.category]} />
          {work.year ? ` · ${work.year}` : ""}
          {work.role && <> · <T v={role} /></>}
        </p>
        <h1 className="skin-h1 work-title mt-3 text-5xl sm:text-6xl" data-vt="work-title" style={{ viewTransitionName: "work-title" }}><T v={title} /></h1>
        <p className="skin-lede mt-4 text-lg leading-8"><T v={summary} /></p>
        {work.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {work.tags.map((tag) => (
              <li key={tag} className="skin-tag">{tag}</li>
            ))}
          </ul>
        )}
        {(work.liveUrl || work.repoUrl) && (
          <div className="mt-6 flex gap-3 text-sm">
            {work.liveUrl && <a href={work.liveUrl} target="_blank" rel="noopener noreferrer" className="skin-btn ghost"><T v={UI.external} /> ↗</a>}
            {work.repoUrl && <a href={work.repoUrl} target="_blank" rel="noopener noreferrer" className="skin-btn ghost"><T v={UI.source} /> ↗</a>}
          </div>
        )}
        {LANGS.map((l) => {
          const text = l === "zh" ? "" : bodies[l];
          // Chinese block also serves every language that has no translation.
          if (l !== "zh" && !text) return null;
          const serves = l === "zh" ? LANGS.filter((x) => x === "zh" || !bodies[x]) : [l];
          return serves.map((s) => (
            <div key={`${l}-${s}`} data-l={s} lang={HTML_LANG[l]} className="skin-prose mt-10">
              {l === "zh" ? content : text.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          ));
        })}
      </article>
      <aside aria-label="其他作品" className="grid content-start gap-4">
        <h2 className="skin-eyebrow"><T v={UI.otherWorks} /></h2>
        {others.map((w) => (
          <WorkCard key={w.slug} work={w} />
        ))}
      </aside>
    </div>
    </PageTransition>
  );
}
