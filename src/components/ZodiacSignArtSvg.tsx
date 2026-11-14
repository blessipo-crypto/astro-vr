import React from 'react';
import { ElementType } from '../astro/astroEngine';
import {
  CALLIGRAPHIC_SIGN_PATHS,
  FIGURATIVE_SIGN_PATHS,
  ZodiacSignStyle,
} from '../astro/zodiacSignArt';

interface ZodiacSignArtSvgProps {
  signIndex: number;
  element?: ElementType;
  style?: ZodiacSignStyle;
  size?: number;
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}

function getGemHex(el: ElementType = 'Feu'): string {
  if (el === 'Feu') return '#f97316';
  if (el === 'Terre') return '#34d399';
  if (el === 'Air') return '#38bdf8';
  return '#818cf8';
}

export const ZodiacSignArtSvg: React.FC<ZodiacSignArtSvgProps> = ({
  signIndex,
  element = 'Feu',
  style = 'figurative',
  size = 24,
  className,
  primaryColor = '#f3d67a',
  accentColor = '#d4af37',
}) => {
  const idx = ((signIndex % 12) + 12) % 12;
  const spec = style === 'figurative' ? FIGURATIVE_SIGN_PATHS[idx] : CALLIGRAPHIC_SIGN_PATHS[idx];
  const gem = getGemHex(element);
  const strokeW = style === 'minimal' ? 7 : style === 'figurative' ? 8.5 : 10;
  const strokeCol = style === 'minimal' ? '#e2e8f0' : primaryColor;
  const innerScale = style === 'jewel' ? 0.68 : 0.78;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      className={className}
      aria-hidden="true"
    >
      {style === 'jewel' && (
        <>
          <circle cx={0} cy={0} r={90} fill="none" stroke={accentColor} strokeWidth={4} strokeOpacity={0.75} />
          <circle cx={0} cy={0} r={74} fill={gem} fillOpacity={0.14} stroke={gem} strokeWidth={3} strokeOpacity={0.7} />
          {Array.from({ length: 12 }, (_, p) => {
            const a = (p * Math.PI) / 6;
            return (
              <line
                key={p}
                x1={Math.cos(a) * 62}
                y1={Math.sin(a) * 62}
                x2={Math.cos(a) * 90}
                y2={Math.sin(a) * 90}
                stroke={accentColor}
                strokeWidth={2.5}
                strokeOpacity={0.55}
              />
            );
          })}
        </>
      )}

      {style === 'figurative' && (
        <circle cx={0} cy={0} r={90} fill={primaryColor} fillOpacity={0.08} stroke={accentColor} strokeWidth={3.5} strokeOpacity={0.65} />
      )}

      {style === 'minimal' && (
        <circle cx={0} cy={0} r={88} fill="none" stroke={accentColor} strokeWidth={2.5} strokeOpacity={0.45} />
      )}

      <g transform={`scale(${innerScale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {spec.strokes.map((d, i) => (
          <path key={i} d={d} stroke={strokeCol} strokeWidth={strokeW} />
        ))}
        {spec.circles?.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={c.fill ? strokeCol : 'none'}
            stroke={c.fill ? 'none' : strokeCol}
            strokeWidth={c.fill ? 0 : strokeW}
          />
        ))}
      </g>
    </svg>
  );
};
