import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Filter,
  Grid3X3,
  Info,
  Orbit,
  Sparkles,
} from 'lucide-react';
import {
  AspectInfo,
  AstroChart,
  ChartMode,
  ComparisonAspectInfo,
  normalizeDeg,
  PlanetId,
  PlanetPosition,
} from '../astro/astroEngine';

type MatrixHarmonyFilter = 'all' | 'fusion' | 'harmonious' | 'tense';

interface MatrixCellDatum {
  key: string;
  rowIdx: number;
  colIdx: number;
  rowPlanet: PlanetPosition;
  colPlanet: PlanetPosition;
  aspect: {
    id: string;
    label: string;
    symbol: string;
    exactAngle: number;
    orb: number;
    harmony: 'harmonious' | 'tense' | 'fusion';
    cssColor: string;
    interpretation: string;
    category?: 'major' | 'minor' | 'harmonic';
  } | null;
  separationDeg: number;
  matchesFilter: boolean;
}

export interface AspectMatrixD3Props {
  mode: ChartMode;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  onOpenWheel?: () => void;
}

function getShortestSeparation(lonA: number, lonB: number): number {
  const diff = Math.abs(normalizeDeg(lonA) - normalizeDeg(lonB));
  return diff > 180 ? 360 - diff : diff;
}

function getOrbPrecisionBadge(orb: number): { label: string; className: string } {
  if (orb <= 1.0) {
    return {
      label: 'Partile / Exact (< 1°)',
      className: 'border-amber-300/50 bg-amber-400/15 text-amber-200',
    };
  }
  if (orb <= 3.0) {
    return {
      label: 'Orbe serré (≤ 3°)',
      className: 'border-sky-300/45 bg-sky-400/15 text-sky-200',
    };
  }
  if (orb <= 5.5) {
    return {
      label: 'Orbe modéré',
      className: 'border-purple-300/40 bg-purple-400/12 text-purple-200',
    };
  }
  return {
    label: 'Orbe large',
    className: 'border-white/20 bg-white/[0.05] text-slate-300',
  };
}

function getHarmonyMeta(harmony: 'harmonious' | 'tense' | 'fusion'): {
  label: string;
  badgeClass: string;
  accentHex: string;
} {
  if (harmony === 'fusion') {
    return {
      label: 'Fusion / Conjonction',
      badgeClass: 'border-amber-300/50 bg-amber-400/15 text-amber-200',
      accentHex: '#fbbf24',
    };
  }
  if (harmony === 'harmonious') {
    return {
      label: 'Flux Harmonique',
      badgeClass: 'border-sky-300/45 bg-sky-400/15 text-sky-200',
      accentHex: '#38bdf8',
    };
  }
  return {
    label: 'Tension Dynamique',
    badgeClass: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
    accentHex: '#fb7185',
  };
}

function formatOrbDegMin(orb: number): string {
  const deg = Math.floor(orb);
  const min = Math.round((orb - deg) * 60);
  return `${deg}°${String(Math.min(59, min)).padStart(2, '0')}′`;
}

export const AspectMatrixD3: React.FC<AspectMatrixD3Props> = ({
  mode,
  baseChart,
  outerChart,
  comparisonAspects,
  onOpenWheel,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [harmonyFilter, setHarmonyFilter] = useState<MatrixHarmonyFilter>('all');
  const [includeAll21, setIncludeAll21] = useState<boolean>(false);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<MatrixCellDatum | null>(null);

  const isDualChart = Boolean(outerChart);
  const rowPlanets = outerChart ? outerChart.planets : baseChart.planets;
  const colPlanets = baseChart.planets;

  // Build lookup map & normalized matrix cell array
  const { cells, activeCount } = useMemo(() => {
    const map = new Map<string, MatrixCellDatum['aspect']>();

    if (isDualChart) {
      for (const ca of comparisonAspects) {
        const key = `${ca.outerPlanet}__${ca.natalPlanet}`;
        const existing = map.get(key);
        if (!existing || ca.orb < existing.orb) {
          map.set(key, {
            id: ca.id,
            label: ca.label,
            symbol: ca.symbol,
            exactAngle: ca.exactAngle,
            orb: ca.orb,
            harmony: ca.harmony,
            cssColor: ca.cssColor,
            interpretation: ca.interpretation,
          });
        }
      }
    } else {
      const sourceAspects: AspectInfo[] = includeAll21 ? baseChart.all21Aspects : baseChart.aspects;
      for (const a of sourceAspects) {
        const keyAB = `${a.planetA}__${a.planetB}`;
        const keyBA = `${a.planetB}__${a.planetA}`;
        const payload: NonNullable<MatrixCellDatum['aspect']> = {
          id: a.id,
          label: a.label,
          symbol: a.symbol,
          exactAngle: a.exactAngle,
          orb: a.orb,
          harmony: a.harmony,
          cssColor: a.cssColor,
          interpretation: a.interpretation,
          category: a.category,
        };
        const prevAB = map.get(keyAB);
        if (!prevAB || a.orb < prevAB.orb) map.set(keyAB, payload);
        const prevBA = map.get(keyBA);
        if (!prevBA || a.orb < prevBA.orb) map.set(keyBA, payload);
      }
    }

    const built: MatrixCellDatum[] = [];
    let count = 0;

    rowPlanets.forEach((rp, rIdx) => {
      colPlanets.forEach((cp, cIdx) => {
        // For single-chart symmetric matrix, keep lower triangle (rIdx > cIdx) for classic aspectarian clarity
        if (!isDualChart && rIdx <= cIdx) return;

        const key = `${rp.id}__${cp.id}`;
        const foundAspect = map.get(key) ?? null;
        const matchesFilter =
          harmonyFilter === 'all' ||
          (foundAspect !== null && foundAspect.harmony === harmonyFilter);

        if (foundAspect && matchesFilter) count += 1;

        built.push({
          key,
          rowIdx: rIdx,
          colIdx: cIdx,
          rowPlanet: rp,
          colPlanet: cp,
          aspect: foundAspect,
          separationDeg: getShortestSeparation(rp.longitude, cp.longitude),
          matchesFilter,
        });
      });
    });

    return { cells: built, activeCount: count };
  }, [
    isDualChart,
    comparisonAspects,
    includeAll21,
    baseChart.all21Aspects,
    baseChart.aspects,
    rowPlanets,
    colPlanets,
    harmonyFilter,
  ]);

  // Keep selectedCellKey valid and auto-pick the tightest aspect on chart/mode change
  useEffect(() => {
    const currentValid = selectedCellKey && cells.some((c) => c.key === selectedCellKey);
    if (currentValid) return;
    const tightest = cells
      .filter((c) => c.aspect !== null && c.matchesFilter)
      .sort((a, b) => (a.aspect?.orb ?? 99) - (b.aspect?.orb ?? 99))[0];
    setSelectedCellKey(tightest?.key ?? cells[0]?.key ?? null);
  }, [cells, selectedCellKey]);

  const selectedCell = useMemo(
    () => cells.find((c) => c.key === selectedCellKey) ?? null,
    [cells, selectedCellKey]
  );

  // D3.js SVG Matrix Render & Interaction Binding
  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode || rowPlanets.length === 0 || colPlanets.length === 0) return;

    const cellSize = 40;
    const marginTop = isDualChart ? 58 : 24;
    const marginLeft = 56;
    const marginRight = 18;
    const marginBottom = isDualChart ? 18 : 54;

    const gridW = colPlanets.length * cellSize;
    const gridH = rowPlanets.length * cellSize;
    const totalW = marginLeft + gridW + marginRight;
    const totalH = marginTop + gridH + marginBottom;

    const svg = d3
      .select(svgNode)
      .attr('viewBox', `0 0 ${totalW} ${totalH}`)
      .attr('role', 'img')
      .attr('aria-label', 'Matrice interactive des aspects astrologiques');

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const glowFilter = defs.append('filter').attr('id', 'd3MatrixGlow');
    glowFilter
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const root = svg
      .append('g')
      .attr('transform', `translate(${marginLeft}, ${marginTop})`);

    const rowIds = rowPlanets.map((p) => p.id);
    const colIds = colPlanets.map((p) => p.id);

    const xScale = d3
      .scaleBand<PlanetId>()
      .domain(colIds)
      .range([0, gridW])
      .paddingInner(0.1)
      .paddingOuter(0.05);

    const yScale = d3
      .scaleBand<PlanetId>()
      .domain(rowIds)
      .range([0, gridH])
      .paddingInner(0.1)
      .paddingOuter(0.05);

    const orbOpacityScale = d3.scaleLinear().domain([0, 8]).range([0.92, 0.34]).clamp(true);

    // Crosshair highlight bands (updated imperatively by D3 on hover)
    const rowHighlightBand = root
      .append('rect')
      .attr('x', -4)
      .attr('width', gridW + 8)
      .attr('height', yScale.bandwidth())
      .attr('rx', 8)
      .attr('fill', 'rgba(251, 191, 36, 0.08)')
      .attr('stroke', 'rgba(251, 191, 36, 0.25)')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const colHighlightBand = root
      .append('rect')
      .attr('y', -4)
      .attr('width', xScale.bandwidth())
      .attr('height', gridH + 8)
      .attr('rx', 8)
      .attr('fill', 'rgba(56, 189, 248, 0.07)')
      .attr('stroke', 'rgba(56, 189, 248, 0.22)')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Row headers (Left planet symbols + short labels)
    const rowHeaders = root
      .selectAll<SVGGElement, PlanetPosition>('g.row-header')
      .data(rowPlanets, (d) => d.id)
      .join('g')
      .attr('class', 'row-header')
      .attr('transform', (d) => `translate(-10, ${(yScale(d.id) ?? 0) + yScale.bandwidth() / 2})`);

    rowHeaders
      .append('text')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('y', -5)
      .attr('fill', isDualChart ? '#93c5fd' : '#fde68a')
      .attr('font-size', '15px')
      .style('font-family', 'var(--font-glyph)')
      .text((d) => d.symbol);

    rowHeaders
      .append('text')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('y', 9)
      .attr('fill', '#94a3b8')
      .attr('font-size', '8.5px')
      .text((d) => d.name.slice(0, 7));

    // Column headers: Top for dual-chart, Bottom for lower-triangular single-chart
    const colHeaderY = isDualChart ? -16 : gridH + 16;
    const colHeaders = root
      .selectAll<SVGGElement, PlanetPosition>('g.col-header')
      .data(colPlanets, (d) => d.id)
      .join('g')
      .attr('class', 'col-header')
      .attr('transform', (d) => `translate(${(xScale(d.id) ?? 0) + xScale.bandwidth() / 2}, ${colHeaderY})`);

    colHeaders
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', isDualChart ? -8 : -4)
      .attr('fill', '#fde68a')
      .attr('font-size', '15px')
      .style('font-family', 'var(--font-glyph)')
      .text((d) => d.symbol);

    colHeaders
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', isDualChart ? 6 : 11)
      .attr('fill', '#94a3b8')
      .attr('font-size', '8.5px')
      .text((d) => d.name.slice(0, 6));

    // Single-chart diagonal identity markers (staircase corner labels)
    if (!isDualChart) {
      const diag = root
        .selectAll<SVGGElement, PlanetPosition>('g.diag-cell')
        .data(rowPlanets, (d) => d.id)
        .join('g')
        .attr('class', 'diag-cell')
        .attr(
          'transform',
          (d) => `translate(${xScale(d.id) ?? 0}, ${yScale(d.id) ?? 0})`
        );

      diag
        .append('rect')
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('rx', 8)
        .attr('fill', 'rgba(255, 255, 255, 0.03)')
        .attr('stroke', 'rgba(253, 230, 138, 0.14)')
        .attr('stroke-dasharray', '2 3');

      diag
        .append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'rgba(253, 230, 138, 0.65)')
        .attr('font-size', '13px')
        .style('font-family', 'var(--font-glyph)')
        .text((d) => d.symbol);
    }

    // Matrix intersection cells
    const cellGroups = root
      .selectAll<SVGGElement, MatrixCellDatum>('g.matrix-cell')
      .data(cells, (d) => d.key)
      .join('g')
      .attr('class', 'matrix-cell')
      .attr(
        'transform',
        (d) =>
          `translate(${xScale(d.colPlanet.id) ?? 0}, ${yScale(d.rowPlanet.id) ?? 0})`
      )
      .style('cursor', 'pointer');

    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 8)
      .attr('fill', (d) => {
        if (!d.aspect || !d.matchesFilter) return 'rgba(15, 23, 42, 0.45)';
        const accent = getHarmonyMeta(d.aspect.harmony).accentHex;
        const c = d3.color(accent);
        if (!c) return 'rgba(251, 191, 36, 0.18)';
        c.opacity = orbOpacityScale(d.aspect.orb) * 0.24;
        return c.formatRgb();
      })
      .attr('stroke', (d) => {
        if (d.key === selectedCellKey) return '#fde68a';
        if (!d.aspect || !d.matchesFilter) return 'rgba(255, 255, 255, 0.06)';
        const accent = getHarmonyMeta(d.aspect.harmony).accentHex;
        const c = d3.color(accent);
        if (!c) return 'rgba(251, 191, 36, 0.5)';
        c.opacity = orbOpacityScale(d.aspect.orb) * 0.72;
        return c.formatRgb();
      })
      .attr('stroke-width', (d) => (d.key === selectedCellKey ? 2.2 : d.aspect && d.matchesFilter ? 1.25 : 0.8))
      .attr('filter', (d) => (d.key === selectedCellKey ? 'url(#d3MatrixGlow)' : null));

    // Aspect Glyph inside active cells
    cellGroups
      .filter((d) => d.aspect !== null && d.matchesFilter)
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 - 4)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d) => getHarmonyMeta(d.aspect!.harmony).accentHex)
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .style('font-family', 'var(--font-glyph)')
      .style('pointer-events', 'none')
      .text((d) => d.aspect!.symbol);

    // Compact Orb label inside active cells
    cellGroups
      .filter((d) => d.aspect !== null && d.matchesFilter)
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 10)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '7.5px')
      .style('font-variant-numeric', 'tabular-nums')
      .style('pointer-events', 'none')
      .text((d) => `${d.aspect!.orb.toFixed(1)}°`);

    // Subtle separation dot on empty cells
    cellGroups
      .filter((d) => d.aspect === null || !d.matchesFilter)
      .append('circle')
      .attr('cx', xScale.bandwidth() / 2)
      .attr('cy', yScale.bandwidth() / 2)
      .attr('r', 1.4)
      .attr('fill', 'rgba(148, 163, 184, 0.25)')
      .style('pointer-events', 'none');

    // Interactive Hover & Click Listeners via D3
    cellGroups
      .on('mouseenter', function (_event, d) {
        rowHighlightBand
          .attr('y', yScale(d.rowPlanet.id) ?? 0)
          .style('opacity', 1);
        colHighlightBand
          .attr('x', xScale(d.colPlanet.id) ?? 0)
          .style('opacity', 1);

        d3.select(this)
          .select('rect')
          .transition()
          .duration(120)
          .attr('stroke', '#fef3c7')
          .attr('stroke-width', 2);

        setHoveredCell(d);
      })
      .on('mouseleave', function (_event, d) {
        rowHighlightBand.style('opacity', 0);
        colHighlightBand.style('opacity', 0);

        d3.select(this)
          .select('rect')
          .transition()
          .duration(150)
          .attr('stroke', () => {
            if (d.key === selectedCellKey) return '#fde68a';
            if (!d.aspect || !d.matchesFilter) return 'rgba(255, 255, 255, 0.06)';
            const accent = getHarmonyMeta(d.aspect.harmony).accentHex;
            const c = d3.color(accent);
            if (!c) return 'rgba(251, 191, 36, 0.5)';
            c.opacity = orbOpacityScale(d.aspect.orb) * 0.72;
            return c.formatRgb();
          })
          .attr('stroke-width', d.key === selectedCellKey ? 2.2 : d.aspect && d.matchesFilter ? 1.25 : 0.8);

        setHoveredCell(null);
      })
      .on('click', (_event, d) => {
        setSelectedCellKey(d.key);
      });
  }, [cells, rowPlanets, colPlanets, isDualChart, selectedCellKey]);

  const modeLabel =
    mode === 'synastry'
      ? 'Matrice de Synastrie (Partenaire B × Thème A)'
      : mode === 'solarReturn'
        ? 'Matrice Révolution Solaire × Natal'
        : mode === 'lunarReturn'
          ? 'Matrice Révolution Lunaire × Natal'
          : mode === 'planetaryReturn'
            ? 'Matrice Révolution Planétaire × Natal'
            : mode === 'progressions'
              ? 'Matrice Progressions Secondaires × Natal'
              : mode === 'solarArc'
                ? 'Matrice Arc Solaire × Natal'
                : mode === 'relocated'
                  ? 'Matrice Thème Relocalisé'
                  : 'Matrice Aspectaire du Thème Actif';

  const rowAxisTitle = outerChart ? outerChart.cityName || 'Thème Extérieur' : 'Astres';
  const colAxisTitle = baseChart.cityName || 'Base Natale';

  return (
    <section
      aria-label="Matrice d'Aspects Interactive D3.js"
      className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-black/50 space-y-4"
    >
      {/* Matrix Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-amber-300 shrink-0" />
            <h2 className="font-display text-sm sm:text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
              {modeLabel}
            </h2>
            <span className="font-mono-tabular text-[11px] text-amber-200/90">
              {activeCount} aspect{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Visualisation D3.js des intersections planétaires ({isDualChart ? `${rowAxisTitle} × ${colAxisTitle}` : 'grille triangulaire'}). Cliquez sur n’importe quelle case pour inspecter l’aspect ou l’écart angulaire exact.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDualChart && (
            <button
              type="button"
              onClick={() => setIncludeAll21((v) => !v)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                includeAll21
                  ? 'border-purple-300/50 bg-purple-500/20 text-purple-100'
                  : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/35'
              }`}
            >
              {includeAll21 ? '21 Aspects inclus' : 'Aspects majeurs'}
            </button>
          )}

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0b0e19]/85 p-1">
            <Filter className="h-3 w-3 text-slate-400 ml-2 mr-0.5 shrink-0" />
            {(
              [
                ['all', 'Tous'],
                ['fusion', 'Conjonctions'],
                ['harmonious', 'Harmoniques'],
                ['tense', 'Tensions'],
              ] as Array<[MatrixHarmonyFilter, string]>
            ).map(([fKey, fLabel]) => (
              <button
                key={fKey}
                type="button"
                onClick={() => setHarmonyFilter(fKey)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  harmonyFilter === fKey
                    ? 'bg-gradient-to-r from-amber-400/90 to-yellow-400/90 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {fLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Left D3 SVG Matrix (7 cols) · Right Detailed Aspect Inspector (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: D3 Matrix SVG Canvas */}
        <div className="xl:col-span-7 rounded-2xl border border-white/10 bg-[#0b0e19]/85 p-4 flex flex-col justify-between gap-3">
          {/* Live Hover Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] min-h-[22px]">
            {hoveredCell ? (
              <div className="flex flex-wrap items-center gap-2 text-amber-100 font-medium">
                <span style={{ fontFamily: 'var(--font-glyph)' }}>
                  {hoveredCell.rowPlanet.symbol} {hoveredCell.rowPlanet.name}
                </span>
                <span className="text-slate-400">×</span>
                <span style={{ fontFamily: 'var(--font-glyph)' }}>
                  {hoveredCell.colPlanet.symbol} {hoveredCell.colPlanet.name}
                </span>
                <span aria-hidden="true" className="text-white/25">·</span>
                {hoveredCell.aspect ? (
                  <span className="font-mono-tabular text-sky-200">
                    {hoveredCell.aspect.symbol} {hoveredCell.aspect.label} · orbe {formatOrbDegMin(hoveredCell.aspect.orb)}
                  </span>
                ) : (
                  <span className="font-mono-tabular text-slate-400">
                    Écart {hoveredCell.separationDeg.toFixed(1)}° (hors orbe)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">
                Survolez ou cliquez sur une intersection pour isoler l’aspect correspondant.
              </span>
            )}

            {/* Color + Symbol Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-300 font-bold">☌</span> Fusion
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="text-sky-300 font-bold">△⚹</span> Harmonique
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="text-rose-400 font-bold">□☍</span> Tension
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto cosmic-scroll flex justify-center py-1">
            <svg
              ref={svgRef}
              className="w-full max-w-[520px] h-auto select-none"
            />
          </div>
        </div>

        {/* Right: Detailed Clicked Intersection Panel */}
        <div className="xl:col-span-5 rounded-2xl border border-amber-200/25 bg-[#0d111f]/90 p-5 flex flex-col justify-between gap-4">
          {selectedCell ? (
            <>
              <div className="space-y-4">
                {/* Selected Intersection Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  {selectedCell.aspect ? (
                    <>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          getHarmonyMeta(selectedCell.aspect.harmony).badgeClass
                        }`}
                      >
                        <span style={{ fontFamily: 'var(--font-glyph)' }}>
                          {selectedCell.aspect.symbol}
                        </span>
                        <span>{getHarmonyMeta(selectedCell.aspect.harmony).label}</span>
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono-tabular text-[11px] font-medium ${
                          getOrbPrecisionBadge(selectedCell.aspect.orb).className
                        }`}
                      >
                        {getOrbPrecisionBadge(selectedCell.aspect.orb).label}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        <span>Intersection hors orbe</span>
                      </span>
                      <span className="font-mono-tabular text-xs text-slate-400">
                        Écart : {selectedCell.separationDeg.toFixed(2)}°
                      </span>
                    </>
                  )}
                </div>

                {/* Planet Pair Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      {isDualChart ? 'Astre Extérieur (Ligne)' : 'Planète A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl text-sky-200"
                        style={{ fontFamily: 'var(--font-glyph)' }}
                      >
                        {selectedCell.rowPlanet.symbol}
                      </span>
                      <span className="font-display text-sm font-semibold text-amber-100">
                        {selectedCell.rowPlanet.name}
                      </span>
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-300">
                      {selectedCell.rowPlanet.sign.symbol} {selectedCell.rowPlanet.formattedDeg}{' '}
                      {selectedCell.rowPlanet.sign.name} · Maison {selectedCell.rowPlanet.house}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      {isDualChart ? 'Astre Natal (Colonne)' : 'Planète B'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl text-amber-200"
                        style={{ fontFamily: 'var(--font-glyph)' }}
                      >
                        {selectedCell.colPlanet.symbol}
                      </span>
                      <span className="font-display text-sm font-semibold text-amber-100">
                        {selectedCell.colPlanet.name}
                      </span>
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-300">
                      {selectedCell.colPlanet.sign.symbol} {selectedCell.colPlanet.formattedDeg}{' '}
                      {selectedCell.colPlanet.sign.name} · Maison {selectedCell.colPlanet.house}
                    </div>
                  </div>
                </div>

                {/* Aspect Geometry & Detailed Interpretation */}
                {selectedCell.aspect ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2 rounded-2xl border border-amber-300/20 bg-amber-400/[0.05] px-4 py-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-amber-200/80">
                          Aspect Sélectionné
                        </div>
                        <div className="font-display text-base font-semibold text-amber-100">
                          {selectedCell.rowPlanet.name} {selectedCell.aspect.label}{' '}
                          {selectedCell.colPlanet.name}
                        </div>
                      </div>
                      <div className="text-right font-mono-tabular">
                        <div className="text-sm font-bold text-amber-200">
                          {selectedCell.aspect.exactAngle.toFixed(0)}° exact
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Orbe : {formatOrbDegMin(selectedCell.aspect.orb)} (Δ {selectedCell.separationDeg.toFixed(1)}°)
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        <span>Analyse Astrologique Détaillée</span>
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200">
                        {selectedCell.aspect.interpretation}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5 text-[11.5px] text-slate-300 leading-relaxed">
                      <div>
                        <strong className="text-amber-200">{selectedCell.rowPlanet.name} :</strong>{' '}
                        {selectedCell.rowPlanet.role} ({selectedCell.rowPlanet.sign.name}, Maison {selectedCell.rowPlanet.house}).
                      </div>
                      <div>
                        <strong className="text-sky-200">{selectedCell.colPlanet.name} :</strong>{' '}
                        {selectedCell.colPlanet.role} ({selectedCell.colPlanet.sign.name}, Maison {selectedCell.colPlanet.house}).
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-2">
                      <div className="font-display text-sm font-semibold text-slate-200">
                        Aucun aspect dans les orbes actifs
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        La séparation écliptique actuelle entre{' '}
                        <strong className="text-amber-200">{selectedCell.rowPlanet.name}</strong> et{' '}
                        <strong className="text-sky-200">{selectedCell.colPlanet.name}</strong> est de{' '}
                        <strong className="font-mono-tabular text-white">
                          {selectedCell.separationDeg.toFixed(2)}°
                        </strong>
                        . Ces deux fonctions planétaires dialoguent de manière autonome sans contrainte angulaire directe selon les orbes sélectionnés.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {onOpenWheel && (
                <div className="pt-3 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={onOpenWheel}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer"
                  >
                    <Orbit className="h-3.5 w-3.5 text-amber-300" />
                    <span>Visualiser sur la Roue SVG</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Sélectionnez une intersection dans la matrice pour afficher son analyse.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
