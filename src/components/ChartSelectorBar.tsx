import React from 'react';
import {
  Compass,
  Glasses,
  Info,
  Mic,
  MicOff,
  Power,
  ScanEye,
  Share2,
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.3)]'
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
              className="ml-1 rounded-full border border-amber-300/35 bg-[#0c101d] px-2.5 py-1 text-[11px] font-medium text-amber-200 outline-none cursor-pointer"
            >
              {RETURN_CELESTIAL_POINTS.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.symbol} {pt.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Quick Tools (Config, Voice, PDF/WhatsApp/Mail, MR/VR, Quit) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenConfig}
            title="Configuration avancée : 33 Maisons, 21 Aspects, Déclinaisons & Dignités"
            className="flex items-center gap-1 rounded-full border border-amber-200/25 bg-[#151824]/80 px-2.5 py-1.5 text-[11px] font-medium text-amber-100 hover:border-amber-300/50 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
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
            title="Imprimer, exporter en PDF, envoyer par E-mail ou WhatsApp"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-amber-100 hover:border-amber-300/35 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Share2 className="h-3.5 w-3.5 text-amber-300/80" />
            <span className="hidden md:inline">PDF · E-mail</span>
          </button>

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
            title="Quitter Uranie VR"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-rose-200 hover:border-rose-400/50 hover:bg-rose-500/15 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Power className="h-3.5 w-3.5 text-rose-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
