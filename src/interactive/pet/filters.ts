// Pixel-filter passes from the prototype. All operate in place on RGBA data
// of the low-resolution buffer (one texel = one on-screen "pixel" cell).
import { PAL, RIM_PX } from "./rig";

/** Alpha threshold + 3-colour palette, plus a 1-texel rim so the dark body reads on dark backgrounds. */
export function quantize(d: Uint8ClampedArray, w: number, h: number, rim: boolean) {
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) {
      d[i + 3] = 0;
      continue;
    }
    d[i + 3] = 255;
    let best = 0;
    let bd = 1e9;
    for (let p = 0; p < 3; p++) {
      const c = PAL[p];
      const e = (d[i] - c[0]) ** 2 + (d[i + 1] - c[1]) ** 2 + (d[i + 2] - c[2]) ** 2;
      if (e < bd) {
        bd = e;
        best = p;
      }
    }
    d[i] = PAL[best][0];
    d[i + 1] = PAL[best][1];
    d[i + 2] = PAL[best][2];
  }
  if (!rim) return;
  const a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] && d[i * 4] !== PAL[2][0] ? 1 : 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const j = y * w + x;
      if (d[j * 4 + 3]) continue;
      if ((x > 0 && a[j - 1]) || (x < w - 1 && a[j + 1]) || (y > 0 && a[j - w]) || (y < h - 1 && a[j + w])) {
        const i = j * 4;
        d[i] = RIM_PX[0];
        d[i + 1] = RIM_PX[1];
        d[i + 2] = RIM_PX[2];
        d[i + 3] = 255;
      }
    }
}

export function fried(d: Uint8ClampedArray, w: number, h: number) {
  const bl: Record<string, number[]> = {};
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!d[i + 3]) continue;
      const key = (x >> 2) + "," + (y >> 2);
      const b = bl[key] || (bl[key] = [0, 0, 0].map(() => (Math.random() - 0.5) * 70));
      const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
      for (let c = 0; c < 3; c++) {
        let v = avg + (d[i + c] - avg) * 2.4;
        v = (v - 128) * 1.5 + 128 + b[c] + (Math.random() - 0.5) * 60;
        d[i + c] = Math.round(Math.max(0, Math.min(255, v)) / 64) * 64;
      }
    }
}

export function split(d: Uint8ClampedArray, w: number, h: number) {
  const s = d.slice();
  const sh = Math.random() < 0.4 ? 2 : 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const l = (y * w + Math.max(0, x - sh)) * 4;
      const r = (y * w + Math.min(w - 1, x + sh)) * 4;
      d[i] = s[l];
      d[i + 2] = s[r + 2];
      d[i + 3] = Math.max(s[i + 3], s[l + 3], s[r + 3]);
      if (!s[i + 3]) d[i + 1] = 0;
    }
}

export function slices(d: Uint8ClampedArray, w: number, h: number) {
  const s = d.slice();
  let y = 0;
  while (y < h) {
    const band = 2 + ((Math.random() * 8) | 0);
    const o = Math.random() < 0.5 ? 0 : ((Math.random() * 9) | 0) - 4;
    for (let yy = y; yy < Math.min(h, y + band); yy++)
      for (let x = 0; x < w; x++) {
        const sx = x - o;
        const i = (yy * w + x) * 4;
        if (sx < 0 || sx >= w) {
          d[i + 3] = 0;
          continue;
        }
        const j = (yy * w + sx) * 4;
        d[i] = s[j];
        d[i + 1] = s[j + 1];
        d[i + 2] = s[j + 2];
        d[i + 3] = s[j + 3];
      }
    y += band;
  }
}

export function invert(d: Uint8ClampedArray) {
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
}

export type Fx = "pixel" | "fried" | "split" | "slices" | "crunch" | "smooth" | "invert";

// Virus mode: weighted random visual state + how long it lasts (ms).
const POOL: [Fx, number, number, number][] = [
  ["pixel", 6, 1200, 3400],
  ["fried", 2, 400, 1500],
  ["split", 2, 150, 600],
  ["slices", 2, 100, 380],
  ["crunch", 1, 200, 600],
  ["smooth", 1, 80, 240],
  ["invert", 1, 60, 150],
];

export function pickFx(current: Fx): { fx: Fx; ms: number } {
  let r = Math.random() * POOL.reduce((s, p) => s + p[1], 0);
  let p = POOL[0];
  for (const q of POOL) {
    if ((r -= q[1]) <= 0) {
      p = q;
      break;
    }
  }
  if (p[0] === current && p[0] !== "pixel") p = POOL[0];
  return { fx: p[0], ms: p[2] + Math.random() * (p[3] - p[2]) };
}

export function applyFx(fx: Fx, d: Uint8ClampedArray, w: number, h: number) {
  if (fx === "fried") fried(d, w, h);
  else if (fx === "split") split(d, w, h);
  else if (fx === "slices") slices(d, w, h);
  else if (fx === "invert") invert(d);
}
