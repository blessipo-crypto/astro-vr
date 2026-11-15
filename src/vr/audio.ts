// Procedural celestial harmonic chime synthesizer, stereo 432 Hz ambient music engine & French narrator
// Zero external audio files: works 100% offline on PC, Meta Quest Browser & Android APK.

const PLANET_FREQUENCIES: Record<string, number> = {
  sun: 256.0, // C4 philosophical pitch
  moon: 288.0,
  mercury: 320.0,
  venus: 341.3,
  mars: 384.0,
  jupiter: 426.7,
  saturn: 480.0,
  uranus: 512.0,
  neptune: 576.0,
  pluto: 640.0,
  northNode: 360.0,
};

class CelestialAudio {
  private ctx: AudioContext | null = null;
  public enabled = false;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playPlanetChime(planetId: string) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = PLANET_FREQUENCIES[planetId] ?? 320;

    [baseFreq, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(idx === 0 ? 0.06 : 0.02, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);
    });
  }

  public playSoftTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public dispose() {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const celestialAudio = new CelestialAudio();

// ---------------------------------------------------------------------------
// Stereo 432 Hz Celestial Ambient Music Engine (Nocturne, Bols & Piano Céleste)
// ---------------------------------------------------------------------------

export type MusicStyleId = 'nocturne' | 'cosmos' | 'bols';

export interface MusicStyleMeta {
  id: MusicStyleId;
  label: string;
  description: string;
}

export const MUSIC_STYLES: MusicStyleMeta[] = [
  {
    id: 'nocturne',
    label: 'Nocturne Astral',
    description: 'Nappes chaudes, harpe céleste & réverbération spatiale (432 Hz)',
  },
  {
    id: 'cosmos',
    label: 'Piano Céleste',
    description: 'Valse lente feutrée au piano doux sur voile harmonique',
  },
  {
    id: 'bols',
    label: 'Bols & Éther',
    description: 'Bols chantants purs & quintes apaisantes en méditation profonde',
  },
];

function midiTo432Hz(midi: number): number {
  return 432 * Math.pow(2, (midi - 69) / 12);
}

interface ChordBar {
  bass: number; // MIDI note
  pad: number[]; // MIDI notes
  arp: number[]; // MIDI notes for melody / harp / piano
}

const NOCTURNE_PROGRESSION: ChordBar[] = [
  { bass: 38, pad: [50, 57, 64, 65], arp: [62, 65, 69, 72, 76, 72, 69, 65] }, // Dm9
  { bass: 34, pad: [46, 53, 57, 62], arp: [58, 62, 65, 69, 74, 69, 65, 62] }, // Bbmaj7
  { bass: 41, pad: [48, 55, 57, 64], arp: [60, 64, 67, 69, 76, 72, 69, 64] }, // Fmaj9
  { bass: 33, pad: [45, 52, 55, 60], arp: [57, 60, 64, 67, 72, 67, 64, 60] }, // Am7
];

const COSMOS_PIANO_PROGRESSION: ChordBar[] = [
  { bass: 33, pad: [45, 52, 60, 64], arp: [57, 64, 67, 72, 76, 72] }, // Am9 (3/4 feel)
  { bass: 41, pad: [48, 57, 60, 64], arp: [53, 60, 64, 69, 72, 69] }, // Fmaj7
  { bass: 36, pad: [48, 55, 59, 64], arp: [60, 64, 67, 71, 76, 71] }, // Cmaj7
  { bass: 43, pad: [47, 55, 62, 64], arp: [55, 62, 64, 67, 74, 67] }, // G6
];

const BOLS_PROGRESSION: ChordBar[] = [
  { bass: 41, pad: [48, 53, 60, 67], arp: [65, 72, 69, 76] }, // Fmaj9 open fifths
  { bass: 36, pad: [48, 55, 62, 64], arp: [60, 67, 74, 72] }, // Cmaj9
  { bass: 38, pad: [45, 50, 57, 64], arp: [62, 69, 76, 72] }, // Dm9
  { bass: 43, pad: [50, 55, 62, 69], arp: [67, 74, 69, 76] }, // G6sus2
];

function createCosmicReverbImpulse(ctx: AudioContext, seconds = 3.6, decay = 2.6): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.pow(1 - t, decay) * Math.min(1, i / (ctx.sampleRate * 0.04));
      const white = Math.random() * 2 - 1;
      // Gentle single-pole low-pass so reverb tail stays silky and warm
      lp = lp * 0.72 + white * 0.28;
      data[i] = lp * env;
    }
  }
  return impulse;
}

class EsotericAmbientMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private wetBus: GainNode | null = null;
  private delayLeft: DelayNode | null = null;
  private delayRight: DelayNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private barTimerId: number | null = null;
  private noteTimerId: number | null = null;
  private playing = false;
  private ducked = false;
  private style: MusicStyleId = 'nocturne';
  private barIndex = 0;
  private noteStep = 0;
  private activeNodes = new Set<AudioNode>();

  public getStyle(): MusicStyleId {
    return this.style;
  }

  public setStyle(nextStyle: MusicStyleId) {
    if (this.style === nextStyle) return;
    this.style = nextStyle;
    if (this.playing) {
      this.stopTimersOnly();
      this.barIndex = 0;
      this.noteStep = 0;
      this.scheduleCurrentBar();
      this.scheduleNextMelodicStep(180);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  private trackOsc(osc: OscillatorNode, stopAt: number) {
    this.activeNodes.add(osc);
    osc.onended = () => {
      try {
        osc.disconnect();
      } catch {
        // Ignore
      }
      this.activeNodes.delete(osc);
    };
    osc.stop(stopAt);
  }

  public async start(): Promise<boolean> {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }
    if (ctx.state !== 'running') {
      return false;
    }
    if (this.playing) return true;

    this.playing = true;
    this.barIndex = 0;
    this.noteStep = 0;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(this.ducked ? 0.16 : 0.38, now + 1.2);
    master.connect(ctx.destination);
    this.masterGain = master;

    // Warm safety compressor to keep levels silky smooth
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, now);
    compressor.knee.setValueAtTime(18, now);
    compressor.ratio.setValueAtTime(3, now);
    compressor.attack.setValueAtTime(0.02, now);
    compressor.release.setValueAtTime(0.25, now);
    compressor.connect(master);

    const dry = ctx.createGain();
    dry.gain.setValueAtTime(0.75, now);
    dry.connect(compressor);
    this.dryBus = dry;

    // Lush Stereo Space Reverb
    const reverb = ctx.createConvolver();
    reverb.buffer = createCosmicReverbImpulse(ctx, 3.8, 2.5);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(0.65, now);
    reverb.connect(wet);
    wet.connect(compressor);
    this.reverbNode = reverb;
    this.wetBus = wet;

    // Subtle Ping-Pong Warm Tape Echo (feeds into reverb + compressor)
    const dL = ctx.createDelay(2.0);
    const dR = ctx.createDelay(2.0);
    dL.delayTime.setValueAtTime(0.38, now);
    dR.delayTime.setValueAtTime(0.56, now);

    const fbFilter = ctx.createBiquadFilter();
    fbFilter.type = 'lowpass';
    fbFilter.frequency.setValueAtTime(950, now);

    const fbGain = ctx.createGain();
    fbGain.gain.setValueAtTime(0.26, now);

    const echoWet = ctx.createGain();
    echoWet.gain.setValueAtTime(0.28, now);

    dL.connect(dR);
    dR.connect(fbFilter);
    fbFilter.connect(fbGain);
    fbGain.connect(dL);
    dL.connect(echoWet);
    dR.connect(echoWet);
    echoWet.connect(reverb);
    echoWet.connect(compressor);

    this.delayLeft = dL;
    this.delayRight = dR;

    this.scheduleCurrentBar();
    this.scheduleNextMelodicStep(350);

    return true;
  }

  private getProgression(): ChordBar[] {
    if (this.style === 'cosmos') return COSMOS_PIANO_PROGRESSION;
    if (this.style === 'bols') return BOLS_PROGRESSION;
    return NOCTURNE_PROGRESSION;
  }

  private getBarDurationMs(): number {
    if (this.style === 'cosmos') return 5400; // 6 gentle beats of 900ms
    if (this.style === 'bols') return 7200; // slow meditative swell
    return 6400;
  }

  private scheduleCurrentBar() {
    if (!this.playing || !this.ctx || !this.dryBus || !this.reverbNode) return;
    const prog = this.getProgression();
    const chord = prog[this.barIndex % prog.length];
    const barSec = this.getBarDurationMs() / 1000;

    this.playPadChord(chord, barSec);
    this.barIndex = (this.barIndex + 1) % prog.length;

    this.barTimerId = window.setTimeout(() => {
      this.scheduleCurrentBar();
    }, this.getBarDurationMs());
  }

  private playPadChord(chord: ChordBar, durationSec: number) {
    if (!this.ctx || !this.dryBus || !this.reverbNode || !this.playing) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.style === 'bols' ? 520 : 720, now);
    filter.frequency.linearRampToValueAtTime(
      this.style === 'bols' ? 680 : 1080,
      now + durationSec * 0.45
    );
    filter.frequency.linearRampToValueAtTime(520, now + durationSec);
    filter.Q.setValueAtTime(0.7, now);

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(
      this.style === 'cosmos' ? 0.22 : 0.3,
      now + Math.min(2.2, durationSec * 0.34)
    );
    chordGain.gain.linearRampToValueAtTime(0.0001, now + durationSec + 1.1);

    filter.connect(chordGain);
    chordGain.connect(this.dryBus);
    chordGain.connect(this.reverbNode);

    // Warm sub-bass note
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(midiTo432Hz(chord.bass), now);
    bassGain.gain.setValueAtTime(0.28, now);
    bassOsc.connect(bassGain);
    bassGain.connect(chordGain);
    bassOsc.start(now);
    this.trackOsc(bassOsc, now + durationSec + 1.2);

    // Lush chorused stereo pad voices (two softly detuned sines + light triangle warmth)
    chord.pad.forEach((midi, idx) => {
      const freq = midiTo432Hz(midi);
      const panVal = (idx / Math.max(1, chord.pad.length - 1)) * 0.7 - 0.35;
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(panVal, now);
        panner.connect(filter);
      }
      const dest: AudioNode = panner ?? filter;

      [-0.35, 0.35].forEach((detuneCents, pairIdx) => {
        const osc = ctx.createOscillator();
        const vGain = ctx.createGain();
        osc.type = pairIdx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detuneCents * 10, now); // +/- 3.5 cents gentle chorus
        vGain.gain.setValueAtTime(pairIdx === 0 ? 0.13 : 0.045, now);
        osc.connect(vGain);
        vGain.connect(dest);
        osc.start(now);
        this.trackOsc(osc, now + durationSec + 1.25);
      });
    });
  }

  private scheduleNextMelodicStep(initialDelayMs?: number) {
    if (!this.playing) return;
    const stepMs =
      this.style === 'cosmos'
        ? 900
        : this.style === 'bols'
          ? 2400
          : 780;

    this.noteTimerId = window.setTimeout(() => {
      if (!this.playing) return;
      this.triggerMelodicNote();
      this.scheduleNextMelodicStep();
    }, initialDelayMs ?? stepMs);
  }

  private triggerMelodicNote() {
    if (!this.ctx || !this.dryBus || !this.reverbNode || !this.playing) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const prog = this.getProgression();
    // barIndex was already incremented for next bar, so current active bar is (barIndex - 1)
    const activeBarIdx = (this.barIndex - 1 + prog.length) % prog.length;
    const chord = prog[activeBarIdx];
    const midi = chord.arp[this.noteStep % chord.arp.length];
    this.noteStep += 1;

    // Gentle human breathing rest on some beats
    if (this.style === 'nocturne' && this.noteStep % 8 === 0) return;

    const freq = midiTo432Hz(midi);
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      const pan = Math.sin(this.noteStep * 0.75) * 0.48;
      panner.pan.setValueAtTime(pan, now);
      panner.connect(this.dryBus);
      panner.connect(this.reverbNode);
      if (this.delayLeft && this.style !== 'bols') {
        panner.connect(this.delayLeft);
      }
    }
    const target: AudioNode = panner ?? this.reverbNode;

    if (this.style === 'bols') {
      // Pure warm Tibetan singing bowl (no metallic harsh partials)
      [
        { mult: 1, amp: 0.14, attack: 0.25, dur: 5.2 },
        { mult: 2, amp: 0.032, attack: 0.18, dur: 3.4 },
      ].forEach((partial) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * partial.mult, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(partial.amp, now + partial.attack);
        g.gain.exponentialRampToValueAtTime(0.0001, now + partial.dur);
        osc.connect(g);
        g.connect(target);
        osc.start(now);
        this.trackOsc(osc, now + partial.dur + 0.08);
      });
      return;
    }

    if (this.style === 'cosmos') {
      // Mellow felt piano / Rhodes bell tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1900, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + 1.4);
      filter.connect(target);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const env = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.18, now);
      g2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.13, now + 0.018);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      osc1.connect(env);
      osc2.connect(g2);
      g2.connect(env);
      env.connect(filter);

      osc1.start(now);
      osc2.start(now);
      this.trackOsc(osc1, now + 2.7);
      this.trackOsc(osc2, now + 2.7);
      return;
    }

    // Default 'nocturne': Delicate Celestial Harp / Celesta pluck
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(620, now + 1.8);
    filter.connect(target);

    const oscMain = ctx.createOscillator();
    const oscOver = ctx.createOscillator();
    const gMain = ctx.createGain();
    const gOver = ctx.createGain();

    oscMain.type = 'sine';
    oscMain.frequency.setValueAtTime(freq, now);
    oscOver.type = 'sine';
    oscOver.frequency.setValueAtTime(freq * 2, now);

    gMain.gain.setValueAtTime(0.0001, now);
    gMain.gain.linearRampToValueAtTime(0.12, now + 0.025);
    gMain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);

    gOver.gain.setValueAtTime(0.0001, now);
    gOver.gain.linearRampToValueAtTime(0.032, now + 0.015);
    gOver.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    oscMain.connect(gMain);
    oscOver.connect(gOver);
    gMain.connect(filter);
    gOver.connect(filter);

    oscMain.start(now);
    oscOver.start(now);
    this.trackOsc(oscMain, now + 3.2);
    this.trackOsc(oscOver, now + 1.2);
  }

  private stopTimersOnly() {
    if (this.barTimerId !== null) {
      window.clearTimeout(this.barTimerId);
      this.barTimerId = null;
    }
    if (this.noteTimerId !== null) {
      window.clearTimeout(this.noteTimerId);
      this.noteTimerId = null;
    }
  }

  public setDucked(duck: boolean) {
    this.ducked = duck;
    if (this.ctx && this.masterGain && this.playing) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(duck ? 0.16 : 0.38, now + 0.45);
    }
  }

  public stop() {
    this.playing = false;
    this.stopTimersOnly();

    const ctx = this.ctx;
    const master = this.masterGain;
    const nodes = Array.from(this.activeNodes);
    const reverb = this.reverbNode;
    const dL = this.delayLeft;
    const dR = this.delayRight;
    const dry = this.dryBus;
    const wet = this.wetBus;

    this.activeNodes.clear();
    this.masterGain = null;
    this.reverbNode = null;
    this.delayLeft = null;
    this.delayRight = null;
    this.dryBus = null;
    this.wetBus = null;

    if (ctx && master) {
      const now = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.001), now);
        master.gain.linearRampToValueAtTime(0.0001, now + 0.45);
      } catch {
        // Ignore gain automation errors
      }
      window.setTimeout(() => {
        nodes.forEach((n) => {
          try {
            if ('stop' in n && typeof (n as OscillatorNode).stop === 'function') {
              (n as OscillatorNode).stop();
            }
            n.disconnect();
          } catch {
            // Already stopped
          }
        });
        [dL, dR, reverb, dry, wet, master].forEach((n) => {
          try {
            n?.disconnect();
          } catch {
            // Already disconnected
          }
        });
      }, 500);
    }
  }

  public isPlaying(): boolean {
    return this.playing;
  }
}

export const esotericIntroMusic = new EsotericAmbientMusic();

// ---------------------------------------------------------------------------
// Guided French Voice Narration for Uranie VR Introduction & Interactive Help
// ---------------------------------------------------------------------------

export interface IntroNarrationChapter {
  id: string;
  title: string;
  shortLabel: string;
  text: string;
}

export const INTRO_NARRATION_CHAPTERS: IntroNarrationChapter[] = [
  {
    id: 'welcome',
    title: '1. Bienvenue dans Uranie VR',
    shortLabel: 'Accueil',
    text: 'Bienvenue dans Uranie VR, votre observatoire astrologique et astronomique immersif. Tous les calculs planétaires s’effectuent localement, avec une précision astronomique et même hors-ligne, sur PC comme sur casque Meta Quest.',
  },
  {
    id: 'natal',
    title: '2. Thème Natal & Ascendant seul',
    shortLabel: 'Thème & Ascendant',
    text: 'Dans l’onglet Thème Natal, saisissez simplement un prénom, la date, l’heure exacte et le lieu de naissance par code postal ou ville. Vous pouvez aussi utiliser le calculateur d’Ascendant seul pour connaître instantanément l’Ascendant, le Descendant, le Milieu du Ciel et le créneau horaire exact du signe.',
  },
  {
    id: 'cycles',
    title: '3. Transits, Révolution Solaire & Comparatifs',
    shortLabel: 'Cycles & Transits',
    text: 'Explorez neuf modes d’analyse : le thème natal, le ciel en direct, les transits animés dans le temps, la révolution solaire avec lieu d’anniversaire personnalisable, la révolution lunaire, les progressions secondaires, la synastrie, le thème composite et le comparatif en double roue.',
  },
  {
    id: 'views',
    title: '4. Vue 2D PC, Sphère 3D & Animations célestes',
    shortLabel: '2D, 3D & Ciel',
    text: 'Depuis l’onglet Réglages ou la barre supérieure, basculez à tout moment entre la sphère 3D et la carte 2D spéciale PC offrant huit styles de roues et trois orientations. Personnalisez les traditions occidentale ou chinoise, ainsi que les étoiles filantes, nébuleuses et aurores boréales animées dans le ciel.',
  },
  {
    id: 'vr-share',
    title: '5. Casque Quest, Interprétations, PDF & Aide',
    shortLabel: 'VR, PDF & Aide',
    text: 'Cliquez sur n’importe quelle planète, maison ou aspect pour lire son interprétation détaillée, puis exportez votre thème complet en PDF ou par lien partagé. En casque Meta Quest, lancez la VR à 360 degrés ou la Réalité Mixte dans votre salon. À tout instant, ouvrez l’onglet Aide interactive pour être guidé pas à pas.',
  },
];

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const frenchVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
  if (!frenchVoices.length) return null;

  const preferredKeywords = ['natural', 'neural', 'google', 'denise', 'henri', 'thomas', 'hortense', 'amelie', 'paul'];
  for (const kw of preferredKeywords) {
    const match = frenchVoices.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }
  return frenchVoices.find((v) => v.lang.toLowerCase() === 'fr-fr') ?? frenchVoices[0];
}

export function speakSingleFrenchUtterance(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const frVoice = pickFrenchVoice();
    if (frVoice) {
      utter.voice = frVoice;
      utter.lang = frVoice.lang;
    } else {
      utter.lang = 'fr-FR';
    }
    utter.rate = options?.rate ?? 0.96;
    utter.pitch = options?.pitch ?? 0.98;
    utter.volume = 1.0;

    if (options?.onStart) utter.onstart = options.onStart;
    if (options?.onEnd) utter.onend = options.onEnd;
    if (options?.onError) utter.onerror = () => options.onError?.();

    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopFrenchSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore speech synthesis cancellation errors
  }
}
