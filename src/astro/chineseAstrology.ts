import { AstroChart, normalizeDeg, PlanetId } from './astroEngine';

export type ZodiacTradition = 'western' | 'chinese';
export type WuXingElement = 'Bois' | 'Feu' | 'Terre' | 'Métal' | 'Eau';
export type Polarity = 'Yang' | 'Yin';

export interface ChineseSign {
  westernIndex: number; // 0 = Bélier .. 11 = Poissons
  branchIndex: number; // 0 = Rat .. 11 = Cochon
  name: string;
  hanzi: string;
  branchHanzi: string;
  pinyin: string;
  wuXing: WuXingElement;
  polarity: Polarity;
  hours: string;
  season: string;
  westernEquivalent: string;
  color: string;
  accentHex: number;
  trineGroup: string;
  keywords: string;
}

/**
 * 12 Earthly Branches (Dìzhī) mapped astronomically to the 12 Tropical Zodiac sectors
 * starting at 0° Aries = Mǎo (Lapin, East, Spring Equinox, 05h-07h).
 */
export const CHINESE_SIGNS_BY_WESTERN_INDEX: ChineseSign[] = [
  {
    westernIndex: 0,
    branchIndex: 3,
    name: 'Lapin',
    hanzi: '兔',
    branchHanzi: '卯',
    pinyin: 'Mǎo',
    wuXing: 'Bois',
    polarity: 'Yin',
    hours: '05h–07h',
    season: 'Équinoxe de Printemps',
    westernEquivalent: 'Bélier',
    color: '#22c55e',
    accentHex: 0x22c55e,
    trineGroup: 'Diplomates (Cochon · Lapin · Chèvre)',
    keywords: 'Élégance, intuition vive, diplomatie, essor printanier',
  },
  {
    westernIndex: 1,
    branchIndex: 4,
    name: 'Dragon',
    hanzi: '龍',
    branchHanzi: '辰',
    pinyin: 'Chén',
    wuXing: 'Terre',
    polarity: 'Yang',
    hours: '07h–09h',
    season: 'Printemps avancé',
    westernEquivalent: 'Taureau',
    color: '#eab308',
    accentHex: 0xeab308,
    trineGroup: 'Conquérants (Rat · Dragon · Singe)',
    keywords: 'Puissance vitale, magnétisme, souffle impérial, ambition',
  },
  {
    westernIndex: 2,
    branchIndex: 5,
    name: 'Serpent',
    hanzi: '蛇',
    branchHanzi: '巳',
    pinyin: 'Sì',
    wuXing: 'Feu',
    polarity: 'Yin',
    hours: '09h–11h',
    season: 'Début d’Été',
    westernEquivalent: 'Gémeaux',
    color: '#ef4444',
    accentHex: 0xef4444,
    trineGroup: 'Stratèges (Buffle · Serpent · Coq)',
    keywords: 'Sagesse secrète, acuité mentale, métamorphose, discernement',
  },
  {
    westernIndex: 3,
    branchIndex: 6,
    name: 'Cheval',
    hanzi: '馬',
    branchHanzi: '午',
    pinyin: 'Wǔ',
    wuXing: 'Feu',
    polarity: 'Yang',
    hours: '11h–13h',
    season: 'Solstice d’Été',
    westernEquivalent: 'Cancer',
    color: '#f97316',
    accentHex: 0xf97316,
    trineGroup: 'Idéalistes (Tigre · Cheval · Chien)',
    keywords: 'Fougue solaire, liberté, élan passionnel, panache',
  },
  {
    westernIndex: 4,
    branchIndex: 7,
    name: 'Chèvre',
    hanzi: '羊',
    branchHanzi: '未',
    pinyin: 'Wèi',
    wuXing: 'Terre',
    polarity: 'Yin',
    hours: '13h–15h',
    season: 'Été tardif',
    westernEquivalent: 'Lion',
    color: '#d4af37',
    accentHex: 0xd4af37,
    trineGroup: 'Diplomates (Cochon · Lapin · Chèvre)',
    keywords: 'Sens artistique, douceur créative, harmonie, bienveillance',
  },
  {
    westernIndex: 5,
    branchIndex: 8,
    name: 'Singe',
    hanzi: '猴',
    branchHanzi: '申',
    pinyin: 'Shēn',
    wuXing: 'Métal',
    polarity: 'Yang',
    hours: '15h–17h',
    season: 'Début d’Automne',
    westernEquivalent: 'Vierge',
    color: '#cbd5e1',
    accentHex: 0xcbd5e1,
    trineGroup: 'Conquérants (Rat · Dragon · Singe)',
    keywords: 'Ingéniosité, agilité d’esprit, esprit analytique, invention',
  },
  {
    westernIndex: 6,
    branchIndex: 9,
    name: 'Coq',
    hanzi: '雞',
    branchHanzi: '酉',
    pinyin: 'Yǒu',
    wuXing: 'Métal',
    polarity: 'Yin',
    hours: '17h–19h',
    season: 'Équinoxe d’Automne',
    westernEquivalent: 'Balance',
    color: '#e2e8f0',
    accentHex: 0xe2e8f0,
    trineGroup: 'Stratèges (Buffle · Serpent · Coq)',
    keywords: 'Clarté, rectitude, sens esthétique, précision horlogère',
  },
  {
    westernIndex: 7,
    branchIndex: 10,
    name: 'Chien',
    hanzi: '狗',
    branchHanzi: '戌',
    pinyin: 'Xū',
    wuXing: 'Terre',
    polarity: 'Yang',
    hours: '19h–21h',
    season: 'Automne avancé',
    westernEquivalent: 'Scorpion',
    color: '#b45309',
    accentHex: 0xb45309,
    trineGroup: 'Idéalistes (Tigre · Cheval · Chien)',
    keywords: 'Loyauté profonde, vigilance, intégrité morale, protection',
  },
  {
    westernIndex: 8,
    branchIndex: 11,
    name: 'Cochon',
    hanzi: '豬',
    branchHanzi: '亥',
    pinyin: 'Hài',
    wuXing: 'Eau',
    polarity: 'Yin',
    hours: '21h–23h',
    season: 'Début d’Hiver',
    westernEquivalent: 'Sagittaire',
    color: '#38bdf8',
    accentHex: 0x38bdf8,
    trineGroup: 'Diplomates (Cochon · Lapin · Chèvre)',
    keywords: 'Générosité, sincérité, abondance, quête d’unité',
  },
  {
    westernIndex: 9,
    branchIndex: 0,
    name: 'Rat',
    hanzi: '鼠',
    branchHanzi: '子',
    pinyin: 'Zǐ',
    wuXing: 'Eau',
    polarity: 'Yang',
    hours: '23h–01h',
    season: 'Solstice d’Hiver',
    westernEquivalent: 'Capricorne',
    color: '#3b82f6',
    accentHex: 0x3b82f6,
    trineGroup: 'Conquérants (Rat · Dragon · Singe)',
    keywords: 'Perspicacité, stratégie, adaptabilité, commencement du cycle',
  },
  {
    westernIndex: 10,
    branchIndex: 1,
    name: 'Buffle',
    hanzi: '牛',
    branchHanzi: '丑',
    pinyin: 'Chǒu',
    wuXing: 'Terre',
    polarity: 'Yin',
    hours: '01h–03h',
    season: 'Hiver profond',
    westernEquivalent: 'Verseau',
    color: '#ca8a04',
    accentHex: 0xca8a04,
    trineGroup: 'Stratèges (Buffle · Serpent · Coq)',
    keywords: 'Endurance calme, méthode, ténacité, construction durable',
  },
  {
    westernIndex: 11,
    branchIndex: 2,
    name: 'Tigre',
    hanzi: '虎',
    branchHanzi: '寅',
    pinyin: 'Yín',
    wuXing: 'Bois',
    polarity: 'Yang',
    hours: '03h–05h',
    season: 'Début du Printemps (Lìchūn)',
    westernEquivalent: 'Poissons',
    color: '#10b981',
    accentHex: 0x10b981,
    trineGroup: 'Idéalistes (Tigre · Cheval · Chien)',
    keywords: 'Audace, élan héroïque, indépendance, renaissance',
  },
];

export const CHINESE_SIGNS_BY_BRANCH: ChineseSign[] = Array.from({ length: 12 }, (_, branch) =>
  CHINESE_SIGNS_BY_WESTERN_INDEX.find((s) => s.branchIndex === branch)!
);

interface HeavenlyStem {
  hanzi: string;
  pinyin: string;
  wuXing: WuXingElement;
  polarity: Polarity;
}

const HEAVENLY_STEMS: HeavenlyStem[] = [
  { hanzi: '甲', pinyin: 'Jiǎ', wuXing: 'Bois', polarity: 'Yang' },
  { hanzi: '乙', pinyin: 'Yǐ', wuXing: 'Bois', polarity: 'Yin' },
  { hanzi: '丙', pinyin: 'Bǐng', wuXing: 'Feu', polarity: 'Yang' },
  { hanzi: '丁', pinyin: 'Dīng', wuXing: 'Feu', polarity: 'Yin' },
  { hanzi: '戊', pinyin: 'Wù', wuXing: 'Terre', polarity: 'Yang' },
  { hanzi: '己', pinyin: 'Jǐ', wuXing: 'Terre', polarity: 'Yin' },
  { hanzi: '庚', pinyin: 'Gēng', wuXing: 'Métal', polarity: 'Yang' },
  { hanzi: '辛', pinyin: 'Xīn', wuXing: 'Métal', polarity: 'Yin' },
  { hanzi: '壬', pinyin: 'Rén', wuXing: 'Eau', polarity: 'Yang' },
  { hanzi: '癸', pinyin: 'Guǐ', wuXing: 'Eau', polarity: 'Yin' },
];

export const WU_XING_COLORS: Record<WuXingElement, string> = {
  Bois: '#34d399',
  Feu: '#fb7185',
  Terre: '#fbbf24',
  Métal: '#e2e8f0',
  Eau: '#38bdf8',
};

export function transposeLongitudeToChinese(longitudeDeg: number): {
  sign: ChineseSign;
  degInSign: number;
  formattedDeg: string;
} {
  const norm = normalizeDeg(longitudeDeg);
  const idx = Math.floor(norm / 30) % 12;
  const degInSign = norm - idx * 30;
  const whole = Math.floor(degInSign);
  const mins = Math.floor((degInSign - whole) * 60);
  const sign = CHINESE_SIGNS_BY_WESTERN_INDEX[idx];
  return {
    sign,
    degInSign,
    formattedDeg: `${String(whole).padStart(2, '0')}°${String(mins).padStart(2, '0')}’`,
  };
}

export interface BaziPillar {
  stem: HeavenlyStem;
  branch: ChineseSign;
  label: string;
}

export interface BaziProfileSummary {
  solarYear: number;
  yearPillar: BaziPillar;
  monthPillar: BaziPillar;
  hourPillar: BaziPillar;
  wuXingBalance: Record<WuXingElement, number>;
  dominantWuXing: WuXingElement;
}

/**
 * Computes BaZi solar year, solar month (based on 24 Solar Terms / ecliptic Sun longitude),
 * double-hour branch (based on local solar time), and Wu Xing balance across the chart.
 */
export function calculateBaziSummary(chart: AstroChart): BaziProfileSummary {
  const sun = chart.planets.find((p) => p.id === 'sun');
  const sunLon = sun ? normalizeDeg(sun.longitude) : 0;

  // Astronomical Chinese Solar Year begins at Lìchūn (315° Sun longitude ~Feb 4)
  let solarYear = chart.date.getUTCFullYear();
  if (chart.date.getUTCMonth() <= 1 && sunLon >= 270 && sunLon < 315) {
    solarYear -= 1;
  }

  // Year Stem & Branch (1984 = Jiǎ-Zǐ -> stem 0, branch 0)
  const yearStemIdx = (((solarYear - 4) % 10) + 10) % 10;
  const yearBranchIdx = (((solarYear - 4) % 12) + 12) % 12;
  const yearStem = HEAVENLY_STEMS[yearStemIdx];
  const yearBranch = CHINESE_SIGNS_BY_BRANCH[yearBranchIdx];

  // Solar Month (12 months starting at 315° Lìchūn = Yín / Tigre branch 2)
  const monthOffset = Math.floor(normalizeDeg(sunLon - 315) / 30); // 0..11
  const monthBranchIdx = (2 + monthOffset) % 12;
  // Five Tigers rule (Wǔ Hǔ Dùn): Yín month stem starts from (yearStem % 5)*2 + 2
  const monthStemStart = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (monthStemStart + monthOffset) % 10;
  const monthStem = HEAVENLY_STEMS[monthStemIdx];
  const monthBranch = CHINESE_SIGNS_BY_BRANCH[monthBranchIdx];

  // Hour Pillar using Local Mean Solar Time (longitude offset in hours)
  const utcHours =
    chart.date.getUTCHours() +
    chart.date.getUTCMinutes() / 60 +
    chart.date.getUTCSeconds() / 3600;
  const localSolarHours = ((utcHours + chart.longitude / 15) % 24 + 24) % 24;
  // Rat = 23:00..01:00 -> shift +1 hour, divide by 2
  const hourBranchIdx = Math.floor(((localSolarHours + 1) % 24) / 2) % 12;
  const hourStemIdx = (((yearStemIdx * 2 + hourBranchIdx) % 10) + 10) % 10;
  const hourStem = HEAVENLY_STEMS[hourStemIdx];
  const hourBranch = CHINESE_SIGNS_BY_BRANCH[hourBranchIdx];

  const wuXingBalance: Record<WuXingElement, number> = {
    Bois: 0,
    Feu: 0,
    Terre: 0,
    Métal: 0,
    Eau: 0,
  };

  chart.planets.forEach((p) => {
    if (p.id === 'northNode') return;
    const ch = transposeLongitudeToChinese(p.longitude).sign;
    const weight = p.id === 'sun' || p.id === 'moon' ? 2 : 1;
    wuXingBalance[ch.wuXing] += weight;
  });

  // Weight ASC transposed Wu Xing as well
  const ascCh = transposeLongitudeToChinese(chart.ascendant).sign;
  wuXingBalance[ascCh.wuXing] += 1;

  let dominantWuXing: WuXingElement = 'Bois';
  let maxVal = -1;
  (Object.keys(wuXingBalance) as WuXingElement[]).forEach((el) => {
    if (wuXingBalance[el] > maxVal) {
      maxVal = wuXingBalance[el];
      dominantWuXing = el;
    }
  });

  return {
    solarYear,
    yearPillar: {
      stem: yearStem,
      branch: yearBranch,
      label: `${yearBranch.name} de ${yearStem.wuXing} ${yearStem.polarity} (${yearStem.hanzi}${yearBranch.branchHanzi})`,
    },
    monthPillar: {
      stem: monthStem,
      branch: monthBranch,
      label: `${monthBranch.name} de ${monthStem.wuXing} (${monthStem.hanzi}${monthBranch.branchHanzi})`,
    },
    hourPillar: {
      stem: hourStem,
      branch: hourBranch,
      label: `${hourBranch.name} (${hourBranch.hours})`,
    },
    wuXingBalance,
    dominantWuXing,
  };
}

export interface AnimalRelationInfo {
  type: 'identique' | 'sanHe' | 'liuHe' | 'liuChong' | 'neutre';
  label: string;
  color: string;
  desc: string;
}

const LIU_HE_PAIRS: Array<[number, number]> = [
  [0, 1], // Rat - Buffle
  [2, 11], // Tigre - Cochon
  [3, 10], // Lapin - Chien
  [4, 9], // Dragon - Coq
  [5, 8], // Serpent - Singe
  [6, 7], // Cheval - Chèvre
];

export function evaluateAnimalHarmony(a: ChineseSign, b: ChineseSign): AnimalRelationInfo {
  const ba = a.branchIndex;
  const bb = b.branchIndex;
  if (ba === bb) {
    return {
      type: 'identique',
      label: 'Ben Ming (Même Signe)',
      color: '#fbbf24',
      desc: 'Résonance directe sur le même rameau terrestre.',
    };
  }
  const diff = (((bb - ba) % 12) + 12) % 12;
  if (diff === 4 || diff === 8) {
    return {
      type: 'sanHe',
      label: 'San He · Grand Trigone',
      color: '#34d399',
      desc: `Harmonie naturelle du même triangle (${a.trineGroup}).`,
    };
  }
  const isLiuHe = LIU_HE_PAIRS.some(([x, y]) => (x === ba && y === bb) || (x === bb && y === ba));
  if (isLiuHe) {
    return {
      type: 'liuHe',
      label: 'Liu He · Alliance Secrète',
      color: '#38bdf8',
      desc: 'Complicité Yin-Yang complémentaire et soutien mutuel.',
    };
  }
  if (diff === 6) {
    return {
      type: 'liuChong',
      label: 'Liu Chong · Polarité / Défi',
      color: '#f97316',
      desc: 'Axe d’opposition invitant au mouvement et au renouvellement.',
    };
  }
  return {
    type: 'neutre',
    label: 'Échange Wu Xing',
    color: '#cbd5e1',
    desc: `Dialogue entre ${a.wuXing} (${a.name}) et ${b.wuXing} (${b.name}).`,
  };
}

export function getChineseSignForPlanetId(_id: PlanetId, longitude: number): ChineseSign {
  return transposeLongitudeToChinese(longitude).sign;
}
