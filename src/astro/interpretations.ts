import {
  AstroChart,
  ChartMode,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  ElementType,
  findHouseForLongitude,
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
  getSolarReturnHouseDetailedText,
  getSolarReturnPlanetDetailedText,
  getSolarReturnSunHouseMeaning,
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
    const srBazi = calculateBaziSummary(outerChart);
    const natalAscCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
    const srAscCh = transposeLongitudeToChinese(outerChart.ascendant).sign;
    const ascHarmony = evaluateAnimalHarmony(natalAscCh, srAscCh);
    const srLunarPhase = getLunarPhaseInfo(srSun.longitude, srMoon.longitude);
    const topAspects = comparisonAspects.slice(0, 6);

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

    return {
      headline: `Interprétation Complète de la Révolution Solaire ${outerChart.date.getFullYear()}`,
      subtitle: `${outerChart.cityName} · ASC RS ${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)} en M.${solarReturnAnalysis.ascInNatalHouse.roman} natale`,
      synthesis: `Calculée pour ${outerChart.cityName}, cette Révolution Solaire place l’Ascendant annuel en ${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)}, superposé à votre Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale (${solarReturnAnalysis.ascInNatalHouse.title}). ${getSolarReturnSunHouseMeaning(solarReturnAnalysis.sunInSrHouse.house)} Le climat lunaire annuel correspond à une ${srLunarPhase.name}.`,
      detailedContextLabel: `Révolution Solaire ${outerChart.date.getFullYear()}`,
      detailedPlanets,
      detailedHouses,
      detailedAspects,
      secondaryAspects,
      sections: [
        {
          title: 'Axe Annuel, Foyer Solaire & Maître de l’Année',
          accent: 'cyan',
          body: `Le Soleil RS en Maison ${solarReturnAnalysis.sunInSrHouse.roman} de Révolution (${solarReturnAnalysis.sunInSrHouse.title}) concentre votre vitalité ${getHouseArenaFocus(solarReturnAnalysis.sunInSrHouse.house)}. Le Milieu du Ciel RS en ${getSignLabel(outerChart.midheaven, outerChart.mcSign.name, outerChart.mcSign.symbol, tradition)} active votre Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale (${solarReturnAnalysis.mcInNatalHouse.title}), liant votre réussite de l’année à ce secteur de naissance. Maître de l’Ascendant RS : ${solarReturnAnalysis.srAscRuler}${
            solarReturnAnalysis.srAscRulerPlanet
              ? ` en ${solarReturnAnalysis.srAscRulerPlanet.sign.name} (Maison ${outerChart.houses[solarReturnAnalysis.srAscRulerPlanet.house - 1].roman} RS · ${getPlanetDignity(solarReturnAnalysis.srAscRulerPlanet.id, solarReturnAnalysis.srAscRulerPlanet.sign.index).status}), qui indique précisément où s’orientent vos décisions`
              : ''
          }.`,
          highlights: [
            `ASC RS (${outerChart.ascSign.name}) → Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale`,
            `MC RS (${outerChart.mcSign.name}) → Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale`,
            `Soleil RS → Maison ${solarReturnAnalysis.sunInSrHouse.roman} RS (${getSolarReturnSunHouseMeaning(solarReturnAnalysis.sunInSrHouse.house)})`,
          ],
        },
        {
          title: 'Vie Émotionnelle, Mentale & Affective de l’Année',
          accent: 'gold',
          body: `La Lune RS en ${getSignLabel(srMoon.longitude, srMoon.sign.name, srMoon.sign.symbol, tradition)} (Maison ${outerChart.houses[srMoon.house - 1].roman} RS) nourrit vos priorités intimes — ${getPlanetTrait('moon', srMoon.sign.index)}. Mercure RS en ${srMercury.sign.name} (M.${outerChart.houses[srMercury.house - 1].roman} RS${srMercury.retrograde ? ' ℞' : ''}) teinte vos démarches et échanges. Vénus RS en ${srVenus.sign.name} (M.${outerChart.houses[srVenus.house - 1].roman} RS) et Mars RS en ${srMars.sign.name} (M.${outerChart.houses[srMars.house - 1].roman} RS) orientent le climat sentimental et l’élan d’action.`,
          highlights: [
            `Phase lunaire RS : ${srLunarPhase.name} (${srLunarPhase.angleDeg}°)`,
            ...solarReturnAnalysis.angularPlanets.map(
              (a) => `Planète dominante aux angles : ${a.planet.symbol} ${a.planet.name} conjoint ${a.angleName} (${a.orb}°)`
            ),
          ],
        },
        {
          title: 'Opportunités, Exigences & Résonances RS → Natal',
          accent: 'emerald',
          body: `Jupiter RS en ${srJupiter.sign.name} (Maison ${outerChart.houses[srJupiter.house - 1].roman} RS) soutient la croissance ${getHouseArenaFocus(srJupiter.house)}. Saturne RS en ${srSaturn.sign.name} (Maison ${outerChart.houses[srSaturn.house - 1].roman} RS) structure durablement ${getHouseArenaFocus(srSaturn.house)}. ${
            topAspects.length > 0
              ? `Les ${comparisonAspects.length} aspects RS → Natal et ${outerChart.aspects.length} aspects internes RS ↔ RS sont consultables intégralement dans l’onglet Aspects.`
              : 'Peu d’aspects serrés RS → Natal : année d’évolution intérieure et progressive.'
          }`,
          highlights: topAspects.map((a) => a.interpretation),
        },
        {
          title: 'Lecture Chinoise & Wu Xing de l’Année Anniversaire',
          accent: 'amber',
          body: `L’année anniversaire porte l’empreinte du pilier ${srBazi.yearPillar.label}. Entre votre Ascendant natal (${natalAscCh.name}) et l’Ascendant RS (${srAscCh.name}), le dialogue chinois indique « ${ascHarmony.label} » : ${ascHarmony.desc} ${getWuXingDynamicAdvice(srBazi.wuXingBalance, srBazi.dominantWuXing)}`,
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
