/**
 * Synthesized brand sound: piano and violin, no audio files.
 * - beat(): a soft, low piano-like note (additive sine partials, fast attack,
 *   exponential decay);
 * - drone: a bowed-string pad while holding (two detuned saws through a
 *   lowpass, slow vibrato, gentle swell);
 * - chord(): a short resolving chord on ignite.
 *
 * Nothing is created until unlock() runs inside a user gesture. Sound is off
 * by default; the first hold switches it on (see DECISIONS.md).
 */

type Drone = {
  gain: GainNode;
  oscs: OscillatorNode[];
  lfo: OscillatorNode;
};

// A minor-ish pentatonic walk around D2–A2, low and calm.
const BEAT_NOTES = [73.42, 82.41, 98.0, 110.0, 98.0, 82.41];
// Suspended chord resolving to D major (D3 F#3 A3 D4).
const CHORD_FROM = [146.83, 196.0, 220.0, 293.66];
const CHORD_TO = [146.83, 185.0, 220.0, 293.66];

class BrandAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  private drone: Drone | null = null;
  private beatIndex = 0;
  enabled = false;

  /** Must be called synchronously from a user gesture handler. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    // Gentle compression keeps the chord from clipping on small speakers.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!this.ctx || !this.master) return;
    if (on && this.ctx.state === "suspended") void this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 0.55 : 0, t, 0.08);
    if (!on) this.stopDrone();
  }

  private get live() {
    return this.enabled && this.ctx && this.master && this.ctx.state === "running";
  }

  /** Soft low piano-like note: sine partials with slight inharmonicity. */
  beat(accent = 0) {
    if (!this.live) return;
    const ctx = this.ctx!;
    const f = BEAT_NOTES[this.beatIndex++ % BEAT_NOTES.length];
    const t = ctx.currentTime + 0.01;
    const out = ctx.createGain();
    out.gain.value = 0.16 + accent * 0.08;
    out.connect(this.master!);
    const partials = [
      [1, 1, 2.6],
      [2.003, 0.42, 1.6],
      [3.01, 0.18, 1.0],
      [4.03, 0.08, 0.7],
      [5.06, 0.04, 0.5],
    ];
    for (const [ratio, amp, decay] of partials) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  }

  /** Bowed-string drone while holding. */
  startDrone() {
    if (!this.live || this.drone) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 1.1);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(1300, t + 1.2);
    lp.Q.value = 0.7;
    gain.connect(this.master!);
    lp.connect(gain);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.2;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 1.6; // Hz of vibrato
    lfo.connect(lfoDepth);

    const oscs: OscillatorNode[] = [];
    for (const [f, detune] of [
      [146.83, -6],
      [146.83, 7],
      [220.0, 3],
    ]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = detune;
      lfoDepth.connect(o.frequency);
      const g = ctx.createGain();
      g.gain.value = f > 200 ? 0.35 : 0.5;
      o.connect(g).connect(lp);
      o.start(t);
      oscs.push(o);
    }
    lfo.start(t);
    this.drone = { gain, oscs, lfo };
  }

  stopDrone(fade = 0.45) {
    const d = this.drone;
    if (!d || !this.ctx) return;
    this.drone = null;
    const t = this.ctx.currentTime;
    d.gain.gain.cancelScheduledValues(t);
    d.gain.gain.setValueAtTime(d.gain.gain.value, t);
    d.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    for (const o of d.oscs) o.stop(t + fade + 0.05);
    d.lfo.stop(t + fade + 0.05);
  }

  /** Short resolving chord: suspended, then resolved, with a piano-ish envelope. */
  chord() {
    if (!this.live) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02;
    const play = (freqs: number[], at: number, len: number, level: number) => {
      freqs.forEach((f, i) => {
        for (const [ratio, amp] of [
          [1, 1],
          [2.002, 0.3],
          [3.004, 0.1],
        ]) {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = f * ratio;
          const g = ctx.createGain();
          const s = at + i * 0.035;
          g.gain.setValueAtTime(0, s);
          g.gain.linearRampToValueAtTime(level * amp, s + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, s + len);
          o.connect(g).connect(this.master!);
          o.start(s);
          o.stop(s + len + 0.05);
        }
      });
    };
    play(CHORD_FROM, t, 0.9, 0.07);
    play(CHORD_TO, t + 0.42, 2.6, 0.08);
  }
}

export const brandAudio = new BrandAudio();
