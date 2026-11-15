import React, { useMemo, useState } from 'react';
import { Box, Compass, RotateCcw } from 'lucide-react';
import {
  AspectInfo,
  AstroChart,
  ComparisonAspectInfo,
  ElementType,
  HouseCusp,
  PlanetId,
  PlanetPosition,
  ZODIAC_SIGNS,
} from '../astro/astroEngine';
import {
  CHINESE_SIGNS_BY_BRANCH,
  transposeLongitudeToChinese,
  ZodiacTradition,
} from '../astro/chineseAstrology';
import {
  CALLIGRAPHIC_SIGN_PATHS,
  FIGURATIVE_SIGN_PATHS,
  ZODIAC_SIGN_STYLES,
  ZodiacSignStyle,
} from '../astro/zodiacSignArt';
import type { AspectFilter } from '../vr/AstrologyScene';
import type { ZodiacWheelStyle } from '../vr/textures';

export type Wheel2DStyle =
  | ZodiacWheelStyle
  | 'parchment'
  | 'paper'
  | 'compass'
  | 'harmonic';

export type Wheel2DOrientation = 'ascendant' | 'aries0' | 'mcTop';

export interface Wheel2DStyleMeta {
  id: Wheel2DStyle;
  label: string;
  shortLabel: string;
  description: string;
  swatchPrimary: string;
  swatchAccent: string;
}

export const WHEEL_2D_STYLES: Wheel2DStyleMeta[] = [
  {
    id: 'astrolabe',
    label: 'Astrolabe Royal',
    shortLabel: 'Astrolabe',
    description: 'Obsidienne & laiton doré, vernier 1° & cadrans sombres',
    swatchPrimary: '#0b1224',
    swatchAccent: '#d4af37',
  },
  {
    id: 'parchment',
    label: 'Atlas Parchemin',
    shortLabel: 'Parchemin',
    description: 'Papier ivoire chaleureux, encres sépia & pourpre classique',
    swatchPrimary: '#f6eedc',
    swatchAccent: '#8b4513',
  },
  {
    id: 'paper',
    label: 'Épure Blanche',
    shortLabel: 'Atelier Blanc',
    description: 'Cadran blanc haute lisibilité pour étude intensive sur écran PC',
    swatchPrimary: '#ffffff',
    swatchAccent: '#1e293b',
  },
  {
    id: 'celestial',
    label: 'Voûte Stellaire',
    shortLabel: 'Stellaire',
    description: 'Bleu nuit profond, grille astronomique cyan & repères stellaires',
    swatchPrimary: '#061228',
    swatchAccent: '#38bdf8',
  },
  {
    id: 'enamel',
    label: 'Émail Vitrail',
    shortLabel: 'Vitrail',
    description: 'Secteurs colorés par élément (Feu, Terre, Air, Eau) & or',
    swatchPrimary: '#1a112b',
    swatchAccent: '#fbbf24',
  },
  {
    id: 'horology',
    label: 'Haute Horlogerie',
    shortLabel: 'Horlogerie',
    description: 'Cadran anthracite soleillé, index bâtons argent & champagne',
    swatchPrimary: '#171920',
    swatchAccent: '#e7cfa0',
  },
  {
    id: 'compass',
    label: 'Cosmogramme 360°',
    shortLabel: 'Cosmogramme',
    description: 'Rose de cosmobiologie graduée 0°–360° absolus & axes fins',
    swatchPrimary: '#0e1726',
    swatchAccent: '#2dd4bf',
  },
  {
    id: 'harmonic',
    label: 'Roue des Décans',
    shortLabel: 'Décans I·II·III',
    description: 'Couronne double avec subdivisions des 36 décans & éléments',
    swatchPrimary: '#14192b',
    swatchAccent: '#f472b6',
  },
];

interface Palette2D {
  isLight: boolean;
  outerBg: string;
  bandBg: string;
  innerBg: string;
  aspectBg: string;
  rimStroke: string;
  subRimStroke: string;
  tickStroke: string;
  glyphStroke: string;
  textPrimary: string;
  textMuted: string;
  houseLine: string;
  angularLine: string;
  sectorTintOpacity: number;
  basePlanetStroke: string;
  outerPlanetStroke: string;
}

function getWheel2DPalette(style: Wheel2DStyle): Palette2D {
  switch (style) {
    case 'parchment':
      return {
        isLight: true,
        outerBg: '#efe4cc',
        bandBg: '#f8f1e1',
        innerBg: '#fcf8ef',
        aspectBg: '#f9f4e8',
        rimStroke: '#7c4a1d',
        subRimStroke: '#a16207',
        tickStroke: '#785a3a',
        glyphStroke: '#5b3412',
        textPrimary: '#291d12',
        textMuted: '#6b533b',
        houseLine: '#a38d72',
        angularLine: '#991b1b',
        sectorTintOpacity: 0.14,
        basePlanetStroke: '#7c2d12',
        outerPlanetStroke: '#0369a1',
      };
    case 'paper':
      return {
        isLight: true,
        outerBg: '#f8fafc',
        bandBg: '#ffffff',
        innerBg: '#ffffff',
        aspectBg: '#f8fafc',
        rimStroke: '#1e293b',
        subRimStroke: '#64748b',
        tickStroke: '#475569',
        glyphStroke: '#0f172a',
        textPrimary: '#0f172a',
        textMuted: '#475569',
        houseLine: '#94a3b8',
        angularLine: '#b45309',
        sectorTintOpacity: 0.09,
        basePlanetStroke: '#1e293b',
        outerPlanetStroke: '#0284c7',
      };
    case 'celestial':
      return {
        isLight: false,
        outerBg: '#061228',
        bandBg: '#0a1c3f',
        innerBg: '#071530',
        aspectBg: '#040d21',
        rimStroke: '#38bdf8',
        subRimStroke: '#0284c7',
        tickStroke: '#7dd3fc',
        glyphStroke: '#e0f2fe',
        textPrimary: '#f0f9ff',
        textMuted: '#93c5fd',
        houseLine: '#1e40af',
        angularLine: '#38bdf8',
        sectorTintOpacity: 0.12,
        basePlanetStroke: '#fbbf24',
        outerPlanetStroke: '#38bdf8',
      };
    case 'enamel':
      return {
        isLight: false,
        outerBg: '#120c21',
        bandBg: '#1b1332',
        innerBg: '#0f0b1d',
        aspectBg: '#0a0715',
        rimStroke: '#d4af37',
        subRimStroke: '#a855f7',
        tickStroke: '#e7cfa0',
        glyphStroke: '#fef3c7',
        textPrimary: '#fffbeb',
        textMuted: '#cbd5e1',
        houseLine: '#4c1d95',
        angularLine: '#fbbf24',
        sectorTintOpacity: 0.25,
        basePlanetStroke: '#fbbf24',
        outerPlanetStroke: '#38bdf8',
      };
    case 'horology':
      return {
        isLight: false,
        outerBg: '#14161d',
        bandBg: '#1c1f29',
        innerBg: '#111319',
        aspectBg: '#0c0d12',
        rimStroke: '#e7cfa0',
        subRimStroke: '#71717a',
        tickStroke: '#d4d4d8',
        glyphStroke: '#f4f4f5',
        textPrimary: '#fafafa',
        textMuted: '#a1a1aa',
        houseLine: '#3f3f46',
        angularLine: '#e7cfa0',
        sectorTintOpacity: 0.04,
        basePlanetStroke: '#e7cfa0',
        outerPlanetStroke: '#7dd3fc',
      };
    case 'compass':
      return {
        isLight: false,
        outerBg: '#0a141f',
        bandBg: '#102030',
        innerBg: '#091522',
        aspectBg: '#060f19',
        rimStroke: '#2dd4bf',
        subRimStroke: '#0f766e',
        tickStroke: '#99f6e4',
        glyphStroke: '#ccfbf1',
        textPrimary: '#f0fdfa',
        textMuted: '#5eead4',
        houseLine: '#155e75',
        angularLine: '#fbbf24',
        sectorTintOpacity: 0.08,
        basePlanetStroke: '#fbbf24',
        outerPlanetStroke: '#2dd4bf',
      };
    case 'harmonic':
      return {
        isLight: false,
        outerBg: '#111526',
        bandBg: '#181e36',
        innerBg: '#0d1120',
        aspectBg: '#080b16',
        rimStroke: '#f472b6',
        subRimStroke: '#d4af37',
        tickStroke: '#fbcfe8',
        glyphStroke: '#fdf2f8',
        textPrimary: '#fdf4ff',
        textMuted: '#cbd5e1',
        houseLine: '#334155',
        angularLine: '#f472b6',
        sectorTintOpacity: 0.16,
        basePlanetStroke: '#fbbf24',
        outerPlanetStroke: '#38bdf8',
      };
    case 'astrolabe':
    default:
      return {
        isLight: false,
        outerBg: '#090f20',
        bandBg: '#101a35',
        innerBg: '#080d1d',
        aspectBg: '#050914',
        rimStroke: '#d4af37',
        subRimStroke: '#94a3b8',
        tickStroke: '#cbd5e1',
        glyphStroke: '#fef3c7',
        textPrimary: '#f8f3e6',
        textMuted: '#94a3b8',
        houseLine: '#334155',
        angularLine: '#fbbf24',
        sectorTintOpacity: 0.11,
        basePlanetStroke: '#fbbf24',
        outerPlanetStroke: '#38bdf8',
      };
  }
}

function getElementColor(el: ElementType, isLight: boolean): string {
  if (el === 'Feu') return isLight ? '#ea580c' : '#fb923c';
  if (el === 'Terre') return isLight ? '#15803d' : '#34d399';
  if (el === 'Air') return isLight ? '#0284c7' : '#38bdf8';
  return isLight ? '#4f46e5' : '#818cf8';
}

function angleForLongitude(
  lon: number,
  chart: AstroChart,
  orientation: Wheel2DOrientation
): number {
  let deg: number;
  if (orientation === 'aries0') {
    deg = 180 - lon;
  } else if (orientation === 'mcTop') {
    deg = 270 - (lon - chart.midheaven);
  } else {
    // Classic: Ascendant fixed at 9 o'clock (180 deg)
    deg = 180 - (lon - chart.ascendant);
  }
  return (deg * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, rad: number) {
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
}

function declusterPlanets(
  planets: PlanetPosition[],
  chart: AstroChart,
  orientation: Wheel2DOrientation,
  minSepRad = 0.145
): Array<{
  planet: PlanetPosition;
  exactRad: number;
  displayRad: number;
  tier: number;
}> {
  const items = planets.map((p) => {
    const exactRad = angleForLongitude(p.longitude, chart, orientation);
    return { planet: p, exactRad, displayRad: exactRad, tier: 0 };
  });

  // Sort along longitude ascending to spread tight conjunction clusters smoothly
  const sorted = [...items].sort((a, b) => a.planet.longitude - b.planet.longitude);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const next = sorted[(i + 1) % sorted.length];
      let diff = next.displayRad - cur.displayRad;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < minSepRad) {
        const push = (minSepRad - Math.abs(diff)) * 0.48;
        const sign = diff === 0 ? 1 : Math.sign(diff);
        cur.displayRad -= sign * push;
        next.displayRad += sign * push;
      }
    }
  }

  // Alternate subtle radial tier when pairs remain close
  for (let i = 1; i < sorted.length; i++) {
    let diff = sorted[i].displayRad - sorted[i - 1].displayRad;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < minSepRad * 1.15 && sorted[i - 1].tier === 0) {
      sorted[i].tier = 1;
    }
  }

  return items;
}

export interface Chart2DCanvasProps {
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  tradition: ZodiacTradition;
  wheel2DStyle: Wheel2DStyle;
  onWheel2DStyleChange: (style: Wheel2DStyle) => void;
  wheel2DOrientation: Wheel2DOrientation;
  onWheel2DOrientationChange: (o: Wheel2DOrientation) => void;
  signStyle: ZodiacSignStyle;
  onSignStyleChange: (s: ZodiacSignStyle) => void;
  aspectFilter: AspectFilter;
  showHouses: boolean;
  selectedPlanetId: PlanetId | null;
  selectedPlanetLayer: 'base' | 'outer';
  selectedHouseNum: number | null;
  highlightedAspectId: string | null;
  onSelectPlanet: (id: PlanetId, layer: 'base' | 'outer') => void;
  onSelectHouse: (houseNum: number) => void;
  onHighlightAspect: (aspectId: string | null) => void;
  onSwitchTo3D: () => void;
  inspectorOpen: boolean;
  dockCollapsed: boolean;
}

export const Chart2DCanvas: React.FC<Chart2DCanvasProps> = ({
  baseChart,
  outerChart,
  comparisonAspects,
  tradition,
  wheel2DStyle,
  onWheel2DStyleChange,
  wheel2DOrientation,
  onWheel2DOrientationChange,
  signStyle,
  onSignStyleChange,
  aspectFilter,
  showHouses,
  selectedPlanetId,
  selectedPlanetLayer,
  selectedHouseNum,
  highlightedAspectId,
  onSelectPlanet,
  onSelectHouse,
  onHighlightAspect,
  onSwitchTo3D,
  inspectorOpen,
  dockCollapsed,
}) => {
  const [showDecans, setShowDecans] = useState<boolean>(wheel2DStyle === 'harmonic');
  const [showDegreesOnWheel, setShowDegreesOnWheel] = useState<boolean>(true);
  const [hoveredPlanetKey, setHoveredPlanetKey] = useState<string | null>(null);

  const palette = useMemo(() => getWheel2DPalette(wheel2DStyle), [wheel2DStyle]);
  const showDecanRing = showDecans || wheel2DStyle === 'harmonic';
  const isCompass = wheel2DStyle === 'compass';

  const size = 760;
  const cx = size / 2;
  const cy = size / 2;

  const rOuter = 354;
  const rDecanOuter = showDecanRing ? 326 : 354;
  const rTickRing = showDecanRing ? 286 : 300;
  const rZodiacInner = 272;
  const rOuterPlanets = 236;
  const rBasePlanets = outerChart ? 184 : 210;
  const rAspect = outerChart ? 142 : 158;

  const basePlanetPlacements = useMemo(
    () => declusterPlanets(baseChart.planets, baseChart, wheel2DOrientation),
    [baseChart, wheel2DOrientation]
  );

  const outerPlanetPlacements = useMemo(
    () =>
      outerChart
        ? declusterPlanets(outerChart.planets, baseChart, wheel2DOrientation, 0.13)
        : [],
    [outerChart, baseChart, wheel2DOrientation]
  );

  const visibleInternalAspects: AspectInfo[] = useMemo(() => {
    if (aspectFilter === 'none' || aspectFilter === 'comparison') return [];
    return baseChart.aspects.filter((asp) => {
      if (aspectFilter === 'harmonious') return asp.harmony === 'harmonious' || asp.harmony === 'fusion';
      if (aspectFilter === 'tense') return asp.harmony === 'tense';
      return true;
    });
  }, [baseChart.aspects, aspectFilter]);

  const visibleCompAspects: ComparisonAspectInfo[] = useMemo(() => {
    if (!outerChart || aspectFilter === 'none' || aspectFilter === 'natal') return [];
    return comparisonAspects.filter((asp) => {
      if (aspectFilter === 'harmonious') return asp.harmony === 'harmonious' || asp.harmony === 'fusion';
      if (aspectFilter === 'tense') return asp.harmony === 'tense';
      return true;
    });
  }, [outerChart, comparisonAspects, aspectFilter]);

  const ascRad = angleForLongitude(baseChart.ascendant, baseChart, wheel2DOrientation);
  const dscRad = angleForLongitude((baseChart.ascendant + 180) % 360, baseChart, wheel2DOrientation);
  const mcRad = angleForLongitude(baseChart.midheaven, baseChart, wheel2DOrientation);
  const icRad = angleForLongitude((baseChart.midheaven + 180) % 360, baseChart, wheel2DOrientation);

  const outerAscRad = outerChart
    ? angleForLongitude(outerChart.ascendant, baseChart, wheel2DOrientation)
    : null;

  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const moon = baseChart.planets.find((p) => p.id === 'moon');

  return (
    <div
      className={`no-print fixed inset-0 z-10 flex flex-col pt-16 transition-all duration-200 ${
        dockCollapsed ? 'pb-14' : 'pb-48'
      } ${inspectorOpen ? 'lg:pr-[465px]' : ''}`}
      style={{
        background:
          palette.isLight
            ? 'radial-gradient(circle at center, #1e293b 0%, #0b1120 75%, #05070e 100%)'
            : 'radial-gradient(circle at center, #0e1630 0%, #060a16 70%, #03050c 100%)',
      }}
    >
      {/* 2D Wheel Selector Bar (PC Study Mode) */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-1 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#e7cfa0] mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Roue 2D :</span>
          </span>
          {WHEEL_2D_STYLES.map((st) => {
            const active = wheel2DStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                title={st.description}
                onClick={() => onWheel2DStyleChange(st.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#fffbeb]'
                    : 'border-white/10 bg-[#0d1428]/85 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full border shrink-0"
                  style={{
                    backgroundColor: st.swatchPrimary,
                    borderColor: st.swatchAccent,
                  }}
                />
                <span>{st.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <select
            aria-label="Orientation de la roue 2D"
            value={wheel2DOrientation}
            onChange={(e) => onWheel2DOrientationChange(e.target.value as Wheel2DOrientation)}
            className="rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1 text-[11px] text-[#f3efe6] cursor-pointer focus:border-[#d4af37] focus:outline-none"
          >
            <option value="ascendant">ASC à gauche (Classique)</option>
            <option value="aries0">0° Bélier à gauche (Naturel)</option>
            <option value="mcTop">MC en haut (Méridien)</option>
          </select>

          <select
            aria-label="Style des glyphes"
            value={signStyle}
            onChange={(e) => onSignStyleChange(e.target.value as ZodiacSignStyle)}
            className="rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1 text-[11px] text-[#fde68a] cursor-pointer focus:border-[#d4af37] focus:outline-none"
          >
            {ZODIAC_SIGN_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                Signes : {s.shortLabel}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowDecans((v) => !v)}
            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showDecanRing
                ? 'border-[#d4af37]/50 bg-[#d4af37]/15 text-[#fde68a]'
                : 'border-white/15 bg-[#0d1428] text-slate-300 hover:text-white'
            }`}
          >
            Décans
          </button>

          <button
            type="button"
            onClick={() => setShowDegreesOnWheel((v) => !v)}
            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showDegreesOnWheel
                ? 'border-[#38bdf8]/50 bg-[#38bdf8]/15 text-[#7dd3fc]'
                : 'border-white/15 bg-[#0d1428] text-slate-300 hover:text-white'
            }`}
          >
            Degrés
          </button>

          {highlightedAspectId && (
            <button
              type="button"
              onClick={() => onHighlightAspect(null)}
              title="Réinitialiser la mise en évidence d’aspect"
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-[#0d1428] px-2 py-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Aspects</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchTo3D}
            className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/50 bg-[#121931] px-2.5 py-1 text-[11px] font-semibold text-[#f3d67a] hover:bg-[#d4af37] hover:text-[#05070e] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Vue 3D / VR</span>
          </button>
        </div>
      </div>

      {/* Main 2D Interactive Chart Stage */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-2">
        <div className="relative h-full w-full flex items-center justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="max-h-full max-w-full w-auto h-full drop-shadow-[0_18px_45px_rgba(0,0,0,0.65)] select-none"
            role="img"
            aria-label="Roue astrologique interactive en vue 2D"
          >
            {/* Outer Base Circles */}
            <circle
              cx={cx}
              cy={cy}
              r={rOuter + 12}
              fill={palette.outerBg}
              stroke={palette.rimStroke}
              strokeWidth={1.6}
              strokeOpacity={0.75}
            />
            <circle
              cx={cx}
              cy={cy}
              r={rOuter}
              fill={palette.bandBg}
              stroke={palette.rimStroke}
              strokeWidth={2.2}
            />
            {showDecanRing && (
              <circle
                cx={cx}
                cy={cy}
                r={rDecanOuter}
                fill="none"
                stroke={palette.subRimStroke}
                strokeWidth={1.0}
                strokeOpacity={0.65}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={rTickRing}
              fill="none"
              stroke={palette.subRimStroke}
              strokeWidth={0.9}
              strokeOpacity={0.55}
            />
            <circle
              cx={cx}
              cy={cy}
              r={rZodiacInner}
              fill={palette.innerBg}
              stroke={palette.rimStroke}
              strokeWidth={1.8}
            />
            {outerChart && (
              <circle
                cx={cx}
                cy={cy}
                r={rOuterPlanets - 24}
                fill="none"
                stroke={palette.outerPlanetStroke}
                strokeWidth={0.8}
                strokeDasharray="3,4"
                strokeOpacity={0.38}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={rAspect}
              fill={palette.aspectBg}
              stroke={palette.subRimStroke}
              strokeWidth={1.2}
              strokeOpacity={0.65}
            />

            {/* 12 Signs, Decans, 1°/5°/10° Ticks & Glyphs */}
            {ZODIAC_SIGNS.map((sign, idx) => {
              const startLon = idx * 30;
              const endLon = startLon + 30;
              const midLon = startLon + 15;
              const aStart = angleForLongitude(startLon, baseChart, wheel2DOrientation);
              const aEnd = angleForLongitude(endLon, baseChart, wheel2DOrientation);
              const aMid = angleForLongitude(midLon, baseChart, wheel2DOrientation);

              const pOutStart = polar(cx, cy, rOuter, aStart);
              const pOutEnd = polar(cx, cy, rOuter, aEnd);
              const pInStart = polar(cx, cy, rZodiacInner, aStart);
              const pInEnd = polar(cx, cy, rZodiacInner, aEnd);
              const sectorPath = `M ${pOutStart.x} ${pOutStart.y} A ${rOuter} ${rOuter} 0 0 0 ${pOutEnd.x} ${pOutEnd.y} L ${pInEnd.x} ${pInEnd.y} A ${rZodiacInner} ${rZodiacInner} 0 0 1 ${pInStart.x} ${pInStart.y} Z`;

              const pSepIn = polar(cx, cy, rZodiacInner, aStart);
              const pSepOut = polar(cx, cy, rOuter + 10, aStart);
              const rGlyph = (rDecanOuter + rTickRing) / 2;
              const pGlyph = polar(cx, cy, rGlyph, aMid);
              const elColor = getElementColor(sign.element, palette.isLight);
              const chSign = CHINESE_SIGNS_BY_BRANCH[(idx + 3) % 12];

              return (
                <g key={sign.index}>
                  <path
                    d={sectorPath}
                    fill={wheel2DStyle === 'celestial' ? '#38bdf8' : elColor}
                    fillOpacity={palette.sectorTintOpacity}
                  />
                  <line
                    x1={pSepIn.x}
                    y1={pSepIn.y}
                    x2={pSepOut.x}
                    y2={pSepOut.y}
                    stroke={palette.rimStroke}
                    strokeWidth={1.3}
                    strokeOpacity={0.85}
                  />

                  {/* Decan subdivisions (10° / 20°) */}
                  {showDecanRing &&
                    [10, 20].map((dLon) => {
                      const ad = angleForLongitude(startLon + dLon, baseChart, wheel2DOrientation);
                      const dA = polar(cx, cy, rDecanOuter, ad);
                      const dB = polar(cx, cy, rOuter, ad);
                      return (
                        <line
                          key={`dec-${dLon}`}
                          x1={dA.x}
                          y1={dA.y}
                          x2={dB.x}
                          y2={dB.y}
                          stroke={palette.subRimStroke}
                          strokeWidth={0.8}
                          strokeOpacity={0.65}
                        />
                      );
                    })}
                  {showDecanRing &&
                    [0, 1, 2].map((decIdx) => {
                      const decMid = angleForLongitude(
                        startLon + decIdx * 10 + 5,
                        baseChart,
                        wheel2DOrientation
                      );
                      const pDec = polar(cx, cy, (rOuter + rDecanOuter) / 2, decMid);
                      const roman = decIdx === 0 ? 'I' : decIdx === 1 ? 'II' : 'III';
                      return (
                        <text
                          key={`rom-${decIdx}`}
                          x={pDec.x}
                          y={pDec.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={10}
                          fontWeight="600"
                          fill={palette.textMuted}
                        >
                          {roman}
                        </text>
                      );
                    })}

                  {/* 1° / 5° / 10° Vernier ticks */}
                  {Array.from({ length: 30 }, (_, d) => {
                    if (d === 0) return null;
                    const ad = angleForLongitude(startLon + d, baseChart, wheel2DOrientation);
                    const isTen = d === 10 || d === 20;
                    const isFive = d % 5 === 0;
                    const len = isTen ? 13 : isFive ? 9 : 5;
                    const tA = polar(cx, cy, rZodiacInner, ad);
                    const tB = polar(cx, cy, rZodiacInner + len, ad);
                    return (
                      <line
                        key={d}
                        x1={tA.x}
                        y1={tA.y}
                        x2={tB.x}
                        y2={tB.y}
                        stroke={isTen ? palette.rimStroke : palette.tickStroke}
                        strokeWidth={isTen ? 1.2 : isFive ? 0.9 : 0.55}
                        strokeOpacity={isTen ? 0.9 : isFive ? 0.72 : 0.48}
                      />
                    );
                  })}

                  {/* Compass 360° degree markers */}
                  {isCompass &&
                    [0, 15].map((off) => {
                      const degAbs = startLon + off;
                      const ad = angleForLongitude(degAbs, baseChart, wheel2DOrientation);
                      const pDeg = polar(cx, cy, rOuter + 6, ad);
                      return (
                        <text
                          key={`c-${degAbs}`}
                          x={pDeg.x}
                          y={pDeg.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={8}
                          fontWeight="600"
                          fill={palette.textMuted}
                        >
                          {degAbs}°
                        </text>
                      );
                    })}

                  {/* Zodiac Glyph / Chinese Hanzi */}
                  {tradition === 'chinese' ? (
                    <g transform={`translate(${pGlyph.x}, ${pGlyph.y})`}>
                      <text
                        x={0}
                        y={-4}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={17}
                        fontWeight="700"
                        fill={palette.glyphStroke}
                      >
                        {chSign.hanzi}
                      </text>
                      <text
                        x={0}
                        y={11}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={8.5}
                        fill={palette.textMuted}
                      >
                        {chSign.name}
                      </text>
                    </g>
                  ) : (
                    (() => {
                      const spec =
                        signStyle === 'figurative'
                          ? FIGURATIVE_SIGN_PATHS[sign.index]
                          : CALLIGRAPHIC_SIGN_PATHS[sign.index];
                      const gCol =
                        wheel2DStyle === 'enamel' || wheel2DStyle === 'harmonic'
                          ? elColor
                          : palette.glyphStroke;
                      return (
                        <g transform={`translate(${pGlyph.x}, ${pGlyph.y})`}>
                          {signStyle === 'jewel' && (
                            <circle
                              cx={0}
                              cy={0}
                              r={15}
                              fill={elColor}
                              fillOpacity={0.14}
                              stroke={palette.rimStroke}
                              strokeWidth={1}
                              strokeOpacity={0.7}
                            />
                          )}
                          <g
                            transform="scale(0.165)"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {spec.strokes.map((d, si) => (
                              <path
                                key={si}
                                d={d}
                                stroke={gCol}
                                strokeWidth={signStyle === 'minimal' ? 8 : 11}
                              />
                            ))}
                            {spec.circles?.map((c, ci) => (
                              <circle
                                key={ci}
                                cx={c.cx}
                                cy={c.cy}
                                r={c.r}
                                fill={c.fill ? gCol : 'none'}
                                stroke={c.fill ? 'none' : gCol}
                                strokeWidth={c.fill ? 0 : 10}
                              />
                            ))}
                          </g>
                        </g>
                      );
                    })()
                  )}
                </g>
              );
            })}

            {/* Clickable 12 House Sectors + Cusps */}
            {showHouses &&
              baseChart.houses.map((house: HouseCusp) => {
                const isAngular =
                  house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10;
                const a = angleForLongitude(house.longitude, baseChart, wheel2DOrientation);
                const nextHouse = baseChart.houses[house.house % 12];
                const aNext = angleForLongitude(nextHouse.longitude, baseChart, wheel2DOrientation);
                const pWedgeOutA = polar(cx, cy, rZodiacInner, a);
                const pWedgeOutB = polar(cx, cy, rZodiacInner, aNext);
                const pWedgeInA = polar(cx, cy, rAspect, a);
                const pWedgeInB = polar(cx, cy, rAspect, aNext);
                const isSelectedHouse = selectedHouseNum === house.house;

                let span = (nextHouse.longitude - house.longitude + 360) % 360;
                if (span === 0) span = 30;
                const aMid = angleForLongitude(
                  house.longitude + span * 0.5,
                  baseChart,
                  wheel2DOrientation
                );
                const pIn = polar(cx, cy, rAspect, a);
                const pOut = polar(cx, cy, rZodiacInner, a);
                const pNum = polar(cx, cy, rAspect - 15, aMid);
                const largeArc = span > 180 ? 1 : 0;
                const wedgePath = `M ${pWedgeOutA.x} ${pWedgeOutA.y} A ${rZodiacInner} ${rZodiacInner} 0 ${largeArc} 0 ${pWedgeOutB.x} ${pWedgeOutB.y} L ${pWedgeInB.x} ${pWedgeInB.y} A ${rAspect} ${rAspect} 0 ${largeArc} 1 ${pWedgeInA.x} ${pWedgeInA.y} Z`;

                return (
                  <g
                    key={house.house}
                    onClick={() => onSelectHouse(house.house)}
                    className="cursor-pointer"
                  >
                    <path
                      d={wedgePath}
                      fill={isSelectedHouse ? palette.rimStroke : 'transparent'}
                      fillOpacity={isSelectedHouse ? 0.14 : 0}
                    />
                    <line
                      x1={pIn.x}
                      y1={pIn.y}
                      x2={pOut.x}
                      y2={pOut.y}
                      stroke={isAngular ? palette.angularLine : palette.houseLine}
                      strokeWidth={isAngular ? 2.1 : 0.95}
                      strokeDasharray={isAngular ? undefined : '4,3'}
                      strokeOpacity={isAngular ? 0.95 : 0.78}
                    />
                    <text
                      x={pNum.x}
                      y={pNum.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isSelectedHouse ? 13 : 11}
                      fontWeight={isSelectedHouse || isAngular ? '700' : '600'}
                      fill={isSelectedHouse ? palette.angularLine : palette.textMuted}
                    >
                      {house.roman}
                    </text>
                  </g>
                );
              })}

            {/* ASC / DSC / MC / IC Cardinal Pointers */}
            {[
              { label: 'ASC', rad: ascRad, accent: '#fbbf24', bold: true },
              { label: 'DSC', rad: dscRad, accent: palette.textMuted, bold: false },
              { label: 'MC', rad: mcRad, accent: '#38bdf8', bold: true },
              { label: 'IC', rad: icRad, accent: palette.textMuted, bold: false },
            ].map(({ label, rad, accent, bold }) => {
              const pEdge = polar(cx, cy, rOuter + 1, rad);
              const pTag = polar(cx, cy, rOuter + 21, rad);
              return (
                <g key={label}>
                  <circle
                    cx={pEdge.x}
                    cy={pEdge.y}
                    r={bold ? 4 : 2.8}
                    fill={bold ? accent : palette.textMuted}
                  />
                  <text
                    x={pTag.x}
                    y={pTag.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={bold ? 12 : 10}
                    fontWeight={bold ? '800' : '600'}
                    fill={palette.isLight ? (bold ? palette.angularLine : palette.textMuted) : accent}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Outer Layer ASC Needle (if Transit / Solar Return / Synastry) */}
            {outerAscRad !== null && (
              <g>
                {(() => {
                  const p1 = polar(cx, cy, rZodiacInner, outerAscRad);
                  const p2 = polar(cx, cy, rOuter - 2, outerAscRad);
                  return (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={palette.outerPlanetStroke}
                      strokeWidth={2.2}
                      strokeDasharray="3,2"
                    />
                  );
                })()}
              </g>
            )}

            {/* Inner Aspect Chords (Clickable) */}
            {visibleInternalAspects.map((asp) => {
              const pA = baseChart.planets.find((p) => p.id === asp.planetA);
              const pB = baseChart.planets.find((p) => p.id === asp.planetB);
              if (!pA || !pB) return null;
              const ptA = polar(
                cx,
                cy,
                rAspect - 2,
                angleForLongitude(pA.longitude, baseChart, wheel2DOrientation)
              );
              const ptB = polar(
                cx,
                cy,
                rAspect - 2,
                angleForLongitude(pB.longitude, baseChart, wheel2DOrientation)
              );
              const isHighlighted = highlightedAspectId === asp.id;
              const isPlanetFocused =
                selectedPlanetId &&
                selectedPlanetLayer === 'base' &&
                (asp.planetA === selectedPlanetId || asp.planetB === selectedPlanetId);
              const dim =
                (highlightedAspectId && !isHighlighted) ||
                (selectedPlanetId && !isPlanetFocused && !isHighlighted);

              return (
                <g
                  key={asp.id}
                  onClick={() => onHighlightAspect(isHighlighted ? null : asp.id)}
                  className="cursor-pointer"
                >
                  <line
                    x1={ptA.x}
                    y1={ptA.y}
                    x2={ptB.x}
                    y2={ptB.y}
                    stroke={asp.cssColor}
                    strokeWidth={isHighlighted ? 3.2 : isPlanetFocused ? 2.1 : 1.15}
                    strokeOpacity={dim ? 0.14 : outerChart ? 0.36 : 0.78}
                    strokeDasharray={asp.harmony === 'tense' && !isHighlighted ? '4,3' : undefined}
                  />
                </g>
              );
            })}

            {visibleCompAspects.map((asp) => {
              const pA = baseChart.planets.find((p) => p.id === asp.natalPlanet);
              const pB = outerChart?.planets.find((p) => p.id === asp.outerPlanet);
              if (!pA || !pB) return null;
              const ptA = polar(
                cx,
                cy,
                rAspect - 2,
                angleForLongitude(pA.longitude, baseChart, wheel2DOrientation)
              );
              const ptB = polar(
                cx,
                cy,
                rAspect - 2,
                angleForLongitude(pB.longitude, baseChart, wheel2DOrientation)
              );
              const isHighlighted = highlightedAspectId === asp.id;
              const isPlanetFocused =
                (selectedPlanetLayer === 'base' && asp.natalPlanet === selectedPlanetId) ||
                (selectedPlanetLayer === 'outer' && asp.outerPlanet === selectedPlanetId);
              const dim =
                (highlightedAspectId && !isHighlighted) ||
                (selectedPlanetId && !isPlanetFocused && !isHighlighted);

              return (
                <g
                  key={asp.id}
                  onClick={() => onHighlightAspect(isHighlighted ? null : asp.id)}
                  className="cursor-pointer"
                >
                  <line
                    x1={ptA.x}
                    y1={ptA.y}
                    x2={ptB.x}
                    y2={ptB.y}
                    stroke={asp.cssColor}
                    strokeWidth={isHighlighted ? 3.4 : isPlanetFocused ? 2.3 : 1.4}
                    strokeOpacity={dim ? 0.16 : 0.88}
                  />
                </g>
              );
            })}

            {/* Base Layer Planets */}
            {basePlanetPlacements.map(({ planet, exactRad, displayRad, tier }) => {
              const rNode = rBasePlanets - tier * 20;
              const pPos = polar(cx, cy, rNode, displayRad);
              const pTickOut = polar(cx, cy, rZodiacInner, exactRad);
              const pTickIn = polar(cx, cy, rZodiacInner - 8, exactRad);
              const pDeg = polar(cx, cy, rNode - (outerChart ? 19 : 22), displayRad);
              const key = `base-${planet.id}`;
              const isSelected = selectedPlanetLayer === 'base' && selectedPlanetId === planet.id;
              const isHovered = hoveredPlanetKey === key;

              return (
                <g
                  key={key}
                  onClick={() => onSelectPlanet(planet.id, 'base')}
                  onMouseEnter={() => setHoveredPlanetKey(key)}
                  onMouseLeave={() => setHoveredPlanetKey(null)}
                  className="cursor-pointer"
                >
                  <line
                    x1={pTickOut.x}
                    y1={pTickOut.y}
                    x2={pTickIn.x}
                    y2={pTickIn.y}
                    stroke={planet.cssColor}
                    strokeWidth={1.6}
                  />
                  <line
                    x1={pTickIn.x}
                    y1={pTickIn.y}
                    x2={pPos.x}
                    y2={pPos.y}
                    stroke={palette.basePlanetStroke}
                    strokeWidth={0.75}
                    strokeOpacity={0.35}
                  />
                  {(isSelected || isHovered) && (
                    <circle
                      cx={pPos.x}
                      cy={pPos.y}
                      r={18}
                      fill={palette.basePlanetStroke}
                      fillOpacity={0.22}
                      stroke={palette.basePlanetStroke}
                      strokeWidth={1.4}
                    />
                  )}
                  <circle
                    cx={pPos.x}
                    cy={pPos.y}
                    r={13}
                    fill={palette.innerBg}
                    stroke={isSelected ? '#fbbf24' : planet.cssColor}
                    strokeWidth={isSelected ? 2 : 1.25}
                  />
                  <text
                    x={pPos.x}
                    y={pPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={15}
                    fontWeight="700"
                    fill={palette.isLight ? '#0f172a' : planet.cssColor}
                  >
                    {planet.symbol}
                  </text>
                  {showDegreesOnWheel && (
                    <text
                      x={pDeg.x}
                      y={pDeg.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={9}
                      fontWeight="600"
                      fill={palette.textMuted}
                    >
                      {Math.floor(planet.degInSign)}°{planet.retrograde ? '℞' : ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Outer Layer Planets (Transits / Solar Return / Synastry) */}
            {outerChart &&
              outerPlanetPlacements.map(({ planet, exactRad, displayRad, tier }) => {
                const rNode = rOuterPlanets + tier * 15;
                const pPos = polar(cx, cy, rNode, displayRad);
                const pTickOut = polar(cx, cy, rZodiacInner, exactRad);
                const pTickIn = polar(cx, cy, rZodiacInner - 6, exactRad);
                const pDeg = polar(cx, cy, rNode + 17, displayRad);
                const key = `outer-${planet.id}`;
                const isSelected = selectedPlanetLayer === 'outer' && selectedPlanetId === planet.id;
                const isHovered = hoveredPlanetKey === key;

                return (
                  <g
                    key={key}
                    onClick={() => onSelectPlanet(planet.id, 'outer')}
                    onMouseEnter={() => setHoveredPlanetKey(key)}
                    onMouseLeave={() => setHoveredPlanetKey(null)}
                    className="cursor-pointer"
                  >
                    <line
                      x1={pTickOut.x}
                      y1={pTickOut.y}
                      x2={pTickIn.x}
                      y2={pTickIn.y}
                      stroke={palette.outerPlanetStroke}
                      strokeWidth={1.3}
                      strokeOpacity={0.8}
                    />
                    <line
                      x1={pTickOut.x}
                      y1={pTickOut.y}
                      x2={pPos.x}
                      y2={pPos.y}
                      stroke={palette.outerPlanetStroke}
                      strokeWidth={0.7}
                      strokeOpacity={0.35}
                    />
                    {(isSelected || isHovered) && (
                      <circle
                        cx={pPos.x}
                        cy={pPos.y}
                        r={15}
                        fill={palette.outerPlanetStroke}
                        fillOpacity={0.22}
                        stroke={palette.outerPlanetStroke}
                        strokeWidth={1.4}
                      />
                    )}
                    <circle
                      cx={pPos.x}
                      cy={pPos.y}
                      r={11.2}
                      fill={palette.innerBg}
                      stroke={palette.outerPlanetStroke}
                      strokeWidth={isSelected ? 2 : 1.15}
                    />
                    <text
                      x={pPos.x}
                      y={pPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12.5}
                      fontWeight="700"
                      fill={palette.isLight ? '#0369a1' : '#7dd3fc'}
                    >
                      {planet.symbol}
                    </text>
                    {showDegreesOnWheel && (
                      <text
                        x={pDeg.x}
                        y={pDeg.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={8.5}
                        fontWeight="600"
                        fill={palette.isLight ? '#0284c7' : '#7dd3fc'}
                      >
                        {Math.floor(planet.degInSign)}°{planet.retrograde ? '℞' : ''}
                      </text>
                    )}
                  </g>
                );
              })}
          </svg>

          {/* Compact Corner Summary Card on Wide PC Screens */}
          <div className="hidden xl:flex flex-col gap-1.5 fixed left-5 top-20 z-10 w-60 rounded-xl border border-[#d4af37]/25 bg-[#080d1b]/90 p-3 text-xs text-slate-200 pointer-events-auto">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#e7cfa0]">
              Carte 2D · {baseChart.cityName}
            </div>
            <div className="text-[11px] text-slate-400">
              Cliquer une planète, une maison ou un aspect ouvre son interprétation.
            </div>
            <div className="border-t border-white/10 pt-1.5 space-y-1 text-[11px]">
              <div>
                <span className="text-slate-400">Ascendant : </span>
                <span className="font-semibold text-[#fbbf24]">
                  {tradition === 'chinese'
                    ? `${transposeLongitudeToChinese(baseChart.ascendant).sign.branchHanzi}${transposeLongitudeToChinese(baseChart.ascendant).sign.hanzi} ${transposeLongitudeToChinese(baseChart.ascendant).sign.name}`
                    : `${baseChart.ascSign.symbol} ${baseChart.ascSign.name}`}
                </span>
              </div>
              {sun && (
                <div>
                  <span className="text-slate-400">Soleil : </span>
                  <span className="font-semibold text-[#f8f3e6]">
                    {sun.formattedDeg} {sun.sign.name}
                  </span>
                </div>
              )}
              {moon && (
                <div>
                  <span className="text-slate-400">Lune : </span>
                  <span className="font-semibold text-[#f8f3e6]">
                    {moon.formattedDeg} {moon.sign.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
