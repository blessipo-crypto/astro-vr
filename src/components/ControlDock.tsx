import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Glasses,
  Layers,
  ListTree,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AstroChart,
  ChartMode,
  CITY_PRESETS,
  ComparisonAspectInfo,
  GeocodedPlace,
  HouseSystem,
  NatalProfile,
  PlanetId,
  searchPlacesByQuery,
} from '../astro/astroEngine';
import { ZodiacTradition } from '../astro/chineseAstrology';
import { AspectFilter, CameraPreset, SceneDisplayFocus } from '../vr/AstrologyScene';
import {
  STARFIELD_BACKDROP_STYLES,
  StarfieldBackdropStyle,
  ZODIAC_SIGN_STYLES,
  ZODIAC_WHEEL_STYLES,
  ZodiacSignStyle,
  ZodiacWheelStyle,
} from '../vr/textures';
import { ZodiacSignArtSvg } from './ZodiacSignArtSvg';

type DockTab = 'natal' | 'derived' | 'aspects' | 'camera';

export type ComparativePairKind =
  | 'natal-vs-sr'
  | 'sr-vs-sr'
  | 'natal-vs-natal'
  | 'natal-vs-transit';

interface ControlDockProps {
  mode: ChartMode;
  onModeChange: (m: ChartMode) => void;
  tradition: ZodiacTradition;
  onTraditionChange: (t: ZodiacTradition) => void;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  collapsed: boolean;
  onToggleCollapse: () => void;

  // Natal profile state & CRUD
  profiles: NatalProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  draftProfile: NatalProfile;
  onDraftProfileChange: (patch: Partial<NatalProfile>) => void;
  onSaveProfile: () => void;
  onCreateNewProfile: () => void;
  onDeleteProfile: (id: string) => void;

  // Secondary profile & Comparative options
  partnerProfileId: string;
  onPartnerProfileChange: (id: string) => void;
  comparativePair: ComparativePairKind;
  onComparativePairChange: (kind: ComparativePairKind) => void;
  comparativeYearA: number;
  onComparativeYearAChange: (year: number) => void;
  comparativeYearB: number;
  onComparativeYearBChange: (year: number) => void;

  // Derived / Transits / Solar Return / Lunar Return / Progressions dates
  transitDateInput: string;
  onTransitDateChange: (val: string) => void;
  onResetTransitNow: () => void;
  solarReturnYear: number;
  onSolarReturnYearChange: (year: number) => void;
  solarReturnCityId: string;
  onSolarReturnCityChange: (id: string) => void;
  solarReturnCustomLoc: { name: string; latitude: number; longitude: number } | null;
  onSolarReturnCustomLocChange: (loc: { name: string; latitude: number; longitude: number } | null) => void;
  solarReturnExactDate: Date | null;
  lunarReturnExactDate: Date | null;

  // Time animation & aspect filtering
  timeSpeedDaysPerSec: number;
  onTimeSpeedChange: (speed: number) => void;
  srAnimSpeed: number;
  onSrAnimSpeedChange: (speed: number) => void;
  aspectFilter: AspectFilter;
  onAspectFilterChange: (f: AspectFilter) => void;
  onHighlightAspect: (aspectId: string | null) => void;

  // 3D Layers & Camera
  wheelStyle: ZodiacWheelStyle;
  onWheelStyleChange: (s: ZodiacWheelStyle) => void;
  signStyle: ZodiacSignStyle;
  onSignStyleChange: (s: ZodiacSignStyle) => void;
  starfieldStyle: StarfieldBackdropStyle;
  onStarfieldStyleChange: (s: StarfieldBackdropStyle) => void;
  displayFocus: SceneDisplayFocus;
  onDisplayFocusChange: (f: SceneDisplayFocus) => void;
  showHouses: boolean;
  onToggleHouses: () => void;
  showConstellations: boolean;
  onToggleConstellations: () => void;
  showVRPlaque: boolean;
  onToggleVRPlaque: () => void;
  desktopMR: boolean;
  onToggleDesktopMR: () => void;
  mrScale: number;
  onMrScaleChange: (s: number) => void;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  selectedPlanetId: PlanetId | null;
  onSelectPlanet: (id: PlanetId, layer: 'base' | 'outer') => void;
  onOpenFullSummary: () => void;
  onOpenQuestGuide: () => void;
}

const MODE_LABELS: Array<{ id: ChartMode; label: string }> = [
  { id: 'natal', label: 'Thème Natal' },
  { id: 'solarReturn', label: 'Rév. Solaire' },
  { id: 'comparative', label: 'Comparatifs' },
  { id: 'transits', label: 'Transits' },
  { id: 'lunarReturn', label: 'Rév. Lunaire' },
  { id: 'progressions', label: 'Progressions' },
  { id: 'synastry', label: 'Synastrie' },
  { id: 'composite', label: 'Composite' },
  { id: 'live', label: 'En direct' },
];

export const ControlDock: React.FC<ControlDockProps> = ({
  mode,
  onModeChange,
  tradition,
  onTraditionChange,
  baseChart,
  outerChart,
  comparisonAspects,
  collapsed,
  onToggleCollapse,
  profiles,
  activeProfileId,
  onSelectProfile,
  draftProfile,
  onDraftProfileChange,
  onSaveProfile,
  onCreateNewProfile,
  onDeleteProfile,
  partnerProfileId,
  onPartnerProfileChange,
  comparativePair,
  onComparativePairChange,
  comparativeYearA,
  onComparativeYearAChange,
  comparativeYearB,
  onComparativeYearBChange,
  transitDateInput,
  onTransitDateChange,
  onResetTransitNow,
  solarReturnYear,
  onSolarReturnYearChange,
  solarReturnCityId,
  onSolarReturnCityChange,
  solarReturnCustomLoc,
  onSolarReturnCustomLocChange,
  solarReturnExactDate,
  lunarReturnExactDate,
  timeSpeedDaysPerSec,
  onTimeSpeedChange,
  srAnimSpeed,
  onSrAnimSpeedChange,
  aspectFilter,
  onAspectFilterChange,
  onHighlightAspect,
  wheelStyle,
  onWheelStyleChange,
  signStyle,
  onSignStyleChange,
  starfieldStyle,
  onStarfieldStyleChange,
  displayFocus,
  onDisplayFocusChange,
  showHouses,
  onToggleHouses,
  showConstellations,
  onToggleConstellations,
  showVRPlaque,
  onToggleVRPlaque,
  desktopMR,
  onToggleDesktopMR,
  mrScale,
  onMrScaleChange,
  cameraPreset,
  onCameraPresetChange,
  audioEnabled,
  onToggleAudio,
  selectedPlanetId,
  onSelectPlanet,
  onOpenFullSummary,
  onOpenQuestGuide,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('natal');
  const [useCustomCoords, setUseCustomCoords] = useState<boolean>(
    Boolean(draftProfile.customCityName && draftProfile.customLat !== undefined)
  );
  const [natalPlaceQuery, setNatalPlaceQuery] = useState<string>('');
  const [natalCandidates, setNatalCandidates] = useState<GeocodedPlace[]>([]);
  const [srPlaceQuery, setSrPlaceQuery] = useState<string>('');
  const [srCandidates, setSrCandidates] = useState<GeocodedPlace[]>([]);
  const [placeLookupBusy, setPlaceLookupBusy] = useState<boolean>(false);
  const [placeLookupError, setPlaceLookupError] = useState<string | null>(null);

  const birthParts = (() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(draftProfile.birthDateIso);
    if (!m) return { year: 1992, month: 5, day: 14, time: '08:30' };
    return {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      time: `${m[4]}:${m[5]}`,
    };
  })();

  const updateBirthIso = (patch: Partial<{ year: number; month: number; day: number; time: string }>) => {
    const y = Math.min(2100, Math.max(1900, patch.year ?? birthParts.year));
    const mo = Math.min(12, Math.max(1, patch.month ?? birthParts.month));
    const maxDays = new Date(y, mo, 0).getDate();
    const d = Math.min(maxDays, Math.max(1, patch.day ?? birthParts.day));
    const t = patch.time ?? birthParts.time;
    const pad = (n: number) => String(n).padStart(2, '0');
    onDraftProfileChange({
      birthDateIso: `${String(y).padStart(4, '0')}-${pad(mo)}-${pad(d)}T${t}`,
    });
  };

  const applyNatalCandidate = (found: GeocodedPlace) => {
    onDraftProfileChange({
      customCityName: found.name,
      customLat: found.latitude,
      customLon: found.longitude,
    });
    setUseCustomCoords(true);
  };

  const handleNatalPlaceSearch = async () => {
    if (!natalPlaceQuery.trim()) return;
    setPlaceLookupBusy(true);
    setPlaceLookupError(null);
    setNatalCandidates([]);
    const results = await searchPlacesByQuery(natalPlaceQuery);
    setPlaceLookupBusy(false);
    if (results.length === 0) {
      setPlaceLookupError('Lieu ou code postal introuvable. Saisissez Lat/Lon manuellement.');
      return;
    }
    applyNatalCandidate(results[0]);
    if (results.length > 1) {
      setNatalCandidates(results);
    }
  };

  const handleSrPlaceSearch = async () => {
    if (!srPlaceQuery.trim()) return;
    setPlaceLookupBusy(true);
    setPlaceLookupError(null);
    setSrCandidates([]);
    const results = await searchPlacesByQuery(srPlaceQuery);
    setPlaceLookupBusy(false);
    if (results.length === 0) {
      setPlaceLookupError('Lieu ou code postal anniversaire introuvable.');
      return;
    }
    onSolarReturnCustomLocChange(results[0]);
    if (results.length > 1) {
      setSrCandidates(results);
    }
  };

  const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const fmtDateTimeFr = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d)
      : '—';

  const currentYear = new Date().getFullYear();
  const srYears = Array.from({ length: 13 }, (_, i) => currentYear - 5 + i);

  return (
    <div
      className={`no-print pointer-events-none fixed bottom-4 left-1/2 z-20 w-[min(1060px,95vw)] -translate-x-1/2 transition-transform duration-300 ease-out ${
        collapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
      }`}
    >
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          className="pointer-events-auto flex items-center gap-2 rounded-t-lg border border-b-0 border-[#d4af37]/30 bg-[#080d1b]/95 px-4 py-1.5 text-xs font-medium text-[#e7cfa0] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Contrôles (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Masquer les contrôles</span>
            </>
          )}
        </button>
      </div>

      <div className="pointer-events-auto rounded-xl border border-[#d4af37]/30 bg-[#080d1b]/95 p-3.5 shadow-2xl">
        {/* Mode Switcher Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto cosmic-scroll">
            {MODE_LABELS.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onModeChange(item.id);
                    if (
                      item.id === 'transits' ||
                      item.id === 'solarReturn' ||
                      item.id === 'lunarReturn' ||
                      item.id === 'progressions' ||
                      item.id === 'synastry' ||
                      item.id === 'composite' ||
                      item.id === 'comparative'
                    ) {
                      setActiveTab('derived');
                    } else if (item.id === 'natal') {
                      setActiveTab('natal');
                    }
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#38bdf8]/20 text-[#7dd3fc] ring-1 ring-[#38bdf8]/40'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(mode === 'transits' ||
              mode === 'live' ||
              mode === 'progressions' ||
              mode === 'lunarReturn' ||
              mode === 'solarReturn' ||
              (mode === 'comparative' && comparativePair !== 'natal-vs-natal')) && (() => {
              const isSrCycle =
                mode === 'solarReturn' ||
                (mode === 'comparative' &&
                  (comparativePair === 'natal-vs-sr' || comparativePair === 'sr-vs-sr'));
              const isPlaying = isSrCycle ? srAnimSpeed > 0 : timeSpeedDaysPerSec > 0;
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (isSrCycle) {
                      onSrAnimSpeedChange(isPlaying ? 0 : 1);
                    } else if (mode === 'live') {
                      if (!isPlaying) onResetTransitNow();
                      onTimeSpeedChange(isPlaying ? 0 : 1 / 86400);
                    } else if (mode === 'lunarReturn') {
                      onTimeSpeedChange(isPlaying ? 0 : 30);
                    } else {
                      onTimeSpeedChange(isPlaying ? 0 : 1);
                    }
                  }}
                  title={isPlaying ? 'Mettre en pause l’animation' : 'Animer en temps réel'}
                  className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isPlaying
                      ? 'border-[#38bdf8] bg-[#38bdf8] text-[#05070e] font-semibold'
                      : 'border-[#38bdf8]/40 bg-[#0d1428] text-[#7dd3fc] hover:bg-[#38bdf8]/15'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Animer'}</span>
                </button>
              );
            })()}

            <div
              role="group"
              aria-label="Tradition zodiacale"
              className="flex items-center rounded-md border border-white/10 bg-[#0d1428] p-0.5"
            >
              <button
                type="button"
                onClick={() => onTraditionChange('western')}
                className={`rounded px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tradition === 'western'
                    ? 'bg-[#d4af37] text-[#05070e] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Occidental
              </button>
              <button
                type="button"
                onClick={() => onTraditionChange('chinese')}
                className={`rounded px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tradition === 'chinese'
                    ? 'bg-[#e0533c] text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Chinois 龍
              </button>
            </div>

            <select
              aria-label="Style des signes zodiaquaux"
              title="Choisir le graphisme des signes zodiaquaux"
              value={signStyle}
              onChange={(e) => onSignStyleChange(e.target.value as ZodiacSignStyle)}
              className="hidden sm:block rounded-md border border-[#d4af37]/30 bg-[#0d1428] px-2 py-1.5 text-[11px] font-medium text-[#fde68a] hover:border-[#d4af37] focus:outline-none cursor-pointer"
            >
              {ZODIAC_SIGN_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  Signes : {st.shortLabel}
                </option>
              ))}
            </select>

            <select
              aria-label="Graphisme de la roue zodiacale"
              title="Choisir le graphisme de la roue zodiacale"
              value={wheelStyle}
              onChange={(e) => onWheelStyleChange(e.target.value as ZodiacWheelStyle)}
              className="hidden sm:block rounded-md border border-[#d4af37]/30 bg-[#0d1428] px-2 py-1.5 text-[11px] font-medium text-[#e7cfa0] hover:border-[#d4af37] focus:outline-none cursor-pointer"
            >
              {ZODIAC_WHEEL_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  Roue : {st.shortLabel}
                </option>
              ))}
            </select>

            <select
              aria-label="Fond étoilé et Voie lactée"
              title="Choisir le fond étoilé"
              value={starfieldStyle}
              onChange={(e) => onStarfieldStyleChange(e.target.value as StarfieldBackdropStyle)}
              className="hidden md:block rounded-md border border-[#38bdf8]/30 bg-[#0d1428] px-2 py-1.5 text-[11px] font-medium text-[#bae6fd] hover:border-[#38bdf8] focus:outline-none cursor-pointer"
            >
              {STARFIELD_BACKDROP_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  Ciel : {st.shortLabel}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenFullSummary}
              className="flex items-center gap-1.5 rounded-md border border-[#d4af37]/35 bg-[#121931] px-2.5 py-1.5 text-xs font-medium text-[#e7cfa0] hover:border-[#d4af37] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>{outerChart ? 'Interprétation & Comparatif' : 'Interprétation & Bilan'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs + Planet Quick-Jump */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1 rounded-lg bg-[#0d1428] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('natal')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'natal' ? 'bg-[#d4af37] text-[#05070e]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Thème Natal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('derived')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'derived' ? 'bg-[#d4af37] text-[#05070e]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rév. Solaire & Comparatifs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('aspects')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'aspects' ? 'bg-[#d4af37] text-[#05070e]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Aspects ({outerChart ? comparisonAspects.length : baseChart.aspects.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'camera' ? 'bg-[#d4af37] text-[#05070e]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Caméra & VR</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto cosmic-scroll">
            <div
              role="group"
              aria-label="Affichage sélectif des éléments 3D"
              className="flex items-center gap-0.5 rounded-md border border-white/10 bg-[#0d1428] p-0.5 shrink-0"
            >
              {(
                [
                  ['all', 'Tout'],
                  ['planetsOnly', 'Planètes seules'],
                  ['aspectsOnly', 'Aspects seuls'],
                  ['housesOnly', 'Maisons'],
                ] as const
              ).map(([focusKey, focusLabel]) => (
                <button
                  key={focusKey}
                  type="button"
                  onClick={() => onDisplayFocusChange(focusKey)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    displayFocus === focusKey
                      ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {focusLabel}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {baseChart.planets.map((p) => {
                const active = selectedPlanetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPlanet(p.id, 'base')}
                    title={`${p.name} — ${p.formattedDeg} ${p.sign.name}`}
                    className={`rounded-md px-2 py-1 text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#d4af37]/25 text-[#fbbf24] ring-1 ring-[#d4af37]/60'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {p.symbol}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TAB 1: Thème Natal */}
        {activeTab === 'natal' && (
          <div className="mt-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  aria-label="Profil natal enregistré"
                  value={activeProfileId}
                  onChange={(e) => onSelectProfile(e.target.value)}
                  className="rounded-lg border border-[#d4af37]/35 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none cursor-pointer"
                >
                  {profiles.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onCreateNewProfile}
                  className="flex items-center gap-1 rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 text-xs text-slate-200 hover:border-[#d4af37] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Nouveau thème</span>
                </button>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteProfile(activeProfileId)}
                    title="Supprimer ce profil"
                    className="rounded-lg border border-white/10 bg-[#0d1428] p-1.5 text-slate-400 hover:border-rose-400/50 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomCoords((v) => !v)}
                  className="rounded-lg border border-white/10 bg-[#0d1428] px-2.5 py-1.5 text-[11px] text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  {useCustomCoords ? 'Villes prédéfinies' : 'Lat / Lon manuelles'}
                </button>
                <button
                  type="button"
                  onClick={onSaveProfile}
                  className="flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-12 items-end">
              <div className="col-span-2 md:col-span-3">
                <label htmlFor="natal-name" className="block text-[11px] text-slate-400 mb-1">
                  Intitulé du thème
                </label>
                <input
                  id="natal-name"
                  type="text"
                  value={draftProfile.name}
                  onChange={(e) => onDraftProfileChange({ name: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-1">
                <label htmlFor="natal-day" className="block text-[11px] text-slate-400 mb-1">
                  Jour
                </label>
                <select
                  id="natal-day"
                  value={birthParts.day}
                  onChange={(e) => updateBirthIso({ day: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {String(d).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="natal-month" className="block text-[11px] text-slate-400 mb-1">
                  Mois de naissance
                </label>
                <select
                  id="natal-month"
                  value={birthParts.month}
                  onChange={(e) => updateBirthIso({ month: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none cursor-pointer"
                >
                  {MONTHS_FR.map((mName, idx) => (
                    <option key={mName} value={idx + 1}>
                      {mName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="natal-year" className="block text-[11px] text-slate-400 mb-1">
                  Année de naissance
                </label>
                <input
                  id="natal-year"
                  type="number"
                  min={1900}
                  max={2100}
                  value={birthParts.year}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v >= 1900 && v <= 2100) updateBirthIso({ year: v });
                  }}
                  className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label htmlFor="natal-time" className="block text-[11px] text-slate-400 mb-1">
                  Heure de naissance
                </label>
                <input
                  id="natal-time"
                  type="time"
                  value={birthParts.time}
                  onChange={(e) => {
                    if (e.target.value) updateBirthIso({ time: e.target.value });
                  }}
                  className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="col-span-2 md:col-span-2">
                <label htmlFor="natal-houses" className="block text-[11px] text-slate-400 mb-1">
                  Maisons
                </label>
                <select
                  id="natal-houses"
                  value={draftProfile.houseSystem}
                  onChange={(e) =>
                    onDraftProfileChange({ houseSystem: e.target.value as HouseSystem })
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none cursor-pointer"
                >
                  <option value="placidus">Placidus</option>
                  <option value="equal">Égales</option>
                  <option value="wholesign">Signes Entiers</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-12 items-end">
              {!useCustomCoords ? (
                <div className="md:col-span-6">
                  <label htmlFor="natal-city" className="block text-[11px] text-slate-400 mb-1">
                    Ville ou Pays de naissance
                  </label>
                  <select
                    id="natal-city"
                    value={draftProfile.cityId}
                    onChange={(e) =>
                      onDraftProfileChange({
                        cityId: e.target.value,
                        customCityName: undefined,
                        customLat: undefined,
                        customLon: undefined,
                      })
                    }
                    className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none cursor-pointer"
                  >
                    {CITY_PRESETS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="md:col-span-4">
                    <label htmlFor="natal-custom-city" className="block text-[11px] text-slate-400 mb-1">
                      Ville / Pays personnalisé
                    </label>
                    <input
                      id="natal-custom-city"
                      type="text"
                      placeholder="Ex: Bordeaux, France"
                      value={draftProfile.customCityName ?? ''}
                      onChange={(e) => onDraftProfileChange({ customCityName: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="natal-lat" className="block text-[11px] text-slate-400 mb-1">
                      Lat
                    </label>
                    <input
                      id="natal-lat"
                      type="number"
                      step="0.01"
                      value={draftProfile.customLat ?? 48.86}
                      onChange={(e) =>
                        onDraftProfileChange({ customLat: Number(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="natal-lon" className="block text-[11px] text-slate-400 mb-1">
                      Lon
                    </label>
                    <input
                      id="natal-lon"
                      type="number"
                      step="0.01"
                      value={draftProfile.customLon ?? 2.35}
                      onChange={(e) =>
                        onDraftProfileChange({ customLon: Number(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-6">
                <label htmlFor="natal-place-search" className="block text-[11px] text-slate-400 mb-1">
                  Code postal (France), Ville ou Pays de naissance
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="natal-place-search"
                    type="text"
                    placeholder="Ex: 75008, 69002, Toulouse, Casablanca..."
                    value={natalPlaceQuery}
                    onChange={(e) => setNatalPlaceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleNatalPlaceSearch();
                    }}
                    className="flex-1 rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={placeLookupBusy}
                    onClick={() => void handleNatalPlaceSearch()}
                    className="rounded-lg border border-[#d4af37]/40 bg-[#121931] px-3 py-1.5 text-xs font-medium text-[#e7cfa0] hover:border-[#d4af37] disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {placeLookupBusy ? '...' : 'Chercher'}
                  </button>
                </div>
                {natalCandidates.length > 1 && (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400">Communes :</span>
                    {natalCandidates.slice(0, 5).map((cand) => (
                      <button
                        key={cand.name}
                        type="button"
                        onClick={() => applyNatalCandidate(cand)}
                        className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors cursor-pointer ${
                          draftProfile.customCityName === cand.name
                            ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f3d67a]'
                            : 'border-white/15 bg-[#0d1428] text-slate-300 hover:border-[#d4af37]/50'
                        }`}
                      >
                        {cand.name.replace(/\s*\(\d{5},\s*France\)/, '')}
                      </button>
                    ))}
                  </div>
                )}
                {placeLookupError && (
                  <div className="text-[10px] text-rose-300 mt-0.5">{placeLookupError}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Révolution Solaire, Comparatifs & Transits */}
        {activeTab === 'derived' && (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            {mode === 'comparative' && (
              <div className="flex flex-wrap items-end gap-3 w-full">
                <div>
                  <label htmlFor="comp-pair" className="block text-[11px] text-slate-400 mb-1">
                    Type de comparatif (Double Roue 3D)
                  </label>
                  <select
                    id="comp-pair"
                    value={comparativePair}
                    onChange={(e) => onComparativePairChange(e.target.value as ComparativePairKind)}
                    className="rounded-lg border border-[#38bdf8]/40 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#38bdf8] focus:outline-none cursor-pointer"
                  >
                    <option value="sr-vs-sr">Rév. Solaire Année A vs Année B</option>
                    <option value="natal-vs-sr">Thème Natal vs Rév. Solaire</option>
                    <option value="natal-vs-natal">Thème Natal A vs Thème Natal B</option>
                    <option value="natal-vs-transit">Thème Natal vs Ciel / Transit</option>
                  </select>
                </div>

                {comparativePair === 'sr-vs-sr' && (
                  <>
                    <div>
                      <label htmlFor="comp-yr-a" className="block text-[11px] text-slate-400 mb-1">
                        RS Base (Or)
                      </label>
                      <select
                        id="comp-yr-a"
                        value={comparativeYearA}
                        onChange={(e) => onComparativeYearAChange(Number(e.target.value))}
                        className="rounded-lg border border-[#d4af37]/40 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
                      >
                        {srYears.map((y) => (
                          <option key={`a-${y}`} value={y}>
                            RS {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="comp-yr-b" className="block text-[11px] text-slate-400 mb-1">
                        RS Comparée (Cyan)
                      </label>
                      <select
                        id="comp-yr-b"
                        value={comparativeYearB}
                        onChange={(e) => onComparativeYearBChange(Number(e.target.value))}
                        className="rounded-lg border border-[#38bdf8]/40 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
                      >
                        {srYears.map((y) => (
                          <option key={`b-${y}`} value={y}>
                            RS {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {comparativePair === 'natal-vs-sr' && (
                  <div>
                    <label htmlFor="comp-sr-yr" className="block text-[11px] text-slate-400 mb-1">
                      Année RS comparée
                    </label>
                    <select
                      id="comp-sr-yr"
                      value={solarReturnYear}
                      onChange={(e) => onSolarReturnYearChange(Number(e.target.value))}
                      className="rounded-lg border border-[#38bdf8]/40 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
                    >
                      {srYears.map((y) => (
                        <option key={y} value={y}>
                          RS {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {comparativePair === 'natal-vs-natal' && (
                  <div>
                    <label htmlFor="comp-partner" className="block text-[11px] text-slate-400 mb-1">
                      Thème comparé (Cyan)
                    </label>
                    <select
                      id="comp-partner"
                      value={partnerProfileId}
                      onChange={(e) => onPartnerProfileChange(e.target.value)}
                      className="rounded-lg border border-[#38bdf8]/40 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] cursor-pointer"
                    >
                      {profiles.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(comparativePair === 'sr-vs-sr' || comparativePair === 'natal-vs-sr') && (
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">Animer RS</div>
                    <div className="flex items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                      {[
                        { speed: 0, label: 'Pause' },
                        { speed: 1, label: '1 an/2s' },
                        { speed: 2, label: '1 an/s' },
                      ].map((opt) => (
                        <button
                          key={opt.speed}
                          type="button"
                          onClick={() => onSrAnimSpeedChange(opt.speed)}
                          className={`rounded-md px-2 py-1 font-mono-tabular text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            srAnimSpeed === opt.speed
                              ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {comparativePair === 'natal-vs-transit' && (
                  <>
                    <div>
                      <label htmlFor="comp-tr-date" className="block text-[11px] text-slate-400 mb-1">
                        Date de transit
                      </label>
                      <input
                        id="comp-tr-date"
                        type="datetime-local"
                        value={transitDateInput}
                        onChange={(e) => onTransitDateChange(e.target.value)}
                        className="rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6]"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 mb-1">Animer transit</div>
                      <div className="flex items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                        {[
                          { speed: 0, label: 'Pause' },
                          { speed: 1 / 86400, label: 'Temps réel' },
                          { speed: 1, label: '1 j/s' },
                          { speed: 7, label: '7 j/s' },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => onTimeSpeedChange(opt.speed)}
                            className={`rounded-md px-2 py-1 font-mono-tabular text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              Math.abs(timeSpeedDaysPerSec - opt.speed) < 1e-7
                                ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={onOpenFullSummary}
                  className="rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/45 px-3 py-1.5 text-xs font-medium text-[#7dd3fc] hover:bg-[#38bdf8]/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Ouvrir le tableau comparatif
                </button>
              </div>
            )}

            {(mode === 'transits' ||
              mode === 'live' ||
              mode === 'progressions' ||
              mode === 'lunarReturn' ||
              mode === 'natal') && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="transit-datetime" className="block text-[11px] text-slate-400 mb-1">
                    {mode === 'progressions'
                      ? 'Date cible de progression'
                      : mode === 'lunarReturn'
                        ? 'Mois de référence (Rév. Lunaire)'
                        : 'Date & Heure du ciel / transit'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="transit-datetime"
                      type="datetime-local"
                      value={transitDateInput}
                      onChange={(e) => onTransitDateChange(e.target.value)}
                      className="rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#38bdf8] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={onResetTransitNow}
                      title="Instant présent"
                      className="rounded-lg border border-white/15 bg-[#0d1428] p-1.5 text-slate-300 hover:border-[#38bdf8] hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {mode === 'lunarReturn' && (
                  <div className="text-xs text-[#7dd3fc] font-mono-tabular pb-1.5">
                    Retour lunaire exact : {fmtDateTimeFr(lunarReturnExactDate)}
                  </div>
                )}

                {(mode === 'transits' ||
                  mode === 'live' ||
                  mode === 'progressions' ||
                  mode === 'lunarReturn') && (
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">
                      {mode === 'lunarReturn'
                        ? 'Animation des Révolutions Lunaires'
                        : 'Animation temps réel & transits'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                      <button
                        type="button"
                        onClick={() =>
                          onTimeSpeedChange(
                            timeSpeedDaysPerSec === 0
                              ? mode === 'live'
                                ? 1 / 86400
                                : mode === 'lunarReturn'
                                  ? 30
                                  : 1
                              : 0
                          )
                        }
                        aria-label={timeSpeedDaysPerSec === 0 ? 'Animer' : 'Pause'}
                        className="rounded-md px-2 py-1 text-xs text-[#38bdf8] hover:bg-white/5 cursor-pointer"
                      >
                        {timeSpeedDaysPerSec === 0 ? (
                          <Play className="w-3.5 h-3.5" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {[
                        { speed: 0, label: 'Pause' },
                        { speed: 1 / 86400, label: 'Temps réel' },
                        { speed: 1 / 24, label: '1 h/s' },
                        { speed: 1, label: '1 j/s' },
                        { speed: 7, label: '7 j/s' },
                        { speed: 30, label: '1 m/s' },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            if (opt.speed === 1 / 86400 && mode === 'live') {
                              onResetTransitNow();
                            }
                            onTimeSpeedChange(opt.speed);
                          }}
                          className={`rounded-md px-2 py-1 font-mono-tabular text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            Math.abs(timeSpeedDaysPerSec - opt.speed) < 1e-7
                              ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'solarReturn' && (
              <div className="flex flex-wrap items-end gap-3 w-full justify-between">
                <div className="flex flex-wrap items-end gap-2.5">
                  <div>
                    <label htmlFor="sr-year" className="block text-[11px] text-slate-400 mb-1">
                      Année de Révolution Solaire
                    </label>
                    <select
                      id="sr-year"
                      value={solarReturnYear}
                      onChange={(e) => onSolarReturnYearChange(Number(e.target.value))}
                      className="rounded-lg border border-[#38bdf8]/40 bg-[#0d1428] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6] focus:border-[#38bdf8] focus:outline-none cursor-pointer"
                    >
                      {srYears.map((y) => (
                        <option key={y} value={y}>
                          Révolution {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sr-city" className="block text-[11px] text-slate-400 mb-1">
                      Lieu de résidence au moment de l’anniversaire
                    </label>
                    <select
                      id="sr-city"
                      value={solarReturnCustomLoc ? '__custom__' : solarReturnCityId}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') return;
                        onSolarReturnCustomLocChange(null);
                        onSolarReturnCityChange(e.target.value);
                      }}
                      className="rounded-lg border border-white/15 bg-[#0d1428] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#38bdf8] focus:outline-none cursor-pointer"
                    >
                      {solarReturnCustomLoc && (
                        <option value="__custom__">{solarReturnCustomLoc.name}</option>
                      )}
                      {CITY_PRESETS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sr-place-search" className="block text-[11px] text-slate-400 mb-1">
                      Code postal (FR), ville ou pays anniversaire
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="sr-place-search"
                        type="text"
                        placeholder="Ex: 06000, Nice, Lisbonne..."
                        value={srPlaceQuery}
                        onChange={(e) => setSrPlaceQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSrPlaceSearch();
                        }}
                        className="w-40 rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1.5 text-xs text-[#f3efe6] focus:border-[#38bdf8] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={placeLookupBusy}
                        onClick={() => void handleSrPlaceSearch()}
                        className="rounded-lg border border-[#38bdf8]/40 bg-[#121931] px-2.5 py-1.5 text-xs text-[#7dd3fc] hover:border-[#38bdf8] cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                    {srCandidates.length > 1 && (
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        {srCandidates.slice(0, 4).map((cand) => (
                          <button
                            key={cand.name}
                            type="button"
                            onClick={() => onSolarReturnCustomLocChange(cand)}
                            className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors cursor-pointer ${
                              solarReturnCustomLoc?.name === cand.name
                                ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#7dd3fc]'
                                : 'border-white/15 bg-[#0d1428] text-slate-300'
                            }`}
                          >
                            {cand.name.replace(/\s*\(\d{5},\s*France\)/, '')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">Animer les révolutions</div>
                    <div className="flex items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                      <button
                        type="button"
                        onClick={() => onSrAnimSpeedChange(srAnimSpeed === 0 ? 1 : 0)}
                        aria-label={srAnimSpeed === 0 ? 'Animer révolutions' : 'Pause révolutions'}
                        className="rounded-md px-2 py-1 text-xs text-[#38bdf8] hover:bg-white/5 cursor-pointer"
                      >
                        {srAnimSpeed === 0 ? (
                          <Play className="w-3.5 h-3.5" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {[
                        { speed: 0, label: 'Pause' },
                        { speed: 1, label: '1 an/2s' },
                        { speed: 2, label: '1 an/s' },
                      ].map((opt) => (
                        <button
                          key={opt.speed}
                          type="button"
                          onClick={() => onSrAnimSpeedChange(opt.speed)}
                          className={`rounded-md px-2 py-1 font-mono-tabular text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            srAnimSpeed === opt.speed
                              ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-[#7dd3fc] font-mono-tabular pb-1">
                    {fmtDateTimeFr(solarReturnExactDate)}
                    {outerChart
                      ? ` · ASC RS ${outerChart.ascSign.symbol} ${outerChart.ascSign.name}`
                      : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenFullSummary}
                  className="rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/45 px-3 py-1.5 text-xs font-medium text-[#7dd3fc] hover:bg-[#38bdf8]/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Interprétation RS
                </button>
              </div>
            )}

            {(mode === 'synastry' || mode === 'composite') && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="partner-profile" className="block text-[11px] text-slate-400 mb-1">
                    Second thème comparé (Partenaire B)
                  </label>
                  <select
                    id="partner-profile"
                    value={partnerProfileId}
                    onChange={(e) => onPartnerProfileChange(e.target.value)}
                    className="rounded-lg border border-[#38bdf8]/40 bg-[#0d1428] px-3 py-1.5 text-xs text-[#f3efe6] focus:border-[#38bdf8] focus:outline-none cursor-pointer"
                  >
                    {profiles.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-slate-300 pb-1.5">
                  {mode === 'synastry'
                    ? 'Double roue 3D : Profil A (Or) comparé au Profil B (Cyan).'
                    : 'Thème unique calculé par mi-points écliptiques exacts entre A et B.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Aspects Explorer */}
        {activeTab === 'aspects' && (
          <div className="mt-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                {(
                  [
                    ['all', 'Tous'],
                    ...(outerChart ? ([['comparison', 'Comparés (Ext → Base)']] as const) : []),
                    ['natal', 'Internes'],
                    ['harmonious', 'Harmoniques'],
                    ['tense', 'Tensions'],
                    ['none', 'Masquer'],
                  ] as Array<[AspectFilter, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onAspectFilterChange(key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      aspectFilter === key
                        ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">
                Cliquez un aspect pour illuminer son faisceau dans la sphère 3D
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto cosmic-scroll pb-1">
              {(outerChart ? comparisonAspects : baseChart.aspects).slice(0, 14).map((asp) => {
                const isComp = 'outerSymbol' in asp;
                const label = isComp
                  ? `${asp.outerSymbol} ${asp.symbol} ${asp.natalSymbol}`
                  : `${asp.planetASymbol} ${asp.symbol} ${asp.planetBSymbol}`;
                return (
                  <button
                    key={asp.id}
                    type="button"
                    title={asp.interpretation}
                    onClick={() => onHighlightAspect(asp.id)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1428] px-2.5 py-1.5 text-xs hover:border-[#d4af37]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span style={{ color: asp.cssColor }} className="font-semibold">
                      {label}
                    </span>
                    <span className="font-mono-tabular text-[11px] text-slate-400">
                      {asp.orb.toFixed(1)}°
                    </span>
                  </button>
                );
              })}
              {(outerChart ? comparisonAspects : baseChart.aspects).length === 0 && (
                <span className="text-xs text-slate-400">Aucun aspect majeur dans cet orbe.</span>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Camera, Sign Art, Wheel Graphics, Starfield Sky, Spatial Layers & Meta Quest 3 */}
        {activeTab === 'camera' && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                  Signes Zodiaquaux (Vectoriel Sculpté)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ZODIAC_SIGN_STYLES.map((st, idx) => {
                    const active = signStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSignStyleChange(st.id)}
                        title={st.description}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-[#fde68a] bg-[#d4af37]/20 text-[#fffbeb]'
                            : 'border-white/10 bg-[#0d1428] text-slate-300 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full border shrink-0"
                          style={{
                            backgroundColor: st.swatchPrimary,
                            borderColor: st.swatchAccent,
                          }}
                        >
                          <ZodiacSignArtSvg
                            signIndex={[4, 0, 6, 8][idx % 4]}
                            element={(['Feu', 'Feu', 'Air', 'Feu'] as const)[idx % 4]}
                            style={st.id}
                            size={22}
                            primaryColor={st.swatchAccent}
                            accentColor={st.swatchAccent}
                          />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{st.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{st.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                  Graphisme de la Roue Zodiacale
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ZODIAC_WHEEL_STYLES.map((st) => {
                    const active = wheelStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onWheelStyleChange(st.id)}
                        title={st.description}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f8f3e6]'
                            : 'border-white/10 bg-[#0d1428] text-slate-300 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-4 h-4 rounded-full border shrink-0"
                          style={{
                            backgroundColor: st.swatchPrimary,
                            borderColor: st.swatchAccent,
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{st.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{st.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                  Fonds Étoilés & Voie Lactée
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARFIELD_BACKDROP_STYLES.map((st) => {
                    const active = starfieldStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onStarfieldStyleChange(st.id)}
                        title={st.description}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#f8f3e6]'
                            : 'border-white/10 bg-[#0d1428] text-slate-300 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-4 h-4 rounded-full border shrink-0"
                          style={{
                            backgroundColor: st.swatchPrimary,
                            borderColor: st.swatchAccent,
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{st.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{st.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">Points de vue 3D / VR</div>
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                  {(
                    [
                      ['overview', 'Vue Observatoire'],
                      ['center', 'Centre 360°'],
                      ['ecliptic', 'Plan Zénithal'],
                      ['horizon', 'Horizon'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onCameraPresetChange(id)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        cameraPreset === id ? 'bg-[#d4af37] text-[#05070e]' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">Isoler un élément</div>
                <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                  {(
                    [
                      ['all', 'Tout'],
                      ['planetsOnly', 'Planètes seules'],
                      ['aspectsOnly', 'Aspects seuls'],
                      ['housesOnly', 'Zodiaque & Maisons'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onDisplayFocusChange(id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        displayFocus === id ? 'bg-[#38bdf8] text-[#05070e] font-semibold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleHouses}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showHouses
                    ? 'border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f3efe6]'
                    : 'border-white/10 bg-[#0d1428] text-slate-400'
                }`}
              >
                Maisons
              </button>
              <button
                type="button"
                onClick={onToggleConstellations}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showConstellations
                    ? 'border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f3efe6]'
                    : 'border-white/10 bg-[#0d1428] text-slate-400'
                }`}
              >
                Voûte étoilée
              </button>
              <button
                type="button"
                onClick={onToggleVRPlaque}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showVRPlaque
                    ? 'border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f3efe6]'
                    : 'border-white/10 bg-[#0d1428] text-slate-400'
                }`}
              >
                Pupitre VR 3D
              </button>
              <button
                type="button"
                onClick={onToggleDesktopMR}
                title="Active la transparence holographique (Passthrough / Caméra) sans sol opaque"
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  desktopMR
                    ? 'border-[#38bdf8]/60 bg-[#38bdf8]/20 text-[#7dd3fc]'
                    : 'border-white/10 bg-[#0d1428] text-slate-300 hover:text-white'
                }`}
              >
                Aperçu Hologramme MR
              </button>
              <div className="flex items-center gap-1 rounded-lg bg-[#0d1428] p-1">
                {[
                  { scale: 0.14, label: 'RM Table' },
                  { scale: 0.28, label: 'RM Salon' },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onMrScaleChange(opt.scale)}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      Math.abs(mrScale - opt.scale) < 0.02
                        ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onToggleAudio}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  audioEnabled
                    ? 'border-[#38bdf8]/50 bg-[#38bdf8]/15 text-[#38bdf8]'
                    : 'border-white/15 bg-[#0d1428] text-slate-300 hover:text-white'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Audio</span>
              </button>
              <button
                type="button"
                onClick={onOpenQuestGuide}
                className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#121931] px-3 py-1.5 text-xs font-medium text-[#f8f3e6] hover:border-[#d4af37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Glasses className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Quest 3 / APK</span>
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
