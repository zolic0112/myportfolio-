import { nameLang, T, UI, type L } from "@/lib/i18n";
import PixelGif from "./PixelGif";

const line = (v: L, tail: string): L => ({ zh: v.zh + tail, en: v.en + tail, ja: v.ja + tail, es: v.es + tail });

type Props = { name: string; title: L; tagline: L };

export default function Hero({ name, title, tagline }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 sm:pt-28">
      {/* year included in the stacked text, so reserving the longest
          language's width leaves no gap in the middle of the line */}
      <p className="skin-eyebrow">
        <T v={line(title.zh ? title : { zh: "Portfolio", en: "Portfolio", ja: "Portfolio", es: "Portfolio" }, ` — ${new Date().getFullYear()}`)} stack="inline" />
      </p>
      <h1 className="skin-h1 mt-5 text-[clamp(3rem,10vw,7.5rem)]" lang={nameLang(name)}>{name}</h1>
      {tagline.zh && <p className="skin-lede mt-6 max-w-xl text-lg leading-8"><T v={tagline} stack="block" /></p>}
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
