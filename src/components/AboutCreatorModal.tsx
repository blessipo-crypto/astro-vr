import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Compass,
  Edit3,
  ExternalLink,
  Glasses,
  Info,
  Mail,
  Monitor,
  Music,
  Pause,
  Play,
  RotateCcw,
  Save,
  ScanEye,
  Sparkles,
  Square,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  esotericIntroMusic,
  INTRO_NARRATION_CHAPTERS,
  isSpeechSynthesisSupported,
  MUSIC_STYLES,
  MusicStyleId,
  pickFrenchVoice,
  stopFrenchSpeech,
} from '../vr/audio';

const CREATOR_STORAGE_KEY = 'uranie_vr_creator_profile_v1';
const ALWAYS_SHOW_INTRO_KEY = 'uranie_vr_intro_always_v1';
const MUSIC_STYLE_STORAGE_KEY = 'uranie_vr_music_style_v1';

interface CreatorProfile {
  name: string;
  role: string;
  bio: string;
  dedication: string;
  projectUrl: string;
  contact: string;
}

const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  name: 'P. Lavagna (blessipo-crypto) & Audrey',
  role: 'Créateurs & Concepteurs d’Uranie VR',
  bio: 'Passionnés d’astrologie, d’astronomie et d’univers 3D immersifs, nous avons imaginé Uranie VR pour transformer la lecture du thème astral en un véritable observatoire céleste interactif sur Meta Quest et PC.',
  dedication:
    'Merci Audrey (grande astrologue) pour ces précieux conseils en astrologie, aussi grande que ta connaissance, sans quoi rien n’aurait été possible.',
  projectUrl: 'https://github.com/blessipo-crypto/astro-vr',
  contact: 'lavagna.p@gmail.com',
};

interface AboutCreatorModalProps {
  open: boolean;
  onClose: () => void;
  webXRSupported: boolean;
  mrSupported: boolean;
  onEnterVR: () => void;
  onEnterMR: () => void;
  autoStartAudio?: boolean;
}

export const AboutCreatorModal: React.FC<AboutCreatorModalProps> = ({
  open,
  onClose,
  webXRSupported,
  mrSupported,
  onEnterVR,
  onEnterMR,
  autoStartAudio = false,
}) => {
  const [creator, setCreator] = useState<CreatorProfile>(() => {
    try {
      const raw = localStorage.getItem(CREATOR_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreatorProfile>;
        return { ...DEFAULT_CREATOR_PROFILE, ...parsed };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_CREATOR_PROFILE;
  });

  const [editingCreator, setEditingCreator] = useState<boolean>(false);
  const [draftCreator, setDraftCreator] = useState<CreatorProfile>(creator);
  const [alwaysShowOnStart, setAlwaysShowOnStart] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ALWAYS_SHOW_INTRO_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Guided Voice & Esoteric Music state
  const [tourPlaying, setTourPlaying] = useState<boolean>(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [musicStyle, setMusicStyle] = useState<MusicStyleId>(() => {
    try {
      const saved = localStorage.getItem(MUSIC_STYLE_STORAGE_KEY) as MusicStyleId | null;
      if (saved && MUSIC_STYLES.some((s) => s.id === saved)) {
        esotericIntroMusic.setStyle(saved);
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return 'nocturne';
  });
  const [musicActive, setMusicActive] = useState<boolean>(false);
  const [needsUserClickForAudio, setNeedsUserClickForAudio] = useState<boolean>(false);

  const speechSupported = isSpeechSynthesisSupported();
  const tourActiveRef = useRef<boolean>(false);
  const runTokenRef = useRef<number>(0);
  const voiceEnabledRef = useRef<boolean>(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  useEffect(() => {
    setDraftCreator(creator);
  }, [creator, open]);

  // Preload browser speech voices when modal mounts
  useEffect(() => {
    if (!speechSupported) return;
    const warmUp = () => {
      window.speechSynthesis.getVoices();
    };
    warmUp();
    window.speechSynthesis.addEventListener?.('voiceschanged', warmUp);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warmUp);
    };
  }, [speechSupported]);

  const stopAllAudio = useCallback(() => {
    tourActiveRef.current = false;
    runTokenRef.current += 1;
    stopFrenchSpeech();
    esotericIntroMusic.setDucked(false);
    esotericIntroMusic.stop();
    setTourPlaying(false);
    setMusicActive(false);
  }, []);

  const speakChapterAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= INTRO_NARRATION_CHAPTERS.length) {
        tourActiveRef.current = false;
        setTourPlaying(false);
        esotericIntroMusic.setDucked(false);
        return;
      }

      const token = ++runTokenRef.current;
      tourActiveRef.current = true;
      setTourPlaying(true);
      setActiveChapterIdx(index);

      if (!voiceEnabledRef.current || !speechSupported) {
        // Music-only chapter timer so visual progress advances smoothly even if voice is muted
        esotericIntroMusic.setDucked(false);
        window.setTimeout(() => {
          if (runTokenRef.current !== token || !tourActiveRef.current) return;
          speakChapterAt(index + 1);
        }, 7000);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const chapter = INTRO_NARRATION_CHAPTERS[index];
        const utter = new SpeechSynthesisUtterance(chapter.text);
        const frVoice = pickFrenchVoice();
        if (frVoice) {
          utter.voice = frVoice;
          utter.lang = frVoice.lang;
        } else {
          utter.lang = 'fr-FR';
        }
        utter.rate = 0.96;
        utter.pitch = 0.98;
        utter.volume = 1.0;

        utter.onstart = () => {
          if (runTokenRef.current !== token) return;
          setNeedsUserClickForAudio(false);
          esotericIntroMusic.setDucked(true);
        };

        utter.onend = () => {
          if (runTokenRef.current !== token || !tourActiveRef.current) return;
          if (index + 1 < INTRO_NARRATION_CHAPTERS.length) {
            window.setTimeout(() => {
              if (runTokenRef.current !== token || !tourActiveRef.current) return;
              speakChapterAt(index + 1);
            }, 450);
          } else {
            tourActiveRef.current = false;
            setTourPlaying(false);
            esotericIntroMusic.setDucked(false);
          }
        };

        utter.onerror = (ev) => {
          if (runTokenRef.current !== token) return;
          if (ev.error === 'not-allowed') {
            setNeedsUserClickForAudio(true);
            tourActiveRef.current = false;
            setTourPlaying(false);
            esotericIntroMusic.setDucked(false);
          }
        };

        window.speechSynthesis.speak(utter);
      } catch {
        setTourPlaying(false);
        tourActiveRef.current = false;
      }
    },
    [speechSupported]
  );

  const handleStartGuidedTour = useCallback(
    async (startIdx = 0) => {
      setNeedsUserClickForAudio(false);
      if (musicEnabled) {
        const ok = await esotericIntroMusic.start();
        setMusicActive(ok);
        if (!ok) {
          setNeedsUserClickForAudio(true);
        }
      }
      speakChapterAt(startIdx);
    },
    [musicEnabled, speakChapterAt]
  );

  const handlePauseGuidedTour = useCallback(() => {
    tourActiveRef.current = false;
    runTokenRef.current += 1;
    stopFrenchSpeech();
    esotericIntroMusic.setDucked(false);
    setTourPlaying(false);
  }, []);

  const handleToggleMusic = useCallback(async () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    if (!next) {
      esotericIntroMusic.stop();
      setMusicActive(false);
    } else {
      const ok = await esotericIntroMusic.start();
      setMusicActive(ok);
      esotericIntroMusic.setDucked(tourPlaying && voiceEnabled);
    }
  }, [musicEnabled, tourPlaying, voiceEnabled]);

  const handleToggleVoice = useCallback(() => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    voiceEnabledRef.current = next;
    if (!next) {
      runTokenRef.current += 1;
      stopFrenchSpeech();
      esotericIntroMusic.setDucked(false);
    } else if (tourPlaying) {
      speakChapterAt(activeChapterIdx);
    }
  }, [voiceEnabled, tourPlaying, activeChapterIdx, speakChapterAt]);

  // Auto-start when opened via explicit click (autoStartAudio) or clean stop on close
  useEffect(() => {
    if (!open) {
      stopAllAudio();
      return;
    }

    if (autoStartAudio) {
      void handleStartGuidedTour(0);
    } else if (musicEnabled) {
      // Attempt ambient music if browser already has user gesture; otherwise offer instant click button
      void esotericIntroMusic.start().then((ok) => {
        setMusicActive(ok);
        if (!ok) setNeedsUserClickForAudio(true);
      });
    }

    return () => {
      stopAllAudio();
    };
  }, [open, autoStartAudio, stopAllAudio]);

  if (!open) return null;

  const handleToggleAlwaysShow = (checked: boolean) => {
    setAlwaysShowOnStart(checked);
    try {
      localStorage.setItem(ALWAYS_SHOW_INTRO_KEY, checked ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  };

  const handleSaveCreator = () => {
    setCreator(draftCreator);
    setEditingCreator(false);
    try {
      localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(draftCreator));
    } catch {
      // Ignore storage errors
    }
  };

  const handleResetCreator = () => {
    setCreator(DEFAULT_CREATOR_PROFILE);
    setDraftCreator(DEFAULT_CREATOR_PROFILE);
    setEditingCreator(false);
    try {
      localStorage.removeItem(CREATOR_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const currentChapter = INTRO_NARRATION_CHAPTERS[activeChapterIdx] ?? INTRO_NARRATION_CHAPTERS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070C]/85 backdrop-blur-xl p-4 overflow-hidden">
      {/* Ambient Celestial Glow Orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[320px] w-[320px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0c0c16]/90 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 text-[#f3efe6] shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto cosmic-scroll">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-200/80">
              <Sparkles className="w-4 h-4 text-amber-300/80" />
              <span className="font-serif italic text-sm tracking-wide">
                Observatoire Astrologique 2D, 3D &amp; WebXR · Meta Quest &amp; PC
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase mt-1.5">
              Bienvenue dans Uranie VR
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            aria-label="Fermer la page de présentation"
            className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-200">
          {/* Lecteur Audio d'Introduction : Voix explicative + Musique ésotérique */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-2xl shadow-black/50 hover:border-amber-300/30 transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                  <Volume2 className="w-4 h-4 text-amber-300/80" />
                  <span>
                    Visite guidée vocale ·{' '}
                    {MUSIC_STYLES.find((s) => s.id === musicStyle)?.label ?? 'Nocturne Astral'} (432 Hz)
                  </span>
                </div>
                <p className="font-serif italic text-sm text-slate-300 mt-0.5">
                  Écoutez la présentation complète d’Uranie VR sur une ambiance céleste stéréo apaisante.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!tourPlaying ? (
                  <button
                    type="button"
                    onClick={() => void handleStartGuidedTour(activeChapterIdx)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-5 py-2 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {needsUserClickForAudio
                        ? 'Lancer la voix & musique'
                        : activeChapterIdx > 0
                          ? 'Reprendre la visite'
                          : 'Écouter la présentation'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseGuidedTour}
                    className="flex items-center gap-1.5 rounded-full border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-100 hover:border-amber-300/30 transition-all duration-300 cursor-pointer whitespace-nowrap"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-300/80" />
                    <span>Pause voix</span>
                  </button>
                )}

                {(tourPlaying || musicActive) && (
                  <button
                    type="button"
                    onClick={stopAllAudio}
                    title="Arrêter voix et musique"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-slate-200 hover:border-rose-400/50 hover:text-white transition-all duration-300 cursor-pointer"
                  >
                    <Square className="w-3 h-3" />
                    <span>Stop</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  title="Activer ou couper la voix de narration"
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    voiceEnabled && speechSupported
                      ? 'border-amber-300/30 bg-white/[0.06] text-amber-100'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                  }`}
                >
                  {voiceEnabled && speechSupported ? (
                    <Volume2 className="w-3.5 h-3.5 text-amber-300/80" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>Voix</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleToggleMusic()}
                  title="Activer ou couper la musique d’ambiance"
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    musicEnabled
                      ? 'border-amber-300/30 bg-white/[0.06] text-amber-200'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-amber-300/80" />
                  <span>Musique {musicActive ? '· On' : ''}</span>
                </button>
              </div>
            </div>

            {/* Sélecteur d'ambiance musicale */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Ambiance :</span>
              {MUSIC_STYLES.map((st) => {
                const active = musicStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    title={st.description}
                    onClick={async () => {
                      setMusicStyle(st.id);
                      esotericIntroMusic.setStyle(st.id);
                      try {
                        localStorage.setItem(MUSIC_STYLE_STORAGE_KEY, st.id);
                      } catch {
                        // Ignore storage errors
                      }
                      if (!musicEnabled) setMusicEnabled(true);
                      if (!esotericIntroMusic.isPlaying()) {
                        const ok = await esotericIntroMusic.start();
                        setMusicActive(ok);
                      }
                    }}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-amber-300/45 bg-amber-400/15 text-amber-100'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/30 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Chapitres cliquables */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {INTRO_NARRATION_CHAPTERS.map((chap, idx) => {
                const isCurrent = idx === activeChapterIdx;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => void handleStartGuidedTour(idx)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? tourPlaying
                          ? 'border-indigo-300/60 bg-indigo-500/20 text-white'
                          : 'border-amber-300/45 bg-amber-400/15 text-amber-100'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/30 hover:text-white'
                    }`}
                  >
                    {idx + 1}. {chap.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Texte / Sous-titre du chapitre en cours */}
            <div className="mt-3.5 rounded-2xl border border-white/10 bg-[#07070C]/60 px-4 py-3 text-xs text-slate-200 leading-relaxed">
              <span className="font-semibold text-amber-200 mr-1.5">{currentChapter.title} :</span>
              <span>{currentChapter.text}</span>
            </div>
          </div>

          {/* Présentation du programme */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-2xl shadow-black/50 hover:border-amber-300/30 transition-all duration-300">
            <div className="flex items-center gap-2 font-display text-sm font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
              <Compass className="w-4 h-4 text-amber-300/80 shrink-0" />
              <span>Toutes les possibilités du programme</span>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong className="text-amber-100">Uranie VR</strong> est un observatoire astrologique et astronomique immersif en temps réel. Tous les calculs planétaires s’exécutent localement et hors-ligne avec une précision astronomique : thème natal (par prénom, date, heure et lieu/code postal), calculateur d’<strong className="text-amber-100">Ascendant seul</strong>, transits en direct animés, révolutions solaires et lunaires, progressions secondaires, synastrie, thème composite, comparatifs double-roue ainsi que les correspondances zodiacales occidentales et chinoises.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-amber-300/30 transition-all duration-300">
                <div className="flex items-center gap-2 font-semibold text-amber-100">
                  <Glasses className="w-4 h-4 text-amber-300/80" />
                  <span>Expérience Meta Quest 3 (VR &amp; MR)</span>
                </div>
                <ul className="mt-2 space-y-1.5 text-slate-200 leading-relaxed list-disc list-inside">
                  <li>VR 360° complète &amp; Réalité Mixte Passthrough couleur.</li>
                  <li>Pointez planètes et maisons à la manette et cliquez avec la gâchette.</li>
                  <li>Animations dans le ciel : étoiles filantes, nébuleuses et aurores boréales.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-amber-300/30 transition-all duration-300">
                <div className="flex items-center gap-2 font-semibold text-amber-100">
                  <Monitor className="w-4 h-4 text-amber-300/80" />
                  <span>Expérience PC (Vue 2D &amp; 3D + Aide)</span>
                </div>
                <ul className="mt-2 space-y-1.5 text-slate-200 leading-relaxed list-disc list-inside">
                  <li>Mode <strong>2D PC</strong> haute lisibilité avec <strong>8 roues</strong> et 3 orientations, ou vue <strong>3D</strong>.</li>
                  <li>Onglet <strong>Réglages</strong> centralisé et onglet <strong>Aide interactive</strong> disponible à tout moment.</li>
                  <li>Export PDF complet, WhatsApp et partage par lien ou QR code.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fiche Créateurs du programme */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-2xl shadow-black/50 hover:border-amber-300/30 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-display text-sm font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                <User className="w-4 h-4 text-amber-300/80 shrink-0" />
                <span>Créateurs du programme</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCreator((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-amber-100 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300/80" />
                <span>{editingCreator ? 'Annuler' : 'Modifier la présentation'}</span>
              </button>
            </div>

            {!editingCreator ? (
              <div className="mt-3.5 space-y-3">
                <div>
                  <div className="font-display text-xl sm:text-2xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-wider uppercase">
                    {creator.name}
                  </div>
                  <div className="font-serif italic text-sm text-indigo-200 mt-0.5">{creator.role}</div>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {creator.bio}
                </p>
                {creator.dedication && (
                  <div className="rounded-2xl border border-white/10 bg-[#07070C]/60 px-4 py-3 font-serif text-sm sm:text-base italic text-amber-100/90 leading-relaxed">
                    « {creator.dedication} »
                  </div>
                )}
                <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  {creator.contact && (
                    <span className="inline-flex items-center gap-1.5 text-amber-100/90">
                      <Mail className="w-3.5 h-3.5 text-amber-300/80" />
                      <span>{creator.contact}</span>
                    </span>
                  )}
                  {creator.projectUrl && (
                    <a
                      href={creator.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-amber-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-300/80" />
                      <span>Code source &amp; mises à jour</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3.5 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="creator-name" className="block text-[11px] text-slate-400 mb-1">
                      Noms / Signatures des créateurs
                    </label>
                    <input
                      id="creator-name"
                      type="text"
                      value={draftCreator.name}
                      onChange={(e) => setDraftCreator((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="creator-role" className="block text-[11px] text-slate-400 mb-1">
                      Titre / Rôle
                    </label>
                    <input
                      id="creator-role"
                      type="text"
                      value={draftCreator.role}
                      onChange={(e) => setDraftCreator((p) => ({ ...p, role: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="creator-bio" className="block text-[11px] text-slate-400 mb-1">
                    Texte de présentation
                  </label>
                  <textarea
                    id="creator-bio"
                    rows={3}
                    value={draftCreator.bio}
                    onChange={(e) => setDraftCreator((p) => ({ ...p, bio: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="creator-dedication" className="block text-[11px] text-slate-400 mb-1">
                    Remerciements / Dédicace
                  </label>
                  <textarea
                    id="creator-dedication"
                    rows={2}
                    value={draftCreator.dedication}
                    onChange={(e) => setDraftCreator((p) => ({ ...p, dedication: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="creator-contact" className="block text-[11px] text-slate-400 mb-1">
                      E-mail / Contact
                    </label>
                    <input
                      id="creator-contact"
                      type="text"
                      value={draftCreator.contact}
                      onChange={(e) => setDraftCreator((p) => ({ ...p, contact: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="creator-url" className="block text-[11px] text-slate-400 mb-1">
                      Lien du projet / site
                    </label>
                    <input
                      id="creator-url"
                      type="url"
                      value={draftCreator.projectUrl}
                      onChange={(e) =>
                        setDraftCreator((p) => ({ ...p, projectUrl: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetCreator}
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-slate-300 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCreator}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-6 py-2.5 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer la fiche</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page avec actions Quest & PC */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={alwaysShowOnStart}
              onChange={(e) => handleToggleAlwaysShow(e.target.checked)}
              className="accent-amber-400"
            />
            <span>Afficher cette présentation à chaque ouverture</span>
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            {mrSupported && (
              <button
                type="button"
                onClick={() => {
                  stopAllAudio();
                  onClose();
                  onEnterMR();
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-indigo-100 hover:border-amber-300/30 transition-all duration-300 cursor-pointer"
              >
                <ScanEye className="w-4 h-4 text-amber-300/80" />
                <span>Réalité Mixte</span>
              </button>
            )}
            {webXRSupported && (
              <button
                type="button"
                onClick={() => {
                  stopAllAudio();
                  onClose();
                  onEnterVR();
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-amber-100 hover:border-amber-300/30 transition-all duration-300 cursor-pointer"
              >
                <Glasses className="w-4 h-4 text-amber-300/80" />
                <span>Entrer en VR 360°</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-8 py-3.5 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Accéder à l’observatoire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
