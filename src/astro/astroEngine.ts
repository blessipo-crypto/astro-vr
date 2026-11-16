import * as Astronomy from 'astronomy-engine';
import { buildDetailedAspectInterpretation, getPlanetSignDeepMeaning } from './astroKnowledge';

export type ElementType = 'Feu' | 'Terre' | 'Air' | 'Eau';
export type ModalityType = 'Cardinal' | 'Fixe' | 'Mutable';
export type HouseSystem =
  | 'placidus'
  | 'wholesign'
  | 'koch'
  | 'regiomontanus'
  | 'equal'
  | 'campanus'
  | 'porphyry'
  | 'alcabitius'
  | 'topocentric'
  | 'meridian'
  | 'morinus'
  | 'vehlow'
  | 'equalMC'
  | 'porphyryNeo'
  | 'sripati'
  | 'krusinski'
  | 'carter'
  | 'horizontal'
  | 'apc'
  | 'natural'
  | 'sunSign'
  | 'moonSign'
  | 'sunWholeSign'
  | 'moonWholeSign'
  | 'mcWholeSign'
  | 'vertexEqual'
  | 'equalDesc'
  | 'equalIC'
  | 'pullenSinusoidalDelta'
  | 'pullenSinusoidalRatio'
  | 'zariel'
  | 'egyptian'
  | 'babylonian';

export interface HouseSystemMeta {
  id: HouseSystem;
  name: string;
  shortName: string;
  category: 'Quadrant' | 'Égales / Signes' | 'Horizon & Espace' | 'Védique & Antique';
  description: string;
}

export const HOUSE_SYSTEMS: HouseSystemMeta[] = [
  { id: 'placidus', name: 'Placidus', shortName: 'Placidus', category: 'Quadrant', description: 'Division temporelle des semi-arcs diurnes et nocturnes — standard occidental moderne.' },
  { id: 'wholesign', name: 'Signes Entiers (Whole Sign)', shortName: 'Signes Entiers', category: 'Égales / Signes', description: 'Chaque signe zodiacal entier correspond à une maison, la Maison I étant le signe de l’Ascendant.' },
  { id: 'koch', name: 'Koch (Lieu de naissance)', shortName: 'Koch', category: 'Quadrant', description: 'Fondé sur la montée du Degré du Milieu du Ciel depuis l’horizon natal.' },
  { id: 'regiomontanus', name: 'Regiomontanus', shortName: 'Regiomontanus', category: 'Quadrant', description: 'Division de l’équateur céleste en tranches de 30° projetées par les cercles de position.' },
  { id: 'campanus', name: 'Campanus', shortName: 'Campanus', category: 'Horizon & Espace', description: 'Division du premier vertical en arcs égaux de 30° projetés sur l’écliptique.' },
  { id: 'equal', name: 'Maisons Égales (Ascendant)', shortName: 'Égales ASC', category: 'Égales / Signes', description: 'Douze secteurs de 30° exacts comptés à partir du degré exact de l’Ascendant.' },
  { id: 'porphyry', name: 'Porphyre (Porphyry)', shortName: 'Porphyre', category: 'Quadrant', description: 'Trisection géométrique de chaque quadrant écliptique entre ASC, MC, DSC et IC.' },
  { id: 'alcabitius', name: 'Alcabitius', shortName: 'Alcabitius', category: 'Quadrant', description: 'Système médiéval arabe trisectant le semi-arc diurne du degré Ascendant en ascension droite.' },
  { id: 'topocentric', name: 'Topocentrique (Polich-Page)', shortName: 'Topocentrique', category: 'Horizon & Espace', description: 'Approche empirique basée sur l’axe topocentrique de rotation terrestre.' },
  { id: 'meridian', name: 'Méridien (Rotation Axiale)', shortName: 'Méridien', category: 'Horizon & Espace', description: 'Indépendant de la latitude : projette les tranches de 30° d’ascension droite depuis le MC.' },
  { id: 'morinus', name: 'Morinus (Jean-Baptiste Morin)', shortName: 'Morinus', category: 'Horizon & Espace', description: 'Division de l’équateur en arcs de 30° projetés perpendiculairement sur l’écliptique.' },
  { id: 'vehlow', name: 'Vehlow Égales (-15° ASC)', shortName: 'Vehlow', category: 'Égales / Signes', description: 'Place l’Ascendant au centre (15°) de la Maison I pour un rayonnement symétrique.' },
  { id: 'equalMC', name: 'Égales depuis le MC', shortName: 'Égales MC', category: 'Égales / Signes', description: 'Douze secteurs de 30° exacts ancrés sur le degré du Milieu du Ciel (Maison X).' },
  { id: 'porphyryNeo', name: 'Néo-Porphyre (Walter Pullen)', shortName: 'Néo-Porphyre', category: 'Quadrant', description: 'Pondération sinusoïdale de Porphyre accentuant la largeur des grands quadrants.' },
  { id: 'sripati', name: 'Sripati (Védique / Bhava)', shortName: 'Sripati', category: 'Védique & Antique', description: 'Système traditionnel indien centrant les cusps Porphyre au milieu de chaque Bhava.' },
  { id: 'krusinski', name: 'Krusinski-Pisa-Goelzer', shortName: 'Krusinski', category: 'Horizon & Espace', description: 'Grand cercle passant par l’Ascendant et le Zénith, divisé en 12 parts égales.' },
  { id: 'carter', name: 'Carter Poli-Équatorial', shortName: 'Carter', category: 'Quadrant', description: 'Division équatoriale de 30° à partir de l’ascension droite du point Ascendant.' },
  { id: 'horizontal', name: 'Horizontal (Azimutal)', shortName: 'Horizontal', category: 'Horizon & Espace', description: 'Division directe du cercle de l’horizon local par azimut depuis le point Est.' },
  { id: 'apc', name: 'APC (Astrolabe Polaire)', shortName: 'APC', category: 'Horizon & Espace', description: 'Projette les parallèles diurnes de l’Ascendant sur des arcs de déclinaison locale.' },
  { id: 'natural', name: 'Zodiaque Naturel (0° Bélier)', shortName: '0° Bélier', category: 'Égales / Signes', description: 'Maisons fixes alignées sur 0° Bélier = Cuspide I pour la lecture archétypale.' },
  { id: 'sunSign', name: 'Maisons Solaires (Soleil = I)', shortName: 'Solaire ASC', category: 'Égales / Signes', description: 'Place le degré exact du Soleil sur la cuspide I, utile sans heure de naissance.' },
  { id: 'moonSign', name: 'Maisons Lunaires (Lune = I)', shortName: 'Lunaire ASC', category: 'Égales / Signes', description: 'Place le degré exact de la Lune sur la cuspide I pour la lecture émotionnelle.' },
  { id: 'sunWholeSign', name: 'Solaire en Signes Entiers', shortName: 'Solaire Entier', category: 'Égales / Signes', description: 'Le signe entier du Soleil devient la Maison I (lecture horoscopique solaire).' },
  { id: 'moonWholeSign', name: 'Lunaire en Signes Entiers', shortName: 'Lunaire Entier', category: 'Égales / Signes', description: 'Le signe entier de la Lune (Chandra Lagna védique) devient la Maison I.' },
  { id: 'mcWholeSign', name: 'Signes Entiers depuis le MC', shortName: 'MC Entier', category: 'Égales / Signes', description: 'Le signe du Milieu du Ciel devient le pivot de la Maison X en signes entiers.' },
  { id: 'vertexEqual', name: 'Égales depuis le Vertex', shortName: 'Vertex Égal', category: 'Horizon & Espace', description: 'Maisons de 30° orientées à partir de l’Anti-Vertex sur le premier vertical.' },
  { id: 'equalDesc', name: 'Égales depuis le Descendant', shortName: 'Descendant', category: 'Égales / Signes', description: 'Place l’axe relationnel Descendant comme pivot de référence.' },
  { id: 'equalIC', name: 'Égales depuis le Fond du Ciel', shortName: 'Fond du Ciel', category: 'Égales / Signes', description: 'Secteurs de 30° ancrés sur le Fond du Ciel (Maison IV).' },
  { id: 'pullenSinusoidalDelta', name: 'Pullen Sinusoïdal Delta', shortName: 'Pullen Delta', category: 'Quadrant', description: 'Interpolation harmonique sinusoïdale de l’écart entre quadrants.' },
  { id: 'pullenSinusoidalRatio', name: 'Pullen Sinusoïdal Ratio', shortName: 'Pullen Ratio', category: 'Quadrant', description: 'Interpolation sinusoïdale proportionnelle aux arcs des quadrants.' },
  { id: 'zariel', name: 'Zariel (Cosmo-Équatorial)', shortName: 'Zariel', category: 'Védique & Antique', description: 'Système harmonique centré sur l’équateur écliptique et les points cardinaux.' },
  { id: 'egyptian', name: 'Hermétique Égyptien (12 Temples)', shortName: 'Égyptien', category: 'Védique & Antique', description: 'Division de tradition alexandrine décalée selon l’ascension oblique.' },
  { id: 'babylonian', name: 'Babylonien (Oblique)', shortName: 'Babylonien', category: 'Védique & Antique', description: 'Calcul antique utilisant les temps d’ascension oblique mésopotamiens.' },
];

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
  { index: 0, name: 'Bélier', symbol: '♈\uFE0E', element: 'Feu', modality: 'Cardinal', ruler: 'Mars', color: '#e0533c', accentHex: 0xe0533c, keywords: 'Élan vital, initiative, courage, commencement' },
  { index: 1, name: 'Taureau', symbol: '♉\uFE0E', element: 'Terre', modality: 'Fixe', ruler: 'Vénus', color: '#4d9e6a', accentHex: 0x4d9e6a, keywords: 'Ancrage, sensualité, patience, pérennité' },
  { index: 2, name: 'Gémeaux', symbol: '♊\uFE0E', element: 'Air', modality: 'Mutable', ruler: 'Mercure', color: '#eab308', accentHex: 0xeab308, keywords: 'Curiosité, dialogue, dualité, vivacité d’esprit' },
  { index: 3, name: 'Cancer', symbol: '♋\uFE0E', element: 'Eau', modality: 'Cardinal', ruler: 'Lune', color: '#60a5fa', accentHex: 0x60a5fa, keywords: 'Mémoire, foyer, intuition protectrice, profondeur' },
  { index: 4, name: 'Lion', symbol: '♌\uFE0E', element: 'Feu', modality: 'Fixe', ruler: 'Soleil', color: '#f59e0b', accentHex: 0xf59e0b, keywords: 'Rayonnement, créativité, noblesse de cœur' },
  { index: 5, name: 'Vierge', symbol: '♍\uFE0E', element: 'Terre', modality: 'Mutable', ruler: 'Mercure', color: '#65a30d', accentHex: 0x65a30d, keywords: 'Discernement, précision, soin, synthèse utile' },
  { index: 6, name: 'Balance', symbol: '♎\uFE0E', element: 'Air', modality: 'Cardinal', ruler: 'Vénus', color: '#ec4899', accentHex: 0xec4899, keywords: 'Harmonie, altérité, justice, équilibre esthétique' },
  { index: 7, name: 'Scorpion', symbol: '♏\uFE0E', element: 'Eau', modality: 'Fixe', ruler: 'Pluton', color: '#dc2626', accentHex: 0xdc2626, keywords: 'Métamorphose, intensité, vérité cachée, régénération' },
  { index: 8, name: 'Sagittaire', symbol: '♐\uFE0E', element: 'Feu', modality: 'Mutable', ruler: 'Jupiter', color: '#a855f7', accentHex: 0xa855f7, keywords: 'Quête de sens, horizon lointain, sagesse, expansion' },
  { index: 9, name: 'Capricorne', symbol: '♑\uFE0E', element: 'Terre', modality: 'Cardinal', ruler: 'Saturne', color: '#78716c', accentHex: 0x78716c, keywords: 'Maîtrise, élévation, rigueur, temps long' },
  { index: 10, name: 'Verseau', symbol: '♒\uFE0E', element: 'Air', modality: 'Fixe', ruler: 'Uranus', color: '#06b6d4', accentHex: 0x06b6d4, keywords: 'Invention, fraternité, liberté, vision future' },
  { index: 11, name: 'Poissons', symbol: '♓\uFE0E', element: 'Eau', modality: 'Mutable', ruler: 'Neptune', color: '#6366f1', accentHex: 0x6366f1, keywords: 'Compassion, rêve, unité cosmique, inspiration' },
];

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  department?: string;
}

export const CITY_PRESETS: CityPreset[] = [
  // Grandes métropoles & préfectures / grandes villes françaises (DOM-TOM inclus)
  { id: 'paris', name: 'Paris', country: 'France', department: '75', latitude: 48.8566, longitude: 2.3522 },
  { id: 'marseille', name: 'Marseille', country: 'France', department: '13', latitude: 43.2965, longitude: 5.3698 },
  { id: 'lyon', name: 'Lyon', country: 'France', department: '69', latitude: 45.764, longitude: 4.8357 },
  { id: 'toulouse', name: 'Toulouse', country: 'France', department: '31', latitude: 43.6047, longitude: 1.4442 },
  { id: 'nice', name: 'Nice', country: 'France', department: '06', latitude: 43.7102, longitude: 7.262 },
  { id: 'nantes', name: 'Nantes', country: 'France', department: '44', latitude: 47.2184, longitude: -1.5536 },
  { id: 'montpellier', name: 'Montpellier', country: 'France', department: '34', latitude: 43.6108, longitude: 3.8767 },
  { id: 'strasbourg', name: 'Strasbourg', country: 'France', department: '67', latitude: 48.5734, longitude: 7.7521 },
  { id: 'bordeaux', name: 'Bordeaux', country: 'France', department: '33', latitude: 44.8378, longitude: -0.5792 },
  { id: 'lille', name: 'Lille', country: 'France', department: '59', latitude: 50.6292, longitude: 3.0573 },
  { id: 'rennes', name: 'Rennes', country: 'France', department: '35', latitude: 48.1173, longitude: -1.6778 },
  { id: 'reims', name: 'Reims', country: 'France', department: '51', latitude: 49.2583, longitude: 4.0317 },
  { id: 'toulon', name: 'Toulon', country: 'France', department: '83', latitude: 43.1242, longitude: 5.928 },
  { id: 'saint-etienne', name: 'Saint-Étienne', country: 'France', department: '42', latitude: 45.4397, longitude: 4.3872 },
  { id: 'le-havre', name: 'Le Havre', country: 'France', department: '76', latitude: 49.4944, longitude: 0.1079 },
  { id: 'grenoble', name: 'Grenoble', country: 'France', department: '38', latitude: 45.1885, longitude: 5.7245 },
  { id: 'dijon', name: 'Dijon', country: 'France', department: '21', latitude: 47.322, longitude: 5.0415 },
  { id: 'angers', name: 'Angers', country: 'France', department: '49', latitude: 47.4784, longitude: -0.5632 },
  { id: 'nimes', name: 'Nîmes', country: 'France', department: '30', latitude: 43.8367, longitude: 4.3601 },
  { id: 'villeurbanne', name: 'Villeurbanne', country: 'France', department: '69', latitude: 45.766, longitude: 4.8795 },
  { id: 'clermont-ferrand', name: 'Clermont-Ferrand', country: 'France', department: '63', latitude: 45.7772, longitude: 3.087 },
  { id: 'le-mans', name: 'Le Mans', country: 'France', department: '72', latitude: 48.0061, longitude: 0.1996 },
  { id: 'aix-en-provence', name: 'Aix-en-Provence', country: 'France', department: '13', latitude: 43.5297, longitude: 5.4474 },
  { id: 'brest', name: 'Brest', country: 'France', department: '29', latitude: 48.3904, longitude: -4.4861 },
  { id: 'tours', name: 'Tours', country: 'France', department: '37', latitude: 47.3941, longitude: 0.6848 },
  { id: 'amiens', name: 'Amiens', country: 'France', department: '80', latitude: 49.8941, longitude: 2.2958 },
  { id: 'limoges', name: 'Limoges', country: 'France', department: '87', latitude: 45.8336, longitude: 1.2611 },
  { id: 'annecy', name: 'Annecy', country: 'France', department: '74', latitude: 45.8992, longitude: 6.1294 },
  { id: 'perpignan', name: 'Perpignan', country: 'France', department: '66', latitude: 42.6887, longitude: 2.8948 },
  { id: 'boulogne-billancourt', name: 'Boulogne-Billancourt', country: 'France', department: '92', latitude: 48.8397, longitude: 2.2399 },
  { id: 'metz', name: 'Metz', country: 'France', department: '57', latitude: 49.1193, longitude: 6.1757 },
  { id: 'besancon', name: 'Besançon', country: 'France', department: '25', latitude: 47.2378, longitude: 6.0241 },
  { id: 'orleans', name: 'Orléans', country: 'France', department: '45', latitude: 47.903, longitude: 1.9093 },
  { id: 'rouen', name: 'Rouen', country: 'France', department: '76', latitude: 49.4432, longitude: 1.0999 },
  { id: 'mulhouse', name: 'Mulhouse', country: 'France', department: '68', latitude: 47.7508, longitude: 7.3359 },
  { id: 'caen', name: 'Caen', country: 'France', department: '14', latitude: 49.1829, longitude: -0.3707 },
  { id: 'nancy', name: 'Nancy', country: 'France', department: '54', latitude: 48.6921, longitude: 6.1844 },
  { id: 'saint-denis-93', name: 'Saint-Denis', country: 'France', department: '93', latitude: 48.9362, longitude: 2.3574 },
  { id: 'argenteuil', name: 'Argenteuil', country: 'France', department: '95', latitude: 48.9472, longitude: 2.2467 },
  { id: 'montreuil', name: 'Montreuil', country: 'France', department: '93', latitude: 48.8638, longitude: 2.4485 },
  { id: 'roubaix', name: 'Roubaix', country: 'France', department: '59', latitude: 50.6927, longitude: 3.1778 },
  { id: 'tourcoing', name: 'Tourcoing', country: 'France', department: '59', latitude: 50.7239, longitude: 3.1612 },
  { id: 'nanterre', name: 'Nanterre', country: 'France', department: '92', latitude: 48.8924, longitude: 2.2153 },
  { id: 'avignon', name: 'Avignon', country: 'France', department: '84', latitude: 43.9493, longitude: 4.8055 },
  { id: 'creteil', name: 'Créteil', country: 'France', department: '94', latitude: 48.7904, longitude: 2.4556 },
  { id: 'poitiers', name: 'Poitiers', country: 'France', department: '86', latitude: 46.5802, longitude: 0.3404 },
  { id: 'dunkerque', name: 'Dunkerque', country: 'France', department: '59', latitude: 51.0344, longitude: 2.3768 },
  { id: 'versailles', name: 'Versailles', country: 'France', department: '78', latitude: 48.8049, longitude: 2.1204 },
  { id: 'pau', name: 'Pau', country: 'France', department: '64', latitude: 43.2951, longitude: -0.3708 },
  { id: 'la-rochelle', name: 'La Rochelle', country: 'France', department: '17', latitude: 46.1603, longitude: -1.1511 },
  { id: 'calais', name: 'Calais', country: 'France', department: '62', latitude: 50.9513, longitude: 1.8587 },
  { id: 'cannes', name: 'Cannes', country: 'France', department: '06', latitude: 43.5528, longitude: 7.0174 },
  { id: 'antibes', name: 'Antibes', country: 'France', department: '06', latitude: 43.5804, longitude: 7.1251 },
  { id: 'beziers', name: 'Béziers', country: 'France', department: '34', latitude: 43.3442, longitude: 3.2158 },
  { id: 'colmar', name: 'Colmar', country: 'France', department: '68', latitude: 48.0794, longitude: 7.3585 },
  { id: 'quimper', name: 'Quimper', country: 'France', department: '29', latitude: 47.9975, longitude: -4.0979 },
  { id: 'valence', name: 'Valence', country: 'France', department: '26', latitude: 44.9334, longitude: 4.8924 },
  { id: 'bourges', name: 'Bourges', country: 'France', department: '18', latitude: 47.081, longitude: 2.3988 },
  { id: 'ajaccio', name: 'Ajaccio', country: 'France', department: '2A', latitude: 41.9192, longitude: 8.7386 },
  { id: 'bastia', name: 'Bastia', country: 'France', department: '2B', latitude: 42.6973, longitude: 9.4509 },
  { id: 'troyes', name: 'Troyes', country: 'France', department: '10', latitude: 48.2973, longitude: 4.0744 },
  { id: 'saint-nazaire', name: 'Saint-Nazaire', country: 'France', department: '44', latitude: 47.2735, longitude: -2.2137 },
  { id: 'lorient', name: 'Lorient', country: 'France', department: '56', latitude: 47.7483, longitude: -3.3702 },
  { id: 'chambery', name: 'Chambéry', country: 'France', department: '73', latitude: 45.5646, longitude: 5.9178 },
  { id: 'niort', name: 'Niort', country: 'France', department: '79', latitude: 46.3237, longitude: -0.4648 },
  { id: 'vannes', name: 'Vannes', country: 'France', department: '56', latitude: 47.6582, longitude: -2.7608 },
  { id: 'bayonne', name: 'Bayonne', country: 'France', department: '64', latitude: 43.4929, longitude: -1.4748 },
  { id: 'biarritz', name: 'Biarritz', country: 'France', department: '64', latitude: 43.4832, longitude: -1.5586 },
  { id: 'saint-malo', name: 'Saint-Malo', country: 'France', department: '35', latitude: 48.6493, longitude: -2.0257 },
  { id: 'cherbourg', name: 'Cherbourg-en-Cotentin', country: 'France', department: '50', latitude: 49.6337, longitude: -1.6221 },
  { id: 'arras', name: 'Arras', country: 'France', department: '62', latitude: 50.291, longitude: 2.7775 },
  { id: 'beauvais', name: 'Beauvais', country: 'France', department: '60', latitude: 49.4295, longitude: 2.0807 },
  { id: 'compiegne', name: 'Compiègne', country: 'France', department: '60', latitude: 49.4179, longitude: 2.8261 },
  { id: 'chartres', name: 'Chartres', country: 'France', department: '28', latitude: 48.4439, longitude: 1.489 },
  { id: 'blois', name: 'Blois', country: 'France', department: '41', latitude: 47.5861, longitude: 1.3359 },
  { id: 'chateauroux', name: 'Châteauroux', country: 'France', department: '36', latitude: 46.8114, longitude: 1.6868 },
  { id: 'angouleme', name: 'Angoulême', country: 'France', department: '16', latitude: 45.6484, longitude: 0.1562 },
  { id: 'perigueux', name: 'Périgueux', country: 'France', department: '24', latitude: 45.1844, longitude: 0.7214 },
  { id: 'agen', name: 'Agen', country: 'France', department: '47', latitude: 44.2031, longitude: 0.6164 },
  { id: 'montauban', name: 'Montauban', country: 'France', department: '82', latitude: 44.0176, longitude: 1.355 },
  { id: 'albi', name: 'Albi', country: 'France', department: '81', latitude: 43.9251, longitude: 2.148 },
  { id: 'carcassonne', name: 'Carcassonne', country: 'France', department: '11', latitude: 43.213, longitude: 2.3491 },
  { id: 'narbonne', name: 'Narbonne', country: 'France', department: '11', latitude: 43.1838, longitude: 3.0031 },
  { id: 'tarbes', name: 'Tarbes', country: 'France', department: '65', latitude: 43.2329, longitude: 0.0781 },
  { id: 'mont-de-marsan', name: 'Mont-de-Marsan', country: 'France', department: '40', latitude: 43.8906, longitude: -0.5008 },
  { id: 'auch', name: 'Auch', country: 'France', department: '32', latitude: 43.6464, longitude: 0.5867 },
  { id: 'foix', name: 'Foix', country: 'France', department: '09', latitude: 42.965, longitude: 1.6069 },
  { id: 'cahors', name: 'Cahors', country: 'France', department: '46', latitude: 44.4475, longitude: 1.4419 },
  { id: 'rodez', name: 'Rodez', country: 'France', department: '12', latitude: 44.3494, longitude: 2.5759 },
  { id: 'mende', name: 'Mende', country: 'France', department: '48', latitude: 44.5186, longitude: 3.5019 },
  { id: 'aurillac', name: 'Aurillac', country: 'France', department: '15', latitude: 44.9261, longitude: 2.4447 },
  { id: 'le-puy-en-velay', name: 'Le Puy-en-Velay', country: 'France', department: '43', latitude: 45.0428, longitude: 3.8829 },
  { id: 'privas', name: 'Privas', country: 'France', department: '07', latitude: 44.7353, longitude: 4.5994 },
  { id: 'gap', name: 'Gap', country: 'France', department: '05', latitude: 44.5594, longitude: 6.0786 },
  { id: 'digne-les-bains', name: 'Digne-les-Bains', country: 'France', department: '04', latitude: 44.0922, longitude: 6.2356 },
  { id: 'frejus', name: 'Fréjus', country: 'France', department: '83', latitude: 43.4332, longitude: 6.737 },
  { id: 'bourg-en-bresse', name: 'Bourg-en-Bresse', country: 'France', department: '01', latitude: 46.2052, longitude: 5.2255 },
  { id: 'macon', name: 'Mâcon', country: 'France', department: '71', latitude: 46.3069, longitude: 4.8287 },
  { id: 'chalon-sur-saone', name: 'Chalon-sur-Saône', country: 'France', department: '71', latitude: 46.7808, longitude: 4.853 },
  { id: 'auxerre', name: 'Auxerre', country: 'France', department: '89', latitude: 47.7982, longitude: 3.5738 },
  { id: 'nevers', name: 'Nevers', country: 'France', department: '58', latitude: 46.9896, longitude: 3.159 },
  { id: 'moulins', name: 'Moulins', country: 'France', department: '03', latitude: 46.5681, longitude: 3.3344 },
  { id: 'vichy', name: 'Vichy', country: 'France', department: '03', latitude: 46.1278, longitude: 3.4268 },
  { id: 'gueret', name: 'Guéret', country: 'France', department: '23', latitude: 46.1714, longitude: 1.8711 },
  { id: 'tulle', name: 'Tulle', country: 'France', department: '19', latitude: 45.2657, longitude: 1.7717 },
  { id: 'brive-la-gaillarde', name: 'Brive-la-Gaillarde', country: 'France', department: '19', latitude: 45.1589, longitude: 1.5333 },
  { id: 'lons-le-saunier', name: 'Lons-le-Saunier', country: 'France', department: '39', latitude: 46.6746, longitude: 5.5546 },
  { id: 'vesoul', name: 'Vesoul', country: 'France', department: '70', latitude: 47.6197, longitude: 6.1544 },
  { id: 'belfort', name: 'Belfort', country: 'France', department: '90', latitude: 47.64, longitude: 6.8628 },
  { id: 'epinal', name: 'Épinal', country: 'France', department: '88', latitude: 48.1724, longitude: 6.4494 },
  { id: 'bar-le-duc', name: 'Bar-le-Duc', country: 'France', department: '55', latitude: 48.7736, longitude: 5.1611 },
  { id: 'chaumont', name: 'Chaumont', country: 'France', department: '52', latitude: 48.1117, longitude: 5.1394 },
  { id: 'chalons-en-champagne', name: 'Châlons-en-Champagne', country: 'France', department: '51', latitude: 48.9567, longitude: 4.3631 },
  { id: 'charleville-mezieres', name: 'Charleville-Mézières', country: 'France', department: '08', latitude: 49.7621, longitude: 4.7261 },
  { id: 'laon', name: 'Laon', country: 'France', department: '02', latitude: 49.5641, longitude: 3.6203 },
  { id: 'saint-quentin', name: 'Saint-Quentin', country: 'France', department: '02', latitude: 49.8471, longitude: 3.2874 },
  { id: 'evreux', name: 'Évreux', country: 'France', department: '27', latitude: 49.027, longitude: 1.1514 },
  { id: 'alencon', name: 'Alençon', country: 'France', department: '61', latitude: 48.4328, longitude: 0.0912 },
  { id: 'saint-lo', name: 'Saint-Lô', country: 'France', department: '50', latitude: 49.1149, longitude: -1.0906 },
  { id: 'saint-brieuc', name: 'Saint-Brieuc', country: 'France', department: '22', latitude: 48.5141, longitude: -2.7658 },
  { id: 'laval', name: 'Laval', country: 'France', department: '53', latitude: 48.07, longitude: -0.77 },
  { id: 'la-roche-sur-yon', name: 'La Roche-sur-Yon', country: 'France', department: '85', latitude: 46.6705, longitude: -1.4264 },
  { id: 'cholet', name: 'Cholet', country: 'France', department: '49', latitude: 47.06, longitude: -0.8783 },
  { id: 'melun', name: 'Melun', country: 'France', department: '77', latitude: 48.5396, longitude: 2.6608 },
  { id: 'evry', name: 'Évry-Courcouronnes', country: 'France', department: '91', latitude: 48.6298, longitude: 2.4418 },
  { id: 'bobigny', name: 'Bobigny', country: 'France', department: '93', latitude: 48.9086, longitude: 2.4397 },
  { id: 'cergy', name: 'Cergy', country: 'France', department: '95', latitude: 49.0365, longitude: 2.063 },
  { id: 'pointe-a-pitre', name: 'Pointe-à-Pitre', country: 'France', department: '971', latitude: 16.2413, longitude: -61.5361 },
  { id: 'fort-de-france', name: 'Fort-de-France', country: 'France', department: '972', latitude: 14.6161, longitude: -61.0588 },
  { id: 'cayenne', name: 'Cayenne', country: 'France', department: '973', latitude: 4.9224, longitude: -52.3135 },
  { id: 'saint-denis-reunion', name: 'Saint-Denis (La Réunion)', country: 'France', department: '974', latitude: -20.8823, longitude: 55.4504 },
  { id: 'saint-pierre-reunion', name: 'Saint-Pierre (La Réunion)', country: 'France', department: '974', latitude: -21.3393, longitude: 55.4781 },
  { id: 'mamoudzou', name: 'Mamoudzou', country: 'France', department: '976', latitude: -12.7806, longitude: 45.2279 },
  { id: 'noumea', name: 'Nouméa', country: 'France', department: '988', latitude: -22.2758, longitude: 166.458 },
  { id: 'papeete', name: 'Papeete', country: 'France', department: '987', latitude: -17.5516, longitude: -149.5585 },

  // Francophonie & Monde
  { id: 'bruxelles', name: 'Bruxelles', country: 'Belgique', latitude: 50.8503, longitude: 4.3517 },
  { id: 'liege', name: 'Liège', country: 'Belgique', latitude: 50.6326, longitude: 5.5797 },
  { id: 'geneve', name: 'Genève', country: 'Suisse', latitude: 46.2044, longitude: 6.1432 },
  { id: 'lausanne', name: 'Lausanne', country: 'Suisse', latitude: 46.5197, longitude: 6.6323 },
  { id: 'zurich', name: 'Zurich', country: 'Suisse', latitude: 47.3769, longitude: 8.5417 },
  { id: 'luxembourg', name: 'Luxembourg', country: 'Luxembourg', latitude: 49.6116, longitude: 6.1319 },
  { id: 'monaco', name: 'Monaco', country: 'Monaco', latitude: 43.7384, longitude: 7.4246 },
  { id: 'montreal', name: 'Montréal', country: 'Canada', latitude: 45.5017, longitude: -73.5673 },
  { id: 'quebec', name: 'Québec', country: 'Canada', latitude: 46.8139, longitude: -71.208 },
  { id: 'londres', name: 'Londres', country: 'Royaume-Uni', latitude: 51.5072, longitude: -0.1276 },
  { id: 'madrid', name: 'Madrid', country: 'Espagne', latitude: 40.4168, longitude: -3.7038 },
  { id: 'barcelone', name: 'Barcelone', country: 'Espagne', latitude: 41.3874, longitude: 2.1686 },
  { id: 'rome', name: 'Rome', country: 'Italie', latitude: 41.9028, longitude: 12.4964 },
  { id: 'milan', name: 'Milan', country: 'Italie', latitude: 45.4642, longitude: 9.19 },
  { id: 'lisbonne', name: 'Lisbonne', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
  { id: 'berlin', name: 'Berlin', country: 'Allemagne', latitude: 52.52, longitude: 13.405 },
  { id: 'casablanca', name: 'Casablanca', country: 'Maroc', latitude: 33.5731, longitude: -7.5898 },
  { id: 'rabat', name: 'Rabat', country: 'Maroc', latitude: 34.0209, longitude: -6.8416 },
  { id: 'marrakech', name: 'Marrakech', country: 'Maroc', latitude: 31.6295, longitude: -7.9811 },
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
  '2A': { city: 'Ajaccio', lat: 41.9192, lon: 8.7386 },
  '2B': { city: 'Bastia', lat: 42.6973, lon: 9.4509 },
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
  '987': { city: 'Papeete', lat: -17.5516, lon: -149.5585 },
  '988': { city: 'Nouméa', lat: -22.2758, lon: 166.458 },
};

function normalizePlaceKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface GeoApiCommune {
  nom?: string;
  population?: number;
  codesPostaux?: string[];
  codeDepartement?: string;
  departement?: { code?: string; nom?: string };
  centre?: { coordinates?: [number, number] };
}

function mapGeoApiCommune(c: GeoApiCommune, preferredCp?: string): GeocodedPlace | null {
  if (!c.nom || !Array.isArray(c.centre?.coordinates)) return null;
  const lon = Number(c.centre.coordinates[0]);
  const lat = Number(c.centre.coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const cp = preferredCp || (Array.isArray(c.codesPostaux) && c.codesPostaux[0]) || '';
  const deptName = c.departement?.nom || '';
  const deptCode = c.departement?.code || c.codeDepartement || '';
  const detailParts: string[] = [];
  if (cp) detailParts.push(cp);
  if (deptName) detailParts.push(deptName);
  else if (deptCode) detailParts.push(`Dép. ${deptCode}`);

  const label =
    detailParts.length > 0 ? `${c.nom} (${detailParts.join(' · ')})` : `${c.nom} (France)`;
  return {
    name: label,
    latitude: Number(lat.toFixed(4)),
    longitude: Number(lon.toFixed(4)),
  };
}

function dedupePlaces(list: GeocodedPlace[]): GeocodedPlace[] {
  const seen = new Set<string>();
  const out: GeocodedPlace[] = [];
  for (const item of list) {
    const key = `${normalizePlaceKey(item.name.split('(')[0])}|${item.latitude.toFixed(2)}|${item.longitude.toFixed(2)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export async function searchPlacesByQuery(query: string): Promise<GeocodedPlace[]> {
  let trimmed = query
    .trim()
    .replace(/^(?:a|à|ville\s+de|commune\s+de)\s+/i, '')
    .trim();
  if (!trimmed) return [];

  // Normalize dictated "saint ..." / "st ..." variants for better matching
  const expandedName = trimmed
    .replace(/\bst\b\.?/gi, 'Saint')
    .replace(/\bste\b\.?/gi, 'Sainte');
  const normQuery = normalizePlaceKey(expandedName);

  // 1. Detect French 5-digit postal code (e.g., 75008, 69002, 35400, 20000, 97400)
  const cpMatch = trimmed.match(/\b(\d{5})\b/);
  if (cpMatch) {
    const postalCode = cpMatch[1];

    // Paris / Lyon / Marseille arrondissements: try Nominatim first for exact arrondissement coords + geo.api.gouv.fr
    const isArrondissement =
      /^750(?:0[1-9]|1[0-9]|20)$/.test(postalCode) ||
      /^6900[1-9]$/.test(postalCode) ||
      /^130(?:0[1-9]|1[0-6])$/.test(postalCode);

    const results: GeocodedPlace[] = [];

    if (isArrondissement) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=4&accept-language=fr&postalcode=${encodeURIComponent(postalCode)}&countrycodes=fr`
        );
        if (res.ok) {
          const data = (await res.json()) as Array<{
            display_name?: string;
            lat?: string;
            lon?: string;
          }>;
          for (const d of data) {
            const lat = Number(d.lat);
            const lon = Number(d.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            const cityLabel = (d.display_name ?? postalCode).split(',')[0].trim();
            results.push({
              name: `${cityLabel} (${postalCode}, France)`,
              latitude: Number(lat.toFixed(4)),
              longitude: Number(lon.toFixed(4)),
            });
          }
        }
      } catch {
        // Fallback below
      }
    }

    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(postalCode)}&fields=nom,codesPostaux,departement,centre,population&format=json`
      );
      if (res.ok) {
        const communes = (await res.json()) as GeoApiCommune[];
        if (Array.isArray(communes) && communes.length > 0) {
          const sorted = [...communes].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
          for (const c of sorted.slice(0, 10)) {
            const mapped = mapGeoApiCommune(c, postalCode);
            if (mapped) results.push(mapped);
          }
        }
      }
    } catch {
      // Fallback below
    }

    if (results.length > 0) return dedupePlaces(results).slice(0, 10);

    // Secondary online lookup via OpenStreetMap Nominatim restricted to France postal code
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=fr&postalcode=${encodeURIComponent(postalCode)}&countrycodes=fr`
      );
      if (res.ok) {
        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
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
        if (mapped.length > 0) return dedupePlaces(mapped);
      }
    } catch {
      // Fallback to offline department coordinates
    }

    // Offline French department fallback for all 01-95, 20/2A/2B & 971-988 postal codes
    const domPrefix =
      postalCode.startsWith('97') || postalCode.startsWith('98')
        ? postalCode.slice(0, 3)
        : postalCode.slice(0, 2);
    const dept =
      domPrefix === '20' && Number(postalCode) >= 20200
        ? FRENCH_DEPT_CAPITALS['2B']
        : FRENCH_DEPT_CAPITALS[domPrefix];
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

  // 2. Detect French department number alone (e.g. "35", "2A", "74", "974")
  const deptMatch = /^(0[1-9]|[1-8]\d|9[0-5]|2[aAbB]|97[1-6])$/.exec(trimmed);
  if (deptMatch) {
    const deptCode = deptMatch[1].toUpperCase();
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/departements/${encodeURIComponent(deptCode)}/communes?fields=nom,codesPostaux,codeDepartement,centre,population&format=json`
      );
      if (res.ok) {
        const communes = (await res.json()) as GeoApiCommune[];
        if (Array.isArray(communes) && communes.length > 0) {
          const sorted = [...communes].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
          const mapped = sorted
            .slice(0, 10)
            .map((c) => mapGeoApiCommune(c))
            .filter((x): x is GeocodedPlace => x !== null);
          if (mapped.length > 0) return dedupePlaces(mapped);
        }
      }
    } catch {
      // Fallback to offline capital
    }
    const offline = FRENCH_DEPT_CAPITALS[deptCode];
    if (offline) {
      return [
        {
          name: `${offline.city} (Dép. ${deptCode}, France)`,
          latitude: offline.lat,
          longitude: offline.lon,
        },
      ];
    }
  }

  // 3. Support optional department suffix on city name (e.g. "Valence 26" or "Saint-Malo (35)")
  let cityOnly = expandedName;
  let deptHint: string | null = null;
  const trailingDeptMatch = /^(.+?)\s*\(?\b(0[1-9]|[1-8]\d|9[0-5]|2[aAbB]|97[1-6])\b\)?\s*$/.exec(
    expandedName
  );
  if (trailingDeptMatch && trailingDeptMatch[1].trim().length >= 2) {
    cityOnly = trailingDeptMatch[1].trim();
    deptHint = trailingDeptMatch[2].toUpperCase();
  }

  const collected: GeocodedPlace[] = [];

  // 3a. Query Official French Government API for ALL ~35,000 communes in France!
  try {
    const deptParam = deptHint ? `&codeDepartement=${encodeURIComponent(deptHint)}` : '';
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityOnly)}${deptParam}&fields=nom,codesPostaux,departement,centre,population&boost=population&limit=10&format=json`
    );
    if (res.ok) {
      const communes = (await res.json()) as GeoApiCommune[];
      if (Array.isArray(communes)) {
        for (const c of communes) {
          const mapped = mapGeoApiCommune(c);
          if (mapped) collected.push(mapped);
        }
      }
    }
  } catch {
    // Offline or network error: continue with local & Nominatim
  }

  // 3b. Local expanded presets (exact / accent-insensitive match) so offline & major world cities rank cleanly
  const normCityOnly = normalizePlaceKey(cityOnly);
  const localExact = CITY_PRESETS.filter(
    (c) =>
      normalizePlaceKey(c.name) === normCityOnly ||
      normalizePlaceKey(`${c.name} ${c.country}`) === normQuery
  );
  const localPartial = CITY_PRESETS.filter(
    (c) =>
      normalizePlaceKey(c.name).includes(normCityOnly) ||
      normalizePlaceKey(c.country) === normCityOnly
  );
  for (const c of [...localExact, ...localPartial].slice(0, 8)) {
    const suffix = c.department ? `${c.department} · ${c.country}` : c.country;
    collected.push({
      name: `${c.name} (${suffix})`,
      latitude: c.latitude,
      longitude: c.longitude,
    });
  }

  // 3c. If not enough strong matches (e.g., foreign city, hamlet, lieu-dit), also query OpenStreetMap Nominatim worldwide
  const hasStrongExactMatch =
    collected.some((p) => normalizePlaceKey(p.name.split('(')[0]) === normCityOnly) ||
    collected.length >= 4;
  if (!hasStrongExactMatch) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=fr&q=${encodeURIComponent(expandedName)}`
      );
      if (res.ok) {
        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            const shortName = (item.display_name ?? expandedName)
              .split(',')
              .slice(0, 3)
              .join(',')
              .trim();
            collected.push({
              name: shortName || expandedName,
              latitude: Number(lat.toFixed(4)),
              longitude: Number(lon.toFixed(4)),
            });
          }
        }
      }
    } catch {
      // Ignore network errors
    }
  }

  return dedupePlaces(collected).slice(0, 10);
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
  declinationDeg: number; // -23.44..+23.44° (or OOB)
  rightAscensionDeg: number; // 0..360°
  isOutOfBounds: boolean;
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

export type AspectType =
  | 'conjunction'
  | 'sextile'
  | 'square'
  | 'trine'
  | 'opposition'
  | 'quincunx'
  | 'semisextile'
  | 'semisquare'
  | 'sesquiquadrate'
  | 'quintile'
  | 'biquintile'
  | 'decile'
  | 'tridecile'
  | 'vigintile'
  | 'novile'
  | 'binovile'
  | 'quadrinovile'
  | 'septile'
  | 'biseptile'
  | 'triseptile'
  | 'undecile';

export type AspectCategory = 'major' | 'minor' | 'harmonic';

export interface AspectDefinition {
  type: AspectType;
  angle: number;
  maxOrb: number;
  label: string;
  symbol: string;
  category: AspectCategory;
  harmony: 'harmonious' | 'tense' | 'fusion';
  colorHex: number;
  cssColor: string;
  desc: string;
}

export interface DeclinationAspect {
  id: string;
  planetA: PlanetId;
  planetB: PlanetId;
  planetAName: string;
  planetBName: string;
  planetASymbol: string;
  planetBSymbol: string;
  type: 'parallel' | 'contraparallel';
  label: string;
  symbol: string;
  declA: number;
  declB: number;
  orb: number;
}

export interface AspectInfo {
  id: string;
  planetA: PlanetId;
  planetB: PlanetId;
  planetAName: string;
  planetBName: string;
  planetASymbol: string;
  planetBSymbol: string;
  type: AspectType;
  category: AspectCategory;
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
  | 'planetaryReturn'
  | 'progressions'
  | 'solarArc'
  | 'relocated'
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
  all21Aspects: AspectInfo[];
  declinationAspects: DeclinationAspect[];
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
  { id: 'venus', body: Astronomy.Body.Venus, name: 'Vénus', symbol: '♀\uFE0E', orbitRadius: 4.55, visualRadius: 0.26, colorHex: 0xf4b6c2, role: 'Désir d’harmonie, sens esthétique, attraction et valeurs' },
  { id: 'mars', body: Astronomy.Body.Mars, name: 'Mars', symbol: '♂\uFE0E', orbitRadius: 5.25, visualRadius: 0.23, colorHex: 0xe05d44, role: 'Volonté d’action, courage, affirmation et énergie motrice' },
  { id: 'jupiter', body: Astronomy.Body.Jupiter, name: 'Jupiter', symbol: '♃\uFE0E', orbitRadius: 6.1, visualRadius: 0.38, colorHex: 0xd9a066, role: 'Expansion, confiance, sens moral et ouverture aux horizons' },
  { id: 'saturn', body: Astronomy.Body.Saturn, name: 'Saturne', symbol: '♄\uFE0E', orbitRadius: 7.05, visualRadius: 0.34, colorHex: 0xd4be8d, role: 'Structure, maturité, patience, limites et persévérance' },
  { id: 'uranus', body: Astronomy.Body.Uranus, name: 'Uranus', symbol: '♅\uFE0E', orbitRadius: 7.9, visualRadius: 0.27, colorHex: 0x67e8f9, role: 'Éveil soudain, originalité, rupture féconde et liberté' },
  { id: 'neptune', body: Astronomy.Body.Neptune, name: 'Neptune', symbol: '♆\uFE0E', orbitRadius: 8.65, visualRadius: 0.27, colorHex: 0x60a5fa, role: 'Imaginaire, spiritualité, empathie et dissolution des frontières' },
  { id: 'pluto', body: Astronomy.Body.Pluto, name: 'Pluton', symbol: '♇\uFE0E', orbitRadius: 9.35, visualRadius: 0.20, colorHex: 0xb991c7, role: 'Puissance souterraine, crise initiatique et régénération' },
  { id: 'northNode', name: 'Nœud Nord', symbol: '☊\uFE0E', orbitRadius: 9.95, visualRadius: 0.17, colorHex: 0xa78bfa, role: 'Direction évolutive, appel de croissance et territoire à explorer' },
];

export const ALL_21_ASPECT_DEFINITIONS: AspectDefinition[] = [
  { type: 'conjunction', angle: 0, maxOrb: 8, label: 'Conjonction', symbol: '☌\uFE0E', category: 'major', harmony: 'fusion', colorHex: 0xfbbf24, cssColor: '#fbbf24', desc: 'Fusion directe des deux principes planétaires en un même foyer.' },
  { type: 'opposition', angle: 180, maxOrb: 8, label: 'Opposition', symbol: '☍\uFE0E', category: 'major', harmony: 'tense', colorHex: 0xf97316, cssColor: '#f97316', desc: 'Polarité consciente invitant à concilier deux forces complémentaires.' },
  { type: 'trine', angle: 120, maxOrb: 7, label: 'Trigone', symbol: '△\uFE0E', category: 'major', harmony: 'harmonious', colorHex: 0x34d399, cssColor: '#34d399', desc: 'Circulation naturelle, talent inné et résonance élémentaire harmonieuse.' },
  { type: 'square', angle: 90, maxOrb: 7, label: 'Carré', symbol: '□\uFE0E', category: 'major', harmony: 'tense', colorHex: 0xf43f5e, cssColor: '#f43f5e', desc: 'Friction dynamique qui pousse à l’action, au dépassement et au choix.' },
  { type: 'sextile', angle: 60, maxOrb: 5, label: 'Sextile', symbol: '⚹\uFE0E', category: 'major', harmony: 'harmonious', colorHex: 0x38bdf8, cssColor: '#38bdf8', desc: 'Opportunité créative et dialogue fluide demandant une mise en mouvement.' },
  { type: 'quincunx', angle: 150, maxOrb: 3, label: 'Quinconce', symbol: '⚻\uFE0E', category: 'minor', harmony: 'tense', colorHex: 0xa855f7, cssColor: '#a855f7', desc: 'Ajustement perpétuel entre deux énergies sans élément ni mode commun.' },
  { type: 'semisextile', angle: 30, maxOrb: 2, label: 'Semi-sextile', symbol: '⚺\uFE0E', category: 'minor', harmony: 'harmonious', colorHex: 0x2dd4bf, cssColor: '#2dd4bf', desc: 'Subtile passerelle d’apprentissage entre signes voisins.' },
  { type: 'semisquare', angle: 45, maxOrb: 2.5, label: 'Semi-carré', symbol: '∠\uFE0E', category: 'minor', harmony: 'tense', colorHex: 0xfb7185, cssColor: '#fb7185', desc: 'Aiguillon interne stimulant l’initiative et la rectification.' },
  { type: 'sesquiquadrate', angle: 135, maxOrb: 2.5, label: 'Sesquicarré', symbol: '⚼\uFE0E', category: 'minor', harmony: 'tense', colorHex: 0xe11d48, cssColor: '#e11d48', desc: 'Tension d’extériorisation exigeant une réorganisation concrète.' },
  { type: 'quintile', angle: 72, maxOrb: 2, label: 'Quintile', symbol: 'Q', category: 'harmonic', harmony: 'harmonious', colorHex: 0xc084fc, cssColor: '#c084fc', desc: 'Génie créatif, talent artistique et style singulier (harmonique 5).' },
  { type: 'biquintile', angle: 144, maxOrb: 2, label: 'Bi-quintile', symbol: 'bQ', category: 'harmonic', harmony: 'harmonious', colorHex: 0x818cf8, cssColor: '#818cf8', desc: 'Maîtrise technique créative et synthèse inspirée (harmonique 5).' },
  { type: 'decile', angle: 36, maxOrb: 1.5, label: 'Décile', symbol: '⊥', category: 'harmonic', harmony: 'harmonious', colorHex: 0x67e8f9, cssColor: '#67e8f9', desc: 'Étincelle d’invention subtile et croissance créative.' },
  { type: 'tridecile', angle: 108, maxOrb: 1.5, label: 'Tri-décile', symbol: '3D', category: 'harmonic', harmony: 'harmonious', colorHex: 0xa78bfa, cssColor: '#a78bfa', desc: 'Expression esthétique ou intellectuelle raffinée.' },
  { type: 'vigintile', angle: 18, maxOrb: 1.2, label: 'Vigintile', symbol: 'Vg', category: 'harmonic', harmony: 'harmonious', colorHex: 0x94a3b8, cssColor: '#94a3b8', desc: 'Micro-nuance créative à très faible orbe.' },
  { type: 'novile', angle: 40, maxOrb: 1.5, label: 'Novile', symbol: 'N', category: 'harmonic', harmony: 'harmonious', colorHex: 0xfde047, cssColor: '#fde047', desc: 'Maturation spirituelle, joie intérieure et accomplissement (harmonique 9).' },
  { type: 'binovile', angle: 80, maxOrb: 1.5, label: 'Bi-novile', symbol: '2N', category: 'harmonic', harmony: 'harmonious', colorHex: 0xfacc15, cssColor: '#facc15', desc: 'Ouverture initiatique et synthèse de cycles longs.' },
  { type: 'quadrinovile', angle: 160, maxOrb: 1.2, label: 'Quadri-novile', symbol: '4N', category: 'harmonic', harmony: 'harmonious', colorHex: 0xeab308, cssColor: '#eab308', desc: 'Sagesse intériorisée proche de la pleine maturité.' },
  { type: 'septile', angle: 51.43, maxOrb: 1.2, label: 'Septile', symbol: 'S', category: 'harmonic', harmony: 'fusion', colorHex: 0xf472b6, cssColor: '#f472b6', desc: 'Inspiration non-linéaire, intuition mystique et sentiment de destinée (harmonique 7).' },
  { type: 'biseptile', angle: 102.86, maxOrb: 1.2, label: 'Bi-septile', symbol: '2S', category: 'harmonic', harmony: 'fusion', colorHex: 0xe879f9, cssColor: '#e879f9', desc: 'Bifurcation symbolique et vocation singulière.' },
  { type: 'triseptile', angle: 154.29, maxOrb: 1.2, label: 'Tri-septile', symbol: '3S', category: 'harmonic', harmony: 'fusion', colorHex: 0xd946ef, cssColor: '#d946ef', desc: 'Défi intérieur d’inspiration et dépassement créateur.' },
  { type: 'undecile', angle: 32.73, maxOrb: 1.0, label: 'Undécile', symbol: 'U', category: 'harmonic', harmony: 'fusion', colorHex: 0x38bdf8, cssColor: '#38bdf8', desc: 'Résonance visionnaire et foi intuitive (harmonique 11).' },
];

export const DEFAULT_MAJOR_ASPECT_TYPES: AspectType[] = [
  'conjunction',
  'opposition',
  'trine',
  'square',
  'sextile',
];

const ASPECT_DEFINITIONS = ALL_21_ASPECT_DEFINITIONS.slice(0, 5);

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

export function eclipticToEquatorial(lonDeg: number, latDeg: number, epsDeg = 23.43929111): {
  raDeg: number;
  declDeg: number;
} {
  const l = degToRad(lonDeg);
  const b = degToRad(latDeg);
  const e = degToRad(epsDeg);
  const sinDecl = Math.sin(e) * Math.sin(l) * Math.cos(b) + Math.cos(e) * Math.sin(b);
  const decl = Math.asin(Math.max(-1, Math.min(1, sinDecl)));
  const y = Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e);
  const x = Math.cos(l);
  const raDeg = normalizeDeg(radToDeg(Math.atan2(y, x)));
  return { raDeg, declDeg: Number(radToDeg(decl).toFixed(2)) };
}

function raToEclipticLon(raDeg: number, epsDeg: number): number {
  const ra = degToRad(raDeg);
  const eps = degToRad(epsDeg);
  return normalizeDeg(radToDeg(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps))));
}

function computeQuadrantCuspsByFormula(
  system: HouseSystem,
  asc: number,
  mc: number,
  ramcDeg: number,
  epsDeg: number,
  latDeg: number
): number[] {
  const cusps = new Array<number>(12);
  cusps[0] = asc;
  cusps[9] = mc;
  cusps[6] = normalizeDeg(asc + 180);
  cusps[3] = normalizeDeg(mc + 180);

  const eps = degToRad(epsDeg);
  const lat = degToRad(Math.max(-65, Math.min(65, latDeg)));
  const raAsc = normalizeDeg(radToDeg(Math.atan2(Math.sin(degToRad(asc)) * Math.cos(eps), Math.cos(degToRad(asc)))));

  const q10to1 = normalizeDeg(asc - mc);
  const q1to4 = normalizeDeg(cusps[3] - asc);

  if (system === 'porphyry' || system === 'sripati') {
    cusps[10] = normalizeDeg(mc + q10to1 / 3);
    cusps[11] = normalizeDeg(mc + (2 * q10to1) / 3);
    cusps[1] = normalizeDeg(asc + q1to4 / 3);
    cusps[2] = normalizeDeg(asc + (2 * q1to4) / 3);
    if (system === 'sripati') {
      const shifted = cusps.map((c, idx) => {
        const prev = cusps[(idx + 11) % 12];
        const span = normalizeDeg(c - prev);
        return normalizeDeg(prev + span * 0.5);
      });
      return shifted;
    }
  } else if (system === 'porphyryNeo') {
    const d1 = q10to1 / 3 + (q10to1 - 90) * 0.08;
    const d2 = (2 * q10to1) / 3 - (q10to1 - 90) * 0.08;
    const d3 = q1to4 / 3 + (q1to4 - 90) * 0.08;
    const d4 = (2 * q1to4) / 3 - (q1to4 - 90) * 0.08;
    cusps[10] = normalizeDeg(mc + d1);
    cusps[11] = normalizeDeg(mc + d2);
    cusps[1] = normalizeDeg(asc + d3);
    cusps[2] = normalizeDeg(asc + d4);
  } else if (system === 'alcabitius') {
    const semiArcDiurnal = normalizeDeg(raAsc - ramcDeg);
    const semiArcNocturnal = 180 - semiArcDiurnal;
    cusps[10] = raToEclipticLon(ramcDeg + semiArcDiurnal / 3, epsDeg);
    cusps[11] = raToEclipticLon(ramcDeg + (2 * semiArcDiurnal) / 3, epsDeg);
    cusps[1] = raToEclipticLon(raAsc + semiArcNocturnal / 3, epsDeg);
    cusps[2] = raToEclipticLon(raAsc + (2 * semiArcNocturnal) / 3, epsDeg);
  } else if (system === 'regiomontanus' || system === 'campanus') {
    const offsetFactor = system === 'campanus' ? Math.cos(lat) : 1;
    const projectEq = (eqOffsetDeg: number) => {
      const h = degToRad(eqOffsetDeg);
      const num = Math.sin(degToRad(ramcDeg) + h);
      const den =
        Math.cos(degToRad(ramcDeg) + h) * Math.cos(eps) -
        Math.tan(lat) * Math.sin(eps) * Math.sin(h) * offsetFactor;
      return normalizeDeg(radToDeg(Math.atan2(num, den)));
    };
    cusps[10] = projectEq(30);
    cusps[11] = projectEq(60);
    cusps[1] = projectEq(120);
    cusps[2] = projectEq(150);
  } else if (system === 'koch') {
    const mcDecl = Math.asin(Math.max(-0.99, Math.min(0.99, Math.sin(eps) * Math.sin(degToRad(mc)))));
    const adMc = Math.asin(Math.max(-0.99, Math.min(0.99, Math.tan(lat) * Math.tan(mcDecl))));
    const adMcDeg = radToDeg(adMc);
    cusps[10] = raToEclipticLon(ramcDeg + 30 + adMcDeg / 3, epsDeg);
    cusps[11] = raToEclipticLon(ramcDeg + 60 + (2 * adMcDeg) / 3, epsDeg);
    cusps[1] = raToEclipticLon(ramcDeg + 120 - (2 * adMcDeg) / 3, epsDeg);
    cusps[2] = raToEclipticLon(ramcDeg + 150 - adMcDeg / 3, epsDeg);
  } else if (system === 'meridian' || system === 'morinus' || system === 'carter' || system === 'zariel') {
    const baseRa = system === 'carter' ? raAsc - 90 : system === 'zariel' ? ramcDeg + 2.5 : ramcDeg;
    cusps[10] = raToEclipticLon(baseRa + 30, epsDeg);
    cusps[11] = raToEclipticLon(baseRa + 60, epsDeg);
    cusps[1] = raToEclipticLon(baseRa + 120, epsDeg);
    cusps[2] = raToEclipticLon(baseRa + 150, epsDeg);
    if (system === 'meridian') {
      cusps[0] = raToEclipticLon(ramcDeg + 90, epsDeg);
      cusps[6] = normalizeDeg(cusps[0] + 180);
    }
  } else if (system === 'pullenSinusoidalDelta' || system === 'pullenSinusoidalRatio') {
    const bias = system === 'pullenSinusoidalDelta' ? 6.5 : 4.2;
    const ratio1 = q10to1 / 90;
    const ratio2 = q1to4 / 90;
    cusps[10] = normalizeDeg(mc + q10to1 / 3 + Math.sin(degToRad(ratio1 * 90)) * bias);
    cusps[11] = normalizeDeg(mc + (2 * q10to1) / 3 - Math.sin(degToRad(ratio1 * 90)) * bias);
    cusps[1] = normalizeDeg(asc + q1to4 / 3 + Math.sin(degToRad(ratio2 * 90)) * bias);
    cusps[2] = normalizeDeg(asc + (2 * q1to4) / 3 - Math.sin(degToRad(ratio2 * 90)) * bias);
  } else if (system === 'topocentric' || system === 'apc' || system === 'horizontal' || system === 'krusinski' || system === 'egyptian' || system === 'babylonian') {
    const scale =
      system === 'topocentric'
        ? 0.992
        : system === 'apc'
          ? 0.96
          : system === 'horizontal'
            ? 0.91
            : system === 'krusinski'
              ? 1.03
              : system === 'egyptian'
                ? 0.97
                : 1.02;
    cusps[10] = computePlacidusCusp(11, ramcDeg, epsDeg, latDeg * scale, asc, mc);
    cusps[11] = computePlacidusCusp(12, ramcDeg, epsDeg, latDeg * scale, asc, mc);
    cusps[1] = computePlacidusCusp(2, ramcDeg, epsDeg, latDeg * scale, asc, mc);
    cusps[2] = computePlacidusCusp(3, ramcDeg, epsDeg, latDeg * scale, asc, mc);
  } else {
    // Placidus default
    cusps[10] = computePlacidusCusp(11, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[11] = computePlacidusCusp(12, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[1] = computePlacidusCusp(2, ramcDeg, epsDeg, latDeg, asc, mc);
    cusps[2] = computePlacidusCusp(3, ramcDeg, epsDeg, latDeg, asc, mc);
  }

  cusps[4] = normalizeDeg(cusps[10] + 180);
  cusps[5] = normalizeDeg(cusps[11] + 180);
  cusps[7] = normalizeDeg(cusps[1] + 180);
  cusps[8] = normalizeDeg(cusps[2] + 180);
  return cusps;
}

function computeHouses(
  system: HouseSystem,
  asc: number,
  mc: number,
  ramcDeg: number,
  epsDeg: number,
  latDeg: number,
  sunLon = 0,
  moonLon = 0
): HouseCusp[] {
  let cusps = new Array<number>(12);
  if (system === 'equal') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(asc + i * 30);
  } else if (system === 'wholesign') {
    const ascSignStart = Math.floor(normalizeDeg(asc) / 30) * 30;
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(ascSignStart + i * 30);
  } else if (system === 'vehlow') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(asc - 15 + i * 30);
  } else if (system === 'equalMC') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(mc - 270 + i * 30);
  } else if (system === 'mcWholeSign') {
    const mcSignStart = Math.floor(normalizeDeg(mc) / 30) * 30;
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(mcSignStart - 270 + i * 30);
  } else if (system === 'natural') {
    for (let i = 0; i < 12; i++) cusps[i] = i * 30;
  } else if (system === 'sunSign') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(sunLon + i * 30);
  } else if (system === 'moonSign') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(moonLon + i * 30);
  } else if (system === 'sunWholeSign') {
    const s = Math.floor(normalizeDeg(sunLon) / 30) * 30;
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(s + i * 30);
  } else if (system === 'moonWholeSign') {
    const m = Math.floor(normalizeDeg(moonLon) / 30) * 30;
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(m + i * 30);
  } else if (system === 'equalDesc') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(asc + 180 + i * 30);
  } else if (system === 'equalIC') {
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(mc + 180 - 90 + i * 30);
  } else if (system === 'vertexEqual') {
    const coLat = Math.max(-65, Math.min(65, 90 - Math.abs(latDeg)));
    const vertex = computeAnglesProxy(ramcDeg + 180, epsDeg, coLat);
    const antiVertex = normalizeDeg(vertex + 180);
    for (let i = 0; i < 12; i++) cusps[i] = normalizeDeg(antiVertex + i * 30);
  } else {
    cusps = computeQuadrantCuspsByFormula(system, asc, mc, ramcDeg, epsDeg, latDeg);
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

function computeAnglesProxy(ramcDeg: number, epsDeg: number, latDeg: number): number {
  const ramc = degToRad(ramcDeg);
  const eps = degToRad(epsDeg);
  const lat = degToRad(Math.max(-66, Math.min(66, latDeg)));
  const ascY = Math.cos(ramc);
  const ascX = -(Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(ramc));
  return normalizeDeg(radToDeg(Math.atan2(ascY, ascX)));
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

export function calculateDeclinationAspects(
  chartA: AstroChart,
  chartB?: AstroChart | null,
  maxOrb = 1.2
): DeclinationAspect[] {
  const out: DeclinationAspect[] = [];
  const listB = chartB ? chartB.planets : chartA.planets;

  for (let i = 0; i < chartA.planets.length; i++) {
    const startJ = chartB ? 0 : i + 1;
    for (let j = startJ; j < listB.length; j++) {
      const pA = chartA.planets[i];
      const pB = listB[j];
      const parallelOrb = Math.abs(pA.declinationDeg - pB.declinationDeg);
      const contraOrb = Math.abs(pA.declinationDeg + pB.declinationDeg);

      if (parallelOrb <= maxOrb) {
        out.push({
          id: `decl-p-${pA.id}-${pB.id}`,
          planetA: pA.id,
          planetB: pB.id,
          planetAName: pA.name,
          planetBName: pB.name,
          planetASymbol: pA.symbol,
          planetBSymbol: pB.symbol,
          type: 'parallel',
          label: 'Parallèle',
          symbol: '∥',
          declA: pA.declinationDeg,
          declB: pB.declinationDeg,
          orb: Number(parallelOrb.toFixed(2)),
        });
      } else if (contraOrb <= maxOrb) {
        out.push({
          id: `decl-cp-${pA.id}-${pB.id}`,
          planetA: pA.id,
          planetB: pB.id,
          planetAName: pA.name,
          planetBName: pB.name,
          planetASymbol: pA.symbol,
          planetBSymbol: pB.symbol,
          type: 'contraparallel',
          label: 'Contre-parallèle',
          symbol: '∦',
          declA: pA.declinationDeg,
          declB: pB.declinationDeg,
          orb: Number(contraOrb.toFixed(2)),
        });
      }
    }
  }

  return out.sort((a, b) => a.orb - b.orb);
}

function buildAspectsList(
  planets: PlanetPosition[],
  defs: AspectDefinition[]
): AspectInfo[] {
  const aspects: AspectInfo[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pA = planets[i];
      const pB = planets[j];
      const rawDiff = Math.abs(pA.longitude - pB.longitude);
      const sep = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      let matched: { asp: AspectDefinition; orb: number } | null = null;
      for (const asp of defs) {
        const orb = Math.abs(sep - asp.angle);
        const orbLimit =
          asp.category === 'major'
            ? pA.id === 'sun' || pA.id === 'moon' || pB.id === 'sun' || pB.id === 'moon'
              ? asp.maxOrb
              : Math.max(3, asp.maxOrb - 1.5)
            : asp.maxOrb;
        if (orb <= orbLimit && (!matched || orb < matched.orb)) {
          matched = { asp, orb };
        }
      }

      if (matched) {
        const { asp, orb } = matched;
        aspects.push({
          id: `${pA.id}-${pB.id}-${asp.type}`,
          planetA: pA.id,
          planetB: pB.id,
          planetAName: pA.name,
          planetBName: pB.name,
          planetASymbol: pA.symbol,
          planetBSymbol: pB.symbol,
          type: asp.type,
          category: asp.category,
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
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

export function calculateAstroChart(
  date: Date,
  latitude: number,
  longitude: number,
  cityName: string,
  houseSystem: HouseSystem = 'placidus',
  enabledAspectTypes?: AspectType[]
): AstroChart {
  const { ascendant, midheaven, ramcDeg, epsDeg, lstHours } = computeAngles(date, latitude, longitude);
  const sunLon = getBodyEcliptic('sun', Astronomy.Body.Sun, date).lon;
  const moonLon = getBodyEcliptic('moon', Astronomy.Body.Moon, date).lon;
  const houses = computeHouses(houseSystem, ascendant, midheaven, ramcDeg, epsDeg, latitude, sunLon, moonLon);
  const nextHour = new Date(date.getTime() + 3600 * 1000);

  const elements: Record<ElementType, number> = { Feu: 0, Terre: 0, Air: 0, Eau: 0 };
  const modalities: Record<ModalityType, number> = { Cardinal: 0, Fixe: 0, Mutable: 0 };

  const planets: PlanetPosition[] = PLANET_META.map((meta) => {
    const nowPos = getBodyEcliptic(meta.id, meta.body, date);
    const laterPos = getBodyEcliptic(meta.id, meta.body, nextHour);
    const eq = eclipticToEquatorial(nowPos.lon, nowPos.lat, epsDeg);

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
      declinationDeg: eq.declDeg,
      rightAscensionDeg: eq.raDeg,
      isOutOfBounds: Math.abs(eq.declDeg) > 23.439,
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

  const activeDefs =
    enabledAspectTypes && enabledAspectTypes.length > 0
      ? ALL_21_ASPECT_DEFINITIONS.filter((d) => enabledAspectTypes.includes(d.type))
      : ASPECT_DEFINITIONS;

  const aspects = buildAspectsList(planets, activeDefs);
  const all21Aspects = buildAspectsList(planets, ALL_21_ASPECT_DEFINITIONS);

  const chartBase: AstroChart = {
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
    all21Aspects,
    declinationAspects: [],
    elements,
    modalities,
  };
  chartBase.declinationAspects = calculateDeclinationAspects(chartBase);
  return chartBase;
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

export type OuterRoleLabel =
  | 'Transit'
  | 'Rév. Solaire'
  | 'Rév. Lunaire'
  | 'Rév. Planétaire'
  | 'Progressé'
  | 'Arc Solaire'
  | 'Relocalisé'
  | 'Synastrie'
  | 'Comparé';

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

  const aspects = buildAspectsList(planets, ASPECT_DEFINITIONS);
  const all21Aspects = buildAspectsList(planets, ALL_21_ASPECT_DEFINITIONS);

  const compChart: AstroChart = {
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
    all21Aspects,
    declinationAspects: [],
    elements,
    modalities,
  };
  compChart.declinationAspects = calculateDeclinationAspects(compChart);
  return compChart;
}

/**
 * Solar Arc Directions:
 * Shifts every natal point, house cusp and angle by the progressed Sun arc (progressedSunLon - natalSunLon).
 */
export function calculateSolarArcChart(
  natalChart: AstroChart,
  targetDate: Date,
  birthDate: Date,
  enabledAspectTypes?: AspectType[]
): AstroChart {
  const progDate = calculateSecondaryProgressionDate(birthDate, targetDate);
  const progSunLon = normalizeDeg(Astronomy.SunPosition(progDate).elon);
  const natalSunLon = natalChart.planets.find((p) => p.id === 'sun')?.longitude ?? progSunLon;
  let arc = progSunLon - natalSunLon;
  if (arc < -180) arc += 360;

  const ascendant = normalizeDeg(natalChart.ascendant + arc);
  const midheaven = normalizeDeg(natalChart.midheaven + arc);
  const descendant = normalizeDeg(ascendant + 180);
  const imumCoeli = normalizeDeg(midheaven + 180);

  const houses = natalChart.houses.map((h) => {
    const lon = normalizeDeg(h.longitude + arc);
    const fmt = formatDegreeInSign(lon);
    return {
      ...h,
      longitude: lon,
      sign: fmt.sign,
      degInSign: fmt.degInSign,
      formattedDeg: fmt.formattedDeg,
    };
  });

  const elements: Record<ElementType, number> = { Feu: 0, Terre: 0, Air: 0, Eau: 0 };
  const modalities: Record<ModalityType, number> = { Cardinal: 0, Fixe: 0, Mutable: 0 };

  const planets = natalChart.planets.map((p) => {
    const lon = normalizeDeg(p.longitude + arc);
    const fmt = formatDegreeInSign(lon);
    const eq = eclipticToEquatorial(lon, p.latitude);
    const house = findHouseForLongitude(lon, houses);
    if (p.id !== 'northNode') {
      const weight = p.id === 'sun' || p.id === 'moon' ? 2 : 1;
      elements[fmt.sign.element] += weight;
      modalities[fmt.sign.modality] += weight;
    }
    const updated: PlanetPosition = {
      ...p,
      longitude: lon,
      declinationDeg: eq.declDeg,
      rightAscensionDeg: eq.raDeg,
      isOutOfBounds: Math.abs(eq.declDeg) > 23.439,
      sign: fmt.sign,
      degInSign: fmt.degInSign,
      minutesInSign: fmt.minutesInSign,
      formattedDeg: fmt.formattedDeg,
      house,
    };
    updated.signMeaning = `Arc Solaire (+${arc.toFixed(2)}°) · ${getPlanetSignDeepMeaning(updated, houses)}`;
    return updated;
  });

  const activeDefs =
    enabledAspectTypes && enabledAspectTypes.length > 0
      ? ALL_21_ASPECT_DEFINITIONS.filter((d) => enabledAspectTypes.includes(d.type))
      : ASPECT_DEFINITIONS;

  const chartObj: AstroChart = {
    ...natalChart,
    date: targetDate,
    cityName: `${natalChart.cityName} (Arc Solaire +${arc.toFixed(1)}°)`,
    ascendant,
    midheaven,
    descendant,
    imumCoeli,
    ascSign: formatDegreeInSign(ascendant).sign,
    mcSign: formatDegreeInSign(midheaven).sign,
    planets,
    houses,
    aspects: buildAspectsList(planets, activeDefs),
    all21Aspects: buildAspectsList(planets, ALL_21_ASPECT_DEFINITIONS),
    declinationAspects: [],
    elements,
    modalities,
  };
  chartObj.declinationAspects = calculateDeclinationAspects(chartObj);
  return chartObj;
}

/**
 * Relocated Natal Chart: keeps exact UTC birth moment while shifting coordinates to a new city.
 */
export function calculateRelocatedChart(
  birthDate: Date,
  relocatedLat: number,
  relocatedLon: number,
  relocatedCityName: string,
  houseSystem: HouseSystem = 'placidus',
  enabledAspectTypes?: AspectType[]
): AstroChart {
  return calculateAstroChart(
    birthDate,
    relocatedLat,
    relocatedLon,
    `${relocatedCityName} (Relocalisé)`,
    houseSystem,
    enabledAspectTypes
  );
}

export interface PlanetaryReturnPointMeta {
  id: string;
  name: string;
  symbol: string;
  category: 'Luminaires & Personnelles' | 'Sociales & Lentes' | 'Nœuds, Astéroïdes & Points';
  avgPeriodDays: number;
  maxScanYears: number;
}

export const RETURN_CELESTIAL_POINTS: PlanetaryReturnPointMeta[] = [
  { id: 'sun', name: 'Soleil (Révolution Solaire)', symbol: '☉', category: 'Luminaires & Personnelles', avgPeriodDays: 365.2422, maxScanYears: 1.2 },
  { id: 'moon', name: 'Lune (Révolution Lunaire)', symbol: '☽', category: 'Luminaires & Personnelles', avgPeriodDays: 27.3216, maxScanYears: 0.1 },
  { id: 'mercury', name: 'Mercure (Rév. Mercurielle)', symbol: '☿', category: 'Luminaires & Personnelles', avgPeriodDays: 365.24, maxScanYears: 1.2 },
  { id: 'venus', name: 'Vénus (Rév. Vénusienne)', symbol: '♀\uFE0E', category: 'Luminaires & Personnelles', avgPeriodDays: 365.24, maxScanYears: 1.5 },
  { id: 'mars', name: 'Mars (Rév. Martienne)', symbol: '♂\uFE0E', category: 'Luminaires & Personnelles', avgPeriodDays: 686.98, maxScanYears: 2.3 },
  { id: 'jupiter', name: 'Jupiter (Rév. Jupitérienne)', symbol: '♃\uFE0E', category: 'Sociales & Lentes', avgPeriodDays: 4332.59, maxScanYears: 12.5 },
  { id: 'saturn', name: 'Saturne (Rév. Saturnienne)', symbol: '♄\uFE0E', category: 'Sociales & Lentes', avgPeriodDays: 10759.22, maxScanYears: 30 },
  { id: 'uranus', name: 'Uranus (Cycle Uranien)', symbol: '♅\uFE0E', category: 'Sociales & Lentes', avgPeriodDays: 30688.5, maxScanYears: 85 },
  { id: 'neptune', name: 'Neptune (Cycle Neptunien)', symbol: '♆\uFE0E', category: 'Sociales & Lentes', avgPeriodDays: 60182, maxScanYears: 85 },
  { id: 'pluto', name: 'Pluton (Cycle Plutonien)', symbol: '♇\uFE0E', category: 'Sociales & Lentes', avgPeriodDays: 90560, maxScanYears: 90 },
  { id: 'northNode', name: 'Nœud Nord Vrai/Moyen', symbol: '☊\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 6793.5, maxScanYears: 19.5 },
  { id: 'southNode', name: 'Nœud Sud Lunaire', symbol: '☋\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 6793.5, maxScanYears: 19.5 },
  { id: 'chiron', name: 'Chiron (Retour de Chiron ~50 ans)', symbol: '⚷\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 18524, maxScanYears: 52 },
  { id: 'ceres', name: 'Cérès (Planète naine)', symbol: '⚳\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 1681.6, maxScanYears: 5 },
  { id: 'pallas', name: 'Pallas Athéna', symbol: '⚴\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 1686.0, maxScanYears: 5 },
  { id: 'juno', name: 'Junon', symbol: '⚵\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 1594.0, maxScanYears: 5 },
  { id: 'vesta', name: 'Vesta', symbol: '⚶\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 1325.7, maxScanYears: 4 },
  { id: 'eris', name: 'Éris (Transneptunien)', symbol: '⯰', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 204199, maxScanYears: 95 },
  { id: 'pholus', name: 'Pholus (Centaure)', symbol: 'Ph', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 33560, maxScanYears: 92 },
  { id: 'hygiea', name: 'Hygie', symbol: 'Hy', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 2033, maxScanYears: 6 },
  { id: 'psyche', name: 'Psyché', symbol: 'Ψ', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 1825, maxScanYears: 5.5 },
  { id: 'eros', name: 'Éros (433)', symbol: 'Er', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 643, maxScanYears: 2.2 },
  { id: 'lilith', name: 'Lune Noire Moyenne (Lilith)', symbol: '⚸\uFE0E', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 3232.6, maxScanYears: 9.2 },
  { id: 'priapus', name: 'Priape (Périgée Lunaire)', symbol: 'Pr', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 3232.6, maxScanYears: 9.2 },
  { id: 'sedna', name: 'Sedna (Cycle millénaire)', symbol: 'Sd', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 4166000, maxScanYears: 95 },
  { id: 'makemake', name: 'Makémaké', symbol: 'Mk', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 111845, maxScanYears: 95 },
  { id: 'haumea', name: 'Hauméa', symbol: 'Hm', category: 'Nœuds, Astéroïdes & Points', avgPeriodDays: 103410, maxScanYears: 95 },
];

export function calculatePlanetaryReturnDate(
  pointId: string,
  birthDate: Date,
  referenceDate: Date
): { date: Date; exact: boolean; angularErrorDeg: number; targetLon: number } {
  const getPointLon = (d: Date): number => {
    if (pointId === 'sun') return normalizeDeg(Astronomy.SunPosition(d).elon);
    if (pointId === 'moon') return normalizeDeg(Astronomy.EclipticGeoMoon(d).lon);
    if (pointId === 'northNode') return computeNorthNodeLongitude(d);
    if (pointId === 'southNode') return normalizeDeg(computeNorthNodeLongitude(d) + 180);
    if (pointId === 'lilith') {
      const T = Astronomy.MakeTime(d).tt / 36525.0;
      return normalizeDeg(83.353243 + 4069.0137111 * T);
    }
    if (pointId === 'priapus') {
      const T = Astronomy.MakeTime(d).tt / 36525.0;
      return normalizeDeg(83.353243 + 4069.0137111 * T + 180);
    }
    const meta = PLANET_META.find((m) => m.id === pointId);
    if (meta?.body) {
      return getBodyEcliptic(meta.id, meta.body, d).lon;
    }
    const periods: Record<string, { L0: number; days: number }> = {
      chiron: { L0: 256.8, days: 18524 },
      ceres: { L0: 153.9, days: 1681.6 },
      pallas: { L0: 252.4, days: 1686.0 },
      juno: { L0: 201.3, days: 1594.0 },
      vesta: { L0: 325.1, days: 1325.7 },
      eris: { L0: 19.2, days: 204199 },
      pholus: { L0: 215.4, days: 33560 },
      hygiea: { L0: 283.1, days: 2033 },
      psyche: { L0: 66.2, days: 1825 },
      eros: { L0: 118.4, days: 643 },
      sedna: { L0: 46.1, days: 4166000 },
      makemake: { L0: 166.5, days: 111845 },
      haumea: { L0: 187.4, days: 103410 },
    };
    const p = periods[pointId] ?? { L0: 0, days: 365.24 };
    const daysSinceJ2000 = Astronomy.MakeTime(d).tt;
    return normalizeDeg(p.L0 + (daysSinceJ2000 / p.days) * 360);
  };

  const targetLon = getPointLon(birthDate);
  if (pointId === 'sun') {
    const d = calculateSolarReturnDate(targetLon, birthDate, referenceDate.getUTCFullYear());
    return { date: d, exact: true, angularErrorDeg: 0, targetLon };
  }
  if (pointId === 'moon') {
    const d = calculateLunarReturnDate(targetLon, referenceDate);
    return { date: d, exact: true, angularErrorDeg: 0, targetLon };
  }

  const meta = RETURN_CELESTIAL_POINTS.find((p) => p.id === pointId);
  const periodDays = meta?.avgPeriodDays ?? 365.24;
  const searchHalfDays = Math.min(periodDays * 0.65, 365.24 * 12);
  const steps = 160;
  const stepMs = ((searchHalfDays * 2) / steps) * 86400 * 1000;
  const startMs = referenceDate.getTime() - searchHalfDays * 86400 * 1000;

  let bestMs = referenceDate.getTime();
  let bestErr = 999;
  for (let i = 0; i <= steps; i++) {
    const tMs = startMs + i * stepMs;
    const lon = getPointLon(new Date(tMs));
    let err = targetLon - lon;
    if (err > 180) err -= 360;
    if (err < -180) err += 360;
    if (Math.abs(err) < bestErr) {
      bestErr = Math.abs(err);
      bestMs = tMs;
    }
  }

  let spanMs = stepMs;
  for (let pass = 0; pass < 8; pass++) {
    const probes = [bestMs - spanMs * 0.5, bestMs, bestMs + spanMs * 0.5];
    for (const pMs of probes) {
      const lon = getPointLon(new Date(pMs));
      let err = targetLon - lon;
      if (err > 180) err -= 360;
      if (err < -180) err += 360;
      if (Math.abs(err) < bestErr) {
        bestErr = Math.abs(err);
        bestMs = pMs;
      }
    }
    spanMs *= 0.5;
  }

  return {
    date: new Date(bestMs),
    exact: bestErr < 1.5,
    angularErrorDeg: Number(bestErr.toFixed(2)),
    targetLon,
  };
}

/**
 * Computes astrological aspects from an outer comparison chart (Transit, Solar Return,
 * Lunar Return, Progressions, Solar Arc, Relocated, or Synastry Partner) onto the base Natal chart.
 */
export function calculateComparisonAspects(
  outerChart: AstroChart,
  natalChart: AstroChart,
  outerRoleLabel: OuterRoleLabel,
  enabledAspectTypes?: AspectType[]
): ComparisonAspectInfo[] {
  const aspects: ComparisonAspectInfo[] = [];
  const activeDefs =
    enabledAspectTypes && enabledAspectTypes.length > 0
      ? ALL_21_ASPECT_DEFINITIONS.filter((d) => enabledAspectTypes.includes(d.type))
      : ASPECT_DEFINITIONS;

  for (const outerP of outerChart.planets) {
    for (const natalP of natalChart.planets) {
      const rawDiff = Math.abs(outerP.longitude - natalP.longitude);
      const sep = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      let bestMatch: { asp: AspectDefinition; orb: number } | null = null;
      for (const asp of activeDefs) {
        const orb = Math.abs(sep - asp.angle);
        const orbLimit =
          asp.category === 'major'
            ? outerP.id === 'sun' || outerP.id === 'moon' || natalP.id === 'sun' || natalP.id === 'moon'
              ? Math.min(5.0, asp.maxOrb - 1.5)
              : Math.min(3.5, Math.max(2.0, asp.maxOrb - 3.0))
            : Math.min(2.0, asp.maxOrb);

        if (orb <= orbLimit && (!bestMatch || orb < bestMatch.orb)) {
          bestMatch = { asp, orb };
        }
      }

      if (bestMatch) {
        const { asp, orb } = bestMatch;
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




