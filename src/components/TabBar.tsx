"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useInteractive, useJunkOn } from "@/interactive/store";
import { T, UI } from "@/lib/i18n";
import BrandMark from "./BrandMark";

type Tab = "home" | "works" | "contact";

// Phones only: the page links live in a floating bar at the bottom, in thumb
// reach. Cool side it is a clear glass capsule that tucks itself in to icons
// while you scroll down; brain rot side it is a Windows 95 taskbar.
export default function TabBar() {
  const path = usePathname();
  const openPremium = useInteractive((s) => s.openPremium);
  const premium = useInteractive((s) => s.premium);
  const junk = useJunkOn();
  const [section, setSection] = useState<Tab>("home");
  const [compact, setCompact] = useState(false);

  // Which part of the home page is on screen.
  useEffect(() => {
    if (path !== "/") return;
    const ids: Tab[] = ["works", "contact"];
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        setSection(seen.get("contact") ? "contact" : seen.get("works") ? "works" : "home");
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [path]);

  // Scrolling down tucks the bar in; scrolling up or reaching the top opens it.
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      if (y < 120) setCompact(false);
      else if (y - last > 12) setCompact(true);
      else if (last - y > 12) setCompact(false);
      else return;
      last = y;
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const active: Tab = path === "/" ? section : path.startsWith("/works") ? "works" : "home";
  const tabs: { id: Tab; href: string; label: React.ReactNode; icon: React.ReactNode }[] = [
    { id: "home", href: "/", label: <T v={UI.home} />, icon: <BrandMark className="tab-icon" /> },
    { id: "works", href: "/#works", label: <T v={UI.works} />, icon: <GridIcon /> },
    { id: "contact", href: "/#contact", label: <T v={UI.contact} />, icon: <MailIcon /> },
  ];
  const index = tabs.findIndex((t) => t.id === active);

  return (
    <nav className="tab-bar sm:hidden" aria-label="Pages" data-compact={compact ? "" : undefined}>
      <div className="tab-track" style={{ "--tab-i": index, "--tab-n": tabs.length } as React.CSSProperties}>
        <span className="tab-thumb" aria-hidden />
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            transitionTypes={["nav-back"]}
            className="tab"
            aria-current={t.id === active ? "page" : undefined}
            onClick={() => t.id === "home" && path === "/" && scrollTo({ top: 0, behavior: "smooth" })}
          >
            {t.icon}
            <span className="tab-label">{t.label}</span>
          </Link>
        ))}
      </div>
      {/* brain rot: the tray at the right of the taskbar */}
      <div className="tab-tray rot-only">
        {junk && <button className="win-button" onClick={openPremium}>💎</button>}
        {premium && <button className="win-button" onClick={openPremium} aria-label="Premium">⭐</button>}
        <Clock />
      </div>
    </nav>
  );
}

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tab-clock">{t}</span>;
}

function GridIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}
