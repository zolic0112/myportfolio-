// Space Dog runtime: physics, behaviour, pose and rendering for the whole
// page. Ported from docs/handoff/prototypes/space-dog-rig.html, with the stage
// replaced by the viewport: the dog lives in viewport (position: fixed)
// coordinates, stands on the floor or on any element marked [data-perch]
// (work cards, popup title bars), and goes in and out of the corner cage.
//
// Rendering uses one small canvas that follows the dog via a CSS transform,
// so the page never pays for a full-screen canvas.

import { applyFx, pickFx, quantize, type Fx } from "./filters";
import {
  BEADS, DK, FEET, FOOT_DROP, G, OR, PU,
  chainOrder, drawOrder, getPaths, parts, type PartId,
} from "./rig";

export type Persona = "cool" | "rot";

export type EngineCallbacks = {
  /** Dog hit the cage bars from inside. */
  onBump: () => void;
  /** Visitor tried to grab a dog that still has stamina. */
  onDodge: () => void;
  onLand: (hard: boolean) => void;
  /** Visitor let go of the dog close enough to the cage: start the rot → cool switch. */
  onCaptured: () => void;
  onGrab: (grabbing: boolean) => void;
  /** Dog made a noise on its own: a bark while roaming, a whine when worn out. */
  onVoice: (kind: "bark" | "whine") => void;
};

type Mode = "caged" | "free" | "sucking";
type AirKind = "hop" | "jump" | "fall";
type Surface = { el: Element | "floor"; top: number; left: number; right: number };
type Pose = { r: number; x: number; y: number; sx: number; sy: number };

const GRAV = 2300;
/** Canvas box size in rig units, and its centre relative to G (rig units). */
const BOX = 800;
const BOX_OFF: [number, number] = [-20, 150];
/** Dog hit box in rig units (x0, y0, x1, y1). */
const HIT: [number, number, number, number] = [110, 10, 350, 488];
const NAV_H = 72;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class SpaceDogEngine {
  private ctx: CanvasRenderingContext2D;
  private off = document.createElement("canvas");
  private octx = this.off.getContext("2d")!;
  private buf = document.createElement("canvas");
  private bctx = this.buf.getContext("2d", { willReadFrequently: true })!;
  private paths = getPaths();
  private raf = 0;
  private last = performance.now();
  private DPR = 1;
  private size = 0;
  private reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private coarse = matchMedia("(pointer: coarse)").matches;

  private mode: Mode = "caged";
  private persona: Persona = "cool";

  // body state (x, y = rig anchor G in viewport px)
  private x = -999;
  private y = -999;
  private vx = 0;
  private vy = 0;
  private S = 0.1;
  private airborne = false;
  private air: AirKind = "fall";
  private airT = 0;
  private airDur = 0.3;
  private surface: Element | "floor" | null = null;
  private wanderTarget: number | null = null;
  private wait = 1;
  private th = 0; private thv = 0;
  private q = 0; private qv = 0;
  private cr = 0; private crv = 0;
  private er = 0; private erv = 0;
  private pvx = 0;
  private beads: { x: number; y: number }[] | null = null;
  private pose = {} as Record<PartId, Pose>;
  private world = {} as Record<PartId, DOMMatrix>;

  // chase
  private grab = false;
  private gdx = 0;
  private gdy = 0;
  private stamina = 1;
  private tired = false;
  private fleeing = false;
  private magnet = false;
  /** 0 = standing, 1 = sitting down (eased). Sits when it rests on a perch. */
  private sit = 0;
  private sitting = false;
  private nextBark = 6;
  /** Mouth-open amount while barking, decays to 0. */
  private yap = 0;

  // cage
  private idle = 0;
  private lookCageUntil = 0;
  private nextLookCage = 6;
  private suck = { t: 0, x: 0, y: 0, s: 0 };

  // pointer (viewport px)
  private ptr = { x: -9999, y: -9999, mouse: false, seen: false };
  /** Until when (performance.now ms) a chase is on: text selection is held off. */
  private chaseUntil = 0;

  // surfaces
  private perches: Element[] = [];
  private perchAt = 0;

  // rendering / virus mode
  private fx: Fx = "pixel";
  private fxUntil = 0;
  private trans: { steps: number[]; i: number; at: number; fx: Fx; done: () => void } | null = null;
  private lastFi = -1;
  private time = 0;

  constructor(
    private cv: HTMLCanvasElement,
    private hit: HTMLElement,
    private getCage: () => HTMLElement | null,
    private cb: EngineCallbacks,
  ) {
    this.ctx = cv.getContext("2d")!;
    for (const k of chainOrder) this.pose[k] = { r: 0, x: 0, y: 0, sx: 1, sy: 1 };
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onAnyDown, { capture: true, passive: true });
    document.addEventListener("selectstart", this.onSelectStart, { capture: true });
    hit.addEventListener("contextmenu", this.onContextMenu);
    hit.addEventListener("pointerdown", this.onHitDown);
    hit.addEventListener("pointermove", this.onHitMove);
    hit.addEventListener("pointerup", this.onHitUp);
    hit.addEventListener("pointercancel", this.onHitUp);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerdown", this.onMove);
    window.removeEventListener("pointerdown", this.onAnyDown, { capture: true });
    document.removeEventListener("selectstart", this.onSelectStart, { capture: true });
    this.hit.removeEventListener("contextmenu", this.onContextMenu);
    this.hit.removeEventListener("pointerdown", this.onHitDown);
    this.hit.removeEventListener("pointermove", this.onHitMove);
    this.hit.removeEventListener("pointerup", this.onHitUp);
    this.hit.removeEventListener("pointercancel", this.onHitUp);
  }

  // ---------------------------------------------------------------- public

  setPersona(p: Persona) {
    if (p === this.persona && !this.trans) return;
    if (this.reduce) {
      this.persona = p;
      this.fx = "pixel";
      return;
    }
    const now = performance.now();
    this.trans =
      p === "rot"
        ? { steps: [2, 3, 4], i: 0, at: now, fx: "fried", done: () => { this.persona = "rot"; this.fx = "pixel"; this.fxUntil = performance.now() + 1500; } }
        : { steps: [4, 3, 2], i: 0, at: now, fx: "pixel", done: () => { this.persona = "cool"; } };
  }

  /** Cage door opened: the dog bursts out toward the middle of the page. */
  launch() {
    if (this.mode !== "caged") return;
    this.mode = "free";
    this.airborne = true;
    this.air = "jump";
    this.surface = null;
    const toLeft = this.x > innerWidth / 2;
    this.vx = (toLeft ? -1 : 1) * rand(380, 620);
    this.vy = this.reduce ? -300 : -1250;
    if (!this.reduce) {
      // Burst out: stretch tall and tumble once on the way up.
      this.qv -= 7;
      this.thv += (toLeft ? -1 : 1) * 14;
    }
    this.stamina = 1;
    this.tired = false;
    this.hit.style.pointerEvents = "auto";
  }

  /** Keyboard path back to the cage (the chase needs a pointer). */
  recall() {
    if (this.mode !== "free") return;
    this.grab = false;
    this.startSuck();
  }

  // ---------------------------------------------------------------- input

  private resize = () => {
    this.DPR = clamp(window.devicePixelRatio || 1, 1, 2);
    this.coarse = matchMedia("(pointer: coarse)").matches;
    this.size = Math.ceil(BOX * this.freeScale());
    const px = Math.round(this.size * this.DPR);
    this.cv.width = this.off.width = px;
    this.cv.height = this.off.height = px;
    this.cv.style.width = this.cv.style.height = this.size + "px";
  };

  private freeScale() {
    return innerWidth < 640 ? 0.19 : 0.26;
  }

  private onMove = (e: PointerEvent) => {
    this.ptr.x = e.clientX;
    this.ptr.y = e.clientY;
    this.ptr.mouse = e.pointerType === "mouse";
    this.ptr.seen = true;
  };

  // Chasing means clicking fast where the dog is (or just was): double and
  // triple clicks and press-drags would select the text underneath. A press
  // near a free dog starts a short "chase window" in which selection is held
  // off; the window keeps renewing while you keep after it.
  private onAnyDown = (e: PointerEvent) => {
    if (this.mode !== "free") return;
    if (this.grab || Math.hypot(e.clientX - this.x, e.clientY - this.y) < 170) this.startChase();
  };

  private startChase() {
    this.chaseUntil = performance.now() + 1400;
    const sel = getSelection();
    if (sel && !sel.isCollapsed) sel.removeAllRanges();
  }

  private onSelectStart = (e: Event) => {
    if (this.grab || performance.now() < this.chaseUntil) e.preventDefault();
  };

  /** Long-press on a phone would open the image / copy menu. */
  private onContextMenu = (e: Event) => e.preventDefault();

  private onHitDown = (e: PointerEvent) => {
    if (this.mode !== "free" || this.grab) return;
    e.preventDefault();
    e.stopPropagation();
    this.onMove(e);
    this.startChase();
    if (!this.tired && !this.reduce) {
      this.dodge();
      return;
    }
    this.grab = true;
    this.setBehind(false);
    this.airborne = false;
    this.surface = null;
    this.wanderTarget = null;
    this.gdx = this.x - e.clientX;
    this.gdy = this.y - e.clientY;
    this.hit.setPointerCapture(e.pointerId);
    this.cb.onGrab(true);
  };

  private onHitMove = (e: PointerEvent) => {
    if (this.grab) this.onMove(e);
  };

  private onHitUp = () => {
    if (!this.grab) return;
    this.grab = false;
    this.cb.onGrab(false);
    if (this.magnet) {
      this.startSuck();
      return;
    }
    // Dropped mid-chase: falls, bounces, and is still tired enough to grab again.
    this.airborne = true;
    this.air = "fall";
    this.vx = clamp(this.pvx * 0.5, -900, 900);
    this.vy = -120;
    this.stamina = Math.min(this.stamina, 0.3);
    this.tired = true;
  };

  private dodge() {
    this.stamina -= this.coarse ? 0.26 : 0.15;
    if (this.stamina < 0.2) this.tired = true;
    const dir = Math.sign(this.x - this.ptr.x) || (Math.random() < 0.5 ? -1 : 1);
    this.jumpFlat(this.edgeSafeDir(dir), 420, 620, "jump");
    this.cb.onDodge();
  }

  // ---------------------------------------------------------------- surfaces

  private visibleSurfaces(): Surface[] {
    if (this.time > this.perchAt) {
      this.perches = Array.from(document.querySelectorAll("[data-perch]"));
      this.perchAt = this.time + 0.5;
    }
    const out: Surface[] = [{ el: "floor", top: innerHeight - 4, left: 0, right: innerWidth }];
    for (const el of this.perches) {
      const s = this.surfaceOf(el);
      if (s) out.push(s);
    }
    return out;
  }

  private surfaceOf(el: Element | "floor"): Surface | null {
    if (el === "floor") return { el, top: innerHeight - 4, left: 0, right: innerWidth };
    if (!el.isConnected) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 90 || r.top < NAV_H || r.top > innerHeight - 30) return null;
    return { el, top: r.top, left: Math.max(0, r.left), right: Math.min(innerWidth, r.right) };
  }

  private halfW() {
    return 105 * this.S;
  }

  private edgeSafeDir(dir: number) {
    const m = 90;
    if (dir < 0 && this.x < m) return 1;
    if (dir > 0 && this.x > innerWidth - m) return -1;
    return dir;
  }

  private jumpFlat(dir: number, speed: number, height: number, kind: AirKind) {
    this.airborne = true;
    this.air = kind;
    this.airT = 0;
    this.airDur = (2 * height) / GRAV;
    this.vx = dir * speed;
    this.vy = -height;
    this.surface = null;
  }

  /** Ballistic jump onto another surface. Returns false if it is too high. */
  private jumpTo(s: Surface, tx: number) {
    const feet = this.y + FOOT_DROP * this.S;
    const T = 0.45 + Math.abs(tx - this.x) / 1600;
    const vy = (s.top - feet - 0.5 * GRAV * T * T) / T;
    if (vy < -1500) return false;
    this.airborne = true;
    this.air = "jump";
    this.airT = 0;
    this.airDur = T;
    this.vx = (tx - this.x) / T;
    this.vy = vy;
    this.surface = null;
    // Sometimes it ducks *behind* the page on the way, so you only glimpse it
    // through the gaps between cards before it pops out on the next one.
    this.setBehind(!this.fleeing && Math.random() < 0.35);
    return true;
  }

  private pickOtherSurface(side = 0) {
    const all = this.visibleSurfaces().filter((s) => s.el !== this.surface && s.right - s.left > 120);
    const cands = side === 0 ? all : all.filter((s) => Math.sign((s.left + s.right) / 2 - this.x) === side);
    if (!cands.length) return false;
    const s = cands[(Math.random() * cands.length) | 0];
    const hw = this.halfW();
    return this.jumpTo(s, rand(s.left + hw, Math.max(s.left + hw, s.right - hw)));
  }

  // ---------------------------------------------------------------- update

  private frame = (now: number) => {
    const dt = clamp((now - this.last) / 1000, 0.001, 0.033);
    this.last = now;
    this.time += dt;
    const t = this.reduce ? 0 : this.time;

    const cage = this.getCage()?.getBoundingClientRect() ?? null;
    if (this.mode === "caged") this.updateCaged(dt, cage);
    else if (this.mode === "sucking") this.updateSuck(dt, cage);
    else this.updateFree(dt);

    this.updateSprings(dt);
    this.updatePose(t, cage);
    this.render(now, t);
    this.raf = requestAnimationFrame(this.frame);
  };

  private cageGeom(r: DOMRect) {
    const S = (r.height * 0.6) / (FEET[1] - 10);
    return {
      S,
      floor: r.bottom - r.height * 0.11,
      left: r.left + r.width * 0.27,
      right: r.right - r.width * 0.27,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
    };
  }

  private updateCaged(dt: number, r: DOMRect | null) {
    if (!r) return;
    const g = this.cageGeom(r);
    this.S = g.S;
    if (this.x < -900) {
      this.x = g.cx;
      this.y = g.floor - FOOT_DROP * g.S;
    }
    // Restlessness grows the longer nobody comes near the cage.
    const near = this.ptr.seen && Math.hypot(this.ptr.x - g.cx, this.ptr.y - g.cy) < 160;
    this.idle = near ? Math.max(0, this.idle - dt * 4) : this.idle + dt;
    const restless = Math.min(1, this.idle / 35);

    if (this.airborne) {
      this.vy += GRAV * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.airT += dt;
      if (this.x < g.left || this.x > g.right) {
        if (Math.abs(this.vx) > 120) this.cb.onBump();
        this.x = clamp(this.x, g.left, g.right);
        this.vx = -this.vx * 0.3;
        this.thv += this.vx * 0.01;
      }
      if (this.y + FOOT_DROP * g.S >= g.floor) {
        this.y = g.floor - FOOT_DROP * g.S;
        this.qv += Math.min(this.vy, 900) * 0.0035;
        this.airborne = false;
        this.vx = this.vy = 0;
      }
      return;
    }
    this.y = g.floor - FOOT_DROP * g.S;
    this.x = clamp(this.x, g.left, g.right);
    if (this.reduce) return;
    this.wait -= dt;
    if (this.wait <= 0) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (Math.random() < 0.12 + 0.45 * restless) this.jumpFlat(dir, 260 + 260 * restless, 200, "hop");
      else this.jumpFlat(dir, 50, 110, "hop");
      this.wait = lerp(3.8, 1.1, restless) * rand(0.6, 1.4);
    }
  }

  private updateSuck(dt: number, r: DOMRect | null) {
    if (!r) return;
    const g = this.cageGeom(r);
    this.suck.t = Math.min(1, this.suck.t + dt / 0.38);
    const k = 1 - (1 - this.suck.t) ** 3;
    this.x = lerp(this.suck.x, g.cx, k);
    this.y = lerp(this.suck.y, g.floor - FOOT_DROP * g.S, k);
    this.S = lerp(this.suck.s, g.S, k);
    this.thv += 40 * dt;
    if (this.suck.t >= 1) {
      this.mode = "caged";
      this.airborne = false;
      this.vx = this.vy = 0;
      this.idle = 0;
      this.wait = 1.5;
    }
  }

  private startSuck() {
    this.mode = "sucking";
    this.setBehind(false);
    this.suck = { t: 0, x: this.x, y: this.y, s: this.S };
    this.setMagnet(false);
    this.hit.style.pointerEvents = "none";
    this.cb.onCaptured();
  }

  private behind = false;
  private setBehind(on: boolean) {
    if (on === this.behind) return;
    this.behind = on;
    this.cv.style.zIndex = on ? "-1" : "";
  }

  private setMagnet(on: boolean) {
    if (on === this.magnet) return;
    this.magnet = on;
    const cage = this.getCage();
    if (cage) cage.dataset.magnet = on ? "1" : "";
  }

  private updateFree(dt: number) {
    const target = this.freeScale();
    this.S += (target - this.S) * Math.min(1, dt * 6);
    const hw = this.halfW();
    const prevX = this.x;

    if (this.grab) {
      this.x += (this.ptr.x + this.gdx - this.x) * Math.min(1, dt * 28);
      this.y += (this.ptr.y + this.gdy - this.y) * Math.min(1, dt * 28);
      const cage = this.getCage()?.getBoundingClientRect();
      if (cage) {
        const cx = cage.left + cage.width / 2;
        const cy = cage.top + cage.height / 2;
        const d = Math.hypot(cx - this.x, cy - (this.y + 160 * this.S));
        this.setMagnet(d < Math.max(130, cage.width * 1.3));
      }
    } else if (this.airborne) {
      const prevFeet = this.y + FOOT_DROP * this.S;
      this.vy += GRAV * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.airT += dt;
      if (this.x < hw || this.x > innerWidth - hw) {
        this.x = clamp(this.x, hw, innerWidth - hw);
        this.vx = -this.vx * 0.4;
      }
      const feet = this.y + FOOT_DROP * this.S;
      if (this.vy > 0) {
        let land: Surface | null = null;
        for (const s of this.visibleSurfaces()) {
          const crossed = s.el === "floor" ? feet >= s.top : prevFeet <= s.top + 1 && feet >= s.top;
          const inside = this.x > s.left + hw * 0.3 && this.x < s.right - hw * 0.3;
          if (crossed && inside && (!land || s.top < land.top)) land = s;
        }
        if (land) {
          this.setBehind(false);
          const hard = this.vy > 1100;
          this.qv += Math.min(this.vy, 1400) * 0.0042;
          this.y = land.top - FOOT_DROP * this.S;
          this.surface = land.el;
          this.airborne = false;
          this.vx = this.vy = 0;
          if (this.air !== "hop" || hard) this.cb.onLand(hard);
          if (this.fleeing) this.wait = 0.05;
          else if (this.wanderTarget !== null && Math.abs(this.wanderTarget - this.x) > 18) this.wait = this.tired ? 0.35 : 0.02;
          else {
            this.wanderTarget = null;
            this.wait = this.tired ? rand(1.2, 3) : rand(0.5, 2.2);
            // Reached a spot: often sit for a while, legs dangling off a title bar.
            if (!this.tired && land.el !== "floor" && Math.random() < 0.6) {
              this.sitting = true;
              this.wait = rand(2.5, 6);
            }
          }
        }
      }
    } else {
      const s = this.surface ? this.surfaceOf(this.surface) : null;
      if (!s || this.x < s.left + hw * 0.2 || this.x > s.right - hw * 0.2) {
        // Card scrolled away or the dog walked off the edge.
        this.airborne = true;
        this.air = "fall";
        this.vy = 0;
        this.surface = null;
      } else {
        this.y = s.top - FOOT_DROP * this.S;
        this.think(dt, s);
      }
    }
    this.x = clamp(this.x, -50, innerWidth + 50);
    this.y = Math.max(this.y, -200);
    this.pvx += ((this.x - prevX) / dt - this.pvx) * Math.min(1, dt * 18);
  }

  /** Grounded behaviour: wander, flee from the cursor, get tired. */
  private think(dt: number, s: Surface) {
    const R = 200;
    const d = this.ptr.seen ? Math.hypot(this.ptr.x - this.x, this.ptr.y - (this.y + 170 * this.S)) : 1e9;
    // Only a hovering mouse chases. On touch, failed grabs drain stamina instead.
    const near = this.ptr.mouse && d < R && !this.reduce;

    const wasTired = this.tired;
    if (near && !this.tired) {
      this.fleeing = true;
      this.sitting = false;
      this.stamina -= 0.17 * dt;
    } else {
      if (!near) this.fleeing = false;
      this.stamina += (near ? 0.02 : this.tired ? 0.07 : 0.14) * dt;
    }
    this.stamina = clamp(this.stamina, 0, 1);
    if (this.stamina < 0.2) {
      this.tired = true;
      this.fleeing = false;
    } else if (this.tired && this.stamina > 0.6) this.tired = false;
    if (this.tired && !wasTired) this.cb.onVoice("whine");

    if (this.reduce) return;
    // Barks at nothing in particular every so often.
    if (this.time > this.nextBark && !this.tired) {
      this.nextBark = this.time + rand(9, 20);
      this.yap = 1;
      this.qv -= 1.2;
      this.cb.onVoice("bark");
    }
    this.wait -= dt;
    if (this.wait > 0) return;
    this.sitting = false;
    const hw = this.halfW();

    if (this.fleeing) {
      let dir = this.edgeSafeDir(Math.sign(this.x - this.ptr.x) || 1);
      if (Math.random() < 0.1) dir = -dir; // feint
      if (Math.random() < 0.3 && this.pickOtherSurface(dir)) return;
      this.jumpFlat(dir, 330, 380, "hop");
      return;
    }
    if (!this.tired && Math.random() < 0.22 && this.pickOtherSurface()) return;
    if (this.wanderTarget === null) {
      this.wanderTarget = rand(s.left + hw, Math.max(s.left + hw, s.right - hw));
    }
    const dir = Math.sign(this.wanderTarget - this.x) || 1;
    this.jumpFlat(dir, this.tired ? 55 : 120, this.tired ? 130 : 240, "hop");
  }

  private updateSprings(dt: number) {
    const sitT = this.sitting && !this.airborne && !this.grab && this.mode === "free" ? 1 : 0;
    this.sit += (sitT - this.sit) * Math.min(1, dt * 9);
    if (this.airborne || this.grab) this.sitting = false;
    this.yap = Math.max(0, this.yap - dt * 3.5);
    if (this.mode !== "free") this.pvx += ((this.airborne ? this.vx : 0) - this.pvx) * Math.min(1, dt * 18);
    const thT = this.grab ? clamp(this.pvx * 0.0016, -1, 1) : 0;
    this.thv += ((thT - this.th) * (this.grab ? 70 : 120) - this.thv * (this.grab ? 5 : 12)) * dt;
    this.th += this.thv * dt;
    this.qv += (-this.q * 230 - this.qv * 15) * dt;
    this.q += this.qv * dt;
    const lagT = -this.pvx * 0.03 - this.thv * 6;
    this.crv += ((lagT - this.cr) * 60 - this.crv * 7) * dt;
    this.cr += this.crv * dt;
    this.erv += ((lagT * 1.4 - this.er) * 110 - this.erv * 8) * dt;
    this.er += this.erv * dt;
  }

  private updatePose(t: number, cage: DOMRect | null) {
    const P = this.pose;
    const z = (k: PartId) => {
      const p = P[k];
      p.r = p.x = p.y = 0;
      p.sx = p.sy = 1;
      return p;
    };
    const air = this.airborne && this.air !== "hop" && !this.grab;
    const hopS = this.airborne && this.air === "hop" ? Math.sin(Math.PI * clamp(this.airT / this.airDur, 0, 1)) : 0;
    const dir = Math.sign(this.vx) || 1;
    const pant = this.tired && this.mode === "free" && !this.reduce;

    z("body").y = pant ? Math.sin(t * 11) * 4 : Math.sin(t * 2.4) * 2.2;
    P.body.r = hopS * dir * 5;
    z("head").r = Math.sin(t * 1.1) * 2 - this.th * 10 + (pant ? 6 : 0);
    P.head.y = Math.sin(t * 2.4 + 0.7) * 1.6;
    z("crest").r = Math.sin(t * 1.7 + 1) * 3 + this.cr;
    z("ear").r = Math.sin(t * 2.3) * 4 + this.er + (t % 5.3 < 0.16 ? -14 : 0);
    z("cheekL").r = Math.sin(t * 2) * 3 + this.cr * 0.4;
    z("cheekR").r = -Math.sin(t * 2 + 0.5) * 3 + this.cr * 0.4;
    const flail = this.grab ? 1 : air ? 0.7 : 0;
    z("armL").r = 4 + Math.sin(t * 2.4) * 3 + flail * (70 + Math.sin(t * 19) * 28) + hopS * 24;
    z("armR").r = -4 - Math.sin(t * 2.4) * 3 - flail * (70 + Math.sin(t * 19 + 1.3) * 28) - hopS * 24;
    z("legL").r = flail * Math.sin(t * 16) * 26 + hopS * 14;
    z("legR").r = -flail * Math.sin(t * 16) * 26 - hopS * 14;
    if (this.sit > 0.01) {
      // Sit: body drops onto the surface, legs swing out and dangle a little.
      const s = this.sit;
      const drop = 62 * s;
      P.body.y += drop;
      P.legL.y = P.legR.y = drop;
      P.legL.r += s * (74 + Math.sin(t * 2.1) * 5);
      P.legR.r -= s * (74 + Math.sin(t * 2.1 + 1) * 5);
      P.armL.r += s * 10;
      P.armR.r -= s * 10;
    }
    if (this.yap > 0) {
      P.head.r -= this.yap * 9;
      P.head.y -= this.yap * 6;
      P.ear.r -= this.yap * 18;
    }

    // Eyes follow the cursor; now and then the free dog glances at its cage.
    let lx = this.ptr.x;
    let ly = this.ptr.y;
    if (this.mode === "free" && cage && !this.grab) {
      if (this.time > this.nextLookCage) {
        this.lookCageUntil = this.time + 1.3;
        this.nextLookCage = this.time + rand(7, 13);
      }
      if (this.time < this.lookCageUntil) {
        lx = cage.left + cage.width / 2;
        ly = cage.top + cage.height / 2;
      }
    }
    const ex = this.x;
    const ey = this.y + (212 - G[1]) * this.S;
    let dx = lx - ex;
    let dy = ly - ey;
    const d = Math.hypot(dx, dy) || 1;
    const m = this.ptr.seen ? Math.min(1, d / 180) * 6 : 0;
    dx = (dx / d) * m;
    dy = (dy / d) * m;
    const blink = t % 3.9 < 0.12 && !this.grab;
    for (const k of ["eyeL", "eyeR"] as const) {
      const p = z(k);
      p.x = dx;
      p.y = dy;
      p.sy = blink ? 0.08 : this.grab ? 1.1 : pant ? 0.55 : 1;
    }
  }

  private buildWorld(x: number, y: number) {
    const sq = this.q;
    const B = new DOMMatrix()
      .translate(x, y)
      .rotate(this.th * 57.2958)
      .scale(this.S)
      .translate(-G[0], -G[1])
      .translate(FEET[0], FEET[1])
      .scale(1 + sq * 0.6, 1 - sq)
      .translate(-FEET[0], -FEET[1]);
    for (const k of chainOrder) {
      const pt = parts[k];
      const p = this.pose[k];
      const base = pt.p ? this.world[pt.p] : B;
      this.world[k] = base
        .translate(pt.pv[0] + p.x, pt.pv[1] + p.y)
        .rotate(p.r)
        .scale(p.sx, p.sy)
        .translate(-pt.pv[0], -pt.pv[1]);
    }
  }

  private updateBeads(dt: number, t: number) {
    const K = [24, 13, 8];
    const body = this.world.body;
    if (!this.beads || this.mode !== "free") {
      // In and around the cage the tail just sticks to the body.
      this.beads = BEADS.map((b) => {
        const q = body.transformPoint({ x: b[0], y: b[1] });
        return { x: q.x, y: q.y };
      });
      return;
    }
    BEADS.forEach((b, i) => {
      const q = body.transformPoint({ x: b[0], y: b[1] });
      q.y += Math.sin(t * 2.2 + i * 1.1) * 2.5 * this.S * 2;
      const a = 1 - Math.exp(-dt * K[i]);
      this.beads![i].x += (q.x - this.beads![i].x) * a;
      this.beads![i].y += (q.y - this.beads![i].y) * a;
    });
  }

  // ---------------------------------------------------------------- render

  private render(now: number, t: number) {
    const tr = this.trans;
    const pixelish = this.persona === "rot" || !!tr;
    if (!tr && this.persona === "rot" && now > this.fxUntil) {
      if (this.reduce) this.fx = "pixel";
      else {
        const n = pickFx(this.fx);
        this.fx = n.fx;
        this.fxUntil = now + n.ms;
      }
    }
    const fx: Fx = tr ? tr.fx : this.fx;
    const cell = tr ? tr.steps[tr.i] : fx === "crunch" ? (Math.random() < 0.5 ? 12 : 8) : 4;
    const pixel = pixelish && fx !== "smooth";

    // Pixel mode runs at 12 fps (pose *and* position), except during the switch.
    if (pixel && !tr) {
      const fi = Math.floor(now / (1000 / 12));
      if (fi === this.lastFi) return;
      this.lastFi = fi;
    }

    // Snap to the pixel grid so the sprite never drifts between cells.
    const snap = (v: number) => (pixel ? Math.round(v / cell) * cell : v);
    const xd = snap(this.x);
    const yd = snap(this.y);
    this.buildWorld(xd, yd);
    this.updateBeads(pixel ? 1 / 12 : 1 / 60, t);

    const size = this.size;
    let ox = xd + BOX_OFF[0] * this.S - size / 2;
    let oy = yd + BOX_OFF[1] * this.S - size / 2;
    if (pixel) {
      ox = Math.round(ox / cell) * cell;
      oy = Math.round(oy / cell) * cell;
    }
    this.cv.style.transform = `translate3d(${ox}px,${oy}px,0)`;

    // Hit box for grabbing (only live while the dog is free).
    const hx0 = xd + (HIT[0] - G[0]) * this.S;
    const hy0 = yd + (HIT[1] - G[1]) * this.S;
    this.hit.style.transform = `translate3d(${hx0}px,${hy0}px,0)`;
    this.hit.style.width = (HIT[2] - HIT[0]) * this.S + "px";
    this.hit.style.height = (HIT[3] - HIT[1]) * this.S + "px";

    if (pixel) this.renderPixel(cell, fx, ox, oy);
    else this.renderSmooth(ox, oy);

    if (tr && now - tr.at > 110) {
      tr.i++;
      tr.at = now;
      if (tr.i >= tr.steps.length) {
        this.trans = null;
        tr.done();
      }
    }
  }

  private drawDog(c: CanvasRenderingContext2D, V: DOMMatrix, flat: boolean, glowPx: number) {
    const glow = (on: boolean) => {
      if (flat) return;
      c.shadowColor = on ? "rgba(255,140,30,.95)" : "transparent";
      c.shadowBlur = on ? glowPx : 0;
    };
    const path = this.paths;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.setTransform(V);
    BEADS.forEach((b, i) => {
      const p = this.beads![i];
      const r = b[2] * this.S;
      c.beginPath();
      c.arc(p.x, p.y, r, 0, Math.PI * 2);
      if (flat) c.fillStyle = OR;
      else {
        const g = c.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
        g.addColorStop(0, "#FFD98A");
        g.addColorStop(1, OR);
        c.fillStyle = g;
      }
      glow(true);
      c.fill();
      glow(false);
    });
    const soft = (p: Path2D) => {
      c.fillStyle = PU;
      c.fill(p);
      c.strokeStyle = DK;
      c.lineWidth = 8;
      c.stroke(p);
    };
    const W = this.world;
    for (const k of drawOrder) {
      c.setTransform(V.multiply(W[k]));
      switch (k) {
        case "ear": soft(path.ear); break;
        case "legL": c.fillStyle = DK; c.fill(path.legL); soft(path.footL); break;
        case "legR": c.fillStyle = DK; c.fill(path.legR); soft(path.footR); break;
        case "body":
          c.fillStyle = DK; c.fill(path.torso);
          c.fillStyle = OR; glow(true); c.fill(path.belly); glow(false);
          break;
        case "armL": soft(path.armL); break;
        case "armR": soft(path.armR); break;
        case "head":
          c.fillStyle = DK; c.fill(path.head);
          c.strokeStyle = PU; c.lineWidth = 14; c.stroke(path.browL); c.stroke(path.browR);
          c.fillStyle = OR; glow(true);
          c.beginPath(); c.ellipse(231, 272, 32, 14, 0, 0, Math.PI * 2); c.fill();
          glow(false);
          break;
        case "cheekL": soft(path.cheekL); break;
        case "cheekR": soft(path.cheekR); break;
        case "eyeL":
        case "eyeR": {
          const x = k === "eyeL" ? 197 : 265;
          c.fillStyle = OR; glow(true);
          c.beginPath(); c.ellipse(x, 212, 16, 38, 0, 0, Math.PI * 2); c.fill();
          glow(false);
          break;
        }
        case "crest": c.fillStyle = DK; c.fill(path.crest); c.fillStyle = PU; c.fill(path.blade); break;
      }
    }
    // Tired: sweat drops (drawn in the palette's purple so they survive quantising).
    if (this.tired && this.mode === "free") {
      const bob = (this.time * 3) % 1;
      for (const [sx, sy, s] of [[112, 140, 1.4], [352, 170, 1.1]] as const) {
        c.setTransform(V.multiply(W.head).translate(sx, sy + bob * 26).scale(s));
        c.fillStyle = PU;
        c.fill(path.sweat);
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  private renderSmooth(ox: number, oy: number) {
    const { octx, ctx, off, DPR } = this;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, off.width, off.height);
    this.drawDog(octx, new DOMMatrix().scale(DPR).translate(-ox, -oy), false, 13 * DPR * (this.S / 0.457));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.imageSmoothingEnabled = true;
    // Thin light rim so the dark body reads on space black.
    ctx.shadowColor = "rgba(160,146,240,.95)";
    ctx.shadowBlur = 2.4 * DPR;
    ctx.drawImage(off, 0, 0);
    ctx.drawImage(off, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.drawImage(off, 0, 0);
  }

  private renderPixel(cell: number, fx: Fx, ox: number, oy: number) {
    const { buf, bctx, ctx } = this;
    const w = Math.ceil(this.size / cell);
    const h = w;
    if (buf.width !== w || buf.height !== h) {
      buf.width = w;
      buf.height = h;
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, w, h);
    this.drawDog(bctx, new DOMMatrix().scale(1 / cell).translate(-ox, -oy), true, 0);
    const img = bctx.getImageData(0, 0, w, h);
    quantize(img.data, w, h, true);
    applyFx(fx, img.data, w, h);
    bctx.putImageData(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, w * cell * this.DPR, h * cell * this.DPR);
  }
}
