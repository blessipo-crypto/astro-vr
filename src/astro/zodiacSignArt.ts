import { ElementType } from './astroEngine';
import { ChineseSign } from './chineseAstrology';

export type ZodiacSignStyle = 'figurative' | 'calligraphic' | 'jewel' | 'minimal';

export interface ZodiacSignStyleMeta {
  id: ZodiacSignStyle;
  label: string;
  shortLabel: string;
  description: string;
  swatchPrimary: string;
  swatchAccent: string;
}

export const ZODIAC_SIGN_STYLES: ZodiacSignStyleMeta[] = [
  {
    id: 'figurative',
    label: 'Emblèmes Figurés',
    shortLabel: 'Figurés',
    description: 'Illustrations célestes sculptées (cornes, lion, balances, arc, poissons…)',
    swatchPrimary: '#1e162e',
    swatchAccent: '#fbbf24',
  },
  {
    id: 'calligraphic',
    label: 'Calligraphie Or',
    shortLabel: 'Calligraphie',
    description: 'Glyphes calligraphiés en or sculpté sans police système',
    swatchPrimary: '#0f172a',
    swatchAccent: '#f3d67a',
  },
  {
    id: 'jewel',
    label: 'Joyaux & Rosaces',
    shortLabel: 'Rosaces',
    description: 'Rosaces sacrées à 12 rayons, gemme élémentaire et filigranes d’or',
    swatchPrimary: '#231325',
    swatchAccent: '#f472b6',
  },
  {
    id: 'minimal',
    label: 'Gravure Trait Fin',
    shortLabel: 'Trait Fin',
    description: 'Dessin géométrique monoline contemporain dans un réticule d’astrolabe',
    swatchPrimary: '#14161c',
    swatchAccent: '#e2e8f0',
  },
];

// Normalized coordinate space: [-100, 100] x [-100, 100], centered at (0, 0)
export interface VectorSignSpec {
  strokes: string[];
  fills?: string[];
  circles?: Array<{ cx: number; cy: number; r: number; fill?: boolean }>;
}

// Bespoke flowing calligraphic glyphs (zero OS emoji fallback)
export const CALLIGRAPHIC_SIGN_PATHS: VectorSignSpec[] = [
  // 0 Bélier: sweeping twin ram horns & central stem
  {
    strokes: [
      'M 0 68 C 0 18, -6 -22, -22 -42 C -38 -62, -68 -56, -68 -30 C -68 -10, -48 -4, -36 -14',
      'M 0 68 C 0 18, 6 -22, 22 -42 C 38 -62, 68 -56, 68 -30 C 68 -10, 48 -4, 36 -14',
    ],
    circles: [{ cx: 0, cy: 70, r: 4.5, fill: true }],
  },
  // 1 Taureau: lunar crescent crown over solar disk
  {
    strokes: [
      'M -56 -56 C -42 -20, -24 -12, 0 -12 C 24 -12, 42 -20, 56 -56',
      'M 0 -12 A 34 34 0 1 0 0.1 -12 Z',
    ],
    circles: [
      { cx: -57, cy: -58, r: 4, fill: true },
      { cx: 57, cy: -58, r: 4, fill: true },
    ],
  },
  // 2 Gémeaux: curved Roman twin pillars
  {
    strokes: [
      'M -56 -52 Q 0 -32 56 -52',
      'M -56 52 Q 0 32 56 52',
      'M -24 -42 L -24 42',
      'M 24 -42 L 24 42',
    ],
    circles: [
      { cx: -24, cy: 0, r: 3.5, fill: true },
      { cx: 24, cy: 0, r: 3.5, fill: true },
    ],
  },
  // 3 Cancer: twin orbital spirals
  {
    strokes: [
      'M -42 -12 C -24 -48, 22 -56, 58 -36',
      'M 42 12 C 24 48, -22 56, -58 36',
    ],
    circles: [
      { cx: -34, cy: -14, r: 17, fill: false },
      { cx: 34, cy: 14, r: 17, fill: false },
    ],
  },
  // 4 Lion: solar head loop + arching mane tail
  {
    strokes: [
      'M -24 2 C -12 -46, 26 -62, 46 -34 C 60 -12, 42 36, 48 56 C 53 68, 70 64, 72 48',
    ],
    circles: [
      { cx: -36, cy: 16, r: 19, fill: false },
      { cx: -36, cy: 16, r: 5, fill: true },
    ],
  },
  // 5 Vierge: M-flourish with crossed ribbon loop
  {
    strokes: [
      'M -58 -42 L -58 36',
      'M -58 -24 C -44 -54, -22 -52, -22 -14 L -22 36',
      'M -22 -24 C -8 -54, 14 -52, 14 -14 L 14 36',
      'M 14 -24 C 34 -56, 62 -44, 56 -6 C 48 34, 8 56, -12 68',
      'M 14 6 C 42 18, 60 44, 68 62',
    ],
  },
  // 6 Balance: setting sun arch + twin horizon scales
  {
    strokes: [
      'M -66 26 L -28 26 A 28 28 0 1 1 28 26 L 66 26',
      'M -66 52 L 66 52',
    ],
    circles: [{ cx: 0, cy: 18, r: 4.5, fill: true }],
  },
  // 7 Scorpion: M-body sweeping out into barbed stinger arrow
  {
    strokes: [
      'M -62 -40 L -62 34',
      'M -62 -22 C -46 -52, -24 -50, -24 -12 L -24 34',
      'M -24 -22 C -8 -52, 14 -50, 14 -12 L 14 34 C 14 58, 42 62, 66 34',
      'M 52 34 L 68 32 L 64 48',
    ],
  },
  // 8 Sagittaire: diagonal arrow + cross bar
  {
    strokes: [
      'M -54 54 L 54 -54',
      'M 14 -54 L 54 -54 L 54 -14',
      'M -42 -2 L 2 42',
    ],
    circles: [{ cx: -54, cy: 54, r: 4, fill: true }],
  },
  // 9 Capricorne: V-horn descending into sea-serpent loop
  {
    strokes: [
      'M -60 -48 L -38 -48 L -14 28 L 12 -40 C 28 -58, 52 -40, 44 -14 C 36 12, 18 32, 34 52 C 48 66, 68 50, 62 30 C 56 14, 34 18, 22 44',
    ],
  },
  // 10 Verseau: dual rhythmic water waves
  {
    strokes: [
      'M -64 -16 L -40 -36 L -14 -14 L 12 -36 L 38 -14 L 64 -34',
      'M -64 26 L -40 6 L -14 28 L 12 6 L 38 28 L 64 8',
    ],
  },
  // 11 Poissons: twin opposing arcs tied by horizon band
  {
    strokes: [
      'M -46 -54 C -10 -24, -10 24, -46 54',
      'M 46 -54 C 10 -24, 10 24, 46 54',
      'M -56 0 L 56 0',
    ],
    circles: [{ cx: 0, cy: 0, r: 4.5, fill: true }],
  },
];

// Artistic Figurative Celestial Emblems for all 12 signs ([-100, 100])
export const FIGURATIVE_SIGN_PATHS: VectorSignSpec[] = [
  // 0 Bélier: Noble curling Ram horns + forehead star crown
  {
    strokes: [
      'M 0 64 L 0 -10',
      'M -24 20 L 0 64 L 24 20',
      'M -14 -18 C -30 -56, -72 -58, -74 -22 C -76 10, -44 26, -24 6 C -14 -4, -22 -24, -40 -22',
      'M 14 -18 C 30 -56, 72 -58, 74 -22 C 76 10, 44 26, 24 6 C 14 -4, 22 -24, 40 -22',
      'M -10 -44 L 0 -64 L 10 -44',
    ],
    circles: [
      { cx: 0, cy: -34, r: 7, fill: true },
      { cx: -14, cy: 4, r: 3.5, fill: true },
      { cx: 14, cy: 4, r: 3.5, fill: true },
    ],
  },
  // 1 Taureau: Sculpted Bull head, sweeping crescent horns & solar disk
  {
    strokes: [
      'M -62 -56 C -54 -14, -28 -4, 0 -4 C 28 -4, 54 -14, 62 -56',
      'M -28 2 L -20 44 L 0 62 L 20 44 L 28 2',
      'M -12 36 Q 0 46 12 36',
    ],
    circles: [
      { cx: 0, cy: -34, r: 16, fill: false },
      { cx: 0, cy: -34, r: 5.5, fill: true },
      { cx: -14, cy: 14, r: 3.5, fill: true },
      { cx: 14, cy: 14, r: 3.5, fill: true },
    ],
  },
  // 2 Gémeaux: Twin mirrored celestial stars & arched temple pillars
  {
    strokes: [
      'M -58 -48 C -20 -36, 20 -36, 58 -48',
      'M -58 50 C -20 38, 20 38, 58 50',
      'M -30 -40 L -30 42',
      'M -18 -40 L -18 42',
      'M 18 -40 L 18 42',
      'M 30 -40 L 30 42',
      'M -24 0 L 24 0',
    ],
    circles: [
      { cx: -24, cy: -58, r: 7.5, fill: true },
      { cx: 24, cy: -58, r: 7.5, fill: true },
      { cx: 0, cy: 0, r: 5, fill: true },
    ],
  },
  // 3 Cancer: Stylized lunar crescent crab & pearl core
  {
    strokes: [
      'M -46 -12 C -58 -42, -36 -66, -12 -52',
      'M 46 -12 C 58 -42, 36 -66, 12 -52',
      'M -42 28 C -56 10, -48 -14, -30 -18',
      'M 42 28 C 56 10, 48 -14, 30 -18',
      'M -36 16 Q 0 46 36 16',
      'M -28 -6 Q 0 -24 28 -6',
    ],
    circles: [
      { cx: 0, cy: 6, r: 22, fill: false },
      { cx: 0, cy: 6, r: 7, fill: true },
      { cx: -26, cy: -36, r: 4, fill: true },
      { cx: 26, cy: -36, r: 4, fill: true },
    ],
  },
  // 4 Lion: Radiant 10-ray Sun Lion crest & flowing spiral mane
  {
    strokes: [
      'M 0 -64 L 0 -46 M 0 46 L 0 64 M -64 0 L -46 0 M 46 0 L 64 0',
      'M -45 -45 L -32 -32 M 45 -45 L 32 -32 M -45 45 L -32 32 M 45 45 L 32 32',
      'M -18 -14 C -26 -38, 12 -50, 32 -28 C 48 -8, 36 28, 14 38 C 34 52, 62 42, 64 20',
    ],
    circles: [
      { cx: 0, cy: 0, r: 34, fill: false },
      { cx: -8, cy: 4, r: 12, fill: false },
      { cx: -8, cy: 4, r: 4, fill: true },
    ],
  },
  // 5 Vierge: Graceful Golden Wheat Ear & winged crescent chalice
  {
    strokes: [
      'M 0 62 L 0 -56',
      'M 0 24 C -24 14, -36 -6, -30 -24 C -14 -14, -4 4, 0 24',
      'M 0 24 C 24 14, 36 -6, 30 -24 C 14 -14, 4 4, 0 24',
      'M 0 -4 C -22 -14, -32 -32, -26 -48 C -12 -38, -2 -22, 0 -4',
      'M 0 -4 C 22 -14, 32 -32, 26 -48 C 12 -38, 2 -22, 0 -4',
      'M -38 48 Q 0 28 38 48',
    ],
    circles: [{ cx: 0, cy: -62, r: 5.5, fill: true }],
  },
  // 6 Balance: Ornate suspended golden scales + rising horizon star
  {
    strokes: [
      'M 0 -58 L 0 54',
      'M -28 54 L 28 54',
      'M -56 -28 Q 0 -44 56 -28',
      'M -56 -28 L -70 12 L -42 12 Z',
      'M 56 -28 L 42 12 L 70 12 Z',
      'M -72 12 Q -56 26 -40 12',
      'M 40 12 Q 56 26 72 12',
    ],
    circles: [
      { cx: 0, cy: -62, r: 5.5, fill: true },
      { cx: 0, cy: -10, r: 12, fill: false },
    ],
  },
  // 7 Scorpion: Armored celestial scorpion with arched stinger tail
  {
    strokes: [
      'M -12 -28 L 0 -44 L 12 -28',
      'M -14 -24 L -14 14 L 0 30 L 14 14 L 14 -24 Z',
      'M -14 -16 C -34 -24, -48 -42, -36 -58',
      'M 14 -16 C 34 -24, 48 -42, 36 -58',
      'M -14 0 L -38 8 M -14 10 L -36 24',
      'M 14 0 L 38 8 M 14 10 L 36 24',
      'M 0 30 C 4 58, 38 66, 56 42 C 68 24, 58 -2, 38 -6',
      'M 34 -12 L 46 -6 L 34 2',
    ],
    circles: [{ cx: 0, cy: -8, r: 4.5, fill: true }],
  },
  // 8 Sagittaire: Drawn Golden Bow & Winged Celestial Arrow
  {
    strokes: [
      'M -42 -48 C 12 -36, 36 -12, 48 42',
      'M -42 -48 L 48 42',
      'M -50 50 L 54 -54',
      'M 22 -54 L 54 -54 L 54 -22',
      'M -50 50 L -58 34 M -50 50 L -34 58',
    ],
    circles: [
      { cx: 54, cy: -54, r: 5, fill: true },
      { cx: 2, cy: -2, r: 4, fill: true },
    ],
  },
  // 9 Capricorne: Mountain Ibex horns sweeping into spiral sea-tail
  {
    strokes: [
      'M -38 -18 C -46 -56, -12 -68, 12 -46',
      'M -24 -12 C -26 -42, -2 -52, 18 -34',
      'M -38 -18 L -52 10 L -24 22 L -10 -4',
      'M -24 22 C -6 46, 28 56, 54 34 C 72 18, 62 -10, 42 -6 C 28 -2, 26 16, 40 22',
      'M 54 34 L 70 46 M 54 34 L 66 20',
    ],
    circles: [{ cx: -32, cy: -2, r: 4, fill: true }],
  },
  // 10 Verseau: Tilted Sacred Amphora pouring dual cosmic waves
  {
    strokes: [
      'M -44 -54 L -20 -62 L -8 -42 L -26 -24 C -44 -14, -36 10, -14 14 L 12 -8 L -8 -42',
      'M -32 -48 C -52 -42, -52 -24, -34 -24',
      'M 10 2 C 26 8, 22 24, 40 28 C 56 32, 56 16, 70 20',
      'M -4 18 C 12 28, 8 44, 28 50 C 44 54, 46 38, 64 44',
      'M -24 38 C -8 46, -10 60, 10 64',
    ],
    circles: [
      { cx: 22, cy: -34, r: 4, fill: true },
      { cx: 46, cy: -16, r: 3.5, fill: true },
    ],
  },
  // 11 Poissons: Twin Arched Celestial Fishes linked by star cord
  {
    strokes: [
      'M -42 -42 C -12 -52, 14 -32, 18 -8 C -4 -4, -26 -18, -42 -42 Z',
      'M -42 -42 L -60 -52 M -42 -42 L -56 -26',
      'M 42 42 C 12 52, -14 32, -18 8 C 4 4, 26 18, 42 42 Z',
      'M 42 42 L 60 52 M 42 42 L 56 26',
      'M -36 22 Q 0 0 36 -22',
    ],
    circles: [
      { cx: 0, cy: 0, r: 6, fill: true },
      { cx: 2, cy: -24, r: 3.5, fill: true },
      { cx: -2, cy: 24, r: 3.5, fill: true },
    ],
  },
];

function getElementGemColor(el: ElementType): string {
  if (el === 'Feu') return '#f97316';
  if (el === 'Terre') return '#34d399';
  if (el === 'Air') return '#38bdf8';
  return '#818cf8';
}

function getSpecForStyle(signIndex: number, style: ZodiacSignStyle): VectorSignSpec {
  const idx = ((signIndex % 12) + 12) % 12;
  if (style === 'figurative') return FIGURATIVE_SIGN_PATHS[idx];
  return CALLIGRAPHIC_SIGN_PATHS[idx];
}

function traceSvgPathOnCanvas(ctx: CanvasRenderingContext2D, pathStr: string, scale: number) {
  // Use native Path2D when available, scaled uniformly around (0,0)
  if (typeof Path2D !== 'undefined') {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.stroke(new Path2D(pathStr));
    ctx.restore();
  }
}

export function drawWesternSignArtworkOnCanvas(options: {
  ctx: CanvasRenderingContext2D;
  signIndex: number;
  element: ElementType;
  cx: number;
  cy: number;
  radius: number;
  style: ZodiacSignStyle;
  primaryColor: string;
  accentColor: string;
}) {
  const { ctx, signIndex, element, cx, cy, radius, style, primaryColor, accentColor } = options;
  const gemColor = getElementGemColor(element);
  const spec = getSpecForStyle(signIndex, style);
  const scale = radius / 95;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Decorative background halo / medallion per signStyle
  if (style === 'jewel') {
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
    glow.addColorStop(0, `${gemColor}44`);
    glow.addColorStop(0.7, `${gemColor}14`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 12-petal sacred rose rays
    ctx.strokeStyle = `${accentColor}66`;
    ctx.lineWidth = Math.max(1, radius * 0.018);
    for (let p = 0; p < 12; p++) {
      const a = (p * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.64, Math.sin(a) * radius * 0.64);
      ctx.lineTo(Math.cos(a) * radius * 0.94, Math.sin(a) * radius * 0.94);
      ctx.stroke();
    }

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = Math.max(1.5, radius * 0.025);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = gemColor;
    ctx.lineWidth = Math.max(1, radius * 0.016);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal gem diamonds
    ctx.fillStyle = gemColor;
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const gx = Math.cos(a) * radius * 0.92;
      const gy = Math.sin(a) * radius * 0.92;
      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(2, radius * 0.045), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'figurative') {
    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, radius * 0.95);
    glow.addColorStop(0, `${primaryColor}2e`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${primaryColor}88`;
    ctx.lineWidth = Math.max(1.2, radius * 0.022);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === 'minimal') {
    ctx.strokeStyle = `${accentColor}48`;
    ctx.lineWidth = Math.max(1, radius * 0.014);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    // Subtle astrolabe cross-hairs
    ctx.strokeStyle = `${accentColor}28`;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.96, 0);
    ctx.lineTo(-radius * 0.78, 0);
    ctx.moveTo(radius * 0.78, 0);
    ctx.lineTo(radius * 0.96, 0);
    ctx.moveTo(0, -radius * 0.96);
    ctx.lineTo(0, -radius * 0.78);
    ctx.moveTo(0, radius * 0.78);
    ctx.lineTo(0, radius * 0.96);
    ctx.stroke();
  } else {
    // calligraphic: luminous aura + delicate rim
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, radius * 0.85);
    glow.addColorStop(0, 'rgba(243, 214, 122, 0.20)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft gold shadow + outer stroke glow
  const innerScale = style === 'jewel' ? scale * 0.68 : style === 'figurative' ? scale * 0.78 : scale * 0.74;
  const strokeWidthPx =
    style === 'minimal'
      ? Math.max(2.2, 5.2)
      : style === 'figurative'
        ? Math.max(2.8, 6.4)
        : Math.max(3.4, 7.8);

  // Subtle gold embossed under-stroke
  if (style !== 'minimal') {
    ctx.save();
    ctx.scale(innerScale, innerScale);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = strokeWidthPx + 4;
    if (typeof Path2D !== 'undefined') {
      spec.strokes.forEach((p) => ctx.stroke(new Path2D(p)));
    }
    ctx.restore();
  }

  // Main metallic gold/ivory vector paths
  const grad = ctx.createLinearGradient(-radius * 0.6, -radius * 0.6, radius * 0.6, radius * 0.6);
  if (style === 'minimal') {
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, accentColor);
  } else {
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.45, primaryColor);
    grad.addColorStop(1, accentColor);
  }

  ctx.save();
  ctx.scale(innerScale, innerScale);
  ctx.strokeStyle = grad;
  ctx.fillStyle = grad;
  ctx.lineWidth = strokeWidthPx;

  spec.strokes.forEach((p) => {
    if (typeof Path2D !== 'undefined') {
      ctx.stroke(new Path2D(p));
    }
  });

  if (spec.circles) {
    spec.circles.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      if (c.fill) ctx.fill();
      else ctx.stroke();
    });
  }
  ctx.restore();

  // Keep helper reference alive cleanly
  void traceSvgPathOnCanvas;
  ctx.restore();
}

export function drawChineseSignArtworkOnCanvas(options: {
  ctx: CanvasRenderingContext2D;
  ch: ChineseSign;
  cx: number;
  cy: number;
  radius: number;
  style: ZodiacSignStyle;
  primaryColor: string;
}) {
  const { ctx, ch, cx, cy, radius, style, primaryColor } = options;

  ctx.save();
  ctx.translate(cx, cy);

  if (style === 'figurative' || style === 'jewel') {
    // Imperial octagonal jade/cinnabar seal medallion
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
    glow.addColorStop(0, `${ch.color}3b`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = Math.max(1.5, radius * 0.025);
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) {
      const a = (k * Math.PI) / 4 + Math.PI / 8;
      const x = Math.cos(a) * radius * 0.88;
      const y = Math.sin(a) * radius * 0.88;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = ch.color;
    ctx.lineWidth = Math.max(1, radius * 0.015);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Minimal or calligraphic circular brush seal
    ctx.strokeStyle = style === 'minimal' ? `${primaryColor}66` : primaryColor;
    ctx.lineWidth = Math.max(1.2, radius * 0.02);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = style === 'minimal' ? '#f8fafc' : '#fef3c7';
  ctx.font = `600 ${Math.round(radius * 0.82)}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillText(ch.hanzi, 0, -radius * 0.04);

  ctx.shadowBlur = 0;
  ctx.fillStyle = ch.color;
  ctx.font = `600 ${Math.round(radius * 0.34)}px "Cormorant Garamond", serif`;
  ctx.fillText(ch.branchHanzi, 0, radius * 0.56);

  ctx.restore();
}
