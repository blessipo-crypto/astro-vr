import {
  AstroChart,
  ChartMode,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  ElementType,
  SolarReturnAnalysis,
} from './astroEngine';
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

export interface ChartInterpretationReport {
  headline: string;
  subtitle: string;
  synthesis: string;
  sections: InterpretationSection[];
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
  const domEl = getDominantElement(baseChart.elements);
  const baziBase = calculateBaziSummary(baseChart);

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

  const baziSection: InterpretationSection = {
    title: 'Transposition Chinoise & 4 Piliers (BaZi)',
    accent: 'amber',
    body: `Sous l’optique chinoise, le pilier annuel est gouverné par le ${baziBase.yearPillar.label}, le mois solaire par ${baziBase.monthPillar.label} et l’heure solaire par ${baziBase.hourPillar.branch.name} (${baziBase.hourPillar.branch.hours}). L’élément Wu Xing dominant est ${baziBase.dominantWuXing}, exprimant ${WUXING_TEMPERAMENT[baziBase.dominantWuXing]}.`,
    highlights: [
      `Soleil transposé : ${transposeLongitudeToChinese(sun.longitude).sign.name} (${transposeLongitudeToChinese(sun.longitude).sign.wuXing})`,
      `Lune transposée : ${transposeLongitudeToChinese(moon.longitude).sign.name} (${transposeLongitudeToChinese(moon.longitude).sign.wuXing})`,
      `Ascendant transposé : ${transposeLongitudeToChinese(baseChart.ascendant).sign.name} (${transposeLongitudeToChinese(baseChart.ascendant).sign.wuXing})`,
    ],
  };

  const jupiter = baseChart.planets.find((p) => p.id === 'jupiter')!;
  const saturn = baseChart.planets.find((p) => p.id === 'saturn')!;
  const uranus = baseChart.planets.find((p) => p.id === 'uranus')!;
  const neptune = baseChart.planets.find((p) => p.id === 'neptune')!;
  const pluto = baseChart.planets.find((p) => p.id === 'pluto')!;
  const northNode = baseChart.planets.find((p) => p.id === 'northNode')!;

  if (mode === 'natal') {
    const tightAspects = baseChart.aspects.slice(0, 4);
    const sunHouse = baseChart.houses[sun.house - 1];
    const moonHouse = baseChart.houses[moon.house - 1];
    const dominantModality = (['Cardinal', 'Fixe', 'Mutable'] as const).reduce((best, cur) =>
      baseChart.modalities[cur] > baseChart.modalities[best] ? cur : best
    );
    const modalityDesc =
      dominantModality === 'Cardinal'
        ? 'un tempérament d’initiative, tourné vers le lancement et l’impulsion'
        : dominantModality === 'Fixe'
          ? 'une grande persévérance, de la constance et un fort pouvoir d’enracinement'
          : 'une souplesse d’adaptation, de la curiosité et une capacité de synthèse évolutive';

    return {
      headline: 'Interprétation Complète du Thème Natal',
      subtitle: `${sunLabel} · Lune ${moonLabel} · ASC ${ascLabel}`,
      synthesis: `Ce thème natal s’organise autour d’une dominante ${domEl} et d’une modalité ${dominantModality}, révélant ${ELEMENT_TEMPERAMENT[domEl]} ainsi que ${modalityDesc}. L’alliance entre le Soleil en ${sunLabel} (Maison ${sunHouse.roman}) et la Lune en ${moonLabel} (Maison ${moonHouse.roman}) dessine le dialogue fondamental entre votre volonté consciente et votre sensibilité profonde.`,
      sections: [
        {
          title: 'Triade Fondamentale (Soleil · Lune · Ascendant)',
          accent: 'gold',
          body: `Votre identité solaire en ${sunLabel} rayonne dans le secteur ${sunHouse.roman} (${sunHouse.title}), orientant votre quête d’accomplissement vers ${sun.sign.keywords.toLowerCase()}. La Lune en ${moonLabel} (Maison ${moonHouse.roman}) nourrit vos élans affectifs par ${moon.sign.keywords.toLowerCase()}, tandis que l’Ascendant en ${ascLabel} colore votre présence spontanée et votre premier contact au monde.`,
          highlights: [
            `Soleil : ${sun.formattedDeg} ${sun.sign.name} · Maison ${sunHouse.roman}`,
            `Lune : ${moon.formattedDeg} ${moon.sign.name} · Maison ${moonHouse.roman}`,
            `Ascendant : ${baseChart.ascSign.name} · Milieu du Ciel : ${baseChart.mcSign.name}`,
          ],
        },
        {
          title: 'Dynamique Mentale, Affective & Motrice',
          accent: 'cyan',
          body: `Mercure en ${getSignLabel(mercury.longitude, mercury.sign.name, mercury.sign.symbol, tradition)} (Maison ${baseChart.houses[mercury.house - 1].roman}) façonne votre manière de penser et communiquer${mercury.retrograde ? ' avec une forte intériorité réflexive (℞)' : ''}. Vénus en ${getSignLabel(venus.longitude, venus.sign.name, venus.sign.symbol, tradition)} (Maison ${baseChart.houses[venus.house - 1].roman}) éclaire vos affinités de cœur et valeurs esthétiques, tandis que Mars en ${getSignLabel(mars.longitude, mars.sign.name, mars.sign.symbol, tradition)} (Maison ${baseChart.houses[mars.house - 1].roman}) canalise votre courage, votre désir et votre capacité de décision.`,
        },
        {
          title: 'Élan Social, Sagesse & Chemin de Vie (Jupiter · Saturne · Nœud Nord)',
          accent: 'amber',
          body: `Jupiter en ${jupiter.sign.name} (Maison ${baseChart.houses[jupiter.house - 1].roman}) ouvre vos zones de chance, de générosité et d’expansion. Saturne en ${saturn.sign.name} (Maison ${baseChart.houses[saturn.house - 1].roman}) demande patience, rigueur et maîtrise durable. Le Nœud Nord en ${northNode.sign.name} (Maison ${baseChart.houses[northNode.house - 1].roman}) indique votre axe d’évolution privilégié dans cette existence.`,
          highlights: [
            `Uranus en ${uranus.sign.name} (M.${baseChart.houses[uranus.house - 1].roman}) · Originalité & liberté`,
            `Neptune en ${neptune.sign.name} (M.${baseChart.houses[neptune.house - 1].roman}) · Inspiration & idéal`,
            `Pluton en ${pluto.sign.name} (M.${baseChart.houses[pluto.house - 1].roman}) · Pouvoir de transformation`,
          ],
        },
        {
          title: 'Vocation, Éléments & Aspects Clés du Natal',
          accent: 'emerald',
          body: `Le Milieu du Ciel en ${mcLabel} indique une réalisation sociale marquée par ${baseChart.mcSign.keywords.toLowerCase()}. Équilibre élémentaire : Feu ${baseChart.elements.Feu}, Terre ${baseChart.elements.Terre}, Air ${baseChart.elements.Air}, Eau ${baseChart.elements.Eau}. ${
            tightAspects.length > 0
              ? `Configurations majeures : ${tightAspects.map((a) => `${a.planetAName} ${a.label.toLowerCase()} ${a.planetBName} (${a.orb}°)`).join(' ; ')}.`
              : 'Les planètes dialoguent avec une large respiration angulaire.'
          }`,
        },
        baziSection,
      ],
    };
  }

  if (mode === 'solarReturn' && outerChart && solarReturnAnalysis) {
    const srSun = outerChart.planets.find((p) => p.id === 'sun')!;
    const srMoon = outerChart.planets.find((p) => p.id === 'moon')!;
    const srVenus = outerChart.planets.find((p) => p.id === 'venus')!;
    const srMars = outerChart.planets.find((p) => p.id === 'mars')!;
    const srJupiter = outerChart.planets.find((p) => p.id === 'jupiter')!;
    const srSaturn = outerChart.planets.find((p) => p.id === 'saturn')!;
    const srBazi = calculateBaziSummary(outerChart);
    const natalAscCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
    const srAscCh = transposeLongitudeToChinese(outerChart.ascendant).sign;
    const ascHarmony = evaluateAnimalHarmony(natalAscCh, srAscCh);
    const topAspects = comparisonAspects.slice(0, 5);

    return {
      headline: `Interprétation de la Révolution Solaire ${outerChart.date.getFullYear()}`,
      subtitle: `${outerChart.cityName} · ASC RS ${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)} en M.${solarReturnAnalysis.ascInNatalHouse.roman} natale`,
      synthesis: `Calculée pour votre lieu de résidence anniversaire (${outerChart.cityName}), cette Révolution Solaire place l’Ascendant annuel en ${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)}, superposé à votre Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale (${solarReturnAnalysis.ascInNatalHouse.title}). Le climat annuel vous invite à investir ce domaine prioritaire avec l’élan de ${outerChart.ascSign.keywords.toLowerCase()}.`,
      sections: [
        {
          title: 'Axe Annuel, Lieu de Résidence & Foyer Solaire',
          accent: 'cyan',
          body: `Le Soleil RS se positionne en Maison ${solarReturnAnalysis.sunInSrHouse.roman} de Révolution (${solarReturnAnalysis.sunInSrHouse.title}), pointant le cœur d’activité, de visibilité et de vitalité de votre année. Le Milieu du Ciel RS en ${getSignLabel(outerChart.midheaven, outerChart.mcSign.name, outerChart.mcSign.symbol, tradition)} active votre Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale (${solarReturnAnalysis.mcInNatalHouse.title}), orientant vos objectifs professionnels et publics.`,
          highlights: [
            `ASC RS (${outerChart.ascSign.name}) → Maison ${solarReturnAnalysis.ascInNatalHouse.roman} natale`,
            `MC RS (${outerChart.mcSign.name}) → Maison ${solarReturnAnalysis.mcInNatalHouse.roman} natale`,
            `Soleil RS → Maison ${solarReturnAnalysis.sunInSrHouse.roman} RS`,
          ],
        },
        {
          title: 'Climat Émotionnel, Affectif & Maître de l’Année',
          accent: 'gold',
          body: `La Lune RS en ${getSignLabel(srMoon.longitude, srMoon.sign.name, srMoon.sign.symbol, tradition)} (Maison ${outerChart.houses[srMoon.house - 1].roman} RS) traduit le besoin intime et l’ambiance affective du cycle. Le maître de l’Ascendant annuel est ${solarReturnAnalysis.srAscRuler}${
            solarReturnAnalysis.srAscRulerPlanet
              ? ` (en ${solarReturnAnalysis.srAscRulerPlanet.sign.name}, Maison ${outerChart.houses[solarReturnAnalysis.srAscRulerPlanet.house - 1].roman} RS), indiquant où se concrétisent vos initiatives`
              : ''
          }. Vénus RS en ${srVenus.sign.name} (Maison ${outerChart.houses[srVenus.house - 1].roman} RS) et Mars RS en ${srMars.sign.name} (Maison ${outerChart.houses[srMars.house - 1].roman} RS) animent le terrain amoureux et la dynamique d’action.`,
        },
        {
          title: 'Expansion, Défis & Résonances sur le Thème Natal',
          accent: 'emerald',
          body: `Jupiter RS en ${srJupiter.sign.name} (Maison ${outerChart.houses[srJupiter.house - 1].roman} RS) favorise les opportunités et l’ouverture, tandis que Saturne RS en ${srSaturn.sign.name} (Maison ${outerChart.houses[srSaturn.house - 1].roman} RS) demande organisation et constance. ${
            solarReturnAnalysis.angularPlanets.length > 0
              ? `Astres dominants aux angles RS : ${solarReturnAnalysis.angularPlanets.map((a) => `${a.planet.name} conjoint ${a.angleName} (${a.orb}°)`).join(', ')}. `
              : 'Aucun astre n’est collé aux angles à moins de 8°, favorisant une année d’évolution progressive. '
          }${
            topAspects.length > 0
              ? `Aspects RS → Natal marquants : ${topAspects.map((a) => `${a.outerPlanetName} RS ${a.label.toLowerCase()} ${a.natalPlanetName} natal (${a.orb}°)`).join(' ; ')}.`
              : ''
          }`,
        },
        {
          title: 'Lecture Chinoise de l’Année Anniversaire',
          accent: 'amber',
          body: `L’année RS s’inscrit sous le signe de ${srBazi.yearPillar.label}. En transposant votre Ascendant natal (${natalAscCh.name}) face à l’Ascendant RS (${srAscCh.name}), on observe une relation « ${ascHarmony.label} » : ${ascHarmony.desc} Soleil RS en ${transposeLongitudeToChinese(srSun.longitude).sign.name} (${transposeLongitudeToChinese(srSun.longitude).sign.wuXing}).`,
        },
      ],
    };
  }

  if (mode === 'transits' && outerChart) {
    const slowOuter = outerChart.planets.filter((p) =>
      ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(p.id)
    );
    const activeTransitAspects = comparisonAspects.slice(0, 5);
    const retroCount = outerChart.planets.filter((p) => p.retrograde).length;

    return {
      headline: 'Interprétation des Transits sur le Thème Natal',
      subtitle: `${comparisonAspects.length} aspects actifs · ${retroCount} astre(s) rétrograde(s)`,
      synthesis: `Les transits actuels confrontent la carte du ciel en mouvement à vos repères de naissance. ${
        activeTransitAspects.length > 0
          ? `Le transit le plus serré concerne ${activeTransitAspects[0].outerPlanetName} en transit ${activeTransitAspects[0].label.toLowerCase()} ${activeTransitAspects[0].natalPlanetName} natal (${activeTransitAspects[0].orb}°), marquant la tonalité prioritaire du moment.`
          : 'Aucun aspect majeur très serré ne vient bousculer vos planètes natales : période d’intégration calme.'
      }`,
      sections: [
        {
          title: 'Cycles Lents & Mutations de Fond',
          accent: 'cyan',
          body: slowOuter
            .map((p) => {
              const ch = transposeLongitudeToChinese(p.longitude).sign;
              const lbl = tradition === 'chinese' ? `${ch.name} (${ch.wuXing})` : p.sign.name;
              return `${p.name} en ${lbl}${p.retrograde ? ' ℞' : ''}`;
            })
            .join(' · ') + '. Les planètes lentes redessinent les grands chapitres de structuration (Saturne), d’expansion (Jupiter) et de métamorphose profonde (Uranus, Neptune, Pluton).',
        },
        {
          title: 'Aspects Clés en Cours sur le Natal',
          accent: 'gold',
          body:
            activeTransitAspects.length > 0
              ? activeTransitAspects.map((a) => a.interpretation).join(' — ')
              : 'Climat serein favorable au recul et à la consolidation de vos acquis natals.',
        },
        baziSection,
      ],
    };
  }

  if (mode === 'lunarReturn' && outerChart) {
    const lrAsc = getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition);
    const lrMoon = outerChart.planets.find((p) => p.id === 'moon')!;
    return {
      headline: 'Interprétation de la Révolution Lunaire',
      subtitle: `Cycle de 27,3 jours · ASC RL ${lrAsc}`,
      synthesis: `La Révolution Lunaire éclaire le climat émotionnel, quotidien et relationnel des quatre semaines à venir. Avec l’Ascendant mensuel en ${lrAsc}, vos réactions spontanées et besoins de sécurité prennent une coloration ${outerChart.ascSign.keywords.toLowerCase()}.`,
      sections: [
        {
          title: 'Besoins Émotionnels & Secteur Activé',
          accent: 'cyan',
          body: `La Lune de Révolution revient à son degré exact en Maison ${outerChart.houses[lrMoon.house - 1].roman} RL (${outerChart.houses[lrMoon.house - 1].title}), focalisant votre attention intime et vos habitudes de vie sur ce domaine durant tout le mois lunaire.`,
        },
        {
          title: 'Résonances avec le Thème Natal',
          accent: 'gold',
          body:
            comparisonAspects.length > 0
              ? comparisonAspects.slice(0, 4).map((a) => a.interpretation).join(' — ')
              : 'Circulation douce entre les humeurs du mois et la structure natale.',
        },
      ],
    };
  }

  if (mode === 'progressions' && outerChart) {
    const pSun = outerChart.planets.find((p) => p.id === 'sun')!;
    const pMoon = outerChart.planets.find((p) => p.id === 'moon')!;
    return {
      headline: 'Interprétation des Progressions Secondaires',
      subtitle: `Soleil prog. ${getSignLabel(pSun.longitude, pSun.sign.name, pSun.sign.symbol, tradition)} · Lune prog. ${getSignLabel(pMoon.longitude, pMoon.sign.name, pMoon.sign.symbol, tradition)}`,
      synthesis: `La méthode « un jour pour une année » mesure votre maturation psychologique intérieure. Le Soleil progressé en ${getSignLabel(pSun.longitude, pSun.sign.name, pSun.sign.symbol, tradition)} témoigne d’une évolution progressive de votre identité vers ${pSun.sign.keywords.toLowerCase()}.`,
      sections: [
        {
          title: 'Horloge Intérieure : Lune & Angles Progressés',
          accent: 'cyan',
          body: `La Lune progressée parcourt un signe tous les ~2 ans et demi : actuellement en ${getSignLabel(pMoon.longitude, pMoon.sign.name, pMoon.sign.symbol, tradition)}, elle colore votre phase émotionnelle présente. L’Ascendant progressé en ${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)} accompagne ce renouvellement de posture.`,
        },
        {
          title: 'Aspects Intérieurs au Thème Natal',
          accent: 'gold',
          body:
            comparisonAspects.length > 0
              ? comparisonAspects.slice(0, 4).map((a) => a.interpretation).join(' — ')
              : 'Période de mûrissement silencieux préparant les prochaines étapes d’évolution.',
        },
      ],
    };
  }

  if (mode === 'synastry' && outerChart) {
    const pB = outerChart;
    const sunChA = transposeLongitudeToChinese(sun.longitude).sign;
    const sunB = pB.planets.find((p) => p.id === 'sun')!;
    const sunChB = transposeLongitudeToChinese(sunB.longitude).sign;
    const chRelation = evaluateAnimalHarmony(sunChA, sunChB);

    return {
      headline: 'Interprétation de la Synastrie Relationnelle',
      subtitle: `${baseChart.cityName} (Or) ↔ ${pB.cityName} (Cyan)`,
      synthesis: `La synastrie met en regard deux univers intérieurs. On relève ${
        comparisonAspects.filter((a) => a.harmony === 'harmonious' || a.harmony === 'fusion').length
      } liens d’affinité fluide/fusion et ${
        comparisonAspects.filter((a) => a.harmony === 'tense').length
      } axes de tension dynamique qui stimulent l’évolution mutuelle du duo.`,
      sections: [
        {
          title: 'Rencontre des Polarités (Soleil · Lune · Vénus)',
          accent: 'gold',
          body: `Le Soleil de A (${sunLabel}) dialogue avec celui de B en ${getSignLabel(sunB.longitude, sunB.sign.name, sunB.sign.symbol, tradition)}. ${
            comparisonAspects.length > 0
              ? `L’aspect inter-thème le plus puissant est : ${comparisonAspects[0].interpretation}.`
              : 'Les échanges reposent davantage sur l’activation des maisons que sur les aspects serrés.'
          }`,
        },
        {
          title: 'Compatibilité Chinoise (San He / Liu He / Wu Xing)',
          accent: 'amber',
          body: `Sur le zodiaque chinois solaire, le Soleil de A (${sunChA.name}, ${sunChA.wuXing}) et celui de B (${sunChB.name}, ${sunChB.wuXing}) forment une relation « ${chRelation.label} » : ${chRelation.desc}`,
        },
      ],
    };
  }

  if (mode === 'composite') {
    const compVenus = baseChart.planets.find((p) => p.id === 'venus')!;
    return {
      headline: 'Interprétation du Thème Composite',
      subtitle: `${baseChart.cityName} · ASC Composite ${ascLabel}`,
      synthesis: `Calculé par mi-points exacts, le thème composite décrit la relation elle-même comme une entité vivante. Avec un Soleil composite en ${sunLabel} et une Lune en ${moonLabel}, le couple ou partenariat s’épanouit à travers ${sun.sign.keywords.toLowerCase()}.`,
      sections: [
        {
          title: 'Mission & Cœur de la Relation',
          accent: 'gold',
          body: `L’Ascendant composite en ${ascLabel} définit l’image et la tonalité de la relation face au monde extérieur. Vénus composite en ${getSignLabel(compVenus.longitude, compVenus.sign.name, compVenus.sign.symbol, tradition)} (Maison ${baseChart.houses[compVenus.house - 1].roman}) révèle ce qui cimente la tendresse et les valeurs communes.`,
        },
        baziSection,
      ],
    };
  }

  if (mode === 'comparative' && outerChart && comparativeAnalysis) {
    const baseAscCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
    const outerAscCh = transposeLongitudeToChinese(outerChart.ascendant).sign;
    const chRel = evaluateAnimalHarmony(baseAscCh, outerAscCh);

    return {
      headline: 'Interprétation du Comparatif Double Roue',
      subtitle: `${baseChart.cityName} vs ${outerChart.cityName}`,
      synthesis: `Cette lecture croisée juxtapose la carte de base (${ascLabel}) à la carte comparée (${getSignLabel(outerChart.ascendant, outerChart.ascSign.name, outerChart.ascSign.symbol, tradition)}). L’Ascendant comparé se projette en Maison ${comparativeAnalysis.ascInBaseHouseRoman} de base avec un décalage angulaire de ${comparativeAnalysis.ascShiftDeg}°, orientant l’énergie vers le secteur ${baseChart.houses[Number(comparativeAnalysis.ascInBaseHouseRoman === 'I' ? 0 : 0)] ? comparativeAnalysis.ascInBaseHouseRoman : ''}.`,
      sections: [
        {
          title: 'Équilibre des Forces Comparées',
          accent: 'cyan',
          body: `On dénombre ${comparativeAnalysis.harmoniousCount} aspects harmoniques, ${comparativeAnalysis.fusionCount} conjonctions de convergence et ${comparativeAnalysis.tenseCount} tensions créatrices entre les deux roues. ${
            comparisonAspects.length > 0
              ? `Point focal prioritaire : ${comparisonAspects[0].interpretation}.`
              : ''
          }`,
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
  const retroPlanets = baseChart.planets.filter((p) => p.retrograde);
  return {
    headline: 'Interprétation du Ciel en Direct',
    subtitle: `${baseChart.cityName} · ASC ${ascLabel} · ${sunLabel}`,
    synthesis: `Climat astronomique et symbolique de l’instant : le Soleil traverse ${sunLabel} tandis que la Lune éclaire ${moonLabel}. L’équilibre élémentaire actuel privilégie l’élément ${domEl}, colorant l’atmosphère collective par ${ELEMENT_TEMPERAMENT[domEl]}.`,
    sections: [
      {
        title: 'Configurations Collectives & Rétrogradations',
        accent: 'cyan',
        body:
          retroPlanets.length > 0
            ? `Astres actuellement rétrogrades (phase d’intériorisation et de révision) : ${retroPlanets.map((r) => `${r.symbol} ${r.name} en ${r.sign.name}`).join(', ')}.`
            : 'Toutes les planètes avancent en mouvement direct : élan fluide favorable aux lancements et décisions claires.',
      },
      {
        title: 'Aspects Majeurs du Jour',
        accent: 'gold',
        body:
          baseChart.aspects.length > 0
            ? baseChart.aspects.slice(0, 4).map((a) => a.interpretation).join(' — ')
            : 'Le ciel du jour présente une configuration dégagée.',
      },
      baziSection,
    ],
  };
}
