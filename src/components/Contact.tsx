type Props = { email: string; links: readonly { label: string; url: string | null }[] };

export default function Contact({ email, links }: Props) {
  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-display text-2xl font-semibold tracking-tight">聯絡我</h2>
      <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
        {email && (
          <a href={`mailto:${email}`} className="underline underline-offset-4">{email}</a>
        )}
        {links.map((l) =>
          l.url ? (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
          ) : null,
        )}
      </div>
    </section>
  );
}
