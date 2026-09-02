import Link from "next/link";
import { profile } from "@/lib/data";

const links = [
  { href: "#projects", label: "作品" },
  { href: "#skills", label: "技能" },
  { href: "#contact", label: "聯絡" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/80">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          {profile.name}
        </Link>
        <ul className="flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-zinc-950 dark:hover:text-zinc-50">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
