"use client";

import { useEffect, useState } from "react";

// Edge refraction for the two pieces of "real" glass (the header capsules and
// the cage jar): the backdrop is bent near the rim, the way a thick pane does it.
// The only way to move backdrop pixels on the web is an SVG displacement
// filter inside backdrop-filter, and only Chromium runs that. Everywhere else
// (and on touch devices, to keep them cool) the plain frosted glass from the
// stylesheet stays, so nothing here is required for the design to hold.

type Lens = { id: string; w: number; h: number; map: string; blur: number; scale: number };

const TARGETS: { id: string; selector: string; band: number; blur: number; scale: number }[] = [
  { id: "lens-links", selector: ".nav-links", band: 11, blur: 7, scale: 40 },
  { id: "lens-brand", selector: ".skin-brand", band: 11, blur: 7, scale: 40 },
  { id: "lens-lang", selector: ".lang-switch", band: 11, blur: 7, scale: 40 },
  { id: "lens-cage", selector: ".cage-frost", band: 14, blur: 5, scale: 38 },
];

// Displacement map sized to the element: red falls left to right, green top to
// bottom, and a soft neutral (128,128) slab covers the middle, so only a band
// along the rim pushes pixels and the centre stays put.
function buildMap(w: number, h: number, rx: number, ry: number, band: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<defs><linearGradient id="r" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0f0"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${band * 0.45}"/></filter></defs>` +
    `<rect width="${w}" height="${h}" fill="#000"/>` +
    `<rect width="${w}" height="${h}" fill="url(#r)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#g)" style="mix-blend-mode:screen"/>` +
    `<rect x="${band}" y="${band}" width="${Math.max(1, w - band * 2)}" height="${Math.max(1, h - band * 2)}" rx="${Math.max(0, rx - band)}" ry="${Math.max(0, ry - band)}" fill="#808000" filter="url(#b)"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function GlassLens() {
  const [lenses, setLenses] = useState<Lens[]>([]);

  useEffect(() => {
    const chromium = /Chrom(e|ium)\//.test(navigator.userAgent) && !/Firefox|FxiOS/.test(navigator.userAgent);
    if (!chromium || matchMedia("(pointer: coarse)").matches) return;

    const measure = () => {
      const next: Lens[] = [];
      for (const t of TARGETS) {
        const el = document.querySelector<HTMLElement>(t.selector);
        if (!el) continue;
        const w = Math.round(el.offsetWidth);
        const h = Math.round(el.offsetHeight);
        if (w < 40 || h < 30) continue;
        const cage = t.id === "lens-cage";
        const rx = cage ? w / 2 : Math.min(h / 2, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
        const ry = cage ? h * 0.29 : rx;
        next.push({ id: t.id, w, h, map: buildMap(w, h, rx, ry, t.band), blur: t.blur, scale: t.scale });
      }
      setLenses(next);
      // the stylesheet switches the filters on (cool side only) from this flag
      document.documentElement.toggleAttribute("data-lens", next.length > 0);
    };
    measure();
    let timer = 0;
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(measure, 150);
    };
    addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      removeEventListener("resize", onResize);
      document.documentElement.removeAttribute("data-lens");
    };
  }, []);

  if (!lenses.length) return null;
  return (
    <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
      <defs>
        {lenses.map((l) => (
          <filter key={l.id} id={l.id} x="0" y="0" width={l.w} height={l.h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={l.blur} result="soft" />
            <feImage href={l.map} x="0" y="0" width={l.w} height={l.h} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="soft" in2="map" scale={l.scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
