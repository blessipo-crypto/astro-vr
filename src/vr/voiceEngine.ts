// Optional French Voice Recognition & Natural Command Parser for Uranie VR
// Uses browser-native Web Speech API (SpeechRecognition / webkitSpeechRecognition).
// Zero external APIs or keys required; works on Chrome/Edge PC, Android & Quest Browser.

import { ChartMode, NatalProfile, PlanetId } from '../astro/astroEngine';
import { ZodiacTradition } from '../astro/chineseAstrology';
import { CameraPreset, SkyAnimationsConfig } from './AstrologyScene';

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function formatVoiceErrorFr(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Accès au micro refusé. Autorisez le microphone dans votre navigateur ou casque.';
    case 'no-speech':
      return 'Aucune parole détectée. Réessayez plus près du micro.';
    case 'audio-capture':
      return 'Aucun microphone détecté sur cet appareil.';
    case 'network':
      return 'Service de reconnaissance vocale indisponible hors connexion sur ce navigateur.';
    case 'aborted':
      return 'Écoute vocale interrompue.';
    default:
      return `Erreur vocale (${errorCode}).`;
  }
}

export interface OneShotDictationHandle {
  stop: () => void;
}

export function startOneShotDictation(options: {
  lang?: string;
  onStart?: () => void;
  onInterim?: (text: string) => void;
  onResult: (finalText: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}): OneShotDictationHandle | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    options.onError?.(
      'La reconnaissance vocale n’est pas supportée par ce navigateur (utilisez Chrome, Edge, Android ou Quest Browser).'
    );
    return null;
  }

  let settled = false;
  const rec = new Ctor();
  rec.lang = options.lang ?? 'fr-FR';
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onstart = () => {
    options.onStart?.();
  };

  rec.onresult = (ev) => {
    let interim = '';
    let finalTxt = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const txt = res[0]?.transcript ?? '';
      if (res.isFinal) {
        finalTxt += txt + ' ';
      } else {
        interim += txt + ' ';
      }
    }
    if (interim.trim()) {
      options.onInterim?.(interim.trim());
    }
    if (finalTxt.trim() && !settled) {
      settled = true;
      options.onResult(finalTxt.trim());
      try {
        rec.stop();
      } catch {
        // Ignore stop errors
      }
    }
  };

  rec.onerror = (ev) => {
    if (ev.error === 'aborted' && settled) return;
    options.onError?.(formatVoiceErrorFr(ev.error));
  };

  rec.onend = () => {
    options.onEnd?.();
  };

  try {
    rec.start();
  } catch (err) {
    options.onError?.(
      err instanceof Error ? err.message : 'Impossible de démarrer le microphone.'
    );
    return null;
  }

  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        // Ignore stop errors
      }
    },
  };
}

export class ContinuousVoiceListener {
  private rec: SpeechRecognitionLike | null = null;
  private active = false;
  private restartTimer: number | null = null;

  public isActive(): boolean {
    return this.active;
  }

  public start(callbacks: {
    lang?: string;
    onListeningChange: (listening: boolean) => void;
    onInterim: (text: string) => void;
    onCommand: (finalText: string) => void;
    onError: (message: string) => void;
  }): boolean {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      callbacks.onError(
        'La reconnaissance vocale n’est pas disponible sur ce navigateur.'
      );
      return false;
    }

    this.stop();
    this.active = true;

    const launch = () => {
      if (!this.active) return;
      const rec = new Ctor();
      this.rec = rec;
      rec.lang = callbacks.lang ?? 'fr-FR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        if (this.active) callbacks.onListeningChange(true);
      };

      rec.onresult = (ev) => {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          const txt = (res[0]?.transcript ?? '').trim();
          if (!txt) continue;
          if (res.isFinal) {
            callbacks.onInterim('');
            callbacks.onCommand(txt);
          } else {
            interim += txt + ' ';
          }
        }
        if (interim.trim()) {
          callbacks.onInterim(interim.trim());
        }
      };

      rec.onerror = (ev) => {
        if (!this.active) return;
        if (ev.error === 'no-speech' || ev.error === 'aborted') {
          return;
        }
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed' || ev.error === 'audio-capture') {
          this.active = false;
          callbacks.onListeningChange(false);
        }
        callbacks.onError(formatVoiceErrorFr(ev.error));
      };

      rec.onend = () => {
        if (!this.active) {
          callbacks.onListeningChange(false);
          return;
        }
        // Automatically resume continuous listening cleanly
        this.restartTimer = window.setTimeout(() => {
          if (this.active) launch();
        }, 260);
      };

      try {
        rec.start();
      } catch {
        this.active = false;
        callbacks.onListeningChange(false);
        callbacks.onError('Impossible de démarrer l’écoute vocale.');
      }
    };

    launch();
    return true;
  }

  public stop(): void {
    this.active = false;
    if (this.restartTimer !== null) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.rec) {
      try {
        this.rec.abort();
      } catch {
        // Ignore abort errors
      }
      this.rec = null;
    }
  }
}

// ---------------------------------------------------------------------------
// French Natural Language Voice Command Parser
// ---------------------------------------------------------------------------

export type VoiceAction =
  | { type: 'setMode'; mode: ChartMode }
  | {
      type: 'updateBirthProfile';
      patch: {
        name?: string;
        year?: number;
        month?: number;
        day?: number;
        hour?: number;
        minute?: number;
      };
    }
  | { type: 'searchBirthPlace'; query: string }
  | { type: 'searchSrPlace'; query: string }
  | { type: 'setSrYear'; year: number }
  | { type: 'saveProfile' }
  | { type: 'newProfile' }
  | { type: 'selectProfile'; profileId: string; profileName: string }
  | { type: 'selectPlanet'; planetId: PlanetId }
  | { type: 'selectHouse'; house: number }
  | { type: 'clearSelection' }
  | { type: 'setViewDimension'; dim: '2d' | '3d' }
  | { type: 'setCameraPreset'; preset: CameraPreset }
  | { type: 'bringMenuHere' }
  | { type: 'setTradition'; tradition: ZodiacTradition }
  | { type: 'setHousesVisible'; visible: boolean }
  | { type: 'setConstellationsVisible'; visible: boolean }
  | { type: 'setVRPlaqueVisible'; visible: boolean }
  | { type: 'setSkyAnimations'; patch: Partial<SkyAnimationsConfig> }
  | { type: 'setTimePlayback'; action: 'play' | 'pause' | 'realtime' }
  | { type: 'stepTime'; deltaMinutes: number }
  | { type: 'setTransitDate'; date: Date }
  | { type: 'setAudioEnabled'; enabled: boolean }
  | { type: 'setVoiceFeedback'; enabled: boolean }
  | { type: 'openTab'; tab: 'natal' | 'derived' | 'aspects' | 'settings' | 'help' }
  | { type: 'toggleDockCollapsed'; collapsed: boolean }
  | { type: 'openSummary'; open: boolean }
  | { type: 'openAscendant' }
  | { type: 'openQuestGuide' }
  | { type: 'openIntro' }
  | { type: 'openPdfShare' }
  | { type: 'enterVR' }
  | { type: 'enterMR' }
  | { type: 'stopVoiceListening' }
  | { type: 'quitApp' };

export interface ParsedVoiceCommand {
  recognized: boolean;
  transcript: string;
  actions: VoiceAction[];
  feedback: string;
}

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1,
  janv: 1,
  fevrier: 2,
  février: 2,
  fevr: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  juil: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  sept: 9,
  octobre: 10,
  oct: 10,
  novembre: 11,
  nov: 11,
  decembre: 12,
  décembre: 12,
  dec: 12,
};

const SPOKEN_NUMBERS: Record<string, number> = {
  zero: 0,
  zéro: 0,
  un: 1,
  une: 1,
  premier: 1,
  premiere: 1,
  première: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  'dix-sept': 17,
  'dix sept': 17,
  'dix-huit': 18,
  'dix huit': 18,
  'dix-neuf': 19,
  'dix neuf': 19,
  vingt: 20,
  'vingt-et-un': 21,
  'vingt et un': 21,
  'vingt-deux': 22,
  'vingt deux': 22,
  'vingt-trois': 23,
  'vingt trois': 23,
  'vingt-quatre': 24,
  'vingt quatre': 24,
  'vingt-cinq': 25,
  'vingt cinq': 25,
  'vingt-six': 26,
  'vingt six': 26,
  'vingt-sept': 27,
  'vingt sept': 27,
  'vingt-huit': 28,
  'vingt huit': 28,
  'vingt-neuf': 29,
  'vingt neuf': 29,
  trente: 30,
  'trente-et-un': 31,
  'trente et un': 31,
  quarante: 40,
  cinquante: 50,
};

export function normalizeSpeechText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .trim();
}

function normalizeWordNumbers(text: string): string {
  let out = text;
  const entries = Object.entries(SPOKEN_NUMBERS).sort((a, b) => b[0].length - a[0].length);
  for (const [word, num] of entries) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), String(num));
  }
  return out;
}

function extractFrenchDate(
  rawText: string
): { day?: number; month?: number; year?: number } | null {
  const numText = normalizeWordNumbers(rawText.toLowerCase());

  // Pattern: 15 mai 1988 or 1er avril 2000 or 15 mai
  const monthNames = Object.keys(FRENCH_MONTHS).join('|');
  const namedRe = new RegExp(
    `\\b(\\d{1,2})(?:er|ere|ème|eme)?\\s+(${monthNames})(?:\\s+(19\\d{2}|20\\d{2}))?\\b`,
    'i'
  );
  const mNamed = namedRe.exec(numText);
  if (mNamed) {
    const day = Math.min(31, Math.max(1, Number(mNamed[1])));
    const monthKey = mNamed[2].toLowerCase();
    const month = FRENCH_MONTHS[monthKey];
    const year = mNamed[3] ? Number(mNamed[3]) : undefined;
    if (month) return { day, month, year };
  }

  // Pattern: 15/05/1988 or 15-05-1988
  const slashRe = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](19\d{2}|20\d{2})\b/;
  const mSlash = slashRe.exec(numText);
  if (mSlash) {
    const day = Math.min(31, Math.max(1, Number(mSlash[1])));
    const month = Math.min(12, Math.max(1, Number(mSlash[2])));
    const year = Number(mSlash[3]);
    return { day, month, year };
  }

  return null;
}

function extractFrenchTime(rawText: string): { hour: number; minute: number } | null {
  const lower = normalizeWordNumbers(rawText.toLowerCase());
  if (/\bminuit\b/.test(lower)) return { hour: 0, minute: 0 };
  if (/\bmidi\b/.test(lower)) return { hour: 12, minute: 0 };

  const timeRe = /\b(\d{1,2})\s*(?:h|heures?|:)\s*(\d{1,2})?\b/;
  const m = timeRe.exec(lower);
  if (m) {
    const hour = Number(m[1]);
    const minute = m[2] ? Number(m[2]) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }
  return null;
}

function cleanCapturedPhrase(raw: string): string {
  return raw
    .replace(/\b(sil te plait|s'il te plait|s'il vous plait|merci|maintenant|enregistre|sauvegarde)\b/gi, '')
    .replace(/[.,;!?]+$/g, '')
    .trim();
}

export function parseVoiceCommand(
  rawTranscript: string,
  profiles: NatalProfile[] = []
): ParsedVoiceCommand {
  const transcript = rawTranscript.trim();
  const norm = normalizeSpeechText(transcript);
  const normNums = normalizeSpeechText(normalizeWordNumbers(transcript));
  const actions: VoiceAction[] = [];
  const feedbackParts: string[] = [];

  if (!norm) {
    return {
      recognized: false,
      transcript,
      actions: [],
      feedback: 'Commande vide.',
    };
  }

  // 1. Voice assistant control & app exit first
  if (
    /\b(arrete l'ecoute|coupe le micro|desactive la voix|desactive l'ecoute|stop micro|ferme le micro|tai[st]-toi)\b/.test(
      norm
    )
  ) {
    actions.push({ type: 'stopVoiceListening' });
    return {
      recognized: true,
      transcript,
      actions,
      feedback: 'Écoute vocale désactivée.',
    };
  }

  if (/\b(quitter? l'app|quitte l'app|quitter? l'application|fermer? l'application|quitter uranie)\b/.test(norm)) {
    actions.push({ type: 'quitApp' });
    return {
      recognized: true,
      transcript,
      actions,
      feedback: 'Ouverture de la confirmation de sortie.',
    };
  }

  // 2. Modes astrologiques
  const explicitSr = /\b(revolution solaire|rev\.? solaire|anniversaire solaire)\b/.test(norm);
  const explicitTransit = /\b(transit|transits)\b/.test(norm);
  const explicitNatal = /\b(theme natal|carte natale|mon theme|theme de naissance|carte de naissance)\b/.test(
    norm
  );
  const explicitLive = /\b(ciel en direct|en direct|ciel actuel)\b/.test(norm);

  if (explicitNatal) {
    actions.push({ type: 'setMode', mode: 'natal' });
    feedbackParts.push('Mode Thème Natal');
  } else if (explicitSr) {
    actions.push({ type: 'setMode', mode: 'solarReturn' });
    feedbackParts.push('Mode Révolution Solaire');
  } else if (/\b(revolution lunaire|rev\.? lunaire|retour lunaire)\b/.test(norm)) {
    actions.push({ type: 'setMode', mode: 'lunarReturn' });
    feedbackParts.push('Mode Révolution Lunaire');
  } else if (/\b(progression|progressions)\b/.test(norm)) {
    actions.push({ type: 'setMode', mode: 'progressions' });
    feedbackParts.push('Mode Progressions');
  } else if (/\b(synastrie)\b/.test(norm)) {
    actions.push({ type: 'setMode', mode: 'synastry' });
    feedbackParts.push('Mode Synastrie');
  } else if (/\b(composite|theme composite)\b/.test(norm)) {
    actions.push({ type: 'setMode', mode: 'composite' });
    feedbackParts.push('Mode Composite');
  } else if (/\b(comparatif|comparatifs|double roue)\b/.test(norm)) {
    actions.push({ type: 'setMode', mode: 'comparative' });
    feedbackParts.push('Mode Comparatif');
  } else if (explicitLive) {
    actions.push({ type: 'setMode', mode: 'live' });
    feedbackParts.push('Mode Ciel en direct');
  } else if (explicitTransit) {
    actions.push({ type: 'setMode', mode: 'transits' });
    feedbackParts.push('Mode Transits');
  }

  // 3. Extract birth profile data or transit date if spoken in a natal/profile sentence
  const extractedDate = extractFrenchDate(transcript);
  const extractedTime = extractFrenchTime(transcript);

  // Person name detection: "theme natal de Marie", "prenom Lucas", "pour Sophie"
  let extractedName: string | undefined;
  const nameMatch =
    /\b(?:prenom|nom(?:mee)?|pour)\s+([a-zA-ZÀ-ÿ-]{2,24})\b/i.exec(transcript) ||
    /\b(?:theme(?:\s+natal)?|profil)\s+(?:de|d')\s*([a-zA-ZÀ-ÿ-]{2,24})\b/i.exec(transcript);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    const stopWords = new Set([
      'naissance',
      'jour',
      'demain',
      'hier',
      'paris',
      'lyon',
      'marseille',
      'base',
      'referentiel',
    ]);
    if (!stopWords.has(normalizeSpeechText(candidate))) {
      extractedName = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  // Check if user wants to load an existing saved profile ("charge le theme de Marie" / "ouvre profil Thomas")
  if (/\b(charge|ouvre|selectionne|affiche)\s+(?:le\s+)?(?:profil|theme)\b/.test(norm) && !extractedDate && !extractedTime) {
    const matchedProfile = profiles.find((p) => {
      const pNorm = normalizeSpeechText(p.name);
      return pNorm.length >= 2 && norm.includes(pNorm);
    });
    if (matchedProfile) {
      actions.push({
        type: 'selectProfile',
        profileId: matchedProfile.id,
        profileName: matchedProfile.name,
      });
      feedbackParts.push(`Profil ${matchedProfile.name} sélectionné`);
    }
  }

  // Determine whether spoken date applies to transit or birth profile
  const isTransitContext =
    (explicitTransit || /\b(du|pour le)\s+\d/.test(norm)) &&
    !explicitNatal &&
    !/\b(nee?|naissance)\b/.test(norm);

  if ((extractedDate || extractedTime || extractedName) && !isTransitContext) {
    const patch: {
      name?: string;
      year?: number;
      month?: number;
      day?: number;
      hour?: number;
      minute?: number;
    } = {};
    if (extractedName) patch.name = extractedName;
    if (extractedDate?.day) patch.day = extractedDate.day;
    if (extractedDate?.month) patch.month = extractedDate.month;
    if (extractedDate?.year) patch.year = extractedDate.year;
    if (extractedTime) {
      patch.hour = extractedTime.hour;
      patch.minute = extractedTime.minute;
    }
    actions.push({ type: 'updateBirthProfile', patch });
    const descBits: string[] = [];
    if (patch.name) descBits.push(`prénom ${patch.name}`);
    if (patch.day || patch.month || patch.year) {
      descBits.push(
        `date ${patch.day ?? '—'}/${patch.month ?? '—'}/${patch.year ?? '—'}`
      );
    }
    if (patch.hour !== undefined) {
      descBits.push(
        `heure ${String(patch.hour).padStart(2, '0')}h${String(patch.minute ?? 0).padStart(2, '0')}`
      );
    }
    feedbackParts.push(`Thème mis à jour (${descBits.join(', ')})`);
  } else if (isTransitContext && (extractedDate || extractedTime)) {
    const now = new Date();
    const target = new Date(
      extractedDate?.year ?? now.getFullYear(),
      (extractedDate?.month ?? now.getMonth() + 1) - 1,
      extractedDate?.day ?? now.getDate(),
      extractedTime?.hour ?? now.getHours(),
      extractedTime?.minute ?? now.getMinutes()
    );
    actions.push({ type: 'setTransitDate', date: target });
    feedbackParts.push('Date de transit appliquée');
  }

  // SR year if explicitly mentioned ("revolution solaire 2027")
  if (explicitSr || /\b(annee)\s+(19\d{2}|20\d{2})\b/.test(norm)) {
    const yMatch = /\b(19\d{2}|20\d{2})\b/.exec(normNums);
    if (yMatch && !extractedDate?.year) {
      const yr = Number(yMatch[1]);
      actions.push({ type: 'setSrYear', year: yr });
      feedbackParts.push(`Révolution Solaire ${yr}`);
    }
  }

  // 4. City / Postal code voice search ("cherche Lyon", "né à Bordeaux", "code postal 75008", "à Marseille")
  let placeQuery: string | null = null;
  let isSrPlace = explicitSr || /\b(anniversaire|revolution solaire)\b/.test(norm);

  const postalMatch = /\bcode\s+postal\s+(\d{5})\b/i.exec(transcript);
  if (postalMatch) {
    placeQuery = postalMatch[1];
  } else {
    const searchVerbMatch =
      /\b(?:cherche|recherche|trouve)\s+(?:la\s+ville\s+(?:de\s+)?|le\s+lieu\s+(?:de\s+)?)?([a-zA-ZÀ-ÿ0-9\s'-]{2,36})/i.exec(
        transcript
      );
    if (searchVerbMatch) {
      placeQuery = cleanCapturedPhrase(searchVerbMatch[1]);
    } else {
      const bornAtMatch =
        /\b(?:nee?\s+a|lieu(?:\s+de\s+naissance)?|ville(?:\s+de\s+naissance)?)\s+([a-zA-ZÀ-ÿ0-9'-]{2,30}(?:\s+[a-zA-ZÀ-ÿ0-9'-]{2,20})?)/i.exec(
          transcript
        );
      if (bornAtMatch) {
        placeQuery = cleanCapturedPhrase(bornAtMatch[1]);
      } else if (extractedDate || explicitNatal || explicitSr) {
        // E.g. "... à 14h30 à Lyon" or "... à Nice"
        const trailingAtMatch = /\b(?:a|à)\s+([a-zA-ZÀ-ÿ'-]{3,28}|\d{5})\s*$/i.exec(transcript);
        if (trailingAtMatch && !/^\d{1,2}h/i.test(trailingAtMatch[1])) {
          placeQuery = cleanCapturedPhrase(trailingAtMatch[1]);
        }
      }
    }
  }

  if (placeQuery && placeQuery.length >= 2 && !/^(gauche|droite|jour|heure)$/i.test(placeQuery)) {
    if (isSrPlace) {
      actions.push({ type: 'searchSrPlace', query: placeQuery });
      feedbackParts.push(`Lieu anniversaire : ${placeQuery}`);
    } else {
      actions.push({ type: 'searchBirthPlace', query: placeQuery });
      feedbackParts.push(`Recherche du lieu : ${placeQuery}`);
    }
  }

  // 5. Profile CRUD & Ascendant Calculator
  if (/\b(enregistre|sauvegarde)\b/.test(norm)) {
    actions.push({ type: 'saveProfile' });
    feedbackParts.push('Profil enregistré');
  }
  if (/\b(nouveau theme|nouveau profil|cree un theme)\b/.test(norm)) {
    actions.push({ type: 'newProfile' });
    feedbackParts.push('Nouveau thème créé');
  }
  if (/\b(calculateur d'ascendant|calcule l'ascendant|ascendant seul)\b/.test(norm)) {
    actions.push({ type: 'openAscendant' });
    feedbackParts.push('Calculateur d’Ascendant ouvert');
  }

  // 6. Planet & House Selection
  const planetPatterns: Array<[RegExp, PlanetId, string]> = [
    [/\bsoleil\b/, 'sun', 'Soleil'],
    [/\blune\b/, 'moon', 'Lune'],
    [/\bmercure\b/, 'mercury', 'Mercure'],
    [/\bvenus\b/, 'venus', 'Vénus'],
    [/\bmars\b/, 'mars', 'Mars'],
    [/\bjupiter\b/, 'jupiter', 'Jupiter'],
    [/\bsaturne\b/, 'saturn', 'Saturne'],
    [/\buranus\b/, 'uranus', 'Uranus'],
    [/\bneptune\b/, 'neptune', 'Neptune'],
    [/\bpluton\b/, 'pluto', 'Pluton'],
    [/\b(noeud nord|nœud nord)\b/, 'northNode', 'Nœud Nord'],
  ];
  for (const [re, pid, label] of planetPatterns) {
    if (re.test(norm)) {
      actions.push({ type: 'selectPlanet', planetId: pid });
      feedbackParts.push(`Astre sélectionné : ${label}`);
      break;
    }
  }

  const houseMatch = /\bmaison\s+(1[0-2]|[1-9])\b/.exec(normNums);
  if (houseMatch && !/\b(affiche|montre|active|masque|cache|desactive)\s+(?:les\s+)?maisons\b/.test(norm)) {
    const hNum = Number(houseMatch[1]);
    actions.push({ type: 'selectHouse', house: hNum });
    feedbackParts.push(`Maison ${hNum} sélectionnée`);
  }

  if (/\b(ferme le panneau|ferme l'inspecteur|efface la selection|rien selectionne)\b/.test(norm)) {
    actions.push({ type: 'clearSelection' });
    feedbackParts.push('Panneau fermé');
  }

  // 7. 2D / 3D Views & Camera Presets
  if (/\b(2d|deux dimensions|vue 2d|carte 2d|mode 2d)\b/.test(norm)) {
    actions.push({ type: 'setViewDimension', dim: '2d' });
    feedbackParts.push('Vue 2D activée');
  } else if (/\b(3d|trois dimensions|vue 3d|sphere 3d|mode 3d)\b/.test(norm)) {
    actions.push({ type: 'setViewDimension', dim: '3d' });
    feedbackParts.push('Vue 3D activée');
  }

  if (/\b(centre 360|vue 360|mode 360|interieur 360|au centre)\b/.test(norm)) {
    actions.push({ type: 'setViewDimension', dim: '3d' });
    actions.push({ type: 'setCameraPreset', preset: 'center' });
    feedbackParts.push('Vue Centre 360°');
  } else if (/\b(vue observatoire|vue exterieure|quitte 360|quitter 360)\b/.test(norm)) {
    actions.push({ type: 'setCameraPreset', preset: 'overview' });
    feedbackParts.push('Vue Observatoire');
  } else if (/\b(plan zenithal|zenith|vue du dessus)\b/.test(norm)) {
    actions.push({ type: 'setCameraPreset', preset: 'ecliptic' });
    feedbackParts.push('Plan Zénithal');
  } else if (/\b(horizon|vue horizon)\b/.test(norm)) {
    actions.push({ type: 'setCameraPreset', preset: 'horizon' });
    feedbackParts.push('Vue Horizon');
  }

  if (/\b(menu 3d ici|amene le menu|pupitre devant moi|ramene le menu)\b/.test(norm)) {
    actions.push({ type: 'bringMenuHere' });
    feedbackParts.push('Menu 3D recentré devant vous');
  }

  // 8. Tradition & Visual Toggles
  if (/\b(chinois|chinoise)\b/.test(norm)) {
    actions.push({ type: 'setTradition', tradition: 'chinese' });
    feedbackParts.push('Zodiaque Chinois');
  } else if (/\b(occidental|occidentale|tropical)\b/.test(norm)) {
    actions.push({ type: 'setTradition', tradition: 'western' });
    feedbackParts.push('Zodiaque Occidental');
  }

  const wantsEnable = /\b(active|affiche|montre|allume|mets?)\b/.test(norm);
  const wantsDisable = /\b(desactive|masque|cache|enleve|eteins|coupe)\b/.test(norm);

  if (/\bmaisons\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setHousesVisible', visible: !wantsDisable });
    feedbackParts.push(wantsDisable ? 'Maisons masquées' : 'Maisons affichées');
  }
  if (/\b(voute etoilee|constellations)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setConstellationsVisible', visible: !wantsDisable });
    feedbackParts.push(wantsDisable ? 'Voûte étoilée masquée' : 'Voûte étoilée affichée');
  }
  if (/\b(pupitre)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setVRPlaqueVisible', visible: !wantsDisable });
    feedbackParts.push(wantsDisable ? 'Pupitre masqué' : 'Pupitre affiché');
  }
  if (/\b(etoiles filantes)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setSkyAnimations', patch: { shootingStars: !wantsDisable } });
    feedbackParts.push(wantsDisable ? 'Étoiles filantes coupées' : 'Étoiles filantes activées');
  }
  if (/\b(nebuleuse|nebuleuses)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setSkyAnimations', patch: { nebulae: !wantsDisable } });
    feedbackParts.push(wantsDisable ? 'Nébuleuses coupées' : 'Nébuleuses activées');
  }
  if (/\b(aurore|aurores)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setSkyAnimations', patch: { aurora: !wantsDisable } });
    feedbackParts.push(wantsDisable ? 'Aurores boréales coupées' : 'Aurores boréales activées');
  }
  if (/\b(animations? du ciel|ciel anime)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    const val = !wantsDisable;
    actions.push({
      type: 'setSkyAnimations',
      patch: { shootingStars: val, nebulae: val, aurora: val },
    });
    feedbackParts.push(val ? 'Animations du ciel activées' : 'Animations du ciel désactivées');
  }

  // 9. Time Playback & Stepping
  if (/\b(pause|stoppe? l'animation|arrete l'animation)\b/.test(norm)) {
    actions.push({ type: 'setTimePlayback', action: 'pause' });
    feedbackParts.push('Animation en pause');
  } else if (/\b(temps reel|maintenant|heure actuelle)\b/.test(norm) && !explicitLive) {
    actions.push({ type: 'setTimePlayback', action: 'realtime' });
    feedbackParts.push('Synchronisé en temps réel');
  } else if (/\b(anime|lecture|play|demarre l'animation)\b/.test(norm)) {
    actions.push({ type: 'setTimePlayback', action: 'play' });
    feedbackParts.push('Animation démarrée');
  }

  const stepDir = /\b(recule|reculer|precedent|avant|moins)\b/.test(norm) ? -1 : /\b(avance|avancer|suivant|demain|plus)\b/.test(norm) ? 1 : 0;
  if (stepDir !== 0 && /\b(heure|heures|jour|jours|semaine|semaines|mois|an|ans|minute|minutes)\b/.test(norm)) {
    const qtyMatch = /\b(\d+)\s*(?:minute|heure|jour|semaine|mois|an)/.exec(normNums);
    const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
    let mins = 60;
    if (/\bminute/.test(norm)) mins = 1;
    else if (/\bheure/.test(norm)) mins = 60;
    else if (/\bjour/.test(norm)) mins = 1440;
    else if (/\bsemaine/.test(norm)) mins = 1440 * 7;
    else if (/\bmois\b/.test(norm)) mins = 1440 * 30;
    else if (/\ban/.test(norm)) mins = 1440 * 365;
    actions.push({ type: 'stepTime', deltaMinutes: stepDir * qty * mins });
    feedbackParts.push(`Décalage temporel appliqué`);
  } else if (/\bdemain\b/.test(norm)) {
    actions.push({ type: 'stepTime', deltaMinutes: 1440 });
    feedbackParts.push('Avance d’un jour');
  } else if (/\bhier\b/.test(norm)) {
    actions.push({ type: 'stepTime', deltaMinutes: -1440 });
    feedbackParts.push('Recul d’un jour');
  }

  // 10. Audio & Spoken Feedback
  if (/\b(reponse vocale|retour vocal|parle)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setVoiceFeedback', enabled: !wantsDisable });
    feedbackParts.push(wantsDisable ? 'Réponse vocale coupée' : 'Réponse vocale activée');
  } else if (/\b(son|audio|bruitage)\b/.test(norm) && (wantsEnable || wantsDisable)) {
    actions.push({ type: 'setAudioEnabled', enabled: !wantsDisable });
    feedbackParts.push(wantsDisable ? 'Audio coupé' : 'Audio activé');
  }

  // 11. Tabs, Modals, Dock & WebXR VR/MR
  if (/\b(masque les controles|cache les controles|reduis les controles)\b/.test(norm)) {
    actions.push({ type: 'toggleDockCollapsed', collapsed: true });
    feedbackParts.push('Panneau masqué');
  } else if (/\b(affiche les controles|montre les controles|ouvre les controles)\b/.test(norm)) {
    actions.push({ type: 'toggleDockCollapsed', collapsed: false });
    feedbackParts.push('Panneau affiché');
  }

  if (/\b(resume|bilan|interpretation complete|tableau comparatif)\b/.test(norm)) {
    actions.push({ type: 'openSummary', open: !/\bferme\b/.test(norm) });
    feedbackParts.push(/\bferme\b/.test(norm) ? 'Résumé fermé' : 'Résumé complet ouvert');
  }
  if (/\b(onglet aide|ouvre l'aide|besoin d'aide|aide interactive)\b/.test(norm)) {
    actions.push({ type: 'openTab', tab: 'help' });
    feedbackParts.push('Onglet Aide ouvert');
  } else if (/\b(reglages|parametres)\b/.test(norm)) {
    actions.push({ type: 'openTab', tab: 'settings' });
    feedbackParts.push('Onglet Réglages ouvert');
  } else if (/\b(onglet aspects|liste des aspects)\b/.test(norm)) {
    actions.push({ type: 'openTab', tab: 'aspects' });
    feedbackParts.push('Onglet Aspects ouvert');
  }

  if (/\b(presentation|introduction audio|visite audio|musique esoterique)\b/.test(norm)) {
    actions.push({ type: 'openIntro' });
    feedbackParts.push('Présentation audio ouverte');
  }
  if (/\b(guide quest|sideload|apk)\b/.test(norm)) {
    actions.push({ type: 'openQuestGuide' });
    feedbackParts.push('Guide Meta Quest ouvert');
  }
  if (/\b(pdf|imprime|imprimer|partage|partager|lien)\b/.test(norm)) {
    actions.push({ type: 'openPdfShare' });
    feedbackParts.push('Partage & PDF ouvert');
  }

  if (/\b(realite mixte|hologramme|passthrough)\b/.test(norm)) {
    actions.push({ type: 'enterMR' });
    feedbackParts.push('Réalité Mixte basculée');
  } else if (/\b(entre en vr|lance la vr|mode vr|quitte la vr)\b/.test(norm)) {
    actions.push({ type: 'enterVR' });
    feedbackParts.push('Mode VR basculé');
  }

  if (actions.length === 0) {
    return {
      recognized: false,
      transcript,
      actions: [],
      feedback: `Commande non reconnue : « ${transcript} ». Dites par exemple « Thème natal », « Transits », « Cherche Lyon », « Montre Soleil » ou « Vue 2D ».`,
    };
  }

  return {
    recognized: true,
    transcript,
    actions,
    feedback: feedbackParts.join(' · '),
  };
}
