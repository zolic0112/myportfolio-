import { T, type L } from "@/lib/i18n";

type Props = { name: string; title: L; tagline: L };

export default function Hero({ name, title, tagline }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 sm:pt-28">
      <p className="skin-eyebrow">{title.zh ? <T v={title} /> : "Portfolio"} — {new Date().getFullYear()}</p>
      <h1 className="skin-h1 mt-5 text-[clamp(3rem,10vw,7.5rem)]">{name}</h1>
      {tagline.zh && <p className="skin-lede mt-6 max-w-xl text-lg leading-8"><T v={tagline} /></p>}
    </section>
  );
}
