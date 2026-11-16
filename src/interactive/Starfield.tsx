"use client";

import { useEffect, useRef } from "react";
import { useInteractive } from "./store";

// Cool-side backdrop: the three-layer shader starfield from Ultimate Speed
// Test (same hash, same cosine palette), drifting slowly, leaning toward the
// pointer and sliding with the scroll position for depth. Falls back to the
// CSS stars underneath when WebGL2 is missing. Sleeps on the rot side and in
// hidden tabs; draws a single still frame under reduced motion.

const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec2 touch;
uniform float scroll;
#define hue(a) (.6+.6*cos(6.3*(a)+vec3(0,83,21)))
float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 starfield(vec2 uv, float brightness, float warmMix){
  vec3 col = vec3(0);
  vec2 pull = touch * 0.06;
  for (float L = 0.; L < 3.; L++){
    float scale = 2.0 + L * 2.2;
    vec2 p = uv * scale + vec2(time * 0.004 * (L+1.), time * 0.003) + pull * (0.6 + L*0.4);
    p.y += scroll * (0.25 + L * 0.2);
    vec2 cell = floor(p);
    vec2 fcel = fract(p);
    float r = hash12(cell);
    if (r < 0.72) continue;
    vec2 starPos = vec2(hash12(cell + 1.3), hash12(cell + 7.7));
    float d = length(fcel - starPos);
    float size = 0.012 + (r - 0.72) * 0.03;
    float tw = 0.7 + 0.3 * sin(time * 0.6 + r * 40.);
    float s = smoothstep(size, 0.0, d) * tw;
    float halo = smoothstep(size * 6., 0.0, d) * 0.12;
    vec3 tint = hue(r * 2.1 + L * 0.13 + time * 0.02);
    tint = mix(tint, vec3(1.0), warmMix);
    col += (s + halo) * tint * brightness * (0.5 + 0.5 / (L + 1.));
  }
  return col;
}
void main(){
  float s = min(resolution.x, resolution.y);
  vec2 uv = (gl_FragCoord.xy - .5 * resolution) / s;
  vec3 col = starfield(uv, 0.95, 0.55);
  // a breath of the palette high up, so the black has somewhere to fall from
  col += hue(time * 0.01 + 0.62) * 0.045 * exp(-length(uv - vec2(0.35, 0.75)) * 2.2);
  float vig = smoothstep(1.35, 0.25, length(uv));
  col *= 0.45 + 0.55 * vig;
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
    cv.dataset.on = "1";

    const coarse = matchMedia("(pointer: coarse)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const dpr = Math.min(coarse ? 1 : 1.5, devicePixelRatio || 1);
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
      gl!.uniform1f(uScroll, sc * 0.35);
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
