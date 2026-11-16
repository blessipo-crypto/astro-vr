import React, { useMemo, useState } from 'react';
import {
  Check,
  Compass,
  Layers,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  ALL_21_ASPECT_DEFINITIONS,
  AspectType,
  AstroChart,
  DEFAULT_MAJOR_ASPECT_TYPES,
  HOUSE_SYSTEMS,
  HouseSystem,
} from '../astro/astroEngine';
import { TermSystem } from '../astro/dignities';
import {
  WHEEL_2D_STYLES,
  Wheel2DOrientation,
  Wheel2DStyle,
} from './Chart2DCanvas';
import { ZODIAC_SIGN_STYLES, ZodiacSignStyle } from '../vr/textures';
import {
  BODY_FONT_OPTIONS,
  GLYPH_FONT_OPTIONS,
  TITLE_FONT_OPTIONS,
  TypographyPreferences,
} from '../vr/typography';

export interface DignityRingsConfig {
  showDecans: boolean;
  showTerms: boolean;
  termSystem: TermSystem;
  showDodecatemoria: boolean;
  showCentralSun: boolean;
}

export interface AdvancedConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  baseChart: AstroChart;
  houseSystem: HouseSystem;
  onHouseSystemChange: (hs: HouseSystem) => void;
  enabledAspectTypes: AspectType[];
  onEnabledAspectTypesChange: (types: AspectType[]) => void;
  dignityConfig: DignityRingsConfig;
  onDignityConfigChange: (patch: Partial<DignityRingsConfig>) => void;
  wheel2DStyle: Wheel2DStyle;
  onWheel2DStyleChange: (s: Wheel2DStyle) => void;
  wheel2DOrientation: Wheel2DOrientation;
  onWheel2DOrientationChange: (o: Wheel2DOrientation) => void;
  signStyle: ZodiacSignStyle;
  onSignStyleChange: (s: ZodiacSignStyle) => void;
  typography: TypographyPreferences;
  onTypographyChange: (t: TypographyPreferences) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

type ConfigTab = 'houses' | 'aspects' | 'declinations' | 'styles';

export const AdvancedConfigDrawer: React.FC<AdvancedConfigDrawerProps> = ({
  open,
  onClose,
  baseChart,
  houseSystem,
  onHouseSystemChange,
  enabledAspectTypes,
  onEnabledAspectTypesChange,
  dignityConfig,
  onDignityConfigChange,
  wheel2DStyle,
  onWheel2DStyleChange,
  wheel2DOrientation,
  onWheel2DOrientationChange,
  signStyle,
  onSignStyleChange,
  typography,
  onTypographyChange,
  audioEnabled,
  onToggleAudio,
}) => {
  const [tab, setTab] = useState<ConfigTab>('houses');
  const [houseSearch, setHouseSearch] = useState('');

  const filteredHouses = useMemo(() => {
    const q = houseSearch.trim().toLowerCase();
    if (!q) return HOUSE_SYSTEMS;
    return HOUSE_SYSTEMS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q)
    );
  }, [houseSearch]);

  if (!open) return null;

  const toggleAspectType = (t: AspectType) => {
    if (enabledAspectTypes.includes(t)) {
      if (enabledAspectTypes.length === 1) return;
      onEnabledAspectTypesChange(enabledAspectTypes.filter((x) => x !== t));
    } else {
      onEnabledAspectTypesChange([...enabledAspectTypes, t]);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end bg-[#080911]/75 backdrop-blur-md">
      <div className="relative h-full w-full max-w-2xl border-l border-amber-200/30 bg-[#151824]/95 backdrop-blur-2xl shadow-2xl shadow-black/70 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
              Configuration Astrologique de Précision
            </h2>
            <p className="text-xs text-slate-400">
              33 Systèmes de Maisons · 21 Aspects · Déclinaisons · Anneaux de Dignités
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la configuration"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/50 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 border-b border-white/10 px-6 py-3 overflow-x-auto cosmic-scroll shrink-0">
          {[
            { id: 'houses' as const, label: '33 Maisons' },
            { id: 'aspects' as const, label: `21 Aspects (${enabledAspectTypes.length})` },
            { id: 'declinations' as const, label: `Déclinaisons (${baseChart.declinationAspects.length})` },
            { id: 'styles' as const, label: 'Roue, Dignités & Audio' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                tab === t.id
                  ? 'bg-gradient-to-r from-amber-400/90 to-yellow-400/90 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/35 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto cosmic-scroll p-6 space-y-5">
          {tab === 'houses' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-300/70" />
                <input
                  type="text"
                  value={houseSearch}
                  onChange={(e) => setHouseSearch(e.target.value)}
                  placeholder="Rechercher parmi les 33 systèmes (Placidus, Koch, Whole Sign, Campanus...)"
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.04] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-amber-300/60 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredHouses.map((hs) => {
                  const active = houseSystem === hs.id;
                  return (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => onHouseSystemChange(hs.id)}
                      className={`text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
                        active
                          ? 'border-amber-300/65 bg-amber-400/15 shadow-[0_0_18px_rgba(251,191,36,0.18)]'
                          : 'border-white/10 bg-white/[0.02] hover:border-amber-200/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-amber-100">{hs.name}</span>
                        {active && <Check className="h-3.5 w-3.5 text-amber-300 shrink-0" />}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-sky-300/80">
                        {hs.category}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                        {hs.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Live House Cusps Table */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="font-display text-xs font-semibold uppercase tracking-widest text-amber-200 mb-3">
                  Cuspides Calculées ({HOUSE_SYSTEMS.find((x) => x.id === houseSystem)?.name})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono-tabular text-xs">
                  {baseChart.houses.map((h) => (
                    <div
                      key={h.house}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e19] px-2.5 py-1.5"
                    >
                      <span className="text-amber-300 font-semibold">M.{h.roman}</span>
                      <span className="text-slate-200">
                        {h.formattedDeg} {h.sign.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'aspects' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEnabledAspectTypesChange(DEFAULT_MAJOR_ASPECT_TYPES)}
                  className="rounded-full border border-amber-300/35 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-400/20 cursor-pointer"
                >
                  5 Majeurs (Classique)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onEnabledAspectTypesChange([
                      ...DEFAULT_MAJOR_ASPECT_TYPES,
                      'quincunx',
                      'semisextile',
                      'semisquare',
                      'sesquiquadrate',
                    ])
                  }
                  className="rounded-full border border-sky-300/35 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-400/20 cursor-pointer"
                >
                  Majeurs + Mineurs (9)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onEnabledAspectTypesChange(ALL_21_ASPECT_DEFINITIONS.map((a) => a.type))
                  }
                  className="rounded-full border border-purple-300/40 bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-100 hover:bg-purple-500/25 cursor-pointer"
                >
                  Tous les 21 Aspects (Harmoniques inclus)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_21_ASPECT_DEFINITIONS.map((asp) => {
                  const enabled = enabledAspectTypes.includes(asp.type);
                  return (
                    <button
                      key={asp.type}
                      type="button"
                      onClick={() => toggleAspectType(asp.type)}
                      className={`flex items-start gap-3 text-left rounded-2xl border p-3 transition-all cursor-pointer ${
                        enabled
                          ? 'border-amber-200/45 bg-white/[0.05]'
                          : 'border-white/10 bg-white/[0.015] opacity-60 hover:opacity-90'
                      }`}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 font-glyph text-sm font-bold shrink-0"
                        style={{ color: asp.cssColor, backgroundColor: `${asp.cssColor}18` }}
                      >
                        {asp.symbol}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">
                            {asp.label} · {asp.angle}°
                          </span>
                          <span className="font-mono-tabular text-[10px] text-slate-400">
                            ±{asp.maxOrb}°
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">
                          {asp.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'declinations' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-200/25 bg-white/[0.02] p-4">
                <div className="font-display text-xs font-semibold uppercase tracking-widest text-amber-200 mb-3">
                  Déclinaisons Planétaires (δ Équatoriale & Hors Limites OOB &gt; 23°26′)
                </div>
                <div className="space-y-1.5">
                  {baseChart.planets.map((p) => {
                    const signDir = p.declinationDeg >= 0 ? 'N' : 'S';
                    const absDecl = Math.abs(p.declinationDeg);
                    const pct = Math.min(100, Math.round((absDecl / 28) * 100));
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0e19] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-[130px]">
                          <span className="font-glyph text-sm text-amber-200">{p.symbol}</span>
                          <span className="text-slate-100 font-medium">{p.name}</span>
                          {p.isOutOfBounds && (
                            <span className="rounded-full border border-rose-400/50 bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-200">
                              OOB
                            </span>
                          )}
                        </div>
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[180px]">
                          <div
                            className={`h-full rounded-full ${
                              p.declinationDeg >= 0 ? 'bg-amber-400' : 'bg-sky-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono-tabular font-semibold text-amber-100 min-w-[70px] text-right">
                          {absDecl.toFixed(2)}° {signDir}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/25 bg-white/[0.02] p-4">
                <div className="font-display text-xs font-semibold uppercase tracking-widest text-purple-200 mb-3">
                  Parallèles (∥) & Contre-parallèles (∦) Actifs (Orbe ≤ 1,2°)
                </div>
                {baseChart.declinationAspects.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Aucun parallèle ou contre-parallèle serré détecté dans cette carte.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {baseChart.declinationAspects.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e19] px-3 py-2.5 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-100">
                            {d.planetASymbol} {d.planetAName} {d.symbol} {d.planetBSymbol} {d.planetBName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {d.label} ({d.declA.toFixed(1)}° / {d.declB.toFixed(1)}°)
                          </div>
                        </div>
                        <span className="font-mono-tabular text-xs font-semibold text-amber-300">
                          {d.orb}°
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'styles' && (
            <div className="space-y-5">
              {/* Dignity Rings (Decans, Terms, Twelfth Parts) */}
              <div className="rounded-2xl border border-amber-200/30 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-amber-200">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Anneaux de Dignités & Esthétique de la Roue SVG</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e19] px-3.5 py-2.5 text-xs cursor-pointer">
                    <span className="text-slate-200">Anneau des Décans (36 × 10°)</span>
                    <input
                      type="checkbox"
                      checked={dignityConfig.showDecans}
                      onChange={(e) => onDignityConfigChange({ showDecans: e.target.checked })}
                      className="accent-amber-400"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e19] px-3.5 py-2.5 text-xs cursor-pointer">
                    <span className="text-slate-200">Anneau des Termes (60 bornes)</span>
                    <input
                      type="checkbox"
                      checked={dignityConfig.showTerms}
                      onChange={(e) => onDignityConfigChange({ showTerms: e.target.checked })}
                      className="accent-amber-400"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e19] px-3.5 py-2.5 text-xs cursor-pointer">
                    <span className="text-slate-200">Dodécatémories (12e parts · 2,5°)</span>
                    <input
                      type="checkbox"
                      checked={dignityConfig.showDodecatemoria}
                      onChange={(e) =>
                        onDignityConfigChange({ showDodecatemoria: e.target.checked })
                      }
                      className="accent-amber-400"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0e19] px-3.5 py-2.5 text-xs cursor-pointer">
                    <span className="text-slate-200">Soleil Central Rayonnant</span>
                    <input
                      type="checkbox"
                      checked={dignityConfig.showCentralSun}
                      onChange={(e) =>
                        onDignityConfigChange({ showCentralSun: e.target.checked })
                      }
                      className="accent-amber-400"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-300">Système de Termes :</span>
                  {(['egyptian', 'ptolemaic'] as const).map((ts) => (
                    <button
                      key={ts}
                      type="button"
                      onClick={() => onDignityConfigChange({ termSystem: ts })}
                      className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all ${
                        dignityConfig.termSystem === ts
                          ? 'bg-amber-400/90 text-slate-950 font-semibold'
                          : 'border border-white/15 bg-white/[0.03] text-slate-300'
                      }`}
                    >
                      {ts === 'egyptian' ? 'Égyptiens' : 'Ptolémaïques'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wheel Style & Orientation */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-sky-200">
                  <Compass className="h-4 w-4 text-sky-300" />
                  <span>Style de Roue SVG & Orientation</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WHEEL_2D_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onWheel2DStyleChange(st.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                        wheel2DStyle === st.id
                          ? 'border-amber-300/60 bg-amber-400/15 text-amber-100'
                          : 'border-white/10 bg-[#0b0e19] text-slate-300 hover:border-amber-200/30'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border shrink-0"
                        style={{ backgroundColor: st.swatchPrimary, borderColor: st.swatchAccent }}
                      />
                      <span className="truncate">{st.shortLabel}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Orientation de la roue
                    </label>
                    <select
                      value={wheel2DOrientation}
                      onChange={(e) =>
                        onWheel2DOrientationChange(e.target.value as Wheel2DOrientation)
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#0b0e19] px-3 py-2 text-xs text-white"
                    >
                      <option value="ascendant">Ascendant à gauche (Classique)</option>
                      <option value="aries0">0° Bélier à gauche (Naturel)</option>
                      <option value="mcTop">Milieu du Ciel en haut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Style des signes zodiacaux
                    </label>
                    <select
                      value={signStyle}
                      onChange={(e) => onSignStyleChange(e.target.value as ZodiacSignStyle)}
                      className="w-full rounded-xl border border-white/15 bg-[#0b0e19] px-3 py-2 text-xs text-white"
                    >
                      {ZODIAC_SIGN_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Typography & Audio */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-purple-200">
                    <Layers className="h-4 w-4 text-purple-300" />
                    <span>Typographie & Ambiance Sonore</span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAudio}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
                      audioEnabled
                        ? 'border-amber-300/50 bg-amber-400/20 text-amber-100'
                        : 'border-white/15 bg-white/[0.04] text-slate-300'
                    }`}
                  >
                    {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    <span>{audioEnabled ? 'Musique ON' : 'Musique OFF'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Titres</label>
                    <select
                      value={typography.titleFont}
                      onChange={(e) =>
                        onTypographyChange({ ...typography, titleFont: e.target.value as TypographyPreferences['titleFont'] })
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#0b0e19] px-2.5 py-1.5 text-xs text-white"
                    >
                      {TITLE_FONT_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Corps de texte</label>
                    <select
                      value={typography.bodyFont}
                      onChange={(e) =>
                        onTypographyChange({ ...typography, bodyFont: e.target.value as TypographyPreferences['bodyFont'] })
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#0b0e19] px-2.5 py-1.5 text-xs text-white"
                    >
                      {BODY_FONT_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Glyphes</label>
                    <select
                      value={typography.glyphFont}
                      onChange={(e) =>
                        onTypographyChange({ ...typography, glyphFont: e.target.value as TypographyPreferences['glyphFont'] })
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#0b0e19] px-2.5 py-1.5 text-xs text-white"
                    >
                      {GLYPH_FONT_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
