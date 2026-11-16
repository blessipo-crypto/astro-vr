import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Glasses,
  HelpCircle,
  ListTree,
  Play,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import { ChartMode } from '../astro/astroEngine';
import {
  isSpeechSynthesisSupported,
  speakSingleFrenchUtterance,
  stopFrenchSpeech,
} from '../vr/audio';
import { VoiceDictationButton } from './VoiceDictationButton';

export type HelpTargetTab = 'natal' | 'derived' | 'aspects' | 'settings' | 'help';

export interface InteractiveHelpActions {
  onSwitchTab: (tab: HelpTargetTab) => void;
  onFocusNatalName: () => void;
  onSetMode: (mode: ChartMode) => void;
  onSetViewDimension: (dim: '2d' | '3d') => void;
  onEnableAllSkyAnimations: () => void;
  onOpenAscendantCalculator: () => void;
  onOpenFullSummary: () => void;
  onOpenQuestGuide: () => void;
  onOpenSharePrint: () => void;
  onOpenAudioIntro: () => void;
  viewDimension: '2d' | '3d';
}

type HelpCategory = 'all' | 'start' | 'cycles' | 'display' | 'vr' | 'export';

interface GuidedStep {
  id: string;
  title: string;
  summary: string;
  detail: string;
  voiceText: string;
  actionLabel: string;
  runAction: (a: InteractiveHelpActions) => void;
}

interface HelpTopic {
  id: string;
  category: Exclude<HelpCategory, 'all'>;
  title: string;
  answer: string;
  keywords: string;
  actionLabel: string;
  runAction: (a: InteractiveHelpActions) => void;
}

const GUIDED_STEPS: GuidedStep[] = [
  {
    id: 'step-natal',
    title: '1. Saisir le prénom, la date et le lieu',
    summary: 'Ouvrez Thème Natal pour renseigner le prénom, l’heure exacte et la ville ou code postal.',
    detail:
      'Saisissez le prénom dans la case « Prénom », choisissez Jour / Mois / Année / Heure, puis cherchez une ville ou un code postal français (ex: 75008). Cliquez ensuite sur Enregistrer.',
    voiceText:
      'Étape 1 : dans l’onglet Thème Natal, entrez un prénom, la date, l’heure exacte et la ville ou code postal de naissance, puis cliquez sur Enregistrer.',
    actionLabel: 'Aller au Thème Natal',
    runAction: (a) => {
      a.onSetMode('natal');
      a.onSwitchTab('natal');
      window.setTimeout(() => a.onFocusNatalName(), 120);
    },
  },
  {
    id: 'step-asc',
    title: '2. Calculer l’Ascendant seul & sa plage horaire',
    summary: 'Outil rapide dédié à l’Ascendant, au Descendant, au Milieu du Ciel et aux heures limites.',
    detail:
      'Parfait si l’heure de naissance est approximative : cet outil affiche l’Ascendant exact ainsi que le créneau horaire complet durant lequel ce signe reste à l’horizon.',
    voiceText:
      'Étape 2 : le calculateur d’Ascendant seul calcule instantanément l’Ascendant, le Descendant, le Milieu du Ciel et la plage horaire exacte de changement de signe.',
    actionLabel: 'Ouvrir Ascendant seul',
    runAction: (a) => a.onOpenAscendantCalculator(),
  },
  {
    id: 'step-cycles',
    title: '3. Explorer Transits, Révolution Solaire & Comparatifs',
    summary: 'Superposez votre thème natal avec le ciel du jour, votre année d’anniversaire ou un proche.',
    detail:
      'Choisissez Transits, Rév. Solaire, Progressions, Synastrie ou Comparatifs dans la barre du haut, puis cliquez sur Animer pour voir les planètes évoluer en direct.',
    voiceText:
      'Étape 3 : sélectionnez Transits, Révolution Solaire, Révolution Lunaire ou Comparatifs en haut du panneau pour superposer deux roues et animer les planètes dans le temps.',
    actionLabel: 'Voir Rév. Solaire & Transits',
    runAction: (a) => {
      a.onSetMode('solarReturn');
      a.onSwitchTab('derived');
    },
  },
  {
    id: 'step-2d-3d',
    title: '4. Choisir la vue 2D PC (8 roues) ou 3D + Animations célestes',
    summary: 'Travaillez en carte 2D haute précision sur PC ou en sphère 3D avec ciel animé.',
    detail:
      'L’onglet Réglages regroupe la bascule 2D/3D, les 8 styles de roues 2D (Astrolabe, Parchemin, Atelier Blanc...), les 3 orientations et les animations célestes (étoiles filantes, nébuleuses, aurores boréales).',
    voiceText:
      'Étape 4 : dans Réglages ou en haut à gauche, passez à tout instant de la sphère 3D à la carte 2D spéciale PC dotée de huit roues et trois orientations, et gérez les animations du ciel.',
    actionLabel: 'Ouvrir Réglages (2D / 3D / Ciel)',
    runAction: (a) => a.onSwitchTab('settings'),
  },
  {
    id: 'step-read-pdf',
    title: '5. Lire les interprétations & Exporter en PDF / Lien',
    summary: 'Cliquez sur n’importe quelle planète, maison ou aspect, ou ouvrez le bilan complet.',
    detail:
      'Chaque planète et chaque maison est cliquable en 2D comme en 3D. Le bouton « Interprétation & Bilan » synthétise tout le thème, imprimable en PDF ou partageable par lien/QR.',
    voiceText:
      'Étape 5 : cliquez sur une planète, une maison ou un aspect pour lire son interprétation, puis ouvrez Interprétation et Bilan ou PDF et Lien pour imprimer ou partager.',
    actionLabel: 'Ouvrir Interprétation & Bilan',
    runAction: (a) => a.onOpenFullSummary(),
  },
  {
    id: 'step-vr',
    title: '6. Lancer sur Meta Quest 3 (VR 360° & Réalité Mixte)',
    summary: 'Utilisez le Navigateur Meta Quest sans câble ou installez le nouvel APK signé.',
    detail:
      'Sur Meta Quest 3, ouvrez l’URL GitHub Pages dans le navigateur intégré et cliquez sur « Entrer en VR » ou « Réalité Mixte ». Pour le sideload SideQuest, consultez le guide d’installation.',
    voiceText:
      'Étape 6 : sur Meta Quest, ouvrez directement Uranie VR dans le Navigateur Quest pour la VR 360 degrés et la Réalité Mixte, ou suivez le guide APK pour l’installation autonome.',
    actionLabel: 'Ouvrir le guide Quest 3',
    runAction: (a) => a.onOpenQuestGuide(),
  },
];

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'natal-create',
    category: 'start',
    title: 'Créer ou modifier un thème avec prénom',
    answer:
      'Allez dans « Thème Natal », saisissez le prénom, l’heure, la date et cherchez une ville ou un code postal (ex : 69002). Cliquez sur « Enregistrer » pour le conserver, ou « Nouveau thème » pour en ajouter un autre.',
    keywords: 'prenom profil natal enregistrer creer ville code postal',
    actionLabel: 'Ouvrir Thème Natal',
    runAction: (a) => {
      a.onSwitchTab('natal');
      window.setTimeout(() => a.onFocusNatalName(), 120);
    },
  },
  {
    id: 'asc-only',
    category: 'start',
    title: 'Calculer uniquement l’Ascendant',
    answer:
      'Cliquez sur « Ascendant seul » : vous obtenez l’Ascendant exact, le Descendant, le Milieu du Ciel, le signe, le décan ainsi que l’heure de début et de fin du signe si l’heure de naissance est incertaine.',
    keywords: 'ascendant seul calcul heure debut fin signe descendant milieu ciel',
    actionLabel: 'Calculer l’Ascendant',
    runAction: (a) => a.onOpenAscendantCalculator(),
  },
  {
    id: 'view-2d',
    category: 'display',
    title: 'Afficher la vue 2D sur PC & choisir parmi 8 roues',
    answer:
      'Cliquez sur « 2D » en haut à gauche (ou dans Réglages). Vous pouvez choisir 8 styles de roues (Astrolabe, Parchemin, Atelier Blanc, Stellaire, Vitrail, Horlogerie, Cosmogramme, Décans) et 3 orientations (ASC à gauche, 0° Bélier, MC en haut).',
    keywords: '2d pc roue style parchemin blanc orientation aries ascendant decans',
    actionLabel: 'Basculer en 2D PC',
    runAction: (a) => a.onSetViewDimension(a.viewDimension === '2d' ? '3d' : '2d'),
  },
  {
    id: 'sky-anims',
    category: 'display',
    title: 'Voir ou désactiver les animations dans le ciel',
    answer:
      'Les étoiles filantes, nébuleuses et aurores boréales apparaissent en 3D et en 2D sur PC. Dans « Réglages », vous pouvez activer ou désactiver chaque animation séparément ou tout couper en un clic.',
    keywords: 'animations ciel etoile filante nebuleuse aurore boreale desactiver',
    actionLabel: 'Activer les 3 & ouvrir Réglages',
    runAction: (a) => {
      a.onEnableAllSkyAnimations();
      a.onSwitchTab('settings');
    },
  },
  {
    id: 'western-chinese',
    category: 'display',
    title: 'Passer en astrologie Chinoise ou changer les signes',
    answer:
      'Dans l’onglet « Réglages », basculez entre « Occidental » et « Chinois 龍 » et choisissez 4 styles de glyphes (Figuratif, Calligraphique, Sceau Antique, Gravé Or).',
    keywords: 'chinois occidental glyphes signes dragon style',
    actionLabel: 'Aller aux Réglages',
    runAction: (a) => a.onSwitchTab('settings'),
  },
  {
    id: 'sr-transits',
    category: 'cycles',
    title: 'Transits en direct, Révolution Solaire & Comparatifs',
    answer:
      'Choisissez le mode souhaité dans la rangée supérieure (Transits, Rév. Solaire, Rév. Lunaire, Progressions, Synastrie, Comparatifs) puis ajustez l’année, le lieu d’anniversaire ou la vitesse d’animation.',
    keywords: 'transits revolution solaire lunaire progressions synastrie comparatif animer',
    actionLabel: 'Ouvrir Cycles & Comparatifs',
    runAction: (a) => {
      a.onSetMode('transits');
      a.onSwitchTab('derived');
    },
  },
  {
    id: 'aspects-filter',
    category: 'cycles',
    title: 'Filtrer et illuminer un aspect (Conjonction, Trigone, Carré...)',
    answer:
      'Ouvrez l’onglet « Aspects » pour filtrer (Harmonieux, Tensions, Comparatif) et cliquez sur n’importe quel aspect : son faisceau s’illumine instantanément sur la roue 2D comme dans la sphère 3D.',
    keywords: 'aspect conjonction trigone carre opposition sextile filtrer',
    actionLabel: 'Voir les Aspects',
    runAction: (a) => a.onSwitchTab('aspects'),
  },
  {
    id: 'quest-sideload',
    category: 'vr',
    title: 'Sideload Meta Quest / Erreur SideQuest (code 1) / Passthrough',
    answer:
      'Si SideQuest affiche « pm install -r ... exited with code 1 », désinstallez l’ancienne version sur le casque (Sources inconnues -> Désinstaller) avant d’installer le nouvel APK unifié, ou ouvrez directement GitHub Pages dans le Navigateur Quest.',
    keywords: 'quest sideload apk sidequest erreur code 1 vr mr realite mixte passthrough',
    actionLabel: 'Ouvrir Guide Quest 3',
    runAction: (a) => a.onOpenQuestGuide(),
  },
  {
    id: 'pdf-share',
    category: 'export',
    title: 'Imprimer en PDF ou partager par lien / QR Code',
    answer:
      'Cliquez sur « PDF / Lien » en haut à droite pour générer une fiche imprimable complète avec roue et interprétations, ou copier un lien direct contenant tout votre thème.',
    keywords: 'pdf imprimer partager lien qr code exporter',
    actionLabel: 'Ouvrir PDF / Lien',
    runAction: (a) => a.onOpenSharePrint(),
  },
  {
    id: 'audio-intro',
    category: 'start',
    title: 'Réécouter l’introduction vocale avec musique ésotérique',
    answer:
      'Relancez à tout moment la présentation audio complète expliquant toutes les fonctionnalités du logiciel sur fond de musique harmonique à 136,1 Hz.',
    keywords: 'voix audio presentation musique esoterique introduction parler ecouter',
    actionLabel: 'Lancer l’intro audio',
    runAction: (a) => a.onOpenAudioIntro(),
  },
  {
    id: 'voice-control',
    category: 'start',
    title: 'Piloter l’application à la voix & Dictée de recherche (En option)',
    answer:
      'Activez « Voix » en haut ou dans Réglages pour commander Uranie à la voix (ex : « Thème natal de Marie née le 15 mai 1988 à Lyon », « Transits », « Cherche Saint-Malo », « Montre Vénus », « Vue 2D », « Centre 360 »). Chaque champ de recherche possède aussi un bouton micro optionnel.',
    keywords: 'voix micro dictee reconnaissance vocale parler recherche commande',
    actionLabel: 'Ouvrir Réglages Voix',
    runAction: (a) => a.onSwitchTab('settings'),
  },
];

const QUICK_GLOSSARY = [
  {
    term: 'Ascendant (ASC)',
    def: 'Signe qui se levait à l’horizon Est à la minute exacte de naissance : manière d’aborder la vie, allure et Maison I.',
  },
  {
    term: 'Milieu du Ciel (MC)',
    def: 'Point le plus élevé du thème (cuspide de la Maison X) : vocation, réalisations publiques et trajectoire sociale.',
  },
  {
    term: 'Révolution Solaire (RS)',
    def: 'Carte dressée pour la seconde exacte où le Soleil revient à sa longitude natale chaque année (valable d’anniversaire à anniversaire).',
  },
  {
    term: 'Aspects harmonieux vs tendus',
    def: 'Trigone (120°) et Sextile (60°) fluidifient les énergies ; Carré (90°) et Opposition (180°) créent des défis moteurs ; Conjonction (0°) fusionne.',
  },
];

interface InteractiveHelpTabProps {
  actions: InteractiveHelpActions;
  showVoiceDictation?: boolean;
}

export const InteractiveHelpTab: React.FC<InteractiveHelpTabProps> = ({
  actions,
  showVoiceDictation = true,
}) => {
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<HelpCategory>('all');
  const [speakingStepId, setSpeakingStepId] = useState<string | null>(null);
  const [showGlossary, setShowGlossary] = useState<boolean>(false);

  const speechOk = isSpeechSynthesisSupported();
  const currentStep = GUIDED_STEPS[stepIdx];

  useEffect(() => {
    return () => {
      stopFrenchSpeech();
    };
  }, []);

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HELP_TOPICS.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.answer.toLowerCase().includes(q) ||
        t.keywords.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const handleSpeakStep = (step: GuidedStep) => {
    if (speakingStepId === step.id) {
      stopFrenchSpeech();
      setSpeakingStepId(null);
      return;
    }
    const ok = speakSingleFrenchUtterance(step.voiceText, {
      onStart: () => setSpeakingStepId(step.id),
      onEnd: () => setSpeakingStepId(null),
      onError: () => setSpeakingStepId(null),
    });
    if (ok) setSpeakingStepId(step.id);
  };

  return (
    <div className="mt-3 max-h-[46vh] overflow-y-auto cosmic-scroll pr-1 space-y-3">
      {/* 1. Assistant interactif pas à pas */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-3.5 shadow-xl shadow-black/40 hover:border-amber-300/30 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300/80" />
            <span className="font-display text-xs tracking-wider uppercase font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
              Assistant pas-à-pas ({stepIdx + 1}/{GUIDED_STEPS.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {speechOk && (
              <button
                type="button"
                onClick={() => handleSpeakStep(currentStep)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer ${
                  speakingStepId === currentStep.id
                    ? 'border-sky-300/60 bg-sky-400/20 text-white'
                    : 'border-white/15 bg-white/[0.04] text-sky-200 hover:border-amber-300/35'
                }`}
              >
                {speakingStepId === currentStep.id ? (
                  <Square className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
                <span>{speakingStepId === currentStep.id ? 'Stop voix' : 'Écouter'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={actions.onOpenAudioIntro}
              className="flex items-center gap-1 rounded-full border border-amber-300/35 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-amber-200 hover:border-amber-300/60 hover:bg-amber-400/15 transition-all duration-300 cursor-pointer"
            >
              <Play className="w-3 h-3 text-amber-300/80" />
              <span>Visite audio + musique</span>
            </button>
          </div>
        </div>

        {/* Sélecteur d'étapes numérotées */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {GUIDED_STEPS.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                stopFrenchSpeech();
                setSpeakingStepId(null);
                setStepIdx(idx);
              }}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-300 cursor-pointer ${
                idx === stepIdx
                  ? 'bg-gradient-to-r from-amber-500/85 via-amber-400/85 to-yellow-500/85 text-slate-950 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:border-amber-300/30 hover:text-white'
              }`}
            >
              Étape {idx + 1}
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-amber-100">{currentStep.title}</div>
            <p className="text-[11px] text-slate-200 leading-relaxed">{currentStep.detail}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => {
                stopFrenchSpeech();
                setSpeakingStepId(null);
                setStepIdx((i) => Math.max(0, i - 1));
              }}
              aria-label="Étape précédente"
              className="rounded-full border border-white/15 bg-white/[0.04] p-1.5 text-slate-300 hover:border-amber-300/30 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => currentStep.runAction(actions)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.28)] hover:shadow-[0_0_26px_rgba(245,158,11,0.48)] hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{currentStep.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={stepIdx === GUIDED_STEPS.length - 1}
              onClick={() => {
                stopFrenchSpeech();
                setSpeakingStepId(null);
                setStepIdx((i) => Math.min(GUIDED_STEPS.length - 1, i + 1));
              }}
              aria-label="Étape suivante"
              className="rounded-full border border-white/15 bg-white/[0.04] p-1.5 text-slate-300 hover:border-amber-300/30 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Recherche & Fiches d'aide cliquables */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-3.5 space-y-2.5 shadow-xl shadow-black/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-[230px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-amber-300/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une aide (ex : voix, ascendant, 2D, animations, quest...)"
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
              />
            </div>
            {showVoiceDictation && (
              <VoiceDictationButton
                accent="cyan"
                title="Rechercher une rubrique d’aide à la voix"
                onTranscript={(spoken) => setQuery(spoken)}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                ['all', 'Tout'],
                ['start', 'Démarrer'],
                ['cycles', 'Cycles'],
                ['display', '2D & 3D'],
                ['vr', 'Quest VR'],
                ['export', 'PDF / Lien'],
              ] as const
            ).map(([catKey, catLabel]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategory(catKey)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  category === catKey
                    ? 'bg-gradient-to-r from-amber-500/85 via-amber-400/85 to-yellow-500/85 text-slate-950 font-semibold'
                    : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:border-amber-300/30 hover:text-white'
                }`}
              >
                {catLabel}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowGlossary((v) => !v)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                showGlossary
                  ? 'border-sky-300/50 bg-sky-400/20 text-sky-100'
                  : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/30 hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3 text-amber-300/80" />
              <span>Lexique</span>
            </button>
          </div>
        </div>

        {showGlossary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border border-sky-300/20 bg-white/[0.03] p-3">
            {QUICK_GLOSSARY.map((item) => (
              <div key={item.term} className="text-[11px]">
                <div className="font-semibold text-amber-200">{item.term}</div>
                <div className="text-slate-200 leading-relaxed">{item.def}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 hover:border-amber-300/30 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-100">
                  {topic.category === 'vr' ? (
                    <Glasses className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                  ) : topic.category === 'display' ? (
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                  ) : topic.category === 'export' ? (
                    <Share2 className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                  ) : topic.category === 'cycles' ? (
                    <ListTree className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                  )}
                  <span>{topic.title}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-200 leading-relaxed">{topic.answer}</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => topic.runAction(actions)}
                  className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-amber-200 hover:border-amber-300/40 hover:bg-amber-400/10 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  <span>{topic.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {filteredTopics.length === 0 && (
            <div className="col-span-full flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Aucun sujet ne correspond à « {query} ». Essayez un mot plus court ou cliquez sur Tout.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
