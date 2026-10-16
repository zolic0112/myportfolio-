type Props = { name: string; title: string; tagline: string };

export default function Hero({ name, title, tagline }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      {title && <p className="text-sm font-medium text-muted">{title}</p>}
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
        嗨,我是 {name}。
      </h1>
      {tagline && <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{tagline}</p>}
      <p className="mt-10 text-sm text-muted">提示:點點看右下角的小傢伙 →</p>
    </section>
  );
}
