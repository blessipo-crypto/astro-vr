import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Database,
  FileDown,
  Film,
  Glasses,
  GraduationCap,
  HelpCircle,
  Home,
  Keyboard,
  Layers,
  ListTree,
  Mail,
  MessageCircle,
  Mic,
  Music,
  Orbit,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stars,
  Users,
  Volume2,
} from 'lucide-react';
import { VoiceDictationButton } from './VoiceDictationButton';

type HelpCategoryId =
  | 'all'
  | 'charts'
  | 'wheel'
  | 'config'
  | 'catalog'
  | 'vr'
  | 'export';

export interface SoftwareGuideHelpActions {
  onOpenHome: () => void;
  onOpenTutorial?: () => void;
  onOpenWheel2D: () => void;
  onOpenWheel3D: () => void;
  onOpenDataSheet: () => void;
  onOpenAuxiliary: () => void;
  onOpenConfig: () => void;
  onOpenFullSummary: () => void;
  onOpenAscendantCalculator: () => void;
  onOpenSharePrint: () => void;
  onOpenAboutAudio: () => void;
  onOpenQuestGuide: () => void;
  onToggleVoiceMode: () => void;
  onOpenAdmin?: () => void;
  onOpenIntroReplay?: () => void;
}

interface CapabilityItem {
  id: string;
  category: Exclude<HelpCategoryId, 'all'>;
  title: string;
  badge: string;
  summary: string;
  highlights: string[];
  keywords: string;
  icon: React.FC<{ className?: string }>;
  actionLabel: string;
  runAction: (a: SoftwareGuideHelpActions) => void;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    id: 'cap-natal',
    category: 'charts',
    title: 'Thème Natal, Multi-Profils & 35 000+ Communes Françaises',
    badge: 'Fondation',
    summary:
      'Créez, sauvegardez et comparez autant de thèmes nataux que souhaité avec recherche géographique instantanée.',
    highlights: [
      'Recherche de toutes les communes françaises par nom ou code postal (API Géo officielle + base locale hors-ligne)',
      'Saisie manuelle Latitude / Longitude possible à la seconde près',
      'Boutons rapides -1h / +1h pour affiner une heure de naissance incertaine',
      'Calculateur dédié « Ascendant seul » avec plage horaire complète de début et fin du signe',
    ],
    keywords: 'natal profil prenom ville code postal commune france ascendant seul',
    icon: Compass,
    actionLabel: 'Calculer l’Ascendant / Natal',
    runAction: (a) => a.onOpenAscendantCalculator(),
  },
  {
    id: 'cap-engines',
    category: 'charts',
    title: '12 Modes Astrologiques & 27 Révolutions Planétaires',
    badge: '12 Moteurs',
    summary:
      'Basculez en un clic depuis la barre supérieure ou l’onglet Auxiliaires entre toutes les techniques prévisionnelles et relationnelles.',
    highlights: [
      'Thème Natal, Transits en direct, Progressions Secondaires (1 jour = 1 an) et Arc Solaire',
      'Synastrie (comparaison de 2 personnes) et Thème Composite (carte mi-point du lien)',
      'Révolutions Solaires, Lunaires et 25+ Révolutions Planétaires (Mercure à Pluton, Chiron, Cérès, Nœuds...)',
      'Thème Relocalisé (calcul instantané de votre thème dans n’importe quelle ville du monde) & Comparatifs',
    ],
    keywords: 'synastrie composite revolution solaire lunaire planetaire progressions arc solaire relocalise transits',
    icon: Users,
    actionLabel: 'Ouvrir Auxiliaires & Synastrie',
    runAction: (a) => a.onOpenAuxiliary(),
  },
  {
    id: 'cap-wheel-spacetime',
    category: 'wheel',
    title: 'Roue SVG Interactive 60 ips & Spacetime Navigator',
    badge: '60 FPS',
    summary:
      'Observez les planètes et leurs faisceaux d’aspects glisser le long de leur orbite circulaire sans saccade.',
    highlights: [
      '8 styles de roues 2D (Astrolabe Royal, Parchemin, Atelier Blanc, Stellaire, Vitrail, Horlogerie, Cosmogramme 360°, Décans)',
      '3 orientations (ASC à gauche, 0° Bélier à gauche, MC en haut) et 4 styles de glyphes zodiacaux',
      'Curseur temporel continu (±24h, ±30j, ±1 an, ±5 ans), vitesses jusqu’à 1 an/s et bouton Now',
      'Boutons de saut (-1 an à +1 an) cliquables ou maintenus pour un défilement continu + fiche survol planète',
    ],
    keywords: 'roue svg 2d spacetime navigator curseur animation 60fps vitesse temps reel now',
    icon: Orbit,
    actionLabel: 'Ouvrir Roue & Spacetime',
    runAction: (a) => a.onOpenWheel2D(),
  },
  {
    id: 'cap-config-33-21',
    category: 'config',
    title: '33 Systèmes de Maisons, 21 Aspects, Déclinaisons & Dignités',
    badge: '33 · 21',
    summary:
      'Personnalisez chaque paramètre astronomique et chaque anneau de la roue depuis le tiroir Configuration.',
    highlights: [
      '33 domifications complètes : Placidus, Whole Sign, Koch, Regiomontanus, Campanus, Topocentrique, Alcabitius, etc.',
      'Filtrage individuel des 21 aspects majeurs et mineurs (Conjonction, Trigone, Quinconce, Quintile, Sesquicarré...)',
      'Tableau des Déclinaisons en direct (Parallèles et Contre-Parallèles en latitude équatoriale)',
      'Anneaux activables sur la roue : Décans I·II·III, Termes Égyptiens/Ptolémaïques, Dodécatémories (2°30’) et Polices',
    ],
    keywords: 'maisons 33 21 aspects declinaisons paralleles contre-paralleles decans termes dodecatemories polices',
    icon: SlidersHorizontal,
    actionLabel: 'Ouvrir Maisons · Aspects',
    runAction: (a) => a.onOpenConfig(),
  },
  {
    id: 'cap-datasheet',
    category: 'catalog',
    title: 'Catalogue Céleste & DataSheet : Étoiles Fixes & Astéroïdes',
    badge: '700+ · 26 000+',
    summary:
      'Explorez et épinglez sur la roue les corps secondaires, étoiles royales, lots hellénistiques et planètes naines.',
    highlights: [
      'Planètes classiques, Angles (ASC, MC, DSC, IC), Nœuds Lunaires & Nœuds Planétaires',
      'Parts Arabes / Lots (Part de Fortune, Part d’Esprit, Nécessité, Amour...) et Transneptuniens / Uraniens',
      'Base filtrable d’Étoiles Fixes (700 répertoriées : Aldébaran, Régulus, Spica, Sirius, Altaïr...) avec conjonctions & parans',
      'Recherche instantanée d’Astéroïdes & Planètes Naines (26 000+ corps : Chiron, Cérès, Pallas, Junon, Vesta, Éris, Sedna...)',
    ],
    keywords: 'catalogue datasheet etoiles fixes asteroides chiron ceres eris sedna parts arabes fortune lots uraniens',
    icon: Database,
    actionLabel: 'Explorer le DataSheet',
    runAction: (a) => a.onOpenDataSheet(),
  },
  {
    id: 'cap-interpretations',
    category: 'charts',
    title: 'Interprétations Complètes, Planètes en Maisons & BaZi Chinois',
    badge: 'Analyse',
    summary:
      'Cliquez sur n’importe quelle planète, maison ou aspect ou consultez la synthèse complète et ses traditions croisées.',
    highlights: [
      'Interprétation détaillée du Thème Natal seul : chaque planète (signe, maison, dignité, maîtrises), 12 Maisons et aspects',
      'Interprétation dédiée de la Révolution Solaire, des Transits, de la Synastrie et des Progressions',
      'Astrologie Chinoise BaZi intégrée : Pilier de l’année, rameaux terrestres et équilibre des 5 éléments (Wu Xing)',
      'Tableau des Signes Opposés & Complémentaires (axes 180°, trigones 120°, sextiles 60°) et jauges d’harmonie',
    ],
    keywords: 'interpretation bilan planete maison bazi chinois wu xing signes opposes complementaires synthese',
    icon: ListTree,
    actionLabel: 'Lire le Bilan complet',
    runAction: (a) => a.onOpenFullSummary(),
  },
  {
    id: 'cap-vr-3d',
    category: 'vr',
    title: 'Observatoire 3D, WebXR VR 360° & Réalité Mixte (Meta Quest 3)',
    badge: '3D · VR · MR',
    summary:
      'Immergez-vous au centre de la sphère céleste sur PC ou en casque Meta Quest avec ciel étoilé animé.',
    highlights: [
      'Sphère céleste 3D interactive sur PC (rotation orbite ou vue Centre 360°) avec pupitre flottant',
      'Mode WebXR VR 360° et Réalité Mixte Passthrough couleur (RM) compatible Meta Quest 3 / webcam PC',
      'Animations célestes activables : étoiles filantes, nébuleuses et aurores boréales',
      'Guide complet d’installation autonome Quest / APK SideQuest accessible à tout moment',
    ],
    keywords: '3d vr webxr meta quest realite mixte mr passthrough ciel animations etoiles filantes aurores',
    icon: Glasses,
    actionLabel: 'Passer en Observatoire 3D',
    runAction: (a) => a.onOpenWheel3D(),
  },
  {
    id: 'cap-voice-music',
    category: 'vr',
    title: 'Commande Vocale, Dictée & Musique Céleste 432 Hz',
    badge: 'Audio · Voix',
    summary:
      'Pilotez Uranie à la voix, dictez vos recherches et profitez d’ambiances musicales harmoniques pendant votre lecture.',
    highlights: [
      'Commandes vocales naturelles en français (ex : « Thème natal de Marie née le 15 mai 1988 à Lyon », « Transits », « Vue 2D »)',
      'Bouton micro de dictée intégré dans la recherche de villes, d’aide et de saisie du prénom',
      'Atelier audio avec visite guidée vocale complète et sélecteur d’ambiances musicales 432 Hz (Nocturne, Cristal, Harmonie)',
    ],
    keywords: 'voix micro commande vocale dictee musique 432 hz audio visite guidee atelier',
    icon: Music,
    actionLabel: 'Ouvrir Atelier Audio & Musique',
    runAction: (a) => a.onOpenAboutAudio(),
  },
  {
    id: 'cap-export-mail',
    category: 'export',
    title: 'Export PDF Vectoriel, Impression, Fiche HTML, WhatsApp & E-mail',
    badge: 'Partage',
    summary:
      'Générez un dossier astrologique A4 complet ou envoyez instantanément votre thème à un destinataire.',
    highlights: [
      'Conversion et téléchargement direct en PDF A4 haute netteté (roue vectorielle, capture 3D, tableaux, interprétations)',
      'Impression directe mise en page A4 et export autonome en Fiche HTML',
      'Partage pré-formaté vers WhatsApp et lien URL direct encodé (restaure tout le thème sans serveur)',
      'Compositeur E-mail intégré : saisie du destinataire, envoi Gmail Web, Outlook Web, mailto: ou copie complète',
    ],
    keywords: 'pdf imprimer html whatsapp email mail gmail outlook lien partager exporter',
    icon: Share2,
    actionLabel: 'Ouvrir Export & Partage',
    runAction: (a) => a.onOpenSharePrint(),
  },
  {
    id: 'cap-admin-security',
    category: 'config',
    title: 'Espace Admin & Sécurité Anti-Manipulation par Mot de Passe',
    badge: 'Sécurité',
    summary:
      'Protégez vos profils, réglages et exports par mot de passe SHA-256 ou activez le verrouillage plein écran.',
    highlights: [
      'Verrouillage granulaire : profils natals, configuration (33 maisons/21 aspects), navigation temporelle, exports et sortie',
      'Écran de verrouillage plein écran et verrouillage automatique après inactivité (5, 15 ou 30 min)',
      'Mot de passe haché en SHA-256 salé avec blocage anti-force brute et journal de sécurité local',
    ],
    keywords: 'admin securite mot de passe mdp verrouillage kiosque lecture seule protection',
    icon: ShieldCheck,
    actionLabel: 'Ouvrir Espace Admin',
    runAction: (a) => a.onOpenAdmin?.(),
  },
  {
    id: 'cap-intro-replay',
    category: 'vr',
    title: 'Cinématique Céleste — Revoir l’animation (1m 40s)',
    badge: '4 Mouvements',
    summary:
      'Plongez dans la séquence d’ouverture ésotérique en 4 mouvements : nébuleuse Ken Burns, géométrie sacrée, sceau lunaire et musique 432 Hz/528 Hz.',
    highlights: [
      '4 mouvements chorégraphiés : Éveil du Cosmos, Géométrie Sacrée, Cœur de l’Expérience et Appel au Voyage',
      'Particules d’or 60 ips sur Canvas 2D, tracé vectoriel en filigrane d’or et harpe céleste générée en temps réel',
      'Barre interactive permettant de mettre en pause, rejouer ou sauter directement vers n’importe quel mouvement',
    ],
    keywords: 'animation intro splash screen revoir cinematique 4 mouvements 432 hz 528 hz',
    icon: Film,
    actionLabel: 'Revoir l’animation',
    runAction: (a) => a.onOpenIntroReplay?.(),
  },
];

const SHORTCUTS = [
  { key: 'Clic planète / maison', desc: 'Ouvre son interprétation détaillée et illumine ses aspects.' },
  { key: 'Clic ligne d’aspect', desc: 'Met en évidence l’aspect sur la roue SVG 2D et dans la sphère 3D.' },
  { key: 'Maintenir ±1m / ±1j', desc: 'Fait défiler le temps en continu sans relâcher sur le Spacetime Navigator.' },
  { key: 'Touche H (Vue 3D)', desc: 'Replie ou déploie le pupitre de contrôle 3D pour dégager le ciel.' },
];

const QUICK_VOICES = [
  '« Thème natal de Marie née le 15 mai 1988 à Lyon »',
  '« Transits » · « Révolution solaire » · « En direct »',
  '« Montre Vénus » · « Vue 2D » · « Centre 360 »',
];

export const SoftwareGuideHelpView: React.FC<{
  actions: SoftwareGuideHelpActions;
  voiceModeEnabled: boolean;
}> = ({ actions, voiceModeEnabled }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HelpCategoryId>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CAPABILITIES.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.highlights.some((h) => h.toLowerCase().includes(q)) ||
        item.keywords.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-28 px-4 sm:px-6">
      <div className="mx-auto max-w-[1320px] space-y-5">
        {/* Hero Header */}
        <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-6 shadow-2xl shadow-black/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-200">
                <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
                <span>Guide Complet &amp; Récapitulatif du Logiciel · Uranie Cosmic Insights</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                Toutes les Possibilités d’Uranie
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Retrouvez ici l’inventaire complet des outils de calcul, systèmes de maisons,
                catalogues d’étoiles et d’astéroïdes, modes 2D/3D/VR, commandes vocales et
                options d’export PDF, WhatsApp ou E-mail. Chaque fiche permet d’ouvrir directement la fonction correspondante.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={actions.onOpenHome}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-amber-300/40 hover:text-white transition-all cursor-pointer"
              >
                <Home className="h-3.5 w-3.5 text-amber-300/80" />
                <span>Accueil</span>
              </button>
              {actions.onOpenTutorial && (
                <button
                  type="button"
                  onClick={actions.onOpenTutorial}
                  className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-3.5 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-amber-300" />
                  <span>Didacticiel pas à pas</span>
                </button>
              )}
              <button
                type="button"
                onClick={actions.onOpenAboutAudio}
                className="flex items-center gap-1.5 rounded-full border border-indigo-300/35 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-100 hover:border-amber-300/40 transition-all cursor-pointer"
              >
                <Volume2 className="h-3.5 w-3.5 text-amber-300" />
                <span>Visite guidée audio &amp; Musique</span>
              </button>
              <button
                type="button"
                onClick={actions.onOpenQuestGuide}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/85 via-amber-400/85 to-yellow-500/85 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Glasses className="h-3.5 w-3.5" />
                <span>Guide Meta Quest 3</span>
              </button>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { label: 'Modes de cartes', value: '12', accent: 'text-amber-200' },
              { label: 'Systèmes Maisons', value: '33', accent: 'text-sky-200' },
              { label: 'Aspects & Parallèles', value: '21 + 2', accent: 'text-purple-200' },
              { label: 'Étoiles & Astéroïdes', value: '26 700+', accent: 'text-emerald-200' },
              { label: 'Communes françaises', value: '35 000+', accent: 'text-amber-200' },
              { label: 'Roues SVG 2D', value: '8 styles', accent: 'text-indigo-200' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 px-3.5 py-2.5 text-center"
              >
                <div className={`font-display text-lg font-bold ${stat.accent}`}>{stat.value}</div>
                <div className="text-[11px] text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search & Category Filters */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-amber-300/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une possibilité (ex : 33 maisons, Chiron, e-mail, Meta Quest, voix, PDF...)"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                />
              </div>
              <VoiceDictationButton
                accent="gold"
                title="Dicter une recherche dans le guide du logiciel"
                onTranscript={(spoken) => setQuery(spoken)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', 'Toutes'],
                  ['charts', 'Thèmes & Analyses'],
                  ['wheel', 'Roue & Spacetime'],
                  ['config', '33 Maisons · 21 Aspects'],
                  ['catalog', 'Étoiles · Astéroïdes'],
                  ['vr', '3D · VR · Audio'],
                  ['export', 'PDF · WhatsApp · Mail'],
                ] as Array<[HelpCategoryId, string]>
              ).map(([catId, label]) => (
                <button
                  key={catId}
                  type="button"
                  onClick={() => setCategory(catId)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    category === catId
                      ? 'bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.28)]'
                      : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/35 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="cosmic-glass-card flex flex-col justify-between gap-4 rounded-3xl border border-amber-200/25 bg-[#151824]/75 backdrop-blur-xl p-5 shadow-2xl shadow-black/50"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-400/10 text-amber-300 shrink-0">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h2 className="font-display text-sm font-semibold tracking-wide text-amber-100 leading-snug">
                        {item.title}
                      </h2>
                    </div>
                    <span className="rounded-full border border-indigo-300/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-200 whitespace-nowrap shrink-0">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>

                  <ul className="space-y-1.5 text-[11.5px] text-slate-200 leading-relaxed">
                    {item.highlights.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <Sparkles className="h-3 w-3 text-amber-300/80 shrink-0 mt-1" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => item.runAction(actions)}
                    className="flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-400/12 px-4 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 hover:border-amber-300/60 transition-all cursor-pointer"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-white/10 bg-[#151824]/75 p-6 text-center text-sm text-slate-300">
              Aucune fonction ne correspond à « {query} ». Essayez un autre mot-clé ou cliquez sur « Toutes ».
            </div>
          )}
        </div>

        {/* Bottom Reference Row: Shortcuts, Voice Examples & Export Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="cosmic-glass-card rounded-3xl border border-white/10 bg-[#151824]/70 backdrop-blur-xl p-5 space-y-3">
            <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-amber-200">
              <Keyboard className="h-4 w-4 text-amber-300" />
              <span>Gestes &amp; Raccourcis</span>
            </div>
            <div className="space-y-2 text-xs">
              {SHORTCUTS.map((sc) => (
                <div
                  key={sc.key}
                  className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 px-3 py-2"
                >
                  <div className="font-semibold text-amber-100">{sc.key}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{sc.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="cosmic-glass-card rounded-3xl border border-white/10 bg-[#151824]/70 backdrop-blur-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-sky-200">
                <Mic className="h-4 w-4 text-sky-300" />
                <span>Exemples de Commandes Vocales</span>
              </div>
              <button
                type="button"
                onClick={actions.onToggleVoiceMode}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  voiceModeEnabled
                    ? 'border-rose-400/60 bg-rose-500/20 text-rose-100'
                    : 'border-sky-300/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25'
                }`}
              >
                {voiceModeEnabled ? 'Couper la voix' : 'Activer la voix'}
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {QUICK_VOICES.map((ex) => (
                <div
                  key={ex}
                  className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 px-3 py-2 text-slate-200"
                >
                  {ex}
                </div>
              ))}
            </div>
          </section>

          <section className="cosmic-glass-card rounded-3xl border border-white/10 bg-[#151824]/70 backdrop-blur-xl p-5 space-y-3">
            <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-emerald-200">
              <BookOpen className="h-4 w-4 text-emerald-300" />
              <span>Export &amp; Communication</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Le module <strong>PDF · E-mail</strong> réunit l’impression A4, le téléchargement PDF vectoriel, la fiche HTML, WhatsApp et le compositeur E-mail complet.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={actions.onOpenSharePrint}
                className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-3.5 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>PDF / Imprimer</span>
              </button>
              <button
                type="button"
                onClick={actions.onOpenSharePrint}
                className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 transition-all cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={actions.onOpenSharePrint}
                className="flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-500/15 px-3.5 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 transition-all cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>E-mail (Gmail / Outlook)</span>
              </button>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Layers className="h-3.5 w-3.5 text-amber-300/70 shrink-0" />
              <Stars className="h-3.5 w-3.5 text-indigo-300/70 shrink-0" />
              <span>Calculs 100 % locaux dans votre navigateur, y compris hors-ligne.</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
