import * as Astronomy from 'astronomy-engine';
import {
  AstroChart,
  findHouseForLongitude,
  formatDegreeInSign,
  normalizeDeg,
  ZODIAC_SIGNS,
} from './astroEngine';

export type LunarPhaseId =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'balsamic';

export interface LunarPhaseProfile {
  id: LunarPhaseId;
  name: string;
  archetype: string;
  interpretation: string;
  guidance: string;
  isWaxing: boolean;
}

export interface LunarMilestoneEvent {
  kind: 'new_moon' | 'full_moon';
  label: string;
  date: Date;
  daysFromNow: number;
  longitude: number;
  signName: string;
  signSymbol: string;
  degFormatted: string;
  natalHouse: number;
  natalHouseRoman: string;
}

export interface LunarCycleSnapshot {
  date: Date;
  phaseAngleDeg: number; // 0..360 (0 = New, 90 = 1st Qtr, 180 = Full, 270 = Last Qtr)
  illuminationPercent: number; // 0..100
  lunarAgeDays: number; // 0..29.53
  synodicCycleDays: number;
  currentMoonLon: number;
  currentSignName: string;
  currentSignSymbol: string;
  currentDegFormatted: string;
  currentNatalHouse: number;
  currentNatalHouseRoman: string;
  phase: LunarPhaseProfile;
  nextNewMoon: LunarMilestoneEvent;
  nextFullMoon: LunarMilestoneEvent;
}

const SYNODIC_MONTH_DAYS = 29.530588853;

const LUNAR_PHASES: Array<{
  id: LunarPhaseId;
  minDeg: number;
  maxDeg: number;
  name: string;
  archetype: string;
  isWaxing: boolean;
  interpretation: string;
  guidance: string;
}> = [
  {
    id: 'new_moon',
    minDeg: 0,
    maxDeg: 45,
    name: 'Nouvelle Lune',
    archetype: 'Impulsion & Semence',
    isWaxing: true,
    interpretation:
      'Le Soleil et la Lune unissent leurs rayonnements dans le même secteur du ciel : c’est un point zéro fertile, propice aux commencements discrets et aux intentions claires.',
    guidance:
      'Formulez un projet neuf et posez les premières fondations sans chercher de validation immédiate.',
  },
  {
    id: 'waxing_crescent',
    minDeg: 45,
    maxDeg: 90,
    name: 'Premier Croissant',
    archetype: 'Émergence & Élan',
    isWaxing: true,
    interpretation:
      'La lumière lunaire s’affirme hors de l’ombre solaire : les idées semées à la Nouvelle Lune prennent forme malgré les premières résistances d’inertie.',
    guidance:
      'Mobilisez votre curiosité, réunissez vos ressources et engagez des démarches concrètes.',
  },
  {
    id: 'first_quarter',
    minDeg: 90,
    maxDeg: 135,
    name: 'Premier Quartier',
    archetype: 'Action & Décision',
    isWaxing: true,
    interpretation:
      'Phase de quadrature dynamique : une tension constructive pousse à trancher, ajuster votre trajectoire et transformer une intention en acte tangible.',
    guidance:
      'Prenez une décision franche sur un dossier en cours et dépassez les hésitations.',
  },
  {
    id: 'waxing_gibbous',
    minDeg: 135,
    maxDeg: 180,
    name: 'Gibbeuse Croissante',
    archetype: 'Maturation & Perfectionnement',
    isWaxing: true,
    interpretation:
      'L’énergie approche de son apogée : il s’agit d’affiner les détails, d’analyser ce qui fonctionne et de préparer la pleine visibilité à venir.',
    guidance:
      'Peaufinez votre travail, corrigez les derniers réglages et restez attentif aux signaux extérieurs.',
  },
  {
    id: 'full_moon',
    minDeg: 180,
    maxDeg: 225,
    name: 'Pleine Lune',
    archetype: 'Culmination & Illumination',
    isWaxing: false,
    interpretation:
      'Opposition exacte Soleil-Lune : ce qui était latent devient manifeste. La sensibilité, la lucidité relationnelle et les résultats d’un cycle atteignent leur sommet.',
    guidance:
      'Accueillez les révélations avec recul et célébrez l’aboutissement avant d’amorcer le tri.',
  },
  {
    id: 'waning_gibbous',
    minDeg: 225,
    maxDeg: 270,
    name: 'Gibbeuse Décroissante',
    archetype: 'Partage & Transmission',
    isWaxing: false,
    interpretation:
      'Après la pleine lumière, le cycle entre dans sa phase disséminatrice : l’expérience acquise demande à être comprise, exprimée et transmise autour de vous.',
    guidance:
      'Partagez vos découvertes, enseignez, dialoguez et tirez les enseignements concrets du cycle.',
  },
  {
    id: 'last_quarter',
    minDeg: 270,
    maxDeg: 315,
    name: 'Dernier Quartier',
    archetype: 'Tri & Réorientation',
    isWaxing: false,
    interpretation:
      'Quadrature décroissante de discernement : il est temps de clore ce qui a fait son œuvre, de libérer les engagements obsolètes et de préparer le renouveau.',
    guidance:
      'Allégez votre emploi du temps et clôturez proprement les tâches arrivées à terme.',
  },
  {
    id: 'balsamic',
    minDeg: 315,
    maxDeg: 360,
    name: 'Lune Balsamique',
    archetype: 'Lâcher-prise & Gestation',
    isWaxing: false,
    interpretation:
      'Derniers jours avant le renouvellement : l’énergie se retire vers l’intérieur pour favoriser l’intuition, le repos créatif et la synthèse silencieuse.',
    guidance:
      'Privilégiez le calme, le bilan intérieur et laissez mûrir les prémices du prochain cycle.',
  },
];

function buildMilestoneEvent(
  kind: 'new_moon' | 'full_moon',
  eventDate: Date,
  anchorDate: Date,
  natalChart: AstroChart
): LunarMilestoneEvent {
  const moonLon = normalizeDeg(Astronomy.EclipticGeoMoon(eventDate).lon);
  const { sign, formattedDeg } = formatDegreeInSign(moonLon);
  const natalHouse = findHouseForLongitude(moonLon, natalChart.houses);
  const roman = natalChart.houses[natalHouse - 1]?.roman ?? String(natalHouse);
  const daysFromNow = (eventDate.getTime() - anchorDate.getTime()) / 86_400_000;

  return {
    kind,
    label: kind === 'new_moon' ? 'Prochaine Nouvelle Lune' : 'Prochaine Pleine Lune',
    date: eventDate,
    daysFromNow,
    longitude: moonLon,
    signName: sign.name,
    signSymbol: sign.symbol,
    degFormatted: formattedDeg,
    natalHouse,
    natalHouseRoman: roman,
  };
}

export function calculateLunarCycleSnapshot(
  anchorDate: Date,
  natalChart: AstroChart
): LunarCycleSnapshot {
  const phaseAngleDeg = normalizeDeg(Astronomy.MoonPhase(anchorDate));
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, anchorDate);
  const illuminationPercent = Math.round(Math.max(0, Math.min(1, illum.phase_fraction)) * 100);

  // Previous New Moon for accurate lunar age in days
  const prevNew = Astronomy.SearchMoonPhase(0, anchorDate, -35);
  const lunarAgeDays = prevNew
    ? Math.max(0, Math.min(SYNODIC_MONTH_DAYS, (anchorDate.getTime() - prevNew.date.getTime()) / 86_400_000))
    : (phaseAngleDeg / 360) * SYNODIC_MONTH_DAYS;

  // Next New Moon & Next Full Moon (search forward slightly beyond 0 so exact boundary advances)
  const searchStart = new Date(anchorDate.getTime() + 60_000);
  const nextNewTime = Astronomy.SearchMoonPhase(0, searchStart, 35);
  const nextFullTime = Astronomy.SearchMoonPhase(180, searchStart, 35);

  const fallbackNew = new Date(
    anchorDate.getTime() + (((360 - phaseAngleDeg) / 360) * SYNODIC_MONTH_DAYS) * 86_400_000
  );
  const fallbackFull = new Date(
    anchorDate.getTime() + ((normalizeDeg(180 - phaseAngleDeg) / 360) * SYNODIC_MONTH_DAYS) * 86_400_000
  );

  const nextNewMoon = buildMilestoneEvent(
    'new_moon',
    nextNewTime?.date ?? fallbackNew,
    anchorDate,
    natalChart
  );
  const nextFullMoon = buildMilestoneEvent(
    'full_moon',
    nextFullTime?.date ?? fallbackFull,
    anchorDate,
    natalChart
  );

  const currentMoonLon = normalizeDeg(Astronomy.EclipticGeoMoon(anchorDate).lon);
  const { sign: curSign, formattedDeg: curFormatted } = formatDegreeInSign(currentMoonLon);
  const currentNatalHouse = findHouseForLongitude(currentMoonLon, natalChart.houses);
  const currentNatalHouseRoman = natalChart.houses[currentNatalHouse - 1]?.roman ?? String(currentNatalHouse);

  const matchedPhase =
    LUNAR_PHASES.find((p) => phaseAngleDeg >= p.minDeg && phaseAngleDeg < p.maxDeg) ??
    LUNAR_PHASES[0];

  // Guarantee valid sign lookup fallback
  const safeSign = curSign ?? ZODIAC_SIGNS[0];

  return {
    date: anchorDate,
    phaseAngleDeg,
    illuminationPercent,
    lunarAgeDays,
    synodicCycleDays: SYNODIC_MONTH_DAYS,
    currentMoonLon,
    currentSignName: safeSign.name,
    currentSignSymbol: safeSign.symbol,
    currentDegFormatted: curFormatted,
    currentNatalHouse,
    currentNatalHouseRoman,
    phase: {
      id: matchedPhase.id,
      name: matchedPhase.name,
      archetype: matchedPhase.archetype,
      interpretation: matchedPhase.interpretation,
      guidance: matchedPhase.guidance,
      isWaxing: matchedPhase.isWaxing,
    },
    nextNewMoon,
    nextFullMoon,
  };
}
