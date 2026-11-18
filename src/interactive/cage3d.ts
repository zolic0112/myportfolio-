// The cage as a real 3D object, projected by hand into the two SVG layers.
//
// It is a surface of revolution: a cylinder with a dome on top, standing on a
// round plinth, seen from slightly above. Bars are meridians, hoops are
// parallels, and the door is a patch of the cylinder hinged on its left edge.
// Every point lives in 3D (X right, Y down the page, Z toward the viewer) and
// projects as  screen = (CX + X, Y + TILT * Z):  orthographic, with the
// vertical squash of a camera looking down a little. Bars facing away go to
// the back layer (behind the dog), the rest to the front layer.
//
// The whole cage turns about its axis: a slow idle sway, a lean toward the
// pointer, and a kick when the dog bumps into the bars. One loop drives both
// layers by writing path data straight into the DOM (no React re-renders).
// No WebGL: twenty-odd paths, a few hundred points, well under a millisecond.

export const CX = 60;
export const R = 44; // cylinder radius
export const BASE_Y = 132; // floor of the cage (top of the plinth)
export const SHOULDER_Y = 62; // where the cylinder meets the dome
export const DOME_H = 40; // dome height above the shoulder
export const TILT = 0.2; // vertical squash of horizontal circles
export const PLINTH_R = 49;
export const PLINTH_H = 10;

const N = 16; // bars around
const STEP = (Math.PI * 2) / N;
const DOOR_A = STEP * 0.92; // half-width of the door, just inside its two side bars
const DOOR_TOP = 72;
const DOOR_BOT = 127;
const HOOPS = [
  { y: 129.5, cut: false, w: 1.15 },
  { y: 99, cut: true, w: 0.75 }, // crosses the doorway: open there
  { y: SHOULDER_Y, cut: false, w: 1.3 },
];
const DOME_HOOP_PHI = 0.95; // a parallel up on the dome

type P = [number, number]; // screen point
type V = { x: number; y: number; z: number };

const proj = (v: V): P => [CX + v.x, v.y + TILT * v.z];
const pathOf = (pts: P[]) => (pts.length < 2 ? "" : "M" + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L"));

/** Point on the cage surface at angle th (0 = facing the viewer) and height y. */
function surf(th: number, y: number): V {
  return { x: R * Math.sin(th), y, z: R * Math.cos(th) };
}
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** The cage silhouette (static), for fills and the glass. */
export const SILHOUETTE = `M${CX - R},${SHOULDER_Y} A${R},${DOME_H} 0 0 1 ${CX + R},${SHOULDER_Y} L${CX + R},${BASE_Y} A${R},${R * TILT} 0 0 1 ${CX - R},${BASE_Y} Z`;
/** The back half of the floor ellipse plus the silhouette: the interior. */
export const INTERIOR = `M${CX - R},${SHOULDER_Y} A${R},${DOME_H} 0 0 1 ${CX + R},${SHOULDER_Y} L${CX + R},${BASE_Y} A${R},${R * TILT} 0 0 0 ${CX - R},${BASE_Y} Z`;

export type Layer = {
  bars: SVGPathElement[]; // one per bar
  hoops: SVGPathElement[]; // one per hoop (+1 for the dome hoop)
  hl?: SVGPathElement[]; // highlight copies of the bars (brain rot toon shading)
  door?: { frame: SVGPathElement; bars: SVGPathElement; latch: SVGPathElement };
};

class Rig {
  back: Layer | null = null;
  front: Layer | null = null;
  host: HTMLElement | null = null;
  // turn about the axis (radians): spring toward a target
  beta = 0;
  vb = 0;
  // door swing (radians, 0 = shut)
  psi = 0;
  vpsi = 0;
  slide = 0;
  ptr = { x: 0, y: 0, seen: false };
  raf = 0;
  last = 0;
  lastDraw = 0;
  reduce = false;
  users = 0;

  start() {
    if (++this.users > 1) return;
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    addEventListener("pointermove", this.onPtr, { passive: true });
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() {
    if (--this.users > 0) return;
    removeEventListener("pointermove", this.onPtr);
    cancelAnimationFrame(this.raf);
  }
  onPtr = (e: PointerEvent) => {
    this.ptr.x = e.clientX;
    this.ptr.y = e.clientY;
    this.ptr.seen = e.pointerType === "mouse";
  };
  /** The dog hit the bars: the cage rocks. */
  kick(dir: number) {
    this.vb += 2.2 * (dir || 1);
  }

  frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const host = this.host;
    if (!host || !this.front || !this.back) return;

    // where it wants to face
    let target = this.reduce ? 0 : 0.1 * Math.sin(now / 1000 * 0.55) + 0.04 * Math.sin(now / 1000 * 1.3);
    if (this.ptr.seen && !this.reduce) {
      const r = host.getBoundingClientRect();
      const dx = this.ptr.x - (r.left + r.width / 2);
      const dy = this.ptr.y - (r.top + r.height / 2);
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 420);
      target += near * Math.max(-1, Math.min(1, dx / 260)) * 0.45;
    }
    const open = host.dataset.open === "1" || host.dataset.magnet === "1";
    const psiT = open ? 1.75 : 0;
    // springs (semi-implicit Euler)
    this.vb += ((target - this.beta) * 38 - this.vb * 7) * dt;
    this.beta += this.vb * dt;
    this.vpsi += ((psiT - this.psi) * (open ? 90 : 160) - this.vpsi * (open ? 9 : 16)) * dt;
    this.psi += this.vpsi * dt;
    if (this.reduce) {
      this.beta = target;
      this.psi = psiT;
    }
    // idle frames at ~30fps; while something swings, every frame
    const busy = Math.abs(this.vb) > 0.05 || Math.abs(this.vpsi) > 0.02;
    if (!busy && now - this.lastDraw < 32) return;
    this.lastDraw = now;
    this.draw();
  };

  draw() {
    const { back, front } = this;
    if (!back || !front) return;
    const b = this.beta;
    const cosOk = (th: number) => Math.cos(th) >= 0;

    // ---- bars (meridians)
    for (let i = 0; i < N; i++) {
      const th = wrap(i * STEP + b);
      const inDoor = Math.abs(wrap(i * STEP)) < DOOR_A + 0.01; // the bar the door replaces
      const pts: P[] = [];
      const yFrom = inDoor ? DOOR_TOP : BASE_Y;
      pts.push(proj(surf(th, yFrom)));
      pts.push(proj(surf(th, SHOULDER_Y)));
      for (let k = 1; k <= 8; k++) {
        const phi = (k / 8) * (Math.PI / 2);
        const r = R * Math.cos(phi);
        pts.push(proj({ x: r * Math.sin(th), y: SHOULDER_Y - DOME_H * Math.sin(phi), z: r * Math.cos(th) }));
      }
      const d = pathOf(pts);
      const isFront = cosOk(th);
      const depth = Math.cos(th); // -1 back … 1 front
      front.bars[i].setAttribute("d", isFront ? d : "");
      back.bars[i].setAttribute("d", isFront ? "" : d);
      const el = isFront ? front.bars[i] : back.bars[i];
      el.style.setProperty("--d", depth.toFixed(3));
      if (front.hl) front.hl[i].setAttribute("d", isFront ? d : "");
    }

    // ---- hoops (parallels): split into front and back runs
    const hoopRuns = (ring: (th: number) => V, cut: boolean) => {
      const f: P[][] = [];
      const k: P[][] = [];
      let cur: P[] = [];
      let curFront: boolean | null = null;
      const S = 72;
      for (let j = 0; j <= S; j++) {
        const local = -Math.PI + (j / S) * Math.PI * 2; // around the cage, in cage space
        const th = local + b;
        const gap = cut && Math.abs(local) < DOOR_A;
        const isF = Math.cos(th) >= 0;
        if (gap || isF !== curFront) {
          if (cur.length > 1) (curFront ? f : k).push(cur);
          cur = [];
          curFront = isF;
          if (gap) {
            curFront = null;
            continue;
          }
        }
        cur.push(proj(ring(th)));
      }
      if (cur.length > 1 && curFront !== null) (curFront ? f : k).push(cur);
      return { f: f.map(pathOf).join(""), k: k.map(pathOf).join("") };
    };
    HOOPS.forEach((h, i) => {
      const { f, k } = hoopRuns((th) => surf(th, h.y), h.cut);
      front.hoops[i].setAttribute("d", f);
      back.hoops[i].setAttribute("d", k);
    });
    {
      const r = R * Math.cos(DOME_HOOP_PHI);
      const y = SHOULDER_Y - DOME_H * Math.sin(DOME_HOOP_PHI);
      const { f, k } = hoopRuns((th) => ({ x: r * Math.sin(th), y, z: r * Math.cos(th) }), false);
      front.hoops[HOOPS.length].setAttribute("d", f);
      back.hoops[HOOPS.length].setAttribute("d", k);
    }

    // ---- door: a patch of the cylinder, hinged on its left edge
    if (front.door) {
      const hinge = surf(-DOOR_A + b, 0);
      const c = Math.cos(this.psi);
      const s = Math.sin(this.psi);
      const swing = (v: V): V => {
        const dx = v.x - hinge.x;
        const dz = v.z - hinge.z;
        return { x: hinge.x + dx * c - dz * s, y: v.y, z: hinge.z + dx * s + dz * c };
      };
      const at = (t: number, y: number) => proj(swing(surf(-DOOR_A + t * 2 * DOOR_A + b, y)));
      const arc = (y: number) => Array.from({ length: 9 }, (_, j) => at(j / 8, y));
      const frame =
        pathOf([at(0, DOOR_BOT), ...arc(DOOR_TOP), at(1, DOOR_BOT)]) +
        pathOf(arc(DOOR_BOT)) +
        pathOf(arc(99));
      front.door.frame.setAttribute("d", frame);
      front.door.bars.setAttribute(
        "d",
        [0.25, 0.5, 0.75].map((t) => pathOf([at(t, DOOR_TOP), at(t, DOOR_BOT)])).join(""),
      );
      // the latch: a small block on the free edge, slid back while dragged
      const l = (u: number, y: number) => {
        const p = at(1, y);
        return [p[0] - 2 - this.slide + u, p[1]] as P;
      };
      front.door.latch.setAttribute("d", pathOf([l(-1, 97), l(6, 97), l(6, 101), l(-1, 101)]) + "Z");
    }
  }
}

export const rig = new Rig();