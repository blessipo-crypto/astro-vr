import { AstroChart, ElementType, ZodiacSign, ZODIAC_SIGNS } from './astroEngine';
import {
  CHINESE_SIGNS_BY_BRANCH,
  ChineseSign,
  transposeLongitudeToChinese,
} from './chineseAstrology';

export interface OppositeAxisEntry {
  axisNumber: number;
  signA: ZodiacSign;
  signB: ZodiacSign;
  axisTheme: string;
  complementarity: string;
  polarityPair: string;
  activePlanetsA: string[];
  activePlanetsB: string[];
  isAscDscAxis: boolean;
}

const AXIS_DEFINITIONS: Array<{
  indexA: number;
  indexB: number;
  axisTheme: string;
  complementarity: string;
}> = [
  {
    indexA: 0,
    indexB: 6,
    axisTheme: 'Moi ↔ L’Autre (Identité & Relation)',
    complementarity:
      'Le Bélier apporte l’élan d’initiative et l’affirmation ; la Balance équilibre par la diplomatie, la justice et le sens de l’alliance.',
  },
  {
    indexA: 1,
    indexB: 7,
    axisTheme: 'Avoir ↔ Métamorphose (Sécurité & Profondeur)',
    complementarity:
      'Le Taureau ancre, construit et préserve dans la durée ; le Scorpion régénère, dévoile l’essentiel et transforme les attachements.',
  },
  {
    indexA: 2,
    indexB: 8,
    axisTheme: 'Savoir ↔ Sagesse (Analyse & Vision)',
    complementarity:
      'Les Gémeaux collectent, relient et questionnent les faits ; le Sagittaire synthétise en une vision philosophique et un cap d’expansion.',
  },
  {
    indexA: 3,
    indexB: 9,
    axisTheme: 'Foyer ↔ Destinée (Intimité & Accomplissement)',
    complementarity:
      'Le Cancer protège les racines, l’affectif et la mémoire ; le Capricorne élève la structure, la responsabilité et l’œuvre sociale.',
  },
  {
    indexA: 4,
    indexB: 10,
    axisTheme: 'Rayonnement ↔ Fraternité (Individu & Collectif)',
    complementarity:
      'Le Lion exprime le cœur créateur et la singularité ; le Verseau met l’invention, la liberté et le génie au service du collectif.',
  },
  {
    indexA: 5,
    indexB: 11,
    axisTheme: 'Ordre ↔ Transcendance (Service & Unité)',
    complementarity:
      'La Vierge affine, discerne et soigne par le geste juste ; les Poissons dissolvent les frontières par l’empathie et l’inspiration.',
  },
];

export function buildWesternOppositesTable(
  baseChart: AstroChart,
  outerChart: AstroChart | null
): OppositeAxisEntry[] {
  const ascIdx = baseChart.ascSign.index;

  return AXIS_DEFINITIONS.map((def, i) => {
    const signA = ZODIAC_SIGNS[def.indexA];
    const signB = ZODIAC_SIGNS[def.indexB];

    const collectPlanets = (idx: number) => {
      const list = baseChart.planets
        .filter((p) => p.sign.index === idx)
        .map((p) => `${p.symbol} ${p.name}`);
      if (baseChart.ascSign.index === idx) list.unshift('ASC');
      if (baseChart.mcSign.index === idx) list.unshift('MC');
      if (outerChart) {
        outerChart.planets
          .filter((p) => p.sign.index === idx)
          .forEach((p) => list.push(`${p.symbol} Ext.`));
      }
      return list;
    };

    return {
      axisNumber: i + 1,
      signA,
      signB,
      axisTheme: def.axisTheme,
      complementarity: def.complementarity,
      polarityPair: `${signA.element} ↔ ${signB.element} · ${signA.modality}`,
      activePlanetsA: collectPlanets(def.indexA),
      activePlanetsB: collectPlanets(def.indexB),
      isAscDscAxis: ascIdx === def.indexA || ascIdx === def.indexB,
    };
  });
}

export interface ElementTrineAffinity {
  element: ElementType;
  complementaryElement: ElementType;
  signs: ZodiacSign[];
  color: string;
  description: string;
}

export const WESTERN_ELEMENT_TRINES: ElementTrineAffinity[] = [
  {
    element: 'Feu',
    complementaryElement: 'Air',
    signs: [ZODIAC_SIGNS[0], ZODIAC_SIGNS[4], ZODIAC_SIGNS[8]],
    color: '#f59e0b',
    description: 'Affinité spontanée d’enthousiasme, de créativité et d’inspiration. Soutenue par l’Air (60°/180°).',
  },
  {
    element: 'Terre',
    complementaryElement: 'Eau',
    signs: [ZODIAC_SIGNS[1], ZODIAC_SIGNS[5], ZODIAC_SIGNS[9]],
    color: '#34d399',
    description: 'Affinité de construction concrète, fiabilité et patience féconde. Nourrie par l’Eau.',
  },
  {
    element: 'Air',
    complementaryElement: 'Feu',
    signs: [ZODIAC_SIGNS[2], ZODIAC_SIGNS[6], ZODIAC_SIGNS[10]],
    color: '#38bdf8',
    description: 'Affinité intellectuelle, dialogue fluide, curiosité et liberté d’esprit. Stimulée par le Feu.',
  },
  {
    element: 'Eau',
    complementaryElement: 'Terre',
    signs: [ZODIAC_SIGNS[3], ZODIAC_SIGNS[7], ZODIAC_SIGNS[11]],
    color: '#818cf8',
    description: 'Affinité émotionnelle, intuition profonde, mémoire et empathie. Sécurisée par la Terre.',
  },
];

export interface SignAffinityProfile {
  sourceLabel: string;
  sourceSign: ZodiacSign;
  trineAllies: ZodiacSign[]; // 120° same element
  sextileAllies: ZodiacSign[]; // 60° complementary active/receptive
  oppositeComplement: ZodiacSign; // 180°
  squareChallenges: ZodiacSign[]; // 90° dynamic tension
}

export function buildSignAffinityProfile(sign: ZodiacSign, sourceLabel: string): SignAffinityProfile {
  const idx = sign.index;
  return {
    sourceLabel,
    sourceSign: sign,
    trineAllies: [ZODIAC_SIGNS[(idx + 4) % 12], ZODIAC_SIGNS[(idx + 8) % 12]],
    sextileAllies: [ZODIAC_SIGNS[(idx + 2) % 12], ZODIAC_SIGNS[(idx + 10) % 12]],
    oppositeComplement: ZODIAC_SIGNS[(idx + 6) % 12],
    squareChallenges: [ZODIAC_SIGNS[(idx + 3) % 12], ZODIAC_SIGNS[(idx + 9) % 12]],
  };
}

export interface ChineseOppositeEntry {
  signA: ChineseSign;
  signB: ChineseSign;
  axisName: string;
  dynamics: string;
  activePlanetsA: string[];
  activePlanetsB: string[];
}

export interface ChineseComplementaryEntry {
  signA: ChineseSign;
  signB: ChineseSign;
  resultElement: string;
  dynamics: string;
}

export interface ChineseSanHeTrine {
  name: string;
  elementAffinity: string;
  signs: ChineseSign[];
  color: string;
  dynamics: string;
}

export const CHINESE_SAN_HE_TRINES: ChineseSanHeTrine[] = [
  {
    name: '1er Triangle · Les Conquérants',
    elementAffinity: 'Affinité Eau',
    signs: [CHINESE_SIGNS_BY_BRANCH[0], CHINESE_SIGNS_BY_BRANCH[4], CHINESE_SIGNS_BY_BRANCH[8]],
    color: '#38bdf8',
    dynamics: 'Rat · Dragon · Singe : ambition vive, intelligence stratégique et capacité d’entreprise.',
  },
  {
    name: '2e Triangle · Les Stratèges',
    elementAffinity: 'Affinité Métal',
    signs: [CHINESE_SIGNS_BY_BRANCH[1], CHINESE_SIGNS_BY_BRANCH[5], CHINESE_SIGNS_BY_BRANCH[9]],
    color: '#e2e8f0',
    dynamics: 'Buffle · Serpent · Coq : persévérance, discernement profond et goût de l’excellence.',
  },
  {
    name: '3e Triangle · Les Idéalistes',
    elementAffinity: 'Affinité Feu',
    signs: [CHINESE_SIGNS_BY_BRANCH[2], CHINESE_SIGNS_BY_BRANCH[6], CHINESE_SIGNS_BY_BRANCH[10]],
    color: '#fb923c',
    dynamics: 'Tigre · Cheval · Chien : noblesse de cœur, courage d’action et fidélité aux idéaux.',
  },
  {
    name: '4e Triangle · Les Diplomates',
    elementAffinity: 'Affinité Bois',
    signs: [CHINESE_SIGNS_BY_BRANCH[3], CHINESE_SIGNS_BY_BRANCH[7], CHINESE_SIGNS_BY_BRANCH[11]],
    color: '#34d399',
    dynamics: 'Lapin · Chèvre · Cochon : sens artistique, tact relationnel et quête d’harmonie.',
  },
];

const CHINESE_OPPOSITE_AXES: Array<{
  branchA: number;
  branchB: number;
  axisName: string;
  dynamics: string;
}> = [
  {
    branchA: 0,
    branchB: 6,
    axisName: 'Rat (子) ↔ Cheval (午) · Axe Nord / Sud',
    dynamics: 'Eau Yang face au Feu Yang : tension dynamique entre stratégie lucide et fougue spontanée.',
  },
  {
    branchA: 1,
    branchB: 7,
    axisName: 'Buffle (丑) ↔ Chèvre (未) · Axe Persévérance / Art',
    dynamics: 'Terre Yin hivernale face à la Terre Yin estivale : effort structuré complété par la sensibilité créatrice.',
  },
  {
    branchA: 2,
    branchB: 8,
    axisName: 'Tigre (寅) ↔ Singe (申) · Axe Éveil / Ingéniosité',
    dynamics: 'Bois Yang face au Métal Yang : élan audacieux régulé par l’esprit tactique et analytique.',
  },
  {
    branchA: 3,
    branchB: 9,
    axisName: 'Lapin (卯) ↔ Coq (酉) · Axe Est / Ouest',
    dynamics: 'Bois Yin face au Métal Yin : souplesse diplomatique équilibrée par la droiture et le discernement.',
  },
  {
    branchA: 4,
    branchB: 10,
    axisName: 'Dragon (辰) ↔ Chien (戌) · Axe Ciel / Terre',
    dynamics: 'Terre Yang face à la Terre Yang : vision ambitieuse ancrée par la loyauté et la vigilance.',
  },
  {
    branchA: 5,
    branchB: 11,
    axisName: 'Serpent (巳) ↔ Cochon (亥) · Axe Sagesse / Confiance',
    dynamics: 'Feu Yin face à l’Eau Yin : clairvoyance intériorisée ouverte par la générosité du cœur.',
  },
];

const CHINESE_COMPLEMENTARY_LIU_HE: Array<{
  branchA: number;
  branchB: number;
  resultElement: string;
  dynamics: string;
}> = [
  {
    branchA: 0,
    branchB: 1,
    resultElement: 'Alliance Terre',
    dynamics: 'Rat & Buffle : l’intuition vive du Rat s’unit à la constance bâtisseuse du Buffle.',
  },
  {
    branchA: 2,
    branchB: 11,
    resultElement: 'Alliance Bois',
    dynamics: 'Tigre & Cochon : l’audace du Tigre est soutenue par la bienveillance confiante du Cochon.',
  },
  {
    branchA: 3,
    branchB: 10,
    resultElement: 'Alliance Feu',
    dynamics: 'Lapin & Chien : la finesse du Lapin forme un pacte fidèle avec la loyauté du Chien.',
  },
  {
    branchA: 4,
    branchB: 9,
    resultElement: 'Alliance Métal',
    dynamics: 'Dragon & Coq : le souffle impérial du Dragon s’allie à la précision rigoureuse du Coq.',
  },
  {
    branchA: 5,
    branchB: 8,
    resultElement: 'Alliance Eau',
    dynamics: 'Serpent & Singe : la profondeur stratégique du Serpent complète l’agilité mentale du Singe.',
  },
  {
    branchA: 6,
    branchB: 7,
    resultElement: 'Alliance Soleil-Lune',
    dynamics: 'Cheval & Chèvre : la liberté du Cheval trouve refuge et harmonie auprès de la Chèvre.',
  },
];

export function buildChineseOppositesAndComplements(baseChart: AstroChart): {
  opposites: ChineseOppositeEntry[];
  complements: ChineseComplementaryEntry[];
} {
  const collectChinese = (branchIdx: number) => {
    const list = baseChart.planets
      .filter((p) => transposeLongitudeToChinese(p.longitude).sign.branchIndex === branchIdx)
      .map((p) => `${p.symbol} ${p.name}`);
    if (transposeLongitudeToChinese(baseChart.ascendant).sign.branchIndex === branchIdx) {
      list.unshift('ASC');
    }
    return list;
  };

  const opposites: ChineseOppositeEntry[] = CHINESE_OPPOSITE_AXES.map((ax) => ({
    signA: CHINESE_SIGNS_BY_BRANCH[ax.branchA],
    signB: CHINESE_SIGNS_BY_BRANCH[ax.branchB],
    axisName: ax.axisName,
    dynamics: ax.dynamics,
    activePlanetsA: collectChinese(ax.branchA),
    activePlanetsB: collectChinese(ax.branchB),
  }));

  const complements: ChineseComplementaryEntry[] = CHINESE_COMPLEMENTARY_LIU_HE.map((pair) => ({
    signA: CHINESE_SIGNS_BY_BRANCH[pair.branchA],
    signB: CHINESE_SIGNS_BY_BRANCH[pair.branchB],
    resultElement: pair.resultElement,
    dynamics: pair.dynamics,
  }));

  return { opposites, complements };
}
