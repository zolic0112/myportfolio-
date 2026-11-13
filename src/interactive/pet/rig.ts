// Space Dog rig data. Pivots, parents and paths come straight from
// docs/handoff/character/space-dog-parts.svg (420×500 units).

export const DK = "#1F1B33";
export const PU = "#7C63DB";
export const OR = "#FFA033";
export const PAL: [number, number, number][] = [DK, PU, OR].map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);
export const RIM_PX: [number, number, number] = [104, 92, 190];

/** Rig anchor (between the eyes, top of head): the dog rotates around it when held. */
export const G: [number, number] = [231, 120];
/** Bottom-centre of the feet: what stands on surfaces. */
export const FEET: [number, number] = [231, 488];
export const FOOT_DROP = FEET[1] - G[1];

export type PartId =
  | "body" | "head" | "crest" | "ear" | "cheekL" | "cheekR"
  | "eyeL" | "eyeR" | "armL" | "armR" | "legL" | "legR";

export const parts: Record<PartId, { p: PartId | null; pv: [number, number] }> = {
  body: { p: null, pv: [231, 426] },
  head: { p: "body", pv: [231, 298] },
  crest: { p: "head", pv: [210, 128] },
  ear: { p: "head", pv: [312, 150] },
  cheekL: { p: "head", pv: [170, 262] },
  cheekR: { p: "head", pv: [292, 262] },
  eyeL: { p: "head", pv: [197, 212] },
  eyeR: { p: "head", pv: [265, 212] },
  armL: { p: "body", pv: [188, 332] },
  armR: { p: "body", pv: [274, 332] },
  legL: { p: null, pv: [198, 418] },
  legR: { p: null, pv: [264, 418] },
};

export const chainOrder: PartId[] = [
  "body", "head", "crest", "ear", "cheekL", "cheekR", "eyeL", "eyeR", "armL", "armR", "legL", "legR",
];
export const drawOrder: PartId[] = [
  "ear", "legL", "legR", "body", "armL", "armR", "head", "cheekL", "cheekR", "eyeL", "eyeR", "crest",
];

/** Tail beads in body space: x, y, radius (further from the body = bigger). */
export const BEADS: [number, number, number][] = [
  [146, 424, 17],
  [112, 394, 19],
  [72, 358, 22],
];

const D = {
  ear: "M304,160 C302,128 318,100 344,82 C358,74 370,86 366,100 C358,126 342,146 324,162 Z",
  legL: "M188,404 h20 a8,8 0 0 1 8,8 v68 a8,8 0 0 1 -8,8 h-20 a8,8 0 0 1 -8,-8 v-68 a8,8 0 0 1 8,-8 Z",
  footL: "M100,484 C100,456 120,440 144,440 C170,440 190,456 190,484 Z",
  legR: "M254,404 h20 a8,8 0 0 1 8,8 v68 a8,8 0 0 1 -8,8 h-20 a8,8 0 0 1 -8,-8 v-68 a8,8 0 0 1 8,-8 Z",
  footR: "M362,484 C362,456 342,440 318,440 C292,440 272,456 272,484 Z",
  torso: "M200,296 C182,312 172,336 172,366 C172,398 186,424 204,430 L258,430 C276,424 290,398 290,366 C290,336 280,312 262,296 Z",
  belly: "M231,322 C244,340 260,360 260,382 C260,400 247,410 231,410 C215,410 202,400 202,382 C202,360 218,340 231,322 Z",
  armL: "M190,326 C174,330 158,352 152,376 C148,392 158,402 170,400 C182,398 190,384 194,366 C198,350 198,336 190,326 Z",
  armR: "M272,326 C288,330 304,352 310,376 C314,392 304,402 292,400 C280,398 272,384 268,366 C264,350 264,336 272,326 Z",
  head: "M128,208 C128,142 172,112 231,112 C290,112 334,142 334,208 C334,266 296,302 231,302 C166,302 128,266 128,208 Z",
  browL: "M204,144 Q172,148 164,180",
  browR: "M258,144 Q290,148 298,180",
  cheekL: "M150,218 C142,240 124,252 104,260 C102,274 122,284 144,288 C164,292 182,292 194,286 C172,272 158,250 150,218 Z",
  cheekR: "M312,218 C320,240 338,252 358,260 C360,274 340,284 318,288 C298,292 280,292 268,286 C290,272 304,250 312,218 Z",
  crest: "M30,66 C52,38 96,12 140,10 C178,8 202,32 222,58 C242,86 256,106 268,130 C240,122 200,122 178,128 C172,142 166,156 154,164 C146,160 142,152 140,144 C132,124 116,108 92,98 C68,90 46,84 32,76 C28,73 28,69 30,66 Z",
  blade: "M42,66 C66,42 104,22 138,20 C158,48 172,86 168,120 C166,136 160,148 154,154 C144,124 128,102 104,90 C82,82 60,76 42,66 Z",
  sweat: "M0,-14 C5,-6 8,-1 8,4 C8,9 4,12 0,12 C-4,12 -8,9 -8,4 C-8,-1 -5,-6 0,-14 Z",
};

export type Paths = Record<keyof typeof D, Path2D>;

// Path2D only exists in the browser, so build lazily (the component still
// renders once on the server).
let cache: Paths | null = null;
export function getPaths(): Paths {
  if (!cache) {
    cache = Object.fromEntries(
      Object.entries(D).map(([k, d]) => [k, new Path2D(d)]),
    ) as Paths;
  }
  return cache;
}
