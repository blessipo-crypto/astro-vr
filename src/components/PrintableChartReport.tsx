import React from 'react';
import {
  AstroChart,
  ChartMode,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  NatalProfile,
  SolarReturnAnalysis,
  ZODIAC_SIGNS,
} from '../astro/astroEngine';
import {
  calculateBaziSummary,
  CHINESE_SIGNS_BY_BRANCH,
  transposeLongitudeToChinese,
  ZodiacTradition,
} from '../astro/chineseAstrology';
import { generateChartInterpretation } from '../astro/interpretations';
import {
  buildSignAffinityProfile,
  buildWesternOppositesTable,
} from '../astro/oppositesTable';
import {
  CALLIGRAPHIC_SIGN_PATHS,
  FIGURATIVE_SIGN_PATHS,
  ZodiacSignStyle,
} from '../astro/zodiacSignArt';
import type { ZodiacWheelStyle } from '../vr/textures';

export interface PrintableChartReportProps {
  mode: ChartMode;
  modeLabel: string;
  tradition: ZodiacTradition;
  wheelStyle?: ZodiacWheelStyle;
  signStyle?: ZodiacSignStyle;
  profile: NatalProfile;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  solarReturnAnalysis: SolarReturnAnalysis | null;
  solarReturnExactDate: Date | null;
  comparativeAnalysis: ComparativeAnalysis | null;
  snapshotDataUrl: string | null;
  shareUrl: string;
}

function lonToSvgAngleRad(lon: number, ascendant: number): number {
  // Place Ascendant at 9 o'clock (180 deg) and progress counter-clockwise (astrological wheel)
  const deg = 180 - (lon - ascendant);
  return (deg * Math.PI) / 180;
}

function polarPoint(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + Math.cos(angleRad) * r,
    y: cy + Math.sin(angleRad) * r,
  };
}

const ChartWheelSvg: React.FC<{
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  tradition: ZodiacTradition;
  wheelStyle: ZodiacWheelStyle;
  signStyle: ZodiacSignStyle;
}> = ({ baseChart, outerChart, comparisonAspects, tradition, wheelStyle, signStyle }) => {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 172;
  const rTickRing = 148;
  const rZodiacInner = 140;
  const rOuterPlanets = 126;
  const rBasePlanets = outerChart ? 100 : 112;
  const rAspect = outerChart ? 80 : 88;

  const asc = baseChart.ascendant;
  const isCelestial = wheelStyle === 'celestial';
  const isEnamel = wheelStyle === 'enamel';
  const isHorology = wheelStyle === 'horology';

  const outerFill = isCelestial ? '#09152c' : isHorology ? '#fafaf9' : '#fcfaf5';
  const innerFill = isCelestial ? '#0f1e3d' : '#ffffff';
  const coreFill = isCelestial ? '#0b1730' : '#f8fafc';
  const rimStroke = isCelestial ? '#38bdf8' : isHorology ? '#27272a' : '#92400e';
  const labelFill = isCelestial ? '#f8fafc' : '#0f172a';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[330px] h-auto mx-auto block"
      role="img"
      aria-label="Carte du ciel vectorielle"
    >
      <circle cx={cx} cy={cy} r={rOuter} fill={outerFill} stroke={rimStroke} strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={rOuter - 3} fill="none" stroke={rimStroke} strokeWidth={0.5} strokeOpacity={0.55} />
      <circle cx={cx} cy={cy} r={rTickRing} fill="none" stroke={rimStroke} strokeWidth={0.5} strokeOpacity={0.45} />
      <circle cx={cx} cy={cy} r={rZodiacInner} fill={innerFill} stroke={rimStroke} strokeWidth={1.1} />
      <circle cx={cx} cy={cy} r={rAspect} fill={coreFill} stroke={isCelestial ? '#38bdf8' : '#94a3b8'} strokeWidth={0.8} strokeOpacity={0.65} />

      {/* 12 Zodiac segments + optional enamel tint + 1°/5°/10° ticks */}
      {ZODIAC_SIGNS.map((sign, idx) => {
        const startLon = idx * 30;
        const endLon = startLon + 30;
        const midLon = startLon + 15;
        const aStart = lonToSvgAngleRad(startLon, asc);
        const aEnd = lonToSvgAngleRad(endLon, asc);
        const aMid = lonToSvgAngleRad(midLon, asc);
        const p1 = polarPoint(cx, cy, rZodiacInner, aStart);
        const p2 = polarPoint(cx, cy, rOuter, aStart);
        const pOutStart = polarPoint(cx, cy, rOuter, aStart);
        const pOutEnd = polarPoint(cx, cy, rOuter, aEnd);
        const pInStart = polarPoint(cx, cy, rZodiacInner, aStart);
        const pInEnd = polarPoint(cx, cy, rZodiacInner, aEnd);
        const pLabel = polarPoint(cx, cy, (rOuter + rTickRing) / 2, aMid);
        const chSign = CHINESE_SIGNS_BY_BRANCH[(idx + 3) % 12];
        const sectorTint = isEnamel ? sign.color : isCelestial ? '#38bdf8' : sign.color;
        const sectorOpacity = isEnamel ? 0.18 : isCelestial ? 0.08 : isHorology ? 0.03 : 0.07;
        const sectorPath = `M ${pOutStart.x} ${pOutStart.y} A ${rOuter} ${rOuter} 0 0 0 ${pOutEnd.x} ${pOutEnd.y} L ${pInEnd.x} ${pInEnd.y} A ${rZodiacInner} ${rZodiacInner} 0 0 1 ${pInStart.x} ${pInStart.y} Z`;

        return (
          <g key={sign.index}>
            <path d={sectorPath} fill={sectorTint} fillOpacity={sectorOpacity} />
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isCelestial ? '#38bdf8' : '#b45309'}
              strokeWidth={1}
              strokeOpacity={0.75}
            />
            {Array.from({ length: 30 }, (_, d) => {
              if (d === 0) return null;
              const ad = lonToSvgAngleRad(startLon + d, asc);
              const isTen = d === 10 || d === 20;
              const isFive = d % 5 === 0;
              const rTickTop = isTen ? rTickRing : isFive ? rZodiacInner + 5.5 : rZodiacInner + 3;
              const tA = polarPoint(cx, cy, rZodiacInner, ad);
              const tB = polarPoint(cx, cy, rTickTop, ad);
              return (
                <line
                  key={d}
                  x1={tA.x}
                  y1={tA.y}
                  x2={tB.x}
                  y2={tB.y}
                  stroke={isCelestial ? '#7dd3fc' : '#64748b'}
                  strokeWidth={isTen ? 0.85 : isFive ? 0.65 : 0.4}
                  strokeOpacity={isTen ? 0.85 : isFive ? 0.65 : 0.42}
                />
              );
            })}
            {tradition === 'chinese' ? (
              <text
                x={pLabel.x}
                y={pLabel.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight="600"
                fill={labelFill}
              >
                {chSign.hanzi}
              </text>
            ) : (
              (() => {
                const spec =
                  signStyle === 'figurative'
                    ? FIGURATIVE_SIGN_PATHS[sign.index]
                    : CALLIGRAPHIC_SIGN_PATHS[sign.index];
                return (
                  <g
                    transform={`translate(${pLabel.x}, ${pLabel.y}) scale(0.11)`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {spec.strokes.map((d, si) => (
                      <path key={si} d={d} stroke={labelFill} strokeWidth={11} />
                    ))}
                    {spec.circles?.map((c, ci) => (
                      <circle
                        key={ci}
                        cx={c.cx}
                        cy={c.cy}
                        r={c.r}
                        fill={c.fill ? labelFill : 'none'}
                        stroke={c.fill ? 'none' : labelFill}
                        strokeWidth={c.fill ? 0 : 11}
                      />
                    ))}
                  </g>
                );
              })()
            )}
          </g>
        );
      })}

      {/* 12 House cusps */}
      {baseChart.houses.map((house) => {
        const isAngular = house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10;
        const a = lonToSvgAngleRad(house.longitude, asc);
        const pIn = polarPoint(cx, cy, rAspect, a);
        const pOut = polarPoint(cx, cy, rZodiacInner, a);
        const nextHouse = baseChart.houses[house.house % 12];
        let diff = (nextHouse.longitude - house.longitude + 360) % 360;
        if (diff === 0) diff = 30;
        const aMid = lonToSvgAngleRad(house.longitude + diff / 2, asc);
        const pNum = polarPoint(cx, cy, rAspect - 11, aMid);

        return (
          <g key={house.house}>
            <line
              x1={pIn.x}
              y1={pIn.y}
              x2={pOut.x}
              y2={pOut.y}
              stroke={isAngular ? '#b45309' : '#94a3b8'}
              strokeWidth={isAngular ? 1.5 : 0.7}
              strokeDasharray={isAngular ? undefined : '2,2'}
            />
            <text
              x={pNum.x}
              y={pNum.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={8}
              fill="#475569"
              fontWeight="600"
            >
              {house.roman}
            </text>
          </g>
        );
      })}

      {/* Aspect lines inside inner circle */}
      {outerChart
        ? comparisonAspects.slice(0, 28).map((asp) => {
            const pA = baseChart.planets.find((p) => p.id === asp.natalPlanet);
            const pB = outerChart.planets.find((p) => p.id === asp.outerPlanet);
            if (!pA || !pB) return null;
            const ptA = polarPoint(cx, cy, rAspect, lonToSvgAngleRad(pA.longitude, asc));
            const ptB = polarPoint(cx, cy, rAspect, lonToSvgAngleRad(pB.longitude, asc));
            return (
              <line
                key={asp.id}
                x1={ptA.x}
                y1={ptA.y}
                x2={ptB.x}
                y2={ptB.y}
                stroke={asp.cssColor}
                strokeWidth={asp.harmony === 'harmonious' ? 0.9 : 1.1}
                strokeOpacity={0.65}
              />
            );
          })
        : baseChart.aspects.slice(0, 28).map((asp) => {
            const pA = baseChart.planets.find((p) => p.id === asp.planetA);
            const pB = baseChart.planets.find((p) => p.id === asp.planetB);
            if (!pA || !pB) return null;
            const ptA = polarPoint(cx, cy, rAspect, lonToSvgAngleRad(pA.longitude, asc));
            const ptB = polarPoint(cx, cy, rAspect, lonToSvgAngleRad(pB.longitude, asc));
            return (
              <line
                key={asp.id}
                x1={ptA.x}
                y1={ptA.y}
                x2={ptB.x}
                y2={ptB.y}
                stroke={asp.cssColor}
                strokeWidth={1}
                strokeOpacity={0.65}
              />
            );
          })}

      {/* Base Planets */}
      {baseChart.planets.map((p) => {
        const a = lonToSvgAngleRad(p.longitude, asc);
        const pt = polarPoint(cx, cy, rBasePlanets, a);
        const tickA = polarPoint(cx, cy, rZodiacInner - 4, a);
        const tickB = polarPoint(cx, cy, rZodiacInner, a);
        return (
          <g key={`base-${p.id}`}>
            <line x1={tickA.x} y1={tickA.y} x2={tickB.x} y2={tickB.y} stroke="#b45309" strokeWidth={1.1} />
            <circle cx={pt.x} cy={pt.y} r={8.5} fill="#fef3c7" stroke="#b45309" strokeWidth={1} />
            <text
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fontWeight="700"
              fill="#78350f"
            >
              {p.symbol}
            </text>
          </g>
        );
      })}

      {/* Outer Planets if comparative / RS / Transit */}
      {outerChart &&
        outerChart.planets.map((p) => {
          const a = lonToSvgAngleRad(p.longitude, asc);
          const pt = polarPoint(cx, cy, rOuterPlanets, a);
          return (
            <g key={`outer-${p.id}`}>
              <circle cx={pt.x} cy={pt.y} r={8} fill="#e0f2fe" stroke="#0284c7" strokeWidth={1} />
              <text
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9.5}
                fontWeight="700"
                fill="#075985"
              >
                {p.symbol}
              </text>
            </g>
          );
        })}

      {/* ASC / MC tags */}
      <text x={8} y={cy} fontSize={9} fontWeight="700" fill="#b45309" dominantBaseline="central">
        ASC
      </text>
      <text x={size - 26} y={cy} fontSize={9} fontWeight="700" fill="#64748b" dominantBaseline="central">
        DSC
      </text>
    </svg>
  );
};

export const PrintableChartReport: React.FC<PrintableChartReportProps> = ({
  mode,
  modeLabel,
  tradition,
  wheelStyle = 'astrolabe',
  signStyle = 'figurative',
  profile,
  baseChart,
  outerChart,
  comparisonAspects,
  solarReturnAnalysis,
  solarReturnExactDate,
  comparativeAnalysis,
  snapshotDataUrl,
  shareUrl,
}) => {
  const interpretation = generateChartInterpretation({
    mode,
    tradition,
    baseChart,
    outerChart,
    comparisonAspects,
    solarReturnAnalysis,
    comparativeAnalysis,
  });
  const bazi = calculateBaziSummary(baseChart);
  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const sunAffinity = sun ? buildSignAffinityProfile(sun.sign, 'Soleil') : null;
  const ascAffinity = buildSignAffinityProfile(baseChart.ascSign, 'Ascendant');
  const westernOpposites = buildWesternOppositesTable(baseChart, outerChart);

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

  return (
    <div className="bg-white text-slate-900 font-sans text-xs leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-amber-700 pb-3 mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-800 font-semibold">
            Uranie VR · Dossier Astrologique Imprimable
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-950 mt-0.5">
            {profile.name} — {modeLabel}
          </h1>
          <div className="text-xs text-slate-600 mt-1">
            Base : {fmtDate(baseChart.date)} · {baseChart.cityName} ({baseChart.latitude.toFixed(2)}°,{' '}
            {baseChart.longitude.toFixed(2)}°) · Maisons {baseChart.houseSystem}
          </div>
          {outerChart && (
            <div className="text-xs text-sky-900 font-medium mt-0.5">
              Roue externe : {fmtDate(outerChart.date)} · {outerChart.cityName}
              {solarReturnExactDate && mode === 'solarReturn' ? ' (Retour Solaire exact)' : ''}
            </div>
          )}
        </div>
        <div className="text-right text-[11px] text-slate-700 shrink-0">
          <div>
            <strong>ASC</strong> : {baseChart.ascSign.symbol} {baseChart.ascSign.name}
          </div>
          <div>
            <strong>MC</strong> : {baseChart.mcSign.symbol} {baseChart.mcSign.name}
          </div>
          <div>
            <strong>Pilier BaZi</strong> : {bazi.yearPillar.label}
          </div>
        </div>
      </div>

      {/* Visual Chart Section: Vector Wheel + Optional 3D Snapshot */}
      <div className="print-break-inside-avoid grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-5 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <div>
          <ChartWheelSvg
            baseChart={baseChart}
            outerChart={outerChart}
            comparisonAspects={comparisonAspects}
            tradition={tradition}
            wheelStyle={wheelStyle}
            signStyle={signStyle}
          />
          <div className="text-center text-[10px] text-slate-500 mt-1">
            Carte vectorielle ({tradition === 'chinese' ? 'Rameaux Chinois' : 'Zodiaque Tropical'}) · Or : Base · Bleu : Externe
          </div>
        </div>
        {snapshotDataUrl ? (
          <div className="text-center">
            <img
              src={snapshotDataUrl}
              alt="Capture 3D Uranie VR"
              className="w-full max-h-[260px] object-contain rounded border border-slate-300 bg-[#05070e]"
            />
            <div className="text-[10px] text-slate-500 mt-1">Projection 3D Uranie VR</div>
          </div>
        ) : (
          <div className="space-y-2 text-xs p-2">
            <div className="font-semibold text-amber-900 text-sm">{interpretation.headline}</div>
            <p className="text-slate-700 leading-relaxed">{interpretation.synthesis}</p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="border border-slate-200 rounded p-2 bg-white">
                <div className="font-semibold text-slate-800">Éléments (Occidental)</div>
                <div>
                  Feu {baseChart.elements.Feu} · Terre {baseChart.elements.Terre} · Air {baseChart.elements.Air} · Eau{' '}
                  {baseChart.elements.Eau}
                </div>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <div className="font-semibold text-slate-800">Wu Xing (Chinois)</div>
                <div>
                  Bois {bazi.wuXingBalance.Bois} · Feu {bazi.wuXingBalance.Feu} · Terre {bazi.wuXingBalance.Terre} · Métal{' '}
                  {bazi.wuXingBalance.Métal} · Eau {bazi.wuXingBalance.Eau}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Positions & Comparative Table */}
      <div className="print-break-inside-avoid mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900 border-b border-slate-300 pb-1 mb-2">
          {comparativeAnalysis ? 'Tableau comparatif & Transposition Chinoise' : 'Positions planétaires & Transposition Chinoise'}
        </h2>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700 border-b border-slate-300">
              <th className="py-1.5 px-2">Astre</th>
              <th className="py-1.5 px-2">Position Base</th>
              {comparativeAnalysis && <th className="py-1.5 px-2">Roue Externe</th>}
              <th className="py-1.5 px-2">Maison</th>
              <th className="py-1.5 px-2">Signe Chinois</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {baseChart.planets.map((p) => {
              const ch = transposeLongitudeToChinese(p.longitude);
              const compRow = comparativeAnalysis?.rows.find((r) => r.planetId === p.id);
              return (
                <tr key={p.id}>
                  <td className="py-1 px-2 font-semibold">
                    {p.symbol} {p.name}
                    {p.retrograde ? ' ℞' : ''}
                  </td>
                  <td className="py-1 px-2 font-mono">
                    {p.formattedDeg} {p.sign.symbol} {p.sign.name}
                  </td>
                  {comparativeAnalysis && (
                    <td className="py-1 px-2 font-mono text-sky-900">{compRow?.outerPos ?? '—'}</td>
                  )}
                  <td className="py-1 px-2">
                    M.{baseChart.houses[p.house - 1].roman}
                    {compRow ? ` (Ext→M.${compRow.outerInBaseHouseRoman})` : ''}
                  </td>
                  <td className="py-1 px-2">
                    {ch.sign.branchHanzi}
                    {ch.sign.hanzi} {ch.sign.name} ({ch.sign.wuXing})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interpretations */}
      <div className="mb-5 space-y-2.5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900 border-b border-slate-300 pb-1">
          Interprétation : {interpretation.headline}
        </h2>
        {snapshotDataUrl && (
          <p className="text-slate-800 bg-amber-50/70 border border-amber-200 rounded p-2.5">
            {interpretation.synthesis}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {interpretation.sections.map((sec) => (
            <div key={sec.title} className="print-break-inside-avoid border border-slate-200 rounded p-2.5">
              <h3 className="font-bold text-slate-900 mb-1">{sec.title}</h3>
              <p className="text-slate-700 text-[11px] leading-relaxed">{sec.body}</p>
              {sec.highlights && sec.highlights.length > 0 && (
                <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-slate-700 list-disc pl-3.5">
                  {sec.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opposites, Complements & Affinities */}
      <div className="print-break-inside-avoid mb-4 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900 border-b border-slate-300 pb-1">
          Tableau des Signes Complémentaires, Opposés & Affinités
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {[sunAffinity, ascAffinity]
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
            .map((prof) => (
              <div key={prof.sourceLabel} className="border border-slate-200 rounded p-2 bg-slate-50">
                <div className="font-bold text-slate-900">
                  {prof.sourceLabel} : {prof.sourceSign.symbol} {prof.sourceSign.name}
                </div>
                <div>
                  <strong>Trigones (120°)</strong> : {prof.trineAllies.map((s) => s.name).join(', ')} ·{' '}
                  <strong>Sextiles (60°)</strong> : {prof.sextileAllies.map((s) => s.name).join(', ')}
                </div>
                <div>
                  <strong>Opposé / Complémentaire (180°)</strong> : {prof.oppositeComplement.symbol}{' '}
                  {prof.oppositeComplement.name}
                </div>
              </div>
            ))}
        </div>

        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="bg-slate-100 text-left border-b border-slate-300">
              <th className="py-1 px-2">Axe Opposé (180°)</th>
              <th className="py-1 px-2">Thème & Polarité</th>
              <th className="py-1 px-2">Complémentarité</th>
              <th className="py-1 px-2">Astres du thème</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {westernOpposites.map((ax) => (
              <tr key={ax.axisNumber} className={ax.isAscDscAxis ? 'bg-amber-50/70' : undefined}>
                <td className="py-1 px-2 font-semibold whitespace-nowrap">
                  {ax.signA.symbol} {ax.signA.name} ↔ {ax.signB.symbol} {ax.signB.name}
                </td>
                <td className="py-1 px-2">{ax.axisTheme}</td>
                <td className="py-1 px-2 text-slate-700">{ax.complementarity}</td>
                <td className="py-1 px-2 font-mono">
                  {[...ax.activePlanetsA, ...ax.activePlanetsB].join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shareable Link Footer */}
      <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500 break-all">
        <strong>Lien direct du thème Uranie VR :</strong> {shareUrl}
      </div>
    </div>
  );
};
