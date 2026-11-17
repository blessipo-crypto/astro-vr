import type {
  AspectInfo,
  AspectType,
  AstroChart,
  ChartMode,
  ElementType,
  HouseCusp,
  PlanetId,
  PlanetPosition,
  ZodiacSign,
} from './astroEngine';
import type { WuXingElement } from './chineseAstrology';
import {
  getPlanetInHouseMeaning,
  getPlanetInHouseModeContext,
} from './planetHouseKnowledge';

export type DignityStatus = 'Domicile' | 'Exaltation' | 'Exil' | 'Chute' | 'Pérégrine';

export interface PlanetDignityInfo {
  status: DignityStatus;
  badgeColor: string;
  explanation: string;
}

const DIGNITY_RULES: Partial<
  Record<
    PlanetId,
    {
      domicile: number[];
      exaltation?: number[];
      exil: number[];
      chute?: number[];
    }
  >
> = {
  sun: { domicile: [4], exaltation: [0], exil: [10], chute: [6] },
  moon: { domicile: [3], exaltation: [1], exil: [9], chute: [7] },
  mercury: { domicile: [2, 5], exaltation: [5], exil: [8, 11], chute: [11] },
  venus: { domicile: [1, 6], exaltation: [11], exil: [0, 7], chute: [5] },
  mars: { domicile: [0, 7], exaltation: [9], exil: [1, 6], chute: [3] },
  jupiter: { domicile: [8, 11], exaltation: [3], exil: [2, 5], chute: [9] },
  saturn: { domicile: [9, 10], exaltation: [6], exil: [3, 4], chute: [0] },
  uranus: { domicile: [10], exaltation: [7], exil: [4], chute: [1] },
  neptune: { domicile: [11], exil: [5] },
  pluto: { domicile: [7], exil: [1] },
};

export function getPlanetDignity(planetId: PlanetId, signIndex: number): PlanetDignityInfo {
  const rule = DIGNITY_RULES[planetId];
  if (!rule) {
    return {
      status: 'Pérégrine',
      badgeColor: '#cbd5e1',
      explanation: 'Point karmique s’exprimant librement à travers la couleur du signe.',
    };
  }
  if (rule.domicile.includes(signIndex)) {
    return {
      status: 'Domicile',
      badgeColor: '#34d399',
      explanation:
        'En domicile (maîtrise) : l’astre agit chez lui avec aisance, autonomie et pleine autorité naturelle.',
    };
  }
  if (rule.exaltation?.includes(signIndex)) {
    return {
      status: 'Exaltation',
      badgeColor: '#fbbf24',
      explanation:
        'En exaltation : la fonction planétaire rayonne avec noblesse, inspiration et amplitude élevée.',
    };
  }
  if (rule.exil.includes(signIndex)) {
    return {
      status: 'Exil',
      badgeColor: '#fb923c',
      explanation:
        'En exil : l’astre doit composer avec un terrain inhabituel, développant adaptabilité, nuance et inventivité.',
    };
  }
  if (rule.chute?.includes(signIndex)) {
    return {
      status: 'Chute',
      badgeColor: '#f43f5e',
      explanation:
        'En chute : sensibilité accrue demandant de la conscience, de l’humilité et un travail d’intégration fine.',
    };
  }
  return {
    status: 'Pérégrine',
    badgeColor: '#94a3b8',
    explanation:
      'Position neutre (pérégrine) : l’astre épouse souplement les qualités du signe et l’influence de son maître.',
  };
}

const SIGN_RULER_LIST: Array<{ name: string; symbol: string; ruler: string }> = [
  { name: 'Bélier', symbol: '♈\uFE0E', ruler: 'Mars' },
  { name: 'Taureau', symbol: '♉\uFE0E', ruler: 'Vénus' },
  { name: 'Gémeaux', symbol: '♊\uFE0E', ruler: 'Mercure' },
  { name: 'Cancer', symbol: '♋\uFE0E', ruler: 'Lune' },
  { name: 'Lion', symbol: '♌\uFE0E', ruler: 'Soleil' },
  { name: 'Vierge', symbol: '♍\uFE0E', ruler: 'Mercure' },
  { name: 'Balance', symbol: '♎\uFE0E', ruler: 'Vénus' },
  { name: 'Scorpion', symbol: '♏\uFE0E', ruler: 'Pluton' },
  { name: 'Sagittaire', symbol: '♐\uFE0E', ruler: 'Jupiter' },
  { name: 'Capricorne', symbol: '♑\uFE0E', ruler: 'Saturne' },
  { name: 'Verseau', symbol: '♒\uFE0E', ruler: 'Uranus' },
  { name: 'Poissons', symbol: '♓\uFE0E', ruler: 'Neptune' },
];

export interface DecanInfo {
  decanNumber: 1 | 2 | 3;
  subSignName: string;
  subSignSymbol: string;
  subRuler: string;
  label: string;
  nuance: string;
}

export function getDecanInfo(sign: ZodiacSign, degInSign: number): DecanInfo {
  const decanNumber: 1 | 2 | 3 = degInSign < 10 ? 1 : degInSign < 20 ? 2 : 3;
  const subSignIndex = (sign.index + (decanNumber - 1) * 4) % 12;
  const sub = SIGN_RULER_LIST[subSignIndex];
  const nuanceMap: Record<1 | 2 | 3, string> = {
    1: `1er décan (0°–10°) : expression pure et directe du ${sign.name}, soutenue par ${sub.ruler}.`,
    2: `2e décan (10°–20°) : tonalité nuancée par le ${sub.name} (${sub.ruler}), apportant approfondissement et mise en relation.`,
    3: `3e décan (20°–30°) : synthèse mature colorée par le ${sub.name} (${sub.ruler}), tournée vers l’aboutissement et le passage au signe suivant.`,
  };
  return {
    decanNumber,
    subSignName: sub.name,
    subSignSymbol: sub.symbol,
    subRuler: sub.ruler,
    label: `${decanNumber}${decanNumber === 1 ? 'er' : 'e'} décan · sous-influence ${sub.name} (${sub.ruler})`,
    nuance: nuanceMap[decanNumber],
  };
}

export interface LunarPhaseInfo {
  name: string;
  angleDeg: number;
  summary: string;
}

export function getLunarPhaseInfo(sunLon: number, moonLon: number): LunarPhaseInfo {
  const angle = ((moonLon - sunLon) % 360 + 360) % 360;
  const rounded = Math.round(angle);
  if (angle < 45) {
    return {
      name: 'Nouvelle Lune (Phase d’Émergence)',
      angleDeg: rounded,
      summary:
        'Tempérament instinctif, spontané et orienté vers les nouveaux départs : la volonté et le ressenti agissent d’un même élan.',
    };
  }
  if (angle < 90) {
    return {
      name: 'Premier Croissant (Phase d’Affirmation)',
      angleDeg: rounded,
      summary:
        'Énergie pionnière qui cherche à se frayer un chemin propre, parfois en bousculant les habitudes héritées.',
    };
  }
  if (angle < 135) {
    return {
      name: 'Premier Quartier (Phase d’Action)',
      angleDeg: rounded,
      summary:
        'Dynamisme bâtisseur stimulé par les défis concrets : besoin d’agir, de trancher et de transformer ses idées en actes.',
    };
  }
  if (angle < 180) {
    return {
      name: 'Lune Gibbeuse Croissante (Phase de Perfectionnement)',
      angleDeg: rounded,
      summary:
        'Esprit analytique en quête de sens, d’amélioration continue et de compréhension avant la pleine maturité.',
    };
  }
  if (angle < 225) {
    return {
      name: 'Pleine Lune (Phase d’Illumination & d’Altérité)',
      angleDeg: rounded,
      summary:
        'Tempérament lucide, relationnel et expressif qui se révèle dans la confrontation créatrice avec le monde et l’autre.',
    };
  }
  if (angle < 270) {
    return {
      name: 'Lune Disséminante (Phase de Transmission)',
      angleDeg: rounded,
      summary:
        'Besoin de partager son expérience, d’enseigner, de transmettre ses idées et de féconder le collectif.',
    };
  }
  if (angle < 315) {
    return {
      name: 'Dernier Quartier (Phase de Réévaluation)',
      angleDeg: rounded,
      summary:
        'Lucidité critique et indépendance d’esprit : capacité à trier l’essentiel, réorienter ses choix et préparer la mue.',
    };
  }
  return {
    name: 'Lune Balsamique (Phase de Sagesse & Synthèse)',
    angleDeg: rounded,
    summary:
      'Grande profondeur intuitive et vision de long terme, tournée vers l’essentiel, la méditation et les cycles à venir.',
  };
}

const PLANET_SIGN_TRAITS: Record<PlanetId, string[]> = {
  sun: [
    'vitalité conquérante, besoin d’agir en pionnier et d’affirmer une voie personnelle courageuse',
    'rayonnement calme et constructif, fidélité aux valeurs durables, sens concret de la matière et des plaisirs',
    'identité vive, curieuse et mobile, nourrie par l’échange d’idées, l’écriture et la polyvalence',
    'créativité protectrice et mémorielle, attachement profond aux racines, à la famille et à l’imaginaire',
    'cœur généreux, besoin d’expression authentique, noblesse d’âme et leadership chaleureux',
    'accomplissement par la maîtrise technique, le discernement, l’utilité concrète et le sens du détail',
    'quête d’harmonie, de mesure et de justice ; l’identité s’affirme pleinement dans le lien et l’esthétique',
    'volonté intense, lucide et magnétique, capable d’aller au cœur des vérités et de renaître des crises',
    'élan idéaliste et philosophique, besoin d’horizon, d’aventure intellectuelle et de transmission',
    'ambition patiente et structurée, sens aigu des responsabilités et construction dans la durée',
    'originalité assumée, esprit indépendant et visionnaire attaché au progrès humain et à la liberté',
    'sensibilité universelle, intuition créatrice et compassion ouverte sur l’invisible et l’art',
  ],
  moon: [
    'réactions affectives vives et directes ; besoin de franchise émotionnelle, de mouvement et d’autonomie',
    'besoin profond de sécurité matérielle et affective, tendresse fidèle et apaisement au contact de la nature',
    'émotions intellectualisées et changeantes ; besoin de dialoguer, comprendre et garder l’esprit alerte',
    'hypersensibilité tendre et protectrice, mémoire affective puissante et besoin vital d’un foyer rassurant',
    'cœur théâtral et loyal ; besoin de chaleur, de reconnaissance sincère et de créativité joyeuse',
    'pudeur émotionnelle, souci d’aider par des gestes précis et besoin d’ordre intérieur pour se sentir serein',
    'besoin d’équilibre relationnel et de douceur esthétique ; l’humeur est sensible aux tensions ambiantes',
    'émotions profondes, absolues et secrètes ; intuition psychologique perçante et attachements passionnés',
    'optimisme affectif, besoin d’espace, de voyages et de donner un grand sens moral à sa vie intime',
    'retenue émotionnelle et pudeur ; sécurité trouvée dans la fiabilité, la maîtrise de soi et le devoir accompli',
    'attachements libres et amicaux ; besoin d’espace personnel tout en cultivant un fort idéal fraternel',
    'perméabilité émotionnelle extrême, empathie spontanée, rêverie fertile et besoin de retrait ressourçant',
  ],
  mercury: [
    'pensée rapide, tranchante et audacieuse ; parole directe qui aime décider et lancer les idées',
    'intellect posé, pragmatique et mémoriel ; assimile lentement mais durablement, avec bon sens',
    'esprit vif, curieux, joueur et communicatif, à l’aise dans les liens multiples et la synthèse rapide',
    'intelligence intuitive et imagée, portée par la mémoire, l’empathie et l’écoute des non-dits',
    'pensée synthétique, convaincante et expressive ; aime inspirer, enseigner et défendre ses convictions',
    'esprit analytique, méthodique et exigeant, excellent pour trier, classer, diagnostiquer et optimiser',
    'pensée nuancée et diplomate, pesant toujours le pour et le contre pour formuler un avis juste',
    'intellect incisif et investigateur, refusant les réponses superficielles pour percer les mobiles cachés',
    'esprit large et conceptuel, tourné vers les grandes synthèses, les langues, le droit ou la philosophie',
    'pensée structurée, rigoureuse et réaliste, privilégiant l’efficacité, la stratégie et la preuve',
    'intelligence inventive, anticonformiste et fulgurante, douée pour les systèmes, les sciences et l’innovation',
    'pensée poétique, symbolique et réceptive, captant les ambiances globales plus que la logique linéaire',
  ],
  venus: [
    'élan amoureux spontané et passionné ; séduit par la franchise, l’énergie et la conquête directe',
    'sensualité profonde, fidélité affective et goût prononcé pour la beauté tangible, les arts et la table',
    'séduction par l’esprit, l’humour et la conversation ; besoin de légèreté intellectuelle dans le lien',
    'tendresse enveloppante et romantique, attachement au foyer, à la douceur et à la continuité affective',
    'amour généreux, démonstratif et solaire ; cherche l’admiration mutuelle et la ferveur du cœur',
    'affection discrète, attentive et serviable ; prouve son amour par les soins concrets et la délicatesse',
    'raffinement relationnel naturel ; quête d’un duo harmonieux, élégant et fondé sur la réciprocité',
    'passion intense, magnétique et fusionnelle ; ne tolère pas la tiédeur et transforme profondément par l’amour',
    'cœur enthousiaste et indépendant ; attiré par la découverte, l’ailleurs et le partage d’un idéal commun',
    'sentiments profonds mais réservés ; privilégie la loyauté durable, le respect et les engagements sérieux',
    'affection libre, originale et amicale ; valorise l’indépendance d’esprit et la complicité intellectuelle',
    'amour romanesque, fusionnel et compatissant ; grande sensibilité artistique et don de soi généreux',
  ],
  mars: [
    'énergie explosive, franche et courageuse ; agit sur-le-champ, relève les défis et déteste l’attente',
    'force tranquille et tenace ; démarre avec mesure mais déploie une endurance remarquable jusqu’au bout',
    'action dispersée mais agile ; s’affirme par l’habileté verbale, la vivacité et la polyvalence',
    'énergie défensive et intuitive ; agit par vagues émotionnelles pour protéger ses proches et ses projets',
    'volonté fière, créative et déterminée ; besoin d’agir avec panache et de laisser une trace visible',
    'action précise, disciplinée et perfectionniste ; canalise son énergie dans le travail soigné et l’effort utile',
    'combatif pour la justice et l’équilibre ; préfère la négociation stratégique à l’affrontement brutal',
    'volonté de fer, endurance secrète et puissance stratégique ; ne lâche jamais ce qu’il entreprend',
    'élan aventurier, enthousiaste et franc ; agit par conviction morale et goût des grands objectifs',
    'ambition méthodique et infatigable ; dirige son énergie avec sang-froid vers la maîtrise concrète',
    'action imprévisible, réformatrice et indépendante ; lutte volontiers pour des causes collectives ou novatrices',
    'énergie subtile, inspirée et non linéaire ; agit efficacement quand elle est portée par un idéal ou un art',
  ],
  jupiter: [
    'chance dans l’initiative audacieuse ; confiance grandissante à travers l’action autonome et pionnière',
    'prospérité patiente et sens des ressources ; expansion par la stabilité, l’artisanat ou la gestion avisée',
    'ouverture par la curiosité, l’enseignement, les réseaux et la circulation des connaissances',
    'générosité protectrice ; chance liée à la famille, à l’immobilier, au patrimoine ou à l’accueil',
    'rayonnement généreux et confiance créatrice ; réussit en assumant pleinement sa visibilité et sa joie',
    'progrès par la compétence, la pédagogie, le service utile et le souci de bien faire chaque étape',
    'expansion par les alliances, la diplomatie, les partenariats justes et le sens de l’équilibre social',
    'flair psychologique et financier ; capacité à rebondir et transformer les crises en leviers de croissance',
    'grand souffle philosophique, goût des voyages, des études supérieures et transmission d’une vision large',
    'élévation sociale progressive et solide ; réussit par la responsabilité, le sérieux et la crédibilité',
    'réussite grâce aux projets collectifs, aux réseaux innovants et à une vision progressiste du futur',
    'foi intérieure, intuition bienveillante et chance subtile dans les domaines artistiques, humains ou spirituels',
  ],
  saturn: [
    'apprentissage de la patience dans l’action : transforme l’impulsivité en courage discipliné et responsable',
    'construction matérielle solide ; demande de dépasser la peur du manque par une confiance persévérante',
    'esprit sérieux et structuré ; besoin de vérifier ses idées par la logique et d’assumer sa parole',
    'maturité acquise autour des racines et de la vie familiale ; bâtit son propre socle de sécurité intérieure',
    'exigence élevée envers sa créativité ; apprend à rayonner sans craindre le regard ou le jugement d’autrui',
    'sens aigu du devoir, de la méthode et du perfectionnisme ; maîtrise remarquable quand l’autocritique s’apaise',
    'sens profond de l’engagement juste ; relations choisies avec sérieux, exigence et durabilité',
    'maîtrise psychologique forgée par les épreuves ; capacité d’endurance silencieuse et de lucidité absolue',
    'structuration d’une philosophie de vie réaliste ; cherche à concilier grands idéaux et rigueur morale',
    'plein potentiel d’organisation, d’autorité calme et d’accomplissement durable sur le long terme',
    'responsabilité collective et pensée originale rigoureuse ; bâtit des réformes concrètes qui durent',
    'donne forme aux intuitions subtiles ; invite à poser des limites saines tout en cultivant la compassion',
  ],
  uranus: [
    'impulsion réformatrice vive, besoin d’indépendance immédiate et d’innovation dans l’action',
    'révolution tranquille des valeurs matérielles, écologiques et du rapport concret aux ressources',
    'éveil intellectuel fulgurant, intuition des nouveaux médias, réseaux et façons de penser',
    'renouvellement des modèles familiaux, besoin d’un foyer libre et atypique',
    'créativité originale et singulière refusant les conventions rigides',
    'modernisation des méthodes de travail, de la santé et des outils techniques de précision',
    'redéfinition libre et égalitaire du couple, des contrats et de l’esthétique',
    'bouleversements profonds générant une lucidité radicale et une régénération psychologique',
    'remise en question des dogmes établis au profit d’une vision universelle ouverte',
    'mutation des structures sociales, professionnelles et des modes de gouvernance',
    'génie collectif, inventions de rupture, esprit fraternel et projection résolue vers l’avenir',
    'éveil spirituel ou artistique décloisonnant l’imaginaire et la conscience collective',
  ],
  neptune: [
    'idéalisation de l’action héroïque et inspiration spontanée portée par l’intuition',
    'sensibilité artistique sensorielle et rapport idéaliste à la nature et à la matière',
    'imagination verbale, pensée poétique, intuitive et parfois floue sur les détails pratiques',
    'profonde mémoire affective et nostalgie créatrice liée aux origines et à la sensibilité intime',
    'idéal créatif et romantique fort, cherchant à sublimer le cœur par l’art ou la générosité',
    'dévouement discret et recherche d’équilibre entre rigueur quotidienne et inspiration spirituelle',
    'quête d’un amour idéal et d’une harmonie presque musicale dans les liens humains',
    'fascination pour les mystères de la psyché, l’invisible et les transformations intérieures profondes',
    'soif d’absolu philosophique, d’évasion spirituelle et de tolérance sans frontières',
    'aspiration à incarner un idéal concret dans la société tout en restant lucide face aux illusions',
    'utopie humaniste, empathie collective et inspiration tournée vers le bien commun futur',
    'immense réceptivité psychique, poétique et spirituelle dans son signe d’appartenance',
  ],
  pluto: [
    'volonté de régénération par l’affirmation directe et le courage face aux crises',
    'transformation lente mais irréversible des attachements matériels et des sécurités profondes',
    'pouvoir incisif du verbe, recherche passionnée des vérités cachées et lucidité mentale',
    'métamorphose des mémoires familiales et guérison des racines émotionnelles anciennes',
    'intensité créatrice puissante cherchant à laisser une empreinte authentique et durable',
    'capacité de purification, de diagnostic clinique et de reconstruction patiente du quotidien',
    'transformation profonde à travers le miroir des relations intimes et des engagements',
    'intensité magnétique, lucidité implacable et pouvoir de renaissance totale dans son domaine',
    'refonte radicale des croyances, des systèmes de sens et des grandes visions du monde',
    'démantèlement et reconstruction des structures de pouvoir, d’ambition et de responsabilité',
    'mutation collective profonde des réseaux humains, des sciences et des libertés',
    'dissolution des anciens schémas collectifs vers une conscience unifiée et compassionnelle',
  ],
  northNode: [
    'apprendre l’audace personnelle, la décision autonome et le courage d’exister par soi-même (en dépassant la dépendance au regard d’autrui du Nœud Sud en Balance)',
    'cultiver la sérénité, l’ancrage concret, la patience et la valeur de ce qui dure (en apaisant l’intensité ou les crises du Nœud Sud en Scorpion)',
    'développer la curiosité ouverte, le dialogue proche et l’écoute concrète (en relativisant les certitudes dogmatiques du Nœud Sud en Sagittaire)',
    'oser la vulnérabilité affective, la tendresse et la vie intérieure (en adoucissant l’armure de devoir du Nœud Sud en Capricorne)',
    'assumer son rayonnement unique, sa joie créatrice et son cœur généreux (en sortant du retrait ou de l’effacement collectif du Nœud Sud en Verseau)',
    'développer le discernement pratique, la méthode bienveillante et la clarté du quotidien (en évitant la dispersion ou la fuite du Nœud Sud en Poissons)',
    'apprendre la coopération juste, l’écoute de l’autre et la diplomatie (en tempérant l’individualisme instinctif du Nœud Sud en Bélier)',
    'accepter les transformations profondes, la lucidité psychologique et le lâcher-prise (en quittant l’attachement excessif au confort du Nœud Sud en Taureau)',
    's’ouvrir aux grands horizons, à la synthèse de sens et à la confiance spirituelle (en dépassant l’agitation mentale du Nœud Sud en Gémeaux)',
    'assumer sa responsabilité publique, son autonomie adulte et sa vocation concrète (en s’émancipant du refuge familial du Nœud Sud en Cancer)',
    'mettre ses talents au service d’un projet fraternel, libre et collectif (en dépassant le besoin exclusif de reconnaissance personnelle du Nœud Sud en Lion)',
    'développer la confiance intuitive, la compassion et l’ouverture à l’inexplicable (en relâchant le perfectionnisme anxieux du Nœud Sud en Vierge)',
  ],
};

const PLANET_HOUSE_FOCUS: Record<number, string> = {
  1: 'dans votre tempérament apparent, votre corps vital et votre manière spontanée d’aborder chaque situation',
  2: 'dans votre gestion des ressources matérielles, vos talents monnayables et votre sentiment de valeur personnelle',
  3: 'dans vos échanges quotidiens, votre façon d’apprendre, vos écrits, votre entourage proche et vos déplacements',
  4: 'dans votre vie privée, votre foyer, vos racines familiales et votre équilibre émotionnel intime',
  5: 'dans votre créativité personnelle, vos élans amoureux, vos joies de vivre et votre relation aux enfants ou créations',
  6: 'dans votre organisation quotidienne, votre rythme de travail, le service rendu et votre hygiène de vie',
  7: 'dans votre couple, vos partenariats contractuels et ce que vous attirez en miroir chez l’autre',
  8: 'dans vos transformations psychologiques profondes, les ressources partagées et la capacité à renaître des mues',
  9: 'dans vos quêtes philosophiques, études supérieures, voyages lointains et transmission d’une vision du monde',
  10: 'dans votre vocation professionnelle, votre réputation publique, vos ambitions et votre rôle social',
  11: 'dans vos amitiés électives, réseaux, projets collectifs et idéaux tournés vers l’avenir',
  12: 'dans votre vie intérieure silencieuse, l’intuition, l’inspiration artistique ou spirituelle et l’accueil de l’inconscient',
};

const RETROGRADE_PLANET_NOTES: Partial<Record<PlanetId, string>> = {
  mercury:
    'Mercure ℞ indique une pensée très réflexive, originale et intériorisée : besoin de mûrir ses mots et de relire sous un angle personnel.',
  venus:
    'Vénus ℞ invite à vivre l’amour et les valeurs esthétiques avec profondeur et authenticité intérieure plutôt que selon les normes extérieures.',
  mars:
    'Mars ℞ canalise l’énergie vers la stratégie, la maîtrise intérieure et l’action mûrement réfléchie plutôt que l’impulsion brute.',
  jupiter:
    'Jupiter ℞ place la croissance et la sagesse dans la quête de vérité personnelle plutôt que dans la simple réussite extérieure.',
  saturn:
    'Saturne ℞ forge une autorité intérieure exigeante et autonome : on apprend à devenir son propre repère structurant.',
  uranus:
    'Uranus ℞ exprime l’indépendance et le besoin de liberté d’abord sur le plan mental et intérieur avant de réformer l’extérieur.',
  neptune:
    'Neptune ℞ affine l’intuition silencieuse, la vie contemplative et l’imaginaire personnel.',
  pluto:
    'Pluton ℞ concentre un puissant travail souterrain de transformation psychologique et d’autonomie émotionnelle.',
};

export function getPlanetSignDeepMeaning(planet: PlanetPosition, houses: HouseCusp[]): string {
  const trait = PLANET_SIGN_TRAITS[planet.id]?.[planet.sign.index] ?? planet.sign.keywords.toLowerCase();
  const dignity = getPlanetDignity(planet.id, planet.sign.index);
  const decan = getDecanInfo(planet.sign, planet.degInSign);
  const planetHouseSpecific = getPlanetInHouseMeaning(planet.id, planet.house);
  const retroNote = planet.retrograde && RETROGRADE_PLANET_NOTES[planet.id] ? ` ${RETROGRADE_PLANET_NOTES[planet.id]}` : '';

  const dignityTag =
    dignity.status !== 'Pérégrine' ? ` [${dignity.status} en ${planet.sign.name}]` : '';

  return `${planet.name} en ${planet.sign.name}${dignityTag} (${decan.decanNumber}${decan.decanNumber === 1 ? 'er' : 'e'} décan · sous-influence ${decan.subSignName}) s’exprime par : ${trait}. ${planetHouseSpecific}${retroNote}`;
}

export function getHouseCuspInterpretation(house: HouseCusp, allPlanets: PlanetPosition[]): string {
  const rulerPlanet = allPlanets.find((p) => p.name.toLowerCase() === house.sign.ruler.toLowerCase()) ?? null;
  const rulerPart = rulerPlanet
    ? ` Son maître, ${rulerPlanet.symbol} ${rulerPlanet.name}, se trouve en ${rulerPlanet.sign.symbol} ${rulerPlanet.sign.name} (Maison ${house.house === rulerPlanet.house ? house.roman : romanFor(rulerPlanet.house)}), reliant ce domaine de vie à ${PLANET_HOUSE_FOCUS[rulerPlanet.house]}.`
    : '';
  return `La cuspide en ${house.sign.symbol} ${house.sign.name} (${house.sign.element} · ${house.sign.modality}) aborde ce secteur avec ${house.sign.keywords.toLowerCase()}.${rulerPart}`;
}

function romanFor(houseNum: number): string {
  const map = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return map[houseNum - 1] ?? String(houseNum);
}

const PAIR_THEMES: Record<string, string> = {
  'sun-moon': 'accord entre identité consciente (Soleil) et besoins émotionnels profonds (Lune)',
  'sun-mercury': 'expression directe des idées et rayonnement par la parole ou l’intellect',
  'sun-venus': 'charme naturel, goût de l’harmonie, sens artistique et rayonnement affectif',
  'sun-mars': 'force de caractère, vitalité combative, courage et esprit d’entreprise',
  'sun-jupiter': 'confiance en la vie, générosité, amplitude des projets et sens de l’envergure',
  'sun-saturn': 'sens des responsabilités, exigence personnelle, construction solide dans le temps',
  'sun-uranus': 'originalité affirmée, besoin d’indépendance, intuition créatrice et refus des routines',
  'sun-neptune': 'sensibilité inspirée, idéalisme élevé, créativité artistique ou empathie spirituelle',
  'sun-pluto': 'volonté intense, magnétisme profond et capacité à se réinventer après les grandes étapes',
  'sun-northNode': 'alignement fort entre l’identité solaire et la direction d’évolution de vie',
  'moon-mercury': 'dialogue permanent entre raison et sentiment, mémoire fine et parole sensible',
  'moon-venus': 'douceur affective, sens du confort, tendresse et goût des liens apaisés',
  'moon-mars': 'réactivité émotionnelle vive, franchise du cœur et passion protectrice',
  'moon-jupiter': 'générosité du cœur, optimisme affectif, chaleur humaine et sens de l’accueil',
  'moon-saturn': 'profondeur et retenue émotionnelle, loyauté sérieuse et besoin de sécurité fiable',
  'moon-uranus': 'émotions vives et imprévisibles, besoin de liberté intime et intuition instantanée',
  'moon-neptune': 'réceptivité psychique exceptionnelle, imaginaire fertile et compassion spontanée',
  'moon-pluto': 'vie émotionnelle intense, lucidité psychologique et attachements transformateurs',
  'moon-northNode': 'résonance intime avec le chemin d’évolution et les choix de cœur structurants',
  'mercury-venus': 'élégance du verbe, diplomatie, esprit conciliant et sens esthétique dans les idées',
  'mercury-mars': 'esprit vif, répartie rapide, intellect combatif et franchise intellectuelle',
  'mercury-jupiter': 'ampleur de pensée, goût du sens global, pédagogie et facilité de synthèse',
  'mercury-saturn': 'rigueur logique, esprit méthodique, concentration patiente et jugement structuré',
  'mercury-uranus': 'fulgurance d’esprit, inventivité conceptuelle et pensée anticonformiste',
  'mercury-neptune': 'pensée poétique, imagination intuitive et perception des symboles subtils',
  'mercury-pluto': 'esprit d’enquête, perspicacité psychologique et refus de la superficialité',
  'venus-mars': 'magnétisme relationnel, dialogue entre désir (Mars) et tendresse (Vénus)',
  'venus-jupiter': 'chaleur généreuse, goût du bonheur partagé, sociabilité rayonnante et abondance',
  'venus-saturn': 'fidélité profonde, pudeur ou exigence dans les choix du cœur et amour durable',
  'venus-uranus': 'attirance pour l’originalité, besoin d’air et de renouvellement dans les liens',
  'venus-neptune': 'romantisme élevé, inspiration artistique et sensibilité idéale en amour',
  'venus-pluto': 'passion magnétique, profondeur absolue des sentiments et transformation par le lien',
  'mars-jupiter': 'enthousiasme moteur, audace entreprenante et goût des grands défis constructifs',
  'mars-saturn': 'endurance contrôlée, discipline de l’action et maîtrise stratégique de l’effort',
  'mars-uranus': 'élan indépendant, réactions vives, audace novatrice et goût du risque maîtrisé',
  'mars-neptune': 'action guidée par l’inspiration, le rêve, l’art ou une cause désintéressée',
  'mars-pluto': 'puissance d’exécution exceptionnelle, détermination inébranlable et résistance',
  'jupiter-saturn': 'équilibre fondamental entre élan d’expansion et sagesse réaliste de construction',
  'jupiter-uranus': 'soif de progrès, élargissement soudain d’horizons et goût des réformes fécondes',
  'jupiter-neptune': 'élan spirituel, générosité idéaliste et vaste vision humaniste',
  'jupiter-pluto': 'ambition transformatrice de grande envergure et pouvoir d’influence',
  'saturn-uranus': 'tension ou alliance féconde entre tradition solide et réforme novatrice',
  'saturn-neptune': 'capacité à donner une forme concrète et patiente aux intuitions et idéaux',
  'saturn-pluto': 'résilience exceptionnelle, rigueur face aux crises et reconstruction durable',
  'uranus-neptune': 'sensibilité générationnelle à l’éveil des consciences et aux mutations culturelles',
  'uranus-pluto': 'dynamique générationnelle de rupture et de transformation collective profonde',
  'neptune-pluto': 'courant de fond spirituel et civilisationnel à l’échelle d’une époque',
};

function getPairTheme(idA: PlanetId, idB: PlanetId): string {
  const k1 = `${idA}-${idB}`;
  const k2 = `${idB}-${idA}`;
  return (
    PAIR_THEMES[k1] ??
    PAIR_THEMES[k2] ??
    `dialogue entre deux principes planétaires structurants`
  );
}

function getOrbPrecisionLabel(orb: number): string {
  if (orb <= 1.0) return 'aspect partile très puissant';
  if (orb <= 2.5) return 'aspect serré et très actif';
  if (orb <= 4.5) return 'aspect net et structurant';
  return 'aspect d’arrière-plan à orbe large';
}

const ASPECT_DYNAMIC_VERB: Record<AspectType, string> = {
  conjunction: 'fusionnent directement leurs énergies',
  sextile: 'ouvrent une synergie constructive à activer volontairement',
  trine: 'circulent avec une fluidité innée et un talent naturel',
  square: 'créent une friction stimulante qui oblige à agir, choisir et dépasser les résistances',
  opposition: 'établissent une polarité consciente demandant d’unir deux exigences complémentaires',
  quincunx: 'exigent un réajustement fin et une réorientation créatrice permanente',
  semisextile: 'tissent un apprentissage progressif entre deux expériences voisines',
  semisquare: 'génèrent une tension aiguë qui pousse à rectifier et à trancher dans le concret',
  sesquiquadrate: 'provoquent un défi d’extériorisation appelant une maîtrise pragmatique',
  quintile: 'révèlent un talent singulier et une étincelle créative d’ordre artistique',
  biquintile: 'expriment une maîtrise inventive et une synthèse personnelle raffinée',
  decile: 'amorcent une impulsion subtile de croissance créatrice',
  tridecile: 'affinent la créativité intellectuelle et la recherche d’excellence',
  vigintile: 'insufflent une micro-nuance de sensibilité originale',
  novile: 'mûrissent intérieurement vers un accomplissement serein et initiatique',
  binovile: 'élargissent la compréhension spirituelle à travers l’expérience vécue',
  quadrinovile: 'achèvent un cycle de sagesse intérieure et de pacification',
  septile: 'suscitent une inspiration non linéaire, poétique ou de l’ordre de la vocation',
  biseptile: 'ouvrent une bifurcation intuitive porteuse de sens singulier',
  triseptile: 'mettent à l’épreuve l’intuition créatrice pour la transformer en œuvre',
  undecile: 'éveillent une aspiration visionnaire au-delà des cadres habituels',
};

export function buildDetailedAspectInterpretation(
  planetA: PlanetId,
  planetAName: string,
  planetB: PlanetId,
  planetBName: string,
  aspectType: AspectType,
  aspectSymbol: string,
  orb: number,
  contextPrefix?: string
): string {
  const pairTheme = getPairTheme(planetA, planetB);
  const precision = getOrbPrecisionLabel(orb);
  const dynamicVerb = ASPECT_DYNAMIC_VERB[aspectType];
  const head = contextPrefix
    ? `${contextPrefix} (${orb.toFixed(1)}°, ${precision})`
    : `${planetAName} ${aspectSymbol} ${planetBName} (${orb.toFixed(1)}°, ${precision})`;
  return `${head} : ${planetAName} et ${planetBName} ${dynamicVerb}, mettant en jeu ${pairTheme}.`;
}

export function getElementDeficitAdvice(elements: Record<ElementType, number>): string {
  const entries = (Object.keys(elements) as ElementType[]).map((el) => ({
    el,
    val: elements[el],
  }));
  const lacking = entries.filter((e) => e.val === 0).map((e) => e.el);
  const low = entries.filter((e) => e.val === 1).map((e) => e.el);
  const target = lacking.length > 0 ? lacking : low;
  if (target.length === 0) {
    return 'Répartition élémentaire particulièrement équilibrée entre Feu, Terre, Air et Eau, offrant une grande polyvalence d’adaptation.';
  }
  const adviceByEl: Record<ElementType, string> = {
    Feu: 'le Feu discret invite à cultiver l’initiative spontanée, l’enthousiasme et la confiance créatrice',
    Terre: 'la Terre discrète invite à ancrer les idées dans des routines concrètes, le corps et la patience matérielle',
    Air: 'l’Air discret invite à prendre du recul intellectuel, dialoguer et formaliser ses intuitions par les mots',
    Eau: 'l’Eau discrète invite à accueillir la vulnérabilité émotionnelle, l’écoute intuitive et les temps de silence',
  };
  return `Axe d’équilibrage : ${target.map((e) => adviceByEl[e]).join(' ; ')}.`;
}

export function getHemisphereBalance(chart: AstroChart): string {
  const planets = chart.planets.filter((p) => p.id !== 'northNode');
  const northern = planets.filter((p) => p.house >= 1 && p.house <= 6).length; // sous l'horizon (subjectif / intime)
  const southern = planets.length - northern; // au-dessus de l'horizon (social / objectif)
  const eastern = planets.filter((p) => p.house === 10 || p.house === 11 || p.house === 12 || p.house === 1 || p.house === 2 || p.house === 3).length;
  const western = planets.length - eastern;

  const nsText =
    northern >= southern + 3
      ? `Forte concentration sous l’horizon (${northern} astres en Maisons I–VI) : vie intérieure riche, priorité à l’enracinement personnel avant l’exposition sociale.`
      : southern >= northern + 3
        ? `Forte concentration au-dessus de l’horizon (${southern} astres en Maisons VII–XII) : destinée tournée vers l’action visible, le collectif et l’accomplissement social.`
        : `Équilibre entre vie intime (${northern} sous l’horizon) et rayonnement public (${southern} au-dessus).`;

  const ewText =
    eastern >= western + 3
      ? `Dominante Est (${eastern} astres côté Ascendant) : tempérament autonome qui préfère initier et décider par lui-même.`
      : western >= eastern + 3
        ? `Dominante Ouest (${western} astres côté Descendant) : évolution rythmée par les rencontres, les alliances et la coopération.`
        : `Équilibre Est/Ouest entre autonomie personnelle (${eastern}) et sens du lien (${western}).`;

  return `${nsText} ${ewText}`;
}

export function getWuXingDynamicAdvice(balance: Record<WuXingElement, number>, dominant: WuXingElement): string {
  const genCycle: Record<WuXingElement, WuXingElement> = {
    Bois: 'Feu',
    Feu: 'Terre',
    Terre: 'Métal',
    Métal: 'Eau',
    Eau: 'Bois',
  };
  const motherCycle: Record<WuXingElement, WuXingElement> = {
    Feu: 'Bois',
    Terre: 'Feu',
    Métal: 'Terre',
    Eau: 'Métal',
    Bois: 'Eau',
  };
  const ctrlCycle: Record<WuXingElement, WuXingElement> = {
    Bois: 'Terre',
    Terre: 'Eau',
    Eau: 'Feu',
    Feu: 'Métal',
    Métal: 'Bois',
  };
  const missing = (Object.keys(balance) as WuXingElement[]).filter((k) => balance[k] === 0);
  const child = genCycle[dominant];
  const mother = motherCycle[dominant];
  const controlled = ctrlCycle[dominant];

  return `Selon le cycle Wu Xing : votre ${dominant} dominant est nourri par l’élément ressource ${mother} et s’exprime naturellement en engendrant ${child} (cycle Shēng), tandis qu’il doit veiller à ne pas sur-solliciter ${controlled} (cycle Kè).${
    missing.length > 0
      ? ` Élément(s) absent(s) à cultiver consciemment : ${missing.join(', ')}.`
      : ' Tous les 5 mouvements Wu Xing sont présents dans le thème.'
  }`;
}

export function getSolarReturnSunHouseMeaning(houseNum: number): string {
  const map: Record<number, string> = {
    1: 'Année charnière de renouveau identitaire, d’initiative personnelle et de visibilité directe.',
    2: 'Année axée sur les finances, la consolidation des revenus, l’estime de soi et les acquisitions concrètes.',
    3: 'Année riche en échanges, formations, écrits, contrats courts, déplacements et contacts proches.',
    4: 'Année centrée sur le foyer, la famille, l’immobilier, le recentrage intime ou un changement de cadre de vie.',
    5: 'Année créative, affective et expressive : projets de cœur, plaisirs, enfants ou rayonnement artistique.',
    6: 'Année d’organisation, de rigueur professionnelle quotidienne, de soin du corps et de perfectionnement technique.',
    7: 'Année marquée par le couple, les associations, les contrats importants et le miroir de l’autre.',
    8: 'Année de mutation profonde, de tri salutaire, de gestion financière partagée ou de renaissance intérieure.',
    9: 'Année d’élargissement : grands projets, voyages, études supérieures, enseignement ou quête de sens.',
    10: 'Année majeure pour la carrière, la reconnaissance sociale, les responsabilités et l’élévation publique.',
    11: 'Année portée par les amitiés, réseaux, projets collectifs, appuis extérieurs et objectifs d’avenir.',
    12: 'Année d’introspection fertile, de maturation silencieuse et de préparation des cycles suivants.',
  };
  return map[houseNum] ?? '';
}

export function getAspectSynthesisHint(asp: AspectInfo): string {
  return buildDetailedAspectInterpretation(
    asp.planetA,
    asp.planetAName,
    asp.planetB,
    asp.planetBName,
    asp.type,
    asp.symbol,
    asp.orb
  );
}

export function getPlanetTrait(planetId: PlanetId, signIndex: number): string {
  return PLANET_SIGN_TRAITS[planetId]?.[signIndex] ?? '';
}

export function getHouseArenaFocus(houseNum: number): string {
  return PLANET_HOUSE_FOCUS[houseNum] ?? '';
}

export function describeSlowTransitInHouse(planet: PlanetPosition, natalHouse: HouseCusp): string {
  const focus = PLANET_HOUSE_FOCUS[natalHouse.house] ?? natalHouse.meaning;
  const retro = planet.retrograde ? ' (en phase rétrograde ℞ : révision et approfondissement)' : '';
  const verbByPlanet: Partial<Record<PlanetId, string>> = {
    jupiter: 'apporte expansion, opportunités, confiance et élargissement',
    saturn: 'demande structuration, discipline, tri réaliste et consolidation durable',
    uranus: 'provoque éveil soudain, libération des routines et renouvellement',
    neptune: 'diffuse sensibilité intuitive, idéalisation et perméabilité subtile',
    pluto: 'opère une mue profonde, une refonte radicale et une régénération',
  };
  const action = verbByPlanet[planet.id] ?? 'active ce secteur';
  return `${planet.symbol} ${planet.name} en ${planet.sign.name}${retro} traverse votre Maison ${natalHouse.roman} natale (${natalHouse.title}) : il ${action} ${focus}.`;
}

export interface AscendantDeepInterpretation {
  temperament: string;
  firstImpression: string;
  axisBalance: string;
  decanNote: string;
}

const ASCENDANT_PROFILES: Array<Omit<AscendantDeepInterpretation, 'decanNote'>> = [
  {
    temperament:
      'Élan direct, franc et entreprenant : vous abordez l’existence de front avec spontanéité, courage et besoin d’agir rapidement.',
    firstImpression:
      'On perçoit d’emblée une présence dynamique, décidée, parfois impatiente, qui préfère initier plutôt qu’attendre.',
    axisBalance:
      'Avec le Descendant en Balance, vous apprenez à tempérer l’impulsivité par l’écoute, le tact et la coopération avec l’autre.',
  },
  {
    temperament:
      'Ancrage posé, sensuel et persévérant : vous avancez à votre rythme, avec bon sens, fiabilité et goût du concret durable.',
    firstImpression:
      'Vous dégagez une aura rassurante, calme et déterminée ; on sent une force tranquille difficile à déstabiliser.',
    axisBalance:
      'Avec le Descendant en Scorpion, les relations vous invitent à sortir de la routine sécurisante pour vivre des liens profonds et transformateurs.',
  },
  {
    temperament:
      'Vivacité d’esprit, curiosité et mobilité : vous explorez le monde par les idées, le dialogue, l’humour et les liens multiples.',
    firstImpression:
      'On vous perçoit alerte, adaptable, communicatif et rapide à saisir chaque nuance d’une situation.',
    axisBalance:
      'Avec le Descendant en Sagittaire, l’autre vous invite à passer du foisonnement d’idées à une vision plus large et engagée.',
  },
  {
    temperament:
      'Sensibilité intuitive, bienveillance et prudence protectrice : vous ressentez l’ambiance d’un lieu avant même de parler.',
    firstImpression:
      'Vous inspirez douceur, écoute et empathie, tout en gardant un cercle intérieur protégé tant que la confiance n’est pas établie.',
    axisBalance:
      'Avec le Descendant en Capricorne, vous recherchez chez l’autre solidité, loyauté durable et sens des responsabilités.',
  },
  {
    temperament:
      'Rayonnement chaleureux, créativité et noblesse d’élan : vous aimez vivre avec panache, générosité et authenticité.',
    firstImpression:
      'On remarque immédiatement votre présence solaire, votre charisme naturel et la franchise de vos élans du cœur.',
    axisBalance:
      'Avec le Descendant en Verseau, vos relations vous apprennent à conjuguer fierté personnelle et liberté égalitaire au sein du collectif.',
  },
  {
    temperament:
      'Discernement, précision et sens du détail utile : vous observez, analysez et cherchez à améliorer concrètement ce qui vous entoure.',
    firstImpression:
      'On perçoit une allure soignée, modeste, fiable et attentive aux subtilités que d’autres ne voient pas.',
    axisBalance:
      'Avec le Descendant en Poissons, l’autre ouvre votre sensibilité à la confiance intuitive, au lâcher-prise et à l’empathie sans calcul.',
  },
  {
    temperament:
      'Sens de l’harmonie, diplomatie et raffinement : vous recherchez l’équilibre juste entre vos désirs et ceux de votre entourage.',
    firstImpression:
      'Vous dégagez élégance, courtoisie et sociabilité ; votre premier réflexe est de créer un terrain d’entente agréable.',
    axisBalance:
      'Avec le Descendant en Bélier, le miroir relationnel vous pousse à oser trancher, vous affirmer et défendre vos choix francs.',
  },
  {
    temperament:
      'Intensité silencieuse, lucidité et magnétisme : vous ne vous contentez jamais des apparences et cherchez la vérité des êtres.',
    firstImpression:
      'Votre regard pénétrant et votre réserve maîtrisée intriguent ; on sent une forte détermination intérieure.',
    axisBalance:
      'Avec le Descendant en Taureau, vous cherchez dans le lien stabilité tangible, tendresse simple et fidélité apaisante.',
  },
  {
    temperament:
      'Enthousiasme ouvert, optimisme et soif d’horizons : vous avez besoin d’espace, de sens, de mouvement et de découvertes.',
    firstImpression:
      'On perçoit une énergie chaleureuse, directe et confiante, tournée vers l’avenir et les grands projets.',
    axisBalance:
      'Avec le Descendant en Gémeaux, l’autre vous aide à affiner vos élans par le dialogue concret, la nuance et la curiosité du quotidien.',
  },
  {
    temperament:
      'Maîtrise calme, endurance et sens de la responsabilité : vous prenez le temps de bâtir solidement sur la durée.',
    firstImpression:
      'Vous projetez sérieux, maturité et autonomie ; on vous accorde volontiers crédit et autorité naturelle.',
    axisBalance:
      'Avec le Descendant en Cancer, vos liens intimes vous invitent à montrer votre tendresse et à cultiver un foyer chaleureux.',
  },
  {
    temperament:
      'Indépendance d’esprit, originalité et fraternité : vous tracez votre route hors des sentiers battus avec lucidité.',
    firstImpression:
      'On remarque votre singularité, votre esprit libre et votre aisance à relier des idées ou des personnes différentes.',
    axisBalance:
      'Avec le Descendant en Lion, les relations vous apprennent à accueillir la chaleur du cœur et la reconnaissance personnelle sincère.',
  },
  {
    temperament:
      'Réceptivité subtile, compassion et imagination inspirée : vous captez intuitivement les courants émotionnels et symboliques.',
    firstImpression:
      'Vous dégagez douceur, mystère et souplesse, avec une sensibilité artistique ou humaine immédiatement perceptible.',
    axisBalance:
      'Avec le Descendant en Vierge, le partenaire ou le concret vous aide à structurer vos intuitions dans des réalisations claires.',
  },
];

export function getAscendantDeepInterpretation(
  sign: ZodiacSign,
  degInSign: number
): AscendantDeepInterpretation {
  const base = ASCENDANT_PROFILES[sign.index] ?? ASCENDANT_PROFILES[0];
  const decan = getDecanInfo(sign, degInSign);
  return {
    ...base,
    decanNote: `${decan.label} — ${decan.nuance}`,
  };
}

const RULER_NAME_TO_ID: Record<string, PlanetId> = {
  soleil: 'sun',
  lune: 'moon',
  mercure: 'mercury',
  vénus: 'venus',
  venus: 'venus',
  mars: 'mars',
  jupiter: 'jupiter',
  saturne: 'saturn',
  uranus: 'uranus',
  neptune: 'neptune',
  pluton: 'pluto',
};

export function getRuledHousesLabels(planetId: PlanetId, houses: HouseCusp[]): string[] {
  return houses
    .filter((h) => RULER_NAME_TO_ID[h.sign.ruler.toLowerCase()] === planetId)
    .map((h) => {
      if (h.house === 1) return 'I (ASC)';
      if (h.house === 10) return 'X (MC)';
      if (h.house === 7) return 'VII (DSC)';
      if (h.house === 4) return 'IV (FC)';
      return h.roman;
    });
}

export function getHouseRulerInfo(
  house: HouseCusp,
  allPlanets: PlanetPosition[],
  allHouses: HouseCusp[]
): {
  rulerPlanet: PlanetPosition | null;
  rulerLocationText: string;
  rulerDignityStatus: DignityStatus | null;
} {
  const rulerId = RULER_NAME_TO_ID[house.sign.ruler.toLowerCase()];
  const rulerPlanet = rulerId ? (allPlanets.find((p) => p.id === rulerId) ?? null) : null;
  if (!rulerPlanet) {
    return {
      rulerPlanet: null,
      rulerLocationText: house.sign.ruler,
      rulerDignityStatus: null,
    };
  }
  const rulerHouse = allHouses[rulerPlanet.house - 1];
  const dignity = getPlanetDignity(rulerPlanet.id, rulerPlanet.sign.index);
  return {
    rulerPlanet,
    rulerLocationText: `${rulerPlanet.symbol} ${rulerPlanet.name} en ${rulerPlanet.sign.symbol} ${rulerPlanet.sign.name} (Maison ${rulerHouse?.roman ?? rulerPlanet.house})`,
    rulerDignityStatus: dignity.status,
  };
}

export function getNatalPlanetDetailedText(
  planet: PlanetPosition,
  chart: AstroChart,
  aspectCount: number,
  modeContext: 'natal' | 'composite' | 'live' = 'natal'
): string {
  const trait = PLANET_SIGN_TRAITS[planet.id]?.[planet.sign.index] ?? planet.sign.keywords.toLowerCase();
  const dignity = getPlanetDignity(planet.id, planet.sign.index);
  const decan = getDecanInfo(planet.sign, planet.degInSign);
  const house = chart.houses[planet.house - 1];
  const houseSpecific = getPlanetInHouseModeContext(
    modeContext,
    planet.id,
    planet.name,
    house.roman,
    planet.house,
    house.roman,
    house.title
  );
  const ruled = getRuledHousesLabels(planet.id, chart.houses);

  const ruledSentence =
    ruled.length > 0
      ? ` Comme maître ${ruled.length > 1 ? 'des Maisons' : 'de la Maison'} ${ruled.join(' et ')}, cet astre relie directement ${ruled.length > 1 ? 'ces secteurs' : 'ce secteur'} à la Maison ${house.roman}.`
      : '';

  const dignityDetail =
    planet.id === 'northNode'
      ? ''
      : ` (${dignity.status} : ${dignity.explanation.charAt(0).toLowerCase()}${dignity.explanation.slice(1)})`;

  const retroNote =
    planet.retrograde && RETROGRADE_PLANET_NOTES[planet.id]
      ? ` ${RETROGRADE_PLANET_NOTES[planet.id]}`
      : '';

  const aspectNote =
    aspectCount > 0
      ? ` Relié par ${aspectCount} aspect${aspectCount > 1 ? 's' : ''} majeur${aspectCount > 1 ? 's' : ''}.`
      : ' Sans aspect majeur serré : fonctionne de manière autonome et directe.';

  return `${planet.name} en ${planet.sign.name} (${decan.decanNumber}${decan.decanNumber === 1 ? 'er' : 'e'} décan · sous-influence ${decan.subSignName})${dignityDetail} se traduit par : ${trait}. ${houseSpecific}${ruledSentence}${retroNote}${aspectNote}`;
}

export function getNatalHouseDetailedText(house: HouseCusp, chart: AstroChart): string {
  const occupants = chart.planets.filter((p) => p.house === house.house);
  const { rulerPlanet, rulerLocationText, rulerDignityStatus } = getHouseRulerInfo(
    house,
    chart.planets,
    chart.houses
  );

  const rulerSentence = rulerPlanet
    ? ` Son gouverneur est ${rulerLocationText}${rulerDignityStatus && rulerDignityStatus !== 'Pérégrine' ? ` [${rulerDignityStatus}]` : ''}, ce qui rattache concrètement ce domaine ${PLANET_HOUSE_FOCUS[rulerPlanet.house] ?? ''}.`
    : '';

  const occupantsSentence =
    occupants.length > 0
      ? ` ${occupants.length > 1 ? 'Les astres présents' : 'L’astre présent'} (${occupants.map((p) => `${p.symbol} ${p.name}${p.retrograde ? ' ℞' : ''}`).join(', ')}) ${occupants.length > 1 ? 'animent' : 'anime'} activement ce secteur.`
      : ' Sans planète occupante, ce secteur s’exprime avec fluidité à travers l’état et les aspects de son maître planétaire.';

  return `${house.meaning} Avec sa cuspide en ${house.sign.symbol} ${house.sign.name} (${house.sign.element} · ${house.sign.modality}), ce domaine est abordé avec ${house.sign.keywords.toLowerCase()}.${rulerSentence}${occupantsSentence}`;
}

const SOLAR_RETURN_HOUSE_MEANINGS: Record<number, string> = {
  1: 'Donne le ton général de l’année : votre élan personnel, votre attitude spontanée, votre image et votre vitalité physique.',
  2: 'Secteur des finances de l’année : revenus, gestion budgétaire, acquisitions concrètes, talents valorisés et sécurité matérielle.',
  3: 'Secteur des échanges et démarches annuelles : contrats courts, écrits, formations, déplacements fréquents et entourage proche.',
  4: 'Secteur du foyer et de la base privée durant l’année : lieu de vie, famille, immobilier, racines et recherche de stabilité intérieure.',
  5: 'Secteur des joies, créations et amours de l’année : projets personnels, élans du cœur, enfants, expression artistique et loisirs.',
  6: 'Secteur du quotidien professionnel et de la santé de l’année : rythme de travail, organisation pratique, collaborations et hygiène de vie.',
  7: 'Secteur des alliances et du couple sur l’année : partenariats, contrats majeurs, vie à deux et miroir relationnel.',
  8: 'Secteur des mues et finances partagées de l’année : transformations psychologiques, investissements, transmissions et tri nécessaire.',
  9: 'Secteur des grands horizons annuels : voyages lointains, études supérieures, projets éditoriaux ou juridiques et élargissement de vision.',
  10: 'Secteur de la vocation et de la reconnaissance sociale cette année : carrière, responsabilités publiques, objectifs et visibilité.',
  11: 'Secteur des projets collectifs et appuis de l’année : amitiés, réseaux, soutiens extérieurs et idéaux d’avenir.',
  12: 'Secteur de la maturation silencieuse : introspection, bilan de fin de cycle, inspiration intérieure et préparation des étapes futures.',
};

export function getSolarReturnHouseMeaning(houseNum: number): string {
  return SOLAR_RETURN_HOUSE_MEANINGS[houseNum] ?? '';
}

const SOLAR_RETURN_PLANET_ROLE: Record<PlanetId, string> = {
  sun: 'Foyer central de votre vitalité, de vos projets conscients et de ce qui demande à rayonner cette année',
  moon: 'Climat émotionnel dominant, vie quotidienne, besoins intimes et fluctuations affectives de l’année',
  mercury: 'Orientation de vos pensées, négociations, signatures, études et déplacements de l’année',
  venus: 'Tonalité sentimentale, qualité des relations harmonieuses, plaisirs et aisance financière de l’année',
  mars: 'Moteur d’initiative, combats constructifs, courage d’entreprendre et gestion de l’impatience annuelle',
  jupiter: 'Champ principal d’opportunités, d’appuis bienveillants, de croissance et d’ouverture de l’année',
  saturn: 'Point d’ancrage exigeant de l’année : responsabilités, patience constructive et consolidations durables',
  uranus: 'Secteur des tournants inattendus, prises de liberté et innovations nécessaires cette année',
  neptune: 'Zone d’inspiration intuitive, de créativité subtile ou de flou à éclaircir avec discernement cette année',
  pluto: 'Levier de transformation profonde, de lucidité stratégique et de régénération sur l’année',
  northNode: 'Cap évolutif annuel indiquant vers quelles expériences nouvelles il est fécond d’avancer',
};

export function getSolarReturnPlanetDetailedText(
  srPlanet: PlanetPosition,
  srChart: AstroChart,
  natalHouse: HouseCusp,
  srAspectCount: number
): string {
  const srHouse = srChart.houses[srPlanet.house - 1];
  const dignity = getPlanetDignity(srPlanet.id, srPlanet.sign.index);
  const decan = getDecanInfo(srPlanet.sign, srPlanet.degInSign);
  const trait = PLANET_SIGN_TRAITS[srPlanet.id]?.[srPlanet.sign.index] ?? srPlanet.sign.keywords.toLowerCase();
  const roleDesc = SOLAR_RETURN_PLANET_ROLE[srPlanet.id] ?? srPlanet.role;
  const srHouseMeaning = getPlanetInHouseMeaning(srPlanet.id, srPlanet.house);
  const natalActivation = getPlanetInHouseModeContext(
    'solarReturn',
    srPlanet.id,
    srPlanet.name,
    srHouse.roman,
    natalHouse.house,
    natalHouse.roman,
    natalHouse.title
  );
  const ruledSr = getRuledHousesLabels(srPlanet.id, srChart.houses);

  const dignityPart =
    srPlanet.id !== 'northNode' && dignity.status !== 'Pérégrine'
      ? ` [${dignity.status} en ${srPlanet.sign.name}]`
      : '';

  const ruledPart =
    ruledSr.length > 0
      ? ` En RS, il gouverne ${ruledSr.length > 1 ? 'les Maisons' : 'la Maison'} ${ruledSr.join(' et ')} RS.`
      : '';

  const retroPart =
    srPlanet.retrograde && RETROGRADE_PLANET_NOTES[srPlanet.id]
      ? ` Rétrograde à l’ouverture de l’année : invite à la maturation et à la relecture avant d’agir.`
      : '';

  const aspPart =
    srAspectCount > 0
      ? ` (${srAspectCount} aspect${srAspectCount > 1 ? 's' : ''} actif${srAspectCount > 1 ? 's' : ''} en RS.)`
      : '';

  return `${roleDesc}. Situé en ${srPlanet.sign.name}${dignityPart} (${decan.decanNumber}${decan.decanNumber === 1 ? 'er' : 'e'} décan) : ${trait}. ${srHouseMeaning} ${natalActivation}${ruledPart}${retroPart}${aspPart}`;
}

export function getSolarReturnHouseDetailedText(
  srHouse: HouseCusp,
  srChart: AstroChart,
  natalSuperposedHouse: HouseCusp
): string {
  const baseMeaning = getSolarReturnHouseMeaning(srHouse.house);
  const occupants = srChart.planets.filter((p) => p.house === srHouse.house);
  const { rulerPlanet, rulerLocationText } = getHouseRulerInfo(
    srHouse,
    srChart.planets,
    srChart.houses
  );

  const rulerSentence = rulerPlanet
    ? ` Son gouverneur annuel est ${rulerLocationText}, orientant les résultats de ce secteur vers la Maison ${srChart.houses[rulerPlanet.house - 1].roman} RS.`
    : '';

  const occSentence =
    occupants.length > 0
      ? ` Planètes RS présentes : ${occupants.map((p) => `${p.symbol} ${p.name}${p.retrograde ? ' ℞' : ''}`).join(', ')}, qui rendent ce domaine particulièrement actif cette année.`
      : ' Aucune planète RS ne séjourne ici : ce secteur évolue de façon calme selon le bilan de son maître annuel.';

  return `${baseMeaning} La cuspide RS en ${srHouse.sign.symbol} ${srHouse.sign.name} (${srHouse.sign.keywords.toLowerCase()}) se superpose à votre Maison ${natalSuperposedHouse.roman} natale (${natalSuperposedHouse.title}), reliant ce thème annuel à ${PLANET_HOUSE_FOCUS[natalSuperposedHouse.house] ?? natalSuperposedHouse.meaning}.${rulerSentence}${occSentence}`;
}

const SOLAR_RETURN_ASC_IN_NATAL_HOUSE: Record<number, string> = {
  1: 'Configuration majeure de nouveau départ : l’Ascendant annuel revient dans votre Maison I natale, ce qui inaugure un cycle personnel direct, un changement d’image ou de posture, et un besoin fort d’agir par vous-même.',
  2: 'Les thèmes financiers, la sécurité matérielle, vos talents concrets et la juste valorisation de vos efforts deviennent la porte d’entrée de toute votre année anniversaire.',
  3: 'Votre année s’ouvre sous le signe de la mobilité, des échanges intellectuels, des démarches administratives ou commerciales, des formations courtes et du lien actif avec l’entourage proche.',
  4: 'Priorité à la sphère privée, au foyer, au lieu de résidence ou à l’histoire familiale : l’année invite à consolider vos racines, déménager, réaménager votre espace ou protéger votre équilibre intérieur.',
  5: 'L’année s’éclaire par le cœur, la créativité personnelle, les projets artistiques ou ludiques, les enfants et le plaisir d’exprimer sans retenue ce qui vous anime.',
  6: 'L’organisation quotidienne, l’hygiène de vie, les méthodes de travail et l’efficacité pratique prennent le devant de la scène : année idéale pour affiner vos routines et prendre soin de votre vitalité.',
  7: 'L’autre joue un rôle déterminant cette année : couple, associations, contrats importants, clients ou négociations orientent vos choix et vous reflètent ce qu’il faut ajuster.',
  8: 'Année de lucidité psychologique et de mue profonde : tri salutaire, gestion de ressources partagées (investissements, fiscalité, crédits, héritages) et régénération intérieure.',
  9: 'Votre horizon s’élargit nettement : voyages lointains, études supérieures, enseignement, publication, droit ou quête de sens deviennent les moteurs principaux des 12 mois.',
  10: 'Mise en lumière sociale et professionnelle directe : responsabilités accrues, objectifs de carrière, visibilité publique ou redéfinition de votre statut sont au cœur de l’année.',
  11: 'Projets collectifs, réseaux professionnels, amitiés choisies, appuis extérieurs et idéaux d’avenir donnent l’élan principal de cette Révolution Solaire.',
  12: 'Année de maturation silencieuse, de retrait fécond ou de travail en coulisses : vous préparez un futur cycle tout en clôturant des dossiers ou schémas devenus caducs.',
};

export function getSolarReturnAscInNatalHouseInterpretation(houseNum: number): string {
  return SOLAR_RETURN_ASC_IN_NATAL_HOUSE[houseNum] ?? '';
}

const SOLAR_RETURN_SUN_REFINED: Record<number, string> = {
  1: 'Le Soleil en Maison I RS vous place aux commandes directes de l’année : votre énergie vitale demande à se manifester sans intermédiaire, mais veillez à éviter l’impatience ou l’excès d’individualisme.',
  2: 'Le Soleil en Maison II RS éclaire vos revenus, votre rapport à la valeur personnelle et vos investissements tangibles : privilégiez les démarches rentables, concrètes et mesurables.',
  3: 'Le Soleil en Maison III RS dynamise vos idées, écrits, contrats courts, apprentissages et déplacements : votre rayonnement passe par le dialogue, la pédagogie et la curiosité.',
  4: 'Le Soleil en Maison IV RS invite à recentrer votre vitalité sur votre base de vie, la famille, un bien immobilier ou un projet intime mûri loin du bruit extérieur.',
  5: 'Le Soleil en Maison V RS réveille la joie créative, les élans sentimentaux, la prise de risque artistique ou entrepreneuriale : l’année récompense ce que vous faites avec enthousiasme.',
  6: 'Le Soleil en Maison VI RS demande rigueur, maîtrise technique, sens du service utile et attention accrue à l’équilibre corps-esprit dans votre quotidien professionnel.',
  7: 'Le Soleil en Maison VII RS place la réussite de l’année dans l’alliance, la négociation équilibrée, la vie à deux ou l’engagement contractuel clair avec autrui.',
  8: 'Le Soleil en Maison VIII RS pousse à transformer ce qui stagne, clarifier les engagements financiers communs et gagner en maîtrise émotionnelle face aux changements.',
  9: 'Le Soleil en Maison IX RS appelle à dépasser vos frontières habituelles par le voyage, la formation supérieure, la recherche, le conseil ou la transmission.',
  10: 'Le Soleil en Maison X RS (position particulièrement puissante) favorise l’ambition assumée, la reconnaissance méritée, les promotions et la prise de responsabilités publiques.',
  11: 'Le Soleil en Maison XI RS rayonne à travers les projets d’équipe, l’engagement associatif, les cercles d’influence et l’innovation tournée vers l’avenir.',
  12: 'Le Soleil en Maison XII RS oriente votre lumière vers la vie intérieure, la recherche discrète, la solidarité ou la préparation méthodique d’un lancement pour l’année suivante.',
};

export function getSolarReturnSunInHouseRefined(houseNum: number): string {
  return SOLAR_RETURN_SUN_REFINED[houseNum] ?? getSolarReturnSunHouseMeaning(houseNum);
}

export function getSolarReturnAngularPlanetMeaning(
  planetId: PlanetId,
  planetName: string,
  angleName: 'ASC' | 'MC' | 'DSC' | 'IC',
  orb: number
): string {
  const angleRole: Record<'ASC' | 'MC' | 'DSC' | 'IC', string> = {
    ASC: 'à l’Ascendant RS (colore directement votre vitalité, vos décisions immédiates et la manière dont les autres vous perçoivent toute l’année)',
    MC: 'au Milieu du Ciel RS (domine votre vie professionnelle, votre statut public, vos ambitions et votre direction sociale)',
    DSC: 'au Descendant RS (agit directement sur le couple, les partenariats, les contrats et les rencontres clés de l’année)',
    IC: 'au Fond du Ciel RS (transforme l’atmosphère du foyer, la vie familiale, l’immobilier et votre socle psychologique)',
  };
  const planetKey = SOLAR_RETURN_PLANET_ROLE[planetId] ?? planetName;
  return `${planetName} conjoint ${angleName} RS (orbe ${orb}°) — dominante angulaire majeure ${angleRole[angleName]} : ${planetKey.charAt(0).toLowerCase()}${planetKey.slice(1)}.`;
}

export function getComparisonPlanetDetailedText(
  mode: ChartMode,
  outerPlanet: PlanetPosition,
  outerChart: AstroChart,
  natalHouse: HouseCusp,
  aspectCount: number
): string {
  const trait =
    PLANET_SIGN_TRAITS[outerPlanet.id]?.[outerPlanet.sign.index] ??
    outerPlanet.sign.keywords.toLowerCase();
  const dignity = getPlanetDignity(outerPlanet.id, outerPlanet.sign.index);
  const decan = getDecanInfo(outerPlanet.sign, outerPlanet.degInSign);
  const outerHouse = outerChart.houses[outerPlanet.house - 1];
  const overlayMeaning = getPlanetInHouseModeContext(
    mode,
    outerPlanet.id,
    outerPlanet.name,
    outerHouse.roman,
    natalHouse.house,
    natalHouse.roman,
    natalHouse.title
  );

  const dignityPart =
    outerPlanet.id !== 'northNode' && dignity.status !== 'Pérégrine'
      ? ` [${dignity.status}]`
      : '';

  const retroPart =
    outerPlanet.retrograde && RETROGRADE_PLANET_NOTES[outerPlanet.id]
      ? ` ${RETROGRADE_PLANET_NOTES[outerPlanet.id]}`
      : '';

  const aspPart =
    aspectCount > 0
      ? ` (${aspectCount} aspect${aspectCount > 1 ? 's' : ''} actif${aspectCount > 1 ? 's' : ''} sur la carte de base.)`
      : '';

  return `${outerPlanet.name} en ${outerPlanet.sign.name}${dignityPart} (${decan.decanNumber}${decan.decanNumber === 1 ? 'er' : 'e'} décan) s’exprime par : ${trait}. ${overlayMeaning}${retroPart}${aspPart}`;
}

export function getNatalHouseWithOuterOverlayDetailedText(
  mode: ChartMode,
  natalHouse: HouseCusp,
  baseChart: AstroChart,
  outerOccupants: PlanetPosition[]
): string {
  const baseText = getNatalHouseDetailedText(natalHouse, baseChart);
  if (outerOccupants.length === 0) {
    return `${baseText} Aucun astre externe ne séjourne actuellement dans cette Maison : ce secteur reste dans son équilibre natal de fond.`;
  }
  const verb =
    mode === 'synastry'
      ? 'Le partenaire place ici'
      : mode === 'transits'
        ? 'Actuellement traversée en transit par'
        : mode === 'progressions'
          ? 'Actuellement activée en progression par'
          : mode === 'lunarReturn'
            ? 'Activée ce mois-ci par'
            : 'Activée par';
  const occDesc = outerOccupants
    .map((p) => {
      const hint = getPlanetInHouseMeaning(p.id, natalHouse.house).replace(/^[^:]+:\s*/, '');
      return `${p.symbol} ${p.name} (${hint.split('.')[0]})`;
    })
    .join(' · ');
  return `${baseText} ${verb} : ${occDesc}.`;
}



