export type SplashMovementId =
  | 'awakening'
  | 'sacred_geometry'
  | 'identity_core'
  | 'call_to_journey';

export interface SplashMovementSpec {
  id: SplashMovementId;
  roman: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  startSec: number;
  endSec: number;
  kenBurnsScale: [number, number];
  nebulaOpacity: [number, number];
}

export const COSMIC_SPLASH_DURATION_SEC = 100;

export const SPLASH_TIMELINE: SplashMovementSpec[] = [
  {
    id: 'awakening',
    roman: 'I',
    title: "L'Éveil du Cosmos",
    shortTitle: 'Éveil',
    subtitle: 'Nuit étoilée, nébuleuse profonde & premier cercle d’or',
    startSec: 0,
    endSec: 20,
    kenBurnsScale: [1.0, 1.05],
    nebulaOpacity: [0.0, 0.65],
  },
  {
    id: 'sacred_geometry',
    roman: 'II',
    title: 'La Géométrie Sacrée et l’Astrologie',
    shortTitle: 'Géométrie',
    subtitle: 'Zodiaque stylisé, hexagramme d’aspects, shimmer & constellations',
    startSec: 20,
    endSec: 50,
    kenBurnsScale: [1.05, 1.11],
    nebulaOpacity: [0.65, 0.72],
  },
  {
    id: 'identity_core',
    roman: 'III',
    title: "Le Cœur de l'Expérience",
    shortTitle: 'Identité',
    subtitle: 'Sceau lunaire & œil céleste, signature serif & ondes dorées',
    startSec: 50,
    endSec: 80,
    kenBurnsScale: [1.11, 1.16],
    nebulaOpacity: [0.72, 0.6],
  },
  {
    id: 'call_to_journey',
    roman: 'IV',
    title: "L'Appel au Voyage",
    shortTitle: 'Voyage',
    subtitle: 'Apaisement lumineux & seuil d’entrée vers votre univers',
    startSec: 80,
    endSec: 100,
    kenBurnsScale: [1.16, 1.18],
    nebulaOpacity: [0.6, 0.42],
  },
];

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp01(t);

export const easeOutExpo = (t: number): number => {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

export const easeInOutSine = (t: number): number => {
  const x = clamp01(t);
  return -(Math.cos(Math.PI * x) - 1) / 2;
};

export const phaseProgress = (tSec: number, startSec: number, endSec: number): number =>
  clamp01((tSec - startSec) / Math.max(0.001, endSec - startSec));

export function formatTimecode(sec: number): string {
  const clamped = Math.max(0, Math.min(COSMIC_SPLASH_DURATION_SEC, Math.floor(sec)));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getMovementAtTime(tSec: number): SplashMovementSpec {
  for (const m of SPLASH_TIMELINE) {
    if (tSec < m.endSec) return m;
  }
  return SPLASH_TIMELINE[SPLASH_TIMELINE.length - 1];
}

export interface SplashFrameState {
  tSec: number;
  movement: SplashMovementSpec;
  kenBurnsScale: number;
  nebulaOpacity: number;
  starfieldOpacity: number;
  particleSpeedMult: number;
  outerCircleDraw: number;
  outerRingDraw: number;
  zodiacTicksDraw: number;
  sacredGeoDraw: number;
  constellationDraw: number;
  geometryOpacity: number;
  breathFactor: number;
  shimmerPhase: number;
  sealDraw: number;
  sealAuraOpacity: number;
  titleReveal: number;
  titleLetterSpacingEm: number;
  wave1Progress: number;
  wave2Progress: number;
  dimOverlayOpacity: number;
  ctaReveal: number;
}

export function computeSplashFrame(tSec: number): SplashFrameState {
  const t = Math.max(0, Math.min(COSMIC_SPLASH_DURATION_SEC, tSec));
  const movement = getMovementAtTime(t);
  const movProg = phaseProgress(t, movement.startSec, movement.endSec);

  const kenBurnsScale = lerp(movement.kenBurnsScale[0], movement.kenBurnsScale[1], movProg);
  const nebulaOpacity = lerp(
    movement.nebulaOpacity[0],
    movement.nebulaOpacity[1],
    easeInOutSine(movProg)
  );
  const starfieldOpacity = lerp(0.15, 1.0, easeInOutSine(phaseProgress(t, 0, 10)));

  const particleSpeedMult =
    t >= 80 ? lerp(1.0, 0.35, easeInOutSine(phaseProgress(t, 80, 92))) : 1.0;

  // Movement I: minimalist golden circle 0:08 -> 0:20
  const outerCircleDraw = easeInOutSine(phaseProgress(t, 8, 20));

  // Movement II: dual ring + 12 zodiac divisions + sacred geometry + constellations
  const outerRingDraw = easeInOutSine(phaseProgress(t, 20, 29));
  const zodiacTicksDraw = easeOutExpo(phaseProgress(t, 21, 31));
  const sacredGeoDraw = easeInOutSine(phaseProgress(t, 28, 42));
  const constellationDraw = easeInOutSine(phaseProgress(t, 40, 50));

  let geometryOpacity = 1.0;
  if (t < 8) {
    geometryOpacity = 0;
  } else if (t < 20) {
    geometryOpacity = lerp(0.4, 0.9, phaseProgress(t, 8, 20));
  } else if (t >= 50 && t < 64) {
    geometryOpacity = lerp(0.95, 0.3, easeInOutSine(phaseProgress(t, 50, 64)));
  } else if (t >= 64 && t < 80) {
    geometryOpacity = 0.3;
  } else if (t >= 80) {
    geometryOpacity = lerp(0.3, 0.2, easeInOutSine(phaseProgress(t, 80, 90)));
  }

  // 8-second gentle breathing glow (0.125 Hz)
  const breathFactor = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 8 - Math.PI / 2);
  const shimmerPhase = phaseProgress(t, 30, 54);

  // Movement III: Central mystic seal + serif identity + dissipative waves
  const sealDraw = easeInOutSine(phaseProgress(t, 50, 63));
  const sealAuraOpacity =
    t < 52
      ? 0
      : t < 80
        ? lerp(0, 1, easeInOutSine(phaseProgress(t, 52, 66)))
        : lerp(1, 0.55, easeInOutSine(phaseProgress(t, 80, 92)));

  const titleReveal = easeOutExpo(phaseProgress(t, 58, 70));
  const titleLetterSpacingEm = lerp(0.18, 0.36, easeOutExpo(phaseProgress(t, 58, 74)));

  const wave1Progress = phaseProgress(t, 68, 77);
  const wave2Progress = phaseProgress(t, 72.5, 81.5);

  // Movement IV: subtle darkening & "Entrer dans votre univers"
  const dimOverlayOpacity = lerp(0, 0.34, easeInOutSine(phaseProgress(t, 80, 89)));
  const ctaReveal = easeOutExpo(phaseProgress(t, 84, 94));

  return {
    tSec: t,
    movement,
    kenBurnsScale,
    nebulaOpacity,
    starfieldOpacity,
    particleSpeedMult,
    outerCircleDraw,
    outerRingDraw,
    zodiacTicksDraw,
    sacredGeoDraw,
    constellationDraw,
    geometryOpacity,
    breathFactor,
    shimmerPhase,
    sealDraw,
    sealAuraOpacity,
    titleReveal,
    titleLetterSpacingEm,
    wave1Progress,
    wave2Progress,
    dimOverlayOpacity,
    ctaReveal,
  };
}
