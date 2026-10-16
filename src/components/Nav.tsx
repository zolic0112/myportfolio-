import Link from "next/link";

export default function Nav({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display font-semibold tracking-tight">
          {name}
        </Link>
        <ul className="flex gap-6 text-sm text-muted">
          <li><Link href="/#works" className="hover:text-fg">作品</Link></li>
          <li><Link href="/#contact" className="hover:text-fg">聯絡</Link></li>
        </ul>
      </nav>
    </header>
  );
}
