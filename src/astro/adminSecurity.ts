export type AutoLockMinutes = 0 | 5 | 15 | 30;

export interface AdminSecurityPolicy {
  /** Empêcher création, édition, suppression et import depuis Bibliothèque des Astres */
  lockEditionProfiles: boolean;
  /** Verrouiller l'ouverture de Config (33 Maisons, 21 Aspects, Styles, Typographie) */
  lockConfigDrawer: boolean;
  /** Figer le mode de carte et la navigation temporelle (Spacetime Navigator) */
  lockChartModeSwitch: boolean;
  /** Empêcher l'ouverture des exports PDF, Impression, WhatsApp et E-mail */
  lockExports: boolean;
  /** Bloquer le bouton Quitter l'application */
  lockQuitApp: boolean;
  /** Délai d'inactivité (minutes) avant verrouillage automatique de la session Admin */
  autoLockMinutes: AutoLockMinutes;
}

export interface SecurityAuditEntry {
  id: string;
  timestampIso: string;
  event: string;
  severity: 'info' | 'warning' | 'success';
}

export interface AdminSecurityState {
  version: 1;
  passwordHash: string | null;
  salt: string;
  /** Quand true, les verrous de la politique s'appliquent dès que la session Admin est verrouillée */
  protectionActive: boolean;
  /** Quand true, tout le logiciel est masqué derrière l'écran de verrouillage intégral */
  screenLocked: boolean;
  failedAttempts: number;
  lockedUntilTs: number | null;
  policy: AdminSecurityPolicy;
  auditLog: SecurityAuditEntry[];
}

const ADMIN_SECURITY_STORAGE_KEY = 'uranie_admin_security_v1';
const MAX_FAILED_ATTEMPTS = 5;
const BRUTE_FORCE_COOLDOWN_MS = 30_000;

export const DEFAULT_ADMIN_POLICY: AdminSecurityPolicy = {
  lockEditionProfiles: true,
  lockConfigDrawer: true,
  lockChartModeSwitch: false,
  lockExports: false,
  lockQuitApp: true,
  autoLockMinutes: 15,
};

function generateRandomSalt(): string {
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
}

export async function hashAdminPassword(password: string, salt: string): Promise<string> {
  const payload = `uranie-admin:${salt}:${password}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(payload);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if subtle crypto is unavailable in a non-secure origin
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < payload.length; i += 1) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b);
  }
  return `fb-${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function appendAuditEntry(
  prevLog: SecurityAuditEntry[],
  event: string,
  severity: SecurityAuditEntry['severity'] = 'info'
): SecurityAuditEntry[] {
  const entry: SecurityAuditEntry = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestampIso: new Date().toISOString(),
    event,
    severity,
  };
  return [entry, ...prevLog].slice(0, 20);
}

export function createInitialAdminSecurityState(): AdminSecurityState {
  return {
    version: 1,
    passwordHash: null,
    salt: generateRandomSalt(),
    protectionActive: false,
    screenLocked: false,
    failedAttempts: 0,
    lockedUntilTs: null,
    policy: { ...DEFAULT_ADMIN_POLICY },
    auditLog: [],
  };
}

export function loadAdminSecurityState(): AdminSecurityState {
  try {
    const raw = localStorage.getItem(ADMIN_SECURITY_STORAGE_KEY);
    if (!raw) return createInitialAdminSecurityState();
    const parsed = JSON.parse(raw) as Partial<AdminSecurityState>;
    return {
      version: 1,
      passwordHash: typeof parsed.passwordHash === 'string' ? parsed.passwordHash : null,
      salt: typeof parsed.salt === 'string' && parsed.salt ? parsed.salt : generateRandomSalt(),
      protectionActive: Boolean(parsed.protectionActive && parsed.passwordHash),
      screenLocked: Boolean(parsed.screenLocked && parsed.passwordHash),
      failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntilTs: typeof parsed.lockedUntilTs === 'number' ? parsed.lockedUntilTs : null,
      policy: {
        lockEditionProfiles: parsed.policy?.lockEditionProfiles ?? DEFAULT_ADMIN_POLICY.lockEditionProfiles,
        lockConfigDrawer: parsed.policy?.lockConfigDrawer ?? DEFAULT_ADMIN_POLICY.lockConfigDrawer,
        lockChartModeSwitch: parsed.policy?.lockChartModeSwitch ?? DEFAULT_ADMIN_POLICY.lockChartModeSwitch,
        lockExports: parsed.policy?.lockExports ?? DEFAULT_ADMIN_POLICY.lockExports,
        lockQuitApp: parsed.policy?.lockQuitApp ?? DEFAULT_ADMIN_POLICY.lockQuitApp,
        autoLockMinutes:
          parsed.policy?.autoLockMinutes === 0 ||
          parsed.policy?.autoLockMinutes === 5 ||
          parsed.policy?.autoLockMinutes === 15 ||
          parsed.policy?.autoLockMinutes === 30
            ? parsed.policy.autoLockMinutes
            : DEFAULT_ADMIN_POLICY.autoLockMinutes,
      },
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog.slice(0, 20) : [],
    };
  } catch {
    return createInitialAdminSecurityState();
  }
}

export function saveAdminSecurityState(state: AdminSecurityState): void {
  try {
    localStorage.setItem(ADMIN_SECURITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export async function verifyAdminPasswordAttempt(
  state: AdminSecurityState,
  candidatePassword: string
): Promise<{
  ok: boolean;
  nextState: AdminSecurityState;
  errorMsg: string | null;
}> {
  const now = Date.now();
  if (state.lockedUntilTs && now < state.lockedUntilTs) {
    const remainingSec = Math.ceil((state.lockedUntilTs - now) / 1000);
    return {
      ok: false,
      nextState: state,
      errorMsg: `Trop de tentatives. Réessayez dans ${remainingSec} s.`,
    };
  }

  if (!state.passwordHash) {
    return {
      ok: true,
      nextState: { ...state, failedAttempts: 0, lockedUntilTs: null },
      errorMsg: null,
    };
  }

  const candidateHash = await hashAdminPassword(candidatePassword, state.salt);
  if (candidateHash === state.passwordHash) {
    return {
      ok: true,
      nextState: {
        ...state,
        failedAttempts: 0,
        lockedUntilTs: null,
        screenLocked: false,
        auditLog: appendAuditEntry(state.auditLog, 'Session Admin déverrouillée', 'success'),
      },
      errorMsg: null,
    };
  }

  const nextFailed = (state.failedAttempts || 0) + 1;
  const triggerCooldown = nextFailed >= MAX_FAILED_ATTEMPTS;
  const lockedUntilTs = triggerCooldown ? now + BRUTE_FORCE_COOLDOWN_MS : null;
  const nextState: AdminSecurityState = {
    ...state,
    failedAttempts: triggerCooldown ? 0 : nextFailed,
    lockedUntilTs,
    auditLog: appendAuditEntry(
      state.auditLog,
      triggerCooldown
        ? '5 échecs consécutifs — blocage temporaire 30s'
        : `Tentative de mot de passe incorrecte (${nextFailed}/${MAX_FAILED_ATTEMPTS})`,
      'warning'
    ),
  };

  return {
    ok: false,
    nextState,
    errorMsg: triggerCooldown
      ? 'Mot de passe incorrect (5 tentatives). Sécurité activée pour 30 secondes.'
      : `Mot de passe incorrect (tentative ${nextFailed}/${MAX_FAILED_ATTEMPTS}).`,
  };
}

export function evaluatePasswordStrength(password: string): {
  label: string;
  level: 1 | 2 | 3;
  toneClass: string;
} {
  const len = password.length;
  const hasMix = /[A-Z]/.test(password) && /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (len >= 10 && (hasMix || hasSpecial)) {
    return { label: 'Robuste', level: 3, toneClass: 'text-emerald-300' };
  }
  if (len >= 6) {
    return { label: 'Intermédiaire', level: 2, toneClass: 'text-amber-300' };
  }
  return { label: 'Basique', level: 1, toneClass: 'text-rose-300' };
}
