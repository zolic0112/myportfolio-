import { profile } from "@/lib/data";

export default function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {profile.title}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        嗨,我是 {profile.name}。
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        {profile.tagline}
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="#projects"
          className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          查看作品
        </a>
        <a
          href="#contact"
          className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
        >
          聯絡我
        </a>
      </div>
    </section>
  );
}
