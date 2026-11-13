type Props = { email: string; links: readonly { label: string; url: string | null }[] };

export default function Contact({ email, links }: Props) {
  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-28 pt-8 sm:px-6">
      <h2 className="skin-h2 text-3xl sm:text-4xl">聯絡</h2>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {email && (
          <a href={`mailto:${email}`} className="skin-btn ghost">{email}</a>
        )}
        {links.map((l) =>
          l.url ? (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="skin-btn ghost">
              {l.label} ↗
            </a>
          ) : null,
        )}
      </div>
    </section>
  );
}
