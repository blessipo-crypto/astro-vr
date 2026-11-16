import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { getSignDodecatemoria, getSignTerms, TermSystem } from '../astro/dignities';
import type { CatalogPointEntry } from '../astro/celestialCatalog';
import type { AspectFilter, SkyAnimationsConfig } from '../vr/AstrologyScene';
import type { ZodiacWheelStyle } from '../vr/textures';
import type { DignityRingsConfig } from './AdvancedConfigDrawer';

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
        outerBg: '#080911',
        bandBg: '#121626',
        innerBg: '#0b0e19',
        aspectBg: '#070912',
        rimStroke: '#eab308',
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

function angleForLongitudeValues(
  lon: number,
  ascendant: number,
  midheaven: number,
  orientation: Wheel2DOrientation
): number {
  let deg: number;
  if (orientation === 'aries0') {
    deg = 180 - lon;
  } else if (orientation === 'mcTop') {
    deg = 270 - (lon - midheaven);
  } else {
    deg = 180 - (lon - ascendant);
  }
  return (deg * Math.PI) / 180;
}

function angleForLongitude(
  lon: number,
  chart: AstroChart,
  orientation: Wheel2DOrientation
): number {
  return angleForLongitudeValues(lon, chart.ascendant, chart.midheaven, orientation);
}

function polar(cx: number, cy: number, r: number, rad: number) {
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
}

function shortestAngleDiff(fromRad: number, toRad: number): number {
  let d = toRad - fromRad;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
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

/* ------------------------------------------------------------------ */
/* Memoized Static Zodiac Dial (Zero re-render during planet motion)  */
/* ------------------------------------------------------------------ */
interface StaticZodiacDialProps {
  cx: number;
  cy: number;
  rOuter: number;
  rDecanInner: number;
  rTermsInner: number;
  rDodecaInner: number;
  rTickRing: number;
  rZodiacInner: number;
  rOuterPlanets: number;
  rAspect: number;
  hasOuterChart: boolean;
  ascendant: number;
  midheaven: number;
  wheel2DOrientation: Wheel2DOrientation;
  wheel2DStyle: Wheel2DStyle;
  signStyle: ZodiacSignStyle;
  tradition: ZodiacTradition;
  palette: Palette2D;
  showDecanRing: boolean;
  showTermsRing: boolean;
  termSystem: TermSystem;
  showDodecaRing: boolean;
  showCentralSun: boolean;
  isCompass: boolean;
}

const StaticZodiacDialLayer: React.FC<StaticZodiacDialProps> = React.memo(
  ({
    cx,
    cy,
    rOuter,
    rDecanInner,
    rTermsInner,
    rDodecaInner,
    rTickRing,
    rZodiacInner,
    rOuterPlanets,
    rAspect,
    hasOuterChart,
    ascendant,
    midheaven,
    wheel2DOrientation,
    wheel2DStyle,
    signStyle,
    tradition,
    palette,
    showDecanRing,
    showTermsRing,
    termSystem,
    showDodecaRing,
    showCentralSun,
    isCompass,
  }) => {
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={rOuter + 10}
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
            r={rDecanInner}
            fill="none"
            stroke={palette.subRimStroke}
            strokeWidth={0.95}
            strokeOpacity={0.65}
          />
        )}
        {showTermsRing && (
          <circle
            cx={cx}
            cy={cy}
            r={rTermsInner}
            fill="none"
            stroke="#c084fc"
            strokeWidth={0.9}
            strokeOpacity={0.55}
          />
        )}
        {showDodecaRing && (
          <circle
            cx={cx}
            cy={cy}
            r={rDodecaInner}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={0.85}
            strokeOpacity={0.5}
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
        {hasOuterChart && (
          <circle
            cx={cx}
            cy={cy}
            r={rOuterPlanets - 22}
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

        {/* Cosmic Insights Central Radiant Sun Motif */}
        {showCentralSun && (
          <g pointerEvents="none" opacity={palette.isLight ? 0.3 : 0.72}>
            <circle cx={cx} cy={cy} r={34} fill="url(#cosmicCentralSunGlow)" />
            {Array.from({ length: 12 }, (_, rIdx) => {
              const rad = (rIdx * 30 * Math.PI) / 180;
              const pA = polar(cx, cy, 11, rad);
              const pB = polar(cx, cy, rIdx % 2 === 0 ? 30 : 21, rad);
              return (
                <line
                  key={`sunray-${rIdx}`}
                  x1={pA.x}
                  y1={pA.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke="#fbbf24"
                  strokeOpacity={0.45}
                  strokeWidth={rIdx % 2 === 0 ? 1.2 : 0.8}
                />
              );
            })}
            <circle
              cx={cx}
              cy={cy}
              r={8}
              fill="none"
              stroke="#fde68a"
              strokeOpacity={0.65}
              strokeWidth={1.2}
            />
            <circle cx={cx} cy={cy} r={2.2} fill="#fde68a" fillOpacity={0.85} />
          </g>
        )}

        {/* 12 Signs, Decans, Terms, Dodecatemoria, 1°/5°/10° Ticks & Glyphs */}
        {ZODIAC_SIGNS.map((sign, idx) => {
          const startLon = idx * 30;
          const endLon = startLon + 30;
          const midLon = startLon + 15;
          const aStart = angleForLongitudeValues(startLon, ascendant, midheaven, wheel2DOrientation);
          const aEnd = angleForLongitudeValues(endLon, ascendant, midheaven, wheel2DOrientation);
          const aMid = angleForLongitudeValues(midLon, ascendant, midheaven, wheel2DOrientation);

          const pOutStart = polar(cx, cy, rOuter, aStart);
          const pOutEnd = polar(cx, cy, rOuter, aEnd);
          const pInStart = polar(cx, cy, rZodiacInner, aStart);
          const pInEnd = polar(cx, cy, rZodiacInner, aEnd);
          const sectorPath = `M ${pOutStart.x} ${pOutStart.y} A ${rOuter} ${rOuter} 0 0 0 ${pOutEnd.x} ${pOutEnd.y} L ${pInEnd.x} ${pInEnd.y} A ${rZodiacInner} ${rZodiacInner} 0 0 1 ${pInStart.x} ${pInStart.y} Z`;

          const pSepIn = polar(cx, cy, rZodiacInner, aStart);
          const pSepOut = polar(cx, cy, rOuter + 9, aStart);
          const rGlyph = (rDodecaInner + rTickRing) / 2;
          const pGlyph = polar(cx, cy, rGlyph, aMid);
          const elColor = getElementColor(sign.element, palette.isLight);
          const chSign = CHINESE_SIGNS_BY_BRANCH[(idx + 3) % 12];
          const signTerms = showTermsRing ? getSignTerms(sign.index, termSystem) : [];
          const signDodeca = showDodecaRing ? getSignDodecatemoria(sign.index) : [];

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

              {showDecanRing &&
                [10, 20].map((dLon) => {
                  const ad = angleForLongitudeValues(
                    startLon + dLon,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
                  const dA = polar(cx, cy, rDecanInner, ad);
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
                  const decMid = angleForLongitudeValues(
                    startLon + decIdx * 10 + 5,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
                  const pDec = polar(cx, cy, (rOuter + rDecanInner) / 2, decMid);
                  const roman = decIdx === 0 ? 'I' : decIdx === 1 ? 'II' : 'III';
                  return (
                    <text
                      key={`rom-${decIdx}`}
                      x={pDec.x}
                      y={pDec.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={9}
                      fontWeight="600"
                      style={{ fontFamily: 'var(--font-display)' }}
                      fill={palette.textMuted}
                    >
                      {roman}
                    </text>
                  );
                })}

              {showTermsRing &&
                signTerms.map((term, tIdx) => {
                  const adStart = angleForLongitudeValues(
                    startLon + term.startDeg,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
                  const adMid = angleForLongitudeValues(
                    startLon + (term.startDeg + term.endDeg) / 2,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
                  const tA = polar(cx, cy, rTermsInner, adStart);
                  const tB = polar(cx, cy, rDecanInner, adStart);
                  const pTerm = polar(cx, cy, (rDecanInner + rTermsInner) / 2, adMid);
                  return (
                    <g key={`term-${tIdx}`}>
                      {term.startDeg > 0 && (
                        <line
                          x1={tA.x}
                          y1={tA.y}
                          x2={tB.x}
                          y2={tB.y}
                          stroke="#c084fc"
                          strokeWidth={0.7}
                          strokeOpacity={0.5}
                        />
                      )}
                      <text
                        x={pTerm.x}
                        y={pTerm.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={9}
                        fontWeight="600"
                        style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}
                        fill={palette.isLight ? '#4c1d95' : term.color}
                      >
                        {term.rulerSymbol}
                      </text>
                    </g>
                  );
                })}

              {showDodecaRing &&
                signDodeca.map((cell) => {
                  const adStart = angleForLongitudeValues(
                    cell.startLon,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
                  const adMid = angleForLongitudeValues(
                    (cell.startLon + cell.endLon) / 2,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
                  const dA = polar(cx, cy, rDodecaInner, adStart);
                  const dB = polar(cx, cy, rTermsInner, adStart);
                  const pMicro = polar(cx, cy, (rTermsInner + rDodecaInner) / 2, adMid);
                  return (
                    <g key={`dwad-${cell.step}`}>
                      {cell.step > 0 && (
                        <line
                          x1={dA.x}
                          y1={dA.y}
                          x2={dB.x}
                          y2={dB.y}
                          stroke="#38bdf8"
                          strokeWidth={0.45}
                          strokeOpacity={0.35}
                        />
                      )}
                      <text
                        x={pMicro.x}
                        y={pMicro.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={6.5}
                        style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}
                        fill={palette.isLight ? '#0369a1' : '#bae6fd'}
                      >
                        {cell.microSignSymbol}
                      </text>
                    </g>
                  );
                })}

              {Array.from({ length: 30 }, (_, d) => {
                if (d === 0) return null;
                const ad = angleForLongitudeValues(
                  startLon + d,
                  ascendant,
                  midheaven,
                  wheel2DOrientation
                );
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

              {isCompass &&
                [0, 15].map((off) => {
                  const degAbs = startLon + off;
                  const ad = angleForLongitudeValues(
                    degAbs,
                    ascendant,
                    midheaven,
                    wheel2DOrientation
                  );
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
      </g>
    );
  }
);

StaticZodiacDialLayer.displayName = 'StaticZodiacDialLayer';

/* ------------------------------------------------------------------ */
/* Sky 2D Animated Backdrop                                           */
/* ------------------------------------------------------------------ */
const Sky2DBackdrop: React.FC<{ skyAnimations: SkyAnimationsConfig }> = React.memo(
  ({ skyAnimations }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const activeAny =
        skyAnimations.shootingStars || skyAnimations.nebulae || skyAnimations.aurora;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);

      if (!activeAny) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        return () => window.removeEventListener('resize', resize);
      }

      const stars = Array.from({ length: 70 }, (_, i) => ({
        x: ((i * 73 + 19) % 100) / 100,
        y: ((i * 41 + 37) % 100) / 100,
        r: 0.6 + ((i * 13) % 10) * 0.1,
        phase: i * 0.9,
      }));

      const meteors = [
        { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0.9, cooldown: 0.5 },
        { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1.1, cooldown: 3.4 },
      ];

      let rafId = 0;
      let lastTs = performance.now();

      const draw = (now: number) => {
        const dt = Math.min((now - lastTs) / 1000, 0.08);
        lastTs = now;
        const t = now * 0.001;
        const w = window.innerWidth;
        const h = window.innerHeight;

        ctx.clearRect(0, 0, w, h);

        for (const s of stars) {
          const alpha = 0.25 + 0.28 * Math.sin(t * 1.1 + s.phase);
          ctx.fillStyle = `rgba(226, 232, 240, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (skyAnimations.nebulae) {
          const clouds = [
            {
              cx: w * (0.17 + Math.sin(t * 0.08) * 0.02),
              cy: h * (0.28 + Math.cos(t * 0.07) * 0.02),
              rx: Math.min(w, h) * 0.18,
              c1: 'rgba(99, 102, 241, 0.14)',
              c2: 'rgba(168, 85, 247, 0.06)',
            },
            {
              cx: w * (0.83 + Math.cos(t * 0.06) * 0.02),
              cy: h * (0.34 + Math.sin(t * 0.09) * 0.02),
              rx: Math.min(w, h) * 0.16,
              c1: 'rgba(56, 189, 248, 0.13)',
              c2: 'rgba(244, 63, 94, 0.05)',
            },
          ];
          for (const c of clouds) {
            const g = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, c.rx);
            g.addColorStop(0, c.c1);
            g.addColorStop(0.55, c.c2);
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(c.cx, c.cy, c.rx, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (skyAnimations.aurora) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (let b = 0; b < 2; b++) {
            const grad = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.34);
            grad.addColorStop(0, 'rgba(52, 211, 153, 0)');
            grad.addColorStop(
              0.45,
              b === 0 ? 'rgba(52, 211, 153, 0.085)' : 'rgba(129, 140, 248, 0.075)'
            );
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            const startX = w * (0.12 + b * 0.14);
            const endX = w * (0.76 + b * 0.12);
            const baseY = h * (0.16 + b * 0.05);
            ctx.moveTo(startX, baseY + 60);
            for (let x = startX; x <= endX; x += 24) {
              const p = (x - startX) / (endX - startX);
              const env = Math.sin(p * Math.PI);
              const y = baseY + Math.sin(p * 6 + t * (0.45 + b * 0.15) + b) * 18 * env;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(endX, baseY + 80);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        if (skyAnimations.shootingStars) {
          for (const m of meteors) {
            if (!m.active) {
              m.cooldown -= dt;
              if (m.cooldown <= 0) {
                m.active = true;
                m.life = 0;
                m.maxLife = 0.75 + Math.random() * 0.45;
                const fromLeft = Math.random() > 0.4;
                m.x = fromLeft ? w * (0.08 + Math.random() * 0.35) : w * (0.55 + Math.random() * 0.35);
                m.y = h * (0.12 + Math.random() * 0.25);
                const speed = 260 + Math.random() * 140;
                const ang = fromLeft
                  ? 0.35 + Math.random() * 0.3
                  : Math.PI - (0.35 + Math.random() * 0.3);
                m.vx = Math.cos(ang) * speed;
                m.vy = Math.sin(ang) * speed;
              }
              continue;
            }

            m.life += dt;
            const p = m.life / m.maxLife;
            if (p >= 1) {
              m.active = false;
              m.cooldown = 3.2 + Math.random() * 4.5;
              continue;
            }

            const headX = m.x + m.vx * m.life;
            const headY = m.y + m.vy * m.life;
            const tailLen = 68;
            const norm = Math.hypot(m.vx, m.vy) || 1;
            const tailX = headX - (m.vx / norm) * tailLen;
            const tailY = headY - (m.vy / norm) * tailLen;
            const opacity = Math.sin(p * Math.PI) * 0.78;

            const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            grad.addColorStop(0, 'rgba(125, 211, 252, 0)');
            grad.addColorStop(0.75, `rgba(125, 211, 252, ${(opacity * 0.55).toFixed(3)})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${opacity.toFixed(3)})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();
          }
        }

        rafId = requestAnimationFrame(draw);
      };

      rafId = requestAnimationFrame(draw);
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
      };
    }, [skyAnimations]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
    );
  }
);

Sky2DBackdrop.displayName = 'Sky2DBackdrop';

/* ------------------------------------------------------------------ */
/* Polar Orbital Animation Types                                      */
/* ------------------------------------------------------------------ */
interface PlanetAnimState {
  currentExactRad: number;
  targetExactRad: number;
  currentDisplayRad: number;
  targetDisplayRad: number;
  currentR: number;
  targetR: number;
  degOffset: number;
}

interface PlanetNodeDomRefs {
  badgeGroup: SVGGElement | null;
  tickLine: SVGLineElement | null;
  leaderLine: SVGLineElement | null;
  degText: SVGTextElement | null;
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
  skyAnimations: SkyAnimationsConfig;
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
  dignityConfig?: DignityRingsConfig;
  onDignityConfigChange?: (patch: Partial<DignityRingsConfig>) => void;
  pinnedCatalogPoints?: CatalogPointEntry[];
  spacetimeSlot?: React.ReactNode;
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
  skyAnimations,
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
  dignityConfig,
  onDignityConfigChange,
  pinnedCatalogPoints = [],
  spacetimeSlot,
}) => {
  const [localDecans, setLocalDecans] = useState<boolean>(wheel2DStyle === 'harmonic');
  const [showDegreesOnWheel, setShowDegreesOnWheel] = useState<boolean>(true);
  const [hoveredPlanetKey, setHoveredPlanetKey] = useState<string | null>(null);
  const [hoveredZodiacIdx, setHoveredZodiacIdx] = useState<number | null>(null);
  const [hoveredHouseNum, setHoveredHouseNum] = useState<number | null>(null);

  const palette = useMemo(() => getWheel2DPalette(wheel2DStyle), [wheel2DStyle]);
  const showDecanRing =
    (dignityConfig ? dignityConfig.showDecans : localDecans) || wheel2DStyle === 'harmonic';
  const showTermsRing = dignityConfig?.showTerms ?? false;
  const termSystem = dignityConfig?.termSystem ?? 'egyptian';
  const showDodecaRing = dignityConfig?.showDodecatemoria ?? false;
  const showCentralSun = dignityConfig?.showCentralSun ?? true;
  const isCompass = wheel2DStyle === 'compass';

  const size = 760;
  const cx = size / 2;
  const cy = size / 2;

  const rOuter = 360;
  const rDecanInner = showDecanRing ? rOuter - 18 : rOuter;
  const rTermsInner = showTermsRing ? rDecanInner - 18 : rDecanInner;
  const rDodecaInner = showDodecaRing ? rTermsInner - 16 : rTermsInner;
  const rTickRing = rDodecaInner - 28;
  const rZodiacInner = Math.max(264, rTickRing - 14);
  const rOuterPlanets = 232;
  const rBasePlanets = outerChart ? 182 : 208;
  const rAspect = outerChart ? 138 : 154;

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

  /* ---------------------------------------------------------------- */
  /* 60fps Polar Orbital Animator Refs & Imperative DOM Sync Engine   */
  /* ---------------------------------------------------------------- */
  const planetAnimMapRef = useRef<Map<string, PlanetAnimState>>(new Map());
  const planetDomMapRef = useRef<Map<string, PlanetNodeDomRefs>>(new Map());
  const internalAspectRefs = useRef<Map<string, SVGLineElement>>(new Map());
  const compAspectRefs = useRef<Map<string, SVGLineElement>>(new Map());
  const outerAscLineRef = useRef<SVGLineElement | null>(null);
  const outerAscAnimRef = useRef<{ current: number; target: number } | null>(null);

  const rafIdRef = useRef<number>(0);
  const lastFrameTsRef = useRef<number>(0);
  const lastTargetUpdateTsRef = useRef<number>(0);
  const lambdaRef = useRef<number>(14.5);

  const liveSceneParamsRef = useRef({
    cx,
    cy,
    rZodiacInner,
    rAspect,
    rOuter,
    visibleInternalAspects,
    visibleCompAspects,
    hasOuterChart: Boolean(outerChart),
  });
  liveSceneParamsRef.current = {
    cx,
    cy,
    rZodiacInner,
    rAspect,
    rOuter,
    visibleInternalAspects,
    visibleCompAspects,
    hasOuterChart: Boolean(outerChart),
  };

  const applyFrameToSvgDom = () => {
    const {
      cx: ccx,
      cy: ccy,
      rZodiacInner: rZI,
      rAspect: rAsp,
      rOuter: rOut,
      visibleInternalAspects: intAsps,
      visibleCompAspects: cmpAsps,
      hasOuterChart,
    } = liveSceneParamsRef.current;

    const animMap = planetAnimMapRef.current;

    // 1. Update every planet node along its circular orbit
    planetDomMapRef.current.forEach((refs, key) => {
      const anim = animMap.get(key);
      if (!anim) return;
      const isOuter = key.startsWith('outer-');
      const pPos = polar(ccx, ccy, anim.currentR, anim.currentDisplayRad);
      const pTickOut = polar(ccx, ccy, rZI, anim.currentExactRad);
      const pTickIn = polar(ccx, ccy, rZI - (isOuter ? 6 : 8), anim.currentExactRad);

      if (refs.badgeGroup) {
        refs.badgeGroup.setAttribute(
          'transform',
          `translate(${pPos.x.toFixed(2)}, ${pPos.y.toFixed(2)})`
        );
      }
      if (refs.tickLine) {
        refs.tickLine.setAttribute('x1', pTickOut.x.toFixed(2));
        refs.tickLine.setAttribute('y1', pTickOut.y.toFixed(2));
        refs.tickLine.setAttribute('x2', pTickIn.x.toFixed(2));
        refs.tickLine.setAttribute('y2', pTickIn.y.toFixed(2));
      }
      if (refs.leaderLine) {
        const startPt = isOuter ? pTickOut : pTickIn;
        refs.leaderLine.setAttribute('x1', startPt.x.toFixed(2));
        refs.leaderLine.setAttribute('y1', startPt.y.toFixed(2));
        refs.leaderLine.setAttribute('x2', pPos.x.toFixed(2));
        refs.leaderLine.setAttribute('y2', pPos.y.toFixed(2));
      }
      if (refs.degText) {
        const dx = Math.cos(anim.currentDisplayRad) * anim.degOffset;
        const dy = Math.sin(anim.currentDisplayRad) * anim.degOffset;
        refs.degText.setAttribute('x', dx.toFixed(2));
        refs.degText.setAttribute('y', dy.toFixed(2));
      }
    });

    // 2. Update aspect chords smoothly with interpolated exact longitudes
    for (let i = 0; i < intAsps.length; i++) {
      const asp = intAsps[i];
      const line = internalAspectRefs.current.get(asp.id);
      if (!line) continue;
      const aA = animMap.get(`base-${asp.planetA}`);
      const aB = animMap.get(`base-${asp.planetB}`);
      if (!aA || !aB) continue;
      const ptA = polar(ccx, ccy, rAsp - 2, aA.currentExactRad);
      const ptB = polar(ccx, ccy, rAsp - 2, aB.currentExactRad);
      line.setAttribute('x1', ptA.x.toFixed(2));
      line.setAttribute('y1', ptA.y.toFixed(2));
      line.setAttribute('x2', ptB.x.toFixed(2));
      line.setAttribute('y2', ptB.y.toFixed(2));
    }

    if (hasOuterChart) {
      for (let i = 0; i < cmpAsps.length; i++) {
        const asp = cmpAsps[i];
        const line = compAspectRefs.current.get(asp.id);
        if (!line) continue;
        const aA = animMap.get(`base-${asp.natalPlanet}`);
        const aB = animMap.get(`outer-${asp.outerPlanet}`);
        if (!aA || !aB) continue;
        const ptA = polar(ccx, ccy, rAsp - 2, aA.currentExactRad);
        const ptB = polar(ccx, ccy, rAsp - 2, aB.currentExactRad);
        line.setAttribute('x1', ptA.x.toFixed(2));
        line.setAttribute('y1', ptA.y.toFixed(2));
        line.setAttribute('x2', ptB.x.toFixed(2));
        line.setAttribute('y2', ptB.y.toFixed(2));
      }

      if (outerAscLineRef.current && outerAscAnimRef.current) {
        const rad = outerAscAnimRef.current.current;
        const p1 = polar(ccx, ccy, rZI, rad);
        const p2 = polar(ccx, ccy, rOut - 2, rad);
        outerAscLineRef.current.setAttribute('x1', p1.x.toFixed(2));
        outerAscLineRef.current.setAttribute('y1', p1.y.toFixed(2));
        outerAscLineRef.current.setAttribute('x2', p2.x.toFixed(2));
        outerAscLineRef.current.setAttribute('y2', p2.y.toFixed(2));
      }
    }
  };

  const outerAscRad = outerChart
    ? angleForLongitude(outerChart.ascendant, baseChart, wheel2DOrientation)
    : null;

  useEffect(() => {
    const nowMs = performance.now();
    const updateDt = lastTargetUpdateTsRef.current > 0 ? nowMs - lastTargetUpdateTsRef.current : 300;
    lastTargetUpdateTsRef.current = nowMs;

    const animMap = planetAnimMapRef.current;
    const seenKeys = new Set<string>();
    let maxStepAngle = 0;

    const registerPlacement = (
      key: string,
      exactRad: number,
      displayRad: number,
      targetR: number,
      degOffset: number
    ) => {
      seenKeys.add(key);
      const existing = animMap.get(key);
      if (!existing) {
        animMap.set(key, {
          currentExactRad: exactRad,
          targetExactRad: exactRad,
          currentDisplayRad: displayRad,
          targetDisplayRad: displayRad,
          currentR: targetR,
          targetR,
          degOffset,
        });
      } else {
        const diff = Math.abs(shortestAngleDiff(existing.currentExactRad, exactRad));
        if (diff > maxStepAngle) maxStepAngle = diff;
        existing.targetExactRad = exactRad;
        existing.targetDisplayRad = displayRad;
        existing.targetR = targetR;
        existing.degOffset = degOffset;
      }
    };

    const baseDegOffset = outerChart ? -19 : -22;
    for (const p of basePlanetPlacements) {
      registerPlacement(
        `base-${p.planet.id}`,
        p.exactRad,
        p.displayRad,
        rBasePlanets - p.tier * 20,
        baseDegOffset
      );
    }

    for (const p of outerPlanetPlacements) {
      registerPlacement(
        `outer-${p.planet.id}`,
        p.exactRad,
        p.displayRad,
        rOuterPlanets + p.tier * 15,
        17
      );
    }

    // Prune planets no longer in view (e.g., switching off outerChart)
    animMap.forEach((_val, key) => {
      if (!seenKeys.has(key)) animMap.delete(key);
    });

    if (outerAscRad !== null) {
      if (!outerAscAnimRef.current) {
        outerAscAnimRef.current = { current: outerAscRad, target: outerAscRad };
      } else {
        outerAscAnimRef.current.target = outerAscRad;
      }
    } else {
      outerAscAnimRef.current = null;
    }

    // Adaptive orbital damping:
    // - Fast interactive scrubber (<45ms updates): snappy response (lambda = 26)
    // - Continuous playback ticks (45–150ms): silky 60fps flow bridging 65ms frames (lambda = 15)
    // - Discrete clicks / orientation flips (>150ms or big jump): graceful cosmic sweep (lambda = 10.5)
    lambdaRef.current =
      updateDt < 45 && maxStepAngle < 0.25
        ? 26
        : updateDt <= 150 && maxStepAngle < 0.12
          ? 15
          : 10.5;

    const startTick = () => {
      if (rafIdRef.current !== 0) return;
      lastFrameTsRef.current = performance.now();

      const tick = (frameTs: number) => {
        const dtSec = Math.min((frameTs - lastFrameTsRef.current) / 1000, 0.05);
        lastFrameTsRef.current = frameTs;
        const alpha = 1 - Math.exp(-lambdaRef.current * Math.max(dtSec, 0.001));

        let stillMoving = false;

        animMap.forEach((st) => {
          const dExact = shortestAngleDiff(st.currentExactRad, st.targetExactRad);
          const dDisp = shortestAngleDiff(st.currentDisplayRad, st.targetDisplayRad);
          const dR = st.targetR - st.currentR;

          if (Math.abs(dExact) > 0.00012 || Math.abs(dDisp) > 0.00012 || Math.abs(dR) > 0.04) {
            st.currentExactRad += dExact * alpha;
            st.currentDisplayRad += dDisp * alpha;
            st.currentR += dR * alpha;
            stillMoving = true;
          } else {
            st.currentExactRad = st.targetExactRad;
            st.currentDisplayRad = st.targetDisplayRad;
            st.currentR = st.targetR;
          }
        });

        if (outerAscAnimRef.current) {
          const dAsc = shortestAngleDiff(
            outerAscAnimRef.current.current,
            outerAscAnimRef.current.target
          );
          if (Math.abs(dAsc) > 0.00012) {
            outerAscAnimRef.current.current += dAsc * alpha;
            stillMoving = true;
          } else {
            outerAscAnimRef.current.current = outerAscAnimRef.current.target;
          }
        }

        applyFrameToSvgDom();

        if (stillMoving) {
          rafIdRef.current = requestAnimationFrame(tick);
        } else {
          rafIdRef.current = 0;
        }
      };

      rafIdRef.current = requestAnimationFrame(tick);
    };

    startTick();
  }, [basePlanetPlacements, outerPlanetPlacements, outerChart, rBasePlanets, rOuterPlanets, outerAscRad]);

  // Synchronize newly mounted nodes or aspect lists immediately without flicker
  useLayoutEffect(() => {
    applyFrameToSvgDom();
  });

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== 0) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, []);

  const getInitialAnimCoords = (
    key: string,
    fallbackExactRad: number,
    fallbackDisplayRad: number,
    fallbackR: number
  ) => {
    const existing = planetAnimMapRef.current.get(key);
    if (existing) {
      return {
        exactRad: existing.currentExactRad,
        displayRad: existing.currentDisplayRad,
        rNode: existing.currentR,
      };
    }
    return {
      exactRad: fallbackExactRad,
      displayRad: fallbackDisplayRad,
      rNode: fallbackR,
    };
  };

  const ascRad = angleForLongitude(baseChart.ascendant, baseChart, wheel2DOrientation);
  const dscRad = angleForLongitude((baseChart.ascendant + 180) % 360, baseChart, wheel2DOrientation);
  const mcRad = angleForLongitude(baseChart.midheaven, baseChart, wheel2DOrientation);
  const icRad = angleForLongitude((baseChart.midheaven + 180) % 360, baseChart, wheel2DOrientation);

  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const moon = baseChart.planets.find((p) => p.id === 'moon');

  const hoveredPlanetInfo = useMemo(() => {
    if (!hoveredPlanetKey) return null;
    const isOuter = hoveredPlanetKey.startsWith('outer-');
    const id = hoveredPlanetKey.replace(/^(base|outer)-/, '') as PlanetId;
    const list = isOuter ? outerChart?.planets : baseChart.planets;
    const found = list?.find((p) => p.id === id);
    if (!found) return null;
    return {
      planet: found,
      layerLabel: isOuter ? 'Transit / Externe' : 'Thème de base',
    };
  }, [hoveredPlanetKey, baseChart.planets, outerChart]);

  const goldHoverTheme = useMemo(
    () =>
      palette.isLight
        ? {
            rimStroke: '#b45309',
            hairlineStroke: '#f59e0b',
            fillInner: '#f59e0b',
            fillOuter: '#b45309',
            fillInnerOpacity: 0.14,
            fillOuterOpacity: 0.24,
            houseFillInnerOpacity: 0.08,
            houseFillOuterOpacity: 0.2,
            romanHover: '#92400e',
          }
        : {
            rimStroke: '#fbbf24',
            hairlineStroke: '#fef3c7',
            fillInner: '#fde68a',
            fillOuter: '#f59e0b',
            fillInnerOpacity: 0.16,
            fillOuterOpacity: 0.28,
            houseFillInnerOpacity: 0.08,
            houseFillOuterOpacity: 0.22,
            romanHover: '#fde68a',
          },
    [palette.isLight]
  );

  const zodiacSectorGeometries = useMemo(
    () =>
      ZODIAC_SIGNS.map((sign, idx) => {
        const startLon = idx * 30;
        const endLon = startLon + 30;
        const aStart = angleForLongitudeValues(
          startLon,
          baseChart.ascendant,
          baseChart.midheaven,
          wheel2DOrientation
        );
        const aEnd = angleForLongitudeValues(
          endLon,
          baseChart.ascendant,
          baseChart.midheaven,
          wheel2DOrientation
        );
        const pOutStart = polar(cx, cy, rOuter, aStart);
        const pOutEnd = polar(cx, cy, rOuter, aEnd);
        const pInStart = polar(cx, cy, rZodiacInner, aStart);
        const pInEnd = polar(cx, cy, rZodiacInner, aEnd);
        const sectorPath = `M ${pOutStart.x} ${pOutStart.y} A ${rOuter} ${rOuter} 0 0 0 ${pOutEnd.x} ${pOutEnd.y} L ${pInEnd.x} ${pInEnd.y} A ${rZodiacInner} ${rZodiacInner} 0 0 1 ${pInStart.x} ${pInStart.y} Z`;
        return {
          sign,
          chSign: CHINESE_SIGNS_BY_BRANCH[(idx + 3) % 12],
          sectorPath,
        };
      }),
    [cx, cy, rOuter, rZodiacInner, baseChart.ascendant, baseChart.midheaven, wheel2DOrientation]
  );

  const houseSectorGeometries = useMemo(() => {
    if (!showHouses) return [];
    return baseChart.houses.map((house: HouseCusp) => {
      const isAngular =
        house.house === 1 || house.house === 4 || house.house === 7 || house.house === 10;
      const a = angleForLongitude(house.longitude, baseChart, wheel2DOrientation);
      const nextHouse = baseChart.houses[house.house % 12];
      const aNext = angleForLongitude(nextHouse.longitude, baseChart, wheel2DOrientation);
      const pWedgeOutA = polar(cx, cy, rZodiacInner, a);
      const pWedgeOutB = polar(cx, cy, rZodiacInner, aNext);
      const pWedgeInA = polar(cx, cy, rAspect, a);
      const pWedgeInB = polar(cx, cy, rAspect, aNext);

      let span = (nextHouse.longitude - house.longitude + 360) % 360;
      if (span === 0) span = 30;
      const aMid = angleForLongitude(house.longitude + span * 0.5, baseChart, wheel2DOrientation);
      const pIn = polar(cx, cy, rAspect, a);
      const pOut = polar(cx, cy, rZodiacInner, a);
      const pNum = polar(cx, cy, rAspect - 15, aMid);
      const largeArc = span > 180 ? 1 : 0;
      const wedgePath = `M ${pWedgeOutA.x} ${pWedgeOutA.y} A ${rZodiacInner} ${rZodiacInner} 0 ${largeArc} 0 ${pWedgeOutB.x} ${pWedgeOutB.y} L ${pWedgeInB.x} ${pWedgeInB.y} A ${rAspect} ${rAspect} 0 ${largeArc} 1 ${pWedgeInA.x} ${pWedgeInA.y} Z`;

      return {
        house,
        isAngular,
        pIn,
        pOut,
        pNum,
        wedgePath,
      };
    });
  }, [showHouses, baseChart, wheel2DOrientation, cx, cy, rZodiacInner, rAspect]);

  const hoveredHouseInfo = useMemo(() => {
    if (hoveredHouseNum === null) return null;
    return baseChart.houses.find((h) => h.house === hoveredHouseNum) ?? null;
  }, [hoveredHouseNum, baseChart.houses]);

  const hoveredZodiacInfo = useMemo(() => {
    if (hoveredZodiacIdx === null) return null;
    return zodiacSectorGeometries[hoveredZodiacIdx] ?? null;
  }, [hoveredZodiacIdx, zodiacSectorGeometries]);

  return (
    <div
      className={`no-print fixed inset-0 z-10 flex flex-col pt-16 sm:pt-[70px] pb-20 transition-all duration-200 ${
        inspectorOpen ? 'lg:pr-[465px]' : ''
      }`}
      style={{
        background: palette.isLight
          ? 'radial-gradient(circle at center, rgba(30,41,59,0.55) 0%, rgba(8,9,17,0.92) 72%, rgba(8,9,17,0.98) 100%)'
          : 'radial-gradient(circle at center, rgba(24,22,52,0.42) 0%, rgba(8,9,17,0.9) 70%, rgba(8,9,17,0.98) 100%)',
      }}
    >
      <Sky2DBackdrop skyAnimations={skyAnimations} />

      {/* 2D Wheel Selector Bar (PC Study Mode) */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-1 pb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-amber-200/85 mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-300/80" />
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
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-amber-300/50 bg-amber-400/15 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.2)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/30 hover:text-white'
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
            className="rounded-xl border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white cursor-pointer focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
          >
            <option value="ascendant">ASC à gauche (Classique)</option>
            <option value="aries0">0° Bélier à gauche (Naturel)</option>
            <option value="mcTop">MC en haut (Méridien)</option>
          </select>

          <select
            aria-label="Style des glyphes"
            value={signStyle}
            onChange={(e) => onSignStyleChange(e.target.value as ZodiacSignStyle)}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-amber-200 cursor-pointer focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
          >
            {ZODIAC_SIGN_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                Signes : {s.shortLabel}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (onDignityConfigChange) {
                onDignityConfigChange({ showDecans: !showDecanRing });
              } else {
                setLocalDecans((v) => !v);
              }
            }}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
              showDecanRing
                ? 'border-amber-300/45 bg-amber-400/15 text-amber-100'
                : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/30 hover:text-white'
            }`}
          >
            Décans
          </button>

          {onDignityConfigChange && (
            <>
              <button
                type="button"
                onClick={() => onDignityConfigChange({ showTerms: !showTermsRing })}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                  showTermsRing
                    ? 'border-purple-300/45 bg-purple-400/15 text-purple-100'
                    : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/30 hover:text-white'
                }`}
              >
                Termes
              </button>
              <button
                type="button"
                onClick={() => onDignityConfigChange({ showDodecatemoria: !showDodecaRing })}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                  showDodecaRing
                    ? 'border-sky-300/45 bg-sky-400/15 text-sky-100'
                    : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/30 hover:text-white'
                }`}
              >
                Dodéca.
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowDegreesOnWheel((v) => !v)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
              showDegreesOnWheel
                ? 'border-sky-300/45 bg-sky-400/15 text-sky-200'
                : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/30 hover:text-white'
            }`}
          >
            Degrés
          </button>

          {highlightedAspectId && (
            <button
              type="button"
              onClick={() => onHighlightAspect(null)}
              title="Réinitialiser la mise en évidence d’aspect"
              className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300 hover:border-amber-300/30 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-amber-300/80" />
              <span>Aspects</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchTo3D}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Vue 3D / VR</span>
          </button>
        </div>
      </div>

      {/* Main 2D Interactive Chart Stage */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-1">
        <div className="relative h-full w-full flex items-center justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            onMouseLeave={() => {
              setHoveredZodiacIdx(null);
              setHoveredHouseNum(null);
            }}
            className="max-h-full max-w-full w-auto h-full drop-shadow-[0_18px_45px_rgba(0,0,0,0.65)] select-none"
            style={{ fontFamily: 'var(--font-sans), var(--font-glyph)' }}
            role="img"
            aria-label="Roue astrologique interactive en vue 2D"
          >
            <defs>
              <radialGradient id="cosmicCentralSunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.48" />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient
                id="cosmicZodiacHoverFill"
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={rOuter}
              >
                <stop
                  offset={`${Math.round((rZodiacInner / rOuter) * 100)}%`}
                  stopColor={goldHoverTheme.fillInner}
                  stopOpacity={goldHoverTheme.fillInnerOpacity}
                />
                <stop
                  offset="100%"
                  stopColor={goldHoverTheme.fillOuter}
                  stopOpacity={goldHoverTheme.fillOuterOpacity}
                />
              </radialGradient>
              <radialGradient
                id="cosmicHouseHoverFill"
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={rZodiacInner}
              >
                <stop
                  offset={`${Math.round((rAspect / rZodiacInner) * 100)}%`}
                  stopColor={goldHoverTheme.fillInner}
                  stopOpacity={goldHoverTheme.houseFillInnerOpacity}
                />
                <stop
                  offset="100%"
                  stopColor={goldHoverTheme.fillOuter}
                  stopOpacity={goldHoverTheme.houseFillOuterOpacity}
                />
              </radialGradient>
              <filter
                id="cosmicSectorGoldGlow"
                x="-22%"
                y="-22%"
                width="144%"
                height="144%"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="goldBlur" />
                <feMerge>
                  <feMergeNode in="goldBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Memoized Static Dial (Zero re-render during planetary transit ticks) */}
            <StaticZodiacDialLayer
              cx={cx}
              cy={cy}
              rOuter={rOuter}
              rDecanInner={rDecanInner}
              rTermsInner={rTermsInner}
              rDodecaInner={rDodecaInner}
              rTickRing={rTickRing}
              rZodiacInner={rZodiacInner}
              rOuterPlanets={rOuterPlanets}
              rAspect={rAspect}
              hasOuterChart={Boolean(outerChart)}
              ascendant={baseChart.ascendant}
              midheaven={baseChart.midheaven}
              wheel2DOrientation={wheel2DOrientation}
              wheel2DStyle={wheel2DStyle}
              signStyle={signStyle}
              tradition={tradition}
              palette={palette}
              showDecanRing={showDecanRing}
              showTermsRing={showTermsRing}
              termSystem={termSystem}
              showDodecaRing={showDodecaRing}
              showCentralSun={showCentralSun}
              isCompass={isCompass}
            />

            {/* Interactive Zodiac Segments: Subtle Illumination & Reactive Golden Border */}
            <g>
              {zodiacSectorGeometries.map((sec) => (
                <path
                  key={`zodiac-hit-${sec.sign.index}`}
                  d={sec.sectorPath}
                  fill="transparent"
                  onMouseEnter={() => {
                    setHoveredZodiacIdx(sec.sign.index);
                    setHoveredHouseNum(null);
                  }}
                  onMouseLeave={() =>
                    setHoveredZodiacIdx((prev) => (prev === sec.sign.index ? null : prev))
                  }
                />
              ))}
              {zodiacSectorGeometries.map((sec) => {
                const isHoveredZodiac = hoveredZodiacIdx === sec.sign.index;
                return (
                  <g
                    key={`zodiac-glow-${sec.sign.index}`}
                    pointerEvents="none"
                    className="cosmic-wheel-sector-glow"
                    style={{ opacity: isHoveredZodiac ? 1 : 0 }}
                  >
                    <path d={sec.sectorPath} fill="url(#cosmicZodiacHoverFill)" />
                    <path
                      d={sec.sectorPath}
                      fill="none"
                      stroke={goldHoverTheme.rimStroke}
                      strokeWidth={2.1}
                      strokeLinejoin="round"
                      filter="url(#cosmicSectorGoldGlow)"
                    />
                    <path
                      d={sec.sectorPath}
                      fill="none"
                      stroke={goldHoverTheme.hairlineStroke}
                      strokeWidth={0.9}
                      strokeOpacity={0.85}
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
            </g>

            {/* Clickable 12 House Sectors + Cusps */}
            {showHouses &&
              houseSectorGeometries.map(({ house, isAngular, pIn, pOut, pNum, wedgePath }) => {
                const isSelectedHouse = selectedHouseNum === house.house;
                const isHoveredHouse = hoveredHouseNum === house.house;
                const isActiveHouse = isSelectedHouse || isHoveredHouse;

                return (
                  <g
                    key={house.house}
                    onClick={() => onSelectHouse(house.house)}
                    onMouseEnter={() => {
                      setHoveredHouseNum(house.house);
                      setHoveredZodiacIdx(null);
                    }}
                    onMouseLeave={() =>
                      setHoveredHouseNum((prev) => (prev === house.house ? null : prev))
                    }
                    className="cursor-pointer"
                  >
                    <path d={wedgePath} fill="transparent" />
                    <path
                      d={wedgePath}
                      fill="url(#cosmicHouseHoverFill)"
                      pointerEvents="none"
                      className="cosmic-wheel-sector-glow"
                      style={{ opacity: isSelectedHouse ? 1 : isHoveredHouse ? 0.88 : 0 }}
                    />
                    <line
                      x1={pIn.x}
                      y1={pIn.y}
                      x2={pOut.x}
                      y2={pOut.y}
                      stroke={
                        isActiveHouse
                          ? goldHoverTheme.rimStroke
                          : isAngular
                            ? palette.angularLine
                            : palette.houseLine
                      }
                      strokeWidth={isAngular ? 2.1 : isActiveHouse ? 1.35 : 0.95}
                      strokeDasharray={isAngular || isActiveHouse ? undefined : '4,3'}
                      strokeOpacity={isActiveHouse ? 0.92 : isAngular ? 0.95 : 0.78}
                    />
                    <text
                      x={pNum.x}
                      y={pNum.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isSelectedHouse ? 13 : isHoveredHouse ? 12 : 11}
                      fontWeight={isActiveHouse || isAngular ? '700' : '600'}
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="cosmic-wheel-sector-label"
                      fill={
                        isSelectedHouse
                          ? palette.angularLine
                          : isHoveredHouse
                            ? goldHoverTheme.romanHover
                            : palette.textMuted
                      }
                    >
                      {house.roman}
                    </text>
                  </g>
                );
              })}

            {/* Reactive Golden Border Overlay for Hovered / Selected House Sectors */}
            {showHouses &&
              houseSectorGeometries.map(({ house, wedgePath }) => {
                const isSelectedHouse = selectedHouseNum === house.house;
                const isHoveredHouse = hoveredHouseNum === house.house;
                const isActiveHouse = isSelectedHouse || isHoveredHouse;

                return (
                  <g
                    key={`house-gold-border-${house.house}`}
                    pointerEvents="none"
                    className="cosmic-wheel-sector-glow"
                    style={{ opacity: isActiveHouse ? 1 : 0 }}
                  >
                    <path
                      d={wedgePath}
                      fill="none"
                      stroke={goldHoverTheme.rimStroke}
                      strokeWidth={isSelectedHouse ? 2.15 : 1.75}
                      strokeLinejoin="round"
                      filter="url(#cosmicSectorGoldGlow)"
                    />
                    <path
                      d={wedgePath}
                      fill="none"
                      stroke={goldHoverTheme.hairlineStroke}
                      strokeWidth={0.85}
                      strokeOpacity={0.82}
                      strokeLinejoin="round"
                    />
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

            {/* Smoothly Animated Outer Layer ASC Needle */}
            {outerAscRad !== null && (() => {
              const currentAsc = outerAscAnimRef.current?.current ?? outerAscRad;
              const p1 = polar(cx, cy, rZodiacInner, currentAsc);
              const p2 = polar(cx, cy, rOuter - 2, currentAsc);
              return (
                <line
                  ref={outerAscLineRef}
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

            {/* Inner Aspect Chords (Clickable & Live-Interpolated at 60fps) */}
            {visibleInternalAspects.map((asp) => {
              const pA = baseChart.planets.find((p) => p.id === asp.planetA);
              const pB = baseChart.planets.find((p) => p.id === asp.planetB);
              if (!pA || !pB) return null;
              const radA =
                planetAnimMapRef.current.get(`base-${pA.id}`)?.currentExactRad ??
                angleForLongitude(pA.longitude, baseChart, wheel2DOrientation);
              const radB =
                planetAnimMapRef.current.get(`base-${pB.id}`)?.currentExactRad ??
                angleForLongitude(pB.longitude, baseChart, wheel2DOrientation);
              const ptA = polar(cx, cy, rAspect - 2, radA);
              const ptB = polar(cx, cy, rAspect - 2, radB);
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
                    ref={(el) => {
                      if (el) internalAspectRefs.current.set(asp.id, el);
                      else internalAspectRefs.current.delete(asp.id);
                    }}
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
              const radA =
                planetAnimMapRef.current.get(`base-${pA.id}`)?.currentExactRad ??
                angleForLongitude(pA.longitude, baseChart, wheel2DOrientation);
              const radB =
                planetAnimMapRef.current.get(`outer-${pB.id}`)?.currentExactRad ??
                angleForLongitude(pB.longitude, baseChart, wheel2DOrientation);
              const ptA = polar(cx, cy, rAspect - 2, radA);
              const ptB = polar(cx, cy, rAspect - 2, radB);
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
                    ref={(el) => {
                      if (el) compAspectRefs.current.set(asp.id, el);
                      else compAspectRefs.current.delete(asp.id);
                    }}
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

            {/* Base Layer Planets (Smooth Polar 60fps Orbital Transform) */}
            {basePlanetPlacements.map(({ planet, exactRad, displayRad, tier }) => {
              const key = `base-${planet.id}`;
              const targetR = rBasePlanets - tier * 20;
              const { exactRad: eRad, displayRad: dRad, rNode } = getInitialAnimCoords(
                key,
                exactRad,
                displayRad,
                targetR
              );
              const degOffset = outerChart ? -19 : -22;
              const pPos = polar(cx, cy, rNode, dRad);
              const pTickOut = polar(cx, cy, rZodiacInner, eRad);
              const pTickIn = polar(cx, cy, rZodiacInner - 8, eRad);
              const degRelX = Math.cos(dRad) * degOffset;
              const degRelY = Math.sin(dRad) * degOffset;
              const isSelected = selectedPlanetLayer === 'base' && selectedPlanetId === planet.id;
              const isHovered = hoveredPlanetKey === key;
              const planetCssColor = `#${planet.colorHex.toString(16).padStart(6, '0')}`;

              const ensureDomEntry = () => {
                let entry = planetDomMapRef.current.get(key);
                if (!entry) {
                  entry = { badgeGroup: null, tickLine: null, leaderLine: null, degText: null };
                  planetDomMapRef.current.set(key, entry);
                }
                return entry;
              };

              return (
                <g
                  key={key}
                  onClick={() => onSelectPlanet(planet.id, 'base')}
                  onMouseEnter={() => setHoveredPlanetKey(key)}
                  onMouseLeave={() => setHoveredPlanetKey(null)}
                  className="cursor-pointer"
                >
                  <line
                    ref={(el) => {
                      const entry = ensureDomEntry();
                      entry.tickLine = el;
                    }}
                    x1={pTickOut.x}
                    y1={pTickOut.y}
                    x2={pTickIn.x}
                    y2={pTickIn.y}
                    stroke={planetCssColor}
                    strokeWidth={1.6}
                  />
                  <line
                    ref={(el) => {
                      const entry = ensureDomEntry();
                      entry.leaderLine = el;
                    }}
                    x1={pTickIn.x}
                    y1={pTickIn.y}
                    x2={pPos.x}
                    y2={pPos.y}
                    stroke={palette.basePlanetStroke}
                    strokeWidth={0.75}
                    strokeOpacity={0.35}
                  />
                  <g
                    ref={(el) => {
                      const entry = ensureDomEntry();
                      entry.badgeGroup = el;
                    }}
                    transform={`translate(${pPos.x.toFixed(2)}, ${pPos.y.toFixed(2)})`}
                  >
                    {(isSelected || isHovered) && (
                      <circle
                        cx={0}
                        cy={0}
                        r={18}
                        fill={palette.basePlanetStroke}
                        fillOpacity={0.22}
                        stroke={palette.basePlanetStroke}
                        strokeWidth={1.4}
                      />
                    )}
                    <circle
                      cx={0}
                      cy={0}
                      r={13}
                      fill={palette.innerBg}
                      stroke={isSelected ? '#fbbf24' : planetCssColor}
                      strokeWidth={isSelected ? 2 : 1.25}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={15}
                      fontWeight="600"
                      style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}
                      fill={palette.isLight ? '#0f172a' : planetCssColor}
                    >
                      {planet.symbol}
                    </text>
                    {showDegreesOnWheel && (
                      <text
                        ref={(el) => {
                          const entry = ensureDomEntry();
                          entry.degText = el;
                        }}
                        x={degRelX}
                        y={degRelY}
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
                </g>
              );
            })}

            {/* Outer Layer Planets (Smooth Polar 60fps Orbital Transform) */}
            {outerChart &&
              outerPlanetPlacements.map(({ planet, exactRad, displayRad, tier }) => {
                const key = `outer-${planet.id}`;
                const targetR = rOuterPlanets + tier * 15;
                const { exactRad: eRad, displayRad: dRad, rNode } = getInitialAnimCoords(
                  key,
                  exactRad,
                  displayRad,
                  targetR
                );
                const degOffset = 17;
                const pPos = polar(cx, cy, rNode, dRad);
                const pTickOut = polar(cx, cy, rZodiacInner, eRad);
                const pTickIn = polar(cx, cy, rZodiacInner - 6, eRad);
                const degRelX = Math.cos(dRad) * degOffset;
                const degRelY = Math.sin(dRad) * degOffset;
                const isSelected = selectedPlanetLayer === 'outer' && selectedPlanetId === planet.id;
                const isHovered = hoveredPlanetKey === key;

                const ensureDomEntry = () => {
                  let entry = planetDomMapRef.current.get(key);
                  if (!entry) {
                    entry = { badgeGroup: null, tickLine: null, leaderLine: null, degText: null };
                    planetDomMapRef.current.set(key, entry);
                  }
                  return entry;
                };

                return (
                  <g
                    key={key}
                    onClick={() => onSelectPlanet(planet.id, 'outer')}
                    onMouseEnter={() => setHoveredPlanetKey(key)}
                    onMouseLeave={() => setHoveredPlanetKey(null)}
                    className="cursor-pointer"
                  >
                    <line
                      ref={(el) => {
                        const entry = ensureDomEntry();
                        entry.tickLine = el;
                      }}
                      x1={pTickOut.x}
                      y1={pTickOut.y}
                      x2={pTickIn.x}
                      y2={pTickIn.y}
                      stroke={palette.outerPlanetStroke}
                      strokeWidth={1.3}
                      strokeOpacity={0.8}
                    />
                    <line
                      ref={(el) => {
                        const entry = ensureDomEntry();
                        entry.leaderLine = el;
                      }}
                      x1={pTickOut.x}
                      y1={pTickOut.y}
                      x2={pPos.x}
                      y2={pPos.y}
                      stroke={palette.outerPlanetStroke}
                      strokeWidth={0.7}
                      strokeOpacity={0.35}
                    />
                    <g
                      ref={(el) => {
                        const entry = ensureDomEntry();
                        entry.badgeGroup = el;
                      }}
                      transform={`translate(${pPos.x.toFixed(2)}, ${pPos.y.toFixed(2)})`}
                    >
                      {(isSelected || isHovered) && (
                        <circle
                          cx={0}
                          cy={0}
                          r={15}
                          fill={palette.outerPlanetStroke}
                          fillOpacity={0.22}
                          stroke={palette.outerPlanetStroke}
                          strokeWidth={1.4}
                        />
                      )}
                      <circle
                        cx={0}
                        cy={0}
                        r={11.2}
                        fill={palette.innerBg}
                        stroke={palette.outerPlanetStroke}
                        strokeWidth={isSelected ? 2 : 1.15}
                      />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12.5}
                        fontWeight="600"
                        style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}
                        fill={palette.isLight ? '#0369a1' : '#7dd3fc'}
                      >
                        {planet.symbol}
                      </text>
                      {showDegreesOnWheel && (
                        <text
                          ref={(el) => {
                            const entry = ensureDomEntry();
                            entry.degText = el;
                          }}
                          x={degRelX}
                          y={degRelY}
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
                  </g>
                );
              })}

            {/* Pinned Fixed Stars, Arabic Lots & Asteroids Markers */}
            {pinnedCatalogPoints.map((pt) => {
              const rad = angleForLongitude(pt.longitude, baseChart, wheel2DOrientation);
              const pRim = polar(cx, cy, rZodiacInner, rad);
              const pPin = polar(cx, cy, rZodiacInner - 14, rad);
              const pinColor =
                pt.category === 'stars'
                  ? '#fde68a'
                  : pt.category === 'asteroids'
                    ? '#c084fc'
                    : pt.category === 'lots'
                      ? '#34d399'
                      : '#38bdf8';
              return (
                <g key={`pin-${pt.id}`}>
                  <title>{`${pt.name} · ${pt.formattedDeg} ${pt.sign.name} (Maison ${pt.house})`}</title>
                  <line
                    x1={pRim.x}
                    y1={pRim.y}
                    x2={pPin.x}
                    y2={pPin.y}
                    stroke={pinColor}
                    strokeOpacity={0.65}
                    strokeWidth={1}
                  />
                  <circle
                    cx={pPin.x}
                    cy={pPin.y}
                    r={7.5}
                    fill="#080911"
                    stroke={pinColor}
                    strokeWidth={1.1}
                  />
                  <text
                    x={pPin.x}
                    y={pPin.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9}
                    style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}
                    fill={pinColor}
                  >
                    {pt.symbol}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Compact Corner Summary Card on Wide PC Screens + Live Hover Planet HUD */}
          <div className="hidden xl:flex flex-col gap-2 fixed left-5 top-20 z-10 w-64 rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-4 text-xs text-slate-200 shadow-2xl shadow-black/50 hover:border-amber-300/45 transition-all duration-300 pointer-events-auto">
            <div className="font-display text-xs font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
              Carte 2D · {baseChart.cityName}
            </div>
            <div className="text-[11px] leading-relaxed text-slate-300">
              Cliquer une planète, une maison ou un aspect ouvre son interprétation.
            </div>
            <div className="border-t border-white/10 pt-2 space-y-1 text-[11px]">
              <div>
                <span className="text-slate-400">Ascendant : </span>
                <span className="font-semibold text-amber-200">
                  {tradition === 'chinese'
                    ? `${transposeLongitudeToChinese(baseChart.ascendant).sign.branchHanzi}${transposeLongitudeToChinese(baseChart.ascendant).sign.hanzi} ${transposeLongitudeToChinese(baseChart.ascendant).sign.name}`
                    : `${baseChart.ascSign.symbol} ${baseChart.ascSign.name}`}
                </span>
              </div>
              {sun && (
                <div>
                  <span className="text-slate-400">Soleil : </span>
                  <span className="font-semibold text-slate-100">
                    {sun.formattedDeg} {sun.sign.name}
                  </span>
                </div>
              )}
              {moon && (
                <div>
                  <span className="text-slate-400">Lune : </span>
                  <span className="font-semibold text-slate-100">
                    {moon.formattedDeg} {moon.sign.name}
                  </span>
                </div>
              )}
            </div>

            {hoveredPlanetInfo && (
              <div className="mt-1 rounded-2xl border border-amber-300/35 bg-[#0a0d17]/90 p-2.5 text-[11px] space-y-0.5">
                <div className="text-[10px] uppercase tracking-wider text-sky-300">
                  {hoveredPlanetInfo.layerLabel}
                </div>
                <div className="font-semibold text-amber-100 flex items-center gap-1.5">
                  <span style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}>
                    {hoveredPlanetInfo.planet.symbol}
                  </span>
                  <span>
                    {hoveredPlanetInfo.planet.name}
                    {hoveredPlanetInfo.planet.retrograde ? ' ℞' : ''}
                  </span>
                </div>
                <div className="font-mono-tabular text-slate-300">
                  {hoveredPlanetInfo.planet.formattedDeg} {hoveredPlanetInfo.planet.sign.name} · Maison{' '}
                  {hoveredPlanetInfo.planet.house}
                </div>
              </div>
            )}

            {!hoveredPlanetInfo && hoveredHouseInfo && (
              <div className="mt-1 rounded-2xl border border-amber-300/35 bg-[#0a0d17]/90 p-2.5 text-[11px] space-y-0.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300">
                  Secteur · Maison {hoveredHouseInfo.roman}
                </div>
                <div className="font-semibold text-amber-100">
                  {hoveredHouseInfo.title}
                </div>
                <div className="font-mono-tabular text-slate-300">
                  Cuspide : {hoveredHouseInfo.formattedDeg} {hoveredHouseInfo.sign.name}
                </div>
              </div>
            )}

            {!hoveredPlanetInfo && !hoveredHouseInfo && hoveredZodiacInfo && (
              <div className="mt-1 rounded-2xl border border-amber-300/35 bg-[#0a0d17]/90 p-2.5 text-[11px] space-y-0.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300">
                  Segment Zodiacal
                </div>
                <div className="font-semibold text-amber-100 flex items-center gap-1.5">
                  {tradition === 'chinese' ? (
                    <>
                      <span>{hoveredZodiacInfo.chSign.hanzi}</span>
                      <span>
                        {hoveredZodiacInfo.chSign.name} ({hoveredZodiacInfo.sign.name})
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}>
                        {hoveredZodiacInfo.sign.symbol}
                      </span>
                      <span>{hoveredZodiacInfo.sign.name}</span>
                    </>
                  )}
                </div>
                <div className="text-slate-300">
                  {hoveredZodiacInfo.sign.element} · {hoveredZodiacInfo.sign.modality} · Maître :{' '}
                  {hoveredZodiacInfo.sign.ruler}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacetime Navigator Slot right under the interactive wheel */}
      {spacetimeSlot && (
        <div className="relative z-20 mx-auto w-full max-w-4xl px-3 pt-1">
          {spacetimeSlot}
        </div>
      )}
    </div>
  );
};
