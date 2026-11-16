import React, { useMemo, useState } from 'react';
import {
  Check,
  Database,
  Pin,
  Plus,
  Search,
  Sparkles,
  Stars,
} from 'lucide-react';
import { AstroChart } from '../astro/astroEngine';
import {
  buildFullChartDataSheet,
  CatalogCategory,
  CatalogPointEntry,
  searchMinorPlanetsCatalog,
} from '../astro/celestialCatalog';

export interface CelestialDataSheetViewProps {
  baseChart: AstroChart;
  pinnedCatalogPoints: CatalogPointEntry[];
  onTogglePinPoint: (point: CatalogPointEntry) => void;
  onOpenWheel: () => void;
}

type DataSheetFilter = 'all' | CatalogCategory | 'pinned';

const CATEGORY_TABS: Array<{ id: DataSheetFilter; label: string }> = [
  { id: 'all', label: 'Tout le DataSheet' },
  { id: 'planets', label: 'Planètes & Lilith' },
  { id: 'angles', label: 'Angles (ASC · MC · Vx)' },
  { id: 'nodes', label: 'Nœuds Lunaires & Planétaires' },
  { id: 'lots', label: 'Parts Arabes / Lots' },
  { id: 'uranians', label: 'Uraniens (Hambourg)' },
  { id: 'stars', label: 'Étoiles Fixes (700+)' },
  { id: 'asteroids', label: 'Astéroïdes & Naines (26 000+)' },
  { id: 'pinned', label: 'Épinglés sur la roue' },
];

export const CelestialDataSheetView: React.FC<CelestialDataSheetViewProps> = ({
  baseChart,
  pinnedCatalogPoints,
  onTogglePinPoint,
  onOpenWheel,
}) => {
  const [filter, setFilter] = useState<DataSheetFilter>('all');
  const [query, setQuery] = useState('');
  const [onlyContactsOrParans, setOnlyContactsOrParans] = useState(false);

  const fullSheet = useMemo(() => buildFullChartDataSheet(baseChart), [baseChart]);

  const asteroidResults = useMemo(() => {
    if (filter !== 'asteroids' && !query.trim()) return [];
    return searchMinorPlanetsCatalog(query, baseChart, 48);
  }, [filter, query, baseChart]);

  const displayedPoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    let baseList: CatalogPointEntry[];

    if (filter === 'pinned') {
      baseList = pinnedCatalogPoints;
    } else if (filter === 'asteroids') {
      baseList = asteroidResults;
    } else {
      baseList = fullSheet.filter((pt) => (filter === 'all' ? true : pt.category === filter));
      if (filter === 'all' && q) {
        // Merge matching asteroids from the 26,000+ MPC search index automatically
        const existingIds = new Set(baseList.map((x) => x.id));
        const extra = searchMinorPlanetsCatalog(q, baseChart, 20).filter(
          (x) => !existingIds.has(x.id)
        );
        baseList = [...baseList, ...extra];
      }
    }

    if (onlyContactsOrParans) {
      baseList = baseList.filter((pt) => pt.natalContact || pt.paranNote);
    }

    if (!q) return baseList;
    return baseList.filter(
      (pt) =>
        pt.name.toLowerCase().includes(q) ||
        pt.subLabel.toLowerCase().includes(q) ||
        pt.sign.name.toLowerCase().includes(q) ||
        pt.natureOrKeywords.toLowerCase().includes(q) ||
        String(pt.mpcNumber ?? '').includes(q)
    );
  }, [filter, query, fullSheet, asteroidResults, pinnedCatalogPoints, onlyContactsOrParans, baseChart]);

  const activeStarContacts = useMemo(
    () =>
      fullSheet.filter(
        (pt) => pt.category === 'stars' && (pt.natalContact || pt.paranNote)
      ),
    [fullSheet]
  );

  const pinnedIds = useMemo(
    () => new Set(pinnedCatalogPoints.map((p) => p.id)),
    [pinnedCatalogPoints]
  );

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header & Search Banner */}
        <section className="rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-500/10 px-3 py-1 text-[11px] font-medium text-purple-200">
                <Database className="h-3.5 w-3.5 text-purple-300" />
                <span>Chart Point DataSheet · 700+ Étoiles · 26 000+ Astéroïdes</span>
              </div>
              <h1 className="mt-2 font-display text-xl sm:text-2xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                Catalogue Céleste & Points Spéciaux
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                Recherchez par nom, constellation, signe zodiacal ou numéro MPC (ex: Régulus, Chiron, Éris, Part de Fortune, #433, Hadès).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenWheel}
                className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Pin className="h-3.5 w-3.5 text-amber-300" />
                <span>Voir sur la Roue ({pinnedCatalogPoints.length} épinglés)</span>
              </button>
            </div>
          </div>

          {/* Search Input & Filter Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-300/75" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher étoile fixe (Algol, Sirius…), astéroïde (Chiron, Sedna, #2060…), nœud, lot arabe…"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs text-slate-200 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={onlyContactsOrParans}
                onChange={(e) => setOnlyContactsOrParans(e.target.checked)}
                className="accent-amber-400"
              />
              <span>Conjonctions & Parans natals uniquement</span>
            </label>
          </div>

          {/* Category Tabs */}
          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto cosmic-scroll pb-1">
            {CATEGORY_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filter === t.id
                    ? 'bg-gradient-to-r from-amber-400/90 to-yellow-400/90 text-slate-950 font-semibold shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                    : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/35 hover:text-amber-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Active Fixed Stars Conjunctions & Parans Highlights */}
        {activeStarContacts.length > 0 && (
          <section className="rounded-3xl border border-amber-200/25 bg-[#151824]/65 backdrop-blur-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-amber-200 mb-3">
              <Stars className="h-4 w-4 text-amber-300" />
              <span>Étoiles Fixes en Conjonction ou Paran Natal ({activeStarContacts.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeStarContacts.slice(0, 6).map((st) => (
                <div
                  key={st.id}
                  className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-100 truncate">{st.name}</span>
                    <span className="font-mono-tabular text-[11px] text-sky-200 shrink-0">
                      {st.formattedDeg} {st.sign.symbol}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-200">
                    {st.natalContact || st.paranNote}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{st.natureOrKeywords}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Precision DataSheet Table */}
        <section className="rounded-3xl border border-amber-200/25 bg-[#151824]/75 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
          <div className="overflow-x-auto cosmic-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0c101d]/80 text-[11px] uppercase tracking-wider text-amber-200/90">
                  <th className="py-3 px-4 font-semibold">Astre / Point</th>
                  <th className="py-3 px-3 font-semibold">Position Écliptique</th>
                  <th className="py-3 px-3 font-semibold">Maison</th>
                  <th className="py-3 px-3 font-semibold">Déclinaison (δ)</th>
                  <th className="py-3 px-3 font-semibold">Contact / Paran</th>
                  <th className="py-3 px-4 font-semibold">Interprétation & Dignité</th>
                  <th className="py-3 px-4 text-right font-semibold">Roue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {displayedPoints.map((pt) => {
                  const isPinned = pinnedIds.has(pt.id);
                  return (
                    <tr
                      key={pt.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 font-glyph text-sm text-amber-200 shrink-0">
                            {pt.symbol}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate max-w-[200px]">
                              {pt.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                              {pt.subLabel}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular whitespace-nowrap">
                        <span className="text-amber-100 font-semibold">{pt.formattedDeg}</span>{' '}
                        <span style={{ color: pt.sign.color }}>
                          {pt.sign.symbol} {pt.sign.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-sky-200 whitespace-nowrap">
                        Maison {baseChart.houses[pt.house - 1]?.roman ?? pt.house}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-300 whitespace-nowrap">
                        {Math.abs(pt.declinationDeg).toFixed(2)}° {pt.declinationDeg >= 0 ? 'N' : 'S'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {pt.natalContact || pt.paranNote ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-300/40 bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-100">
                            <Sparkles className="h-2.5 w-2.5 text-purple-300" />
                            {pt.natalContact || pt.paranNote}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-300 max-w-xs">
                        {pt.natureOrKeywords}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onTogglePinPoint(pt)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                            isPinned
                              ? 'border-emerald-300/50 bg-emerald-500/20 text-emerald-100'
                              : 'border-amber-200/30 bg-white/[0.04] text-amber-100 hover:border-amber-300/60'
                          }`}
                        >
                          {isPinned ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Affiché</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Épingler</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayedPoints.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucun point céleste ne correspond à cette recherche. Essayez un autre nom (ex: Sirius, Chiron, #136199) ou réinitialisez les filtres.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
