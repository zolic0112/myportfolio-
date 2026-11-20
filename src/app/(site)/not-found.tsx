import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { T, UI } from "@/lib/i18n";

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[60vh] max-w-6xl content-center px-4 py-24 sm:px-6">
      <div className="cool-only">
        <BrandMark className="nf-mark" />
        <p className="skin-eyebrow mt-8">404</p>
        <h1 className="skin-h1 mt-4 text-[clamp(2.5rem,7vw,5rem)]"><T v={UI.nfTitle} /></h1>
        <p className="skin-lede mt-5 max-w-xl text-lg leading-8"><T v={UI.nfLede} /></p>
      </div>
      <p className="rot-only wordart nf-rot"><T v={UI.nfRot} /></p>
      <div className="mt-10">
        <Link href="/#works" transitionTypes={["nav-back"]} className="skin-btn ghost">
          ← <T v={UI.nfBack} />
        </Link>
      </div>
    </section>
  );
}
