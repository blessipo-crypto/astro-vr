import React, { useEffect, useMemo, useState } from 'react';
import {
  BookMarked,
  Calendar,
  Check,
  Compass,
  Copy,
  Heart,
  Lock,
  MapPin,
  Orbit,
  Plus,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import {
  analyzeSolarReturn,
  AstroChart,
  ChartMode,
  CITY_PRESETS,
  ComparisonAspectInfo,
  findHouseForLongitude,
  formatDegreeInSign,
  GeocodedPlace,
  HOUSE_SYSTEMS,
  HouseSystem,
  NatalProfile,
  RETURN_CELESTIAL_POINTS,
  searchPlacesByQuery,
} from '../astro/astroEngine';
import { generateChartInterpretation } from '../astro/interpretations';
import { CircularCosmicProgress } from './CosmicHomeView';
import { VoiceDictationButton } from './VoiceDictationButton';
import { AspectMatrixD3 } from './AspectMatrixD3';

export interface AuxiliaryChartsViewProps {
  mode: ChartMode;
  onModeChange: (m: ChartMode) => void;
  profiles: NatalProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  draftProfile: NatalProfile;
  onDraftProfileChange: (patch: Partial<NatalProfile>) => void;
  onSaveProfile: () => void;
  onCreateNewProfile: () => void;
  onDeleteProfile: (id: string) => void;
  partnerProfileId: string;
  onPartnerProfileChange: (id: string) => void;
  solarReturnYear: number;
  onSolarReturnYearChange: (y: number) => void;
  solarReturnCityId?: string;
  onSolarReturnCityChange?: (id: string) => void;
  solarReturnCustomLoc?: { name: string; latitude: number; longitude: number } | null;
  onSolarReturnCustomLocChange?: (
    loc: { name: string; latitude: number; longitude: number } | null
  ) => void;
  solarReturnExactDate?: Date | null;
  birthLocation?: { cityName: string; latitude: number; longitude: number };
  onUseBirthLocationForSR?: () => void;
  planetaryReturnPointId: string;
  onPlanetaryReturnPointChange: (id: string) => void;
  planetaryReturnExact: { date: Date; exact: boolean; angularErrorDeg: number } | null;
  relocatedLoc: { name: string; latitude: number; longitude: number };
  onRelocatedLocChange: (loc: { name: string; latitude: number; longitude: number }) => void;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  onOpenAscendantCalculator: () => void;
  onOpenWheel: () => void;
  onOpenFullSummary: () => void;
  onOpenLibrary?: () => void;
  showVoiceSearchButtons: boolean;
  profilesLocked?: boolean;
  modesLocked?: boolean;
  onOpenAdmin?: () => void;
}

type AuxSectionTab = 'natal' | 'synastry' | 'returns' | 'relocated';

export const AuxiliaryChartsView: React.FC<AuxiliaryChartsViewProps> = ({
  mode,
  onModeChange,
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
  solarReturnYear,
  onSolarReturnYearChange,
  solarReturnCityId = 'paris',
  onSolarReturnCityChange,
  solarReturnCustomLoc = null,
  onSolarReturnCustomLocChange,
  solarReturnExactDate = null,
  birthLocation,
  onUseBirthLocationForSR,
  planetaryReturnPointId,
  onPlanetaryReturnPointChange,
  planetaryReturnExact,
  relocatedLoc,
  onRelocatedLocChange,
  baseChart,
  outerChart,
  comparisonAspects,
  onOpenAscendantCalculator,
  onOpenWheel,
  onOpenFullSummary,
  onOpenLibrary,
  showVoiceSearchButtons,
  profilesLocked = false,
  modesLocked = false,
  onOpenAdmin,
}) => {
  const [subTab, setSubTab] = useState<AuxSectionTab>(
    mode === 'synastry' || mode === 'composite'
      ? 'synastry'
      : mode === 'relocated'
        ? 'relocated'
        : mode === 'planetaryReturn' ||
            mode === 'solarReturn' ||
            mode === 'lunarReturn' ||
            mode === 'progressions' ||
            mode === 'solarArc'
          ? 'returns'
          : 'natal'
  );

  useEffect(() => {
    if (mode === 'synastry' || mode === 'composite') {
      setSubTab('synastry');
    } else if (mode === 'relocated') {
      setSubTab('relocated');
    } else if (
      mode === 'planetaryReturn' ||
      mode === 'solarReturn' ||
      mode === 'lunarReturn' ||
      mode === 'progressions' ||
      mode === 'solarArc'
    ) {
      setSubTab('returns');
    } else if (mode === 'natal') {
      setSubTab('natal');
    }
  }, [mode]);

  // French city / postcode search for Natal Profile
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<GeocodedPlace[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);

  // World / French city search for Relocated Chart
  const [relocQuery, setRelocQuery] = useState('');
  const [relocResults, setRelocResults] = useState<GeocodedPlace[]>([]);
  const [searchingReloc, setSearchingReloc] = useState(false);

  // Birthday residence location search & manual GPS for Solar Return
  const [srCityQuery, setSrCityQuery] = useState('');
  const [srCityResults, setSrCityResults] = useState<GeocodedPlace[]>([]);
  const [searchingSrCity, setSearchingSrCity] = useState(false);
  const [srManualOpen, setSrManualOpen] = useState(false);

  const activeSrLocation = useMemo(() => {
    if (solarReturnCustomLoc) return solarReturnCustomLoc;
    const preset = CITY_PRESETS.find((c) => c.id === solarReturnCityId) ?? CITY_PRESETS[0];
    return {
      name: `${preset.name} (${preset.country})`,
      latitude: preset.latitude,
      longitude: preset.longitude,
    };
  }, [solarReturnCustomLoc, solarReturnCityId]);

  const [srManualName, setSrManualName] = useState(activeSrLocation.name);
  const [srManualLat, setSrManualLat] = useState(activeSrLocation.latitude.toFixed(4));
  const [srManualLon, setSrManualLon] = useState(activeSrLocation.longitude.toFixed(4));

  useEffect(() => {
    setSrManualName(activeSrLocation.name);
    setSrManualLat(activeSrLocation.latitude.toFixed(4));
    setSrManualLon(activeSrLocation.longitude.toFixed(4));
  }, [activeSrLocation]);

  const handleCitySearch = async (qStr?: string) => {
    const q = (qStr ?? cityQuery).trim();
    if (!q) return;
    setSearchingCity(true);
    try {
      const res = await searchPlacesByQuery(q);
      setCityResults(res);
    } finally {
      setSearchingCity(false);
    }
  };

  const handleRelocSearch = async (qStr?: string) => {
    const q = (qStr ?? relocQuery).trim();
    if (!q) return;
    setSearchingReloc(true);
    try {
      const res = await searchPlacesByQuery(q);
      setRelocResults(res);
    } finally {
      setSearchingReloc(false);
    }
  };

  const handleSrCitySearch = async (qStr?: string) => {
    const q = (qStr ?? srCityQuery).trim();
    if (!q) return;
    setSearchingSrCity(true);
    try {
      const res = await searchPlacesByQuery(q);
      setSrCityResults(res);
      if (res.length === 1 && onSolarReturnCustomLocChange) {
        onSolarReturnCustomLocChange({
          name: res[0].name,
          latitude: res[0].latitude,
          longitude: res[0].longitude,
        });
      }
    } finally {
      setSearchingSrCity(false);
    }
  };

  const handleApplySrManualGps = () => {
    const lat = Number(srManualLat.replace(',', '.'));
    const lon = Number(srManualLon.replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const clampedLat = Math.max(-89.9, Math.min(89.9, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    onSolarReturnCustomLocChange?.({
      name: srManualName.trim() || `Résidence (${clampedLat.toFixed(2)}°, ${clampedLon.toFixed(2)}°)`,
      latitude: clampedLat,
      longitude: clampedLon,
    });
  };

  // Synastry compatibility progress ring metrics
  const synMetrics = useMemo(() => {
    const harm = comparisonAspects.filter(
      (a) => a.harmony === 'harmonious' || a.harmony === 'fusion'
    ).length;
    const tense = comparisonAspects.filter((a) => a.harmony === 'tense').length;
    const affection = Math.min(97, Math.max(60, 72 + harm * 5 - tense * 1));
    const mind = Math.min(95, Math.max(58, 68 + harm * 4 + comparisonAspects.filter((a) => a.outerPlanet === 'mercury' || a.natalPlanet === 'mercury').length * 6));
    const evolution = Math.min(98, Math.max(65, 74 + tense * 3 + harm * 3));
    return { affection, mind, evolution };
  }, [comparisonAspects]);

  const [copiedSrSynth, setCopiedSrSynth] = useState(false);

  const srSynthesis = useMemo(() => {
    if (mode !== 'solarReturn' || !outerChart) return null;
    const analysis = analyzeSolarReturn(baseChart, outerChart);
    const report = generateChartInterpretation({
      mode: 'solarReturn',
      tradition: 'western',
      baseChart,
      outerChart,
      comparisonAspects,
      solarReturnAnalysis: analysis,
      comparativeAnalysis: null,
    });
    return report.solarReturnSynthesis ?? null;
  }, [mode, baseChart, outerChart, comparisonAspects]);

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Top Module Switcher */}
        <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-5 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                Thème Natal, Synastrie & Cartes Auxiliaires
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                Gérez vos profils (communes françaises 35 000+), comparez en Synastrie / Composite, calculez 27 Révolutions Planétaires, Arc Solaire ou Relocalisation.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenWheel}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/85 to-yellow-400/85 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Orbit className="h-3.5 w-3.5" />
                <span>Afficher sur la Roue</span>
              </button>
              <button
                type="button"
                onClick={onOpenFullSummary}
                className="rounded-full border border-amber-200/30 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-amber-100 hover:border-amber-300/60 cursor-pointer"
              >
                Bilan Complet
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: 'natal' as const, label: 'Thème Natal & Villes FR' },
              { id: 'synastry' as const, label: 'Synastrie & Composite' },
              { id: 'returns' as const, label: '27 Révolutions · Arc Solaire · Progressions' },
              { id: 'relocated' as const, label: 'Thème Relocalisé' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  subTab === t.id
                    ? 'bg-gradient-to-r from-amber-400/90 to-yellow-400/90 text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                    : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/35 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sub-section 1: Natal Profile Editor */}
        {subTab === 'natal' && (
          <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-6 space-y-5">
            {profilesLocked && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-300 shrink-0" />
                  <span>
                    L’édition, la création et la suppression des thèmes natals sont verrouillées par l’administrateur.
                  </span>
                </div>
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="rounded-full border border-amber-300/50 bg-amber-400/20 px-3 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/30 cursor-pointer whitespace-nowrap"
                  >
                    Déverrouiller Admin
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-amber-300" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-200">
                  Édition du Thème Natal
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeProfileId}
                  onChange={(e) => onSelectProfile(e.target.value)}
                  className="rounded-xl border border-white/15 bg-[#0c101d] px-3 py-1.5 text-xs text-white"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.trim() || 'Thème sans nom'} ({p.birthDateIso.slice(0, 10)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={profilesLocked}
                  onClick={onCreateNewProfile}
                  className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 hover:border-amber-300/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-300" />
                  <span>Nouveau</span>
                </button>
                {onOpenLibrary && (
                  <button
                    type="button"
                    onClick={onOpenLibrary}
                    className="flex items-center gap-1 rounded-full border border-indigo-300/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:border-amber-300/50 cursor-pointer"
                  >
                    <BookMarked className="h-3.5 w-3.5 text-amber-300" />
                    <span>Bibliothèque des Astres</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={profilesLocked}
                  onClick={onSaveProfile}
                  className="flex items-center gap-1 rounded-full bg-amber-400/90 px-3.5 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Enregistrer</span>
                </button>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    disabled={profilesLocked}
                    onClick={() => onDeleteProfile(activeProfileId)}
                    title={profilesLocked ? 'Suppression verrouillée' : 'Supprimer ce thème'}
                    className="rounded-full border border-rose-400/30 bg-rose-500/10 p-1.5 text-rose-200 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Prénom ou Nom</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    disabled={profilesLocked}
                    value={draftProfile.name}
                    onChange={(e) => onDraftProfileChange({ name: e.target.value })}
                    placeholder="Ex: Marie, Nathan…"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-300/60 disabled:opacity-50 outline-none"
                  />
                  {showVoiceSearchButtons && !profilesLocked && (
                    <VoiceDictationButton
                      onTranscript={(txt) => onDraftProfileChange({ name: txt })}
                      title="Dicter le prénom"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Date & Heure de naissance (locale)
                </label>
                <input
                  type="datetime-local"
                  disabled={profilesLocked}
                  value={draftProfile.birthDateIso.slice(0, 16)}
                  onChange={(e) => onDraftProfileChange({ birthDateIso: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 disabled:opacity-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Système de Maisons (33 disponibles)
                </label>
                <select
                  disabled={profilesLocked}
                  value={draftProfile.houseSystem}
                  onChange={(e) =>
                    onDraftProfileChange({ houseSystem: e.target.value as HouseSystem })
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white focus:border-amber-300/60 disabled:opacity-50 outline-none"
                >
                  {HOUSE_SYSTEMS.map((hs) => (
                    <option key={hs.id} value={hs.id}>
                      {hs.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* French Commune / Postal Code Precision Search */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-200">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  <span>Lieu actuel : {draftProfile.customCityName || CITY_PRESETS.find((c) => c.id === draftProfile.cityId)?.name || 'Paris'}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAscendantCalculator}
                  className="rounded-full border border-sky-300/35 bg-sky-400/10 px-3 py-1 text-[11px] font-medium text-sky-200 hover:bg-sky-400/20 cursor-pointer"
                >
                  Outil Ascendant seul & Plage horaire
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    disabled={profilesLocked}
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !profilesLocked) void handleCitySearch();
                    }}
                    placeholder="Commune française (35 000+), code postal (75008, 69002), département ou ville mondiale…"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-amber-300/60 disabled:opacity-50 outline-none"
                  />
                </div>
                {showVoiceSearchButtons && !profilesLocked && (
                  <VoiceDictationButton
                    onTranscript={(txt) => {
                      setCityQuery(txt);
                      void handleCitySearch(txt);
                    }}
                    title="Dicter la ville de naissance"
                  />
                )}
                <button
                  type="button"
                  disabled={profilesLocked}
                  onClick={() => void handleCitySearch()}
                  className="rounded-xl border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {searchingCity ? 'Recherche…' : 'Chercher commune'}
                </button>
              </div>

              {cityResults.length > 0 && !profilesLocked && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cityResults.map((place, idx) => (
                    <button
                      key={`${place.name}-${idx}`}
                      type="button"
                      onClick={() => {
                        onDraftProfileChange({
                          customCityName: place.name,
                          customLat: place.latitude,
                          customLon: place.longitude,
                        });
                        setCityResults([]);
                      }}
                      className="rounded-full border border-amber-300/35 bg-[#0c101d] px-3 py-1 text-[11px] text-amber-100 hover:border-amber-300 cursor-pointer"
                    >
                      {place.name} ({place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°)
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Sub-section 2: Synastry & Composite */}
        {subTab === 'synastry' && (
          <section className="space-y-4">
            <div className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-300" />
                  <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-200">
                    Synastrie & Thème Composite (Thème A vs Thème B)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={modesLocked}
                    onClick={() => onModeChange('synastry')}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${
                      mode === 'synastry'
                        ? 'bg-amber-400 text-slate-950'
                        : 'border border-white/15 bg-white/[0.04] text-slate-200'
                    }`}
                  >
                    Mode Synastrie
                  </button>
                  <button
                    type="button"
                    disabled={modesLocked}
                    onClick={() => onModeChange('composite')}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${
                      mode === 'composite'
                        ? 'bg-purple-400 text-slate-950'
                        : 'border border-white/15 bg-white/[0.04] text-slate-200'
                    }`}
                  >
                    Mode Composite
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Thème A (Base)</label>
                  <select
                    value={activeProfileId}
                    onChange={(e) => onSelectProfile(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.trim() || 'Thème A'} ({p.birthDateIso.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Partenaire B</label>
                  <select
                    value={partnerProfileId}
                    onChange={(e) => onPartnerProfileChange(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.trim() || 'Thème B'} ({p.birthDateIso.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Compatibility Progress Ring Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="cosmic-glass-card flex items-center gap-4 rounded-3xl border border-amber-200/25 bg-[#151824]/70 backdrop-blur-xl p-5">
                <div className="flex-1">
                  <div className="font-display text-xs uppercase tracking-wider text-amber-200">
                    Affinité Affective
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Résonance Soleil, Lune & Vénus entre A et B.
                  </p>
                </div>
                <CircularCosmicProgress percentage={synMetrics.affection} color="gold" />
              </div>

              <div className="cosmic-glass-card flex items-center gap-4 rounded-3xl border border-amber-200/25 bg-[#151824]/70 backdrop-blur-xl p-5">
                <div className="flex-1">
                  <div className="font-display text-xs uppercase tracking-wider text-sky-200">
                    Dialogue Mental
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Échanges Mercure, Air & harmoniques intellectuels.
                  </p>
                </div>
                <CircularCosmicProgress percentage={synMetrics.mind} color="glacier" />
              </div>

              <div className="cosmic-glass-card flex items-center gap-4 rounded-3xl border border-amber-200/25 bg-[#151824]/70 backdrop-blur-xl p-5">
                <div className="flex-1">
                  <div className="font-display text-xs uppercase tracking-wider text-purple-200">
                    Croissance Mutuelle
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Dynamique évolutive Jupiter, Saturne & Nœuds.
                  </p>
                </div>
                <CircularCosmicProgress percentage={synMetrics.evolution} color="lavender" />
              </div>
            </div>
          </section>
        )}

        {/* Sub-section 3: Planetary Returns (25+ points), Progressions & Solar Arc */}
        {subTab === 'returns' && (
          <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-300" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-200">
                Révolutions Planétaires (27 Points), Progressions & Arc Solaire
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'solarReturn' as const, label: 'Révolution Solaire' },
                { id: 'lunarReturn' as const, label: 'Révolution Lunaire' },
                { id: 'planetaryReturn' as const, label: 'Révolution Planétaire (27 points)' },
                { id: 'progressions' as const, label: 'Progressions Secondaires' },
                { id: 'solarArc' as const, label: 'Directions par Arc Solaire' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onModeChange(m.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                    mode === m.id
                      ? 'bg-amber-400 text-slate-950'
                      : 'border border-white/15 bg-white/[0.04] text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Point céleste de Révolution (27 astres & astéroïdes)
                </label>
                <select
                  value={planetaryReturnPointId}
                  onChange={(e) => {
                    const id = e.target.value;
                    onPlanetaryReturnPointChange(id);
                    if (id === 'sun') onModeChange('solarReturn');
                    else if (id === 'moon') onModeChange('lunarReturn');
                    else onModeChange('planetaryReturn');
                  }}
                  className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-amber-100"
                >
                  {RETURN_CELESTIAL_POINTS.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.symbol} {pt.name} ({pt.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Année cible de Révolution Solaire
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-300 shrink-0" />
                  <input
                    type="number"
                    min={1920}
                    max={2120}
                    value={solarReturnYear}
                    onChange={(e) => onSolarReturnYearChange(Number(e.target.value) || new Date().getFullYear())}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 font-mono-tabular text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Implantation du lieu de résidence le jour de l’anniversaire */}
            <div className="rounded-2xl border border-amber-300/25 bg-[#0b0e19]/85 p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-300 shrink-0" />
                  <div>
                    <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-amber-200">
                      Implantation du lieu de résidence — Jour de l’anniversaire
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Indispensable pour calculer l’Ascendant, le Milieu du Ciel et les Maisons de votre Révolution Solaire {solarReturnYear}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {birthLocation && onUseBirthLocationForSR && (
                    <button
                      type="button"
                      disabled={modesLocked}
                      onClick={onUseBirthLocationForSR}
                      title={`Utiliser le lieu natal (${birthLocation.cityName})`}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-amber-300/45 hover:text-amber-100 disabled:opacity-50 cursor-pointer"
                    >
                      Même ville que naissance ({birthLocation.cityName.split('(')[0].trim()})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSrManualOpen((v) => !v)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      srManualOpen
                        ? 'border-sky-300/50 bg-sky-400/15 text-sky-100'
                        : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-sky-300/40'
                    }`}
                  >
                    GPS précis
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                <div>
                  <span className="text-slate-400">Résidence anniversaire implantée : </span>
                  <strong className="text-amber-200">{activeSrLocation.name}</strong>{' '}
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    ({activeSrLocation.latitude.toFixed(3)}°, {activeSrLocation.longitude.toFixed(3)}°)
                  </span>
                </div>
                {mode === 'solarReturn' && outerChart && (() => {
                  const srAscFmt = formatDegreeInSign(outerChart.ascendant);
                  const srMcFmt = formatDegreeInSign(outerChart.midheaven);
                  const ascNatalHouse = baseChart.houses[findHouseForLongitude(outerChart.ascendant, baseChart.houses) - 1];
                  return (
                    <div className="font-mono-tabular text-[11px] text-sky-200">
                      ASC RS : <span className="font-glyph text-amber-200">{outerChart.ascSign.symbol}</span>{' '}
                      <strong className="text-amber-100">{srAscFmt.formattedDeg} {outerChart.ascSign.name}</strong>{' '}
                      <span className="text-indigo-200">(M.{ascNatalHouse.roman} nat.)</span> · MC RS :{' '}
                      {outerChart.mcSign.symbol} {srMcFmt.formattedDeg} {outerChart.mcSign.name}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Villes rapides (France & Monde)
                  </label>
                  <select
                    disabled={modesLocked}
                    value={solarReturnCustomLoc ? '__custom__' : solarReturnCityId}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') return;
                      onSolarReturnCustomLocChange?.(null);
                      onSolarReturnCityChange?.(e.target.value);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white disabled:opacity-50"
                  >
                    {solarReturnCustomLoc && (
                      <option value="__custom__">{solarReturnCustomLoc.name}</option>
                    )}
                    <optgroup label="France (Villes & Préfectures)">
                      {CITY_PRESETS.filter((c) => c.country === 'France').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.department ? `${c.department} · ` : ''}France)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Francophonie & Monde">
                      {CITY_PRESETS.filter((c) => c.country !== 'France').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.country})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Rechercher une commune (nom, CP) ou ville du monde
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        disabled={modesLocked}
                        value={srCityQuery}
                        onChange={(e) => setSrCityQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSrCitySearch();
                        }}
                        placeholder="Ex: 06000, Annecy, Tokyo, Montréal..."
                        className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-300/60 outline-none disabled:opacity-50"
                      />
                    </div>
                    {showVoiceSearchButtons && (
                      <VoiceDictationButton
                        onTranscript={(txt) => {
                          setSrCityQuery(txt);
                          void handleSrCitySearch(txt);
                        }}
                        title="Dicter le lieu de résidence anniversaire"
                      />
                    )}
                    <button
                      type="button"
                      disabled={modesLocked || searchingSrCity}
                      onClick={() => void handleSrCitySearch()}
                      className="rounded-xl border border-amber-300/40 bg-amber-400/15 px-3.5 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 disabled:opacity-50 cursor-pointer"
                    >
                      {searchingSrCity ? '…' : 'OK'}
                    </button>
                  </div>
                </div>
              </div>

              {srCityResults.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {srCityResults.slice(0, 8).map((pl, idx) => {
                    const selected = solarReturnCustomLoc?.name === pl.name;
                    return (
                      <button
                        key={`${pl.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          onSolarReturnCustomLocChange?.({
                            name: pl.name,
                            latitude: pl.latitude,
                            longitude: pl.longitude,
                          });
                          setSrCityResults([]);
                        }}
                        className={`rounded-full border px-3 py-1 text-[11px] transition-all cursor-pointer ${
                          selected
                            ? 'border-amber-300/60 bg-amber-400/20 text-amber-100'
                            : 'border-white/15 bg-[#0c101d] text-slate-200 hover:border-amber-300/45'
                        }`}
                      >
                        {pl.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {srManualOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-white/10">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Nom du lieu / Résidence</label>
                    <input
                      type="text"
                      value={srManualName}
                      onChange={(e) => setSrManualName(e.target.value)}
                      placeholder="Ex: Résidence Lyon 6e"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Latitude (°)</label>
                    <input
                      type="text"
                      value={srManualLat}
                      onChange={(e) => setSrManualLat(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono-tabular text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Longitude (°)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={srManualLon}
                        onChange={(e) => setSrManualLon(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono-tabular text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplySrManualGps}
                        className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 cursor-pointer shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instant exact de Révolution Solaire / Planétaire + bouton d'affichage sur la roue */}
            {(mode === 'solarReturn' && solarReturnExactDate ? solarReturnExactDate : planetaryReturnExact?.date) && (
              <div className="rounded-2xl border border-amber-300/30 bg-[#0b0e19] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                  <span>
                    {mode === 'solarReturn' ? `Révolution Solaire ${solarReturnYear} à ` : 'Instant calculé du retour : '}
                    {mode === 'solarReturn' && (
                      <strong className="text-amber-100">{activeSrLocation.name} · </strong>
                    )}
                    <strong className="font-mono-tabular text-amber-200">
                      {new Intl.DateTimeFormat('fr-FR', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      }).format(
                        mode === 'solarReturn' && solarReturnExactDate
                          ? solarReturnExactDate
                          : planetaryReturnExact!.date
                      )}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {planetaryReturnExact && mode !== 'solarReturn' && (
                    <span className="font-mono-tabular text-[11px] text-sky-300">
                      Écart orbe : {planetaryReturnExact.angularErrorDeg}°
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (mode !== 'solarReturn' && mode !== 'planetaryReturn' && mode !== 'lunarReturn') {
                        onModeChange('solarReturn');
                      }
                      onOpenWheel();
                    }}
                    className="rounded-full bg-gradient-to-r from-amber-500/85 to-yellow-400/85 px-3.5 py-1.5 text-[11px] font-semibold text-slate-950 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    Afficher sur la Roue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mode !== 'solarReturn' && mode !== 'planetaryReturn' && mode !== 'lunarReturn') {
                        onModeChange('solarReturn');
                      }
                      onOpenFullSummary();
                    }}
                    className="rounded-full border border-amber-300/45 bg-amber-400/15 px-3.5 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer"
                  >
                    Interprétation complète
                  </button>
                </div>
              </div>
            )}

            {/* Synthèse croisée Planètes + Maisons + Aspects de la Révolution Solaire */}
            {mode === 'solarReturn' && srSynthesis && (
              <div className="rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-500/[0.06] via-[#0b0e19]/95 to-sky-500/[0.06] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-300 font-semibold">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                      <span>{srSynthesis.headline}</span>
                    </div>
                    <div className="text-xs text-sky-200 mt-1">{srSynthesis.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(srSynthesis.plainTextExport)
                          .then(() => {
                            setCopiedSrSynth(true);
                            setTimeout(() => setCopiedSrSynth(false), 2200);
                          });
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-amber-100 hover:border-amber-300/60 hover:bg-amber-400/15 transition-all cursor-pointer"
                    >
                      {copiedSrSynth ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          <span className="text-emerald-200">Synthèse copiée</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-amber-300" />
                          <span>Copier la synthèse</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onOpenFullSummary}
                      className="rounded-full bg-amber-400/90 px-3.5 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-amber-300 transition-all cursor-pointer"
                    >
                      Détails Planètes / Maisons / Aspects
                    </button>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-100 bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
                  {srSynthesis.executiveSynthesis}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Planètes-Piliers */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2.5">
                    <div className="text-[10.5px] uppercase tracking-wider font-semibold text-amber-200">
                      Planètes-Piliers (Signe · Maison · Aspect)
                    </div>
                    <div className="space-y-2">
                      {srSynthesis.pillarPlanets.map((pp) => (
                        <div key={pp.planetId} className="rounded-lg border border-white/10 bg-[#0b0e19]/80 p-2.5 space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-amber-100">
                              <span className="font-glyph text-amber-300">{pp.symbol}</span> {pp.name}
                            </span>
                            <span className="text-[10px] text-amber-200/85">{pp.roleReason}</span>
                          </div>
                          <div className="font-mono-tabular text-[10px] text-sky-200">{pp.positionSummary}</div>
                          <p className="text-[11px] leading-relaxed text-slate-300">{pp.synthesis}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Maisons Dominantes + Domaines de vie */}
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
                      <div className="text-[10.5px] uppercase tracking-wider font-semibold text-sky-200">
                        Maisons RS les plus activées
                      </div>
                      <div className="space-y-2">
                        {srSynthesis.dominantHouses.map((dh) => (
                          <div key={dh.house} className="rounded-lg border border-sky-300/15 bg-[#0b0e19]/80 p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-sky-100">
                                Maison {dh.roman} RS · {dh.title}
                              </span>
                              <span className="text-[10px] text-indigo-200">→ M.{dh.superposedNatalRoman} nat.</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-300">{dh.synthesis}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-300/20 bg-amber-400/[0.05] p-3.5 space-y-1.5">
                      <div className="text-[10.5px] uppercase tracking-wider font-semibold text-amber-200">
                        Caps d’Action & Vigilances
                      </div>
                      {srSynthesis.actionLevers.map((lev) => (
                        <div key={lev} className="text-[11px] leading-relaxed text-slate-200">
                          • {lev}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 Axes de vie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {srSynthesis.lifeAxes.map((ax) => (
                    <div key={ax.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1">
                      <div className="text-xs font-semibold text-amber-100">{ax.title}</div>
                      <div className="font-mono-tabular text-[10px] text-slate-400">{ax.housesInvolved}</div>
                      <p className="text-[11px] leading-relaxed text-slate-300">{ax.synthesis}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Sub-section 4: Relocated Charts */}
        {subTab === 'relocated' && (
          <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-300" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-200">
                  Thème Relocalisé (Même instant UT · Nouveau Méridien)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  onModeChange('relocated');
                  onOpenWheel();
                }}
                className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-slate-950 cursor-pointer"
              >
                Activer & Voir sur la Roue
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="text-xs text-slate-300">
                Ville de relocalisation active :{' '}
                <strong className="text-amber-200">{relocatedLoc.name}</strong>{' '}
                <span className="font-mono-tabular text-slate-400">
                  ({relocatedLoc.latitude.toFixed(2)}°, {relocatedLoc.longitude.toFixed(2)}°)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={relocQuery}
                  onChange={(e) => setRelocQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRelocSearch();
                  }}
                  placeholder="Ville de relocalisation (Tokyo, Montréal, Nice, New York, Marseille…)"
                  className="flex-1 min-w-[220px] rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-300/60 outline-none"
                />
                {showVoiceSearchButtons && (
                  <VoiceDictationButton
                    onTranscript={(txt) => {
                      setRelocQuery(txt);
                      void handleRelocSearch(txt);
                    }}
                    title="Dicter la ville de relocalisation"
                  />
                )}
                <button
                  type="button"
                  onClick={() => void handleRelocSearch()}
                  className="rounded-xl border border-sky-300/40 bg-sky-400/15 px-4 py-2 text-xs font-semibold text-sky-100 cursor-pointer"
                >
                  {searchingReloc ? 'Recherche…' : 'Chercher'}
                </button>
              </div>

              {relocResults.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {relocResults.map((pl, idx) => (
                    <button
                      key={`${pl.name}-${idx}`}
                      type="button"
                      onClick={() => {
                        onRelocatedLocChange({
                          name: pl.name,
                          latitude: pl.latitude,
                          longitude: pl.longitude,
                        });
                        onModeChange('relocated');
                        setRelocResults([]);
                      }}
                      className="rounded-full border border-sky-300/35 bg-[#0c101d] px-3 py-1 text-[11px] text-sky-100 hover:border-amber-300 cursor-pointer"
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Interactive D3.js Aspect Matrix (adapts to Synastry, Returns, Progressions, Relocated & Natal) */}
        <AspectMatrixD3
          mode={mode}
          baseChart={baseChart}
          outerChart={outerChart}
          comparisonAspects={comparisonAspects}
          onOpenWheel={onOpenWheel}
        />
      </div>
    </div>
  );
};
