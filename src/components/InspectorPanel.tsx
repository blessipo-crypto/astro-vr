import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import {
  AspectInfo,
  AstroChart,
  ChartMode,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  HouseCusp,
  PlanetId,
  PlanetPosition,
  SolarReturnAnalysis,
} from '../astro/astroEngine';
import {
  calculateBaziSummary,
  evaluateAnimalHarmony,
  transposeLongitudeToChinese,
  WU_XING_COLORS,
  WuXingElement,
  ZodiacTradition,
} from '../astro/chineseAstrology';
import { generateChartInterpretation } from '../astro/interpretations';
import {
  getDecanInfo,
  getHouseCuspInterpretation,
  getPlanetDignity,
} from '../astro/astroKnowledge';
import {
  buildChineseOppositesAndComplements,
  buildSignAffinityProfile,
  buildWesternOppositesTable,
  CHINESE_SAN_HE_TRINES,
  WESTERN_ELEMENT_TRINES,
} from '../astro/oppositesTable';

interface InspectorPanelProps {
  mode: ChartMode;
  tradition: ZodiacTradition;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  solarReturnAnalysis: SolarReturnAnalysis | null;
  solarReturnExactDate: Date | null;
  comparativeAnalysis: ComparativeAnalysis | null;
  selectedPlanet: PlanetPosition | null;
  selectedPlanetLayer: 'base' | 'outer';
  selectedHouse: HouseCusp | null;
  showFullSummary: boolean;
  onClose: () => void;
  onSelectPlanet: (id: PlanetId, layer: 'base' | 'outer') => void;
  onHighlightAspect: (aspectId: string | null) => void;
  onOpenSharePrint?: () => void;
}

type SummaryViewTab = 'interpretation' | 'table' | 'chinese' | 'affinities';

const OUTER_BADGE_MAP: Partial<Record<ChartMode, string>> = {
  transits: 'Transit',
  solarReturn: 'Rév. Solaire',
  lunarReturn: 'Rév. Lunaire',
  progressions: 'Progressé',
  synastry: 'Partenaire B',
  comparative: 'Comparée',
};

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  mode,
  tradition,
  baseChart,
  outerChart,
  comparisonAspects,
  solarReturnAnalysis,
  solarReturnExactDate,
  comparativeAnalysis,
  selectedPlanet,
  selectedPlanetLayer,
  selectedHouse,
  showFullSummary,
  onClose,
  onSelectPlanet,
  onHighlightAspect,
  onOpenSharePrint,
}) => {
  const [summaryTab, setSummaryTab] = useState<SummaryViewTab>('interpretation');

  if (!selectedPlanet && !selectedHouse && !showFullSummary) return null;

  const outerLabel = OUTER_BADGE_MAP[mode] ?? 'Externe';

  if (showFullSummary && !selectedPlanet && !selectedHouse) {
    const interpretation = generateChartInterpretation({
      mode,
      tradition,
      baseChart,
      outerChart,
      comparisonAspects,
      solarReturnAnalysis,
      comparativeAnalysis,
    });
    const baziBase = calculateBaziSummary(baseChart);
    const baziOuter = outerChart ? calculateBaziSummary(outerChart) : null;
    const ascBaseCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
    const ascOuterCh = outerChart ? transposeLongitudeToChinese(outerChart.ascendant).sign : null;
    const ascRelation = ascOuterCh ? evaluateAnimalHarmony(ascBaseCh, ascOuterCh) : null;

    const sunBase = baseChart.planets.find((p) => p.id === 'sun');
    const sunAffinity = sunBase ? buildSignAffinityProfile(sunBase.sign, 'Soleil') : null;
    const ascAffinity = buildSignAffinityProfile(baseChart.ascSign, 'Ascendant');
    const westernOpposites = buildWesternOppositesTable(baseChart, outerChart);
    const chineseRelations = buildChineseOppositesAndComplements(baseChart);

    return (
      <aside
        aria-label="Interprétations, comparatif, affinités et transposition chinoise"
        className="no-print pointer-events-auto fixed top-16 right-5 z-20 w-[445px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-14.5rem)] overflow-y-auto cosmic-scroll rounded-xl border border-[#d4af37]/30 bg-[#080d1b]/95 p-5 text-[#f3efe6] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="text-xs text-[#e7cfa0]">
              {outerChart ? `Comparatif · ${baseChart.cityName}` : `Synthèse · ${baseChart.cityName}`}
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#f8f3e6] mt-0.5">
              {interpretation.headline}
            </h2>
            <div className="text-[11px] font-mono-tabular text-[#7dd3fc] mt-0.5">
              {interpretation.subtitle}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOpenSharePrint && (
              <button
                type="button"
                onClick={onOpenSharePrint}
                title="Imprimer en PDF ou partager par lien"
                aria-label="Imprimer en PDF ou partager par lien"
                className="flex items-center gap-1 rounded-lg border border-[#d4af37]/35 bg-[#d4af37]/15 px-2 py-1.5 text-[11px] font-medium text-[#f3d67a] hover:bg-[#d4af37]/25 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Lien</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le panneau"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean 4-tab selector inside Inspector */}
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-[#0d1428] p-1">
          <button
            type="button"
            onClick={() => setSummaryTab('interpretation')}
            className={`rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer truncate ${
              summaryTab === 'interpretation'
                ? 'bg-[#d4af37] text-[#05070e] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Interprétation
          </button>
          <button
            type="button"
            onClick={() => setSummaryTab('table')}
            className={`rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer truncate ${
              summaryTab === 'table'
                ? 'bg-[#38bdf8] text-[#05070e] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {outerChart ? 'Comparatif' : 'Positions'}
          </button>
          <button
            type="button"
            onClick={() => setSummaryTab('affinities')}
            className={`rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer truncate ${
              summaryTab === 'affinities'
                ? 'bg-emerald-400 text-[#05070e] font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Axes & Affinités
          </button>
          <button
            type="button"
            onClick={() => setSummaryTab('chinese')}
            className={`rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer truncate ${
              summaryTab === 'chinese'
                ? 'bg-[#e0533c] text-white font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Chinois 龍
          </button>
        </div>

        {/* SUB-TAB 1: Complete French Interpretations for ALL Themes */}
        {summaryTab === 'interpretation' && (
          <div className="mt-3.5 space-y-3 text-xs">
            <div className="rounded-lg border border-[#d4af37]/30 bg-[#10172b] p-3.5 leading-relaxed text-[#f3efe6]">
              {interpretation.synthesis}
            </div>

            {mode === 'solarReturn' && solarReturnAnalysis && outerChart && (
              <div className="rounded-lg border border-[#38bdf8]/30 bg-[#0c162d] p-3 space-y-1.5">
                <div className="font-semibold text-[#7dd3fc]">
                  Retour Solaire exact :{' '}
                  <span className="font-mono-tabular">
                    {solarReturnExactDate
                      ? new Intl.DateTimeFormat('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        }).format(solarReturnExactDate)
                      : '—'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono-tabular text-[11px] text-slate-300">
                  <div>
                    ASC RS : {outerChart.ascSign.symbol} {outerChart.ascSign.name} (M.{solarReturnAnalysis.ascInNatalHouse.roman} nat.)
                  </div>
                  <div>
                    MC RS : {outerChart.mcSign.symbol} {outerChart.mcSign.name} (M.{solarReturnAnalysis.mcInNatalHouse.roman} nat.)
                  </div>
                  <div>Soleil RS : Maison {solarReturnAnalysis.sunInSrHouse.roman} RS</div>
                  <div>Maître ASC : {solarReturnAnalysis.srAscRuler}</div>
                </div>
              </div>
            )}

            {interpretation.sections.map((sec) => {
              const titleColor =
                sec.accent === 'cyan'
                  ? 'text-[#38bdf8]'
                  : sec.accent === 'amber'
                    ? 'text-[#fb923c]'
                    : sec.accent === 'emerald'
                      ? 'text-emerald-300'
                      : sec.accent === 'rose'
                        ? 'text-rose-300'
                        : 'text-[#e7cfa0]';
              return (
                <div key={sec.title} className="rounded-lg border border-white/10 bg-white/[0.025] p-3 space-y-2">
                  <h3 className={`font-semibold ${titleColor}`}>{sec.title}</h3>
                  <p className="leading-relaxed text-slate-200">{sec.body}</p>
                  {sec.highlights && sec.highlights.length > 0 && (
                    <ul className="pt-1 space-y-1.5 text-[11px] leading-relaxed text-slate-300 border-t border-white/5">
                      {sec.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-1.5">
                          <span className="text-[#d4af37] shrink-0">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SUB-TAB 2: Comparative Table / Single Positions & Elements */}
        {summaryTab === 'table' && (
          <div className="mt-3.5 space-y-3">
            {outerChart && comparativeAnalysis ? (
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#38bdf8]">
                    Tableau comparatif ({outerLabel} vs Base)
                  </span>
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    {comparativeAnalysis.harmoniousCount} harm. · {comparativeAnalysis.tenseCount} tens. ·{' '}
                    {comparativeAnalysis.fusionCount} conj.
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 mb-2 font-mono-tabular">
                  ASC {outerLabel} en Maison {comparativeAnalysis.ascInBaseHouseRoman} de base · MC en Maison{' '}
                  {comparativeAnalysis.mcInBaseHouseRoman}
                </div>

                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="grid grid-cols-12 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-slate-400">
                    <div className="col-span-3">Astre</div>
                    <div className="col-span-4 text-[#e7cfa0]">Base (Or)</div>
                    <div className="col-span-4 text-[#7dd3fc]">{outerLabel}</div>
                    <div className="col-span-1 text-right">M.</div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {comparativeAnalysis.rows.map((row) => (
                      <div
                        key={row.planetId}
                        className="grid grid-cols-12 items-center px-2.5 py-1.5 text-[11px] hover:bg-white/[0.03]"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectPlanet(row.planetId, 'base')}
                          className="col-span-3 text-left font-medium text-[#f3efe6] hover:text-[#d4af37] truncate cursor-pointer"
                        >
                          {row.symbol} {row.name}
                        </button>
                        <div className="col-span-4 font-mono-tabular text-slate-300">{row.basePos}</div>
                        <button
                          type="button"
                          onClick={() => onSelectPlanet(row.planetId, 'outer')}
                          className="col-span-4 text-left font-mono-tabular text-sky-200 hover:text-sky-400 cursor-pointer"
                        >
                          {row.outerPos}
                        </button>
                        <div className="col-span-1 text-right font-mono-tabular text-slate-400">
                          {row.outerInBaseHouseRoman}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-[#e7cfa0] mb-2">Positions planétaires</div>
                <div className="space-y-1">
                  {baseChart.planets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPlanet(p.id, 'base')}
                      className="w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <span className="text-[#f3efe6] font-medium">
                        {p.symbol} {p.name}
                        {p.retrograde ? <span className="text-amber-400 ml-1">℞</span> : null}
                      </span>
                      <span className="font-mono-tabular text-slate-300">
                        {p.formattedDeg} {p.sign.symbol} {p.sign.name} · M{baseChart.houses[p.house - 1].roman}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/10 pt-3">
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">Éléments (Base)</div>
                <div className="space-y-0.5 font-mono-tabular">
                  <div>Feu : <span className="text-amber-300">{baseChart.elements.Feu}</span></div>
                  <div>Terre : <span className="text-emerald-300">{baseChart.elements.Terre}</span></div>
                  <div>Air : <span className="text-sky-300">{baseChart.elements.Air}</span></div>
                  <div>Eau : <span className="text-indigo-300">{baseChart.elements.Eau}</span></div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">Modalités (Base)</div>
                <div className="space-y-0.5 font-mono-tabular">
                  <div>Cardinal : <span className="text-[#f3efe6]">{baseChart.modalities.Cardinal}</span></div>
                  <div>Fixe : <span className="text-[#f3efe6]">{baseChart.modalities.Fixe}</span></div>
                  <div>Mutable : <span className="text-[#f3efe6]">{baseChart.modalities.Mutable}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: Tableau des Signes Complémentaires, Opposés & Affinités */}
        {summaryTab === 'affinities' && (
          <div className="mt-3.5 space-y-3.5 text-xs">
            {/* Personal Sun & ASC affinities */}
            <div className="space-y-2">
              <div className="font-semibold text-emerald-300">
                Affinités personnalisées du thème
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[sunAffinity, ascAffinity]
                  .filter((item): item is NonNullable<typeof item> => Boolean(item))
                  .map((prof) => (
                    <div
                      key={prof.sourceLabel}
                      className="rounded-lg border border-emerald-400/25 bg-[#0a181e] p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#f3efe6]">
                          {prof.sourceLabel} en {prof.sourceSign.symbol} {prof.sourceSign.name}
                        </span>
                        <span className="text-[11px] font-mono-tabular text-emerald-300">
                          {prof.sourceSign.element} · {prof.sourceSign.modality}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="rounded bg-white/[0.04] px-2 py-1">
                          <span className="text-emerald-300 font-medium">Trigones (120°) :</span>{' '}
                          {prof.trineAllies.map((s) => `${s.symbol} ${s.name}`).join(' · ')}
                        </div>
                        <div className="rounded bg-white/[0.04] px-2 py-1">
                          <span className="text-[#7dd3fc] font-medium">Sextiles (60°) :</span>{' '}
                          {prof.sextileAllies.map((s) => `${s.symbol} ${s.name}`).join(' · ')}
                        </div>
                        <div className="rounded bg-white/[0.04] px-2 py-1">
                          <span className="text-[#e7cfa0] font-medium">Opposé / Complém. :</span>{' '}
                          {prof.oppositeComplement.symbol} {prof.oppositeComplement.name}
                        </div>
                        <div className="rounded bg-white/[0.04] px-2 py-1">
                          <span className="text-amber-300 font-medium">Défis / Carrés (90°) :</span>{' '}
                          {prof.squareChallenges.map((s) => `${s.symbol} ${s.name}`).join(' · ')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Western 6 Opposite & Complementary Axes Table */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#e7cfa0]">
                  Tableau des 6 Axes Opposés & Complémentaires
                </span>
                <span className="text-[10px] font-mono-tabular text-slate-400">180°</span>
              </div>
              <div className="rounded-lg border border-white/10 overflow-hidden divide-y divide-white/10">
                {westernOpposites.map((axis) => (
                  <div
                    key={axis.axisNumber}
                    className={`p-2.5 space-y-1.5 ${
                      axis.isAscDscAxis ? 'bg-[#d4af37]/10' : 'bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#f3efe6]">
                        {axis.signA.symbol} {axis.signA.name} ↔ {axis.signB.symbol} {axis.signB.name}
                      </span>
                      <span className="text-[10px] font-mono-tabular text-[#7dd3fc]">
                        {axis.isAscDscAxis ? 'Axe ASC-DSC · ' : ''}
                        {axis.polarityPair}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-[#e7cfa0]">{axis.axisTheme}</div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {axis.complementarity}
                    </p>
                    {(axis.activePlanetsA.length > 0 || axis.activePlanetsB.length > 0) && (
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px] font-mono-tabular">
                        <div className="rounded bg-[#0d1428] px-2 py-1 text-slate-300">
                          <span className="text-slate-400">{axis.signA.symbol} : </span>
                          {axis.activePlanetsA.length > 0 ? axis.activePlanetsA.join(', ') : '—'}
                        </div>
                        <div className="rounded bg-[#0d1428] px-2 py-1 text-slate-300">
                          <span className="text-slate-400">{axis.signB.symbol} : </span>
                          {axis.activePlanetsB.length > 0 ? axis.activePlanetsB.join(', ') : '—'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Western Element Trines */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="font-semibold text-[#7dd3fc]">
                Affinités élémentaires (Trigones & Éléments complémentaires)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {WESTERN_ELEMENT_TRINES.map((tr) => (
                  <div
                    key={tr.element}
                    className="rounded-lg border border-white/10 bg-white/[0.025] p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: tr.color }}>
                        {tr.element} ↔ {tr.complementaryElement}
                      </span>
                    </div>
                    <div className="font-mono-tabular text-[11px] text-[#f3efe6]">
                      {tr.signs.map((s) => `${s.symbol} ${s.name}`).join(' · ')}
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-400">{tr.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chinese Affinities (San He), Complements (Liu He) & Opposites (Liu Chong) */}
            <div className="space-y-2.5 border-t border-white/10 pt-3">
              <div className="font-semibold text-amber-300">
                Affinités & Opposés Chinois (San He · Liu He · Liu Chong)
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-slate-300">
                  4 Triangles d’Affinité (San He · Harmonie majeure)
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {CHINESE_SAN_HE_TRINES.map((tri) => (
                    <div
                      key={tri.name}
                      className="rounded-md border border-white/10 bg-[#130f1a] px-2.5 py-2 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" style={{ color: tri.color }}>
                          {tri.name}
                        </span>
                        <span className="text-[10px] font-mono-tabular text-slate-400">
                          {tri.elementAffinity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-200">
                        {tri.signs.map((s) => `${s.branchHanzi}${s.hanzi} ${s.name}`).join(' · ')}
                      </div>
                      <div className="text-[10px] text-slate-400">{tri.dynamics}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-emerald-300">
                  6 Alliances Complémentaires (Liu He · Unions secrètes)
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {chineseRelations.complements.map((pair) => (
                    <div
                      key={`${pair.signA.name}-${pair.signB.name}`}
                      className="rounded-md border border-emerald-400/20 bg-emerald-950/15 px-2.5 py-1.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#f3efe6]">
                          {pair.signA.branchHanzi}{pair.signA.hanzi} {pair.signA.name} &{' '}
                          {pair.signB.branchHanzi}{pair.signB.hanzi} {pair.signB.name}
                        </span>
                        <span className="text-[10px] font-mono-tabular text-emerald-300">
                          {pair.resultElement}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300">{pair.dynamics}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-rose-300">
                  6 Axes Opposés (Liu Chong · Polarités complémentaires)
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {chineseRelations.opposites.map((ax) => (
                    <div
                      key={ax.axisName}
                      className="rounded-md border border-rose-400/20 bg-rose-950/15 px-2.5 py-1.5 space-y-1"
                    >
                      <div className="font-medium text-[#f3efe6]">{ax.axisName}</div>
                      <div className="text-[10px] text-slate-300">{ax.dynamics}</div>
                      {(ax.activePlanetsA.length > 0 || ax.activePlanetsB.length > 0) && (
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono-tabular text-amber-200 pt-0.5">
                          {ax.activePlanetsA.length > 0 && (
                            <span>
                              {ax.signA.name} : {ax.activePlanetsA.join(', ')}
                            </span>
                          )}
                          {ax.activePlanetsB.length > 0 && (
                            <span>
                              {ax.signB.name} : {ax.activePlanetsB.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 4: Complete Chinese Astrology Transposition & BaZi */}
        {summaryTab === 'chinese' && (
          <div className="mt-3.5 space-y-3 text-xs">
            <div className="rounded-lg border border-rose-400/30 bg-[#170e16] p-3 space-y-1.5">
              <div className="font-semibold text-amber-300">
                Piliers Solaires BaZi · Année {baziBase.solarYear}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-200">
                <div>Année : {baziBase.yearPillar.label}</div>
                <div>Mois : {baziBase.monthPillar.label}</div>
                <div>Heure : {baziBase.hourPillar.label}</div>
                <div>Dominante : {baziBase.dominantWuXing}</div>
              </div>
              {baziOuter && ascRelation && ascOuterCh && (
                <div className="pt-1.5 border-t border-white/10 text-[11px] text-sky-200">
                  Comparatif {outerLabel} : Pilier {baziOuter.yearPillar.label} · Relation ASC{' '}
                  <span style={{ color: ascRelation.color }} className="font-semibold">
                    {ascRelation.label}
                  </span>{' '}
                  ({ascBaseCh.name} ↔ {ascOuterCh.name})
                </div>
              )}
            </div>

            {/* Wu Xing 5 Elements */}
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono-tabular text-[11px]">
              {(['Bois', 'Feu', 'Terre', 'Métal', 'Eau'] as WuXingElement[]).map((el) => (
                <div key={el} className="rounded-md border border-white/10 bg-[#0d1428] py-1.5">
                  <div style={{ color: WU_XING_COLORS[el] }} className="font-semibold">
                    {el}
                  </div>
                  <div className="text-slate-300 mt-0.5">{baziBase.wuXingBalance[el]}</div>
                </div>
              ))}
            </div>

            {/* Transposition table: Western Planet -> Chinese Animal Branch */}
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <div className="grid grid-cols-12 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-slate-400">
                <div className="col-span-4">Astre</div>
                <div className="col-span-3">Occidental</div>
                <div className="col-span-5 text-amber-300">Signe Chinois (Rameau)</div>
              </div>
              <div className="divide-y divide-white/5">
                {baseChart.planets.map((p) => {
                  const ch = transposeLongitudeToChinese(p.longitude);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPlanet(p.id, 'base')}
                      className="w-full grid grid-cols-12 items-center px-2.5 py-1.5 text-[11px] text-left hover:bg-white/[0.04] cursor-pointer"
                    >
                      <span className="col-span-4 font-medium text-[#f3efe6] truncate">
                        {p.symbol} {p.name}
                      </span>
                      <span className="col-span-3 font-mono-tabular text-slate-400 truncate">
                        {p.sign.symbol} {p.sign.name}
                      </span>
                      <span className="col-span-5 font-mono-tabular" style={{ color: ch.sign.color }}>
                        {ch.sign.branchHanzi}
                        {ch.sign.hanzi} {ch.sign.name} ({ch.sign.wuXing})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </aside>
    );
  }

  if (selectedPlanet) {
    const p = selectedPlanet;
    const isOuter = selectedPlanetLayer === 'outer';
    const activeChart = isOuter && outerChart ? outerChart : baseChart;
    const house = activeChart.houses[p.house - 1];
    const ch = transposeLongitudeToChinese(p.longitude);

    const internalAspects: AspectInfo[] = activeChart.aspects.filter(
      (a) => a.planetA === p.id || a.planetB === p.id
    );
    const compAspects: ComparisonAspectInfo[] = outerChart
      ? comparisonAspects.filter((a) => (isOuter ? a.outerPlanet === p.id : a.natalPlanet === p.id))
      : [];

    const signAffinity = buildSignAffinityProfile(p.sign, p.name);
    const dignity = getPlanetDignity(p.id, p.sign.index);
    const decan = getDecanInfo(p.sign, p.degInSign);

    return (
      <aside
        aria-label="Détails de l’astre sélectionné"
        className="no-print pointer-events-auto fixed top-16 right-5 z-20 w-[365px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-14.5rem)] overflow-y-auto cosmic-scroll rounded-xl border border-[#d4af37]/30 bg-[#080d1b]/95 p-5 text-[#f3efe6] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`flex items-center gap-2 text-xs ${isOuter ? 'text-[#38bdf8]' : 'text-[#e7cfa0]'}`}>
              <span>{isOuter ? outerLabel : mode === 'composite' ? 'Composite' : mode === 'live' ? 'En direct' : 'Base'}</span>
              <span aria-hidden="true">·</span>
              <span>Maison {house.roman}</span>
              <span aria-hidden="true">·</span>
              <span>{p.sign.element}</span>
              {p.retrograde && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">℞</span>
                </>
              )}
            </div>
            <h2 className="font-display text-3xl font-semibold text-[#f8f3e6] mt-1 flex items-center gap-2.5">
              <span style={{ color: `#${p.colorHex.toString(16).padStart(6, '0')}` }}>{p.symbol}</span>
              <span>{p.name}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’inspection"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-baseline justify-between border-y border-white/10 py-2.5">
          <div className="font-mono-tabular text-sm text-[#f3efe6]">
            {p.formattedDeg} {p.sign.symbol} {p.sign.name}
          </div>
          <div className="font-mono-tabular text-xs text-slate-400">
            Lon {p.longitude.toFixed(2)}°
          </div>
        </div>

        {/* Chinese Transposition Card */}
        <div className="mt-3 rounded-lg border border-rose-400/25 bg-[#150f19] p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-300">
              Transposition Chinoise : {ch.sign.branchHanzi}{ch.sign.hanzi} {ch.sign.name}
            </span>
            <span className="font-mono-tabular text-[11px]" style={{ color: ch.sign.color }}>
              {ch.sign.wuXing} {ch.sign.polarity}
            </span>
          </div>
          <div className="text-[11px] text-slate-300">{ch.sign.keywords}</div>
          <div className="text-[10px] font-mono-tabular text-slate-400">
            Trine : {ch.sign.trineGroup} · Heure {ch.sign.hours}
          </div>
        </div>

        {/* Opposé & Affinités du signe */}
        <div className="mt-2.5 rounded-lg border border-emerald-400/25 bg-[#0a161b] px-3 py-2 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-emerald-300 font-semibold">Opposé & Affinités ({p.sign.name})</span>
            <span className="font-mono-tabular text-[#e7cfa0]">
              Opposé : {signAffinity.oppositeComplement.symbol} {signAffinity.oppositeComplement.name}
            </span>
          </div>
          <div className="text-slate-300">
            Trigones : {signAffinity.trineAllies.map((s) => `${s.symbol} ${s.name}`).join(' · ')} ·
            Sextiles : {signAffinity.sextileAllies.map((s) => `${s.symbol} ${s.name}`).join(' · ')}
          </div>
        </div>

        <div className="mt-2.5 rounded-lg border border-[#d4af37]/25 bg-[#0f162b] px-3 py-2 text-[11px] space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[#e7cfa0]">{decan.label}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold border border-white/10"
              style={{ color: dignity.badgeColor }}
            >
              {dignity.status}
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">{dignity.explanation}</p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#f3efe6]">{p.signMeaning}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Fonction archétypale : {p.role}. {decan.nuance}
        </p>

        {compAspects.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <h3 className="text-xs font-semibold text-[#38bdf8]">
              Aspects {outerLabel} → Base ({compAspects.length})
            </h3>
            <ul className="mt-2 space-y-1.5">
              {compAspects.map((asp) => (
                <li key={asp.id}>
                  <button
                    type="button"
                    onClick={() => onHighlightAspect(asp.id)}
                    className="w-full text-left rounded-lg border border-sky-400/15 bg-sky-950/25 px-3 py-2 hover:border-sky-400/50 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#f3efe6]">
                        {asp.outerSymbol} {asp.outerPlanetName}{' '}
                        <span style={{ color: asp.cssColor }}>{asp.symbol}</span>{' '}
                        {asp.natalSymbol} {asp.natalPlanetName}
                      </span>
                      <span className="font-mono-tabular text-slate-400">{asp.orb.toFixed(2)}°</span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-300">{asp.interpretation}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {internalAspects.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <h3 className="text-xs font-semibold text-[#e7cfa0]">
              Aspects internes ({internalAspects.length})
            </h3>
            <ul className="mt-2 space-y-1.5">
              {internalAspects.map((asp) => {
                const otherId = asp.planetA === p.id ? asp.planetB : asp.planetA;
                const otherName = asp.planetA === p.id ? asp.planetBName : asp.planetAName;
                const otherSym = asp.planetA === p.id ? asp.planetBSymbol : asp.planetASymbol;
                return (
                  <li key={asp.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onHighlightAspect(asp.id);
                        onSelectPlanet(otherId, isOuter ? 'outer' : 'base');
                      }}
                      className="w-full text-left rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 hover:border-[#d4af37]/35 hover:bg-white/[0.06] transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#f3efe6]">
                          <span style={{ color: asp.cssColor }}>{asp.symbol}</span> {asp.label} · {otherSym} {otherName}
                        </span>
                        <span className="font-mono-tabular text-slate-400">{asp.orb.toFixed(1)}°</span>
                      </div>
                      <div className="text-[11px] leading-relaxed text-slate-300">{asp.interpretation}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    );
  }

  if (selectedHouse) {
    const hs = selectedHouse;
    const ch = transposeLongitudeToChinese(hs.longitude);
    const occupants = baseChart.planets.filter((p) => p.house === hs.house);

    return (
      <aside
        aria-label="Détails de la maison sélectionnée"
        className="no-print pointer-events-auto fixed top-16 right-5 z-20 w-[350px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-[#d4af37]/30 bg-[#080d1b]/95 p-5 text-[#f3efe6] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-[#e7cfa0]">Secteur écliptique · Maison {hs.roman}</div>
            <h2 className="font-display text-2xl font-semibold text-[#f8f3e6] mt-1">{hs.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’inspection"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-baseline justify-between border-y border-white/10 py-2.5">
          <div className="font-mono-tabular text-sm text-[#f3efe6]">
            {hs.formattedDeg} {hs.sign.symbol} {hs.sign.name}
          </div>
          <div className="font-mono-tabular text-xs text-slate-400">Maître : {hs.sign.ruler}</div>
        </div>

        <div className="mt-2.5 rounded-lg border border-rose-400/25 bg-[#150f19] px-3 py-2 text-xs flex items-center justify-between">
          <span className="text-amber-300 font-medium">
            Rameau Chinois : {ch.sign.branchHanzi}{ch.sign.hanzi} {ch.sign.name}
          </span>
          <span className="font-mono-tabular text-[11px]" style={{ color: ch.sign.color }}>
            {ch.sign.wuXing} {ch.sign.polarity}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#f3efe6]">{hs.meaning}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          {getHouseCuspInterpretation(hs, baseChart.planets)}
        </p>

        {occupants.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-xs font-semibold text-[#e7cfa0]">Astres présents</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {occupants.map((occ) => (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => onSelectPlanet(occ.id, 'base')}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-[#f3efe6] hover:border-[#d4af37]/50 transition-colors cursor-pointer"
                >
                  {occ.symbol} {occ.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    );
  }

  return null;
};
