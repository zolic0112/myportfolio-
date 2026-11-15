"use client";

import { useEffect, useRef } from "react";

// Stand-in for the shaky low-quality GIFs of the old web: an emoji drawn on a
// tiny canvas, blown up with nearest-neighbour scaling and jittered at a few
// frames per second. No image files, so nothing to clear rights for.
type Motion = "shake" | "spin" | "bounce" | "flash";

export default function PixelGif({
  glyph,
  motion = "shake",
  size = 40,
  label,
}: {
  glyph: string;
  motion?: Motion;
  size?: number;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const N = 18; // source resolution: this is what makes it look like a bad GIF
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, N, N);
      ctx.save();
      ctx.translate(N / 2, N / 2);
      if (motion === "spin") ctx.rotate((frame % 8) * (Math.PI / 4));
      if (motion === "shake") ctx.translate((frame % 2 ? 1 : -1) * 1, frame % 3 === 0 ? 1 : 0);
      if (motion === "bounce") ctx.translate(0, [0, -2, -3, -2][frame % 4]);
      if (motion === "flash") ctx.globalAlpha = frame % 2 ? 1 : 0.25;
      ctx.font = `${N - 4}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, 0, 1);
      ctx.restore();
      frame++;
    };
    draw();
    if (reduce) return;
    const id = setInterval(draw, 160);
    return () => clearInterval(id);
  }, [glyph, motion]);

  return (
    <span className="pixel-gif rot-only" aria-hidden>
      <canvas ref={ref} width={18} height={18} style={{ width: size, height: size }} />
      {label && <b>{label}</b>}
    </span>
  );
}
