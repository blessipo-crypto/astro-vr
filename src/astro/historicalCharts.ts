import { HouseSystem, NatalProfile } from './astroEngine';

export type HistoricalCategory =
  | 'science'
  | 'arts'
  | 'literature'
  | 'history';

export interface HistoricalChartEntry {
  id: string;
  name: string;
  lifespan: string;
  category: HistoricalCategory;
  categoryLabel: string;
  birthPlaceLabel: string;
  birthDateIso: string; // YYYY-MM-DDTHH:mm
  latitude: number;
  longitude: number;
  houseSystem: HouseSystem;
  roddenNote: string;
  headline: string;
  astrologicalSignature: string;
}

export const HISTORICAL_CHARTS: HistoricalChartEntry[] = [
  {
    id: 'hist-einstein',
    name: 'Albert Einstein',
    lifespan: '1879 – 1955',
    category: 'science',
    categoryLabel: 'Sciences & Invention',
    birthPlaceLabel: 'Ulm (Allemagne)',
    birthDateIso: '1879-03-14T11:30',
    latitude: 48.4011,
    longitude: 9.9876,
    houseSystem: 'placidus',
    roddenNote: 'Acte civil (AA)',
    headline: 'Soleil en Poissons en Maison IX · Ascendant Cancer',
    astrologicalSignature:
      'L’imagination cosmique des Poissons portée en Maison IX (hautes lois universelles) et soutenue par un axe Saturne-Mercure structurant une pensée révolutionnaire.',
  },
  {
    id: 'hist-marie-curie',
    name: 'Marie Curie',
    lifespan: '1867 – 1934',
    category: 'science',
    categoryLabel: 'Sciences & Invention',
    birthPlaceLabel: 'Varsovie (Pologne)',
    birthDateIso: '1867-11-07T12:00',
    latitude: 52.2297,
    longitude: 21.0122,
    houseSystem: 'placidus',
    roddenNote: 'Heure de midi (C)',
    headline: 'Amas planétaire en Scorpion · Ténacité de recherche',
    astrologicalSignature:
      'Concentration intense en Scorpion explorant l’infiniment petit et les transformations invisibles de la matière (radioactivité), alliée à une discipline exemplaire.',
  },
  {
    id: 'hist-mozart',
    name: 'Wolfgang Amadeus Mozart',
    lifespan: '1756 – 1791',
    category: 'arts',
    categoryLabel: 'Arts & Musique',
    birthPlaceLabel: 'Salzbourg (Autriche)',
    birthDateIso: '1756-01-27T20:00',
    latitude: 47.8095,
    longitude: 13.055,
    houseSystem: 'placidus',
    roddenNote: 'Registre paroissial (A)',
    headline: 'Soleil Verseau conjoint Saturne · Ascendant Vierge',
    astrologicalSignature:
      'Conjonction Soleil-Mercure en Verseau en Maison V (génie créateur précoce) harmonisée par Vénus en Poissons exaltée et une maîtrise formelle d’Ascendant Vierge.',
  },
  {
    id: 'hist-victor-hugo',
    name: 'Victor Hugo',
    lifespan: '1802 – 1885',
    category: 'literature',
    categoryLabel: 'Littérature & Philosophie',
    birthPlaceLabel: 'Besançon (France)',
    birthDateIso: '1802-02-26T22:30',
    latitude: 47.2378,
    longitude: 6.0241,
    houseSystem: 'placidus',
    roddenNote: 'Acte d’état civil (AA)',
    headline: 'Soleil Poissons en Maison IV · Ascendant Scorpion',
    astrologicalSignature:
      'Imaginaire épique et humaniste des Poissons allié à la puissance dramatique du Scorpion à l’Ascendant, donnant un souffle prophétique à son œuvre.',
  },
  {
    id: 'hist-napoleon',
    name: 'Napoléon Bonaparte',
    lifespan: '1769 – 1821',
    category: 'history',
    categoryLabel: 'Histoire & Destinée',
    birthPlaceLabel: 'Ajaccio (France)',
    birthDateIso: '1769-08-15T11:30',
    latitude: 41.9192,
    longitude: 8.7386,
    houseSystem: 'placidus',
    roddenNote: 'Archives familiales (A)',
    headline: 'Soleil Lion au Milieu du Ciel · Ascendant Scorpion',
    astrologicalSignature:
      'Rayonnement solaire impérial en Lion culminant en Maison X, mû par un Ascendant Scorpion stratégique et une Lune en Capricorne avide d’ordre durable.',
  },
  {
    id: 'hist-jung',
    name: 'Carl Gustav Jung',
    lifespan: '1875 – 1961',
    category: 'literature',
    categoryLabel: 'Littérature & Philosophie',
    birthPlaceLabel: 'Kesswil (Suisse)',
    birthDateIso: '1875-07-26T19:29',
    latitude: 47.5964,
    longitude: 9.3153,
    houseSystem: 'placidus',
    roddenNote: 'Données natales rectifiées (A)',
    headline: 'Soleil Lion · Ascendant Verseau avec Saturne',
    astrologicalSignature:
      'Polarité Lion-Verseau dédiée à l’individuation et aux archétypes collectifs, avec une Lune en Taureau ancrant l’exploration des profondeurs symboliques.',
  },
  {
    id: 'hist-frida-kahlo',
    name: 'Frida Kahlo',
    lifespan: '1907 – 1954',
    category: 'arts',
    categoryLabel: 'Arts & Musique',
    birthPlaceLabel: 'Coyoacán, Mexico (Mexique)',
    birthDateIso: '1907-07-06T08:30',
    latitude: 19.3467,
    longitude: -99.1617,
    houseSystem: 'placidus',
    roddenNote: 'Mémoire familiale (A)',
    headline: 'Soleil Cancer · Ascendant Lion',
    astrologicalSignature:
      'Sensibilité viscérale et mémoire des racines en Cancer projetées avec une théâtralité flamboyante d’Ascendant Lion à travers l’autoportrait.',
  },
  {
    id: 'hist-tesla',
    name: 'Nikola Tesla',
    lifespan: '1856 – 1943',
    category: 'science',
    categoryLabel: 'Sciences & Invention',
    birthPlaceLabel: 'Smiljan (Croatie)',
    birthDateIso: '1856-07-10T00:00',
    latitude: 44.5667,
    longitude: 15.3167,
    houseSystem: 'placidus',
    roddenNote: 'Tradition biographique (B)',
    headline: 'Soleil Cancer · Uranus en Taureau & Vision électrique',
    astrologicalSignature:
      'Intuition fulgurante capable de visualiser des systèmes électriques complets en esprit avant même toute esquisse matérielle.',
  },
  {
    id: 'hist-ada-lovelace',
    name: 'Ada Lovelace',
    lifespan: '1815 – 1852',
    category: 'science',
    categoryLabel: 'Sciences & Invention',
    birthPlaceLabel: 'Londres (Royaume-Uni)',
    birthDateIso: '1815-12-10T13:00',
    latitude: 51.5074,
    longitude: -0.1278,
    houseSystem: 'placidus',
    roddenNote: 'Correspondance familiale (A)',
    headline: 'Soleil Sagittaire en Maison IX · Lune Bélier',
    astrologicalSignature:
      'Alliance rare entre poésie et mathématiques abstraites, incarnant la « science poétique » à l’origine du premier algorithme informatique.',
  },
  {
    id: 'hist-beauvoir',
    name: 'Simone de Beauvoir',
    lifespan: '1908 – 1986',
    category: 'literature',
    categoryLabel: 'Littérature & Philosophie',
    birthPlaceLabel: 'Paris (France)',
    birthDateIso: '1908-01-09T04:00',
    latitude: 48.8566,
    longitude: 2.3522,
    houseSystem: 'placidus',
    roddenNote: 'Acte de naissance (AA)',
    headline: 'Soleil Capricorne · Ascendant Scorpion',
    astrologicalSignature:
      'Lucidité existentielle et rigueur philosophique du Capricorne soutenues par la profondeur analytique d’un Ascendant Scorpion et de Vénus-Verseau.',
  },
  {
    id: 'hist-de-gaulle',
    name: 'Charles de Gaulle',
    lifespan: '1890 – 1970',
    category: 'history',
    categoryLabel: 'Histoire & Destinée',
    birthPlaceLabel: 'Lille (France)',
    birthDateIso: '1890-11-22T04:00',
    latitude: 50.6292,
    longitude: 3.0573,
    houseSystem: 'placidus',
    roddenNote: 'Acte de naissance (AA)',
    headline: '29° Scorpion / Sagittaire · Ascendant Balance',
    astrologicalSignature:
      'Sens aigu de la souveraineté et de l’Histoire au degré anarétique Scorpion-Sagittaire, équilibré par un sens diplomatique d’Ascendant Balance.',
  },
  {
    id: 'hist-piaf',
    name: 'Édith Piaf',
    lifespan: '1915 – 1963',
    category: 'arts',
    categoryLabel: 'Arts & Musique',
    birthPlaceLabel: 'Paris (France)',
    birthDateIso: '1915-12-19T05:00',
    latitude: 48.8566,
    longitude: 2.3522,
    houseSystem: 'placidus',
    roddenNote: 'Acte de naissance (AA)',
    headline: 'Soleil Sagittaire en Maison I · Ascendant Scorpion',
    astrologicalSignature:
      'Intensité émotionnelle brute d’un Ascendant Scorpion unie à la ferveur vocale du Sagittaire, transformant les épreuves en chants universels.',
  },
  {
    id: 'hist-picasso',
    name: 'Pablo Picasso',
    lifespan: '1881 – 1973',
    category: 'arts',
    categoryLabel: 'Arts & Musique',
    birthPlaceLabel: 'Málaga (Espagne)',
    birthDateIso: '1881-10-25T23:15',
    latitude: 36.7213,
    longitude: -4.4214,
    houseSystem: 'placidus',
    roddenNote: 'Acte civil (AA)',
    headline: 'Soleil Scorpion · Ascendant Lion',
    astrologicalSignature:
      'Puissance de déconstruction et de métamorphose visuelle du Scorpion mise en scène par une vitalité créatrice solaire d’Ascendant Lion.',
  },
  {
    id: 'hist-chanel',
    name: 'Gabrielle « Coco » Chanel',
    lifespan: '1883 – 1971',
    category: 'arts',
    categoryLabel: 'Arts & Musique',
    birthPlaceLabel: 'Saumur (France)',
    birthDateIso: '1883-08-19T16:00',
    latitude: 47.2597,
    longitude: -0.0785,
    houseSystem: 'placidus',
    roddenNote: 'Acte de naissance (AA)',
    headline: 'Soleil Lion · Ascendant Sagittaire',
    astrologicalSignature:
      'Double signature de Feu unissant l’élégance souveraine du Lion et l’audace libératrice du Sagittaire pour réinventer la silhouette moderne.',
  },
];

export function historicalEntryToProfile(entry: HistoricalChartEntry): NatalProfile {
  return {
    id: entry.id,
    name: entry.name,
    birthDateIso: entry.birthDateIso,
    cityId: 'custom',
    customCityName: entry.birthPlaceLabel,
    customLat: entry.latitude,
    customLon: entry.longitude,
    houseSystem: entry.houseSystem,
  };
}
