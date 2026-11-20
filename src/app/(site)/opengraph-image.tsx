import { ImageResponse } from "next/og";
import { MARK_BOX, MARK_CORNER } from "@/components/brand-paths";
import { getProfile } from "@/lib/content";

// The picture chat apps and social sites show for a shared link: the brand
// mark on the night sky. Latin text only: the image renderer has no CJK
// font, and fetching one at build time is what broke builds before.
export const alt = "Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const latin = (s?: string | null) => (s && /^[\x20-\x7EÀ-ɏ]+$/.test(s) ? s : "");

export default async function Image() {
  const profile = await getProfile();
  const name = latin(profile.name);
  const role = latin(profile.title.en) || "Interaction designer";
  // a fixed scatter of stars (no randomness: the image is built once)
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 337) % 1200,
    y: (i * 211 + (i % 7) * 53) % 630,
    r: i % 9 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
    o: 0.25 + ((i * 37) % 60) / 100,
  }));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "radial-gradient(ellipse at 30% 20%, #1b2034 0%, #0a0c14 55%, #05060a 100%)",
          color: "#eceef6",
          fontFamily: "sans-serif",
        }}
      >
        {stars.map((s, i) => (
          <div
            key={i}
            style={{ position: "absolute", left: s.x, top: s.y, width: s.r, height: s.r, borderRadius: 9, background: "#fff", opacity: s.o }}
          />
        ))}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 96px", gap: 28 }}>
          <svg width="150" height="150" viewBox="0 0 388 388" fill="#eceef6">
            <path d={MARK_CORNER} />
            <path d={MARK_BOX} fillRule="evenodd" clipRule="evenodd" />
          </svg>
          {name ? <div style={{ fontSize: 84, fontWeight: 300, letterSpacing: -1 }}>{name}</div> : null}
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 10, opacity: 0.72 }}>{`${role.toUpperCase()} · PORTFOLIO`}</div>
        </div>
      </div>
    ),
    size,
  );
}
