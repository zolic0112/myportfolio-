"use client";

import Link from "next/link";
import { useInteractive, useJunkOn } from "@/interactive/store";
import { T, UI } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";

export default function Nav({ name }: { name: string }) {
  const openPremium = useInteractive((s) => s.openPremium);
  const premium = useInteractive((s) => s.premium);
  const junk = useJunkOn();
  return (
    <header className="skin-nav sticky top-0 z-40">
      {/* Phones: brand + tools on the first row, page links on a second one,
          so nothing wraps by accident whatever the language or name length. */}
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm sm:flex-nowrap sm:px-6 sm:py-4">
        <Link href="/" className="skin-brand min-w-0 flex-1 truncate">
          {name}
        </Link>
        <ul className="order-last flex w-full items-center gap-x-5 sm:order-none sm:w-auto">
          <li><Link href="/#works"><T v={UI.works} /></Link></li>
          <li><Link href="/#contact"><T v={UI.contact} /></Link></li>
          {junk && (
            <li className="rot-only ml-auto sm:ml-0">
              <button className="win-button whitespace-nowrap" onClick={openPremium}>💎 去除廣告</button>
            </li>
          )}
          {premium && <li className="rot-only ml-auto whitespace-nowrap font-bold sm:ml-0">⭐ PREMIUM</li>}
        </ul>
        <ul className="flex shrink-0 items-center gap-x-3">
          <li><LangSwitch /></li>
        </ul>
      </nav>
    </header>
  );
}
