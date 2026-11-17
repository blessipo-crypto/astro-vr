import {
  AstroChart,
  ChartMode,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  ElementType,
  findHouseForLongitude,
  formatDegreeInSign,
  normalizeDeg,
  PlanetId,
  SolarReturnAnalysis,
  ZODIAC_SIGNS,
} from './astroEngine';
import {
  describeSlowTransitInHouse,
  getAscendantDeepInterpretation,
  getComparisonPlanetDetailedText,
  getDecanInfo,
  getElementDeficitAdvice,
  getHemisphereBalance,
  getHouseArenaFocus,
  getHouseRulerInfo,
  getLunarPhaseInfo,
  getNatalHouseDetailedText,
  getNatalHouseWithOuterOverlayDetailedText,
  getNatalPlanetDetailedText,
  getPlanetDignity,
  getPlanetTrait,
  getRuledHousesLabels,
  getSolarReturnAngularPlanetMeaning,
  getSolarReturnAscInNatalHouseInterpretation,
  getSolarReturnHouseDetailedText,
  getSolarReturnHouseMeaning,
  getSolarReturnPlanetDetailedText,
  getSolarReturnSunHouseMeaning,
  getSolarReturnSunInHouseRefined,
  getWuXingDynamicAdvice,
} from './astroKnowledge';
import {
  calculateBaziSummary,
  evaluateAnimalHarmony,
  transposeLongitudeToChinese,
  WuXingElement,
  ZodiacTradition,
} from './chineseAstrology';

export interface InterpretationSection {
  title: string;
  accent?: 'gold' | 'cyan' | 'emerald' | 'amber' | 'rose';
  body: string;
  highlights?: string[];
}

export interface DetailedPlanetInterpretation {
  planetId: PlanetId;
  layer: 'base' | 'outer';
  name: string;
  symbol: string;
  signName: string;
  signSymbol: string;
  formattedDeg: string;
  decanLabel: string;
  dignityStatus: string;
  dignityColor: string;
  houseRoman: string;
  houseTitle: string;
  natalHouseRoman?: string;
  natalHouseTitle?: string;
  retrograde: boolean;
  ruledHouses: string[];
  aspectCount: number;
  summary: string;
  chineseLabel: string;
}

export interface DetailedHouseInterpretation {
  house: number;
  roman: string;
  title: string;
  signName: string;
  signSymbol: string;
  formattedDeg: string;
  rulerName: string;
  rulerLocation: string;
  occupants: Array<{ id: PlanetId; symbol: string; name: string; formattedDeg: string; layer?: 'base' | 'outer' }>;
  occupantLayer?: 'base' | 'outer';
  canTargetHouse?: boolean;
  superposedNatalHouse?: string;
  interpretation: string;
}

export interface DetailedAspectItem {
  id: string;
  layer: 'natal' | 'comparison' | 'srInternal';
  title: string;
  aspectLabel: string;
  symbol: string;
  cssColor: string;
  harmony: 'harmonious' | 'tense' | 'fusion';
  orb: number;
  interpretation: string;
  planetA?: PlanetId;
  planetB?: PlanetId;
}

export interface SolarReturnPillarPlanet {
  planetId: PlanetId;
  symbol: string;
  name: string;
  roleReason: string;
  positionSummary: string;
  aspectHighlights: string[];
  synthesis: string;
}

export interface SolarReturnDominantHouse {
  house: number;
  roman: string;
  title: string;
  occupants: Array<{ id: PlanetId; symbol: string; name: string }>;
  superposedNatalRoman: string;
  superposedNatalTitle: string;
  rulerLocation: string;
  linkedAspects: string[];
  synthesis: string;
}

export interface SolarReturnLifeAxis {
  id: 'identity' | 'love' | 'work' | 'inner';
  title: string;
  accent: 'gold' | 'rose' | 'cyan' | 'emerald';
  housesInvolved: string;
  planetsInvolved: string;
  keyAspects: string[];
  synthesis: string;
}

export interface SolarReturnSynthesisReport {
  headline: string;
  subtitle: string;
  executiveSynthesis: string;
  aspectClimate: {
    rsToNatal: { harmonious: number; tense: number; fusion: number; total: number };
    rsInternal: { harmonious: number; tense: number; fusion: number; total: number };
    climateLabel: string;
    climateNarrative: string;
    tightestTrigger: string | null;
    tightestInternal: string | null;
  };
  dominantHouses: SolarReturnDominantHouse[];
  pillarPlanets: SolarReturnPillarPlanet[];
  lifeAxes: SolarReturnLifeAxis[];
  actionLevers: string[];
  plainTextExport: string;
}

export interface ChartInterpretationReport {
  headline: string;
  subtitle: string;
  synthesis: string;
  sections: InterpretationSection[];
  detailedContextLabel?: string;
  detailedPlanets?: DetailedPlanetInterpretation[];
  detailedHouses?: DetailedHouseInterpretation[];
  detailedAspects?: DetailedAspectItem[];
  secondaryAspects?: DetailedAspectItem[];
  secondaryAspectsLabel?: string;
  solarReturnSynthesis?: SolarReturnSynthesisReport;
}

function buildSingleWheelDetails(
  chart: AstroChart,
  modeContext: 'natal' | 'composite' | 'live'
): {
  detailedPlanets: DetailedPlanetInterpretation[];
  detailedHouses: DetailedHouseInterpretation[];
  detailedAspects: DetailedAspectItem[];
} {
  const detailedPlanets: DetailedPlanetInterpretation[] = chart.planets.map((p) => {
    const decan = getDecanInfo(p.sign, p.degInSign);
    const dignity = getPlanetDignity(p.id, p.sign.index);
    const house = chart.houses[p.house - 1];
    const ruled = getRuledHousesLabels(p.id, chart.houses);
    const aspectCount = chart.aspects.filter(
      (a) => a.planetA === p.id || a.planetB === p.id
    ).length;
    const ch = transposeLongitudeToChinese(p.longitude).sign;
    return {
      planetId: p.id,
      layer: 'base',
      name: p.name,
      symbol: p.symbol,
      signName: p.sign.name,
      signSymbol: p.sign.symbol,
      formattedDeg: p.formattedDeg,
      decanLabel: decan.label,
      dignityStatus: dignity.status,
      dignityColor: dignity.badgeColor,
      houseRoman: house.roman,
      houseTitle: house.title,
      retrograde: p.retrograde,
      ruledHouses: ruled,
      aspectCount,
      summary: getNatalPlanetDetailedText(p, chart, aspectCount, modeContext),
      chineseLabel: `${ch.branchHanzi}${ch.hanzi} ${ch.name} (${ch.wuXing})`,
    };
  });

  const detailedHouses: DetailedHouseInterpretation[] = chart.houses.map((h) => {
    const { rulerLocationText } = getHouseRulerInfo(h, chart.planets, chart.houses);
    const occupants = chart.planets
      .filter((p) => p.house === h.house)
      .map((p) => ({
        id: p.id,
        symbol: p.symbol,
        name: p.name,
        formattedDeg: p.formattedDeg,
        layer: 'base' as const,
      }));
    return {
      house: h.house,
      roman: h.roman,
      title: h.title,
      signName: h.sign.name,
      signSymbol: h.sign.symbol,
      formattedDeg: h.formattedDeg,
      rulerName: h.sign.ruler,
      rulerLocation: rulerLocationText,
      occupants,
      occupantLayer: 'base',
      canTargetHouse: true,
      interpretation: getNatalHouseDetailedText(h, chart),
    };
  });

  const detailedAspects: DetailedAspectItem[] = [...chart.aspects]
    .sort((a, b) => a.orb - b.orb)
    .map((a) => ({
      id: a.id,
      layer: 'natal',
      title: `${a.planetASymbol} ${a.planetAName} ${a.symbol} ${a.planetBSymbol} ${a.planetBName}`,
      aspectLabel: a.label,
      symbol: a.symbol,
      cssColor: a.cssColor,
      harmony: a.harmony,
      orb: a.orb,
      interpretation: a.interpretation,
      planetA: a.planetA,
      planetB: a.planetB,
    }));

  return { detailedPlanets, detailedHouses, detailedAspects };
}

function buildDualWheelDetails(params: {
  mode: ChartMode;
  baseChart: AstroChart;
  outerChart: AstroChart;
  comparisonAspects: ComparisonAspectInfo[];
  outerTag: string;
  baseTag: string;
  useOuterHouseWheel?: boolean;
}): {
  detailedPlanets: DetailedPlanetInterpretation[];
  detailedHouses: DetailedHouseInterpretation[];
  detailedAspects: DetailedAspectItem[];
  secondaryAspects: DetailedAspectItem[];
} {
  const { mode, baseChart, outerChart, comparisonAspects, outerTag, baseTag, useOuterHouseWheel = false } = params;

  const detailedPlanets: DetailedPlanetInterpretation[] = outerChart.planets.map((outerP) => {
    const decan = getDecanInfo(outerP.sign, outerP.degInSign);
    const dignity = getPlanetDignity(outerP.id, outerP.sign.index);
    const outerHouse = outerChart.houses[outerP.house - 1];
    const natalHouseNum = findHouseForLongitude(outerP.longitude, baseChart.houses);
    const natalHouse = baseChart.houses[natalHouseNum - 1];
    const ruledOuter = getRuledHousesLabels(outerP.id, outerChart.houses);
    const aspCount = comparisonAspects.filter((a) => a.outerPlanet === outerP.id).length;
    const ch = transposeLongitudeToChinese(outerP.longitude).sign;

    return {
      planetId: outerP.id,
      layer: 'outer',
      name: `${outerP.name} ${outerTag}`,
      symbol: outerP.symbol,
      signName: outerP.sign.name,
      signSymbol: outerP.sign.symbol,
      formattedDeg: outerP.formattedDeg,
      decanLabel: decan.label,
      dignityStatus: dignity.status,
      dignityColor: dignity.badgeColor,
      houseRoman: `${outerHouse.roman} ${outerTag}`,
      houseTitle: outerHouse.title,
      natalHouseRoman: natalHouse.roman,
      natalHouseTitle: natalHouse.title,
      retrograde: outerP.retrograde,
      ruledHouses: ruledOuter,
      aspectCount: aspCount,
      summary: getComparisonPlanetDetailedText(mode, outerP, outerChart, natalHouse, aspCount),
      chineseLabel: `${ch.branchHanzi}${ch.hanzi} ${ch.name} (${ch.wuXing})`,
    };
  });

  const detailedHouses: DetailedHouseInterpretation[] = useOuterHouseWheel
    ? outerChart.houses.map((oh) => {
        const natalHouseNum = findHouseForLongitude(oh.longitude, baseChart.houses);
        const natalSup = baseChart.houses[natalHouseNum - 1];
        const { rulerLocationText } = getHouseRulerInfo(oh, outerChart.planets, outerChart.houses);
        const occupants = outerChart.planets
          .filter((p) => p.house === oh.house)
          .map((p) => ({
            id: p.id,
            symbol: p.symbol,
            name: `${p.name} ${outerTag}`,
            formattedDeg: p.formattedDeg,
            layer: 'outer' as const,
          }));
        return {
          house: oh.house,
          roman: `${oh.roman} ${outerTag}`,
          title: oh.title,
          signName: oh.sign.name,
          signSymbol: oh.sign.symbol,
          formattedDeg: oh.formattedDeg,
          rulerName: oh.sign.ruler,
          rulerLocation: rulerLocationText,
          occupants,
          occupantLayer: 'outer',
          canTargetHouse: false,
          superposedNatalHouse: `Superposée à la Maison ${natalSup.roman} ${baseTag} (${natalSup.title})`,
          interpretation: getSolarReturnHouseDetailedText(oh, outerChart, natalSup),
        };
      })
    : baseChart.houses.map((nh) => {
        const { rulerLocationText } = getHouseRulerInfo(nh, baseChart.planets, baseChart.houses);
        const outerOccupants = outerChart.planets.filter(
          (p) => findHouseForLongitude(p.longitude, baseChart.houses) === nh.house
        );
        const baseOccupants = baseChart.planets.filter((p) => p.house === nh.house);
        const occupants = [
          ...outerOccupants.map((p) => ({
            id: p.id,
            symbol: p.symbol,
            name: `${p.name} ${outerTag}`,
            formattedDeg: p.formattedDeg,
            layer: 'outer' as const,
          })),
          ...baseOccupants.map((p) => ({
            id: p.id,
            symbol: p.symbol,
            name: p.name,
            formattedDeg: p.formattedDeg,
            layer: 'base' as const,
          })),
        ];
        return {
          house: nh.house,
          roman: nh.roman,
          title: nh.title,
          signName: nh.sign.name,
          signSymbol: nh.sign.symbol,
          formattedDeg: nh.formattedDeg,
          rulerName: nh.sign.ruler,
          rulerLocation: rulerLocationText,
          occupants,
          occupantLayer: 'outer',
          canTargetHouse: true,
          superposedNatalHouse:
            outerOccupants.length > 0
              ? `${outerOccupants.length} astre${outerOccupants.length > 1 ? 's' : ''} ${outerTag} actif${outerOccupants.length > 1 ? 's' : ''} dans cette Maison`
              : undefined,
          interpretation: getNatalHouseWithOuterOverlayDetailedText(mode, nh, baseChart, outerOccupants),
        };
      });

  const detailedAspects: DetailedAspectItem[] = [...comparisonAspects]
    .sort((a, b) => a.orb - b.orb)
    .map((a) => ({
      id: a.id,
      layer: 'comparison',
      title: `${a.outerSymbol} ${a.outerPlanetName} (${outerTag}) ${a.symbol} ${a.natalSymbol} ${a.natalPlanetName} (${baseTag})`,
      aspectLabel: a.label,
      symbol: a.symbol,
      cssColor: a.cssColor,
      harmony: a.harmony,
      orb: a.orb,
      interpretation: a.interpretation,
      planetA: a.outerPlanet,
      planetB: a.natalPlanet,
    }));

  const secondaryAspects: DetailedAspectItem[] = [...outerChart.aspects]
    .sort((a, b) => a.orb - b.orb)
    .map((a) => ({
      id: `ext-${a.id}`,
      layer: 'srInternal',
      title: `${a.planetASymbol} ${a.planetAName} (${outerTag}) ${a.symbol} ${a.planetBSymbol} ${a.planetBName} (${outerTag})`,
      aspectLabel: a.label,
      symbol: a.symbol,
      cssColor: a.cssColor,
      harmony: a.harmony,
      orb: a.orb,
      interpretation: a.interpretation,
      planetA: a.planetA,
      planetB: a.planetB,
    }));

  return { detailedPlanets, detailedHouses, detailedAspects, secondaryAspects };
}

const ELEMENT_TEMPERAMENT: Record<ElementType, string> = {
  Feu: 'une nature ardente, spontanée et créatrice, animée par la passion, la vision et le besoin d’initiative',
  Terre: 'une nature pragmatique, structurée et persévérante, attachée au concret, à la fiabilité et aux réalisations durables',
  Air: 'une nature curieuse, relationnelle et analytique, portée par la compréhension, le dialogue et la circulation des idées',
  Eau: 'une nature sensible, réceptive et profonde, guidée par l’intuition, la mémoire émotionnelle et l’empathie',
};

const WUXING_TEMPERAMENT: Record<WuXingElement, string> = {
  Bois: 'une énergie de croissance, d’élan créateur, d’autonomie et de renouvellement printanier',
  Feu: 'une énergie rayonnante, expressive, généreuse et motrice portée par le cœur et la lumière',
  Terre: 'une énergie d’ancrage, de stabilisation, d’accueil et de médiation entre les cycles',
  Métal: 'une énergie de clarté, de droiture, de discernement et de raffinement exigeant',
  Eau: 'une énergie fluide, méditative, stratégique et profonde capable d’épouser chaque transformation',
};

function getDominantElement(elements: Record<ElementType, number>): ElementType {
  return (Object.keys(elements) as ElementType[]).reduce((best, cur) =>
    elements[cur] > elements[best] ? cur : best
  );
}

function getSignLabel(
  lon: number,
  westernName: string,
  westernSym: string,
  tradition: ZodiacTradition
): string {
  if (tradition === 'chinese') {
    const ch = transposeLongitudeToChinese(lon).sign;
    return `${ch.name} (${ch.branchHanzi}${ch.hanzi} · ${ch.wuXing} ${ch.polarity})`;
  }
  return `${westernSym} ${westernName}`;
}

function summarizeAspectToneFr(harmony: 'harmonious' | 'tense' | 'fusion', orb: number): string {
  const tightness = orb <= 1.2 ? 'partile' : orb <= 2.8 ? 'serré' : 'actif';
  if (harmony === 'harmonious') return `soutien fluide (${tightness}, ${orb.toFixed(1)}°)`;
  if (harmony === 'tense') return `défi moteur demandant ajustement (${tightness}, ${orb.toFixed(1)}°)`;
  return `fusion directe et amplificatrice (${tightness}, ${orb.toFixed(1)}°)`;
}

function buildSolarReturnSynthesis(params: {
  baseChart: AstroChart;
  srChart: AstroChart;
  comparisonAspects: ComparisonAspectInfo[];
  solarReturnAnalysis: SolarReturnAnalysis;
  tradition: ZodiacTradition;
}): SolarReturnSynthesisReport {
  const { baseChart, srChart, comparisonAspects, solarReturnAnalysis, tradition } = params;
  const year = srChart.date.getFullYear();

  const srSun = srChart.planets.find((p) => p.id === 'sun')!;
  const srMoon = srChart.planets.find((p) => p.id === 'moon')!;
  const srVenus = srChart.planets.find((p) => p.id === 'venus')!;
  const srMars = srChart.planets.find((p) => p.id === 'mars')!;
  const srJupiter = srChart.planets.find((p) => p.id === 'jupiter')!;
  const srSaturn = srChart.planets.find((p) => p.id === 'saturn')!;
  const srUranus = srChart.planets.find((p) => p.id === 'uranus')!;
  const srNeptune = srChart.planets.find((p) => p.id === 'neptune')!;
  const srPluto = srChart.planets.find((p) => p.id === 'pluto')!;
  const srNode = srChart.planets.find((p) => p.id === 'northNode')!;

  const srInternalSorted = [...srChart.aspects].sort((a, b) => a.orb - b.orb);
  const rsToNatalSorted = [...comparisonAspects].sort((a, b) => a.orb - b.orb);

  // 1. Aspect Climate counts (RS -> Natal & RS <-> RS)
  const countHarmonies = <T extends { harmony: 'harmonious' | 'tense' | 'fusion' }>(list: T[]) => ({
    harmonious: list.filter((a) => a.harmony === 'harmonious').length,
    tense: list.filter((a) => a.harmony === 'tense').length,
    fusion: list.filter((a) => a.harmony === 'fusion').length,
    total: list.length,
  });

  const rsToNatalCounts = countHarmonies(rsToNatalSorted);
  const rsInternalCounts = countHarmonies(srInternalSorted);

  const totalHarm = rsToNatalCounts.harmonious + rsInternalCounts.harmonious;
  const totalTense = rsToNatalCounts.tense + rsInternalCounts.tense;
  const totalFusion = rsToNatalCounts.fusion + rsInternalCounts.fusion;

  let climateLabel = 'Équilibre entre Élan & Réajustements';
  let climateNarrative =
    'Le dialogue entre aspects fluides et aspects de tension crée une année constructive : les opportunités s’ouvrent lorsque vous acceptez d’opérer les choix ou réorganisations nécessaires.';

  if (totalHarm >= totalTense + 3) {
    climateLabel = 'Climat Harmonique & Porteur';
    climateNarrative =
      'La prédominance des trigones et sextiles (RS ↔ RS et RS → Natal) favorise une circulation fluide des appuis, des rencontres facilitatrices et des avancées sans heurts majeurs — veillez simplement à saisir activement ces fenêtres.';
  } else if (totalTense >= totalHarm + 3) {
    climateLabel = 'Année Charnière & Transformatrice';
    climateNarrative =
      'Une forte proportion de carrés et d’oppositions génère une énergie décisive de passage à l’acte : la pression ressentie sert à trancher des situations figées et à franchir un palier de maturité.';
  } else if (totalFusion >= 4 && totalFusion >= totalTense) {
    climateLabel = 'Concentration Fusionnelle & Renouveau';
    climateNarrative =
      'De nombreuses conjonctions concentrent les énergies sur quelques points précis du thème, marquant des débuts de cycle nets et une focalisation intense sur vos priorités annuelles.';
  }

  const tightestTrigger = rsToNatalSorted[0]
    ? `${rsToNatalSorted[0].outerSymbol} ${rsToNatalSorted[0].outerPlanetName} RS ${rsToNatalSorted[0].symbol} ${rsToNatalSorted[0].natalSymbol} ${rsToNatalSorted[0].natalPlanetName} natal (${rsToNatalSorted[0].label}, ${rsToNatalSorted[0].orb.toFixed(1)}°)`
    : null;

  const tightestInternal = srInternalSorted[0]
    ? `${srInternalSorted[0].planetASymbol} ${srInternalSorted[0].planetAName} RS ${srInternalSorted[0].symbol} ${srInternalSorted[0].planetBSymbol} ${srInternalSorted[0].planetBName} RS (${srInternalSorted[0].label}, ${srInternalSorted[0].orb.toFixed(1)}°)`
    : null;

  // 2. Pillar Planets (combining role + house + aspects)
  const angularByPlanetId = new Map<PlanetId, Array<{ angleName: 'ASC' | 'MC' | 'DSC' | 'IC'; orb: number }>>();
  for (const ang of solarReturnAnalysis.angularPlanets) {
    const arr = angularByPlanetId.get(ang.planet.id) ?? [];
    arr.push({ angleName: ang.angleName, orb: ang.orb });
    angularByPlanetId.set(ang.planet.id, arr);
  }

  const scoredPlanets = srChart.planets.map((p) => {
    const reasons: string[] = [];
    let score = 0;

    if (solarReturnAnalysis.srAscRulerPlanet?.id === p.id) {
      score += 6;
      reasons.push('Seigneur de l’Année (Maître ASC RS)');
    }
    if (p.id === 'sun') {
      score += 5.5;
      reasons.push('Soleil RS (Cœur vital)');
    }
    if (p.id === 'moon') {
      score += 4.5;
      reasons.push('Lune RS (Climat quotidien)');
    }
    const angMatches = angularByPlanetId.get(p.id);
    if (angMatches && angMatches.length > 0) {
      score += 5 + (angMatches[0].orb <= 3 ? 2 : 0);
      reasons.push(`Angulaire (${angMatches.map((a) => `☌ ${a.angleName} ${a.orb}°`).join(', ')})`);
    }
    const dignity = getPlanetDignity(p.id, p.sign.index);
    if (p.id !== 'northNode' && (dignity.status === 'Domicile' || dignity.status === 'Exaltation')) {
      score += 1.5;
      reasons.push(dignity.status);
    }

    const compAsps = rsToNatalSorted.filter((a) => a.outerPlanet === p.id);
    const intAsps = srInternalSorted.filter((a) => a.planetA === p.id || a.planetB === p.id);

    for (const a of compAsps) score += a.orb <= 2.2 ? 1.6 : 0.8;
    for (const a of intAsps) score += a.orb <= 2.2 ? 1.1 : 0.5;

    if (reasons.length === 0) {
      reasons.push(`Pivot très aspecté (${compAsps.length + intAsps.length} aspects)`);
    }

    const srHouse = srChart.houses[p.house - 1];
    const natalHouse = baseChart.houses[findHouseForLongitude(p.longitude, baseChart.houses) - 1];

    const aspectHighlights: string[] = [
      ...compAsps.slice(0, 2).map(
        (a) =>
          `${a.outerSymbol} ${a.outerPlanetName} RS ${a.symbol} ${a.natalSymbol} ${a.natalPlanetName} natal (${a.label} · ${a.orb.toFixed(1)}°)`
      ),
      ...intAsps.slice(0, 2).map((a) => {
        const isA = a.planetA === p.id;
        const otherName = isA ? a.planetBName : a.planetAName;
        const otherSym = isA ? a.planetBSymbol : a.planetASymbol;
        return `${p.symbol} ${p.name} RS ${a.symbol} ${otherSym} ${otherName} RS (${a.label} · ${a.orb.toFixed(1)}°)`;
      }),
    ].slice(0, 3);

    const bestComp = compAsps[0];
    const bestInt = intAsps[0];
    let aspPhrase = 'Il agit de manière autonome dans son secteur sans aspect serré.';
    if (bestComp && bestInt) {
      const otherSym = bestInt.planetA === p.id ? bestInt.planetBSymbol : bestInt.planetASymbol;
      const otherName = bestInt.planetA === p.id ? bestInt.planetBName : bestInt.planetAName;
      aspPhrase = `Son ${bestComp.label.toLowerCase()} au ${bestComp.natalSymbol} ${bestComp.natalPlanetName} natal (${summarizeAspectToneFr(bestComp.harmony, bestComp.orb)}) et son ${bestInt.label.toLowerCase()} à ${otherSym} ${otherName} RS orientent directement ses effets.`;
    } else if (bestComp) {
      aspPhrase = `Il active votre thème via un ${bestComp.label.toLowerCase()} sur votre ${bestComp.natalSymbol} ${bestComp.natalPlanetName} natal (${summarizeAspectToneFr(bestComp.harmony, bestComp.orb)}).`;
    } else if (bestInt) {
      const otherSym = bestInt.planetA === p.id ? bestInt.planetBSymbol : bestInt.planetASymbol;
      const otherName = bestInt.planetA === p.id ? bestInt.planetBName : bestInt.planetAName;
      aspPhrase = `Dans le ciel de l’année, il forme un ${bestInt.label.toLowerCase()} avec ${otherSym} ${otherName} RS (${summarizeAspectToneFr(bestInt.harmony, bestInt.orb)}).`;
    }

    const trait = getPlanetTrait(p.id, p.sign.index);
    const synthesis = `${p.name} RS en ${p.sign.name}${dignity.status !== 'Pérégrine' && p.id !== 'northNode' ? ` (${dignity.status})` : ''} occupe la Maison ${srHouse.roman} RS (${srHouse.title}) et réveille votre Maison ${natalHouse.roman} natale (${natalHouse.title}) : ${trait ? `${trait.split(';')[0]}. ` : ''}${aspPhrase}`;

    return {
      score,
      pillar: {
        planetId: p.id,
        symbol: p.symbol,
        name: p.name,
        roleReason: reasons.slice(0, 2).join(' · '),
        positionSummary: `${p.formattedDeg} ${p.sign.symbol} ${p.sign.name} · M.${srHouse.roman} RS → M.${natalHouse.roman} nat.`,
        aspectHighlights,
        synthesis,
      } satisfies SolarReturnPillarPlanet,
    };
  });

  const pillarPlanets = scoredPlanets
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.pillar);

  // 3. Dominant Houses (combining occupants + natal superposition + ruler + aspects touching occupants)
  const scoredHouses = srChart.houses.map((srH) => {
    const occupants = srChart.planets.filter((p) => p.house === srH.house);
    const nonNodeOccupants = occupants.filter((p) => p.id !== 'northNode');
    let score = nonNodeOccupants.length * 2.5 + (occupants.length - nonNodeOccupants.length) * 1;
    if (occupants.some((p) => p.id === 'sun')) score += 4;
    if (occupants.some((p) => p.id === 'moon')) score += 2.5;
    if (solarReturnAnalysis.srAscRulerPlanet?.house === srH.house) score += 3;
    if (srH.house === 1 || srH.house === 10) score += 1.5;

    const occIds = new Set(occupants.map((o) => o.id));
    const linkedComp = rsToNatalSorted.filter((a) => occIds.has(a.outerPlanet));
    const linkedInt = srInternalSorted.filter((a) => occIds.has(a.planetA) || occIds.has(a.planetB));
    score += Math.min(4, (linkedComp.length + linkedInt.length) * 0.45);

    const natalSup = baseChart.houses[findHouseForLongitude(srH.longitude, baseChart.houses) - 1];
    const { rulerLocationText } = getHouseRulerInfo(srH, srChart.planets, srChart.houses);

    const linkedAspects = [
      ...linkedComp.slice(0, 2).map(
        (a) => `${a.outerSymbol} ${a.outerPlanetName} RS ${a.symbol} ${a.natalSymbol} ${a.natalPlanetName} nat. (${a.orb.toFixed(1)}°)`
      ),
      ...linkedInt.slice(0, 2).map(
        (a) => `${a.planetASymbol} ${a.planetAName} ${a.symbol} ${a.planetBSymbol} ${a.planetBName} RS (${a.orb.toFixed(1)}°)`
      ),
    ].slice(0, 3);

    const srHouseBase = getSolarReturnHouseMeaning(srH.house);
    const occPart =
      occupants.length > 0
        ? `Habitée par ${occupants.map((o) => `${o.symbol} ${o.name}`).join(', ')}, cette maison concentre l’action annuelle`
        : `Sans occupant direct, elle s’anime via son maître (${rulerLocationText})`;
    const aspPart =
      linkedAspects.length > 0
        ? ` et se trouve déclenchée par ${linkedAspects[0]}.`
        : '.';

    return {
      score,
      domHouse: {
        house: srH.house,
        roman: srH.roman,
        title: srH.title,
        occupants: occupants.map((o) => ({ id: o.id, symbol: o.symbol, name: o.name })),
        superposedNatalRoman: natalSup.roman,
        superposedNatalTitle: natalSup.title,
        rulerLocation: rulerLocationText,
        linkedAspects,
        synthesis: `${srHouseBase} Superposée à votre Maison ${natalSup.roman} natale (${natalSup.title}). ${occPart}${aspPart}`,
      } satisfies SolarReturnDominantHouse,
    };
  });

  const dominantHouses = scoredHouses
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((h) => h.domHouse);

  // 4. Four Synthesized Life Axes (Planètes + Maisons + Aspects)
  const formatAspectsForIds = (ids: PlanetId[], limit = 2): string[] => {
    const set = new Set(ids);
    const comp = rsToNatalSorted
      .filter((a) => set.has(a.outerPlanet) || set.has(a.natalPlanet))
      .slice(0, limit)
      .map(
        (a) =>
          `${a.outerSymbol} ${a.outerPlanetName} RS ${a.symbol} ${a.natalSymbol} ${a.natalPlanetName} nat. (${a.label}, ${a.orb.toFixed(1)}°)`
      );
    const intl = srInternalSorted
      .filter((a) => set.has(a.planetA) || set.has(a.planetB))
      .slice(0, Math.max(1, limit - comp.length))
      .map(
        (a) =>
          `${a.planetASymbol} ${a.planetAName} ${a.symbol} ${a.planetBSymbol} ${a.planetBName} RS (${a.label}, ${a.orb.toFixed(1)}°)`
      );
    return [...comp, ...intl].slice(0, 3);
  };

  const identityAspects = formatAspectsForIds(
    solarReturnAnalysis.srAscRulerPlanet ? ['sun', solarReturnAnalysis.srAscRulerPlanet.id] : ['sun'],
    3
  );
  const loveAspects = formatAspectsForIds(['moon', 'venus'], 3);
  const workAspects = formatAspectsForIds(['sun', 'mercury', 'jupiter', 'saturn'], 3);
  const tenseAspectsAll = [
    ...rsToNatalSorted
      .filter((a) => a.harmony === 'tense')
      .map((a) => `${a.outerSymbol} ${a.outerPlanetName} RS ${a.symbol} ${a.natalSymbol} ${a.natalPlanetName} nat. (${a.label}, ${a.orb.toFixed(1)}°)`),
    ...srInternalSorted
      .filter((a) => a.harmony === 'tense')
      .map((a) => `${a.planetASymbol} ${a.planetAName} ${a.symbol} ${a.planetBSymbol} ${a.planetBName} RS (${a.label}, ${a.orb.toFixed(1)}°)`),
  ];
  const innerAspects =
    tenseAspectsAll.length > 0
      ? tenseAspectsAll.slice(0, 3)
      : formatAspectsForIds(['uranus', 'neptune', 'pluto', 'northNode'], 3);

  const ascRuler = solarReturnAnalysis.srAscRulerPlanet;
  const h5Occupants = srChart.planets.filter((p) => p.house === 5);
  const h7Occupants = srChart.planets.filter((p) => p.house === 7);
  const h2_6_10Occupants = srChart.planets.filter((p) => p.house === 2 || p.house === 6 || p.house === 10);

  const lifeAxes: SolarReturnLifeAxis[] = [
    {
      id: 'identity',
      title: 'Identité, Posture & Direction Personnelle',
      accent: 'gold',
      housesInvolved: `ASC RS ${srChart.ascSign.name} → M.${solarReturnAnalysis.ascInNatalHouse.roman} natale · Soleil M.${solarReturnAnalysis.sunInSrHouse.roman} RS`,
      planetsInvolved: ascRuler
        ? `${ascRuler.symbol} ${ascRuler.name} (Maître ASC RS, M.${solarReturnAnalysis.srAscRulerSrHouse?.roman}) · ☉ Soleil`
        : '☉ Soleil RS',
      keyAspects: identityAspects,
      synthesis: `L’Ascendant annuel en ${srChart.ascSign.name} projeté en Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale (${solarReturnAnalysis.ascInNatalHouse.title}) fixe le décor général${
        ascRuler
          ? `, piloté par ${ascRuler.symbol} ${ascRuler.name} en ${ascRuler.sign.name} (Maison ${solarReturnAnalysis.srAscRulerSrHouse?.roman} RS)`
          : ''
      }. Avec le Soleil en Maison ${solarReturnAnalysis.sunInSrHouse.roman} RS (${solarReturnAnalysis.sunInSrHouse.title})${
        solarReturnAnalysis.angularPlanets.length > 0
          ? ` et ${solarReturnAnalysis.angularPlanets[0].planet.symbol} ${solarReturnAnalysis.angularPlanets[0].planet.name} conjoint à l’angle ${solarReturnAnalysis.angularPlanets[0].angleName}`
          : ''
      }, votre volonté s’exprime ${getHouseArenaFocus(solarReturnAnalysis.sunInSrHouse.house)}.${
        identityAspects[0] ? ` L’aspect clé (${identityAspects[0]}) donne le ton exact de cette affirmation.` : ''
      }`,
    },
    {
      id: 'love',
      title: 'Cœur, Vie Affective & Alliances',
      accent: 'rose',
      housesInvolved: `Lune M.${solarReturnAnalysis.moonInSrHouse.roman} RS · Vénus M.${srChart.houses[srVenus.house - 1].roman} RS · M.V & VII RS`,
      planetsInvolved: `☽ Lune (${srMoon.sign.name}) · ♀ Vénus (${srVenus.sign.name})`,
      keyAspects: loveAspects,
      synthesis: `Votre sensibilité s’accorde à une Lune RS en ${srMoon.sign.name} (Maison ${solarReturnAnalysis.moonInSrHouse.roman} RS / M.${solarReturnAnalysis.moonInNatalHouse.roman} nat.) et une Vénus RS en ${srVenus.sign.name} (Maison ${srChart.houses[srVenus.house - 1].roman} RS). ${
        h7Occupants.length > 0 || h5Occupants.length > 0
          ? `La présence de ${[...h7Occupants, ...h5Occupants].map((p) => `${p.symbol} ${p.name}`).join(', ')} en Maisons V/VII RS intensifie les rencontres, la vie à deux ou la créativité du cœur.`
          : 'L’évolution affective reste fluide et dépend surtout des aspects directs de Vénus et de la Lune.'
      }${loveAspects[0] ? ` Le lien ${loveAspects[0]} colore concrètement la dynamique relationnelle.` : ''}`,
    },
    {
      id: 'work',
      title: 'Œuvre, Carrière & Équilibre Matériel',
      accent: 'cyan',
      housesInvolved: `MC RS ${srChart.mcSign.name} → M.${solarReturnAnalysis.mcInNatalHouse.roman} natale · Maisons II, VI, X`,
      planetsInvolved: `♃ Jupiter (M.${srChart.houses[srJupiter.house - 1].roman}) · ♄ Saturne (M.${srChart.houses[srSaturn.house - 1].roman})`,
      keyAspects: workAspects,
      synthesis: `Le Milieu du Ciel RS en ${srChart.mcSign.name} active votre Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale (${solarReturnAnalysis.mcInNatalHouse.title}). Jupiter en Maison ${srChart.houses[srJupiter.house - 1].roman} RS ouvre les opportunités d’essor, tandis que Saturne en Maison ${srChart.houses[srSaturn.house - 1].roman} RS structure les engagements durables. ${
        h2_6_10Occupants.length > 0
          ? `Concentration concrète sur l’axe matériel/professionnel avec ${h2_6_10Occupants.map((p) => `${p.symbol} ${p.name}`).join(', ')}.`
          : 'Les avancées professionnelles passent par le suivi méthodique du maître du MC RS.'
      }${workAspects[0] ? ` Configuration motrice : ${workAspects[0]}.` : ''}`,
    },
    {
      id: 'inner',
      title: 'Mues Profondes, Éveil & Vigilances de l’Année',
      accent: 'emerald',
      housesInvolved: `Nœud Nord M.${srChart.houses[srNode.house - 1].roman} RS · Pluton M.${srChart.houses[srPluto.house - 1].roman} · Uranus M.${srChart.houses[srUranus.house - 1].roman}`,
      planetsInvolved: `♅ Uranus · ♆ Neptune · ♇ Pluton · ☊ Nœud Nord`,
      keyAspects: innerAspects,
      synthesis: `Le cap évolutif annuel (☊ Nœud Nord en ${srNode.sign.name}, Maison ${srChart.houses[srNode.house - 1].roman} RS) invite à dépasser vos réflexes habituels, pendant qu’Uranus (M.${srChart.houses[srUranus.house - 1].roman} RS), Neptune (M.${srChart.houses[srNeptune.house - 1].roman} RS) et Pluton (M.${srChart.houses[srPluto.house - 1].roman} RS) renouvellent les fondations. ${
        solarReturnAnalysis.retrogradeSrPlanets.length > 0
          ? `Attention aux rétrogradations d’ouverture (${solarReturnAnalysis.retrogradeSrPlanets.map((p) => `${p.symbol} ${p.name}`).join(', ')}) qui demandent maturation avant de trancher.`
          : 'Aucune planète rétrograde majeure ne freine le démarrage concret des projets.'
      }${tenseAspectsAll[0] ? ` Point de vigilance principal à transformer en force : ${tenseAspectsAll[0]}.` : ''}`,
    },
  ];

  // 5. Master Executive Synthesis (Planètes + Maisons + Aspects)
  const srAscLabel = getSignLabel(srChart.ascendant, srChart.ascSign.name, srChart.ascSign.symbol, tradition);
  const topHouse = dominantHouses[0];
  const topPillar = pillarPlanets[0];

  const executiveSynthesis = `Pour ${year} à ${srChart.cityName}, la synthèse croisée Planètes + Maisons + Aspects dessine une année placée sous l’Ascendant ${srAscLabel} (${solarReturnAnalysis.ascDegFormatted}) tombant dans votre Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale (${solarReturnAnalysis.ascInNatalHouse.title}). Le foyer solaire en Maison ${solarReturnAnalysis.sunInSrHouse.roman} RS (${srSun.sign.name})${
    topHouse && topHouse.house !== solarReturnAnalysis.sunInSrHouse.house
      ? ` et la forte activation de la Maison ${topHouse.roman} RS (${topHouse.title})`
      : ''
  } convergent autour de ${topPillar ? `${topPillar.symbol} ${topPillar.name} (${topPillar.positionSummary})` : 'votre Gouverneur d’Ascendant'}. Sur le plan des aspects (${climateLabel.toLowerCase()}), ${
    tightestTrigger
      ? `le déclencheur principal reliant le ciel annuel à votre thème natal est ${tightestTrigger}`
      : 'les planètes annuelles dialoguent en douceur avec votre base natale'
  }${tightestInternal ? `, soutenu intérieurement par ${tightestInternal}` : ''}.`;

  // 6. Concrete Action Levers
  const actionLevers: string[] = [
    `Levier d’essor : appuyez-vous sur ${srJupiter.symbol} Jupiter en Maison ${srChart.houses[srJupiter.house - 1].roman} RS et sur l’axe Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale / Maison ${solarReturnAnalysis.sunInSrHouse.roman} RS pour concrétiser vos priorités.`,
    tightestTrigger
      ? `Résonance natale à cultiver : travaillez consciemment avec ${tightestTrigger}${
          solarReturnAnalysis.angularPlanets[0]
            ? ` ainsi que la dominante angulaire ${solarReturnAnalysis.angularPlanets[0].planet.symbol} ${solarReturnAnalysis.angularPlanets[0].planet.name} ☌ ${solarReturnAnalysis.angularPlanets[0].angleName}`
            : ''
        }.`
      : `Posture d’année : misez sur le Gouverneur de l’Ascendant (${solarReturnAnalysis.srAscRuler}) pour garder le cap sans dispersion.`,
    tenseAspectsAll[0]
      ? `Vigilance constructive : ne subissez pas ${tenseAspectsAll[0]} — utilisez cette tension comme un signal clair pour poser vos limites et ajuster votre calendrier.`
      : `Vigilance constructive : avec un climat globalement fluide (${totalHarm} aspects harmoniques), veillez à maintenir un cap concret pour ne pas laisser passer les opportunités.`,
  ];

  // 7. Plain-Text Export for Clipboard / Sharing
  const plainTextExport = [
    `SYNTHÈSE RÉVOLUTION SOLAIRE ${year} — ${srChart.cityName}`,
    `Climat des aspects : ${climateLabel} (RS→Natal : ${rsToNatalCounts.harmonious} harm. / ${rsToNatalCounts.tense} tens. / ${rsToNatalCounts.fusion} conj. · RS↔RS : ${rsInternalCounts.harmonious} harm. / ${rsInternalCounts.tense} tens. / ${rsInternalCounts.fusion} conj.)`,
    '',
    '1. SYNTHÈSE CROISÉE (PLANÈTES + MAISONS + ASPECTS)',
    executiveSynthesis,
    '',
    '2. PLANÈTES-PILIERS DE L’ANNÉE',
    ...pillarPlanets.map(
      (p) =>
        `• ${p.symbol} ${p.name} [${p.roleReason}] — ${p.positionSummary}\n  ${p.synthesis}${
          p.aspectHighlights.length > 0 ? `\n  Aspects clés : ${p.aspectHighlights.join(' | ')}` : ''
        }`
    ),
    '',
    '3. MAISONS LES PLUS ACTIVÉES',
    ...dominantHouses.map(
      (h) => `• Maison ${h.roman} RS (${h.title} → M.${h.superposedNatalRoman} natale)\n  ${h.synthesis}`
    ),
    '',
    '4. SYNTHÈSE PAR DOMAINES DE VIE',
    ...lifeAxes.map((ax) => `• ${ax.title} (${ax.housesInvolved})\n  ${ax.synthesis}`),
    '',
    '5. CAPS D’ACTION & VIGILANCES',
    ...actionLevers.map((l) => `- ${l}`),
  ].join('\n');

  return {
    headline: `Synthèse Révolution Solaire ${year} (Planètes + Maisons + Aspects)`,
    subtitle: `${srChart.cityName} · ${climateLabel} · ASC RS ${solarReturnAnalysis.ascDegFormatted} ${srChart.ascSign.name}`,
    executiveSynthesis,
    aspectClimate: {
      rsToNatal: rsToNatalCounts,
      rsInternal: rsInternalCounts,
      climateLabel,
      climateNarrative,
      tightestTrigger,
      tightestInternal,
    },
    dominantHouses,
    pillarPlanets,
    lifeAxes,
    actionLevers,
    plainTextExport,
  };
}

export function generateChartInterpretation(params: {
  mode: ChartMode;
  tradition: ZodiacTradition;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  solarReturnAnalysis: SolarReturnAnalysis | null;
  comparativeAnalysis: ComparativeAnalysis | null;
}): ChartInterpretationReport {
  const {
    mode,
    tradition,
    baseChart,
    outerChart,
    comparisonAspects,
    solarReturnAnalysis,
    comparativeAnalysis,
  } = params;

  const sun = baseChart.planets.find((p) => p.id === 'sun')!;
  const moon = baseChart.planets.find((p) => p.id === 'moon')!;
  const mercury = baseChart.planets.find((p) => p.id === 'mercury')!;
  const venus = baseChart.planets.find((p) => p.id === 'venus')!;
  const mars = baseChart.planets.find((p) => p.id === 'mars')!;
  const jupiter = baseChart.planets.find((p) => p.id === 'jupiter')!;
  const saturn = baseChart.planets.find((p) => p.id === 'saturn')!;
  const uranus = baseChart.planets.find((p) => p.id === 'uranus')!;
  const neptune = baseChart.planets.find((p) => p.id === 'neptune')!;
  const pluto = baseChart.planets.find((p) => p.id === 'pluto')!;
  const northNode = baseChart.planets.find((p) => p.id === 'northNode')!;

  const domEl = getDominantElement(baseChart.elements);
  const baziBase = calculateBaziSummary(baseChart);
  const lunarPhase = getLunarPhaseInfo(sun.longitude, moon.longitude);

  const ascLabel = getSignLabel(
    baseChart.ascendant,
    baseChart.ascSign.name,
    baseChart.ascSign.symbol,
    tradition
  );
  const mcLabel = getSignLabel(
    baseChart.midheaven,
    baseChart.mcSign.name,
    baseChart.mcSign.symbol,
    tradition
  );
  const sunLabel = getSignLabel(sun.longitude, sun.sign.name, sun.sign.symbol, tradition);
  const moonLabel = getSignLabel(moon.longitude, moon.sign.name, moon.sign.symbol, tradition);

  const ascRuler =
    baseChart.planets.find((p) => p.name.toLowerCase() === baseChart.ascSign.ruler.toLowerCase()) ??
    null;
  const mcRuler =
    baseChart.planets.find((p) => p.name.toLowerCase() === baseChart.mcSign.ruler.toLowerCase()) ??
    null;

  const baziSection: InterpretationSection = {
    title: 'Transposition Chinoise, 4 Piliers (BaZi) & Cycle Wu Xing',
    accent: 'amber',
    body: `Sous l’optique chinoise, l’année solaire est régie par le ${baziBase.yearPillar.label}, le mois solaire par ${baziBase.monthPillar.label} et l’heure solaire locale par ${baziBase.hourPillar.branch.name} (${baziBase.hourPillar.branch.hours}). L’élément Wu Xing dominant est ${baziBase.dominantWuXing}, exprimant ${WUXING_TEMPERAMENT[baziBase.dominantWuXing]}. ${getWuXingDynamicAdvice(baziBase.wuXingBalance, baziBase.dominantWuXing)}`,
    highlights: [
      `Soleil transposé : ${transposeLongitudeToChinese(sun.longitude).sign.name} (${transposeLongitudeToChinese(sun.longitude).sign.wuXing})`,
      `Lune transposée : ${transposeLongitudeToChinese(moon.longitude).sign.name} (${transposeLongitudeToChinese(moon.longitude).sign.wuXing})`,
      `Ascendant transposé : ${transposeLongitudeToChinese(baseChart.ascendant).sign.name} (${transposeLongitudeToChinese(baseChart.ascendant).sign.wuXing})`,
    ],
  };

  if (mode === 'natal') {
    const tightAspects = baseChart.aspects.slice(0, 6);
    const sunHouse = baseChart.houses[sun.house - 1];
    const moonHouse = baseChart.houses[moon.house - 1];
    const sunDecan = getDecanInfo(sun.sign, sun.degInSign);
    const moonDecan = getDecanInfo(moon.sign, moon.degInSign);
    const ascDegInSign = ((baseChart.ascendant % 30) + 30) % 30;
    const ascProfile = getAscendantDeepInterpretation(baseChart.ascSign, ascDegInSign);
    const dominantModality = (['Cardinal', 'Fixe', 'Mutable'] as const).reduce((best, cur) =>
      baseChart.modalities[cur] > baseChart.modalities[best] ? cur : best
    );
    const modalityDesc =
      dominantModality === 'Cardinal'
        ? 'un tempérament d’initiative, tourné vers le lancement et l’impulsion'
        : dominantModality === 'Fixe'
          ? 'une grande persévérance, de la constance et un fort pouvoir d’enracinement'
          : 'une souplesse d’adaptation, de la curiosité et une capacité de synthèse évolutive';

    const southNodeLon = normalizeDeg(northNode.longitude + 180);
    const southNodeSign = ZODIAC_SIGNS[(northNode.sign.index + 6) % 12];
    const southNodeHouseNum = ((northNode.house - 1 + 6) % 12) + 1;
    const southNodeHouse = baseChart.houses[southNodeHouseNum - 1];

    const notableDignities = baseChart.planets
      .filter((p) => p.id !== 'northNode')
      .map((p) => ({ p, dig: getPlanetDignity(p.id, p.sign.index) }))
      .filter((item) => item.dig.status !== 'Pérégrine');

    const ascRulerSentence = ascRuler
      ? ` Le Maître d’Ascendant, ${ascRuler.symbol} ${ascRuler.name} (${getPlanetDignity(ascRuler.id, ascRuler.sign.index).status}), se place en ${ascRuler.sign.name} (Maison ${baseChart.houses[ascRuler.house - 1].roman}), orientant concrètement le fil conducteur de votre destinée ${getHouseArenaFocus(ascRuler.house)}.`
      : '';

    const mcRulerSentence = mcRuler
      ? ` Son maître ${mcRuler.symbol} ${mcRuler.name} en ${mcRuler.sign.name} (Maison ${baseChart.houses[mcRuler.house - 1].roman}) précise le levier concret de votre réussite sociale.`
      : '';

    const detailedPlanets: DetailedPlanetInterpretation[] = baseChart.planets.map((p) => {
      const decan = getDecanInfo(p.sign, p.degInSign);
      const dignity = getPlanetDignity(p.id, p.sign.index);
      const house = baseChart.houses[p.house - 1];
      const ruled = getRuledHousesLabels(p.id, baseChart.houses);
      const aspectCount = baseChart.aspects.filter(
        (a) => a.planetA === p.id || a.planetB === p.id
      ).length;
      const ch = transposeLongitudeToChinese(p.longitude).sign;
      return {
        planetId: p.id,
        layer: 'base',
        name: p.name,
        symbol: p.symbol,
        signName: p.sign.name,
        signSymbol: p.sign.symbol,
        formattedDeg: p.formattedDeg,
        decanLabel: decan.label,
        dignityStatus: dignity.status,
        dignityColor: dignity.badgeColor,
        houseRoman: house.roman,
        houseTitle: house.title,
        retrograde: p.retrograde,
        ruledHouses: ruled,
        aspectCount,
        summary: getNatalPlanetDetailedText(p, baseChart, aspectCount),
        chineseLabel: `${ch.branchHanzi}${ch.hanzi} ${ch.name} (${ch.wuXing})`,
      };
    });

    const detailedHouses: DetailedHouseInterpretation[] = baseChart.houses.map((h) => {
      const { rulerLocationText } = getHouseRulerInfo(h, baseChart.planets, baseChart.houses);
      const occupants = baseChart.planets
        .filter((p) => p.house === h.house)
        .map((p) => ({
          id: p.id,
          symbol: p.symbol,
          name: p.name,
          formattedDeg: p.formattedDeg,
        }));
      return {
        house: h.house,
        roman: h.roman,
        title: h.title,
        signName: h.sign.name,
        signSymbol: h.sign.symbol,
        formattedDeg: h.formattedDeg,
        rulerName: h.sign.ruler,
        rulerLocation: rulerLocationText,
        occupants,
        interpretation: getNatalHouseDetailedText(h, baseChart),
      };
    });

    const detailedAspects: DetailedAspectItem[] = [...baseChart.aspects]
      .sort((a, b) => a.orb - b.orb)
      .map((a) => ({
        id: a.id,
        layer: 'natal',
        title: `${a.planetASymbol} ${a.planetAName} ${a.symbol} ${a.planetBSymbol} ${a.planetBName}`,
        aspectLabel: a.label,
        symbol: a.symbol,
        cssColor: a.cssColor,
        harmony: a.harmony,
        orb: a.orb,
        interpretation: a.interpretation,
        planetA: a.planetA,
        planetB: a.planetB,
      }));

    return {
      headline: 'Interprétation Complète du Thème Natal',
      subtitle: `${sunLabel} · Lune ${moonLabel} · ASC ${ascLabel}`,
      synthesis: `Ce thème natal s’organise autour d’une dominante ${domEl} et d’une modalité ${dominantModality}, révélant ${ELEMENT_TEMPERAMENT[domEl]}, ainsi que ${modalityDesc}. Né sous une ${lunarPhase.name} (écart Soleil–Lune ${lunarPhase.angleDeg}°), ce ciel articule la volonté solaire en ${sunLabel} (Maison ${sunHouse.roman}) et l’instinct lunaire en ${moonLabel} (Maison ${moonHouse.roman}). ${getHemisphereBalance(baseChart)}`,
      detailedContextLabel: 'Thème Natal seul',
      detailedPlanets,
      detailedHouses,
      detailedAspects,
      sections: [
        {
          title: 'Triade Fondamentale, Ascendant & Maître d’Ascendant',
          accent: 'gold',
          body: `Soleil en ${sunLabel} (${sunDecan.label}, Maison ${sunHouse.roman} · ${sunHouse.title}) — ${getPlanetTrait('sun', sun.sign.index)}, énergie investie ${getHouseArenaFocus(sun.house)}. Lune en ${moonLabel} (${moonDecan.label}, Maison ${moonHouse.roman} · ${moonHouse.title}) — ${getPlanetTrait('moon', moon.sign.index)}. Ascendant en ${ascLabel} : ${ascProfile.temperament} ${ascProfile.axisBalance}${ascRulerSentence}`,
          highlights: [
            `Soleil : ${sun.formattedDeg} ${sun.sign.name} · ${sunDecan.decanNumber}${sunDecan.decanNumber === 1 ? 'er' : 'e'} décan · Maison ${sunHouse.roman}`,
            `Lune : ${moon.formattedDeg} ${moon.sign.name} · ${lunarPhase.name}`,
            `Ascendant : ${ascProfile.firstImpression}`,
            ascRuler
              ? `Gouverneur du thème (${ascRuler.name}) : ${ascRuler.sign.name} M.${baseChart.houses[ascRuler.house - 1].roman}`
              : `Ascendant : ${baseChart.ascSign.name}`,
          ],
        },
        {
          title: 'Cycle Solaire-Lunaire, Mentale & Affective (Mercure · Vénus · Mars)',
          accent: 'cyan',
          body: `${lunarPhase.summary} Mercure en ${getSignLabel(mercury.longitude, mercury.sign.name, mercury.sign.symbol, tradition)} (Maison ${baseChart.houses[mercury.house - 1].roman}${mercury.retrograde ? ' ℞' : ''}) — ${getPlanetTrait('mercury', mercury.sign.index)}. Vénus en ${getSignLabel(venus.longitude, venus.sign.name, venus.sign.symbol, tradition)} (Maison ${baseChart.houses[venus.house - 1].roman}${venus.retrograde ? ' ℞' : ''}) — ${getPlanetTrait('venus', venus.sign.index)}. Mars en ${getSignLabel(mars.longitude, mars.sign.name, mars.sign.symbol, tradition)} (Maison ${baseChart.houses[mars.house - 1].roman}${mars.retrograde ? ' ℞' : ''}) — ${getPlanetTrait('mars', mars.sign.index)}.`,
          highlights: [
            `Mercure M.${baseChart.houses[mercury.house - 1].roman} · ${getPlanetDignity('mercury', mercury.sign.index).status}`,
            `Vénus M.${baseChart.houses[venus.house - 1].roman} · ${getPlanetDignity('venus', venus.sign.index).status}`,
            `Mars M.${baseChart.houses[mars.house - 1].roman} · ${getPlanetDignity('mars', mars.sign.index).status}`,
          ],
        },
        {
          title: 'Expansion, Structuration & Axe Karmique (☊ Nœud Nord ↔ ☋ Nœud Sud)',
          accent: 'amber',
          body: `Jupiter en ${jupiter.sign.name} (Maison ${baseChart.houses[jupiter.house - 1].roman}) — ${getPlanetTrait('jupiter', jupiter.sign.index)}. Saturne en ${saturn.sign.name} (Maison ${baseChart.houses[saturn.house - 1].roman}) — ${getPlanetTrait('saturn', saturn.sign.index)}. Sur l’axe nodal, votre Nœud Nord en ${northNode.sign.name} (Maison ${baseChart.houses[northNode.house - 1].roman}) vous invite à ${getPlanetTrait('northNode', northNode.sign.index)}, en équilibrant les acquis hérités de votre Nœud Sud en ${southNodeSign.symbol} ${southNodeSign.name} (Maison ${southNodeHouse.roman}, ${Math.floor(southNodeLon % 30)}°).`,
          highlights: [
            `Uranus en ${uranus.sign.name} (M.${baseChart.houses[uranus.house - 1].roman}) : ${getPlanetTrait('uranus', uranus.sign.index)}`,
            `Neptune en ${neptune.sign.name} (M.${baseChart.houses[neptune.house - 1].roman}) : ${getPlanetTrait('neptune', neptune.sign.index)}`,
            `Pluton en ${pluto.sign.name} (M.${baseChart.houses[pluto.house - 1].roman}) : ${getPlanetTrait('pluto', pluto.sign.index)}`,
          ],
        },
        {
          title: 'Vocation, Équilibre Élémentaire & Dignités Planétaires',
          accent: 'emerald',
          body: `Le Milieu du Ciel en ${mcLabel} oriente votre accomplissement public vers ${baseChart.mcSign.keywords.toLowerCase()}.${mcRulerSentence} Éléments : Feu ${baseChart.elements.Feu}, Terre ${baseChart.elements.Terre}, Air ${baseChart.elements.Air}, Eau ${baseChart.elements.Eau}. ${getElementDeficitAdvice(baseChart.elements)}`,
          highlights:
            notableDignities.length > 0
              ? notableDignities.map((d) => `${d.p.symbol} ${d.p.name} en ${d.p.sign.name} : ${d.dig.status}`)
              : ['Répartition équilibrée sans planète en dignité ou faiblesse marquée.'],
        },
        {
          title: 'Aspects Majeurs du Natal (Vue Synthétique)',
          accent: 'rose',
          body:
            tightAspects.length > 0
              ? `Sur les ${baseChart.aspects.length} aspects natals calculés, voici les configurations angulaires les plus serrées (consultez l’onglet Aspects pour l’intégralité) :`
              : 'Les planètes évoluent avec une grande autonomie angulaire, sans aspect majeur très serré.',
          highlights: tightAspects.map((a) => a.interpretation),
        },
        baziSection,
      ],
    };
  }

  if (mode === 'solarReturn' && outerChart && solarReturnAnalysis) {
    const srSun = outerChart.planets.find((p) => p.id === 'sun')!;
    const srMoon = outerChart.planets.find((p) => p.id === 'moon')!;
    const srMercury = outerChart.planets.find((p) => p.id === 'mercury')!;
    const srVenus = outerChart.planets.find((p) => p.id === 'venus')!;
    const srMars = outerChart.planets.find((p) => p.id === 'mars')!;
    const srJupiter = outerChart.planets.find((p) => p.id === 'jupiter')!;
    const srSaturn = outerChart.planets.find((p) => p.id === 'saturn')!;
    const srUranus = outerChart.planets.find((p) => p.id === 'uranus')!;
    const srPluto = outerChart.planets.find((p) => p.id === 'pluto')!;
    const srBazi = calculateBaziSummary(outerChart);
    const natalAscCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
    const srAscCh = transposeLongitudeToChinese(outerChart.ascendant).sign;
    const ascHarmony = evaluateAnimalHarmony(natalAscCh, srAscCh);
    const srLunarPhase = getLunarPhaseInfo(srSun.longitude, srMoon.longitude);
    const topAspects = comparisonAspects.slice(0, 6);

    const srAscDegInSign = ((outerChart.ascendant % 30) + 30) % 30;
    const srAscProfile = getAscendantDeepInterpretation(outerChart.ascSign, srAscDegInSign);
    const srAscLabel = getSignLabel(
      outerChart.ascendant,
      outerChart.ascSign.name,
      outerChart.ascSign.symbol,
      tradition
    );
    const srMcLabel = getSignLabel(
      outerChart.midheaven,
      outerChart.mcSign.name,
      outerChart.mcSign.symbol,
      tradition
    );
    const srAscOverlayMeaning = getSolarReturnAscInNatalHouseInterpretation(
      solarReturnAnalysis.ascInNatalHouse.house
    );
    const srSunRefined = getSolarReturnSunInHouseRefined(solarReturnAnalysis.sunInSrHouse.house);
    const sunRuledSrHouses = getRuledHousesLabels('sun', outerChart.houses);
    const rulerPlanet = solarReturnAnalysis.srAscRulerPlanet;
    const rulerDignity = rulerPlanet
      ? getPlanetDignity(rulerPlanet.id, rulerPlanet.sign.index)
      : null;
    const natalRulerInSr = solarReturnAnalysis.natalAscRulerInSr;
    const hemisphereBalance = getHemisphereBalance(outerChart);
    const srTightInternalAspects = outerChart.aspects.slice(0, 4);

    const detailedPlanets: DetailedPlanetInterpretation[] = outerChart.planets.map((srP) => {
      const decan = getDecanInfo(srP.sign, srP.degInSign);
      const dignity = getPlanetDignity(srP.id, srP.sign.index);
      const srHouse = outerChart.houses[srP.house - 1];
      const natalHouseNum = findHouseForLongitude(srP.longitude, baseChart.houses);
      const natalHouse = baseChart.houses[natalHouseNum - 1];
      const ruledSr = getRuledHousesLabels(srP.id, outerChart.houses);
      const srAspectCount =
        comparisonAspects.filter((a) => a.outerPlanet === srP.id).length +
        outerChart.aspects.filter((a) => a.planetA === srP.id || a.planetB === srP.id).length;
      const ch = transposeLongitudeToChinese(srP.longitude).sign;

      return {
        planetId: srP.id,
        layer: 'outer',
        name: `${srP.name} RS`,
        symbol: srP.symbol,
        signName: srP.sign.name,
        signSymbol: srP.sign.symbol,
        formattedDeg: srP.formattedDeg,
        decanLabel: decan.label,
        dignityStatus: dignity.status,
        dignityColor: dignity.badgeColor,
        houseRoman: `${srHouse.roman} RS`,
        houseTitle: srHouse.title,
        natalHouseRoman: natalHouse.roman,
        natalHouseTitle: natalHouse.title,
        retrograde: srP.retrograde,
        ruledHouses: ruledSr,
        aspectCount: srAspectCount,
        summary: getSolarReturnPlanetDetailedText(srP, outerChart, natalHouse, srAspectCount),
        chineseLabel: `${ch.branchHanzi}${ch.hanzi} ${ch.name} (${ch.wuXing})`,
      };
    });

    const detailedHouses: DetailedHouseInterpretation[] = outerChart.houses.map((srH) => {
      const natalHouseNum = findHouseForLongitude(srH.longitude, baseChart.houses);
      const natalSuperposed = baseChart.houses[natalHouseNum - 1];
      const { rulerLocationText } = getHouseRulerInfo(srH, outerChart.planets, outerChart.houses);
      const occupants = outerChart.planets
        .filter((p) => p.house === srH.house)
        .map((p) => ({
          id: p.id,
          symbol: p.symbol,
          name: `${p.name} RS`,
          formattedDeg: p.formattedDeg,
          layer: 'outer' as const,
        }));

      return {
        house: srH.house,
        roman: `${srH.roman} RS`,
        title: srH.title,
        signName: srH.sign.name,
        signSymbol: srH.sign.symbol,
        formattedDeg: srH.formattedDeg,
        rulerName: srH.sign.ruler,
        rulerLocation: rulerLocationText,
        occupants,
        occupantLayer: 'outer',
        canTargetHouse: false,
        superposedNatalHouse: `Superposée à la Maison ${natalSuperposed.roman} natale (${natalSuperposed.title})`,
        interpretation: getSolarReturnHouseDetailedText(srH, outerChart, natalSuperposed),
      };
    });

    const detailedAspects: DetailedAspectItem[] = [...comparisonAspects]
      .sort((a, b) => a.orb - b.orb)
      .map((a) => ({
        id: a.id,
        layer: 'comparison',
        title: `${a.outerSymbol} ${a.outerPlanetName} (RS) ${a.symbol} ${a.natalSymbol} ${a.natalPlanetName} (Natal)`,
        aspectLabel: a.label,
        symbol: a.symbol,
        cssColor: a.cssColor,
        harmony: a.harmony,
        orb: a.orb,
        interpretation: a.interpretation,
        planetA: a.outerPlanet,
        planetB: a.natalPlanet,
      }));

    const secondaryAspects: DetailedAspectItem[] = [...outerChart.aspects]
      .sort((a, b) => a.orb - b.orb)
      .map((a) => ({
        id: `sr-${a.id}`,
        layer: 'srInternal',
        title: `${a.planetASymbol} ${a.planetAName} RS ${a.symbol} ${a.planetBSymbol} ${a.planetBName} RS`,
        aspectLabel: a.label,
        symbol: a.symbol,
        cssColor: a.cssColor,
        harmony: a.harmony,
        orb: a.orb,
        interpretation: a.interpretation,
        planetA: a.planetA,
        planetB: a.planetB,
      }));

    const rulerSummarySentence = rulerPlanet
      ? ` Le Maître de l’Ascendant annuel (Seigneur de l’année), ${rulerPlanet.symbol} ${rulerPlanet.name}, se place en ${rulerPlanet.sign.name} (${rulerDignity?.status ?? 'Pérégrine'}${rulerPlanet.retrograde ? ' · Rétrograde ℞' : ''}) dans la Maison ${solarReturnAnalysis.srAscRulerSrHouse?.roman ?? rulerPlanet.house} RS${
          solarReturnAnalysis.srAscRulerNatalHouse
            ? ` et active votre Maison ${solarReturnAnalysis.srAscRulerNatalHouse.roman} natale (${solarReturnAnalysis.srAscRulerNatalHouse.title})`
            : ''
        }, indiquant le levier concret par lequel l’année se réalise.`
      : '';

    const natalRulerBridgeSentence =
      natalRulerInSr && solarReturnAnalysis.natalAscRulerSrHouse
        ? ` Par ailleurs, votre Maître d’Ascendant natal (${natalRulerInSr.symbol} ${natalRulerInSr.name}) évolue en Maison ${solarReturnAnalysis.natalAscRulerSrHouse.roman} RS (${natalRulerInSr.sign.name}), montrant vers quel domaine annuel se tourne votre élan profond.`
        : '';

    const solarReturnSynthesis = buildSolarReturnSynthesis({
      baseChart,
      srChart: outerChart,
      comparisonAspects,
      solarReturnAnalysis,
      tradition,
    });

    return {
      headline: `Interprétation Complète de la Révolution Solaire ${outerChart.date.getFullYear()}`,
      subtitle: `${outerChart.cityName} · ASC RS ${solarReturnAnalysis.ascDegFormatted} ${srAscLabel} → M.${solarReturnAnalysis.ascInNatalHouse.roman} natale`,
      synthesis: solarReturnSynthesis.executiveSynthesis,
      detailedContextLabel: `Révolution Solaire ${outerChart.date.getFullYear()}`,
      detailedPlanets,
      detailedHouses,
      detailedAspects,
      secondaryAspects,
      secondaryAspectsLabel: `Aspects internes de la Révolution Solaire (RS ↔ RS · ${secondaryAspects.length})`,
      solarReturnSynthesis,
      sections: [
        {
          title: 'Ascendant de Révolution (ASC RS) & Maître de l’Année',
          accent: 'gold',
          body: `L’Ascendant annuel en ${srAscLabel} à ${solarReturnAnalysis.ascDegFormatted} (${srAscProfile.decanNote}) imprime votre posture et la façon dont les événements vous sollicitent sur 12 mois : ${srAscProfile.temperament} ${srAscOverlayMeaning}${rulerSummarySentence}`,
          highlights: [
            `ASC RS : ${solarReturnAnalysis.ascDegFormatted} ${outerChart.ascSign.symbol} ${outerChart.ascSign.name} (${outerChart.ascSign.element} · ${outerChart.ascSign.modality})`,
            `Superposition : ASC RS en Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale (${solarReturnAnalysis.ascInNatalHouse.title})`,
            `Dialogue avec l’ASC Natal (${baseChart.ascSign.name}) : ${solarReturnAnalysis.ascRelationToNatal.label}`,
            rulerPlanet
              ? `Gouverneur de l’année : ${rulerPlanet.symbol} ${rulerPlanet.name} en ${rulerPlanet.sign.name} · Maison ${solarReturnAnalysis.srAscRulerSrHouse?.roman} RS${
                  solarReturnAnalysis.srAscRulerNatalHouse
                    ? ` / M.${solarReturnAnalysis.srAscRulerNatalHouse.roman} natale`
                    : ''
                } [${rulerDignity?.status ?? 'Pérégrine'}]`
              : `Maître de l’ASC RS : ${solarReturnAnalysis.srAscRuler}`,
          ],
        },
        {
          title: 'Foyer Solaire, Milieu du Ciel & Fil Natal',
          accent: 'cyan',
          body: `${srSunRefined}${sunRuledSrHouses.length > 0 ? ` Le Soleil gouverne également ${sunRuledSrHouses.length > 1 ? 'les Maisons' : 'la Maison'} ${sunRuledSrHouses.join(' et ')} de la carte RS, liant ces secteurs à votre objectif central.` : ''} Le Milieu du Ciel RS à ${solarReturnAnalysis.mcDegFormatted} ${srMcLabel} active votre Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale (${solarReturnAnalysis.mcInNatalHouse.title}), plaçant votre rayonnement social en lien direct avec ce secteur natal.${natalRulerBridgeSentence}`,
          highlights: [
            `Soleil RS : Maison ${solarReturnAnalysis.sunInSrHouse.roman} RS (${solarReturnAnalysis.sunInSrHouse.title}) · Maison ${solarReturnAnalysis.sunInNatalHouse.roman} natale`,
            `Milieu du Ciel RS : ${solarReturnAnalysis.mcDegFormatted} ${outerChart.mcSign.symbol} ${outerChart.mcSign.name} → Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale`,
            natalRulerInSr && solarReturnAnalysis.natalAscRulerSrHouse
              ? `Maître ASC Natal (${natalRulerInSr.symbol} ${natalRulerInSr.name}) → Maison ${solarReturnAnalysis.natalAscRulerSrHouse.roman} RS`
              : `Base natale : ASC ${baseChart.ascSign.symbol} ${baseChart.ascSign.name}`,
          ],
        },
        {
          title: 'Planètes Dominantes aux Angles & Axes de l’Année',
          accent: 'rose',
          body:
            solarReturnAnalysis.angularPlanets.length > 0
              ? `En astrologie des Révolutions Solaires, toute planète placée à moins de 8° d’un angle (ASC, MC, DSC, IC) devient une dominante majeure de l’année et colore concrètement les événements clés :`
              : `Aucune planète RS ne se situe en conjonction étroite (< 8°) avec les quatre angles cardinaux cette année : l’année évolue de manière plus progressive, portée par les maîtres de l’Ascendant (${solarReturnAnalysis.srAscRuler}) et du Soleil, sans choc angulaire brutal.`,
          highlights:
            solarReturnAnalysis.angularPlanets.length > 0
              ? solarReturnAnalysis.angularPlanets.map((a) =>
                  getSolarReturnAngularPlanetMeaning(a.planet.id, a.planet.name, a.angleName, a.orb)
                )
              : srTightInternalAspects.map((a) => `Configuration interne clé : ${a.interpretation}`),
        },
        {
          title: 'Climat Émotionnel (Lune RS), Mental & Affectif',
          accent: 'gold',
          body: `La Lune RS en ${getSignLabel(srMoon.longitude, srMoon.sign.name, srMoon.sign.symbol, tradition)} (Maison ${solarReturnAnalysis.moonInSrHouse.roman} RS · Maison ${solarReturnAnalysis.moonInNatalHouse.roman} natale) décrit la tonalité quotidienne de vos besoins et de votre vie privée : ${getPlanetTrait('moon', srMoon.sign.index)} Sous une ${srLunarPhase.name} (${srLunarPhase.angleDeg}°), ${srLunarPhase.summary.charAt(0).toLowerCase()}${srLunarPhase.summary.slice(1)} Mercure RS en ${srMercury.sign.name} (M.${outerChart.houses[srMercury.house - 1].roman} RS${srMercury.retrograde ? ' ℞' : ''}), Vénus RS en ${srVenus.sign.name} (M.${outerChart.houses[srVenus.house - 1].roman} RS) et Mars RS en ${srMars.sign.name} (M.${outerChart.houses[srMars.house - 1].roman} RS) précisent le rythme des échanges, des liens affectifs et des initiatives.`,
          highlights: [
            `Lune RS : ${srMoon.formattedDeg} ${srMoon.sign.name} · Maison ${solarReturnAnalysis.moonInSrHouse.roman} RS (M.${solarReturnAnalysis.moonInNatalHouse.roman} nat.)`,
            `Cycle Soleil–Lune annuel : ${srLunarPhase.name} (${srLunarPhase.angleDeg}°)`,
            solarReturnAnalysis.retrogradeSrPlanets.length > 0
              ? `Rétrogradations à l’ouverture : ${solarReturnAnalysis.retrogradeSrPlanets.map((p) => `${p.symbol} ${p.name}`).join(', ')} (dossiers à mûrir ou réviser)`
              : 'Toutes les planètes rapides et sociales sont directes à l’ouverture de l’année (élan fluide)',
          ],
        },
        {
          title: 'Opportunités, Structuration & Résonances RS → Natal',
          accent: 'emerald',
          body: `Jupiter RS en ${srJupiter.sign.name} (Maison ${outerChart.houses[srJupiter.house - 1].roman} RS) favorise l’essor et les appuis ${getHouseArenaFocus(srJupiter.house)}. Saturne RS en ${srSaturn.sign.name} (Maison ${outerChart.houses[srSaturn.house - 1].roman} RS) exige rigueur et patience constructive ${getHouseArenaFocus(srSaturn.house)}. Uranus en M.${outerChart.houses[srUranus.house - 1].roman} RS et Pluton en M.${outerChart.houses[srPluto.house - 1].roman} RS signalent les secteurs d’émancipation et de transformation durable.`,
          highlights:
            topAspects.length > 0
              ? topAspects.map((a) => a.interpretation)
              : ['Circulation douce sans aspect exact serré RS → Natal : évolution progressive et maîtrisée.'],
        },
        {
          title: 'Équilibre des Hémisphères, Éléments & BaZi Annuel',
          accent: 'amber',
          body: `${hemisphereBalance} Éléments de la carte RS : Feu ${outerChart.elements.Feu}, Terre ${outerChart.elements.Terre}, Air ${outerChart.elements.Air}, Eau ${outerChart.elements.Eau} (dominante ${solarReturnAnalysis.dominantSrElement}). En lecture chinoise, le pilier ${srBazi.yearPillar.label} crée entre l’Ascendant natal (${natalAscCh.name}) et l’Ascendant RS (${srAscCh.name}) une relation « ${ascHarmony.label} » : ${ascHarmony.desc} ${getWuXingDynamicAdvice(srBazi.wuXingBalance, srBazi.dominantWuXing)}`,
        },
      ],
    };
  }

  if (mode === 'transits' && outerChart) {
    const slowOuter = outerChart.planets.filter((p) =>
      ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(p.id)
    );
    const fastOuter = outerChart.planets.filter((p) =>
      ['sun', 'moon', 'mercury', 'venus', 'mars'].includes(p.id)
    );
    const activeTransitAspects = comparisonAspects.slice(0, 6);
    const retroPlanets = outerChart.planets.filter((p) => p.retrograde && p.id !== 'northNode');

    const slowHouseCrossings = slowOuter.map((p) => {
      const natalHouseNum = findHouseForLongitude(p.longitude, baseChart.houses);
      const natalHouse = baseChart.houses[natalHouseNum - 1];
      return describeSlowTransitInHouse(p, natalHouse);
    });

    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Transit',
      baseTag: 'Natal',
      useOuterHouseWheel: false,
    });

    return {
      headline: 'Interprétation Détaillée des Transits sur le Natal',
      subtitle: `${comparisonAspects.length} aspects actifs · ${retroPlanets.length} astre(s) rétrograde(s)`,
      synthesis: `Cette lecture superpose le ciel en mouvement à votre carte natale. ${
        activeTransitAspects.length > 0
          ? `Le déclencheur principal du moment est ${activeTransitAspects[0].interpretation}`
          : 'Aucun aspect exact très serré n’active vos planètes de naissance : phase favorable au recul, à l’intégration et à la continuité.'
      } ${retroPlanets.length > 0 ? `Rétrogradations en cours : ${retroPlanets.map((r) => `${r.symbol} ${r.name}`).join(', ')}.` : ''}`,
      detailedContextLabel: 'Transits en Maison natale',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes du Ciel en Transit (Transit ↔ Transit · ${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Maisons Natales Traversées par les Planètes Lentes',
          accent: 'cyan',
          body: 'Les planètes lentes modifient en profondeur les secteurs de votre thème natal qu’elles parcourent actuellement :',
          highlights: slowHouseCrossings,
        },
        {
          title: 'Transits Actifs Précis sur Vos Planètes Natales',
          accent: 'gold',
          body:
            activeTransitAspects.length > 0
              ? 'Voici les aspects de transit les plus serrés à l’instant choisi, classés par précision d’orbe :'
              : 'Climat globalement fluide sans friction angulaire serrée sur votre thème natal.',
          highlights: activeTransitAspects.map((a) => a.interpretation),
        },
        {
          title: 'Rythme Quotidien (Planètes Rapides en Transit)',
          accent: 'emerald',
          body: fastOuter
            .map((p) => {
              const nh = baseChart.houses[findHouseForLongitude(p.longitude, baseChart.houses) - 1];
              return `${p.symbol} ${p.name} en ${p.sign.name}${p.retrograde ? ' ℞' : ''} traverse votre M.${nh.roman} (${nh.title})`;
            })
            .join(' · '),
        },
        baziSection,
      ],
    };
  }

  if (mode === 'lunarReturn' && outerChart) {
    const lrAsc = getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition);
    const lrSun = outerChart.planets.find((p) => p.id === 'sun')!;
    const lrMoon = outerChart.planets.find((p) => p.id === 'moon')!;
    const lrVenus = outerChart.planets.find((p) => p.id === 'venus')!;
    const lrMars = outerChart.planets.find((p) => p.id === 'mars')!;
    const lrAscInNatalHouse = baseChart.houses[findHouseForLongitude(outerChart.ascendant, baseChart.houses) - 1];
    const lrPhase = getLunarPhaseInfo(lrSun.longitude, lrMoon.longitude);

    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'RL',
      baseTag: 'Natal',
      useOuterHouseWheel: true,
    });

    return {
      headline: 'Interprétation Détaillée de la Révolution Lunaire',
      subtitle: `Cycle de 27,3 jours · ASC RL ${lrAsc} (M.${lrAscInNatalHouse.roman} nat.)`,
      synthesis: `La Révolution Lunaire décrit votre climat émotionnel, relationnel et quotidien sur les 4 semaines à venir. L’Ascendant mensuel en ${lrAsc} se projette dans votre Maison ${lrAscInNatalHouse.roman} natale (${lrAscInNatalHouse.title}), activant ce domaine dès l’ouverture du mois lunaire.`,
      detailedContextLabel: 'Révolution Lunaire',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes de la Révolution Lunaire (RL ↔ RL · ${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Besoins Intimes & Secteur Prioritaire du Mois',
          accent: 'cyan',
          body: `La Lune de Révolution revient à son degré natal en Maison ${outerChart.houses[lrMoon.house - 1].roman} RL (${outerChart.houses[lrMoon.house - 1].title}), orientant votre sensibilité ${getHouseArenaFocus(lrMoon.house)}. Sous une ${lrPhase.name}, ${lrPhase.summary.toLowerCase()}`,
          highlights: [
            `Vénus RL en ${lrVenus.sign.name} (M.${outerChart.houses[lrVenus.house - 1].roman} RL) : climat affectif`,
            `Mars RL en ${lrMars.sign.name} (M.${outerChart.houses[lrMars.house - 1].roman} RL) : rythme d’action`,
          ],
        },
        {
          title: 'Résonances Mensuelles avec le Thème Natal',
          accent: 'gold',
          body:
            comparisonAspects.length > 0
              ? 'Les aspects ci-dessous montrent quels points de votre natal réagissent ce mois-ci :'
              : 'Circulation douce entre l’humeur du mois lunaire et vos repères natals.',
          highlights: comparisonAspects.slice(0, 5).map((a) => a.interpretation),
        },
      ],
    };
  }

  if (mode === 'progressions' && outerChart) {
    const pSun = outerChart.planets.find((p) => p.id === 'sun')!;
    const pMoon = outerChart.planets.find((p) => p.id === 'moon')!;
    const pVenus = outerChart.planets.find((p) => p.id === 'venus')!;
    const pMars = outerChart.planets.find((p) => p.id === 'mars')!;
    const progPhase = getLunarPhaseInfo(pSun.longitude, pMoon.longitude);

    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Prog.',
      baseTag: 'Natal',
      useOuterHouseWheel: false,
    });

    return {
      headline: 'Interprétation Approfondie des Progressions Secondaires',
      subtitle: `Soleil prog. ${getSignLabel(pSun.longitude, pSun.sign.name, pSun.sign.symbol, tradition)} · Lune prog. ${getSignLabel(pMoon.longitude, pMoon.sign.name, pMoon.sign.symbol, tradition)}`,
      synthesis: `La méthode symbolique « 1 jour après la naissance = 1 année de vie » révèle votre maturation psychologique intérieure. Actuellement dans une phase de ${progPhase.name} (angle progressé ${progPhase.angleDeg}°), votre Soleil progressé en ${getSignLabel(pSun.longitude, pSun.sign.name, pSun.sign.symbol, tradition)} oriente l’évolution lente de votre identité vers : ${getPlanetTrait('sun', pSun.sign.index)}.`,
      detailedContextLabel: 'Progressions Secondaires',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes Progressés (Prog. ↔ Prog. · ${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Horloge Intérieure : Lune & Angles Progressés',
          accent: 'cyan',
          body: `La Lune progressée (qui change de signe environ tous les 2 ans et demi) traverse actuellement ${getSignLabel(pMoon.longitude, pMoon.sign.name, pMoon.sign.symbol, tradition)} en Maison ${outerChart.houses[pMoon.house - 1].roman} progressée — ${getPlanetTrait('moon', pMoon.sign.index)}. L’Ascendant progressé en ${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)} reflète l’ajustement progressif de votre rapport au monde.`,
          highlights: [
            `Phase Soleil–Lune progressée : ${progPhase.name}`,
            `Vénus prog. : ${pVenus.formattedDeg} ${pVenus.sign.name}${pVenus.retrograde ? ' ℞' : ''}`,
            `Mars prog. : ${pMars.formattedDeg} ${pMars.sign.name}${pMars.retrograde ? ' ℞' : ''}`,
          ],
        },
        {
          title: 'Aspects Intérieurs Progressés → Thème Natal',
          accent: 'gold',
          body:
            comparisonAspects.length > 0
              ? 'Ces contacts progressés marquent des chapitres psychologiques durables de votre évolution :'
              : 'Période de maturation intérieure silencieuse préparant les prochains changements de signe.',
          highlights: comparisonAspects.slice(0, 5).map((a) => a.interpretation),
        },
      ],
    };
  }

  if (mode === 'planetaryReturn' && outerChart) {
    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Rév.',
      baseTag: 'Natal',
      useOuterHouseWheel: true,
    });
    const prAsc = getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition);
    const prMc = getSignLabel(outerChart.midheaven, outerChart.mcSign.name, outerChart.mcSign.symbol, tradition);
    return {
      headline: `Interprétation de Révolution Planétaire (${outerChart.cityName})`,
      subtitle: `ASC Retour ${prAsc} · MC ${prMc}`,
      synthesis: `Ce thème de révolution fixe l’instant exact où l’astre choisi retrouve sa longitude de naissance. Il éclaire tout le nouveau cycle de cet archétype sur votre lieu d’observation (${outerChart.cityName}).`,
      detailedContextLabel: 'Révolution Planétaire',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes de la Révolution (${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Nouvelle Polarité du Cycle & Superpositions',
          accent: 'gold',
          body: `L’Ascendant du retour en ${prAsc} donne la tonalité d’ouverture de ce cycle, tandis que le Milieu du Ciel en ${prMc} en définit l’objectif d’accomplissement.`,
          highlights: comparisonAspects.slice(0, 6).map((a) => a.interpretation),
        },
        baziSection,
      ],
    };
  }

  if (mode === 'solarArc' && outerChart) {
    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Arc S.',
      baseTag: 'Natal',
      useOuterHouseWheel: false,
    });
    const saAsc = getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition);
    return {
      headline: 'Interprétation des Directions par Arc Solaire',
      subtitle: `ASC dirigé ${saAsc} · ${comparisonAspects.length} contacts actifs`,
      synthesis: `En Arc Solaire, chaque planète et cuspide natale avance uniformément du pas annuel du Soleil progressé (~1° par année). Les aspects exacts (< 1°) marquent des tournants concrets et événements structurants.`,
      detailedContextLabel: 'Arc Solaire → Natal',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes dirigés (${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Contacts d’Arc Solaire les Plus Serrés',
          accent: 'cyan',
          body: 'En astrologie prévisionnelle de précision, un aspect par Arc Solaire inférieur à 1,5° d’orbe signale une phase de concrétisation notable :',
          highlights: comparisonAspects.slice(0, 6).map((a) => a.interpretation),
        },
        baziSection,
      ],
    };
  }

  if (mode === 'relocated' && outerChart) {
    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Reloc.',
      baseTag: 'Natal',
      useOuterHouseWheel: true,
    });
    const relAsc = getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition);
    const relMc = getSignLabel(outerChart.midheaven, outerChart.mcSign.name, outerChart.mcSign.symbol, tradition);
    return {
      headline: `Interprétation du Thème Relocalisé · ${outerChart.cityName}`,
      subtitle: `ASC Relocalisé ${relAsc} · MC ${relMc}`,
      synthesis: `Calculé pour l’instant exact de votre naissance transposé aux coordonnées de ${outerChart.cityName}, ce thème montre comment l’axe horizon/méridien se réorganise géographiquement : les planètes changent de Maisons et certaines deviennent angulaires.`,
      detailedContextLabel: 'Maisons Relocalisées',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects du Thème Relocalisé (${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Réorientation des Angles & Changement de Maisons',
          accent: 'emerald',
          body: `À ${outerChart.cityName}, votre Ascendant passe en ${relAsc} (au lieu de ${ascLabel} au lieu de naissance) et votre Milieu du Ciel devient ${relMc}. Cela modifie les secteurs de vie mis en avant dans cette ville ou ce pays.`,
          highlights: comparisonAspects.slice(0, 5).map((a) => a.interpretation),
        },
        baziSection,
      ],
    };
  }

  if (mode === 'synastry' && outerChart) {
    const pB = outerChart;
    const sunChA = transposeLongitudeToChinese(sun.longitude).sign;
    const sunB = pB.planets.find((p) => p.id === 'sun')!;
    const moonB = pB.planets.find((p) => p.id === 'moon')!;
    const venusB = pB.planets.find((p) => p.id === 'venus')!;
    const marsB = pB.planets.find((p) => p.id === 'mars')!;
    const sunChB = transposeLongitudeToChinese(sunB.longitude).sign;
    const moonChA = transposeLongitudeToChinese(moon.longitude).sign;
    const moonChB = transposeLongitudeToChinese(moonB.longitude).sign;
    const chRelation = evaluateAnimalHarmony(sunChA, sunChB);
    const moonChRelation = evaluateAnimalHarmony(moonChA, moonChB);

    const bSunInA = baseChart.houses[findHouseForLongitude(sunB.longitude, baseChart.houses) - 1];
    const bMoonInA = baseChart.houses[findHouseForLongitude(moonB.longitude, baseChart.houses) - 1];
    const bVenusInA = baseChart.houses[findHouseForLongitude(venusB.longitude, baseChart.houses) - 1];
    const bMarsInA = baseChart.houses[findHouseForLongitude(marsB.longitude, baseChart.houses) - 1];

    const harmoniousCount = comparisonAspects.filter(
      (a) => a.harmony === 'harmonious' || a.harmony === 'fusion'
    ).length;
    const tenseCount = comparisonAspects.filter((a) => a.harmony === 'tense').length;

    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Partenaire B',
      baseTag: 'A',
      useOuterHouseWheel: false,
    });

    return {
      headline: 'Interprétation Complète de la Synastrie Relationnelle',
      subtitle: `${baseChart.cityName} (Or) ↔ ${pB.cityName} (Cyan)`,
      synthesis: `Cette synastrie compare deux thèmes de naissance dans leur dynamique affective, mentale et évolutive. On relève ${harmoniousCount} liens d’affinité fluide ou fusionnelle et ${tenseCount} axes de stimulation dynamique qui invitent chacun à grandir au contact de l’autre.`,
      detailedContextLabel: 'Synastrie · Planètes de B dans les Maisons de A',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes du Partenaire B (B ↔ B · ${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Superposition des Planètes de B dans Vos Maisons (A)',
          accent: 'gold',
          body: `La façon dont B active les domaines concrets de A éclaire immédiatement la nature du lien :`,
          highlights: [
            `Soleil de B (${sunB.sign.name}) en Maison ${bSunInA.roman} de A (${bSunInA.title}) : éclaire ce secteur par sa présence`,
            `Lune de B (${moonB.sign.name}) en Maison ${bMoonInA.roman} de A (${bMoonInA.title}) : crée une résonance émotionnelle intime`,
            `Vénus de B (${venusB.sign.name}) en Maison ${bVenusInA.roman} de A (${bVenusInA.title}) : adoucit et séduit ce domaine`,
            `Mars de B (${marsB.sign.name}) en Maison ${bMarsInA.roman} de A (${bMarsInA.title}) : stimule l’élan, le désir ou le défi`,
          ],
        },
        {
          title: 'Aspects Inter-Thèmes Majeurs (Affinités & Défis)',
          accent: 'cyan',
          body:
            comparisonAspects.length > 0
              ? 'Les aspects les plus serrés entre A et B révèlent le cœur magnétique et psychologique de la relation :'
              : 'Peu d’aspects angulaires serrés : le lien s’exprime avant tout par la complémentarité des Maisons et des éléments.',
          highlights: comparisonAspects.slice(0, 6).map((a) => a.interpretation),
        },
        {
          title: 'Compatibilité Chinoise (San He · Liu He · Wu Xing)',
          accent: 'amber',
          body: `Sur les Soleils transposés, A (${sunChA.name}, ${sunChA.wuXing}) et B (${sunChB.name}, ${sunChB.wuXing}) forment une relation « ${chRelation.label} » : ${chRelation.desc} Sur le plan émotionnel lunaire, A (${moonChA.name}) et B (${moonChB.name}) vivent une dynamique « ${moonChRelation.label} » (${moonChRelation.desc}).`,
        },
      ],
    };
  }

  if (mode === 'composite') {
    const compVenus = baseChart.planets.find((p) => p.id === 'venus')!;
    const compMars = baseChart.planets.find((p) => p.id === 'mars')!;
    const compSaturn = baseChart.planets.find((p) => p.id === 'saturn')!;
    const compPhase = getLunarPhaseInfo(sun.longitude, moon.longitude);
    const singleDetails = buildSingleWheelDetails(baseChart, 'composite');

    return {
      headline: 'Interprétation Approfondie du Thème Composite',
      subtitle: `${baseChart.cityName} · ASC Composite ${ascLabel}`,
      synthesis: `Calculé par mi-points exacts, le thème composite décrit la relation elle-même comme une entité autonome. Avec un Soleil composite en ${sunLabel} (Maison ${baseChart.houses[sun.house - 1].roman}) et une Lune en ${moonLabel} (Maison ${baseChart.houses[moon.house - 1].roman}), le duo fonctionne sous une ${compPhase.name}.`,
      detailedContextLabel: 'Thème Composite',
      ...singleDetails,
      sections: [
        {
          title: 'Identité, Cœur & Dynamique du Couple / Partenariat',
          accent: 'gold',
          body: `L’Ascendant composite en ${ascLabel} façonne l’image que la relation projette au monde. Le Soleil composite exprime : ${getPlanetTrait('sun', sun.sign.index)}, tandis que Vénus composite en ${getSignLabel(compVenus.longitude, compVenus.sign.name, compVenus.sign.symbol, tradition)} (Maison ${baseChart.houses[compVenus.house - 1].roman}) révèle la manière d’aimer et les valeurs partagées. Mars composite en ${compMars.sign.name} (Maison ${baseChart.houses[compMars.house - 1].roman}) canalise les projets communs et Saturne en ${compSaturn.sign.name} (M.${baseChart.houses[compSaturn.house - 1].roman}) en indique la durée et les engagements.`,
          highlights: baseChart.aspects.slice(0, 4).map((a) => a.interpretation),
        },
        baziSection,
      ],
    };
  }

  if (mode === 'comparative' && outerChart && comparativeAnalysis) {
    const baseAscCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
    const outerAscCh = transposeLongitudeToChinese(outerChart.ascendant).sign;
    const chRel = evaluateAnimalHarmony(baseAscCh, outerAscCh);

    const dualDetails = buildDualWheelDetails({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
      outerTag: 'Comparée',
      baseTag: 'Base',
      useOuterHouseWheel: false,
    });

    return {
      headline: 'Interprétation du Comparatif Double Roue',
      subtitle: `${baseChart.cityName} vs ${outerChart.cityName}`,
      synthesis: `Cette lecture croisée confronte la carte de base (${ascLabel}) à la carte comparée (${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)}). L’Ascendant comparé tombe en Maison ${comparativeAnalysis.ascInBaseHouseRoman} de base (décalage angulaire de ${comparativeAnalysis.ascShiftDeg}°), et le Milieu du Ciel comparé active votre Maison ${comparativeAnalysis.mcInBaseHouseRoman} de base.`,
      detailedContextLabel: 'Comparatif Double Roue',
      ...dualDetails,
      secondaryAspectsLabel: `Aspects internes de la Carte Comparée (${dualDetails.secondaryAspects.length})`,
      sections: [
        {
          title: 'Équilibre des Forces & Aspects Comparés',
          accent: 'cyan',
          body: `On dénombre ${comparativeAnalysis.harmoniousCount} aspects harmoniques, ${comparativeAnalysis.fusionCount} conjonctions de convergence et ${comparativeAnalysis.tenseCount} tensions créatrices entre les deux roues.`,
          highlights: comparisonAspects.slice(0, 5).map((a) => a.interpretation),
        },
        {
          title: 'Comparatif sur Zodiaque Chinois (Rameaux & Wu Xing)',
          accent: 'amber',
          body: `Entre l’Ascendant de base (${baseAscCh.name} · ${baseAscCh.wuXing}) et l’Ascendant comparé (${outerAscCh.name} · ${outerAscCh.wuXing}), la transposition chinoise révèle : « ${chRel.label} » — ${chRel.desc}`,
        },
      ],
    };
  }

  // Live sky / fallback
  const retroPlanets = baseChart.planets.filter((p) => p.retrograde && p.id !== 'northNode');
  const liveDetails = buildSingleWheelDetails(baseChart, 'live');
  return {
    headline: 'Interprétation Détaillée du Ciel en Direct',
    subtitle: `${baseChart.cityName} · ASC ${ascLabel} · ${lunarPhase.name}`,
    synthesis: `Climat astronomique et symbolique de l’instant : le Soleil traverse ${sunLabel} tandis que la Lune éclaire ${moonLabel} (${lunarPhase.name}, ${lunarPhase.angleDeg}°). L’équilibre élémentaire actuel privilégie l’élément ${domEl}, colorant l’atmosphère collective par ${ELEMENT_TEMPERAMENT[domEl]}.`,
    detailedContextLabel: 'Ciel en Direct',
    ...liveDetails,
    sections: [
      {
        title: 'Luminaires, Mouvements Rétrogrades & Ambiance du Moment',
        accent: 'cyan',
        body: `${lunarPhase.summary} ${
          retroPlanets.length > 0
            ? `Astres actuellement rétrogrades (invitation à l’intériorisation et à la révision) : ${retroPlanets.map((r) => `${r.symbol} ${r.name} en ${r.sign.name}`).join(', ')}.`
            : 'Toutes les planètes avancent en mouvement direct : élan fluide favorable aux lancements et décisions claires.'
        }`,
      },
      {
        title: 'Aspects Majeurs du Jour',
        accent: 'gold',
        body:
          baseChart.aspects.length > 0
            ? 'Configurations planétaires exactes marquant la journée :'
            : 'Le ciel du jour présente une configuration dégagée.',
        highlights: baseChart.aspects.slice(0, 5).map((a) => a.interpretation),
      },
      baziSection,
    ],
  };
}
