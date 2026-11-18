import { T, UI } from "@/lib/i18n";
import BrandMark from "./BrandMark";

export default function Footer({ name }: { name: string }) {
  return (
    <footer className="skin-footer py-10 text-center text-xs tracking-[0.2em]">
      <BrandMark className="footer-mark cool-only" />
      <span className="cool-only">© {new Date().getFullYear()} {name.toUpperCase()}</span>
      <span className="rot-only">
        © 1999 {name} ★ <T v={UI.footerRot} />
      </span>
    </footer>
  );
}
