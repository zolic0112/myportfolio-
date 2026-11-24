// All sound is synthesised with WebAudio, so there are no copyrighted meme
// clips to clear before going live (brief §9). Swap `play()` cases for real
// samples later if you find openly licensed ones.
//
// Nothing plays until unlock() runs inside the "open the cage" click: the
// cool persona is silent, and browsers block audio before a user gesture.

export type SoundName =
  | "pop"
  | "airhorn"
  | "clank"
  | "ding"
  | "squeak"
  | "boing"
  | "tada"
  | "error"
  | "bark"
  | "whine"
  | "sad";

class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private muted = false;

  unlock() {
    if (this.ctx || typeof window === "undefined") return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.01);
  }

  private tone(
    type: OscillatorType,
    freqs: [number, number],
    start: number,
    dur: number,
    vol = 0.3,
    dest?: AudioNode,
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    const t = ctx.currentTime + start;
    o.frequency.setValueAtTime(freqs[0], t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, freqs[1]), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(dest ?? this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  play(name: SoundName) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "pop":
        this.tone("sine", [300, 1400], 0, 0.12, 0.4);
        break;
      case "airhorn":
        for (const f of [233, 311, 466]) this.tone("sawtooth", [f, f * 0.97], 0, 0.9, 0.12);
        for (const f of [233, 311, 466]) this.tone("sawtooth", [f, f * 0.97], 1.0, 0.5, 0.12);
        break;
      case "clank":
        this.tone("square", [180, 60], 0, 0.18, 0.35);
        this.tone("triangle", [1200, 900], 0, 0.25, 0.2);
        break;
      case "ding":
        this.tone("sine", [1318, 1318], 0, 0.25, 0.25);
        this.tone("sine", [1046, 1046], 0.12, 0.35, 0.25);
        break;
      case "squeak":
        this.tone("square", [700, 1600], 0, 0.09, 0.15);
        this.tone("square", [900, 2000], 0.1, 0.09, 0.15);
        break;
      case "boing":
        this.tone("triangle", [120, 520], 0, 0.22, 0.3);
        break;
      case "tada":
        [523, 659, 784, 1046].forEach((f, i) => this.tone("square", [f, f], i * 0.09, 0.4, 0.12));
        break;
      case "bark":
        this.tone("sawtooth", [520, 240], 0, 0.09, 0.22);
        this.tone("sawtooth", [560, 220], 0.14, 0.11, 0.22);
        break;
      case "whine":
        this.tone("sine", [900, 1500], 0, 0.18, 0.12);
        this.tone("sine", [1500, 700], 0.18, 0.3, 0.12);
        break;
      case "sad":
        // wah, wah, wah, waaah
        [[392, 370], [370, 349], [349, 330]].forEach(([a, b], i) => this.tone("sawtooth", [a, b], i * 0.32, 0.28, 0.12));
        this.tone("sawtooth", [330, 262], 0.96, 0.9, 0.12);
        break;
      case "error":
        this.tone("square", [220, 200], 0, 0.15, 0.2);
        this.tone("square", [180, 160], 0.16, 0.25, 0.2);
        break;
    }
  }

  // Cheap background music: a four-bar square-wave loop.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.25;
    this.music.connect(this.master!);
    const notes = [392, 0, 392, 523, 0, 466, 440, 0, 349, 0, 349, 466, 0, 440, 392, 330];
    const bass = [98, 98, 131, 117];
    let step = 0;
    const beat = 0.14;
    const tick = () => {
      if (!this.ctx || !this.music) return;
      const n = notes[step % notes.length];
      if (n) this.tone("square", [n, n], 0, beat * 0.9, 0.08, this.music);
      if (step % 4 === 0) {
        const b = bass[Math.floor(step / 4) % bass.length];
        this.tone("triangle", [b, b], 0, beat * 3.5, 0.2, this.music);
      }
      step++;
    };
    this.musicTimer = setInterval(tick, beat * 1000);
  }

  stopAll() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.music) {
      this.music.disconnect();
      this.music = null;
    }
    // Cut anything still ringing: swap in a fresh master bus.
    if (this.ctx && this.master) {
      this.master.disconnect();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
  }
}

export const sound = new Sound();
