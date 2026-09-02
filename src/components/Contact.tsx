import { profile } from "@/lib/data";

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">聯絡我</h2>
      <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
        有合作想法或工作機會歡迎與我聯繫。
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
        <a href={`mailto:${profile.email}`} className="underline underline-offset-4">
          {profile.email}
        </a>
        {profile.social.github && (
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        )}
        {profile.social.linkedin && (
          <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        )}
      </div>
    </section>
  );
}
