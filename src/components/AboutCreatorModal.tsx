import React, { useEffect, useState } from 'react';
import {
  Compass,
  Edit3,
  ExternalLink,
  Glasses,
  Info,
  Mail,
  Monitor,
  RotateCcw,
  Save,
  ScanEye,
  Sparkles,
  User,
  X,
} from 'lucide-react';

const CREATOR_STORAGE_KEY = 'uranie_vr_creator_profile_v1';
const ALWAYS_SHOW_INTRO_KEY = 'uranie_vr_intro_always_v1';

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
}

export const AboutCreatorModal: React.FC<AboutCreatorModalProps> = ({
  open,
  onClose,
  webXRSupported,
  mrSupported,
  onEnterVR,
  onEnterMR,
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

  useEffect(() => {
    setDraftCreator(creator);
  }, [creator, open]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-[#d4af37]/35 bg-[#090e1d] p-6 text-[#f3efe6] shadow-2xl max-h-[90vh] overflow-y-auto cosmic-scroll">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#d4af37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Observatoire Astrologique 3D & WebXR · Meta Quest & PC</span>
            </div>
            <h2 className="font-display text-3xl font-semibold text-[#f8f3e6] mt-1">
              Bienvenue dans Uranie VR
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la page de présentation"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-300">
          {/* Présentation du programme */}
          <div className="rounded-xl border border-white/10 bg-[#0d1428] p-4">
            <div className="flex items-center gap-2 font-medium text-[#f8f3e6]">
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <span>Présentation du programme</span>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>Uranie VR</strong> est un observatoire astrologique et astronomique immersif en temps réel. Tous les calculs planétaires s’exécutent localement et hors-ligne avec une précision astronomique : thème natal, transits en direct, révolutions solaires et lunaires, progressions secondaires, synastrie, thème composite ainsi que les correspondances zodiacales occidentales et chinoises.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-[#38bdf8]/25 bg-[#081124] p-3">
                <div className="flex items-center gap-1.5 font-semibold text-[#7dd3fc]">
                  <Glasses className="w-4 h-4" />
                  <span>Expérience Meta Quest 3</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-slate-300 list-disc list-inside">
                  <li>VR 360° complète & Réalité Mixte Passthrough couleur.</li>
                  <li>Pointez planètes et maisons à la manette et cliquez avec la gâchette.</li>
                  <li>Poussez le joystick gauche/droite en VR pour faire défiler l’heure.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-[#d4af37]/25 bg-[#0f1526] p-3">
                <div className="flex items-center gap-1.5 font-semibold text-[#f3d67a]">
                  <Monitor className="w-4 h-4" />
                  <span>Expérience PC (Windows / Web)</span>
                </div>
                <ul className="mt-1.5 space-y-1 text-slate-300 list-disc list-inside">
                  <li>Navigation 3D fluide à la souris (orbite, zoom, sélection directe).</li>
                  <li>Compatible PCVR (Quest Link, Air Link, SteamVR) via WebXR.</li>
                  <li>Export PDF complet et partage de thème par lien ou QR code.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fiche Créateurs du programme */}
          <div className="rounded-xl border border-[#d4af37]/35 bg-gradient-to-br from-[#101830] to-[#0a1022] p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-medium text-[#f8f3e6]">
                <User className="w-4 h-4 text-[#d4af37]" />
                <span>Créateurs du programme</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCreator((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/35 bg-[#090e1d] px-3 py-1.5 text-xs font-medium text-[#f3d67a] hover:bg-[#d4af37]/15 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{editingCreator ? 'Annuler' : 'Modifier la présentation'}</span>
              </button>
            </div>

            {!editingCreator ? (
              <div className="mt-3 space-y-2.5">
                <div>
                  <div className="font-display text-2xl font-semibold text-[#f8f3e6]">
                    {creator.name}
                  </div>
                  <div className="text-xs font-medium text-[#38bdf8]">{creator.role}</div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {creator.bio}
                </p>
                {creator.dedication && (
                  <div className="rounded-lg border border-[#d4af37]/30 bg-[#090e1d]/80 px-3.5 py-2.5 text-xs sm:text-sm italic text-[#f3d67a] leading-relaxed">
                    « {creator.dedication} »
                  </div>
                )}
                <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  {creator.contact && (
                    <span className="inline-flex items-center gap-1.5 text-[#e7cfa0]">
                      <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{creator.contact}</span>
                    </span>
                  )}
                  {creator.projectUrl && (
                    <a
                      href={creator.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#7dd3fc] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Code source & mises à jour</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3 text-xs">
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
                      className="w-full rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-2 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-2 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
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
                    className="w-full rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-2 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
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
                    className="w-full rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-2 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-2 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
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
                      className="w-full rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-2 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetCreator}
                    className="flex items-center gap-1 rounded-lg border border-white/15 bg-[#05070e] px-2.5 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCreator}
                    className="flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3.5 py-1.5 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] cursor-pointer"
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
              className="accent-[#d4af37]"
            />
            <span>Afficher cette présentation à chaque ouverture</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {mrSupported && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEnterMR();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-[#38bdf8]/50 bg-[#0c162d] px-3.5 py-2 text-xs font-semibold text-[#7dd3fc] hover:bg-[#38bdf8]/20 transition-colors cursor-pointer"
              >
                <ScanEye className="w-4 h-4" />
                <span>Réalité Mixte</span>
              </button>
            )}
            {webXRSupported && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEnterVR();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/50 bg-[#121931] px-3.5 py-2 text-xs font-semibold text-[#f3d67a] hover:bg-[#d4af37]/20 transition-colors cursor-pointer"
              >
                <Glasses className="w-4 h-4" />
                <span>Entrer en VR 360°</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] transition-colors cursor-pointer"
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
