import React from 'react';
import {
  Compass,
  Glasses,
  Info,
  Lock,
  Mic,
  MicOff,
  Power,
  ScanEye,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Stars,
} from 'lucide-react';
import { ChartMode, RETURN_CELESTIAL_POINTS } from '../astro/astroEngine';
import { PWAInstallButton } from './PWAInstallButton';

export interface ChartSelectorBarProps {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  planetaryReturnPointId: string;
  onPlanetaryReturnPointChange: (id: string) => void;
  nativeName: string;
  cityName: string;
  houseSystemName: string;
  onOpenConfig: () => void;
  onOpenAbout: () => void;
  onOpenSharePrint: () => void;
  onEnterMR: () => void;
  onEnterVR: () => void;
  onToggleVoiceMode: () => void;
  onRequestQuit: () => void;
  voiceModeEnabled: boolean;
  voiceListening: boolean;
  inVR: boolean;
  xrMode: string;
  desktopMR: boolean;
  webXRSupported: boolean;
  mrSupported: boolean;
  protectionActive?: boolean;
  isAdminUnlocked?: boolean;
  lockConfig?: boolean;
  lockModes?: boolean;
  lockExports?: boolean;
  lockQuit?: boolean;
  onOpenAdmin?: () => void;
}

const CHART_ENGINE_ITEMS: Array<{ id: ChartMode; label: string }> = [
  { id: 'natal', label: 'Thème Natal' },
  { id: 'transits', label: 'Transits' },
  { id: 'synastry', label: 'Synastrie' },
  { id: 'composite', label: 'Composite' },
  { id: 'planetaryReturn', label: 'Révolutions' },
  { id: 'progressions', label: 'Progressions' },
  { id: 'solarArc', label: 'Arc Solaire' },
  { id: 'relocated', label: 'Relocalisé' },
];

export const ChartSelectorBar: React.FC<ChartSelectorBarProps> = ({
  mode,
  onModeChange,
  planetaryReturnPointId,
  onPlanetaryReturnPointChange,
  nativeName,
  cityName,
  houseSystemName,
  onOpenConfig,
  onOpenAbout,
  onOpenSharePrint,
  onEnterMR,
  onEnterVR,
  onToggleVoiceMode,
  onRequestQuit,
  voiceModeEnabled,
  voiceListening,
  inVR,
  xrMode,
  desktopMR,
  webXRSupported,
  mrSupported,
  protectionActive = false,
  isAdminUnlocked = false,
  lockConfig = false,
  lockModes = false,
  lockExports = false,
  lockQuit = false,
  onOpenAdmin,
}) => {
  const isReturnMode =
    mode === 'solarReturn' || mode === 'lunarReturn' || mode === 'planetaryReturn';

  return (
    <header className="no-print fixed top-0 left-0 right-0 z-30 border-b border-amber-200/15 bg-[#080911]/85 backdrop-blur-xl px-3 sm:px-5 py-2.5">
      <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Brand & Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
              <Stars className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm sm:text-base font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent whitespace-nowrap">
                Uranie · Cosmic Insights
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 whitespace-nowrap">
                <span className="text-amber-200/80 font-medium">{nativeName || 'Profil actif'}</span>
                <span>·</span>
                <span className="truncate max-w-[150px]">{cityName}</span>
                <span>·</span>
                <span className="text-sky-200/80">{houseSystemName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAbout}
            title="Présentation & Musique céleste"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-amber-100/90 hover:border-amber-300/35 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Info className="h-3 w-3 text-amber-300/80" />
            <span className="hidden md:inline">Atelier</span>
          </button>
        </div>

        {/* Center: Primary Chart Engine Selector */}
        <div className="flex items-center gap-1 rounded-full border border-amber-200/20 bg-[#151824]/80 p-1 overflow-x-auto cosmic-scroll max-w-full">
          {CHART_ENGINE_ITEMS.map((item) => {
            const active =
              item.id === 'planetaryReturn' ? isReturnMode : mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onModeChange(item.id)}
                title={lockModes && !active ? 'Changement de mode verrouillé par l’administrateur' : undefined}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.3)]'
                    : lockModes
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-amber-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {isReturnMode && (
            <select
              aria-label="Choisir le point de révolution planétaire"
              disabled={lockModes}
              value={
                mode === 'solarReturn'
                  ? 'sun'
                  : mode === 'lunarReturn'
                    ? 'moon'
                    : planetaryReturnPointId
              }
              onChange={(e) => {
                const val = e.target.value;
                onPlanetaryReturnPointChange(val);
                if (val === 'sun') onModeChange('solarReturn');
                else if (val === 'moon') onModeChange('lunarReturn');
                else onModeChange('planetaryReturn');
              }}
              className="ml-1 rounded-full border border-amber-300/35 bg-[#0c101d] px-2.5 py-1 text-[11px] font-medium text-amber-200 outline-none cursor-pointer disabled:opacity-50"
            >
              {RETURN_CELESTIAL_POINTS.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.symbol} {pt.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Quick Tools (Config, Voice, PDF/WhatsApp/Mail, Admin, MR/VR, Quit) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenConfig}
            title={
              lockConfig
                ? 'Configuration verrouillée par l’administrateur'
                : 'Configuration avancée : 33 Maisons, 21 Aspects, Déclinaisons & Dignités'
            }
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              lockConfig
                ? 'border-rose-400/35 bg-rose-500/10 text-rose-100 hover:border-rose-300/60'
                : 'border-amber-200/25 bg-[#151824]/80 text-amber-100 hover:border-amber-300/50'
            }`}
          >
            {lockConfig ? (
              <Lock className="h-3.5 w-3.5 text-rose-300" />
            ) : (
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
            )}
            <span className="hidden xl:inline">Maisons · Aspects</span>
          </button>

          <button
            type="button"
            onClick={onToggleVoiceMode}
            title="Commande vocale (en option)"
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              voiceModeEnabled
                ? 'border-rose-400/60 bg-rose-500/20 text-rose-100'
                : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-amber-300/35'
            }`}
          >
            {voiceListening ? (
              <Mic className="h-3.5 w-3.5 animate-pulse text-rose-300" />
            ) : voiceModeEnabled ? (
              <Mic className="h-3.5 w-3.5 text-rose-300" />
            ) : (
              <MicOff className="h-3.5 w-3.5 text-amber-300/80" />
            )}
            <span className="hidden lg:inline">{voiceModeEnabled ? 'Voix ON' : 'Voix'}</span>
          </button>

          <PWAInstallButton />

          <button
            type="button"
            onClick={onOpenSharePrint}
            title={
              lockExports
                ? 'Exports PDF, E-mail & WhatsApp verrouillés par l’administrateur'
                : 'Imprimer, exporter en PDF, envoyer par E-mail ou WhatsApp'
            }
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              lockExports
                ? 'border-rose-400/35 bg-rose-500/10 text-rose-100 hover:border-rose-300/60'
                : 'border-white/10 bg-white/[0.03] text-amber-100 hover:border-amber-300/35'
            }`}
          >
            {lockExports ? (
              <Lock className="h-3.5 w-3.5 text-rose-300" />
            ) : (
              <Share2 className="h-3.5 w-3.5 text-amber-300/80" />
            )}
            <span className="hidden md:inline">PDF · E-mail</span>
          </button>

          {onOpenAdmin && (protectionActive || isAdminUnlocked) && (
            <button
              type="button"
              onClick={onOpenAdmin}
              title={
                isAdminUnlocked
                  ? 'Session Admin ouverte — cliquer pour gérer les verrous'
                  : 'Mode protégé actif — cliquer pour déverrouiller Admin'
              }
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isAdminUnlocked
                  ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
                  : 'border-amber-300/45 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25'
              }`}
            >
              {isAdminUnlocked ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-300" />
              )}
              <span className="hidden lg:inline">
                {isAdminUnlocked ? 'Admin ouvert' : 'Protégé'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onEnterMR}
            title="Réalité Mixte"
            className={`hidden sm:flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              xrMode === 'mr' || desktopMR
                ? 'border-amber-300/50 bg-indigo-500/30 text-white'
                : 'border-white/10 bg-white/[0.03] text-indigo-100 hover:border-amber-300/35'
            }`}
          >
            <ScanEye className="h-3.5 w-3.5 text-amber-300/80" />
            <span className="hidden xl:inline">{mrSupported ? 'RM' : 'MR'}</span>
          </button>

          <button
            type="button"
            onClick={onEnterVR}
            title="Observatoire 3D / WebXR VR"
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/85 via-amber-400/85 to-yellow-500/85 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Glasses className="h-3.5 w-3.5" />
            <span>{inVR ? 'Quitter VR' : webXRSupported ? 'VR' : 'VR 3D'}</span>
          </button>

          <button
            type="button"
            onClick={onRequestQuit}
            title={
              lockQuit
                ? 'Sortie verrouillée par l’administrateur'
                : 'Quitter Uranie VR'
            }
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              lockQuit
                ? 'border-white/10 bg-white/[0.02] text-slate-500 hover:border-rose-300/35'
                : 'border-white/10 bg-white/[0.03] text-rose-200 hover:border-rose-400/50 hover:bg-rose-500/15'
            }`}
          >
            <Power className={`h-3.5 w-3.5 ${lockQuit ? 'text-slate-500' : 'text-rose-300'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
