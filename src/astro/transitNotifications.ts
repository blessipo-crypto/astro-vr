import * as Astronomy from 'astronomy-engine';
import {
  AstroChart,
  findHouseForLongitude,
  formatDegreeInSign,
  normalizeDeg,
  PlanetId,
  ZODIAC_SIGNS,
} from './astroEngine';

export type TransitAlertCategory = 'house_ingress' | 'natal_aspect' | 'sign_ingress' | 'station';
export type TransitAlertPriority = 'major' | 'notable' | 'subtle';

export interface TransitNotification {
  id: string;
  date: Date;
  daysFromNow: number;
  category: TransitAlertCategory;
  priority: TransitAlertPriority;
  planetId: PlanetId;
  planetName: string;
  planetSymbol: string;
  title: string;
  subtitle: string;
  description: string;
  houseNumber?: number;
  targetName?: string;
}

interface ScannedBodyMeta {
  id: PlanetId;
  body?: Astronomy.Body;
  name: string;
  symbol: string;
  isOuterSlow: boolean;
}

const TRANSIT_SCAN_BODIES: ScannedBodyMeta[] = [
  { id: 'sun', body: Astronomy.Body.Sun, name: 'Soleil', symbol: '☉', isOuterSlow: false },
  { id: 'mercury', body: Astronomy.Body.Mercury, name: 'Mercure', symbol: '☿', isOuterSlow: false },
  { id: 'venus', body: Astronomy.Body.Venus, name: 'Vénus', symbol: '♀\uFE0E', isOuterSlow: false },
  { id: 'mars', body: Astronomy.Body.Mars, name: 'Mars', symbol: '♂\uFE0E', isOuterSlow: false },
  { id: 'jupiter', body: Astronomy.Body.Jupiter, name: 'Jupiter', symbol: '♃\uFE0E', isOuterSlow: true },
  { id: 'saturn', body: Astronomy.Body.Saturn, name: 'Saturne', symbol: '♄\uFE0E', isOuterSlow: true },
  { id: 'uranus', body: Astronomy.Body.Uranus, name: 'Uranus', symbol: '♅\uFE0E', isOuterSlow: true },
  { id: 'neptune', body: Astronomy.Body.Neptune, name: 'Neptune', symbol: '♆\uFE0E', isOuterSlow: true },
  { id: 'pluto', body: Astronomy.Body.Pluto, name: 'Pluton', symbol: '♇\uFE0E', isOuterSlow: true },
];

const HOUSE_THEMES_FR: Record<number, { roman: string; theme: string; guidance: string }> = {
  1: {
    roman: 'I',
    theme: 'Identité, élan vital & posture personnelle',
    guidance: 'renouvelle votre manière d’aborder le monde, votre présence et vos initiatives directes.',
  },
  2: {
    roman: 'II',
    theme: 'Ressources, finances & estime de soi',
    guidance: 'met l’accent sur la sécurité matérielle, les talents concrets et la gestion de vos acquis.',
  },
  3: {
    roman: 'III',
    theme: 'Communication, études & entourage proche',
    guidance: 'stimule les échanges, les déplacements, l’écriture et la curiosité intellectuelle.',
  },
  4: {
    roman: 'IV',
    theme: 'Foyer, racines & vie intérieure',
    guidance: 'invite à consolider vos bases familiales, votre habitat ou votre équilibre émotionnel.',
  },
  5: {
    roman: 'V',
    theme: 'Création, amour & joie d’expression',
    guidance: 'éclaire la créativité, les élans affectifs, les projets de cœur et le plaisir d’entreprendre.',
  },
  6: {
    roman: 'VI',
    theme: 'Quotidien, travail & vitalité',
    guidance: 'réorganise vos routines, votre rythme professionnel et l’attention portée à votre santé.',
  },
  7: {
    roman: 'VII',
    theme: 'Relations, partenariats & alliances',
    guidance: 'transforme la dynamique du couple, des associations ou des contrats importants.',
  },
  8: {
    roman: 'VIII',
    theme: 'Métamorphoses, ressources partagées & profondeur',
    guidance: 'ouvre un cycle de lucidité psychologique, de tri intérieur et de réorganisation financière partagée.',
  },
  9: {
    roman: 'IX',
    theme: 'Grands horizons, voyages & quête de sens',
    guidance: 'élargit la vision philosophique, les projets à l’étranger, les études supérieures ou l’enseignement.',
  },
  10: {
    roman: 'X',
    theme: 'Vocation, carrière & rayonnement social',
    guidance: 'propulse vos ambitions professionnelles, votre visibilité et vos responsabilités publiques.',
  },
  11: {
    roman: 'XI',
    theme: 'Projets d’avenir, amitiés & réseaux',
    guidance: 'favorise les collaborations collectives, les soutiens amicaux et les idéaux à long terme.',
  },
  12: {
    roman: 'XII',
    theme: 'Vie secrète, maturation & lâcher-prise',
    guidance: 'demande du recul, de l’écoute intuitive et la préparation silencieuse d’un prochain cycle.',
  },
};

const MAJOR_ASPECTS_TO_SCAN: Array<{
  angle: number;
  label: string;
  symbol: string;
  tone: 'fusion' | 'harmonious' | 'tense';
  meaning: string;
}> = [
  {
    angle: 0,
    label: 'Conjonction',
    symbol: '☌\uFE0E',
    tone: 'fusion',
    meaning: 'fusionne son impulsion avec votre énergie natale et inaugure un nouveau cycle.',
  },
  {
    angle: 180,
    label: 'Opposition',
    symbol: '☍\uFE0E',
    tone: 'tense',
    meaning: 'met en lumière une polarité extérieure demandant équilibre et prise de conscience.',
  },
  {
    angle: 120,
    label: 'Trigone',
    symbol: '△\uFE0E',
    tone: 'harmonious',
    meaning: 'ouvre un courant fluide porteur d’opportunités naturelles et de soutien.',
  },
  {
    angle: 90,
    label: 'Carré',
    symbol: '□\uFE0E',
    tone: 'tense',
    meaning: 'crée un déclic constructif poussant à agir, décider ou ajuster votre cap.',
  },
  {
    angle: 60,
    label: 'Sextile',
    symbol: '⚹\uFE0E',
    tone: 'harmonious',
    meaning: 'offre une ouverture favorable accessible par une initiative consciente.',
  },
];

function getPlanetLon(meta: ScannedBodyMeta, date: Date): number {
  if (meta.id === 'sun') {
    return normalizeDeg(Astronomy.SunPosition(date).elon);
  }
  if (!meta.body) return 0;
  const vec = Astronomy.GeoVector(meta.body, date, true);
  return normalizeDeg(Astronomy.Ecliptic(vec).elon);
}

function signedAngleDelta(fromLon: number, toLon: number): number {
  let d = toLon - fromLon;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function refineCrossingTime(
  t0Ms: number,
  t1Ms: number,
  predicateIsAfter: (date: Date) => boolean
): Date {
  let lo = t0Ms;
  let hi = t1Ms;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) * 0.5;
    if (predicateIsAfter(new Date(mid))) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return new Date(Math.round((lo + hi) * 0.5));
}

function refineZeroCrossing(
  t0Ms: number,
  t1Ms: number,
  evalError: (date: Date) => number
): Date {
  let lo = t0Ms;
  let hi = t1Ms;
  const fLo = evalError(new Date(lo));
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) * 0.5;
    const fMid = evalError(new Date(mid));
    if ((fLo <= 0 && fMid <= 0) || (fLo >= 0 && fMid >= 0)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return new Date(Math.round((lo + hi) * 0.5));
}

export function scanUpcomingTransitNotifications(
  natalChart: AstroChart,
  fromDate: Date = new Date(),
  horizonDays = 30
): TransitNotification[] {
  const notifications: TransitNotification[] = [];
  const startMs = fromDate.getTime();
  const stepHours = 6;
  const stepMs = stepHours * 3600 * 1000;
  const totalSteps = Math.round((horizonDays * 24) / stepHours);

  const natalTargets: Array<{
    key: string;
    name: string;
    symbol: string;
    lon: number;
    isKeyPoint: boolean;
  }> = [
    ...natalChart.planets
      .filter((p) => p.id !== 'northNode')
      .map((p) => ({
        key: p.id,
        name: p.name,
        symbol: p.symbol,
        lon: p.longitude,
        isKeyPoint: p.id === 'sun' || p.id === 'moon' || p.id === 'venus' || p.id === 'mars' || p.id === 'saturn' || p.id === 'jupiter',
      })),
    {
      key: 'asc',
      name: 'Ascendant',
      symbol: 'ASC',
      lon: natalChart.ascendant,
      isKeyPoint: true,
    },
    {
      key: 'mc',
      name: 'Milieu du Ciel',
      symbol: 'MC',
      lon: natalChart.midheaven,
      isKeyPoint: true,
    },
  ];

  for (const meta of TRANSIT_SCAN_BODIES) {
    let prevTime = new Date(startMs);
    let prevLon = getPlanetLon(meta, prevTime);
    let prevHouse = findHouseForLongitude(prevLon, natalChart.houses);
    let prevSignIdx = Math.floor(prevLon / 30) % 12;
    let prevVel: number | null = null;

    for (let s = 1; s <= totalSteps; s++) {
      const curMs = startMs + s * stepMs;
      const curTime = new Date(curMs);
      const curLon = getPlanetLon(meta, curTime);
      const curVel = signedAngleDelta(prevLon, curLon);

      // 1. Natal House Ingress detection
      const curHouse = findHouseForLongitude(curLon, natalChart.houses);
      if (curHouse !== prevHouse) {
        const exactDate = refineCrossingTime(
          prevTime.getTime(),
          curMs,
          (d) => findHouseForLongitude(getPlanetLon(meta, d), natalChart.houses) === curHouse
        );
        const hInfo = HOUSE_THEMES_FR[curHouse] ?? {
          roman: String(curHouse),
          theme: `Maison ${curHouse}`,
          guidance: 'active ce secteur de votre thème natal.',
        };
        const isAngularHouse = curHouse === 1 || curHouse === 4 || curHouse === 7 || curHouse === 10;
        const retroTag = curVel < 0 ? ' (en rétrogradation)' : '';
        const priority: TransitAlertPriority =
          meta.isOuterSlow || isAngularHouse ? 'major' : 'notable';
        const daysFromNow = (exactDate.getTime() - startMs) / 86400000;

        notifications.push({
          id: `house-${meta.id}-m${curHouse}-${Math.round(exactDate.getTime() / 3600000)}`,
          date: exactDate,
          daysFromNow,
          category: 'house_ingress',
          priority,
          planetId: meta.id,
          planetName: meta.name,
          planetSymbol: meta.symbol,
          houseNumber: curHouse,
          title: `${meta.name} entre en Maison ${hInfo.roman}${retroTag}`,
          subtitle: `${hInfo.theme}`,
          description: `${meta.name} franchit la cuspide de votre Maison ${hInfo.roman} natale et ${hInfo.guidance}`,
        });
      }

      // 2. Zodiac Sign Ingress detection
      const curSignIdx = Math.floor(curLon / 30) % 12;
      if (curSignIdx !== prevSignIdx) {
        const exactDate = refineCrossingTime(
          prevTime.getTime(),
          curMs,
          (d) => (Math.floor(getPlanetLon(meta, d) / 30) % 12) === curSignIdx
        );
        const newSign = ZODIAC_SIGNS[curSignIdx];
        const daysFromNow = (exactDate.getTime() - startMs) / 86400000;
        notifications.push({
          id: `sign-${meta.id}-${newSign.index}-${Math.round(exactDate.getTime() / 3600000)}`,
          date: exactDate,
          daysFromNow,
          category: 'sign_ingress',
          priority: meta.isOuterSlow ? 'major' : meta.id === 'sun' || meta.id === 'mars' ? 'notable' : 'subtle',
          planetId: meta.id,
          planetName: meta.name,
          planetSymbol: meta.symbol,
          title: `${meta.name} entre en ${newSign.symbol} ${newSign.name}`,
          subtitle: `Changement de signe (${newSign.element} · ${newSign.modality})`,
          description: `${meta.name} passe à 00°00′ ${newSign.name} et colore la période d’une dynamique ${newSign.element.toLowerCase()} (${newSign.modality.toLowerCase()}).`,
        });
      }

      // 3. Retrograde / Direct Station detection (Mercury..Pluto)
      if (meta.id !== 'sun' && prevVel !== null && prevVel * curVel < 0) {
        const becomingRetro = curVel < 0;
        const exactDate = new Date((prevTime.getTime() + curMs) * 0.5);
        const fmt = formatDegreeInSign(curLon);
        const daysFromNow = (exactDate.getTime() - startMs) / 86400000;
        notifications.push({
          id: `station-${meta.id}-${becomingRetro ? 'rx' : 'dir'}-${Math.round(exactDate.getTime() / 3600000)}`,
          date: exactDate,
          daysFromNow,
          category: 'station',
          priority: 'major',
          planetId: meta.id,
          planetName: meta.name,
          planetSymbol: meta.symbol,
          title: `${meta.name} devient ${becomingRetro ? 'Rétrograde (℞)' : 'Direct(e)'}`,
          subtitle: `Station à ${fmt.formattedDeg} ${fmt.sign.name}`,
          description: becomingRetro
            ? `${meta.name} marque un temps d’arrêt puis rétrograde en ${fmt.sign.name} : période de révision et d’intériorisation.`
            : `${meta.name} reprend sa marche directe en ${fmt.sign.name} : déblocage et concrétisation progressive.`,
        });
      }

      // 4. Exact Major Aspects to Natal Planets & Angles
      for (const target of natalTargets) {
        for (const asp of MAJOR_ASPECTS_TO_SCAN) {
          // Keep feed high-signal: fast planets (Sun/Mercury/Venus/Mars) check aspects to Luminaries/Angles/Mars/Venus/Slow; slow planets check all targets; skip Sextile for Mercury/Venus unless Moon/Sun/ASC/MC
          if (!meta.isOuterSlow && asp.angle === 60 && !target.isKeyPoint) continue;
          if ((meta.id === 'mercury' || meta.id === 'venus') && !target.isKeyPoint) continue;

          // Evaluate both signed angles matching `asp.angle` (e.g. +90° and -90°)
          const candidateTargets =
            asp.angle === 0 || asp.angle === 180
              ? [normalizeDeg(target.lon + asp.angle)]
              : [normalizeDeg(target.lon + asp.angle), normalizeDeg(target.lon - asp.angle)];

          for (const exactTargetLon of candidateTargets) {
            const dPrev = signedAngleDelta(exactTargetLon, prevLon);
            const dCur = signedAngleDelta(exactTargetLon, curLon);

            // Detect genuine crossing within [-18°, +18°] window so wraparound at ±180° is never confused for a transit crossing
            if (Math.abs(dPrev) < 18 && Math.abs(dCur) < 18 && ((dPrev <= 0 && dCur > 0) || (dPrev >= 0 && dCur < 0))) {
              const exactDate = refineZeroCrossing(prevTime.getTime(), curMs, (d) =>
                signedAngleDelta(exactTargetLon, getPlanetLon(meta, d))
              );
              const fmt = formatDegreeInSign(exactTargetLon);
              const daysFromNow = (exactDate.getTime() - startMs) / 86400000;
              const priority: TransitAlertPriority =
                meta.isOuterSlow || (asp.angle === 0 || asp.angle === 180 || asp.angle === 90) && target.isKeyPoint
                  ? 'major'
                  : 'notable';

              notifications.push({
                id: `asp-${meta.id}-${asp.angle}-${target.key}-${Math.round(exactDate.getTime() / 3600000)}`,
                date: exactDate,
                daysFromNow,
                category: 'natal_aspect',
                priority,
                planetId: meta.id,
                planetName: meta.name,
                planetSymbol: meta.symbol,
                targetName: target.name,
                title: `${meta.name} ${asp.symbol} ${asp.label} ${target.name} natal`,
                subtitle: `Exact à ${fmt.formattedDeg} ${fmt.sign.name}`,
                description: `${meta.name} en transit forme un aspect exact de ${asp.label.toLowerCase()} à votre ${target.name} natal et ${asp.meaning}`,
              });
            }
          }
        }
      }

      prevTime = curTime;
      prevLon = curLon;
      prevHouse = curHouse;
      prevSignIdx = curSignIdx;
      prevVel = curVel;
    }
  }

  // Sort chronologically (soonest first), deduplicating near-identical events within 3 hours
  notifications.sort((a, b) => a.date.getTime() - b.date.getTime());
  return notifications;
}
