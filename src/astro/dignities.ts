// Hellenistic & Renaissance Essential Dignity Rings:
// 1. Decans (36 × 10° Chaldean / Triplicity rulers)
// 2. Egyptian Terms & Ptolemaic Terms (60 bounds)
// 3. Dodecatemoria / Twelfth Parts (144 × 2.5° micro-signs)

import { ElementType, ZODIAC_SIGNS } from './astroEngine';

export interface TermBound {
  startDeg: number; // inclusive 0..30
  endDeg: number; // exclusive 0..30
  rulerId: 'jupiter' | 'venus' | 'mercury' | 'mars' | 'saturn';
  rulerSymbol: string;
  rulerName: string;
  color: string;
}

export type TermSystem = 'egyptian' | 'ptolemaic';

const RULER_META: Record<
  TermBound['rulerId'],
  { symbol: string; name: string; color: string }
> = {
  jupiter: { symbol: '♃\uFE0E', name: 'Jupiter', color: '#fbbf24' },
  venus: { symbol: '♀\uFE0E', name: 'Vénus', color: '#f472b6' },
  mercury: { symbol: '☿', name: 'Mercure', color: '#38bdf8' },
  mars: { symbol: '♂\uFE0E', name: 'Mars', color: '#f87171' },
  saturn: { symbol: '♄\uFE0E', name: 'Saturne', color: '#a78bfa' },
};

// Classic Egyptian Terms (Dorotheus / Paulus Alexandrinus)
const EGYPTIAN_RAW: Array<Array<[TermBound['rulerId'], number]>> = [
  [['jupiter', 6], ['venus', 12], ['mercury', 20], ['mars', 25], ['saturn', 30]], // Bélier
  [['venus', 8], ['mercury', 14], ['jupiter', 22], ['saturn', 27], ['mars', 30]], // Taureau
  [['mercury', 6], ['jupiter', 12], ['venus', 17], ['mars', 24], ['saturn', 30]], // Gémeaux
  [['mars', 7], ['venus', 13], ['mercury', 19], ['jupiter', 26], ['saturn', 30]], // Cancer
  [['jupiter', 6], ['venus', 11], ['saturn', 18], ['mercury', 24], ['mars', 30]], // Lion
  [['mercury', 7], ['venus', 17], ['jupiter', 21], ['mars', 28], ['saturn', 30]], // Vierge
  [['saturn', 6], ['mercury', 14], ['jupiter', 21], ['venus', 28], ['mars', 30]], // Balance
  [['mars', 7], ['venus', 11], ['mercury', 19], ['jupiter', 24], ['saturn', 30]], // Scorpion
  [['jupiter', 12], ['venus', 17], ['mercury', 21], ['saturn', 26], ['mars', 30]], // Sagittaire
  [['mercury', 7], ['jupiter', 14], ['venus', 22], ['saturn', 26], ['mars', 30]], // Capricorne
  [['mercury', 7], ['venus', 13], ['jupiter', 20], ['mars', 25], ['saturn', 30]], // Verseau
  [['venus', 12], ['jupiter', 16], ['mercury', 19], ['mars', 28], ['saturn', 30]], // Poissons
];

// Classic Ptolemaic Terms (Tetrabiblos)
const PTOLEMAIC_RAW: Array<Array<[TermBound['rulerId'], number]>> = [
  [['jupiter', 6], ['venus', 14], ['mercury', 21], ['mars', 26], ['saturn', 30]], // Bélier
  [['venus', 8], ['mercury', 15], ['jupiter', 22], ['saturn', 26], ['mars', 30]], // Taureau
  [['mercury', 7], ['jupiter', 14], ['venus', 21], ['saturn', 25], ['mars', 30]], // Gémeaux
  [['mars', 6], ['jupiter', 13], ['mercury', 20], ['venus', 27], ['saturn', 30]], // Cancer
  [['saturn', 6], ['mercury', 13], ['venus', 19], ['jupiter', 25], ['mars', 30]], // Lion
  [['mercury', 7], ['venus', 13], ['jupiter', 18], ['saturn', 24], ['mars', 30]], // Vierge
  [['saturn', 6], ['venus', 11], ['jupiter', 19], ['mercury', 24], ['mars', 30]], // Balance
  [['mars', 6], ['jupiter', 14], ['venus', 21], ['mercury', 27], ['saturn', 30]], // Scorpion
  [['jupiter', 8], ['venus', 14], ['mercury', 19], ['saturn', 25], ['mars', 30]], // Sagittaire
  [['venus', 6], ['mercury', 12], ['jupiter', 19], ['mars', 25], ['saturn', 30]], // Capricorne
  [['saturn', 6], ['mercury', 12], ['venus', 20], ['jupiter', 25], ['mars', 30]], // Verseau
  [['venus', 8], ['jupiter', 14], ['mercury', 20], ['mars', 26], ['saturn', 30]], // Poissons
];

function compileTerms(raw: Array<Array<[TermBound['rulerId'], number]>>): TermBound[][] {
  return raw.map((signTerms) => {
    let prev = 0;
    return signTerms.map(([rulerId, endDeg]) => {
      const meta = RULER_META[rulerId];
      const item: TermBound = {
        startDeg: prev,
        endDeg,
        rulerId,
        rulerSymbol: meta.symbol,
        rulerName: meta.name,
        color: meta.color,
      };
      prev = endDeg;
      return item;
    });
  });
}

export const EGYPTIAN_TERMS = compileTerms(EGYPTIAN_RAW);
export const PTOLEMAIC_TERMS = compileTerms(PTOLEMAIC_RAW);

export function getSignTerms(signIndex: number, system: TermSystem = 'egyptian'): TermBound[] {
  const idx = ((signIndex % 12) + 12) % 12;
  return system === 'ptolemaic' ? PTOLEMAIC_TERMS[idx] : EGYPTIAN_TERMS[idx];
}

export function getTermAtDegree(
  signIndex: number,
  degInSign: number,
  system: TermSystem = 'egyptian'
): TermBound {
  const list = getSignTerms(signIndex, system);
  const d = Math.max(0, Math.min(29.999, degInSign));
  return list.find((t) => d >= t.startDeg && d < t.endDeg) ?? list[list.length - 1];
}

// Chaldean Decan Rulers (10° faces, descending planetary order from 0° Aries = Mars)
const CHALDEAN_ORDER: Array<{ id: string; symbol: string; name: string }> = [
  { id: 'mars', symbol: '♂\uFE0E', name: 'Mars' },
  { id: 'sun', symbol: '☉', name: 'Soleil' },
  { id: 'venus', symbol: '♀\uFE0E', name: 'Vénus' },
  { id: 'mercury', symbol: '☿', name: 'Mercure' },
  { id: 'moon', symbol: '☽', name: 'Lune' },
  { id: 'saturn', symbol: '♄\uFE0E', name: 'Saturne' },
  { id: 'jupiter', symbol: '♃\uFE0E', name: 'Jupiter' },
];

export interface DecanBand {
  decanIndex: number; // 0..35
  signIndex: number;
  subIndex: 0 | 1 | 2;
  startLon: number;
  endLon: number;
  chaldeanRuler: { id: string; symbol: string; name: string };
  triplicitySign: string;
}

export const ALL_36_DECANS: DecanBand[] = Array.from({ length: 36 }, (_, idx) => {
  const signIndex = Math.floor(idx / 3);
  const subIndex = (idx % 3) as 0 | 1 | 2;
  const chaldeanRuler = CHALDEAN_ORDER[idx % 7];
  const triplicitySign = ZODIAC_SIGNS[(signIndex + subIndex * 4) % 12].name;
  return {
    decanIndex: idx,
    signIndex,
    subIndex,
    startLon: idx * 10,
    endLon: (idx + 1) * 10,
    chaldeanRuler,
    triplicitySign,
  };
});

/**
 * Twelfth Parts (Dodécatémories / Dwad):
 * Divides each 30° sign into 12 × 2.5° micro-sectors starting from the sign itself.
 */
export interface DodecatemorionCell {
  step: number; // 0..11
  startDeg: number; // within sign (0..30)
  endDeg: number;
  startLon: number; // 0..360
  endLon: number;
  microSignIndex: number;
  microSignSymbol: string;
  microSignName: string;
  microElement: ElementType;
}

export function getSignDodecatemoria(signIndex: number): DodecatemorionCell[] {
  const sIdx = ((signIndex % 12) + 12) % 12;
  return Array.from({ length: 12 }, (_, step) => {
    const microSignIndex = (sIdx + step) % 12;
    const microSign = ZODIAC_SIGNS[microSignIndex];
    const startDeg = step * 2.5;
    const endDeg = (step + 1) * 2.5;
    return {
      step,
      startDeg,
      endDeg,
      startLon: sIdx * 30 + startDeg,
      endLon: sIdx * 30 + endDeg,
      microSignIndex,
      microSignSymbol: microSign.symbol,
      microSignName: microSign.name,
      microElement: microSign.element,
    };
  });
}

export function getDodecatemorionForLongitude(longitude: number): DodecatemorionCell {
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degInSign = norm - signIndex * 30;
  const step = Math.min(11, Math.floor(degInSign / 2.5));
  return getSignDodecatemoria(signIndex)[step];
}
