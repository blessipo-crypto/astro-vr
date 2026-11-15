import { ChartMode, NatalProfile } from './astroEngine';
import { ZodiacTradition } from './chineseAstrology';
import type { ComparativePairKind } from '../components/ControlDock';
import type { StarfieldBackdropStyle, ZodiacSignStyle, ZodiacWheelStyle } from '../vr/textures';

export interface SharedThemePayload {
  v: 1;
  profile: NatalProfile;
  partner?: NatalProfile;
  mode: ChartMode;
  tradition: ZodiacTradition;
  wheelStyle?: ZodiacWheelStyle;
  signStyle?: ZodiacSignStyle;
  starfieldStyle?: StarfieldBackdropStyle;
  transitIso: string;
  srYear: number;
  srCityId: string;
  srCustomLoc?: { name: string; latitude: number; longitude: number } | null;
  compPair: ComparativePairKind;
  compYearA: number;
  compYearB: number;
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  let padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeSharedTheme(payload: SharedThemePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeSharedTheme(token: string): SharedThemePayload | null {
  try {
    const json = fromBase64Url(token);
    const parsed = JSON.parse(json) as Partial<SharedThemePayload>;
    if (!parsed || parsed.v !== 1 || !parsed.profile || !parsed.profile.birthDateIso) {
      return null;
    }
    return parsed as SharedThemePayload;
  } catch {
    return null;
  }
}

export function buildShareThemeUrl(payload: SharedThemePayload): string {
  const isElectronLocal =
    window.location.hostname === '127.0.0.1' &&
    (window.location.port === '41789' || navigator.userAgent.includes('Electron'));
  const url = new URL(
    isElectronLocal ? 'https://blessipo-crypto.github.io/astro-vr/' : window.location.href
  );
  url.search = '';
  url.hash = '';
  url.searchParams.set('theme', encodeSharedTheme(payload));
  return url.toString();
}

export function readSharedThemeFromUrl(): SharedThemePayload | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('theme');
  if (!token) return null;
  return decodeSharedTheme(token);
}
