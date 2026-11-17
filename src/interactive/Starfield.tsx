"use client";

import { useEffect, useRef } from "react";
import { useInteractive } from "./store";

// Cool-side backdrop: a procedural night sky. Stars live on grids measured in
// CSS pixels (so they stay pin-sharp at any screen size), with power-law
// brightness, a soft bloom and faint diffraction spikes on the brightest, four
// parallax depths that lean with the pointer and slide with the scroll, three
// sheets of dust between them, over deep
// indigo rather than black. Falls back to the
// CSS stars underneath when WebGL2 is missing. Sleeps on the rot side and in
// hidden tabs; draws a single still frame under reduced motion.

const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform float dpr;
uniform vec2 touch;
uniform float scroll;

float hash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash2(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float a = .5, v = 0.;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 17.; a *= .5; }
  return v;
}
// Black-body-ish tint: most stars near white, a few cool blue, a few warm.
vec3 starTint(float t){
  vec3 cool = vec3(.72, .82, 1.), warm = vec3(1., .82, .64);
  return mix(mix(cool, vec3(1.), smoothstep(0., .45, t)), warm, smoothstep(.72, 1., t));
}
// Integer hash (PCG): the float hash above is fine for noise but lines stars
// up in visible columns when it is fed neighbouring cell ids.
uvec3 pcg3(uvec3 v){
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 cellRand(vec2 id, float seed){
  uvec3 u = pcg3(uvec3(ivec3(int(id.x), int(id.y), int(seed))));
  return vec3(u) / 4294967295.;
}
// One layer of stars on a grid measured in CSS pixels, so a star is the same
// size on a phone and on a 4K monitor: a bigger screen shows more sky, not
// bigger dots. Brightness follows a steep power law (many faint, few bright).
vec3 layer(vec2 px, float cell, float density, float gain, float seed){
  vec2 g = px / cell;
  vec2 id = floor(g);
  vec2 f = fract(g);
  vec3 r1 = cellRand(id, seed);
  if (r1.z > density) return vec3(0);
  vec3 r2v = cellRand(id, seed + 57.);
  vec2 pos = .18 + .64 * r1.xy;
  vec2 d = (f - pos) * cell;                 // distance in CSS px
  float r2 = dot(d, d);
  float mag = pow(r2v.x, 9.);                // power-law magnitude
  float b = gain * (.22 + 2.8 * mag);
  float tw = .82 + .18 * sin(time * (.6 + 1.8 * r2v.y) + r1.z * 60.);
  float core = exp(-r2 / (.5 + 1.4 * mag));        // sub-2px core
  float halo = mag * mag * 6. / (r2 + 14.);        // soft bloom, bright stars only
  halo *= smoothstep(cell * .18, 0., sqrt(r2));    // stays inside its cell
  // faint 4-point diffraction spikes on the very brightest
  float sp = smoothstep(.6, 1., mag) * .7;
  float spikes = sp * (exp(-abs(d.x) * .12 - abs(d.y) * 1.8) + exp(-abs(d.y) * .12 - abs(d.x) * 1.8)) * .5;
  return starTint(r2v.z) * b * tw * (core + halo + spikes);
}
void main(){
  vec2 px = gl_FragCoord.xy / dpr;
  vec2 size = resolution / dpr;
  vec2 c = px - .5 * size;
  vec2 uv = c / max(size.x, size.y);
  // Not a black void: deep indigo that lifts toward two far pools of light.
  vec2 pf = uv + touch * .010 - vec2(0., scroll * .02);
  vec3 col = mix(vec3(.006, .007, .013), vec3(.014, .016, .030), smoothstep(-.6, .6, uv.y + uv.x * .3));
  vec2 pa = pf - vec2(-.30, .20), pb = pf - vec2(.36, -.22);
  col += vec3(.085, .12, .29) * exp(-dot(pa, pa) * 6.) * .17;
  col += vec3(.24, .11, .27) * exp(-dot(pb, pb) * 5.) * .11;
  // three sheets of dust at different distances: they slide past one another
  // with the pointer and the scroll, which is what reads as depth
  for (float k = 0.; k < 3.; k++){
    float d = (k + 1.) / 3.;
    vec2 q = uv * mix(1.3, 2.4, d) + touch * mix(.008, .07, d)
           - vec2(0., scroll * mix(.03, .26, d)) + vec2(time * .003 * d, 0.) + k * 7.3;
    float n = fbm(q + fbm(q * 1.7 + 3.) * .8);
    n = mix(n, 1. - abs(2. * fbm(q * 2.6 + 5.) - 1.), .35);   // some fine filaments
    vec3 tint = mix(vec3(.10, .13, .24), vec3(.22, .14, .22), noise(q * .7 + 9. + k));
    float m = smoothstep(.5, .92, n);
    col += tint * m * m * mix(.30, .18, d);
    col *= 1. - .22 * d * smoothstep(.5, .2, n);   // nearer sheets also cast dark lanes
  }
  // four depths of stars: far = dense, faint, almost still; near = sparse, bright
  for (float L = 0.; L < 4.; L++){
    float depth = (L + 1.) / 4.;
    vec2 shift = vec2(time * 1.2, time * .5) * depth
               + touch * mix(4., 34., depth)
               - vec2(0., scroll * mix(20., 220., depth));
    float cell = mix(26., 120., depth);
    col += layer(px + shift, cell, mix(.5, .22, depth), mix(.35, 1., depth), L * 13. + 1.);
  }
  float vig = smoothstep(1.0, .2, length(uv));
  col *= .5 + .5 * vig;
  col += (hash(gl_FragCoord.xy + fract(time)) - .5) / 255.;   // dither the gradients
  O = vec4(col, 1);
}`;

const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0, 1); }`;

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, "time");
    const uRes = gl.getUniformLocation(prog, "resolution");
    const uTouch = gl.getUniformLocation(prog, "touch");
    const uScroll = gl.getUniformLocation(prog, "scroll");
    const uDpr = gl.getUniformLocation(prog, "dpr");
    let dpr = 1;
    cv.dataset.on = "1";

    const coarse = matchMedia("(pointer: coarse)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      // Stars are ~1 CSS px: render at device resolution or they smear.
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      if (!raf) draw(performance.now());
    };

    // Pointer target and an eased follower, so the stars lean, not jump.
    let tx = 0, ty = 0, x = 0, y = 0, sc = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = 1 - (e.clientY / innerHeight) * 2;
    };

    let raf = 0;
    function draw(now: number) {
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      sc += (scrollY / Math.max(1, innerHeight) - sc) * 0.12;
      gl!.uniform1f(uTime, now / 1000);
      gl!.uniform2f(uRes, cv.width, cv.height);
      gl!.uniform2f(uTouch, x, y);
      gl!.uniform1f(uScroll, sc);
      gl!.uniform1f(uDpr, dpr);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      const run = !reduce && !document.hidden && useInteractive.getState().persona === "cool";
      if (run && !raf) raf = requestAnimationFrame(loop);
      else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    resize();
    sync();
    addEventListener("resize", resize);
    if (!coarse) addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", sync);
    const off = useInteractive.subscribe(sync);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", sync);
      off();
    };
  }, []);

  return <canvas ref={ref} className="star-gl" aria-hidden />;
}
