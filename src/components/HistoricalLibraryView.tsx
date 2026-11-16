import React, { useMemo, useState } from 'react';
import {
  BookMarked,
  CalendarClock,
  Check,
  Heart,
  Lock,
  MapPin,
  Orbit,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  calculateAstroChart,
  NatalProfile,
} from '../astro/astroEngine';
import {
  HISTORICAL_CHARTS,
  HistoricalCategory,
  HistoricalChartEntry,
  historicalEntryToProfile,
} from '../astro/historicalCharts';
import { VoiceDictationButton } from './VoiceDictationButton';

export interface HistoricalLibraryViewProps {
  activeProfileId: string;
  partnerProfileId: string;
  showVoiceSearchButtons: boolean;
  onLoadHistoricalProfile: (profile: NatalProfile, destination: 'wheel' | 'summary') => void;
  onCompareInSynastry: (profile: NatalProfile) => void;
  profilesLocked?: boolean;
  onOpenAdmin?: () => void;
}

type CategoryFilter = 'all' | HistoricalCategory;

function formatHistoricalBirth(iso: string): string {
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = (datePart ?? '').split('-').map(Number);
  if (!y || !m || !d) return iso;
  const monthNames = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  return `${d} ${monthNames[m - 1] ?? ''} ${y} · ${timePart ?? '12:00'}`;
}

export const HistoricalLibraryView: React.FC<HistoricalLibraryViewProps> = ({
  activeProfileId,
  partnerProfileId,
  showVoiceSearchButtons,
  onLoadHistoricalProfile,
  onCompareInSynastry,
  profilesLocked = false,
  onOpenAdmin,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  // Pre-compute live astronomical Sun, Moon & Ascendant positions for every historical chart
  const enrichedEntries = useMemo(() => {
    return HISTORICAL_CHARTS.map((entry) => {
      const parsed = new Date(entry.birthDateIso);
      const chart = calculateAstroChart(
        Number.isNaN(parsed.getTime()) ? new Date(1900, 0, 1, 12, 0) : parsed,
        entry.latitude,
        entry.longitude,
        entry.birthPlaceLabel,
        entry.houseSystem
      );
      const sun = chart.planets.find((p) => p.id === 'sun');
      const moon = chart.planets.find((p) => p.id === 'moon');
      return {
        entry,
        profile: historicalEntryToProfile(entry),
        sunLabel: sun ? `${sun.sign.symbol} ${sun.sign.name}` : '—',
        moonLabel: moon ? `${moon.sign.symbol} ${moon.sign.name}` : '—',
        ascLabel: `${chart.ascSign.symbol} ${chart.ascSign.name}`,
      };
    });
  }, []);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrichedEntries.filter(({ entry, sunLabel, moonLabel, ascLabel }) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.birthPlaceLabel.toLowerCase().includes(q) ||
        entry.categoryLabel.toLowerCase().includes(q) ||
        entry.headline.toLowerCase().includes(q) ||
        entry.astrologicalSignature.toLowerCase().includes(q) ||
        sunLabel.toLowerCase().includes(q) ||
        moonLabel.toLowerCase().includes(q) ||
        ascLabel.toLowerCase().includes(q)
      );
    });
  }, [enrichedEntries, query, category]);

  const handleLoad = (entry: HistoricalChartEntry, destination: 'wheel' | 'summary') => {
    onLoadHistoricalProfile(historicalEntryToProfile(entry), destination);
  };

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] space-y-5">
        {/* Hero Header */}
        <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/78 backdrop-blur-xl p-6 shadow-[0_18px_55px_rgba(0,0,0,0.6)]">
          {profilesLocked && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-100">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-300 shrink-0" />
                <span>
                  Le chargement d’un thème historique est verrouillé par l’administrateur afin de protéger le profil actif.
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-amber-200/90">
                <BookMarked className="h-4 w-4 text-amber-300 shrink-0" />
                <span>Bibliothèque des Astres</span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span className="font-mono-tabular">{HISTORICAL_CHARTS.length} thèmes historiques archivés</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                Bibliothèque des Astres
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-amber-100/85">
                Explorez le ciel de naissance de figures marquantes des sciences, des arts, de la littérature et de l’Histoire, et chargez instantanément leurs données natales.
              </p>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-amber-300/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un personnage, un signe (Scorpion, Verseau...), une ville ou une discipline..."
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                />
              </div>
              {showVoiceSearchButtons && (
                <VoiceDictationButton
                  accent="gold"
                  title="Dicter un nom dans la Bibliothèque des Astres"
                  onTranscript={(spoken) => setQuery(spoken)}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', `Tous (${HISTORICAL_CHARTS.length})`],
                  ['science', 'Sciences & Invention'],
                  ['arts', 'Arts & Musique'],
                  ['literature', 'Littérature & Philo'],
                  ['history', 'Histoire & Destinée'],
                ] as Array<[CategoryFilter, string]>
              ).map(([catId, label]) => (
                <button
                  key={catId}
                  type="button"
                  onClick={() => setCategory(catId)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    category === catId
                      ? 'bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.28)]'
                      : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/35 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Historical Figure Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEntries.map(({ entry, profile, sunLabel, moonLabel, ascLabel }) => {
            const isLoadedActive = activeProfileId === entry.id;
            const isPartnerLoaded = partnerProfileId === entry.id;

            return (
              <article
                key={entry.id}
                className={`cosmic-glass-card flex flex-col justify-between gap-4 rounded-3xl border backdrop-blur-xl p-5 shadow-2xl shadow-black/50 ${
                  isLoadedActive
                    ? 'border-amber-300/65 bg-amber-500/[0.06] ring-1 ring-amber-300/20'
                    : 'border-amber-200/25 bg-[#151824]/75'
                }`}
              >
                <div className="space-y-3">
                  {/* Quiet metadata header */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>{entry.categoryLabel} · {entry.lifespan}</span>
                    {isLoadedActive && (
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                        <Check className="h-3 w-3" />
                        <span>Actif</span>
                      </span>
                    )}
                  </div>

                  {/* Name & Headline */}
                  <div>
                    <h2 className="font-display text-lg font-semibold tracking-wide text-amber-100">
                      {entry.name}
                    </h2>
                    <div className="mt-0.5 text-xs font-medium text-purple-200/90">
                      {entry.headline}
                    </div>
                  </div>

                  {/* Birth Date, Place & Coordinates */}
                  <div className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 px-3.5 py-2.5 space-y-1 text-[11.5px] text-slate-300">
                    <div className="flex items-center gap-2 font-mono-tabular">
                      <CalendarClock className="h-3.5 w-3.5 text-amber-300/80 shrink-0" />
                      <span>{formatHistoricalBirth(entry.birthDateIso)}</span>
                      <span aria-hidden="true" className="text-white/25">·</span>
                      <span className="text-slate-400">{entry.roddenNote}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-sky-300/80 shrink-0" />
                      <span>{entry.birthPlaceLabel}</span>
                      <span aria-hidden="true" className="text-white/25">·</span>
                      <span className="font-mono-tabular text-slate-400">
                        {entry.latitude.toFixed(2)}°, {entry.longitude.toFixed(2)}°
                      </span>
                    </div>
                  </div>

                  {/* Live Calculated Big 3 Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-2 py-1.5">
                      <div className="text-[10px] text-slate-400">Soleil</div>
                      <div className="text-xs font-semibold text-amber-200 truncate" style={{ fontFamily: 'var(--font-glyph)' }}>
                        {sunLabel}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-2 py-1.5">
                      <div className="text-[10px] text-slate-400">Lune</div>
                      <div className="text-xs font-semibold text-indigo-200 truncate" style={{ fontFamily: 'var(--font-glyph)' }}>
                        {moonLabel}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-2 py-1.5">
                      <div className="text-[10px] text-slate-400">Ascendant</div>
                      <div className="text-xs font-semibold text-sky-200 truncate" style={{ fontFamily: 'var(--font-glyph)' }}>
                        {ascLabel}
                      </div>
                    </div>
                  </div>

                  {/* Astrological Signature */}
                  <p className="text-xs leading-relaxed text-slate-300">
                    {entry.astrologicalSignature}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={profilesLocked}
                    onClick={() => handleLoad(entry, 'wheel')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/90 via-amber-400/90 to-yellow-500/90 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.3)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                  >
                    {profilesLocked ? <Lock className="h-3.5 w-3.5" /> : <Orbit className="h-3.5 w-3.5" />}
                    <span>Charger le thème</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={profilesLocked}
                      onClick={() => handleLoad(entry, 'summary')}
                      title="Charger et ouvrir le bilan complet"
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-300/45 hover:text-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="h-3 w-3 text-amber-300" />
                      <span>Bilan</span>
                    </button>
                    <button
                      type="button"
                      disabled={profilesLocked}
                      onClick={() => onCompareInSynastry(profile)}
                      title="Charger comme Partenaire B pour comparer en Synastrie"
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap ${
                        isPartnerLoaded
                          ? 'border-rose-400/55 bg-rose-500/20 text-rose-100'
                          : 'border-white/15 bg-white/[0.04] text-slate-200 hover:border-rose-300/45 hover:text-rose-100'
                      }`}
                    >
                      <Heart className="h-3 w-3 text-rose-300" />
                      <span>Synastrie</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredEntries.length === 0 && (
            <div className="col-span-full rounded-3xl border border-white/10 bg-[#151824]/75 p-6 text-center text-sm text-slate-300">
              Aucun personnage ne correspond à « {query} ». Essayez un autre nom ou cliquez sur « Tous ».
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
