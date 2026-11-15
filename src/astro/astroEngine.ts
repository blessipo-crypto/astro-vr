import * as Astronomy from 'astronomy-engine';
import { buildDetailedAspectInterpretation, getPlanetSignDeepMeaning } from './astroKnowledge';

export type ElementType = 'Feu' | 'Terre' | 'Air' | 'Eau';
export type ModalityType = 'Cardinal' | 'Fixe' | 'Mutable';
export type HouseSystem = 'placidus' | 'equal' | 'wholesign';

export interface ZodiacSign {
  index: number;
  name: string;
  symbol: string;
  element: ElementType;
  modality: ModalityType;
  ruler: string;
  color: string;
  accentHex: number;
  keywords: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { index: 0, name: 'Bélier', symbol: '♈', element: 'Feu', modality: 'Cardinal', ruler: 'Mars', color: '#e0533c', accentHex: 0xe0533c, keywords: 'Élan vital, initiative, courage, commencement' },
  { index: 1, name: 'Taureau', symbol: '♉', element: 'Terre', modality: 'Fixe', ruler: 'Vénus', color: '#4d9e6a', accentHex: 0x4d9e6a, keywords: 'Ancrage, sensualité, patience, pérennité' },
  { index: 2, name: 'Gémeaux', symbol: '♊', element: 'Air', modality: 'Mutable', ruler: 'Mercure', color: '#eab308', accentHex: 0xeab308, keywords: 'Curiosité, dialogue, dualité, vivacité d’esprit' },
  { index: 3, name: 'Cancer', symbol: '♋', element: 'Eau', modality: 'Cardinal', ruler: 'Lune', color: '#60a5fa', accentHex: 0x60a5fa, keywords: 'Mémoire, foyer, intuition protectrice, profondeur' },
  { index: 4, name: 'Lion', symbol: '♌', element: 'Feu', modality: 'Fixe', ruler: 'Soleil', color: '#f59e0b', accentHex: 0xf59e0b, keywords: 'Rayonnement, créativité, noblesse de cœur' },
  { index: 5, name: 'Vierge', symbol: '♍', element: 'Terre', modality: 'Mutable', ruler: 'Mercure', color: '#65a30d', accentHex: 0x65a30d, keywords: 'Discernement, précision, soin, synthèse utile' },
  { index: 6, name: 'Balance', symbol: '♎', element: 'Air', modality: 'Cardinal', ruler: 'Vénus', color: '#ec4899', accentHex: 0xec4899, keywords: 'Harmonie, altérité, justice, équilibre esthétique' },
  { index: 7, name: 'Scorpion', symbol: '♏', element: 'Eau', modality: 'Fixe', ruler: 'Pluton', color: '#dc2626', accentHex: 0xdc2626, keywords: 'Métamorphose, intensité, vérité cachée, régénération' },
  { index: 8, name: 'Sagittaire', symbol: '♐', element: 'Feu', modality: 'Mutable', ruler: 'Jupiter', color: '#a855f7', accentHex: 0xa855f7, keywords: 'Quête de sens, horizon lointain, sagesse, expansion' },
  { index: 9, name: 'Capricorne', symbol: '♑', element: 'Terre', modality: 'Cardinal', ruler: 'Saturne', color: '#78716c', accentHex: 0x78716c, keywords: 'Maîtrise, élévation, rigueur, temps long' },
  { index: 10, name: 'Verseau', symbol: '♒', element: 'Air', modality: 'Fixe', ruler: 'Uranus', color: '#06b6d4', accentHex: 0x06b6d4, keywords: 'Invention, fraternité, liberté, vision future' },
  { index: 11, name: 'Poissons', symbol: '♓', element: 'Eau', modality: 'Mutable', ruler: 'Neptune', color: '#6366f1', accentHex: 0x6366f1, keywords: 'Compassion, rêve, unité cosmique, inspiration' },
];

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const CITY_PRESETS: CityPreset[] = [
  { id: 'paris', name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { id: 'lyon', name: 'Lyon', country: 'France', latitude: 45.764, longitude: 4.8357 },
  { id: 'marseille', name: 'Marseille', country: 'France', latitude: 43.2965, longitude: 5.3698 },
  { id: 'toulouse', name: 'Toulouse', country: 'France', latitude: 43.6047, longitude: 1.4442 },
  { id: 'nice', name: 'Nice', country: 'France', latitude: 43.7102, longitude: 7.262 },
  { id: 'nantes', name: 'Nantes', country: 'France', latitude: 47.2184, longitude: -1.5536 },
  { id: 'bordeaux', name: 'Bordeaux', country: 'France', latitude: 44.8378, longitude: -0.5792 },
  { id: 'lille', name: 'Lille', country: 'France', latitude: 50.6292, longitude: 3.0573 },
  { id: 'strasbourg', name: 'Strasbourg', country: 'France', latitude: 48.5734, longitude: 7.7521 },
  { id: 'bruxelles', name: 'Bruxelles', country: 'Belgique', latitude: 50.8503, longitude: 4.3517 },
  { id: 'geneve', name: 'Genève', country: 'Suisse', latitude: 46.2044, longitude: 6.1432 },
  { id: 'lausanne', name: 'Lausanne', country: 'Suisse', latitude: 46.5197, longitude: 6.6323 },
  { id: 'luxembourg', name: 'Luxembourg', country: 'Luxembourg', latitude: 49.6116, longitude: 6.1319 },
  { id: 'montreal', name: 'Montréal', country: 'Canada', latitude: 45.5017, longitude: -73.5673 },
  { id: 'quebec', name: 'Québec', country: 'Canada', latitude: 46.8139, longitude: -71.208 },
  { id: 'londres', name: 'Londres', country: 'Royaume-Uni', latitude: 51.5072, longitude: -0.1276 },
  { id: 'madrid', name: 'Madrid', country: 'Espagne', latitude: 40.4168, longitude: -3.7038 },
  { id: 'rome', name: 'Rome', country: 'Italie', latitude: 41.9028, longitude: 12.4964 },
  { id: 'lisbonne', name: 'Lisbonne', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
  { id: 'berlin', name: 'Berlin', country: 'Allemagne', latitude: 52.52, longitude: 13.405 },
  { id: 'casablanca', name: 'Casablanca', country: 'Maroc', latitude: 33.5731, longitude: -7.5898 },
  { id: 'alger', name: 'Alger', country: 'Algérie', latitude: 36.7538, longitude: 3.0588 },
  { id: 'tunis', name: 'Tunis', country: 'Tunisie', latitude: 36.8065, longitude: 10.1815 },
  { id: 'dakar', name: 'Dakar', country: 'Sénégal', latitude: 14.7167, longitude: -17.4677 },
  { id: 'abidjan', name: 'Abidjan', country: 'Côte d’Ivoire', latitude: 5.36, longitude: -4.0083 },
  { id: 'antananarivo', name: 'Antananarivo', country: 'Madagascar', latitude: -18.8792, longitude: 47.5079 },
  { id: 'newyork', name: 'New York', country: 'États-Unis', latitude: 40.7128, longitude: -74.006 },
  { id: 'losangeles', name: 'Los Angeles', country: 'États-Unis', latitude: 34.0522, longitude: -118.2437 },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brésil', latitude: -22.9068, longitude: -43.1729 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japon', latitude: 35.6762, longitude: 139.6503 },
  { id: 'pekin', name: 'Pékin', country: 'Chine', latitude: 39.9042, longitude: 116.4074 },
  { id: 'sydney', name: 'Sydney', country: 'Australie', latitude: -33.8688, longitude: 151.2093 },
];

export interface GeocodedPlace {
  name: string;
  latitude: number;
  longitude: number;
}

const FRENCH_DEPT_CAPITALS: Record<string, { city: string; lat: number; lon: number }> = {
  '01': { city: 'Bourg-en-Bresse', lat: 46.2052, lon: 5.2255 },
  '02': { city: 'Laon', lat: 49.5641, lon: 3.6203 },
  '03': { city: 'Moulins', lat: 46.5681, lon: 3.3344 },
  '04': { city: 'Digne-les-Bains', lat: 44.0922, lon: 6.2356 },
  '05': { city: 'Gap', lat: 44.5594, lon: 6.0786 },
  '06': { city: 'Nice', lat: 43.7102, lon: 7.262 },
  '07': { city: 'Privas', lat: 44.7353, lon: 4.5994 },
  '08': { city: 'Charleville-Mézières', lat: 49.7621, lon: 4.7261 },
  '09': { city: 'Foix', lat: 42.965, lon: 1.6069 },
  '10': { city: 'Troyes', lat: 48.2973, lon: 4.0744 },
  '11': { city: 'Carcassonne', lat: 43.213, lon: 2.3491 },
  '12': { city: 'Rodez', lat: 44.3494, lon: 2.5759 },
  '13': { city: 'Marseille', lat: 43.2965, lon: 5.3698 },
  '14': { city: 'Caen', lat: 49.1829, lon: -0.3707 },
  '15': { city: 'Aurillac', lat: 44.9261, lon: 2.4447 },
  '16': { city: 'Angoulême', lat: 45.6484, lon: 0.1562 },
  '17': { city: 'La Rochelle', lat: 46.1603, lon: -1.1511 },
  '18': { city: 'Bourges', lat: 47.081, lon: 2.3988 },
  '19': { city: 'Tulle', lat: 45.2657, lon: 1.7717 },
  '20': { city: 'Ajaccio', lat: 41.9192, lon: 8.7386 },
  '21': { city: 'Dijon', lat: 47.322, lon: 5.0415 },
  '22': { city: 'Saint-Brieuc', lat: 48.5141, lon: -2.7658 },
  '23': { city: 'Guéret', lat: 46.1714, lon: 1.8711 },
  '24': { city: 'Périgueux', lat: 45.1844, lon: 0.7214 },
  '25': { city: 'Besançon', lat: 47.2378, lon: 6.0241 },
  '26': { city: 'Valence', lat: 44.9334, lon: 4.8924 },
  '27': { city: 'Évreux', lat: 49.027, lon: 1.1514 },
  '28': { city: 'Chartres', lat: 48.4439, lon: 1.489 },
  '29': { city: 'Quimper', lat: 47.9975, lon: -4.0979 },
  '30': { city: 'Nîmes', lat: 43.8367, lon: 4.3601 },
  '31': { city: 'Toulouse', lat: 43.6047, lon: 1.4442 },
  '32': { city: 'Auch', lat: 43.6464, lon: 0.5867 },
  '33': { city: 'Bordeaux', lat: 44.8378, lon: -0.5792 },
  '34': { city: 'Montpellier', lat: 43.6108, lon: 3.8767 },
  '35': { city: 'Rennes', lat: 48.1173, lon: -1.6778 },
  '36': { city: 'Châteauroux', lat: 46.8114, lon: 1.6868 },
  '37': { city: 'Tours', lat: 47.3941, lon: 0.6848 },
  '38': { city: 'Grenoble', lat: 45.1885, lon: 5.7245 },
  '39': { city: 'Lons-le-Saunier', lat: 46.6746, lon: 5.5546 },
  '40': { city: 'Mont-de-Marsan', lat: 43.8906, lon: -0.5008 },
  '41': { city: 'Blois', lat: 47.5861, lon: 1.3359 },
  '42': { city: 'Saint-Étienne', lat: 45.4397, lon: 4.3872 },
  '43': { city: 'Le Puy-en-Velay', lat: 45.0428, lon: 3.8829 },
  '44': { city: 'Nantes', lat: 47.2184, lon: -1.5536 },
  '45': { city: 'Orléans', lat: 47.903, lon: 1.9093 },
  '46': { city: 'Cahors', lat: 44.4475, lon: 1.4419 },
  '47': { city: 'Agen', lat: 44.2031, lon: 0.6164 },
  '48': { city: 'Mende', lat: 44.5186, lon: 3.5019 },
  '49': { city: 'Angers', lat: 47.4784, lon: -0.5632 },
  '50': { city: 'Saint-Lô', lat: 49.1149, lon: -1.0906 },
  '51': { city: 'Châlons-en-Champagne', lat: 48.9567, lon: 4.3631 },
  '52': { city: 'Chaumont', lat: 48.1117, lon: 5.1394 },
  '53': { city: 'Laval', lat: 48.07, lon: -0.77 },
  '54': { city: 'Nancy', lat: 48.6921, lon: 6.1844 },
  '55': { city: 'Bar-le-Duc', lat: 48.7736, lon: 5.1611 },
  '56': { city: 'Vannes', lat: 47.6582, lon: -2.7608 },
  '57': { city: 'Metz', lat: 49.1193, lon: 6.1757 },
  '58': { city: 'Nevers', lat: 46.9896, lon: 3.159 },
  '59': { city: 'Lille', lat: 50.6292, lon: 3.0573 },
  '60': { city: 'Beauvais', lat: 49.4295, lon: 2.0807 },
  '61': { city: 'Alençon', lat: 48.4328, lon: 0.0912 },
  '62': { city: 'Arras', lat: 50.291, lon: 2.7775 },
  '63': { city: 'Clermont-Ferrand', lat: 45.7772, lon: 3.087 },
  '64': { city: 'Pau', lat: 43.2951, lon: -0.3708 },
  '65': { city: 'Tarbes', lat: 43.2329, lon: 0.0781 },
  '66': { city: 'Perpignan', lat: 42.6887, lon: 2.8948 },
  '67': { city: 'Strasbourg', lat: 48.5734, lon: 7.7521 },
  '68': { city: 'Colmar', lat: 48.0794, lon: 7.3585 },
  '69': { city: 'Lyon', lat: 45.764, lon: 4.8357 },
  '70': { city: 'Vesoul', lat: 47.6197, lon: 6.1544 },
  '71': { city: 'Mâcon', lat: 46.3069, lon: 4.8287 },
  '72': { city: 'Le Mans', lat: 48.0061, lon: 0.1996 },
  '73': { city: 'Chambéry', lat: 45.5646, lon: 5.9178 },
  '74': { city: 'Annecy', lat: 45.8992, lon: 6.1294 },
  '75': { city: 'Paris', lat: 48.8566, lon: 2.3522 },
  '76': { city: 'Rouen', lat: 49.4432, lon: 1.0999 },
  '77': { city: 'Melun', lat: 48.5396, lon: 2.6608 },
  '78': { city: 'Versailles', lat: 48.8049, lon: 2.1204 },
  '79': { city: 'Niort', lat: 46.3237, lon: -0.4648 },
  '80': { city: 'Amiens', lat: 49.8941, lon: 2.2958 },
  '81': { city: 'Albi', lat: 43.9251, lon: 2.148 },
  '82': { city: 'Montauban', lat: 44.0176, lon: 1.355 },
  '83': { city: 'Toulon', lat: 43.1242, lon: 5.928 },
  '84': { city: 'Avignon', lat: 43.9493, lon: 4.8055 },
  '85': { city: 'La Roche-sur-Yon', lat: 46.6705, lon: -1.4264 },
  '86': { city: 'Poitiers', lat: 46.5802, lon: 0.3404 },
  '87': { city: 'Limoges', lat: 45.8336, lon: 1.2611 },
  '88': { city: 'Épinal', lat: 48.1724, lon: 6.4494 },
  '89': { city: 'Auxerre', lat: 47.7982, lon: 3.5738 },
  '90': { city: 'Belfort', lat: 47.64, lon: 6.8628 },
  '91': { city: 'Évry-Courcouronnes', lat: 48.6298, lon: 2.4418 },
  '92': { city: 'Nanterre', lat: 48.8924, lon: 2.2153 },
  '93': { city: 'Bobigny', lat: 48.9086, lon: 2.4397 },
  '94': { city: 'Créteil', lat: 48.7904, lon: 2.4556 },
  '95': { city: 'Cergy', lat: 49.0365, lon: 2.063 },
  '971': { city: 'Pointe-à-Pitre', lat: 16.2413, lon: -61.5361 },
  '972': { city: 'Fort-de-France', lat: 14.6161, lon: -61.0588 },
  '973': { city: 'Cayenne', lat: 4.9224, lon: -52.3135 },
  '974': { city: 'Saint-Denis (La Réunion)', lat: -20.8823, lon: 55.4504 },
  '976': { city: 'Mamoudzou', lat: -12.7806, lon: 45.2279 },
};

export async function searchPlacesByQuery(query: string): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();

  // 1. Detect French 5-digit postal code (e.g., 75008, 69002, 33000, 97400)
  const cpMatch = trimmed.match(/\b(\d{5})\b/);
  if (cpMatch) {
    const postalCode = cpMatch[1];
    // Official French Government Communes API (geo.api.gouv.fr)
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(postalCode)}&fields=nom,centre,population&format=json`
      );
      if (res.ok) {
        const communes = (await res.json()) as Array<{
          nom?: string;
          population?: number;
          centre?: { coordinates?: [number, number] };
        }>;
        if (Array.isArray(communes) && communes.length > 0) {
          const sorted = [...communes].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
          const mapped = sorted
            .filter((c) => c.nom && Array.isArray(c.centre?.coordinates))
            .slice(0, 8)
            .map((c) => ({
              name: `${c.nom} (${postalCode}, France)`,
              latitude: Number(c.centre!.coordinates![1].toFixed(4)),
              longitude: Number(c.centre!.coordinates![0].toFixed(4)),
            }));
          if (mapped.length > 0) return mapped;
        }
      }
    } catch {
      // Fallback to Nominatim or offline map
    }

    // Secondary online lookup via OpenStreetMap Nominatim restricted to France postal code
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=fr&postalcode=${encodeURIComponent(postalCode)}&countrycodes=fr`
      );
      if (res.ok) {
        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data
            .map((d) => {
              const lat = Number(d.lat);
              const lon = Number(d.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
              const cityLabel = (d.display_name ?? postalCode).split(',')[0].trim();
              return {
                name: `${cityLabel} (${postalCode}, France)`,
                latitude: Number(lat.toFixed(4)),
                longitude: Number(lon.toFixed(4)),
              };
            })
            .filter((x): x is GeocodedPlace => x !== null);
          if (mapped.length > 0) return mapped;
        }
      }
    } catch {
      // Fallback to offline department coordinates
    }

    // Offline French department fallback for all 01-95 & 971-976 postal codes
    const domPrefix = postalCode.startsWith('97') ? postalCode.slice(0, 3) : postalCode.slice(0, 2);
    const dept = FRENCH_DEPT_CAPITALS[domPrefix];
    if (dept) {
      return [
        {
          name: `${dept.city} (${postalCode}, France)`,
          latitude: dept.lat,
          longitude: dept.lon,
        },
      ];
    }
  }

  // 2. Local City / Country Presets match
  const localMatches = CITY_PRESETS.filter(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.country.toLowerCase() === lower ||
      `${c.name}, ${c.country}`.toLowerCase() === lower ||
      c.name.toLowerCase().includes(lower)
  );
  if (localMatches.length > 0) {
    return localMatches.slice(0, 5).map((local) => ({
      name: `${local.name} (${local.country})`,
      latitude: local.latitude,
      longitude: local.longitude,
    }));
  }

  // 3. Worldwide search via Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=fr&q=${encodeURIComponent(trimmed)}`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;
    if (!Array.isArray(data) || data.length === 0) return [];
    return data
      .map((item) => {
        const lat = Number(item.lat);
        const lon = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        const shortName = (item.display_name ?? trimmed).split(',').slice(0, 2).join(',').trim();
        return {
          name: shortName || trimmed,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4)),
        };
      })
      .filter((x): x is GeocodedPlace => x !== null);
  } catch {
    return [];
  }
}

export async function geocodeCityOrCountry(
  query: string
): Promise<GeocodedPlace | null> {
  const results = await searchPlacesByQuery(query);
  return results[0] ?? null;
}

export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'northNode';

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  symbol: string;
  longitude: number; // 0..360°
  latitude: number;
  speedDegPerDay: number;
  retrograde: boolean;
  sign: ZodiacSign;
  degInSign: number;
  minutesInSign: number;
  formattedDeg: string;
  house: number; // 1..12
  orbitRadius: number;
  visualRadius: number;
  colorHex: number;
  role: string;
  signMeaning: string;
}

export interface HouseCusp {
  house: number; // 1..12
  roman: string;
  longitude: number; // 0..360°
  sign: ZodiacSign;
  degInSign: number;
  formattedDeg: string;
  title: string;
  meaning: string;
}

export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export interface AspectInfo {
  id: string;
  planetA: PlanetId;
  planetB: PlanetId;
  planetAName: string;
  planetBName: string;
  planetASymbol: string;
  planetBSymbol: string;
  type: AspectType;
  label: string;
  symbol: string;
  exactAngle: number;
  orb: number;
  harmony: 'harmonious' | 'tense' | 'fusion';
  colorHex: number;
  cssColor: string;
  interpretation: string;
}

export type ChartMode =
  | 'natal'
  | 'transits'
  | 'solarReturn'
  | 'lunarReturn'
  | 'progressions'
  | 'synastry'
  | 'composite'
  | 'comparative'
  | 'live';

export interface NatalProfile {
  id: string;
  name: string;
  birthDateIso: string; // YYYY-MM-DDTHH:mm
  cityId: string;
  customCityName?: string;
  customLat?: number;
  customLon?: number;
  houseSystem: HouseSystem;
}

export interface ComparisonAspectInfo {
  id: string;
  outerPlanet: PlanetId;
  natalPlanet: PlanetId;
  outerPlanetName: string;
  natalPlanetName: string;
  outerSymbol: string;
  natalSymbol: string;
  type: AspectType;
  label: string;
  symbol: string;
  exactAngle: number;
  orb: number;
  harmony: 'harmonious' | 'tense' | 'fusion';
  colorHex: number;
  cssColor: string;
  interpretation: string;
}

export interface AstroChart {
  date: Date;
  latitude: number;
  longitude: number;
  cityName: string;
  houseSystem: HouseSystem;
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
  ascSign: ZodiacSign;
  mcSign: ZodiacSign;
  siderealTimeHours: number;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: AspectInfo[];
  elements: Record<ElementType, number>;
  modalities: Record<ModalityType, number>;
}

const HOUSE_DESCRIPTIONS: Array<{ roman: string; title: string; meaning: string }> = [
  { roman: 'I', title: 'Ascendant · Le Moi', meaning: 'Vitalité première, tempérament spontané, regard porté sur le monde.' },
  { roman: 'II', title: 'Ressources · Valeurs', meaning: 'Rapport à la matière, sécurité intérieure, talents acquis et estime de soi.' },
  { roman: 'III', title: 'Esprit · Échanges', meaning: 'Pensée concrète, apprentissages, fratrie, déplacements et parole.' },
  { roman: 'IV', title: 'Fond du Ciel · Racines', meaning: 'Foyer intime, héritage familial, mémoire profonde et refuge.' },
  { roman: 'V', title: 'Création · Joie', meaning: 'Expression artistique, élans du cœur, jeu et rayonnement personnel.' },
  { roman: 'VI', title: 'Service · Rythme', meaning: 'Quotidien, art de faire, hygiène de vie, précision et dévouement.' },
  { roman: 'VII', title: 'Descendant · L’Autre', meaning: 'Alliances, miroir relationnel, partenariats et quête d’équilibre.' },
  { roman: 'VIII', title: 'Transformation · Mystère', meaning: 'Mues profondes, ressources partagées, lucidité et renaissance.' },
  { roman: 'IX', title: 'Horizons · Sagesse', meaning: 'Philosophie, voyages lointains, quête spirituelle et grands idéaux.' },
  { roman: 'X', title: 'Milieu du Ciel · Vocation', meaning: 'Accomplissement social, œuvre publique, autorité et destinée.' },
  { roman: 'XI', title: 'Fraternité · Projets', meaning: 'Amitiés électives, idéaux collectifs, réseaux et vision d’avenir.' },
  { roman: 'XII', title: 'Transcendance · Retrait', meaning: 'Inconscient, vie intérieure, songes, dissolution et compassion.' },
];

const PLANET_META: Array<{
  id: PlanetId;
  body?: Astronomy.Body;
  name: string;
  symbol: string;
  orbitRadius: number;
  visualRadius: number;
  colorHex: number;
  role: string;
}> = [
  { id: 'sun', body: Astronomy.Body.Sun, name: 'Soleil', symbol: '☉', orbitRadius: 2.35, visualRadius: 0.44, colorHex: 0xffc857, role: 'Identité consciente, élan créateur, cœur de la vitalité' },
  { id: 'moon', body: Astronomy.Body.Moon, name: 'Lune', symbol: '☽', orbitRadius: 3.15, visualRadius: 0.24, colorHex: 0xe2e8f0, role: 'Sensibilité instinctive, mémoire émotionnelle, besoins intimes' },
  { id: 'mercury', body: Astronomy.Body.Mercury, name: 'Mercure', symbol: '☿', orbitRadius: 3.85, visualRadius: 0.18, colorHex: 0xcbd5e1, role: 'Intellect, langage, perception analytique et liens rapides' },
  { id: 'venus', body: Astronomy.Body.Venus, name: 'Vénus', symbol: '♀', orbitRadius: 4.55, visualRadius: 0.26, colorHex: 0xf4b6c2, role: 'Désir d’harmonie, sens esthétique, attraction et valeurs' },
  { id: 'mars', body: Astronomy.Body.Mars, name: 'Mars', symbol: '♂', orbitRadius: 5.25, visualRadius: 0.23, colorHex: 0xe05d44, role: 'Volonté d’action, courage, affirmation et énergie motrice' },
  { id: 'jupiter', body: Astronomy.Body.Jupiter, name: 'Jupiter', symbol: '♃', orbitRadius: 6.1, visualRadius: 0.38, colorHex: 0xd9a066, role: 'Expansion, confiance, sens moral et ouverture aux horizons' },
  { id: 'saturn', body: Astronomy.Body.Saturn, name: 'Saturne', symbol: '♄', orbitRadius: 7.05, visualRadius: 0.34, colorHex: 0xd4be8d, role: 'Structure, maturité, patience, limites et persévérance' },
  { id: 'uranus', body: Astronomy.Body.Uranus, name: 'Uranus', symbol: '♅', orbitRadius: 7.9, visualRadius: 0.27, colorHex: 0x67e8f9, role: 'Éveil soudain, originalité, rupture féconde et liberté' },
  { id: 'neptune', body: Astronomy.Body.Neptune, name: 'Neptune', symbol: '♆', orbitRadius: 8.65, visualRadius: 0.27, colorHex: 0x60a5fa, role: 'Imaginaire, spiritualité, empathie et dissolution des frontières' },
  { id: 'pluto', body: Astronomy.Body.Pluto, name: 'Pluton', symbol: '♇', orbitRadius: 9.35, visualRadius: 0.20, colorHex: 0xb991c7, role: 'Puissance souterraine, crise initiatique et régénération' },
  { id: 'northNode', name: 'Nœud Nord', symbol: '☊', orbitRadius: 9.95, visualRadius: 0.17, colorHex: 0xa78bfa, role: 'Direction évolutive, appel de croissance et territoire à explorer' },
];

const ASPECT_DEFINITIONS: Array<{
  type: AspectType;
  angle: number;
  maxOrb: number;
  label: string;
  symbol: string;
  harmony: 'harmonious' | 'tense' | 'fusion';
  colorHex: number;
  cssColor: string;
  desc: string;
}> = [
  { type: 'conjunction', angle: 0, maxOrb: 8, label: 'Conjonction', symbol: '☌', harmony: 'fusion', colorHex: 0xfbbf24, cssColor: '#fbbf24', desc: 'Fusion directe des deux principes planétaires en un même foyer.' },
  { type: 'sextile', angle: 60, maxOrb: 5, label: 'Sextile', symbol: '⚹', harmony: 'harmonious', colorHex: 0x38bdf8, cssColor: '#38bdf8', desc: 'Opportunité créative et dialogue fluide demandant une mise en mouvement.' },
  { type: 'square', angle: 90, maxOrb: 7, label: 'Carré', symbol: '□', harmony: 'tense', colorHex: 0xf43f5e, cssColor: '#f43f5e', desc: 'Friction dynamique qui pousse à l’action, au dépassement et au choix.' },
  { type: 'trine', angle: 120, maxOrb: 7, label: 'Trigone', symbol: '△', harmony: 'harmonious', colorHex: 0x34d399, cssColor: '#34d399', desc: 'Circulation naturelle, talent inné et résonance élémentaire harmonieuse.' },
  { type: 'opposition', angle: 180, maxOrb: 8, label: 'Opposition', symbol: '☍', harmony: 'tense', colorHex: 0xf97316, cssColor: '#f97316', desc: 'Polarité consciente invitant à concilier deux forces complémentaires.' },
];

export function normalizeDeg(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function formatDegreeInSign(longitude: number): {
  sign: ZodiacSign;
  degInSign: number;
  minutesInSign: number;
  formattedDeg: string;
} {
  const norm = normalizeDeg(longitude);
  const signIndex = Math.floor(norm / 30) % 12;
  const within = norm - signIndex * 30;
  let deg = Math.floor(within);
  let min = Math.round((within - deg) * 60);
  if (min === 60) {
    min = 0;
    deg += 1;
  }
  if (deg >= 30) {
    deg = 29;
    min = 59;
  }
  const sign = ZODIAC_SIGNS[signIndex];
  const formattedDeg = `${String(deg).padStart(2, '0')}°${String(min).padStart(2, '0')}′`;
  return { sign, degInSign: deg, minutesInSign: min, formattedDeg };
}

function computeNorthNodeLongitude(date: Date): number {
  const astroTime = Astronomy.MakeTime(date);
  const T = astroTime.tt / 36525.0; // Julian centuries since J2000.0
  const omega =
    125.04455501 -
    1934.1361849 * T +
    0.0020762 * T * T +
    (T * T * T) / 467410 -
    (T * T * T * T) / 60616000;
  return normalizeDeg(omega);
}

function getBodyEcliptic(id: PlanetId, body: Astronomy.Body | undefined, date: Date): { lon: number; lat: number } {
  if (id === 'northNode') {
    return { lon: computeNorthNodeLongitude(date), lat: 0 };
  }
  if (id === 'sun') {
    const pos = Astronomy.SunPosition(date);
    return { lon: normalizeDeg(pos.elon), lat: pos.elat };
  }
  if (id === 'moon') {
    const pos = Astronomy.EclipticGeoMoon(date);
    return { lon: normalizeDeg(pos.lon), lat: pos.lat };
  }
  if (!body) return { lon: 0, lat: 0 };
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  return { lon: normalizeDeg(ecl.elon), lat: ecl.elat };
}

function computeAngles(date: Date, latitudeDeg: number, longitudeDeg: number): {
  ascendant: number;
  midheaven: number;
  ramcDeg: number;
  epsDeg: number;
  lstHours: number;
} {
  const gstHours = Astronomy.SiderealTime(date);
  const lstHours = ((gstHours + longitudeDeg / 15.0) % 24 + 24) % 24;
  const ramcDeg = lstHours * 15.0;
  const astroTime = Astronomy.MakeTime(date);
  const T = astroTime.tt / 36525.0;
  // Mean obliquity of the ecliptic (arcseconds -> degrees)
  const epsDeg = 23.43929111 - (46.815 * T) / 3600.0;

  const ramc = degToRad(ramcDeg);
  const eps = degToRad(epsDeg);
  const lat = degToRad(Math.max(-66, Math.min(66, latitudeDeg)));

  // Midheaven (MC)
  const mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
  const midheaven = normalizeDeg(radToDeg(mcRad));

  // Ascendant (ASC)
  const ascY = Math.cos(ramc);
  const ascX = -(Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(ramc));
  const ascendant = normalizeDeg(radToDeg(Math.atan2(ascY, ascX)));

  return { ascendant, midheaven, ramcDeg, epsDeg, lstHours };
}

function computePlacidusCusp(
  houseNum: number,
  ramcDeg: number,
  epsDeg: number,
  latDeg: number,
  asc: number,
  mc: number
): number {
  const lat = degToRad(Math.max(-65, Math.min(65, latDeg)));
  const eps = degToRad(epsDeg);

  // Houses 11, 12, 2, 3 via iterative Placidus semi-arc method
  const fMap: Record<number, { offset: number; f: number; nocturnal: boolean }> = {
    11: { offset: 30, f: 1 / 3, nocturnal: false },
    12: { offset: 60, f: 2 / 3, nocturnal: false },
    2: { offset: 120, f: 2 / 3, nocturnal: true },
    3: { offset: 150, f: 1 / 3, nocturnal: true },
  };

  if (houseNum === 1) return asc;
  if (houseNum === 10) return mc;
  if (houseNum === 7) return normalizeDeg(asc + 180);
  if (houseNum === 4) return normalizeDeg(mc + 180);

  const cfg = fMap[houseNum];
  if (!cfg) return asc;

  let ra = normalizeDeg(ramcDeg + cfg.offset);
  for (let i = 0; i < 16; i++) {
    const raRad = degToRad(ra);
    const sinDecl = Math.sin(eps) * Math.sin(raRad);
    const decl = Math.asin(Math.max(-0.999, Math.min(0.999, sinDecl)));
    const adVal = Math.max(-0.999, Math.min(0.999, Math.tan(lat) * Math.tan(decl)));
    const ad = Math.asin(adVal); // Ascensional difference
    const dsa = Math.PI / 2 + ad; // Diurnal semi-arc
    const nsa = Math.PI / 2 - ad; // Nocturnal semi-arc
    if (!cfg.nocturnal) {
      ra = normalizeDeg(ramcDeg + cfg.f * radToDeg(dsa));
    } else {
      ra = normalizeDeg(ramcDeg + 180 - cfg.f * radToDeg(nsa));
    }
  }

  const raRad = degToRad(ra);
  const lon = normalizeDeg(radToDeg(Math.atan2(Math.sin(raRad), Math.cos(raRad) * Math.cos(eps))));
  return lon;
}

function computeHouses(
  system: HouseSystem,
  asc: number,
  mc: number,
  ramcDeg: number,
  epsDeg: number,
  latDeg: number
): HouseCusp[] {
  const cusps = new Array<number>(12);
  if (system === 'equal') {
    for (let i = 0; i < 12; i++) {
      cusps[i] = normalizeDeg(asc + i * 30);
    }
  } else if (system === 'wholesign') {
    const ascSignStart = Math.floor(normalizeDeg(asc) / 30) * 30;
    for (let i = 0; i < 12; i++) {
      cusps[i] = normalizeDeg(ascSignStart + i * 30);
    }
  } else {
    cusps[0] = asc;
    cusps[9] = mc;
    cusps[6] = normalizeDeg(asc + 180);
    cusps[3] = normalizeDeg(mc + 180);
    cusps[10] = computePlacidusCusp(11, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[11] = computePlacidusCusp(12, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[1] = computePlacidusCusp(2, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[2] = computePlacidusCusp(3, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[4] = normalizeDeg(cusps[10] + 180);
    cusps[5] = normalizeDeg(cusps[11] + 180);
    cusps[7] = normalizeDeg(cusps[1] + 180);
    cusps[8] = normalizeDeg(cusps[2] + 180);
  }

  return cusps.map((lon, idx) => {
    const fmt = formatDegreeInSign(lon);
    const meta = HOUSE_DESCRIPTIONS[idx];
    return {
      house: idx + 1,
      roman: meta.roman,
      longitude: lon,
      sign: fmt.sign,
      degInSign: fmt.degInSign,
      formattedDeg: fmt.formattedDeg,
      title: meta.title,
      meaning: meta.meaning,
    };
  });
}

export function findHouseForLongitude(lon: number, cusps: HouseCusp[]): number {
  const target = normalizeDeg(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i].longitude;
    const end = cusps[(i + 1) % 12].longitude;
    const span = normalizeDeg(end - start);
    const dist = normalizeDeg(target - start);
    if (dist < span) {
      return i + 1;
    }
  }
  return 1;
}

export function calculateAstroChart(
  date: Date,
  latitude: number,
  longitude: number,
  cityName: string,
  houseSystem: HouseSystem = 'placidus'
): AstroChart {
  const { ascendant, midheaven, ramcDeg, epsDeg, lstHours } = computeAngles(date, latitude, longitude);
  const houses = computeHouses(houseSystem, ascendant, midheaven, ramcDeg, epsDeg, latitude);
  const nextHour = new Date(date.getTime() + 3600 * 1000);

  const elements: Record<ElementType, number> = { Feu: 0, Terre: 0, Air: 0, Eau: 0 };
  const modalities: Record<ModalityType, number> = { Cardinal: 0, Fixe: 0, Mutable: 0 };

  const planets: PlanetPosition[] = PLANET_META.map((meta) => {
    const nowPos = getBodyEcliptic(meta.id, meta.body, date);
    const laterPos = getBodyEcliptic(meta.id, meta.body, nextHour);

    let diff = laterPos.lon - nowPos.lon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const speedDegPerDay = diff * 24;
    const retrograde = meta.id !== 'sun' && meta.id !== 'moon' && speedDegPerDay < 0;

    const fmt = formatDegreeInSign(nowPos.lon);
    const house = findHouseForLongitude(nowPos.lon, houses);

    if (meta.id !== 'northNode') {
      const weight = meta.id === 'sun' || meta.id === 'moon' ? 2 : 1;
      elements[fmt.sign.element] += weight;
      modalities[fmt.sign.modality] += weight;
    }

    const planetObj: PlanetPosition = {
      id: meta.id,
      name: meta.name,
      symbol: meta.symbol,
      longitude: nowPos.lon,
      latitude: nowPos.lat,
      speedDegPerDay,
      retrograde,
      sign: fmt.sign,
      degInSign: fmt.degInSign,
      minutesInSign: fmt.minutesInSign,
      formattedDeg: fmt.formattedDeg,
      house,
      orbitRadius: meta.orbitRadius,
      visualRadius: meta.visualRadius,
      colorHex: meta.colorHex,
      role: meta.role,
      signMeaning: '',
    };
    planetObj.signMeaning = getPlanetSignDeepMeaning(planetObj, houses);
    return planetObj;
  });

  // Compute aspects between main bodies (excluding northNode-to-outer clutter or keep all except northNode-node)
  const aspects: AspectInfo[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pA = planets[i];
      const pB = planets[j];
      const rawDiff = Math.abs(pA.longitude - pB.longitude);
      const sep = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      for (const asp of ASPECT_DEFINITIONS) {
        const orb = Math.abs(sep - asp.angle);
        const orbLimit = pA.id === 'sun' || pA.id === 'moon' || pB.id === 'sun' || pB.id === 'moon'
          ? asp.maxOrb
          : Math.max(3, asp.maxOrb - 1.5);
        if (orb <= orbLimit) {
          aspects.push({
            id: `${pA.id}-${pB.id}-${asp.type}`,
            planetA: pA.id,
            planetB: pB.id,
            planetAName: pA.name,
            planetBName: pB.name,
            planetASymbol: pA.symbol,
            planetBSymbol: pB.symbol,
            type: asp.type,
            label: asp.label,
            symbol: asp.symbol,
            exactAngle: asp.angle,
            orb: Number(orb.toFixed(2)),
            harmony: asp.harmony,
            colorHex: asp.colorHex,
            cssColor: asp.cssColor,
            interpretation: buildDetailedAspectInterpretation(
              pA.id,
              pA.name,
              pB.id,
              pB.name,
              asp.type,
              asp.symbol,
              orb
            ),
          });
          break;
        }
      }
    }
  }

  aspects.sort((a, b) => a.orb - b.orb);

  return {
    date,
    latitude,
    longitude,
    cityName,
    houseSystem,
    ascendant,
    midheaven,
    descendant: normalizeDeg(ascendant + 180),
    imumCoeli: normalizeDeg(midheaven + 180),
    ascSign: formatDegreeInSign(ascendant).sign,
    mcSign: formatDegreeInSign(midheaven).sign,
    siderealTimeHours: lstHours,
    planets,
    houses,
    aspects,
    elements,
    modalities,
  };
}

export interface ChartPreset {
  id: string;
  label: string;
  dateIso: string;
  cityId: string;
}

export const CHART_PRESETS: ChartPreset[] = [
  { id: 'now', label: 'Ciel en direct', dateIso: '', cityId: 'paris' },
  { id: 'vernal', label: 'Équinoxe de Printemps 2026', dateIso: '2026-03-20T14:46:00Z', cityId: 'paris' },
  { id: 'solstice', label: 'Solstice d’Été 2026', dateIso: '2026-06-21T08:24:00Z', cityId: 'lyon' },
  { id: 'conj2020', label: 'Grande Conjonction 2020', dateIso: '2020-12-21T18:20:00Z', cityId: 'paris' },
];

export const DEFAULT_NATAL_PROFILES: NatalProfile[] = [];

/**
 * Finds the exact astronomical Date in `targetYear` when the Sun returns to `natalSunLon`
 * (to sub-second accuracy using iterative signed angular error refinement).
 */
export function calculateSolarReturnDate(
  natalSunLon: number,
  birthDate: Date,
  targetYear: number
): Date {
  // Initial estimate: birthday in targetYear
  const approx = new Date(
    Date.UTC(
      targetYear,
      birthDate.getUTCMonth(),
      birthDate.getUTCDate(),
      birthDate.getUTCHours(),
      birthDate.getUTCMinutes(),
      0
    )
  );

  let tMs = approx.getTime();
  // Sun moves ~0.9856° / day -> ~4.107e-2 deg/hr -> ~1.14e-5 deg/sec
  for (let i = 0; i < 12; i++) {
    const sunLon = normalizeDeg(Astronomy.SunPosition(new Date(tMs)).elon);
    let err = natalSunLon - sunLon;
    if (err > 180) err -= 360;
    if (err < -180) err += 360;
    if (Math.abs(err) < 0.00001) break;
    // Mean solar motion ~0.985647 deg/day
    const deltaDays = err / 0.98564736;
    tMs += deltaDays * 86400 * 1000;
  }
  return new Date(tMs);
}

export type OuterRoleLabel = 'Transit' | 'Rév. Solaire' | 'Rév. Lunaire' | 'Progressé' | 'Synastrie' | 'Comparé';

/**
 * Finds the exact astronomical Date near `referenceDate` when the Moon returns to `natalMoonLon`
 * (sidereal/tropical month ~27.32158 days).
 */
export function calculateLunarReturnDate(natalMoonLon: number, referenceDate: Date): Date {
  // Scan around referenceDate (-14d..+14d) in 12h steps to locate the closest crossing, then refine
  let bestMs = referenceDate.getTime();
  let bestAbsErr = 999;
  const startMs = referenceDate.getTime() - 14 * 86400 * 1000;
  for (let h = 0; h <= 28 * 2; h++) {
    const tMs = startMs + h * 12 * 3600 * 1000;
    const moonLon = normalizeDeg(Astronomy.EclipticGeoMoon(new Date(tMs)).lon);
    let err = natalMoonLon - moonLon;
    if (err > 180) err -= 360;
    if (err < -180) err += 360;
    if (Math.abs(err) < bestAbsErr) {
      bestAbsErr = Math.abs(err);
      bestMs = tMs;
    }
  }

  let tMs = bestMs;
  // Mean lunar motion ~13.176358 deg/day
  for (let i = 0; i < 14; i++) {
    const moonLon = normalizeDeg(Astronomy.EclipticGeoMoon(new Date(tMs)).lon);
    let err = natalMoonLon - moonLon;
    if (err > 180) err -= 360;
    if (err < -180) err += 360;
    if (Math.abs(err) < 0.00005) break;
    const deltaDays = err / 13.176358;
    tMs += deltaDays * 86400 * 1000;
  }
  return new Date(tMs);
}

/**
 * Secondary Progressions ("1 day for 1 year"):
 * Computes the symbolic progressed ephemeris date for `targetDate` relative to `birthDate`.
 */
export function calculateSecondaryProgressionDate(birthDate: Date, targetDate: Date): Date {
  const ageYears = (targetDate.getTime() - birthDate.getTime()) / (365.242199 * 86400 * 1000);
  return new Date(birthDate.getTime() + ageYears * 86400 * 1000);
}

function shortestMidpointDeg(a: number, b: number): number {
  const normA = normalizeDeg(a);
  const normB = normalizeDeg(b);
  let diff = normB - normA;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return normalizeDeg(normA + diff * 0.5);
}

/**
 * Midpoint Composite Chart between two natal charts (Chart A & Chart B).
 */
export function calculateCompositeChart(
  chartA: AstroChart,
  chartB: AstroChart,
  label: string
): AstroChart {
  const ascendant = shortestMidpointDeg(chartA.ascendant, chartB.ascendant);
  const midheaven = shortestMidpointDeg(chartA.midheaven, chartB.midheaven);
  const descendant = normalizeDeg(ascendant + 180);
  const imumCoeli = normalizeDeg(midheaven + 180);

  // Equal houses from composite Ascendant (standard Davidson/Midpoint composite practice)
  const houses: HouseCusp[] = Array.from({ length: 12 }, (_, idx) => {
    const lon = normalizeDeg(ascendant + idx * 30);
    const fmt = formatDegreeInSign(lon);
    const meta = HOUSE_DESCRIPTIONS[idx];
    return {
      house: idx + 1,
      roman: meta.roman,
      longitude: lon,
      sign: fmt.sign,
      degInSign: fmt.degInSign,
      formattedDeg: fmt.formattedDeg,
      title: meta.title,
      meaning: meta.meaning,
    };
  });

  const elements: Record<ElementType, number> = { Feu: 0, Terre: 0, Air: 0, Eau: 0 };
  const modalities: Record<ModalityType, number> = { Cardinal: 0, Fixe: 0, Mutable: 0 };

  const planets: PlanetPosition[] = chartA.planets.map((pA, idx) => {
    const pB = chartB.planets[idx] ?? pA;
    const lon = shortestMidpointDeg(pA.longitude, pB.longitude);
    const lat = (pA.latitude + pB.latitude) * 0.5;
    const fmt = formatDegreeInSign(lon);
    const house = findHouseForLongitude(lon, houses);

    if (pA.id !== 'northNode') {
      const weight = pA.id === 'sun' || pA.id === 'moon' ? 2 : 1;
      elements[fmt.sign.element] += weight;
      modalities[fmt.sign.modality] += weight;
    }

    return {
      ...pA,
      longitude: lon,
      latitude: lat,
      retrograde: false,
      sign: fmt.sign,
      degInSign: fmt.degInSign,
      minutesInSign: fmt.minutesInSign,
      formattedDeg: fmt.formattedDeg,
      house,
      signMeaning: `${pA.name} composite en ${fmt.sign.name} (Maison ${houses[house - 1].roman}) exprime la dynamique commune de ${fmt.sign.keywords.toLowerCase()}.`,
    };
  });

  const aspects: AspectInfo[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pA = planets[i];
      const pB = planets[j];
      const rawDiff = Math.abs(pA.longitude - pB.longitude);
      const sep = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      for (const asp of ASPECT_DEFINITIONS) {
        const orb = Math.abs(sep - asp.angle);
        const orbLimit =
          pA.id === 'sun' || pA.id === 'moon' || pB.id === 'sun' || pB.id === 'moon'
            ? asp.maxOrb
            : Math.max(3, asp.maxOrb - 1.5);
        if (orb <= orbLimit) {
          aspects.push({
            id: `comp-${pA.id}-${pB.id}-${asp.type}`,
            planetA: pA.id,
            planetB: pB.id,
            planetAName: pA.name,
            planetBName: pB.name,
            planetASymbol: pA.symbol,
            planetBSymbol: pB.symbol,
            type: asp.type,
            label: asp.label,
            symbol: asp.symbol,
            exactAngle: asp.angle,
            orb: Number(orb.toFixed(2)),
            harmony: asp.harmony,
            colorHex: asp.colorHex,
            cssColor: asp.cssColor,
            interpretation: buildDetailedAspectInterpretation(
              pA.id,
              pA.name,
              pB.id,
              pB.name,
              asp.type,
              asp.symbol,
              orb,
              `${pA.name} ${asp.symbol} ${pB.name} composite`
            ),
          });
          break;
        }
      }
    }
  }
  aspects.sort((a, b) => a.orb - b.orb);

  return {
    date: chartA.date,
    latitude: (chartA.latitude + chartB.latitude) * 0.5,
    longitude: (chartA.longitude + chartB.longitude) * 0.5,
    cityName: label,
    houseSystem: 'equal',
    ascendant,
    midheaven,
    descendant,
    imumCoeli,
    ascSign: formatDegreeInSign(ascendant).sign,
    mcSign: formatDegreeInSign(midheaven).sign,
    siderealTimeHours: chartA.siderealTimeHours,
    planets,
    houses,
    aspects,
    elements,
    modalities,
  };
}

/**
 * Computes astrological aspects from an outer comparison chart (Transit, Solar Return,
 * Lunar Return, Progressions, or Synastry Partner) onto the base Natal chart.
 */
export function calculateComparisonAspects(
  outerChart: AstroChart,
  natalChart: AstroChart,
  outerRoleLabel: OuterRoleLabel
): ComparisonAspectInfo[] {
  const aspects: ComparisonAspectInfo[] = [];

  for (const outerP of outerChart.planets) {
    for (const natalP of natalChart.planets) {
      const rawDiff = Math.abs(outerP.longitude - natalP.longitude);
      const sep = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      for (const asp of ASPECT_DEFINITIONS) {
        const orb = Math.abs(sep - asp.angle);
        const orbLimit =
          outerP.id === 'sun' || outerP.id === 'moon' || natalP.id === 'sun' || natalP.id === 'moon'
            ? Math.min(5.0, asp.maxOrb - 1.5)
            : Math.min(3.5, Math.max(2.0, asp.maxOrb - 3.0));

        if (orb <= orbLimit) {
          aspects.push({
            id: `${outerRoleLabel}-${outerP.id}-${natalP.id}-${asp.type}`,
            outerPlanet: outerP.id,
            natalPlanet: natalP.id,
            outerPlanetName: outerP.name,
            natalPlanetName: natalP.name,
            outerSymbol: outerP.symbol,
            natalSymbol: natalP.symbol,
            type: asp.type,
            label: asp.label,
            symbol: asp.symbol,
            exactAngle: asp.angle,
            orb: Number(orb.toFixed(2)),
            harmony: asp.harmony,
            colorHex: asp.colorHex,
            cssColor: asp.cssColor,
            interpretation: buildDetailedAspectInterpretation(
              outerP.id,
              outerP.name,
              natalP.id,
              natalP.name,
              asp.type,
              asp.symbol,
              orb,
              `${outerP.name} (${outerRoleLabel}) ${asp.symbol} ${natalP.name} natal`
            ),
          });
          break;
        }
      }
    }
  }

  aspects.sort((a, b) => a.orb - b.orb);
  return aspects;
}

export interface SolarReturnAnalysis {
  ascInNatalHouse: HouseCusp;
  mcInNatalHouse: HouseCusp;
  sunInSrHouse: HouseCusp;
  moonInSrHouse: HouseCusp;
  srAscRuler: string;
  srAscRulerPlanet: PlanetPosition | null;
  angularPlanets: Array<{
    planet: PlanetPosition;
    angleName: 'ASC' | 'MC' | 'DSC' | 'IC';
    orb: number;
  }>;
  summaryText: string;
}

export function analyzeSolarReturn(
  natalChart: AstroChart,
  srChart: AstroChart
): SolarReturnAnalysis {
  const ascHouseNum = findHouseForLongitude(srChart.ascendant, natalChart.houses);
  const mcHouseNum = findHouseForLongitude(srChart.midheaven, natalChart.houses);
  const ascInNatalHouse = natalChart.houses[ascHouseNum - 1];
  const mcInNatalHouse = natalChart.houses[mcHouseNum - 1];

  const srSun = srChart.planets.find((p) => p.id === 'sun')!;
  const srMoon = srChart.planets.find((p) => p.id === 'moon')!;
  const sunInSrHouse = srChart.houses[srSun.house - 1];
  const moonInSrHouse = srChart.houses[srMoon.house - 1];

  const srAscRuler = srChart.ascSign.ruler;
  const srAscRulerPlanet =
    srChart.planets.find((p) => p.name.toLowerCase() === srAscRuler.toLowerCase()) ?? null;

  const angleTargets: Array<{ name: 'ASC' | 'MC' | 'DSC' | 'IC'; lon: number }> = [
    { name: 'ASC', lon: srChart.ascendant },
    { name: 'MC', lon: srChart.midheaven },
    { name: 'DSC', lon: srChart.descendant },
    { name: 'IC', lon: srChart.imumCoeli },
  ];

  const angularPlanets: SolarReturnAnalysis['angularPlanets'] = [];
  for (const p of srChart.planets) {
    if (p.id === 'northNode') continue;
    for (const ang of angleTargets) {
      const raw = Math.abs(p.longitude - ang.lon);
      const sep = raw > 180 ? 360 - raw : raw;
      if (sep <= 8.0) {
        angularPlanets.push({ planet: p, angleName: ang.name, orb: Number(sep.toFixed(2)) });
      }
    }
  }
  angularPlanets.sort((a, b) => a.orb - b.orb);

  const summaryText = `Ascendant RS en ${srChart.ascSign.name} tombant en Maison ${ascInNatalHouse.roman} natale (${ascInNatalHouse.title.toLowerCase()}) : l’année met en lumière ce secteur natal, tandis que le Soleil RS en Maison ${sunInSrHouse.roman} indique le foyer principal d’action.`;

  return {
    ascInNatalHouse,
    mcInNatalHouse,
    sunInSrHouse,
    moonInSrHouse,
    srAscRuler,
    srAscRulerPlanet,
    angularPlanets,
    summaryText,
  };
}

export interface ComparativeRow {
  planetId: PlanetId;
  symbol: string;
  name: string;
  basePos: string;
  baseHouseRoman: string;
  outerPos: string;
  outerInBaseHouseRoman: string;
  deltaDeg: number;
}

export interface ComparativeAnalysis {
  rows: ComparativeRow[];
  harmoniousCount: number;
  tenseCount: number;
  fusionCount: number;
  ascShiftDeg: number;
  ascInBaseHouseRoman: string;
  mcInBaseHouseRoman: string;
}

export function analyzeComparison(
  baseChart: AstroChart,
  outerChart: AstroChart,
  aspects: ComparisonAspectInfo[]
): ComparativeAnalysis {
  const rows: ComparativeRow[] = baseChart.planets.map((baseP, i) => {
    const outerP = outerChart.planets[i] ?? baseP;
    const houseInBase = findHouseForLongitude(outerP.longitude, baseChart.houses);
    let diff = outerP.longitude - baseP.longitude;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return {
      planetId: baseP.id,
      symbol: baseP.symbol,
      name: baseP.name,
      basePos: `${baseP.formattedDeg} ${baseP.sign.symbol}`,
      baseHouseRoman: baseChart.houses[baseP.house - 1].roman,
      outerPos: `${outerP.formattedDeg} ${outerP.sign.symbol}`,
      outerInBaseHouseRoman: baseChart.houses[houseInBase - 1].roman,
      deltaDeg: Number(diff.toFixed(1)),
    };
  });

  let ascDiff = outerChart.ascendant - baseChart.ascendant;
  if (ascDiff > 180) ascDiff -= 360;
  if (ascDiff < -180) ascDiff += 360;

  const ascHouse = findHouseForLongitude(outerChart.ascendant, baseChart.houses);
  const mcHouse = findHouseForLongitude(outerChart.midheaven, baseChart.houses);

  return {
    rows,
    harmoniousCount: aspects.filter((a) => a.harmony === 'harmonious').length,
    tenseCount: aspects.filter((a) => a.harmony === 'tense').length,
    fusionCount: aspects.filter((a) => a.harmony === 'fusion').length,
    ascShiftDeg: Number(ascDiff.toFixed(1)),
    ascInBaseHouseRoman: baseChart.houses[ascHouse - 1].roman,
    mcInBaseHouseRoman: baseChart.houses[mcHouse - 1].roman,
  };
}

export interface AscendantCalculationResult {
  date: Date;
  cityName: string;
  latitude: number;
  longitude: number;
  ascendant: number;
  ascSign: ZodiacSign;
  ascDegInSign: number;
  ascFormattedDeg: string;
  descendant: number;
  dscSign: ZodiacSign;
  dscFormattedDeg: string;
  midheaven: number;
  mcSign: ZodiacSign;
  mcFormattedDeg: string;
  siderealTimeHours: number;
  signWindowStart: Date | null;
  signWindowEnd: Date | null;
}

export function calculateAscendantOnly(
  date: Date,
  latitude: number,
  longitude: number,
  cityName: string
): AscendantCalculationResult {
  const { ascendant, midheaven, lstHours } = computeAngles(date, latitude, longitude);
  const ascFmt = formatDegreeInSign(ascendant);
  const descendant = normalizeDeg(ascendant + 180);
  const dscFmt = formatDegreeInSign(descendant);
  const mcFmt = formatDegreeInSign(midheaven);
  const targetSignIdx = ascFmt.sign.index;

  // Locate entry & exit times of this Ascendant sign within +/- 5 hours (1-minute precision)
  const stepMs = 5 * 60_000;
  const maxSteps = 60;
  let signWindowStart: Date | null = null;
  let signWindowEnd: Date | null = null;

  for (let s = 1; s <= maxSteps; s++) {
    const probeMs = date.getTime() - s * stepMs;
    const probeIdx = formatDegreeInSign(computeAngles(new Date(probeMs), latitude, longitude).ascendant).sign.index;
    if (probeIdx !== targetSignIdx) {
      let lo = probeMs;
      let hi = probeMs + stepMs;
      for (let k = 0; k < 4; k++) {
        const mid = Math.floor((lo + hi) / 2);
        const midIdx = formatDegreeInSign(computeAngles(new Date(mid), latitude, longitude).ascendant).sign.index;
        if (midIdx === targetSignIdx) hi = mid;
        else lo = mid;
      }
      signWindowStart = new Date(hi);
      break;
    }
  }

  for (let s = 1; s <= maxSteps; s++) {
    const probeMs = date.getTime() + s * stepMs;
    const probeIdx = formatDegreeInSign(computeAngles(new Date(probeMs), latitude, longitude).ascendant).sign.index;
    if (probeIdx !== targetSignIdx) {
      let lo = probeMs - stepMs;
      let hi = probeMs;
      for (let k = 0; k < 4; k++) {
        const mid = Math.floor((lo + hi) / 2);
        const midIdx = formatDegreeInSign(computeAngles(new Date(mid), latitude, longitude).ascendant).sign.index;
        if (midIdx === targetSignIdx) lo = mid;
        else hi = mid;
      }
      signWindowEnd = new Date(lo);
      break;
    }
  }

  return {
    date,
    cityName,
    latitude,
    longitude,
    ascendant,
    ascSign: ascFmt.sign,
    ascDegInSign: ascFmt.degInSign,
    ascFormattedDeg: ascFmt.formattedDeg,
    descendant,
    dscSign: dscFmt.sign,
    dscFormattedDeg: dscFmt.formattedDeg,
    midheaven,
    mcSign: mcFmt.sign,
    mcFormattedDeg: mcFmt.formattedDeg,
    siderealTimeHours: lstHours,
    signWindowStart,
    signWindowEnd,
  };
}




