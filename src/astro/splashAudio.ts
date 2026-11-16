// Synthesized Esoteric Soundtrack for the 100s Cosmic Splash Experience
// Combines deep Solférgio pads (432 Hz / 528 Hz), cosmic wind murmur, Tibetan bells & celestial harp.

function createReverbImpulse(ctx: AudioContext, seconds = 4.2, decay = 2.6): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.pow(1 - t, decay) * Math.min(1, i / (ctx.sampleRate * 0.045));
      const white = Math.random() * 2 - 1;
      lp = lp * 0.74 + white * 0.26;
      data[i] = lp * env;
    }
  }
  return impulse;
}

function createNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // Soft pink-ish cosmic wind contour
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.95 * b2 + white * 0.048;
    data[i] = (b0 + b1 + b2 + white * 0.018) * 0.55;
  }
  return buf;
}

// 432 Hz tuned Lydian celestial harp pitches (D, E, F#, G#, A, B, C#)
const LYDIAN_HARP_HZ = [
  288.0, // D4
  324.0, // E4
  364.1, // F#4
  408.7, // G#4
  432.0, // A4 (432 Hz anchor)
  486.0, // B4
  546.1, // C#5
  576.0, // D5
  648.0, // E5
];

export class CosmicSplashAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private wetBus: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  private droneGain: GainNode | null = null;
  private pad528Gain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private persistentNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
  private triggeredCues = new Set<string>();
  private lastHarpStep = -1;
  private active = false;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public isRunning(): boolean {
    return Boolean(this.active && this.ctx && this.ctx.state === 'running');
  }

  public async ensureStarted(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }

    if (this.ctx.state !== 'running') return false;
    if (this.active) return true;

    this.buildContinuousGraph();
    this.active = true;
    return true;
  }

  private buildContinuousGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.connect(ctx.destination);
    this.masterGain = master;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, now);
    comp.knee.setValueAtTime(18, now);
    comp.ratio.setValueAtTime(2.8, now);
    comp.connect(master);

    const dry = ctx.createGain();
    dry.gain.setValueAtTime(0.68, now);
    dry.connect(comp);
    this.dryBus = dry;

    const reverb = ctx.createConvolver();
    reverb.buffer = createReverbImpulse(ctx, 4.4, 2.5);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(0.75, now);
    reverb.connect(wet);
    wet.connect(comp);
    this.reverbNode = reverb;
    this.wetBus = wet;

    // 1. Deep Sub-Drone (64 Hz) + 432 Hz Solfeggio Warm Pad
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.connect(dry);
    droneGain.connect(reverb);
    this.droneGain = droneGain;

    const droneSpecs = [
      { freq: 64.0, type: 'sine' as OscillatorType, amp: 0.24, detune: 0 },
      { freq: 144.0, type: 'sine' as OscillatorType, amp: 0.14, detune: -3 },
      { freq: 216.0, type: 'triangle' as OscillatorType, amp: 0.05, detune: 4 },
      { freq: 432.0, type: 'sine' as OscillatorType, amp: 0.075, detune: 2 },
    ];
    droneSpecs.forEach((s) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.freq, now);
      osc.detune.setValueAtTime(s.detune, now);
      g.gain.setValueAtTime(s.amp, now);
      osc.connect(g);
      g.connect(droneGain);
      osc.start(now);
      this.persistentNodes.push(osc, g);
    });

    // 2. 528 Hz Radiant Harmonic Layer (blends in during Movements II & III)
    const pad528Gain = ctx.createGain();
    pad528Gain.gain.setValueAtTime(0.0001, now);
    pad528Gain.connect(reverb);
    pad528Gain.connect(dry);
    this.pad528Gain = pad528Gain;

    [
      { freq: 264.0, amp: 0.1 },
      { freq: 528.0, amp: 0.055 },
      { freq: 396.0, amp: 0.06 },
    ].forEach((s, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(s.freq, now);
      osc.detune.setValueAtTime(idx % 2 === 0 ? -3 : 3, now);
      g.gain.setValueAtTime(s.amp, now);
      osc.connect(g);
      g.connect(pad528Gain);
      osc.start(now);
      this.persistentNodes.push(osc, g);
    });

    // 3. Cosmic Wind Whisper (Looping Pink Noise -> Resonant Lowpass)
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = createNoiseBuffer(ctx, 4.5);
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(280, now);
    windFilter.Q.setValueAtTime(1.4, now);
    this.windFilter = windFilter;

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.02, now);
    this.windGain = windGain;

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(reverb);
    windSrc.start(now);
    this.persistentNodes.push(windSrc, windFilter, windGain);
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.linearRampToValueAtTime(mute ? 0.0001 : 0.36, now + 0.25);
    }
  }

  public resetCues() {
    this.triggeredCues.clear();
    this.lastHarpStep = -1;
  }

  public syncToTime(tSec: number, isPlaying: boolean) {
    if (!this.active || !this.ctx || !this.masterGain || !this.droneGain || !this.pad528Gain || !this.windGain || !this.windFilter) {
      return;
    }

    const now = this.ctx.currentTime;
    if (!isPlaying || this.muted) {
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.14);
      return;
    }

    // Master macro curve across 0..100s (gentle swell -> full apex -> silky fade-out 82s..98s)
    let masterAmp = 0.36;
    if (tSec < 6) {
      masterAmp = 0.04 + 0.24 * (tSec / 6);
    } else if (tSec < 20) {
      masterAmp = 0.28 + 0.06 * ((tSec - 6) / 14);
    } else if (tSec < 50) {
      masterAmp = 0.34 + 0.06 * ((tSec - 20) / 30);
    } else if (tSec < 82) {
      masterAmp = 0.4;
    } else if (tSec < 98) {
      const fade = Math.max(0, 1 - (tSec - 82) / 16);
      masterAmp = 0.0001 + 0.4 * Math.pow(fade, 1.8);
    } else {
      masterAmp = 0.0001;
    }

    this.masterGain.gain.setTargetAtTime(masterAmp, now, 0.22);

    // Sub-drone & 432Hz presence
    const droneLevel = tSec < 50 ? 0.85 : tSec < 82 ? 0.95 : 0.45;
    this.droneGain.gain.setTargetAtTime(droneLevel, now, 0.35);

    // 528Hz harmonic bloom during Movements II & III
    const pad528Level =
      tSec < 20 ? 0.04 : tSec < 50 ? 0.35 : tSec < 80 ? 0.72 : 0.2;
    this.pad528Gain.gain.setTargetAtTime(pad528Level, now, 0.4);

    // Cosmic wind breath modulation
    const windLevel = tSec < 80 ? 0.045 + 0.015 * Math.sin(tSec * 0.4) : 0.015;
    this.windGain.gain.setTargetAtTime(windLevel, now, 0.3);
    this.windFilter.frequency.setTargetAtTime(
      240 + 110 * (0.5 + 0.5 * Math.sin(tSec * 0.25)),
      now,
      0.3
    );

    // Trigger Movement Landmark Chimes & Tibetan Singing Bowl
    if (tSec >= 6.5 && tSec < 9 && !this.triggeredCues.has('chime-1')) {
      this.triggeredCues.add('chime-1');
      this.playCrystalChime(576.0, 0.25, 4.5, 0.08);
    }
    if (tSec >= 15.5 && tSec < 18 && !this.triggeredCues.has('chime-2')) {
      this.triggeredCues.add('chime-2');
      this.playCrystalChime(864.0, -0.25, 4.2, 0.065);
    }
    if (tSec >= 52 && tSec < 56 && !this.triggeredCues.has('bowl-3')) {
      this.triggeredCues.add('bowl-3');
      this.playTibetanBowl(216.0);
    }
    if (tSec >= 70 && tSec < 73 && !this.triggeredCues.has('chime-wave')) {
      this.triggeredCues.add('chime-wave');
      this.playCrystalChime(648.0, 0.18, 4.8, 0.07);
    }
    if (tSec >= 91 && tSec < 94 && !this.triggeredCues.has('chime-farewell')) {
      this.triggeredCues.add('chime-farewell');
      this.playCrystalChime(864.0, 0, 5.5, 0.05);
    }

    // Spaced celestial harp notes across Movements II & III (22s .. 78s)
    if (tSec >= 22 && tSec <= 78) {
      const step = Math.floor((tSec - 22) / 3.4);
      if (step !== this.lastHarpStep) {
        this.lastHarpStep = step;
        const idx = (step * 2 + (step % 3)) % LYDIAN_HARP_HZ.length;
        const pan = Math.sin(step * 0.9) * 0.42;
        this.playHarpNote(LYDIAN_HARP_HZ[idx], pan);
      }
    }
  }

  private playCrystalChime(freq: number, panVal: number, dur = 4.2, amp = 0.07) {
    if (!this.ctx || !this.reverbNode || !this.dryBus) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(panVal, now);
      panner.connect(this.dryBus);
      panner.connect(this.reverbNode);
    }
    const target: AudioNode = panner ?? this.reverbNode;

    [
      { mult: 1, gain: amp, d: dur },
      { mult: 2.0, gain: amp * 0.28, d: dur * 0.65 },
    ].forEach((p) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.mult, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(p.gain, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
      osc.connect(g);
      g.connect(target);
      osc.start(now);
      osc.stop(now + p.d + 0.1);
    });
  }

  private playTibetanBowl(baseFreq: number) {
    if (!this.ctx || !this.reverbNode || !this.dryBus) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [
      { mult: 1, gain: 0.16, attack: 0.22, d: 7.2 },
      { mult: 2.0, gain: 0.045, attack: 0.18, d: 5.0 },
      { mult: 2.756, gain: 0.02, attack: 0.12, d: 3.6 },
    ].forEach((p) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.mult, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(p.gain, now + p.attack);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
      osc.connect(g);
      g.connect(this.dryBus!);
      g.connect(this.reverbNode!);
      osc.start(now);
      osc.stop(now + p.d + 0.1);
    });
  }

  private playHarpNote(freq: number, panVal: number) {
    if (!this.ctx || !this.reverbNode || !this.dryBus) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(panVal, now);
      panner.connect(this.dryBus);
      panner.connect(this.reverbNode);
    }
    const target: AudioNode = panner ?? this.reverbNode;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 2.2);
    filter.connect(target);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.22, now);
    g2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.11, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

    osc1.connect(g);
    osc2.connect(g2);
    g2.connect(g);
    g.connect(filter);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.5);
    osc2.stop(now + 3.5);
  }

  public playEnterChime() {
    if (this.muted) return;
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.playCrystalChime(432.0, -0.15, 2.8, 0.075);
    window.setTimeout(() => {
      if (this.ctx && this.ctx.state === 'running') {
        this.playCrystalChime(648.0, 0.15, 3.0, 0.065);
      }
    }, 110);
  }

  public dispose() {
    this.active = false;
    this.triggeredCues.clear();
    const nodes = this.persistentNodes;
    this.persistentNodes = [];
    const ctx = this.ctx;
    const master = this.masterGain;

    this.ctx = null;
    this.masterGain = null;
    this.dryBus = null;
    this.wetBus = null;
    this.reverbNode = null;
    this.droneGain = null;
    this.pad528Gain = null;
    this.windGain = null;
    this.windFilter = null;

    if (ctx && master) {
      try {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
        master.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      } catch {
        // Ignore ramp error during disposal
      }
      window.setTimeout(() => {
        nodes.forEach((n) => {
          try {
            n.stop?.();
            n.disconnect();
          } catch {
            // Already stopped
          }
        });
        try {
          void ctx.close();
        } catch {
          // Ignore close errors
        }
      }, 280);
    }
  }
}
