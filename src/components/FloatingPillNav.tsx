import React from 'react';
import {
  BookMarked,
  Compass,
  Database,
  Film,
  GraduationCap,
  HelpCircle,
  Home,
  Lock,
  Orbit,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';

export type CosmicTabId =
  | 'home'
  | 'wheel'
  | 'datasheet'
  | 'auxiliary'
  | 'library'
  | 'tutorial'
  | 'help'
  | 'intro'
  | 'admin';

export interface FloatingPillNavProps {
  activeTab: CosmicTabId;
  onSelectTab: (tab: CosmicTabId) => void;
  onOpenConfig: () => void;
  onOpenFullSummary: () => void;
  viewDimension: '2d' | '3d';
  onToggleViewDimension: (dim: '2d' | '3d') => void;
  protectionLocked?: boolean;
  isAdminUnlocked?: boolean;
  configLocked?: boolean;
}

const PILL_ITEMS: Array<{
  id: CosmicTabId;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home / Synthèse', shortLabel: 'Home', icon: Home },
  { id: 'wheel', label: 'Roue & Spacetime', shortLabel: 'Roue', icon: Orbit },
  { id: 'datasheet', label: 'DataSheet (Étoiles/Astéroïdes)', shortLabel: 'DataSheet', icon: Database },
  { id: 'auxiliary', label: 'Synastrie / Auxiliaires', shortLabel: 'Auxiliaires', icon: Users },
  { id: 'library', label: 'Bibliothèque des Astres', shortLabel: 'Bibliothèque', icon: BookMarked },
  { id: 'tutorial', label: 'Didacticiel', shortLabel: 'Didacticiel', icon: GraduationCap },
  { id: 'help', label: 'Aide / Fonctions', shortLabel: 'Aide', icon: HelpCircle },
  { id: 'intro', label: 'Revoir l’animation', shortLabel: 'Intro', icon: Film },
  { id: 'admin', label: 'Admin / Sécurité', shortLabel: 'Admin', icon: ShieldCheck },
];

export const FloatingPillNav: React.FC<FloatingPillNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenConfig,
  onOpenFullSummary,
  viewDimension,
  onToggleViewDimension,
  protectionLocked = false,
  isAdminUnlocked = false,
  configLocked = false,
}) => {
  return (
    <nav
      aria-label="Navigation principale Cosmic Insights"
      className="no-print fixed bottom-3 left-1/2 z-30 -translate-x-1/2 max-w-[96vw]"
    >
      <div className="flex items-center gap-1 rounded-full border border-amber-200/30 bg-[#151824]/88 backdrop-blur-2xl p-1.5 shadow-[0_14px_45px_rgba(0,0,0,0.75)] ring-1 ring-amber-300/10 overflow-x-auto cosmic-scroll">
        {PILL_ITEMS.map((item) => {
          const Icon =
            item.id === 'admin' && protectionLocked && !isAdminUnlocked ? Lock : item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.42)]'
                  : item.id === 'admin' && isAdminUnlocked
                    ? 'border border-emerald-400/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
                    : 'text-slate-300 hover:bg-white/[0.05] hover:text-amber-100'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  active
                    ? 'text-slate-950'
                    : item.id === 'admin' && isAdminUnlocked
                      ? 'text-emerald-300'
                      : 'text-amber-300/80'
                }`}
              />
              <span className="hidden 2xl:inline">{item.label}</span>
              <span className="2xl:hidden">{item.shortLabel}</span>
            </button>
          );
        })}

        <div className="h-5 w-px bg-white/10 mx-1 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={() => onToggleViewDimension(viewDimension === '3d' ? '2d' : '3d')}
          title={viewDimension === '3d' ? 'Passer en Roue SVG 2D haute précision' : 'Basculer vers l’observatoire 3D / VR'}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
            viewDimension === '3d' && activeTab === 'wheel'
              ? 'border-sky-300/45 bg-sky-400/15 text-sky-100'
              : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-amber-300/35 hover:text-white'
          }`}
        >
          <Compass className="h-3.5 w-3.5 text-sky-300" />
          <span>{viewDimension === '3d' ? '3D' : '2D'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenFullSummary}
          title="Ouvrir le Bilan & Interprétation Complète"
          className="flex items-center gap-1.5 rounded-full border border-purple-300/30 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-100 hover:border-purple-300/60 hover:bg-purple-500/20 transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-300" />
          <span className="hidden sm:inline">Bilan</span>
        </button>

        <button
          type="button"
          onClick={onOpenConfig}
          title={
            configLocked
              ? 'Configuration verrouillée par l’administrateur'
              : 'Configuration avancée : 33 Maisons, 21 Aspects, Déclinaisons & Dignités'
          }
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
            configLocked
              ? 'border-rose-400/35 bg-rose-500/10 text-rose-100 hover:border-rose-300/60'
              : 'border-amber-200/25 bg-white/[0.04] text-amber-100 hover:border-amber-300/50 hover:bg-amber-400/10'
          }`}
        >
          {configLocked ? (
            <Lock className="h-3.5 w-3.5 text-rose-300" />
          ) : (
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
          )}
          <span className="hidden sm:inline">Config</span>
        </button>
      </div>
    </nav>
  );
};
