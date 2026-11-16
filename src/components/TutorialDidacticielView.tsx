import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Compass,
  FileDown,
  GraduationCap,
  MapPin,
  Orbit,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AstroChart, HOUSE_SYSTEMS, NatalProfile } from '../astro/astroEngine';
import { CircularCosmicProgress } from './CosmicHomeView';
import {
  isSpeechSynthesisSupported,
  speakSingleFrenchUtterance,
  stopFrenchSpeech,
} from '../vr/audio';

export type TutorialTrackId = 'natal' | 'solarReturn' | 'transits';

export interface TutorialActions {
  onOpenNatalEditor: () => void;
  onOpenAscendantCalculator: () => void;
  onOpenSolarReturnSetup: () => void;
  onOpenSolarReturnWheel: () => void;
  onOpenTransitsWheel: () => void;
  onOpenHomeAlerts: () => void;
  onOpenConfig: () => void;
  onOpenFullSummary: () => void;
  onOpenSharePrint: () => void;
}

export interface TutorialDidacticielViewProps {
  draftProfile: NatalProfile;
  natalChart: AstroChart;
  solarReturnYear: number;
  solarReturnExactDate: Date | null;
  transitDate: Date;
  comparisonAspectsCount: number;
  actions: TutorialActions;
}

interface TutorialStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  explanation: string;
  checklist: string[];
  astrologerTip: string;
  primaryActionLabel: string;
  primaryAction: (a: TutorialActions) => void;
  secondaryActionLabel?: string;
  secondaryAction?: (a: TutorialActions) => void;
  icon: React.FC<{ className?: string }>;
}

interface TutorialTrack {
  id: TutorialTrackId;
  roman: string;
  title: string;
  shortTitle: string;
  tagline: string;
  durationLabel: string;
  accent: 'gold' | 'lavender' | 'glacier';
  icon: React.FC<{ className?: string }>;
  steps: TutorialStep[];
}

const PROGRESS_STORAGE_KEY = 'uranie_tutorial_progress_v1';

const TUTORIAL_TRACKS: TutorialTrack[] = [
  {
    id: 'natal',
    roman: 'Parcours I',
    title: 'Créer & Lire un Thème Natal',
    shortTitle: 'Thème Natal',
    tagline: 'De la saisie des coordonnées de naissance jusqu’à l’interprétation complète et l’export PDF.',
    durationLabel: '4 étapes · ~4 min',
    accent: 'gold',
    icon: Compass,
    steps: [
      {
        id: 'natal-1',
        number: '01',
        title: 'Identité, Date & Précision de l’Heure',
        subtitle: 'Poser la fondation temporelle du thème',
        explanation:
          'Ouvrez le panneau d’édition du profil natal pour nommer le thème et saisir la date et l’heure exactes de naissance. Une différence de 4 minutes décale l’Ascendant d’environ 1° : utilisez les ajustements rapides -1h / +1h ou le calculateur dédié si votre heure reste approximative.',
        checklist: [
          'Renseigner le prénom ou l’intitulé du thème et sauvegarder le profil',
          'Vérifier la date et l’heure civile exacte de naissance',
          'Contrôler l’heure d’Ascendant dans le calculateur en cas de doute',
        ],
        astrologerTip:
          'Le Calculateur « Ascendant seul » calcule automatiquement la plage horaire exacte de début et de fin du signe à l’horizon pour votre jour et votre ville.',
        primaryActionLabel: 'Ouvrir l’éditeur Natal',
        primaryAction: (a) => a.onOpenNatalEditor(),
        secondaryActionLabel: 'Calculateur d’Ascendant',
        secondaryAction: (a) => a.onOpenAscendantCalculator(),
        icon: CalendarClock,
      },
      {
        id: 'natal-2',
        number: '02',
        title: 'Lieu de Naissance & Communes Françaises',
        subtitle: 'Ancrer l’horizon et les 12 Maisons terrestres',
        explanation:
          'Le lieu géographique détermine l’orientation de l’Ascendant, du Milieu du Ciel et des 12 Maisons. Saisissez le nom d’une ville ou son code postal : Uranie interroge les 35 000+ communes françaises (avec secours hors-ligne et saisie libre Latitude / Longitude pour le monde entier).',
        checklist: [
          'Taper une commune ou un code postal (ex : 69001, Bordeaux, Ajaccio)',
          'Valider la proposition pour verrouiller Latitude et Longitude',
          'Sauvegarder le profil pour l’ajouter à votre liste persistante',
        ],
        astrologerTip:
          'Vous pouvez créer plusieurs profils (famille, proches, événements) et basculer entre eux instantanément depuis l’accueil ou la synastrie.',
        primaryActionLabel: 'Choisir le lieu dans Profil',
        primaryAction: (a) => a.onOpenNatalEditor(),
        icon: MapPin,
      },
      {
        id: 'natal-3',
        number: '03',
        title: 'Systèmes de Maisons, Roue SVG & Dignités',
        subtitle: 'Calibrer la géométrie astronomique de la carte',
        explanation:
          'Depuis le tiroir de Configuration avancée, sélectionnez l’un des 33 systèmes de maisons (Placidus, Whole Sign, Koch, Regiomontanus, Campanus…) et activez les anneaux traditionnels : Décans, Termes Égyptiens ou Ptolémaïques et Dodécatémories (2°30’).',
        checklist: [
          'Choisir le système de domification adapté à votre approche',
          'Filtrer les aspects majeurs ou mineurs parmi les 21 disponibles',
          'Afficher les anneaux de Décans / Termes selon vos besoins de lecture',
        ],
        astrologerTip:
          'En astrologie hellénistique, sélectionnez « Signes Entiers (Whole Sign) » avec l’anneau des Termes Égyptiens pour repérer le maître des bornes de chaque astre.',
        primaryActionLabel: 'Ouvrir Config Maisons & Aspects',
        primaryAction: (a) => a.onOpenConfig(),
        icon: SlidersHorizontal,
      },
      {
        id: 'natal-4',
        number: '04',
        title: 'Lire Planètes, Maisons & Exporter le Dossier',
        subtitle: 'De l’exploration interactive au bilan A4 complet',
        explanation:
          'Cliquez directement sur une planète, une maison ou une ligne d’aspect sur la roue SVG pour ouvrir son interprétation ciblée. Pour une lecture globale incluant toutes les planètes en maisons, les dignités et le BaZi chinois, ouvrez le Bilan complet puis générez un PDF, un message WhatsApp ou un E-mail.',
        checklist: [
          'Cliquer sur le Soleil, la Lune et l’Ascendant pour lire leur dynamique',
          'Ouvrir le Bilan complet pour la synthèse globale et les éléments',
          'Exporter la fiche en PDF A4 ou la partager par E-mail / WhatsApp',
        ],
        astrologerTip:
          'Le lien URL généré dans le module Partage encode l’intégralité du profil et de la configuration sans aucun compte ni serveur.',
        primaryActionLabel: 'Lire le Bilan complet',
        primaryAction: (a) => a.onOpenFullSummary(),
        secondaryActionLabel: 'PDF · E-mail · WhatsApp',
        secondaryAction: (a) => a.onOpenSharePrint(),
        icon: FileDown,
      },
    ],
  },
  {
    id: 'solarReturn',
    roman: 'Parcours II',
    title: 'Établir une Révolution Solaire',
    shortTitle: 'Rév. Solaire',
    tagline: 'Calculer l’instant exact du retour du Soleil et interpréter la carte annuelle superposée au Natal.',
    durationLabel: '4 étapes · ~3 min',
    accent: 'lavender',
    icon: Sun,
    steps: [
      {
        id: 'sr-1',
        number: '01',
        title: 'Calculer l’Instant Exact du Retour Solaire',
        subtitle: 'Repérer la seconde astronomique où le Soleil rejoint sa longitude natale',
        explanation:
          'La Révolution Solaire correspond au moment précis où le Soleil revient exactement au degré, à la minute et à la seconde qu’il occupait lors de votre naissance. Cet instant peut se produire la veille, le jour même ou le lendemain de votre date anniversaire.',
        checklist: [
          'Sélectionner le thème natal de référence comme profil actif',
          'Ouvrir l’onglet Auxiliaires puis choisir l’année de Révolution Solaire',
          'Lire la date et l’heure exacte calculées à la minute près',
        ],
        astrologerTip:
          'Un cycle annuel commence souvent à colorer l’atmosphère 2 à 3 mois avant la date anniversaire exacte : testez aussi l’année suivante en fin de cycle.',
        primaryActionLabel: 'Configurer la Rév. Solaire',
        primaryAction: (a) => a.onOpenSolarReturnSetup(),
        icon: Sun,
      },
      {
        id: 'sr-2',
        number: '02',
        title: 'Lieu de Séjour Anniversaire (Relocalisation RS)',
        subtitle: 'Adapter l’Ascendant et les Maisons annuelles à la ville réelle',
        explanation:
          'Contrairement au thème natal, la Révolution Solaire se calcule pour la ville où vous résidez au moment exact du retour du Soleil. Modifier cette ville réoriente l’Ascendant RS, le Milieu du Ciel et les placements planétaires en maisons pour toute l’année.',
        checklist: [
          'Rechercher la ville où vous passez votre anniversaire',
          'Observer le changement immédiat d’Ascendant et de Maisons annuelles',
          'Comparer si besoin votre ville natale et votre ville de séjour',
        ],
        astrologerTip:
          'L’axe Ascendant / Milieu du Ciel de Révolution Solaire révèle les priorités visibles et les objectifs majeurs de vos 12 prochains mois.',
        primaryActionLabel: 'Choisir la ville anniversaire',
        primaryAction: (a) => a.onOpenSolarReturnSetup(),
        icon: MapPin,
      },
      {
        id: 'sr-3',
        number: '03',
        title: 'Superposer la Double Roue RS / Natal',
        subtitle: 'Lire la rencontre entre le ciel annuel et la carte de naissance',
        explanation:
          'Passez sur la Roue SVG en mode Révolution Solaire : votre Thème Natal occupe le cercle intérieur tandis que la carte annuelle se déploie sur le cercle extérieur. Repérez dans quelle maison natale tombe l’Ascendant annuel, ainsi que la maison annuelle du Soleil.',
        checklist: [
          'Afficher la double roue Révolution Solaire sur Thème Natal',
          'Identifier la maison natale activée par l’Ascendant de RS',
          'Examiner les aspects rouges et bleus reliant les deux cercles',
        ],
        astrologerTip:
          'Une conjonction entre une planète annuelle et un angle natal (ASC ou MC) annonce presque toujours un événement charnière durant l’année.',
        primaryActionLabel: 'Ouvrir la Roue RS',
        primaryAction: (a) => a.onOpenSolarReturnWheel(),
        secondaryActionLabel: 'Lire l’analyse RS',
        secondaryAction: (a) => a.onOpenFullSummary(),
        icon: Orbit,
      },
      {
        id: 'sr-4',
        number: '04',
        title: 'Synthèse Annuelle & Comparatif Multi-Années',
        subtitle: 'Mettre l’année en perspective et conserver le rapport',
        explanation:
          'Ouvrez le Bilan complet pour lire la synthèse automatique de votre Révolution Solaire (dominante annuelle, secteurs sollicités, aspects clés), ou exportez-la en PDF / E-mail pour relire vos prévisions tout au long de l’année.',
        checklist: [
          'Consulter la rubrique Révolution Solaire dans le Bilan complet',
          'Explorer l’onglet Comparatif pour mettre deux années face à face',
          'Télécharger la fiche PDF annuelle ou l’envoyer par E-mail',
        ],
        astrologerTip:
          'Comparer deux Révolutions Solaires successives permet de voir immédiatement quelles planètes quittent un secteur et où se déplace votre élan.',
        primaryActionLabel: 'Ouvrir le Bilan annuel',
        primaryAction: (a) => a.onOpenFullSummary(),
        secondaryActionLabel: 'Exporter PDF / E-mail',
        secondaryAction: (a) => a.onOpenSharePrint(),
        icon: BookOpen,
      },
    ],
  },
  {
    id: 'transits',
    roman: 'Parcours III',
    title: 'Analyser les Transits & Mouvements',
    shortTitle: 'Transits',
    tagline: 'Suivre les planètes en temps réel à 60 ips avec le Spacetime Navigator et les alertes des 30 jours.',
    durationLabel: '4 étapes · ~3 min',
    accent: 'glacier',
    icon: Orbit,
    steps: [
      {
        id: 'tr-1',
        number: '01',
        title: 'Superposer le Ciel Actuel sur Votre Thème Natal',
        subtitle: 'Visualiser les dialogues en cours avec votre carte de naissance',
        explanation:
          'Le mode « Transits » maintient votre Thème Natal au centre et projette les positions astronomiques du moment choisi sur l’anneau extérieur. Les cordes tracées entre les deux cercles montrent immédiatement quelles promesses natales sont activées aujourd’hui.',
        checklist: [
          'Activer le mode Natal + Transits sur l’onglet Roue & Spacetime',
          'Repérer la position des planètes lentes (Jupiter à Pluton) dans vos maisons natales',
          'Cliquer sur une planète extérieure pour voir sa maison natale traversée',
        ],
        astrologerTip:
          'Les transits rapides (Lune, Mercure, Vénus) donnent le tempo quotidien, tandis que Saturne, Uranus, Neptune et Pluton dessinent les grands chapitres de vie.',
        primaryActionLabel: 'Voir la Roue des Transits',
        primaryAction: (a) => a.onOpenTransitsWheel(),
        icon: Orbit,
      },
      {
        id: 'tr-2',
        number: '02',
        title: 'Animer le Temps avec le Spacetime Navigator',
        subtitle: 'Curseur continu 60 ips, vitesses graduées & boutons maintenus',
        explanation:
          'Sous la roue, le Spacetime Navigator vous permet de faire glisser le curseur sur ±24 heures, ±30 jours, ±1 an ou ±5 ans sans aucune saccade. Lancez une vitesse d’animation (1m/s, 1h/s, 1j/s, 7j/s, 1M/s, 1A/s) ou maintenez les boutons ± pour dater un aspect exact à la minute.',
        checklist: [
          'Choisir une fenêtre temporelle (±30j ou ±1 an) et déplacer le curseur',
          'Tester la lecture fluide (Play) à 1j/s ou 7j/s',
          'Cliquer sur « Now » / « Ancrer » pour revenir à l’instant présent',
        ],
        astrologerTip:
          'Survolez directement une planète de transit sur la roue pendant l’animation pour lire sa longitude exacte et voir quand l’orbe descend sous 0°10’.',
        primaryActionLabel: 'Tester le Spacetime Navigator',
        primaryAction: (a) => a.onOpenTransitsWheel(),
        icon: Sparkles,
      },
      {
        id: 'tr-3',
        number: '03',
        title: 'Consulter les Alertes Transits des 30 Prochains Jours',
        subtitle: 'Anticiper entrées en maisons, aspects exacts & stations rétrogrades',
        explanation:
          'Dans l’onglet Home, Uranie scanne automatiquement les 30 prochains jours par rapport à votre thème natal actif : entrées de planètes dans une nouvelle maison (ex. Saturne en Maison VII), aspects exacts, changements de signes et stations ℞. Un clic sur « Voir sur la roue » cale la roue à l’heure exacte.',
        checklist: [
          'Ouvrir la section Alertes Transits dans l’onglet Home',
          'Filtrer par « Majeurs » ou « Entrées Maison » pour cibler les événements clés',
          'Cliquer sur « Voir sur la roue » sur une alerte pour l’inspecter en visuel',
        ],
        astrologerTip:
          'Marquez vos alertes importantes comme lues au fil du mois pour garder une vue claire des prochains passages imminents.',
        primaryActionLabel: 'Ouvrir les Alertes 30 Jours',
        primaryAction: (a) => a.onOpenHomeAlerts(),
        icon: Bell,
      },
      {
        id: 'tr-4',
        number: '04',
        title: 'Déclinaisons & Synthèse Prévisionnelle',
        subtitle: 'Affiner les aspects exacts, parallèles et lire l’interprétation',
        explanation:
          'Affinez l’affichage dans Configuration en cochant les aspects mineurs (quinconce, semi-sextile, sesquicarré…) et inspectez les Parallèles de déclinaison. Ouvrez enfin le Bilan complet pour lire la synthèse détaillée des transits à la date choisie.',
        checklist: [
          'Cliquer sur un aspect entre transit et natal pour isoler sa trajectoire',
          'Vérifier les Parallèles & Contre-parallèles dans Configuration',
          'Consulter ou imprimer le Bilan complet des transits à cette date',
        ],
        astrologerTip:
          'Un Parallèle de déclinaison (même latitude équatoriale nord ou sud) agit souvent avec une intensité comparable à une conjonction.',
        primaryActionLabel: 'Inspecter Déclinaisons',
        primaryAction: (a) => a.onOpenConfig(),
        secondaryActionLabel: 'Bilan des Transits',
        secondaryAction: (a) => a.onOpenFullSummary(),
        icon: SlidersHorizontal,
      },
    ],
  },
];

const ACCENT_PALETTE: Record<
  TutorialTrack['accent'],
  {
    borderActive: string;
    bgActive: string;
    textAccent: string;
    badge: string;
    buttonGradient: string;
  }
> = {
  gold: {
    borderActive: 'border-amber-300/60',
    bgActive: 'bg-amber-400/12',
    textAccent: 'text-amber-200',
    badge: 'border-amber-300/40 bg-amber-400/12 text-amber-200',
    buttonGradient: 'from-amber-400/95 via-amber-300/95 to-yellow-400/95 text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.35)]',
  },
  lavender: {
    borderActive: 'border-purple-300/60',
    bgActive: 'bg-purple-500/14',
    textAccent: 'text-purple-200',
    badge: 'border-purple-300/40 bg-purple-400/12 text-purple-200',
    buttonGradient: 'from-purple-400/90 via-fuchsia-300/90 to-indigo-300/90 text-slate-950 shadow-[0_0_24px_rgba(192,132,252,0.35)]',
  },
  glacier: {
    borderActive: 'border-sky-300/60',
    bgActive: 'bg-sky-500/14',
    textAccent: 'text-sky-200',
    badge: 'border-sky-300/40 bg-sky-400/12 text-sky-200',
    buttonGradient: 'from-sky-400/90 via-cyan-300/90 to-indigo-300/90 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)]',
  },
};

export const TutorialDidacticielView: React.FC<TutorialDidacticielViewProps> = ({
  draftProfile,
  natalChart,
  solarReturnYear,
  solarReturnExactDate,
  transitDate,
  comparisonAspectsCount,
  actions,
}) => {
  const [activeTrackId, setActiveTrackId] = useState<TutorialTrackId>('natal');
  const [activeStepIndexByTrack, setActiveStepIndexByTrack] = useState<Record<TutorialTrackId, number>>({
    natal: 0,
    solarReturn: 0,
    transits: 0,
  });
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });
  const [speakingStepId, setSpeakingStepId] = useState<string | null>(null);
  const speechSupported = useMemo(() => isSpeechSynthesisSupported(), []);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(completedStepIds));
    } catch {
      // Ignore storage errors
    }
  }, [completedStepIds]);

  useEffect(() => {
    return () => {
      stopFrenchSpeech();
    };
  }, []);

  const activeTrack = TUTORIAL_TRACKS.find((t) => t.id === activeTrackId) ?? TUTORIAL_TRACKS[0];
  const activeStepIndex = activeStepIndexByTrack[activeTrack.id] ?? 0;
  const activeStep = activeTrack.steps[activeStepIndex] ?? activeTrack.steps[0];
  const palette = ACCENT_PALETTE[activeTrack.accent];

  const completedSet = useMemo(() => new Set(completedStepIds), [completedStepIds]);
  const totalSteps = TUTORIAL_TRACKS.reduce((sum, tr) => sum + tr.steps.length, 0);
  const totalCompletedCount = TUTORIAL_TRACKS.reduce(
    (sum, tr) => sum + tr.steps.filter((s) => completedSet.has(s.id)).length,
    0
  );
  const overallPercent = Math.round((totalCompletedCount / Math.max(1, totalSteps)) * 100);

  const trackCompletedCount = activeTrack.steps.filter((s) => completedSet.has(s.id)).length;
  const trackPercent = Math.round((trackCompletedCount / activeTrack.steps.length) * 100);

  const setActiveStepIndex = (idx: number) => {
    const bounded = Math.max(0, Math.min(activeTrack.steps.length - 1, idx));
    setActiveStepIndexByTrack((prev) => ({ ...prev, [activeTrack.id]: bounded }));
  };

  const toggleStepComplete = (stepId: string) => {
    setCompletedStepIds((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const handleMarkAndNext = () => {
    if (!completedSet.has(activeStep.id)) {
      setCompletedStepIds((prev) => [...prev, activeStep.id]);
    }
    if (activeStepIndex < activeTrack.steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  const handleResetProgress = () => {
    stopFrenchSpeech();
    setSpeakingStepId(null);
    setCompletedStepIds([]);
    setActiveStepIndexByTrack({ natal: 0, solarReturn: 0, transits: 0 });
  };

  const handleToggleSpeechStep = (step: TutorialStep) => {
    if (!speechSupported) return;
    if (speakingStepId === step.id) {
      stopFrenchSpeech();
      setSpeakingStepId(null);
      return;
    }
    const narrationText = `${activeTrack.shortTitle}, étape ${step.number} : ${step.title}. ${step.explanation} Astuce d'astrologue : ${step.astrologerTip}`;
    const started = speakSingleFrenchUtterance(narrationText, {
      onStart: () => setSpeakingStepId(step.id),
      onEnd: () => setSpeakingStepId((cur) => (cur === step.id ? null : cur)),
      onError: () => setSpeakingStepId(null),
    });
    if (started) {
      setSpeakingStepId(step.id);
    }
  };

  const sun = natalChart.planets.find((p) => p.id === 'sun');
  const moon = natalChart.planets.find((p) => p.id === 'moon');
  const houseSystemMeta = HOUSE_SYSTEMS.find((h) => h.id === draftProfile.houseSystem);

  const fmtDateTime = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);

  const StepIcon = activeStep.icon;
  const isCurrentCompleted = completedSet.has(activeStep.id);

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1260px] space-y-5">
        {/* Hero Header + Mastery Ring */}
        <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/78 backdrop-blur-xl p-6 sm:p-7 shadow-[0_18px_55px_rgba(0,0,0,0.62)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-200/90">
                <GraduationCap className="h-4 w-4 text-amber-300 shrink-0" />
                <span>Didacticiel Interactif</span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span>Thème Natal, Révolution Solaire &amp; Transits</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                Maîtrisez Vos Cartes du Ciel
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-amber-100/85 leading-relaxed">
                Trois parcours guidés pas à pas pour passer de la saisie astronomique à la lecture astrologique de précision, directement connectés à vos outils actifs.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0c101d]/80 px-5 py-3.5 shrink-0">
              <CircularCosmicProgress
                percentage={Math.max(8, overallPercent)}
                color={activeTrack.accent}
              />
              <div className="space-y-1">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Progression Globale
                </div>
                <div className="font-mono-tabular text-sm font-semibold text-amber-100">
                  {totalCompletedCount} / {totalSteps} étapes validées
                </div>
                {totalCompletedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3 Track Selector Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {TUTORIAL_TRACKS.map((track) => {
              const Icon = track.icon;
              const isSelected = track.id === activeTrack.id;
              const trPal = ACCENT_PALETTE[track.accent];
              const doneInTrack = track.steps.filter((s) => completedSet.has(s.id)).length;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setActiveTrackId(track.id)}
                  className={`cosmic-glass-card text-left rounded-2xl border p-4 cursor-pointer ${
                    isSelected
                      ? `${trPal.borderActive} ${trPal.bgActive} shadow-[0_0_28px_rgba(251,191,36,0.12)]`
                      : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                          isSelected
                            ? `${trPal.borderActive} ${trPal.bgActive} ${trPal.textAccent}`
                            : 'border-white/15 bg-white/[0.04] text-amber-200/80'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400">
                          {track.roman} · {track.durationLabel}
                        </div>
                        <div className="font-display text-sm font-semibold tracking-wider text-amber-100">
                          {track.shortTitle}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-tabular text-xs font-semibold text-amber-200">
                      {doneInTrack}/{track.steps.length}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300 line-clamp-2">
                    {track.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Context Bar Showing Actual User Data for the Selected Track */}
        <section className="cosmic-glass-panel rounded-2xl border border-white/10 bg-[#101423]/85 backdrop-blur-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {activeTrack.id === 'natal' && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
                <span className="font-semibold text-amber-200">Votre thème actif :</span>
                <span>{draftProfile.name.trim() || 'Thème sans nom'}</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>{natalChart.cityName}</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span className="font-mono-tabular">
                  ASC {natalChart.ascSign.symbol} {natalChart.ascSign.name}
                </span>
                {sun && (
                  <>
                    <span aria-hidden="true" className="text-white/25">·</span>
                    <span className="font-mono-tabular">
                      ☉ {sun.formattedDeg} {sun.sign.name}
                    </span>
                  </>
                )}
                {moon && (
                  <>
                    <span aria-hidden="true" className="text-white/25">·</span>
                    <span>
                      ☽ {moon.sign.name} (Maison {natalChart.houses[moon.house - 1]?.roman ?? moon.house})
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>{houseSystemMeta?.shortName ?? 'Placidus'}</span>
              </div>
              <button
                type="button"
                onClick={actions.onOpenNatalEditor}
                className="text-xs font-semibold text-amber-200 hover:text-amber-100 underline underline-offset-4 cursor-pointer whitespace-nowrap"
              >
                Éditer ce profil
              </button>
            </>
          )}

          {activeTrack.id === 'solarReturn' && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
                <span className="font-semibold text-purple-200">Révolution Solaire active :</span>
                <span className="font-mono-tabular">Année {solarReturnYear}</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>
                  Retour exact :{' '}
                  <strong className="font-mono-tabular text-amber-100">
                    {solarReturnExactDate ? fmtDateTime(solarReturnExactDate) : '—'}
                  </strong>
                </span>
                {sun && (
                  <>
                    <span aria-hidden="true" className="text-white/25">·</span>
                    <span className="font-mono-tabular">
                      Soleil natal visé : {sun.formattedDeg} {sun.sign.name}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={actions.onOpenSolarReturnWheel}
                className="text-xs font-semibold text-purple-200 hover:text-purple-100 underline underline-offset-4 cursor-pointer whitespace-nowrap"
              >
                Ouvrir la roue RS {solarReturnYear}
              </button>
            </>
          )}

          {activeTrack.id === 'transits' && (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
                <span className="font-semibold text-sky-200">Ciel de Transit actif :</span>
                <span className="font-mono-tabular text-amber-100">{fmtDateTime(transitDate)}</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>Base natale : {draftProfile.name.trim() || 'Thème actif'}</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span className="font-mono-tabular">
                  {comparisonAspectsCount} aspect{comparisonAspectsCount > 1 ? 's' : ''} croisé{comparisonAspectsCount > 1 ? 's' : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={actions.onOpenTransitsWheel}
                className="text-xs font-semibold text-sky-200 hover:text-sky-100 underline underline-offset-4 cursor-pointer whitespace-nowrap"
              >
                Ouvrir Roue &amp; Spacetime
              </button>
            </>
          )}
        </section>

        {/* Two-Zone Interactive Tutorial Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Zone: Step Rail & Track Progress (4 cols) */}
          <aside className="cosmic-glass-panel lg:col-span-4 rounded-3xl border border-amber-200/25 bg-[#151824]/75 backdrop-blur-xl p-5 shadow-2xl shadow-black/50 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider ${palette.textAccent}`}>
                    {activeTrack.roman}
                  </div>
                  <h2 className="font-display text-base font-semibold text-amber-100 tracking-wide">
                    {activeTrack.title}
                  </h2>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-slate-200">
                  {trackPercent}%
                </span>
              </div>

              <ol className="space-y-2.5">
                {activeTrack.steps.map((step, idx) => {
                  const isActive = idx === activeStepIndex;
                  const isDone = completedSet.has(step.id);
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className={`w-full text-left flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer ${
                          isActive
                            ? `${palette.borderActive} ${palette.bgActive} shadow-lg shadow-black/30`
                            : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono-tabular text-xs font-bold shrink-0 mt-0.5 ${
                            isDone
                              ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                              : isActive
                                ? `${palette.borderActive} ${palette.bgActive} ${palette.textAccent}`
                                : 'border-white/15 bg-white/[0.04] text-slate-400'
                          }`}
                        >
                          {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-[13px] font-semibold text-amber-100 leading-snug">
                            {step.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {step.subtitle}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-purple-400 to-sky-400 transition-all duration-500"
                  style={{ width: `${Math.max(4, trackPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Progression de ce parcours</span>
                <span className="font-mono-tabular text-slate-200">
                  {trackCompletedCount} / {activeTrack.steps.length} validées
                </span>
              </div>
            </div>
          </aside>

          {/* Right Zone: Active Step Spotlight Stage (8 cols) */}
          <section className="cosmic-glass-panel lg:col-span-8 rounded-3xl border border-amber-200/30 bg-[#151824]/80 backdrop-blur-xl p-6 sm:p-7 shadow-2xl shadow-black/50 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-start gap-3.5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${palette.badge}`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`font-semibold ${palette.textAccent}`}>
                        Étape {activeStep.number} / 0{activeTrack.steps.length}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeStep.subtitle}</span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-semibold tracking-wide text-amber-100">
                      {activeStep.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => handleToggleSpeechStep(activeStep)}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        speakingStepId === activeStep.id
                          ? 'border-rose-300/60 bg-rose-500/20 text-rose-100'
                          : 'border-white/15 bg-white/[0.04] text-slate-200 hover:border-amber-300/45 hover:text-amber-100'
                      }`}
                    >
                      {speakingStepId === activeStep.id ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5" />
                          <span>Arrêter la lecture</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-amber-300" />
                          <span>Écouter l’étape</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleStepComplete(activeStep.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isCurrentCompleted
                        ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-100'
                        : 'border-white/15 bg-white/[0.04] text-slate-200 hover:border-emerald-300/45'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isCurrentCompleted ? 'Étape validée' : 'Marquer compris'}</span>
                  </button>
                </div>
              </div>

              {/* Main Pedagogical Prose */}
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-200 max-w-3xl">
                {activeStep.explanation}
              </p>

              {/* Actionable Checklist */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-200/85">
                  Points clés à vérifier
                </div>
                <ul className="space-y-2">
                  {activeStep.checklist.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-[#0b0e19]/75 px-4 py-2.5 text-xs sm:text-[13px] text-slate-200 leading-relaxed"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300/85 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Astrologer Callout */}
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/[0.06] px-4 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-200">
                  Astuce d’astrologue
                </div>
                <p className="mt-1 font-serif italic text-sm sm:text-base text-amber-100/90 leading-relaxed">
                  « {activeStep.astrologerTip} »
                </p>
              </div>
            </div>

            {/* Bottom Step Actions & Prev/Next Footer */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => activeStep.primaryAction(actions)}
                  className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-5 py-2.5 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap ${palette.buttonGradient}`}
                >
                  <span>{activeStep.primaryActionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {activeStep.secondaryAction && activeStep.secondaryActionLabel && (
                  <button
                    type="button"
                    onClick={() => activeStep.secondaryAction?.(actions)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-300/45 hover:text-amber-100 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>{activeStep.secondaryActionLabel}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-amber-300/40 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Précédent</span>
                </button>

                {activeStepIndex < activeTrack.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleMarkAndNext}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer"
                  >
                    <span>Valider &amp; Suivant</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCurrentCompleted) toggleStepComplete(activeStep.id);
                      const nextTrack: TutorialTrackId =
                        activeTrack.id === 'natal'
                          ? 'solarReturn'
                          : activeTrack.id === 'solarReturn'
                            ? 'transits'
                            : 'natal';
                      setActiveTrackId(nextTrack);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/45 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30 transition-all cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>
                      {activeTrack.id === 'transits' ? 'Revenir au Thème Natal' : 'Parcours suivant'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
