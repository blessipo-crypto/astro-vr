export type TitleFontId = 'cinzel' | 'cormorant' | 'playfair' | 'cochin';
export type BodyFontId = 'montserrat' | 'lato';
export type GlyphFontId = 'noto-symbols' | 'astrological';

export interface FontOption<T extends string> {
  id: T;
  label: string;
  description: string;
  stack: string;
  canvasName: string;
}

export const TITLE_FONT_OPTIONS: FontOption<TitleFontId>[] = [
  {
    id: 'cinzel',
    label: 'Cinzel',
    description: 'Inscriptions romaines antiques & célestes',
    stack: `'Cinzel', 'Cormorant Garamond', Cochin, Georgia, serif`,
    canvasName: `"Cinzel", "Cormorant Garamond", Georgia, serif`,
  },
  {
    id: 'cormorant',
    label: 'Cormorant Garamond',
    description: 'Ouvrages anciens d’astronomie & finesse',
    stack: `'Cormorant Garamond', 'Cinzel', Cochin, Georgia, serif`,
    canvasName: `"Cormorant Garamond", "Cinzel", Georgia, serif`,
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    description: 'Édition littéraire & contrastes élégants',
    stack: `'Playfair Display', 'Cormorant Garamond', Cochin, Georgia, serif`,
    canvasName: `"Playfair Display", "Cormorant Garamond", Georgia, serif`,
  },
  {
    id: 'cochin',
    label: 'Cochin',
    description: 'Tradition éditoriale raffinée & imprimée',
    stack: `Cochin, 'Cormorant Garamond', 'Cinzel', Georgia, serif`,
    canvasName: `Cochin, "Cormorant Garamond", Georgia, serif`,
  },
];

export const BODY_FONT_OPTIONS: FontOption<BodyFontId>[] = [
  {
    id: 'montserrat',
    label: 'Montserrat',
    description: 'Sans-serif moderne, ultra lisible sur roue & tableaux',
    stack: `'Montserrat', 'Lato', system-ui, -apple-system, sans-serif`,
    canvasName: `"Montserrat", "Lato", sans-serif`,
  },
  {
    id: 'lato',
    label: 'Lato',
    description: 'Lecture fluide des longs paragraphes & degrés',
    stack: `'Lato', 'Montserrat', system-ui, -apple-system, sans-serif`,
    canvasName: `"Lato", "Montserrat", sans-serif`,
  },
];

export const GLYPH_FONT_OPTIONS: FontOption<GlyphFontId>[] = [
  {
    id: 'noto-symbols',
    label: 'Noto Sans Symbols',
    description: 'Glyphes Unicode astronomiques monochromes sans émoji',
    stack: `'Noto Sans Symbols', 'Noto Sans Symbols 2', 'Segoe UI Symbol', 'Apple Symbols', sans-serif`,
    canvasName: `"Noto Sans Symbols", "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", sans-serif`,
  },
  {
    id: 'astrological',
    label: 'Astrological / Zodiastic',
    description: 'Silhouettes traditionnelles locales + repli Noto Sans Symbols',
    stack: `'Astrological', 'Astrodings', 'Zodiastic', 'Zodiac', 'Noto Sans Symbols', 'Noto Sans Symbols 2', 'Segoe UI Symbol', 'Apple Symbols', serif`,
    canvasName: `"Astrological", "Astrodings", "Zodiastic", "Zodiac", "Noto Sans Symbols", "Noto Sans Symbols 2", "Segoe UI Symbol", sans-serif`,
  },
];

export interface TypographyPreferences {
  titleFont: TitleFontId;
  bodyFont: BodyFontId;
  glyphFont: GlyphFontId;
}

export const DEFAULT_TYPOGRAPHY: TypographyPreferences = {
  titleFont: 'cinzel',
  bodyFont: 'montserrat',
  glyphFont: 'noto-symbols',
};

let activePrefs: TypographyPreferences = { ...DEFAULT_TYPOGRAPHY };

export function getTypographyPreferences(): TypographyPreferences {
  return activePrefs;
}

export function getActiveFontStacks(): {
  display: string;
  body: string;
  glyph: string;
  mono: string;
} {
  const titleOpt =
    TITLE_FONT_OPTIONS.find((o) => o.id === activePrefs.titleFont) ?? TITLE_FONT_OPTIONS[0];
  const bodyOpt =
    BODY_FONT_OPTIONS.find((o) => o.id === activePrefs.bodyFont) ?? BODY_FONT_OPTIONS[0];
  const glyphOpt =
    GLYPH_FONT_OPTIONS.find((o) => o.id === activePrefs.glyphFont) ?? GLYPH_FONT_OPTIONS[0];
  return {
    display: titleOpt.canvasName,
    body: `${bodyOpt.canvasName}, ${glyphOpt.canvasName}`,
    glyph: glyphOpt.canvasName,
    mono: `"JetBrains Mono", ${glyphOpt.canvasName}, monospace`,
  };
}

export function applyTypographyToDocument(prefs: TypographyPreferences) {
  activePrefs = { ...prefs };
  if (typeof document === 'undefined') return;
  const titleOpt =
    TITLE_FONT_OPTIONS.find((o) => o.id === prefs.titleFont) ?? TITLE_FONT_OPTIONS[0];
  const bodyOpt =
    BODY_FONT_OPTIONS.find((o) => o.id === prefs.bodyFont) ?? BODY_FONT_OPTIONS[0];
  const glyphOpt =
    GLYPH_FONT_OPTIONS.find((o) => o.id === prefs.glyphFont) ?? GLYPH_FONT_OPTIONS[0];

  const root = document.documentElement;
  root.style.setProperty('--font-display', titleOpt.stack);
  root.style.setProperty('--font-sans', bodyOpt.stack);
  root.style.setProperty('--font-glyph', glyphOpt.stack);
}
