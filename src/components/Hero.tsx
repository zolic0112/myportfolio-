import { T, UI, type L } from "@/lib/i18n";
import PixelGif from "./PixelGif";

type Props = { name: string; title: L; tagline: L };

export default function Hero({ name, title, tagline }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 sm:pt-28">
      <p className="skin-eyebrow">{title.zh ? <T v={title} /> : "Portfolio"} — {new Date().getFullYear()}</p>
      <h1 className="skin-h1 mt-5 text-[clamp(3rem,10vw,7.5rem)]">{name}</h1>
      {tagline.zh && <p className="skin-lede mt-6 max-w-xl text-lg leading-8"><T v={tagline} /></p>}
      {/* brain rot only: the obligatory row of shaky "GIFs" */}
      <div className="rot-only mt-6 flex flex-wrap items-center gap-4">
        <PixelGif glyph="🚧" motion="flash" label={<T v={UI.underConstruction} />} />
        <PixelGif glyph="🔥" motion="shake" label="HOT!!" />
        <PixelGif glyph="💀" motion="spin" />
        <PixelGif glyph="📧" motion="bounce" label="E-mail me" />
        <PixelGif glyph="🆕" motion="flash" label="NEW" />
        <PixelGif glyph="🌐" motion="spin" label="Best viewed in IE" />
      </div>
    </section>
  );
}
