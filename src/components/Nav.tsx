"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useInteractive, useJunkOn } from "@/interactive/store";
import { T, UI } from "@/lib/i18n";
import BrandMark from "./BrandMark";
import LangSwitch from "./LangSwitch";

export default function Nav({ name }: { name: string }) {
  const openPremium = useInteractive((s) => s.openPremium);
  const premium = useInteractive((s) => s.premium);
  const junk = useJunkOn();
  // Cool side: the bar tightens once the page is scrolled, to give the room
  // back to the content (styled from data-scrolled).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 80);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="skin-nav sticky top-0 z-40" data-scrolled={scrolled ? "" : undefined}>
      {/* Phones: one row, brand + language; the page links move to the
          floating tab bar at the bottom (TabBar). */}
      <nav className="mx-auto flex max-w-6xl items-center gap-x-5 px-4 py-3 text-sm sm:px-6 sm:py-4">
        <Link href="/" transitionTypes={["nav-back"]} className="skin-brand flex min-w-0 flex-1 items-center gap-2.5" aria-label={name}>
          <BrandMark follow />
          <span className="truncate">
            {name}
            <span className="brand-sub cool-only"> / PORTFOLIO</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-x-5 sm:flex">
          <li><Link href="/#works" transitionTypes={["nav-back"]}><T v={UI.works} /></Link></li>
          <li><Link href="/#contact" transitionTypes={["nav-back"]}><T v={UI.contact} /></Link></li>
          {junk && (
            <li className="rot-only">
              <button className="win-button whitespace-nowrap" onClick={openPremium}>💎 去除廣告</button>
            </li>
          )}
          {premium && <li className="rot-only whitespace-nowrap font-bold">⭐ PREMIUM</li>}
        </ul>
        <ul className="flex shrink-0 items-center gap-x-3">
          <li><LangSwitch /></li>
        </ul>
      </nav>
    </header>
  );
}
