import BrandMark from "./BrandMark";

export default function Footer({ name }: { name: string }) {
  return (
    <footer className="skin-footer py-10 text-center text-xs tracking-[0.2em]">
      <BrandMark className="footer-mark cool-only" />
      <span className="cool-only">© {new Date().getFullYear()} {name.toUpperCase()}</span>
      <span className="rot-only">
        © 1999 {name} ★ 本站由 記事本 製作 ★ 訪客計數器 [0][0][0][1][3][3][7] ★ 加入我的最愛!!
      </span>
    </footer>
  );
}
