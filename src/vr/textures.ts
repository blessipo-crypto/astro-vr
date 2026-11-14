import * as THREE from 'three';
import { AstroChart, HouseCusp, PlanetId, PlanetPosition, ZODIAC_SIGNS } from '../astro/astroEngine';
import {
  calculateBaziSummary,
  CHINESE_SIGNS_BY_WESTERN_INDEX,
  transposeLongitudeToChinese,
  ZodiacTradition,
} from '../astro/chineseAstrology';
import {
  drawChineseSignArtworkOnCanvas,
  drawWesternSignArtworkOnCanvas,
  ZODIAC_SIGN_STYLES,
  ZodiacSignStyle,
} from '../astro/zodiacSignArt';

export { ZODIAC_SIGN_STYLES };
export type { ZodiacSignStyle };

export type ZodiacWheelStyle = 'astrolabe' | 'enamel' | 'celestial' | 'horology';
export type StarfieldBackdropStyle = 'milkyway' | 'nebula' | 'deepnight' | 'auroral';

export interface ZodiacWheelStyleMeta {
  id: ZodiacWheelStyle;
  label: string;
  shortLabel: string;
  description: string;
  swatchPrimary: string;
  swatchAccent: string;
}

export interface StarfieldStyleMeta {
  id: StarfieldBackdropStyle;
  label: string;
  shortLabel: string;
  description: string;
  swatchPrimary: string;
  swatchAccent: string;
}

export const ZODIAC_WHEEL_STYLES: ZodiacWheelStyleMeta[] = [
  {
    id: 'astrolabe',
    label: 'Astrolabe Royal',
    shortLabel: 'Astrolabe',
    description: 'Obsidienne gravée, laiton guilloché, décans I·II·III & vernier 1°',
    swatchPrimary: '#0f172a',
    swatchAccent: '#d4af37',
  },
  {
    id: 'enamel',
    label: 'Émail Vitrail',
    shortLabel: 'Vitrail',
    description: 'Cloisonné or, arcades gothiques & émaux élémentaires lumineux',
    swatchPrimary: '#3b1c32',
    swatchAccent: '#fbbf24',
  },
  {
    id: 'celestial',
    label: 'Voûte Stellaire',
    shortLabel: 'Stellaire',
    description: 'Cartographie astronomique, constellations tracées & grille cyan',
    swatchPrimary: '#071329',
    swatchAccent: '#38bdf8',
  },
  {
    id: 'horology',
    label: 'Haute Horlogerie',
    shortLabel: 'Horlogerie',
    description: 'Cadran anthracite soleillé, index bâtons & or champagne épuré',
    swatchPrimary: '#18181b',
    swatchAccent: '#e7cfa0',
  },
];

export const STARFIELD_BACKDROP_STYLES: StarfieldStyleMeta[] = [
  {
    id: 'milkyway',
    label: 'Voie Lactée Réaliste',
    shortLabel: 'Voie Lactée',
    description: 'Bande galactique inclinée, cœur doré du Sagittaire & failles sombres',
    swatchPrimary: '#070b18',
    swatchAccent: '#f5d08a',
  },
  {
    id: 'nebula',
    label: 'Nébuleuses & Carène',
    shortLabel: 'Nébuleuses',
    description: 'Nuages cosmiques bleu saphir, filaments H-II & amas stellaires',
    swatchPrimary: '#0b0e24',
    swatchAccent: '#60a5fa',
  },
  {
    id: 'deepnight',
    label: 'Nuit Astronomique Pure',
    shortLabel: 'Nuit Pure',
    description: 'Ciel d’observatoire haute pureté, lumière zodiacale & spectre stellaire',
    swatchPrimary: '#03050c',
    swatchAccent: '#cbd5e1',
  },
  {
    id: 'auroral',
    label: 'Aurore & Voie Lactée',
    shortLabel: 'Aurores',
    description: 'Voie Lactée boréale traversée de voiles auroraux émeraude et violet',
    swatchPrimary: '#05141a',
    swatchAccent: '#34d399',
  },
];

const PLANET_RULER_SYMBOLS: Record<string, string> = {
  Soleil: '☉',
  Lune: '☽',
  Mercure: '☿',
  Vénus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturne: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluton: '♇',
};

// Authentic miniature asterism points (normalized x in [0..1], y in [0..1] inside each sign panel)
export const ZODIAC_CONSTELLATION_POINTS: Array<Array<[number, number]>> = [
  // 0 Bélier (Aries)
  [[0.22, 0.36], [0.52, 0.32], [0.72, 0.44], [0.78, 0.56]],
  // 1 Taureau (Taurus - V-shape Hyades + Pleiades)
  [[0.18, 0.28], [0.46, 0.48], [0.78, 0.34], [0.46, 0.48], [0.34, 0.68], [0.20, 0.76]],
  // 2 Gémeaux (Gemini - Castor & Pollux twin lines)
  [[0.32, 0.24], [0.34, 0.46], [0.28, 0.72], [0.42, 0.76], [0.34, 0.46], [0.66, 0.44], [0.68, 0.24], [0.66, 0.44], [0.72, 0.72]],
  // 3 Cancer (Cancer - inverted Y)
  [[0.50, 0.26], [0.50, 0.48], [0.30, 0.72], [0.50, 0.48], [0.72, 0.70]],
  // 4 Lion (Leo - Sickle + triangle tail)
  [[0.34, 0.24], [0.26, 0.34], [0.30, 0.48], [0.44, 0.50], [0.48, 0.36], [0.44, 0.50], [0.72, 0.46], [0.82, 0.60], [0.58, 0.68], [0.44, 0.50]],
  // 5 Vierge (Virgo)
  [[0.22, 0.38], [0.42, 0.46], [0.58, 0.36], [0.74, 0.48], [0.58, 0.66], [0.42, 0.46], [0.30, 0.70]],
  // 6 Balance (Libra - diamond scale)
  [[0.50, 0.26], [0.28, 0.48], [0.50, 0.66], [0.72, 0.48], [0.50, 0.26], [0.34, 0.78], [0.68, 0.78]],
  // 7 Scorpion (Scorpio - hook tail)
  [[0.22, 0.30], [0.30, 0.42], [0.24, 0.58], [0.30, 0.42], [0.46, 0.44], [0.58, 0.58], [0.68, 0.72], [0.78, 0.66], [0.75, 0.56]],
  // 8 Sagittaire (Sagittarius - Teapot)
  [[0.26, 0.58], [0.40, 0.42], [0.56, 0.42], [0.72, 0.56], [0.58, 0.68], [0.38, 0.68], [0.26, 0.58], [0.48, 0.28], [0.56, 0.42]],
  // 9 Capricorne (Capricorn - horned triangle)
  [[0.22, 0.34], [0.52, 0.40], [0.78, 0.32], [0.64, 0.64], [0.42, 0.68], [0.22, 0.34]],
  // 10 Verseau (Aquarius - water bearer zig)
  [[0.22, 0.34], [0.38, 0.28], [0.52, 0.44], [0.68, 0.38], [0.78, 0.54], [0.62, 0.68], [0.44, 0.62]],
  // 11 Poissons (Pisces - V cord)
  [[0.20, 0.32], [0.34, 0.54], [0.50, 0.74], [0.68, 0.52], [0.80, 0.36], [0.74, 0.28], [0.68, 0.52]],
];

function configureColorTexture(canvas: HTMLCanvasElement, maxAniso: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

function makeRng(seedInit: number): () => number {
  let seed = seedInit >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) || 200;
  const g = parseInt(full.slice(2, 4), 16) || 180;
  const b = parseInt(full.slice(4, 6), 16) || 120;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createZodiacWheelTextures(options: {
  style: ZodiacWheelStyle;
  signStyle?: ZodiacSignStyle;
  tradition: ZodiacTradition;
  maxAniso: number;
  maxTexSize?: number;
}): {
  bandTexture: THREE.CanvasTexture;
  collarTexture: THREE.CanvasTexture;
} {
  const { style, signStyle = 'figurative', tradition, maxAniso, maxTexSize = 4096 } = options;
  const width = Math.min(4096, Math.max(2048, maxTexSize));
  const bandHeight = 512;
  const collarHeight = 256;

  // 1. Vertical Band Canvas (4096 x 512)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = bandHeight;
  const ctx = canvas.getContext('2d')!;

  const isChinese = tradition === 'chinese';

  // Background per wheel style
  const bg = ctx.createLinearGradient(0, 0, 0, bandHeight);
  if (style === 'astrolabe') {
    bg.addColorStop(0, isChinese ? '#130b10' : '#080e1d');
    bg.addColorStop(0.5, isChinese ? '#1d1018' : '#101a34');
    bg.addColorStop(1, isChinese ? '#09070e' : '#060a15');
  } else if (style === 'enamel') {
    bg.addColorStop(0, '#0f0b18');
    bg.addColorStop(0.5, '#191327');
    bg.addColorStop(1, '#090710');
  } else if (style === 'celestial') {
    bg.addColorStop(0, '#040a1a');
    bg.addColorStop(0.5, '#091734');
    bg.addColorStop(1, '#030814');
  } else {
    // horology
    bg.addColorStop(0, '#101116');
    bg.addColorStop(0.5, '#1a1c24');
    bg.addColorStop(1, '#0c0d11');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, bandHeight);

  // Subtle horizontal guilloché / brushed grain lines
  ctx.strokeStyle =
    style === 'celestial'
      ? 'rgba(125, 211, 252, 0.045)'
      : style === 'horology'
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(212, 175, 55, 0.04)';
  ctx.lineWidth = 1;
  for (let y = 32; y < bandHeight - 32; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Framing bezels along top and bottom
  const primaryRim =
    style === 'celestial' ? '#93c5fd' : style === 'horology' ? '#e5d3a7' : '#d4af37';
  const secondaryRim =
    style === 'celestial'
      ? 'rgba(56, 189, 248, 0.45)'
      : style === 'horology'
        ? 'rgba(229, 211, 167, 0.32)'
        : 'rgba(212, 175, 55, 0.48)';

  ctx.fillStyle = primaryRim;
  ctx.fillRect(0, 0, width, 10);
  ctx.fillRect(0, bandHeight - 10, width, 10);
  ctx.fillStyle = secondaryRim;
  ctx.fillRect(0, 22, width, 3);
  ctx.fillRect(0, bandHeight - 25, width, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 32, width, 1);
  ctx.fillRect(0, bandHeight - 76, width, 1.5);

  const sectorW = width / 12;
  const rand = makeRng(style === 'celestial' ? 9182 : 4471);

  for (let i = 0; i < 12; i++) {
    const sign = ZODIAC_SIGNS[i];
    const ch = CHINESE_SIGNS_BY_WESTERN_INDEX[i];
    const accentHex = isChinese ? ch.color : sign.color;
    const x0 = i * sectorW;
    const cx = x0 + sectorW * 0.5;

    // 1. Style-specific sector artwork
    if (style === 'enamel') {
      // Rich jewel-toned stained glass radial gradient inside cloisonné arch
      const radGrad = ctx.createRadialGradient(cx, bandHeight * 0.46, 12, cx, bandHeight * 0.46, sectorW * 0.65);
      radGrad.addColorStop(0, hexToRgba(accentHex, 0.42));
      radGrad.addColorStop(0.55, hexToRgba(accentHex, 0.22));
      radGrad.addColorStop(1, 'rgba(9, 7, 16, 0.15)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(x0 + 4, 25, sectorW - 8, bandHeight - 101);

      // Gold cloisonné gothic arch & corner filigree
      ctx.strokeStyle = 'rgba(245, 198, 86, 0.72)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0 + 18, bandHeight - 84);
      ctx.lineTo(x0 + 18, 120);
      ctx.quadraticCurveTo(cx, 38, x0 + sectorW - 18, 120);
      ctx.lineTo(x0 + sectorW - 18, bandHeight - 84);
      ctx.stroke();

      // Inner hairline halo around glyph
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.32)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, bandHeight * 0.39, 68, 0, Math.PI * 2);
      ctx.stroke();
    } else if (style === 'celestial') {
      // Subtle astronomical coordinate graticule
      ctx.fillStyle = hexToRgba(accentHex, 0.08);
      ctx.fillRect(x0, 25, sectorW, bandHeight - 101);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      for (let g = 1; g <= 2; g++) {
        const gx = x0 + (g * sectorW) / 3;
        ctx.beginPath();
        ctx.moveTo(gx, 25);
        ctx.lineTo(gx, bandHeight - 76);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x0, bandHeight * 0.44);
      ctx.lineTo(x0 + sectorW, bandHeight * 0.44);
      ctx.stroke();

      // Micro starfield inside panel
      for (let s = 0; s < 22; s++) {
        const sx = x0 + 12 + rand() * (sectorW - 24);
        const sy = 36 + rand() * (bandHeight - 125);
        const sr = 0.8 + rand() * 1.6;
        ctx.fillStyle = `rgba(224, 242, 254, ${0.25 + rand() * 0.55})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Authentic constellation stick-figure outline!
      const pts = ZODIAC_CONSTELLATION_POINTS[i];
      if (pts && pts.length > 1) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.52)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        pts.forEach(([px, py], idx) => {
          const ux = x0 + px * sectorW;
          const uy = 42 + py * (bandHeight - 150);
          if (idx === 0) ctx.moveTo(ux, uy);
          else ctx.lineTo(ux, uy);
        });
        ctx.stroke();

        pts.forEach(([px, py]) => {
          const ux = x0 + px * sectorW;
          const uy = 42 + py * (bandHeight - 150);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ux, uy, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.arc(ux, uy, 6.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else if (style === 'astrolabe') {
      // Subtle elemental tint + double concentric brass medallion
      ctx.fillStyle = hexToRgba(accentHex, 0.13);
      ctx.fillRect(x0, 25, sectorW, bandHeight - 101);

      // Engraved decan dividing arcs (I · II · III)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1.5;
      for (const frac of [1 / 3, 2 / 3]) {
        const dx = x0 + frac * sectorW;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(dx, 32);
        ctx.lineTo(dx, bandHeight - 76);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Roman decan numerals along top
      const decans = ['I', 'II', 'III'];
      ctx.fillStyle = 'rgba(231, 207, 160, 0.72)';
      ctx.font = '600 18px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      decans.forEach((rom, dIdx) => {
        ctx.fillText(rom, x0 + ((dIdx + 0.5) * sectorW) / 3, 46);
      });

      // Brass medallion behind glyph
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, bandHeight * 0.41, 66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)';
      ctx.beginPath();
      ctx.arc(cx, bandHeight * 0.41, 76, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // horology: ultra-clean slate sunray + hairline borders
      const sunray = ctx.createLinearGradient(x0, 25, x0 + sectorW, bandHeight - 76);
      sunray.addColorStop(0, 'rgba(255,255,255,0.03)');
      sunray.addColorStop(0.5, hexToRgba(accentHex, 0.08));
      sunray.addColorStop(1, 'rgba(255,255,255,0.01)');
      ctx.fillStyle = sunray;
      ctx.fillRect(x0, 25, sectorW, bandHeight - 101);
    }

    // 2. Vertical Cusp Divider & Lozenge / Baton
    ctx.strokeStyle = primaryRim;
    ctx.lineWidth = style === 'horology' ? 2.5 : 4;
    ctx.beginPath();
    ctx.moveTo(x0, 10);
    ctx.lineTo(x0, bandHeight - 10);
    ctx.stroke();

    if (style === 'astrolabe' || style === 'enamel') {
      // Diamond cusp ornament
      ctx.fillStyle = primaryRim;
      ctx.beginPath();
      ctx.moveTo(x0, 44);
      ctx.lineTo(x0 + 8, 56);
      ctx.lineTo(x0, 68);
      ctx.lineTo(x0 - 8, 56);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Precision 1° / 5° / 10° Vernier Scale along bottom edge
    for (let deg = 0; deg < 30; deg++) {
      const tx = x0 + (deg / 30) * sectorW;
      const isTen = deg === 10 || deg === 20;
      const isFive = deg % 5 === 0;
      const tickH = deg === 0 ? 48 : isTen ? 38 : isFive ? 26 : 14;
      ctx.strokeStyle =
        deg === 0 || isTen
          ? primaryRim
          : isFive
            ? 'rgba(248, 243, 230, 0.78)'
            : 'rgba(203, 213, 225, 0.42)';
      ctx.lineWidth = deg === 0 ? 3 : isTen ? 2.4 : isFive ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(tx, bandHeight - 25);
      ctx.lineTo(tx, bandHeight - 25 - tickH);
      ctx.stroke();

      if (deg === 10 || deg === 20) {
        ctx.fillStyle = style === 'celestial' ? '#bae6fd' : '#e7cfa0';
        ctx.font = '600 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${deg}°`, tx, bandHeight - 66);
      }
    }

    // 4. Sculpted Vector Sign Artwork + Sign Name + Ruling Planet / Element metadata
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const emblemPrimary =
      style === 'celestial' ? '#bae6fd' : style === 'horology' ? '#f8f3e6' : '#f5d076';
    const emblemAccent = style === 'celestial' ? '#38bdf8' : primaryRim;

    if (isChinese) {
      drawChineseSignArtworkOnCanvas({
        ctx,
        ch,
        cx,
        cy: bandHeight * 0.34,
        radius: 92,
        style: signStyle,
        primaryColor: emblemPrimary,
      });

      ctx.fillStyle = style === 'celestial' ? '#7dd3fc' : '#fbbf24';
      ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(ch.name.toUpperCase(), cx, bandHeight * 0.61);

      ctx.fillStyle = ch.color;
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(`${ch.wuXing.toUpperCase()} · ${ch.polarity.toUpperCase()}`, cx, bandHeight * 0.72);
    } else {
      drawWesternSignArtworkOnCanvas({
        ctx,
        signIndex: i,
        element: sign.element,
        cx,
        cy: bandHeight * 0.34,
        radius: 96,
        style: signStyle,
        primaryColor: emblemPrimary,
        accentColor: emblemAccent,
      });

      ctx.fillStyle = style === 'celestial' ? '#e0f2fe' : '#f3d67a';
      ctx.font = '700 31px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(sign.name.toUpperCase(), cx, bandHeight * 0.61);

      const rulerGlyph = PLANET_RULER_SYMBOLS[sign.ruler] ?? '';
      ctx.fillStyle =
        style === 'horology'
          ? '#a1a1aa'
          : style === 'celestial'
            ? '#7dd3fc'
            : hexToRgba(sign.color, 0.92);
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(`${sign.element.toUpperCase()} · ${sign.modality.toUpperCase()} · ${rulerGlyph}`, cx, bandHeight * 0.72);
    }
  }

  const bandTexture = configureColorTexture(canvas, maxAniso);
  bandTexture.wrapS = THREE.RepeatWrapping;
  bandTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 2. Horizontal Degree Collar Texture (4096 x 256)
  // v = 0 -> inner radius, v = 1 -> outer radius (canvas top = outer radius, canvas bottom = inner radius)
  const collarCanvas = document.createElement('canvas');
  collarCanvas.width = width;
  collarCanvas.height = collarHeight;
  const cctx = collarCanvas.getContext('2d')!;

  const cbg = cctx.createLinearGradient(0, 0, 0, collarHeight);
  if (style === 'celestial') {
    cbg.addColorStop(0, '#07152e');
    cbg.addColorStop(1, '#040917');
  } else if (style === 'enamel') {
    cbg.addColorStop(0, '#181026');
    cbg.addColorStop(1, '#0a0714');
  } else if (style === 'horology') {
    cbg.addColorStop(0, '#191b22');
    cbg.addColorStop(1, '#0d0e13');
  } else {
    cbg.addColorStop(0, '#111a33');
    cbg.addColorStop(1, '#080c19');
  }
  cctx.fillStyle = cbg;
  cctx.fillRect(0, 0, width, collarHeight);

  // Outer & inner gilt rings
  cctx.fillStyle = primaryRim;
  cctx.fillRect(0, 0, width, 6);
  cctx.fillRect(0, collarHeight - 6, width, 6);
  cctx.fillStyle = secondaryRim;
  cctx.fillRect(0, 64, width, 2);

  for (let i = 0; i < 12; i++) {
    const sign = ZODIAC_SIGNS[i];
    const ch = CHINESE_SIGNS_BY_WESTERN_INDEX[i];
    const x0 = i * sectorW;
    const cx = x0 + sectorW * 0.5;
    const tint = isChinese ? ch.color : sign.color;

    cctx.fillStyle = hexToRgba(tint, style === 'enamel' ? 0.24 : 0.1);
    cctx.fillRect(x0, 6, sectorW, collarHeight - 12);

    // Sector line
    cctx.strokeStyle = primaryRim;
    cctx.lineWidth = 3.5;
    cctx.beginPath();
    cctx.moveTo(x0, 0);
    cctx.lineTo(x0, collarHeight);
    cctx.stroke();

    // 1° / 5° / 10° precision ticks along inner ring edge (facing center!)
    for (let deg = 0; deg < 30; deg++) {
      const tx = x0 + (deg / 30) * sectorW;
      const isTen = deg === 10 || deg === 20;
      const isFive = deg % 5 === 0;
      const tickH = deg === 0 ? 52 : isTen ? 40 : isFive ? 28 : 16;
      cctx.strokeStyle =
        deg === 0 || isTen ? primaryRim : isFive ? '#f8f3e6' : 'rgba(203, 213, 225, 0.48)';
      cctx.lineWidth = deg === 0 ? 3 : isTen ? 2 : 1.1;
      cctx.beginPath();
      cctx.moveTo(tx, collarHeight - 6);
      cctx.lineTo(tx, collarHeight - 6 - tickH);
      cctx.stroke();
    }

    // Readable overhead sculpted sign artwork & name on collar
    const collarPrimary =
      style === 'celestial' ? '#bae6fd' : style === 'horology' ? '#f8f3e6' : '#f5d076';
    const collarAccent = style === 'celestial' ? '#38bdf8' : primaryRim;

    if (isChinese) {
      drawChineseSignArtworkOnCanvas({
        ctx: cctx,
        ch,
        cx,
        cy: collarHeight * 0.33,
        radius: 44,
        style: signStyle,
        primaryColor: collarPrimary,
      });
    } else {
      drawWesternSignArtworkOnCanvas({
        ctx: cctx,
        signIndex: i,
        element: sign.element,
        cx,
        cy: collarHeight * 0.33,
        radius: 46,
        style: signStyle,
        primaryColor: collarPrimary,
        accentColor: collarAccent,
      });
    }

    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillStyle = primaryRim;
    cctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    cctx.fillText((isChinese ? ch.name : sign.name).toUpperCase(), cx, collarHeight * 0.64);
  }

  const collarTexture = configureColorTexture(collarCanvas, maxAniso);
  collarTexture.wrapS = THREE.RepeatWrapping;
  collarTexture.wrapT = THREE.ClampToEdgeWrapping;

  return { bandTexture, collarTexture };
}

// Legacy thin wrappers preserved for compatibility
export function createZodiacBandTexture(maxAniso: number): THREE.CanvasTexture {
  return createZodiacWheelTextures({ style: 'astrolabe', tradition: 'western', maxAniso }).bandTexture;
}

export function createChineseZodiacBandTexture(maxAniso: number): THREE.CanvasTexture {
  return createZodiacWheelTextures({ style: 'astrolabe', tradition: 'chinese', maxAniso }).bandTexture;
}

export function createStarfieldBackdropTexture(
  style: StarfieldBackdropStyle,
  maxAniso: number
): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const rand = makeRng(
    style === 'milkyway' ? 20261 : style === 'nebula' ? 88412 : style === 'auroral' ? 55913 : 11209
  );

  // Base deep space gradient (zenith -> horizon glow)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (style === 'nebula') {
    skyGrad.addColorStop(0, '#040614');
    skyGrad.addColorStop(0.55, '#070b20');
    skyGrad.addColorStop(1, '#0c132c');
  } else if (style === 'auroral') {
    skyGrad.addColorStop(0, '#02050f');
    skyGrad.addColorStop(0.6, '#06111f');
    skyGrad.addColorStop(1, '#091d22');
  } else if (style === 'deepnight') {
    skyGrad.addColorStop(0, '#010308');
    skyGrad.addColorStop(0.75, '#030712');
    skyGrad.addColorStop(1, '#070d1c');
  } else {
    // milkyway
    skyGrad.addColorStop(0, '#02040b');
    skyGrad.addColorStop(0.55, '#040816');
    skyGrad.addColorStop(1, '#081022');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper: map 3D galactic-plane tilted band into equirectangular (x, y)
  // Galactic plane tilted ~60 deg across sky
  const tilt = 0.96; // radians (~55 deg)
  const phase = 1.1;

  const galacticYAtX = (xNorm: number): number => {
    const lon = xNorm * Math.PI * 2;
    const lat = Math.atan(Math.tan(tilt) * Math.sin(lon + phase));
    return (0.5 - lat / Math.PI) * height;
  };

  if (style === 'milkyway' || style === 'auroral' || style === 'nebula') {
    // Soft glowing Milky Way band along tilted great circle
    const steps = style === 'nebula' ? 520 : 420;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = t * width;
      const baseY = galacticYAtX(t);
      const bulgeFactor = Math.exp(-Math.pow((t - 0.36) * 4.5, 2)); // Sagittarius core glow
      const spreadY = (44 + rand() * 78) * (1 + bulgeFactor * 0.75);
      const y = baseY + (rand() - 0.5) * spreadY * 1.3;
      const radius = 36 + rand() * 88 + bulgeFactor * 45;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      if (style === 'nebula') {
        const hue = i % 3 === 0 ? '56, 189, 248' : i % 3 === 1 ? '168, 85, 247' : '244, 114, 182';
        grad.addColorStop(0, `rgba(${hue}, ${0.09 + bulgeFactor * 0.08})`);
        grad.addColorStop(0.5, `rgba(${hue}, 0.03)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (bulgeFactor > 0.35 && rand() > 0.32) {
        // Warm golden-amber Galactic Core (Sagittarius)
        grad.addColorStop(0, `rgba(253, 224, 158, ${0.11 + bulgeFactor * 0.1})`);
        grad.addColorStop(0.45, `rgba(180, 142, 110, ${0.05 + bulgeFactor * 0.04})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Cool silvery-sapphire spiral arm dust
        grad.addColorStop(0, `rgba(165, 198, 255, ${0.075 + rand() * 0.04})`);
        grad.addColorStop(0.5, 'rgba(99, 132, 210, 0.025)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Great Rift dark cosmic dust lanes slicing through the Milky Way core
    for (let i = 0; i < 95; i++) {
      const t = (0.14 + rand() * 0.65) % 1;
      const x = t * width;
      const y = galacticYAtX(t) + (rand() - 0.5) * 26;
      const rx = 24 + rand() * 68;
      const ry = 8 + rand() * 18;
      const dark = ctx.createRadialGradient(x, y, 0, x, y, rx);
      dark.addColorStop(0, `rgba(3, 5, 14, ${0.42 + rand() * 0.28})`);
      dark.addColorStop(1, 'rgba(3, 5, 14, 0)');
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rand() - 0.5) * 0.4);
      ctx.scale(1, ry / rx);
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Subtle Zodiacal Light along celestial equator in Deep Night / Milky Way
  if (style === 'deepnight' || style === 'milkyway') {
    const zGrad = ctx.createLinearGradient(0, height * 0.42, 0, height * 0.58);
    zGrad.addColorStop(0, 'rgba(148, 163, 184, 0)');
    zGrad.addColorStop(0.5, style === 'deepnight' ? 'rgba(186, 206, 240, 0.045)' : 'rgba(220, 210, 180, 0.035)');
    zGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
    ctx.fillStyle = zGrad;
    ctx.fillRect(0, height * 0.42, width, height * 0.16);
  }

  // Aurora Borealis curtain ribbons for 'auroral'
  if (style === 'auroral') {
    for (let a = 0; a < 36; a++) {
      const ax = (0.05 + (a / 36) * 0.9) * width;
      const ay = height * (0.28 + Math.sin(a * 0.45) * 0.06);
      const rayH = 120 + rand() * 140;
      const rayW = 48 + rand() * 60;
      const auGrad = ctx.createLinearGradient(ax, ay + rayH * 0.5, ax, ay - rayH * 0.6);
      auGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      auGrad.addColorStop(0.3, 'rgba(52, 211, 153, 0.22)');
      auGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.14)');
      auGrad.addColorStop(0.9, 'rgba(167, 139, 250, 0.12)');
      auGrad.addColorStop(1, 'rgba(167, 139, 250, 0)');
      ctx.fillStyle = auGrad;
      ctx.beginPath();
      ctx.ellipse(ax, ay, rayW, rayH * 0.6, (rand() - 0.5) * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dense multi-magnitude background star cloud (6500 faint + medium stars)
  const spectralColors = ['#dbeafe', '#ffffff', '#fff7ed', '#fde68a', '#bae6fd', '#fed7aa'];
  const totalStars = style === 'deepnight' ? 4200 : 6800;
  for (let s = 0; s < totalStars; s++) {
    // 55% concentrated near galactic plane for authentic Milky Way density!
    const nearBand = style !== 'deepnight' && rand() < 0.58;
    const xNorm = rand();
    const x = xNorm * width;
    let y: number;
    if (nearBand) {
      const offset = (rand() + rand() + rand() - 1.5) * 110;
      y = Math.max(4, Math.min(height - 4, galacticYAtX(xNorm) + offset));
    } else {
      // Uniform area distribution on sphere: cos(theta) uniform
      const u = rand() * 2 - 1;
      y = (Math.acos(u) / Math.PI) * height;
    }

    const mag = rand();
    const r = mag > 0.985 ? 2.1 : mag > 0.92 ? 1.35 : mag > 0.7 ? 0.85 : 0.55;
    const alpha = mag > 0.96 ? 0.92 : mag > 0.75 ? 0.62 : 0.25 + rand() * 0.32;
    const col = spectralColors[Math.floor(rand() * spectralColors.length)];

    ctx.fillStyle = hexToRgba(col, alpha);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Soft airy halo on brightest stars
    if (mag > 0.988) {
      const sg = ctx.createRadialGradient(x, y, 0, x, y, 9);
      sg.addColorStop(0, hexToRgba(col, 0.55));
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = configureColorTexture(canvas, maxAniso);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createAstrolabeFloorTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  // Radial dark obsidian slate gradient
  const grad = ctx.createRadialGradient(c, c, 40, c, c, c);
  grad.addColorStop(0, '#0e1526');
  grad.addColorStop(0.65, '#070b16');
  grad.addColorStop(1, '#04060c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Concentric brass astrolabe rings with double hairlines
  const ringRadii = [180, 192, 340, 520, 720, 880, 916, 960, 992];
  ringRadii.forEach((r, idx) => {
    ctx.strokeStyle = idx >= 6 ? 'rgba(212, 175, 55, 0.56)' : 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = idx === 7 ? 4 : idx === 8 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 360 degree tick markings on outer perimeter + inner dial
  for (let d = 0; d < 360; d++) {
    const rad = (d * Math.PI) / 180;
    const isMajor = d % 30 === 0;
    const isTen = d % 10 === 0;
    const isFive = d % 5 === 0;
    const rInner = isMajor ? 916 : isTen ? 934 : isFive ? 944 : 950;
    const rOuter = 960;
    ctx.strokeStyle = isMajor
      ? 'rgba(212, 175, 55, 0.82)'
      : isTen
        ? 'rgba(212, 175, 55, 0.5)'
        : isFive
          ? 'rgba(248, 243, 230, 0.35)'
          : 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = isMajor ? 3 : isTen ? 1.8 : 1.1;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(rad) * rInner, c + Math.sin(rad) * rInner);
    ctx.lineTo(c + Math.cos(rad) * rOuter, c + Math.sin(rad) * rOuter);
    ctx.stroke();
  }

  // Subtle geometric sacred dodecagon & compass rose star lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 192, c + Math.sin(a) * 192);
    ctx.lineTo(c + Math.cos(a) * 916, c + Math.sin(a) * 916);
    ctx.stroke();
  }

  return configureColorTexture(canvas, maxAniso);
}

export function createPlanetTexture(planetId: PlanetId, maxAniso: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  let seed = planetId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 31, 17);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  if (planetId === 'sun') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffae22');
    g.addColorStop(0.5, '#ffd86b');
    g.addColorStop(1, '#ff9914');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 250, 210, 0.25)' : 'rgba(220, 80, 10, 0.2)';
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 4 + rand() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetId === 'jupiter' || planetId === 'saturn') {
    const palette =
      planetId === 'jupiter'
        ? ['#d8b288', '#b8764b', '#e8d5bc', '#9c5a3c', '#cfa176']
        : ['#e7d8b1', '#cdb88b', '#f2e6c8', '#b89f72', '#dcc89d'];
    let y = 0;
    while (y < h) {
      const bandH = 8 + rand() * 18;
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
      ctx.fillRect(0, y, w, bandH + 1);
      y += bandH;
    }
    if (planetId === 'jupiter') {
      ctx.fillStyle = 'rgba(196, 75, 48, 0.85)';
      ctx.beginPath();
      ctx.ellipse(w * 0.62, h * 0.62, 34, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetId === 'mars') {
    ctx.fillStyle = '#c15236';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = rand() > 0.45 ? 'rgba(120, 38, 22, 0.35)' : 'rgba(226, 128, 86, 0.28)';
      ctx.beginPath();
      ctx.ellipse(rand() * w, rand() * h, 8 + rand() * 26, 5 + rand() * 14, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
    ctx.fillRect(0, 0, w, 12);
    ctx.fillRect(0, h - 10, w, 10);
  } else if (planetId === 'moon' || planetId === 'mercury') {
    ctx.fillStyle = planetId === 'moon' ? '#cbd5e1' : '#9ca3af';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      const cx = rand() * w;
      const cy = rand() * h;
      const r = 3 + rand() * 16;
      ctx.fillStyle = 'rgba(71, 85, 105, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.24)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (planetId === 'venus') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#e9c78f');
    g.addColorStop(0.5, '#f4dfb6');
    g.addColorStop(1, '#d9ab6f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = 'rgba(255, 248, 231, 0.22)';
      ctx.beginPath();
      ctx.ellipse(rand() * w, rand() * h, 50 + rand() * 80, 8 + rand() * 16, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetId === 'uranus' || planetId === 'neptune') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (planetId === 'uranus') {
      g.addColorStop(0, '#7de2f0');
      g.addColorStop(0.5, '#a8f0f7');
      g.addColorStop(1, '#5bc5d9');
    } else {
      g.addColorStop(0, '#2a52be');
      g.addColorStop(0.5, '#3b82f6');
      g.addColorStop(1, '#1e3a8a');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(0, rand() * h, w, 4 + rand() * 8);
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, planetId === 'northNode' ? '#7c3aed' : '#8d6e7b');
    g.addColorStop(0.5, planetId === 'northNode' ? '#c4b5fd' : '#c9b2b8');
    g.addColorStop(1, planetId === 'northNode' ? '#4c1d95' : '#6b4f5b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = configureColorTexture(canvas, maxAniso);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createSaturnRingTexture(maxAniso: number, coolTint = false): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  for (let x = 0; x < size; x++) {
    const t = x / size;
    let alpha = 0;
    if (t > 0.12 && t < 0.96) {
      if (t > 0.62 && t < 0.68) {
        alpha = 0.08;
      } else {
        alpha = 0.45 + Math.sin(t * 95) * 0.22 + Math.cos(t * 28) * 0.15;
      }
    }
    const r = coolTint ? 140 : 228;
    const g = coolTint ? 225 : 206;
    const b = coolTint ? 240 : 162;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(0.92, alpha))})`;
    ctx.fillRect(x, 0, 1, 32);
  }

  return configureColorTexture(canvas, maxAniso);
}

export function createGlowSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 236, 179, 0.65)');
  grad.addColorStop(0.6, 'rgba(212, 175, 55, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGlyphBadgeTexture(symbol: string, label: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 128);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(5, 7, 14, 0.95)';
  ctx.shadowBlur = 10;

  ctx.fillStyle = accentColor;
  ctx.font = '600 50px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(symbol, 128, 46);

  ctx.fillStyle = '#f3efe6';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(label, 128, 94);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, curY);
}

export class DiegeticPlaqueRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor(maxAniso: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = configureColorTexture(this.canvas, maxAniso);
  }

  public render(options: {
    tradition: ZodiacTradition;
    baseChart: AstroChart;
    outerChart: AstroChart | null;
    modeLabel: string;
    outerRoleLabel: string;
    selectedPlanet: PlanetPosition | null;
    selectedPlanetLayer: 'base' | 'outer';
    selectedHouse: HouseCusp | null;
    comparisonAspects: Array<{
      outerPlanet: PlanetId;
      natalPlanet: PlanetId;
      outerSymbol: string;
      natalSymbol: string;
      symbol: string;
      orb: number;
    }>;
  }) {
    const {
      tradition,
      baseChart,
      outerChart,
      modeLabel,
      outerRoleLabel,
      selectedPlanet,
      selectedPlanetLayer,
      selectedHouse,
      comparisonAspects,
    } = options;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isChinese = tradition === 'chinese';

    ctx.fillStyle = '#090e1c';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle =
      selectedPlanetLayer === 'outer' ? 'rgba(56, 189, 248, 0.6)' : 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    if (selectedPlanet) {
      const p = selectedPlanet;
      const isOuter = selectedPlanetLayer === 'outer';
      const activeChart = isOuter && outerChart ? outerChart : baseChart;
      const ch = transposeLongitudeToChinese(p.longitude);
      ctx.fillStyle = isOuter ? '#38bdf8' : '#d4af37';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${isOuter ? outerRoleLabel.toUpperCase() : 'ASTRE BASE'} · MAISON ${activeChart.houses[p.house - 1].roman}`,
        48,
        46
      );

      ctx.fillStyle = '#f8f3e6';
      ctx.font = '600 62px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(`${p.symbol}  ${p.name}`, 48, 82);

      ctx.fillStyle = isChinese ? ch.sign.color : p.sign.color;
      ctx.font = '500 28px "JetBrains Mono", monospace';
      ctx.fillText(
        isChinese
          ? `${ch.formattedDeg} ${ch.sign.branchHanzi}${ch.sign.hanzi} ${ch.sign.name} (${ch.sign.wuXing} ${ch.sign.polarity}) · ${p.sign.symbol}`
          : `${p.formattedDeg} ${p.sign.symbol} ${p.sign.name} · ${ch.sign.name} (${ch.sign.hanzi})${p.retrograde ? ' ℞' : ''}`,
        48,
        164
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
      wrapText(ctx, isChinese ? `${ch.sign.keywords} — ${p.role}` : p.role, 48, 226, w - 96, 32);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
      wrapText(ctx, p.signMeaning, 48, 308, w - 96, 30);

      if (isOuter && comparisonAspects.length > 0) {
        const rel = comparisonAspects.filter((a) => a.outerPlanet === p.id).slice(0, 3);
        if (rel.length > 0) {
          ctx.fillStyle = '#7dd3fc';
          ctx.font = '500 21px "JetBrains Mono", monospace';
          const line = rel
            .map((a) => `${a.outerSymbol} ${a.symbol} ${a.natalSymbol} (${a.orb}°)`)
            .join('   ·   ');
          ctx.fillText(`Aspects comparés : ${line}`, 48, 434);
        }
      } else {
        const relAspects = activeChart.aspects
          .filter((a) => a.planetA === p.id || a.planetB === p.id)
          .slice(0, 3);
        if (relAspects.length > 0) {
          ctx.fillStyle = '#e7cfa0';
          ctx.font = '500 21px "JetBrains Mono", monospace';
          const line = relAspects
            .map((a) => `${a.planetASymbol} ${a.symbol} ${a.planetBSymbol} (${a.orb}°)`)
            .join('   ·   ');
          ctx.fillText(`Aspects : ${line}`, 48, 434);
        }
      }
    } else if (selectedHouse) {
      const hs = selectedHouse;
      const ch = transposeLongitudeToChinese(hs.longitude);
      ctx.fillStyle = '#d4af37';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`SECTEUR DU CIEL · MAISON ${hs.roman}`, 48, 46);

      ctx.fillStyle = '#f8f3e6';
      ctx.font = '600 58px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(hs.title, 48, 84);

      ctx.fillStyle = isChinese ? ch.sign.color : hs.sign.color;
      ctx.font = '500 28px "JetBrains Mono", monospace';
      ctx.fillText(
        isChinese
          ? `Cuspide : ${ch.formattedDeg} ${ch.sign.name} (${ch.sign.hanzi} · ${ch.sign.wuXing})`
          : `Cuspide : ${hs.formattedDeg} ${hs.sign.symbol} ${hs.sign.name} (${ch.sign.name})`,
        48,
        164
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
      wrapText(ctx, hs.meaning, 48, 232, w - 96, 36);
    } else {
      const ascCh = transposeLongitudeToChinese(baseChart.ascendant).sign;
      const sun = baseChart.planets.find((p) => p.id === 'sun');
      const moon = baseChart.planets.find((p) => p.id === 'moon');
      const bazi = calculateBaziSummary(baseChart);

      ctx.fillStyle = outerChart ? '#38bdf8' : '#d4af37';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${modeLabel.toUpperCase()} · ${isChinese ? 'ZODIAQUE CHINOIS' : baseChart.cityName.toUpperCase()}`,
        48,
        46
      );

      ctx.fillStyle = '#f8f3e6';
      ctx.font = '600 52px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(
        isChinese ? 'Sphère Sino-Astrologique (12 Rameaux)' : 'Sphère Armillaire Astrologique',
        48,
        84
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 24px "JetBrains Mono", monospace';
      ctx.fillText(
        isChinese
          ? `Pilier Annuel : ${bazi.yearPillar.label}  ·  ASC ${ascCh.name} (${ascCh.hanzi})`
          : `ASC ${baseChart.ascSign.symbol} ${baseChart.ascSign.name}   ·   MC ${baseChart.mcSign.symbol} ${baseChart.mcSign.name}`,
        48,
        168
      );
      if (sun && moon) {
        const sunCh = transposeLongitudeToChinese(sun.longitude).sign;
        const moonCh = transposeLongitudeToChinese(moon.longitude).sign;
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 22px "JetBrains Mono", monospace';
        ctx.fillText(
          isChinese
            ? `☉ ${sunCh.name} (${sunCh.wuXing})   ·   ☽ ${moonCh.name} (${moonCh.wuXing})`
            : `☉ ${sun.formattedDeg} ${sun.sign.name}   ·   ☽ ${moon.formattedDeg} ${moon.sign.name}`,
          48,
          216
        );
      }
      if (outerChart) {
        const outAscCh = transposeLongitudeToChinese(outerChart.ascendant).sign;
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '500 22px "JetBrains Mono", monospace';
        ctx.fillText(
          isChinese
            ? `${outerRoleLabel} : ASC ${outAscCh.name} (${outAscCh.wuXing}) · ${comparisonAspects.length} aspects`
            : `${outerRoleLabel} : ASC ${outerChart.ascSign.symbol} ${outerChart.ascSign.name} · ${comparisonAspects.length} aspects actifs`,
          48,
          266
        );
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
      wrapText(
        ctx,
        'Pointez un astre avec le contrôleur Meta Quest ou cliquez pour lire son interprétation occidentale et sa transposition chinoise.',
        48,
        326,
        w - 96,
        32
      );

      ctx.fillStyle = '#e7cfa0';
      ctx.font = '500 20px "JetBrains Mono", monospace';
      ctx.fillText(
        isChinese
          ? `Wu Xing — Bois ${bazi.wuXingBalance.Bois} · Feu ${bazi.wuXingBalance.Feu} · Terre ${bazi.wuXingBalance.Terre} · Métal ${bazi.wuXingBalance.Métal} · Eau ${bazi.wuXingBalance.Eau}`
          : `Éléments — Feu ${baseChart.elements.Feu} · Terre ${baseChart.elements.Terre} · Air ${baseChart.elements.Air} · Eau ${baseChart.elements.Eau}`,
        48,
        434
      );
    }

    this.texture.needsUpdate = true;
  }
}
