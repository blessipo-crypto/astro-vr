// Procedural celestial harmonic chime synthesizer + esoteric ambient intro music + French voice narrator
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
      gain.gain.exponentialRampToValueAtTime(idx === 0 ? 0.07 : 0.025, now + 0.04);
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
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
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
// Esoteric Cosmic Ambient Music Engine (432 Hz / 136.1 Hz Om-tuned soundscape)
// ---------------------------------------------------------------------------

// Mystical Lydian/Harmonic frequencies tuned to cosmic 136.1 Hz (Earth Year "Om")
const ESOTERIC_CHIME_NOTES = [
  272.2, // C#4 (Om octave)
  342.9, // F4
  407.8, // G#4 (fifth)
  457.8, // A#4
  514.0, // C5 (Lydian shimmer)
  544.4, // C#5
  685.9, // F5
  815.7, // G#5
];

class EsotericAmbientMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private lfoOsc: OscillatorNode | null = null;
  private chimeTimerId: number | null = null;
  private playing = false;
  private ducked = false;
  private chimeStep = 0;

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
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(this.ducked ? 0.14 : 0.28, now + 1.4);
    master.connect(ctx.destination);
    this.masterGain = master;

    // Warm breathing lowpass filter for cosmic pad
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(1.4, now);
    filter.connect(master);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.065, now); // slow meditative breath
    lfoGain.gain.setValueAtTime(180, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    this.lfoOsc = lfo;

    // Sacred harmonic pad (Om 136.1 Hz + sub 68.05 Hz + fifth 204.15 Hz + detuned shimmer)
    const padDefs: Array<{ freq: number; type: OscillatorType; gain: number }> = [
      { freq: 68.05, type: 'sine', gain: 0.24 },
      { freq: 136.1, type: 'sine', gain: 0.28 },
      { freq: 136.65, type: 'triangle', gain: 0.08 }, // subtle cosmic beating
      { freq: 204.15, type: 'sine', gain: 0.14 },
      { freq: 272.2, type: 'sine', gain: 0.06 },
      { freq: 407.8, type: 'sine', gain: 0.03 },
    ];

    this.padOscs = padDefs.map((def) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = def.type;
      osc.frequency.setValueAtTime(def.freq, now);
      oscGain.gain.setValueAtTime(def.gain, now);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      return osc;
    });

    // Subtle singing-bowl / crystal arpeggio chimes
    const scheduleNextChime = () => {
      if (!this.playing || !this.ctx || !this.masterGain) return;
      this.triggerCrystalChime();
      const delayMs = 2100 + Math.floor(Math.random() * 1900);
      this.chimeTimerId = window.setTimeout(scheduleNextChime, delayMs);
    };
    this.chimeTimerId = window.setTimeout(scheduleNextChime, 450);

    return true;
  }

  private triggerCrystalChime() {
    if (!this.ctx || !this.masterGain || !this.playing) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const pattern = [0, 2, 4, 1, 5, 3, 6, 4];
    const idx = pattern[this.chimeStep % pattern.length];
    this.chimeStep += 1;
    const freq = ESOTERIC_CHIME_NOTES[idx] ?? 407.8;

    // Singing bowl fundamental + inharmonic partial
    [
      { f: freq, amp: 0.12, dur: 4.4, type: 'sine' as OscillatorType },
      { f: freq * 2.0, amp: 0.045, dur: 3.1, type: 'sine' as OscillatorType },
      { f: freq * 2.756, amp: 0.016, dur: 1.8, type: 'triangle' as OscillatorType },
    ].forEach((voice) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = voice.type;
      osc.frequency.setValueAtTime(voice.f, now);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(voice.amp, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + voice.dur);

      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + voice.dur + 0.05);
    });
  }

  public setDucked(duck: boolean) {
    this.ducked = duck;
    if (this.ctx && this.masterGain && this.playing) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(duck ? 0.13 : 0.28, now + 0.45);
    }
  }

  public stop() {
    this.playing = false;
    if (this.chimeTimerId !== null) {
      window.clearTimeout(this.chimeTimerId);
      this.chimeTimerId = null;
    }

    const ctx = this.ctx;
    const master = this.masterGain;
    const oscs = [...this.padOscs];
    const lfo = this.lfoOsc;
    this.padOscs = [];
    this.lfoOsc = null;
    this.masterGain = null;

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
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {
            // Already stopped
          }
        });
        if (lfo) {
          try {
            lfo.stop();
            lfo.disconnect();
          } catch {
            // Already stopped
          }
        }
        try {
          master.disconnect();
        } catch {
          // Already disconnected
        }
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
