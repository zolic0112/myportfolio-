import Image from "next/image";
import Link from "next/link";
import type { WorkCard as Work } from "@/lib/content";
import { T, UI } from "@/lib/i18n";
import { CATEGORY_LABEL, placeholderHue } from "@/lib/labels";

type Props = { work: Work; size?: "lg" | "md"; glass?: boolean; className?: string };

// One card, two skins: a glass tile on the cool side, a Win95 window on the
// rot side. data-perch lets the Space Dog stand on its top edge.
export default function WorkCard({ work, size = "md", glass, className = "" }: Props) {
  return (
    <Link
      href={`/works/${work.slug}`}
      transitionTypes={["nav-forward"]}
      data-perch
      data-size={size}
      className={`skin-card group flex flex-col ${glass ? "glass" : ""} ${work.rotOnly ? "rot-only" : ""} ${className}`}
    >
      <div className="skin-titlebar">
        <span className="t"><T v={work.title} />.exe</span>
        <span className="win-btn" aria-hidden>_</span>
        <span className="win-btn" aria-hidden>□</span>
        <span className="win-btn" aria-hidden>×</span>
      </div>
      {work.rotOnly && <span className="sticker"><T v={UI.hidden} /></span>}
      <div className={`skin-media ${size === "lg" ? "min-h-56 flex-1" : "aspect-video"}`}>
        {/* the brand mark's corner, framing the card like a viewfinder on hover */}
        <span className="vf-corner cool-only" aria-hidden />
        {work.cover ? (
          <Image
            src={work.cover}
            alt=""
            fill
            className="object-cover"
            sizes={size === "lg" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          />
        ) : (
          <div className="ph" style={{ "--h": placeholderHue(work.slug) } as React.CSSProperties}>
            <span><T v={work.title} /></span>
          </div>
        )}
      </div>
      <div className={size === "lg" ? "p-6 sm:p-8" : "p-5"}>
        <p className="skin-meta">
          <T v={CATEGORY_LABEL[work.category]} />
          {work.year ? ` · ${work.year}` : ""}
          {work.playable && <> · ▶ <T v={UI.playable} /></>}
        </p>
        <h3 className={`skin-card-title mt-2 ${size === "lg" ? "sm:text-3xl" : ""}`}><T v={work.title} /></h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted"><T v={work.summary} /></p>
      </div>
    </Link>
  );
}
