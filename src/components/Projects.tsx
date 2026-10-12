import { prisma } from "@/lib/prisma";

export default async function Projects() {
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <section id="projects" className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">作品</h2>
      {projects.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          尚未新增作品。
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {projects.map((project) => {
            const tags = project.tags
              ? project.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : [];
            return (
              <article
                key={project.id}
                className="rounded-xl border border-black/10 p-6 transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
              >
                <h3 className="font-semibold">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {project.description}
                </p>
                {tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-black/[.05] px-3 py-1 text-xs text-zinc-600 dark:bg-white/[.08] dark:text-zinc-400"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex gap-4 text-sm font-medium">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      Live →
                    </a>
                  )}
                  {project.repo && (
                    <a href={project.repo} target="_blank" rel="noopener noreferrer">
                      Code →
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
