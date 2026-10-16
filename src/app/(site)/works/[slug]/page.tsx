import React from "react";
import Markdoc from "@markdoc/markdoc";
import { notFound } from "next/navigation";
import WorkEmbed from "@/components/WorkEmbed";
import { reader } from "@/lib/content";

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
  const work = await reader.collections.works.read(slug);
  if (!work) notFound();

  const { node } = await work.body();
  const content = Markdoc.renderers.react(Markdoc.transform(node), React);

  return (
    <article className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">{work.title}</h1>
      <p className="mt-4 text-lg text-muted">{work.summary}</p>
      {work.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {work.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted">{tag}</li>
          ))}
        </ul>
      )}
      <div className="mt-10">
        <WorkEmbed embed={work.embed} title={work.title} />
      </div>
      <div className="mt-6 flex gap-4 text-sm font-medium">
        {work.liveUrl && <a href={work.liveUrl} target="_blank" rel="noopener noreferrer">Live →</a>}
        {work.repoUrl && <a href={work.repoUrl} target="_blank" rel="noopener noreferrer">Code →</a>}
      </div>
      <div className="prose-content mt-10 space-y-4 leading-8">{content}</div>
    </article>
  );
}
