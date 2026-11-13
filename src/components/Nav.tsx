"use client";

import Link from "next/link";
import { useInteractive, useJunkOn } from "@/interactive/store";

export default function Nav({ name }: { name: string }) {
  const openPremium = useInteractive((s) => s.openPremium);
  const premium = useInteractive((s) => s.premium);
  const junk = useJunkOn();
  return (
    <header className="skin-nav sticky top-0 z-40">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="skin-brand">
          {name}
        </Link>
        <ul className="flex items-center gap-5 text-sm">
          <li><Link href="/#works">作品</Link></li>
          <li><Link href="/#contact">聯絡</Link></li>
          {junk && (
            <li className="rot-only">
              <button className="win-button" onClick={openPremium}>💎 去除廣告</button>
            </li>
          )}
          {premium && <li className="rot-only font-bold">⭐ PREMIUM 會員</li>}
        </ul>
      </nav>
    </header>
  );
}
