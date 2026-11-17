import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileDown,
  History,
  KeyRound,
  Lock,
  MonitorOff,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Unlock,
  UserCheck,
} from 'lucide-react';
import {
  AdminSecurityPolicy,
  AdminSecurityState,
  AutoLockMinutes,
  evaluatePasswordStrength,
} from '../astro/adminSecurity';
import { NatalProfile } from '../astro/astroEngine';

export interface AdminSecurityViewProps {
  securityState: AdminSecurityState;
  isAdminUnlocked: boolean;
  profiles: NatalProfile[];
  onInitializePassword: (password: string, enableProtectionImmediately: boolean) => Promise<void>;
  onUnlockAdmin: (password: string) => Promise<{ ok: boolean; errorMsg: string | null }>;
  onLockAdminSession: () => void;
  onActivateProtectionAndClose: () => void;
  onEnableFullScreenLock: () => void;
  onToggleProtectionActive: (active: boolean) => void;
  onUpdatePolicy: (patch: Partial<AdminSecurityPolicy>) => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; errorMsg: string | null }>;
  onDisableSecurity: (currentPassword: string) => Promise<{ ok: boolean; errorMsg: string | null }>;
  onClearAuditLog: () => void;
  onOpenWheel: () => void;
}

const POLICY_ITEMS: Array<{
  key: keyof Omit<AdminSecurityPolicy, 'autoLockMinutes'>;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    key: 'lockEditionProfiles',
    title: 'Profils Natals & Bibliothèque',
    description:
      'Empêche la création, la modification, la suppression de thèmes natals et l’import depuis la Bibliothèque des Astres.',
    icon: UserCheck,
  },
  {
    key: 'lockConfigDrawer',
    title: 'Configuration (Maisons, Aspects, Styles)',
    description:
      'Verrouille le tiroir Config (33 systèmes de maisons, 21 aspects, dignités, styles 2D/3D et typographie).',
    icon: SlidersHorizontal,
  },
  {
    key: 'lockChartModeSwitch',
    title: 'Mode de Carte & Temps (Spacetime)',
    description:
      'Fige le mode astrologique actif et bloque la manipulation de la date/vitesse temporelle dans le Spacetime Navigator.',
    icon: Clock,
  },
  {
    key: 'lockExports',
    title: 'Exports PDF, Impression, WhatsApp & Mail',
    description:
      'Protège le partage de liens, l’impression A4, le téléchargement PDF et l’envoi par e-mail ou WhatsApp.',
    icon: FileDown,
  },
  {
    key: 'lockQuitApp',
    title: 'Sortie du Logiciel',
    description:
      'Désactive le bouton « Quitter l’application » dans la barre supérieure pour éviter toute fermeture involontaire.',
    icon: Power,
  },
];

function formatAuditTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  securityState,
  isAdminUnlocked,
  profiles,
  onInitializePassword,
  onUnlockAdmin,
  onLockAdminSession,
  onActivateProtectionAndClose,
  onEnableFullScreenLock,
  onToggleProtectionActive,
  onUpdatePolicy,
  onChangePassword,
  onDisableSecurity,
  onClearAuditLog,
  onOpenWheel,
}) => {
  const hasPassword = Boolean(securityState.passwordHash);

  // Setup state (first time)
  const [setupPass, setSetupPass] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupShowPass, setSetupShowPass] = useState(false);
  const [setupActivateNow, setSetupActivateNow] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);

  // Unlock gate state
  const [unlockPass, setUnlockPass] = useState('');
  const [unlockShowPass, setUnlockShowPass] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [cooldownLeftSec, setCooldownLeftSec] = useState(0);

  // Change password state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Disable security confirmation panel
  const [disablePanelOpen, setDisablePanelOpen] = useState(false);
  const [disableConfirmPass, setDisableConfirmPass] = useState('');
  const [disableErr, setDisableErr] = useState<string | null>(null);

  useEffect(() => {
    if (!securityState.lockedUntilTs) {
      setCooldownLeftSec(0);
      return;
    }
    const tick = () => {
      const diff = Math.ceil((securityState.lockedUntilTs! - Date.now()) / 1000);
      setCooldownLeftSec(diff > 0 ? diff : 0);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [securityState.lockedUntilTs]);

  const strength = evaluatePasswordStrength(setupPass || newPass);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    if (setupPass.length < 4) {
      setSetupError('Veuillez choisir un mot de passe d’au moins 4 caractères.');
      return;
    }
    if (setupPass !== setupConfirm) {
      setSetupError('Les deux saisies du mot de passe ne correspondent pas.');
      return;
    }
    setSetupBusy(true);
    try {
      await onInitializePassword(setupPass, setupActivateNow);
      setSetupPass('');
      setSetupConfirm('');
    } finally {
      setSetupBusy(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    if (!unlockPass) {
      setUnlockError('Saisissez votre mot de passe Administrateur.');
      return;
    }
    setUnlockBusy(true);
    try {
      const res = await onUnlockAdmin(unlockPass);
      if (res.ok) {
        setUnlockPass('');
        setUnlockError(null);
      } else {
        setUnlockError(res.errorMsg ?? 'Mot de passe incorrect.');
      }
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPass.length < 4) {
      setPassMsg({ type: 'err', text: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' });
      return;
    }
    if (newPass !== confirmNewPass) {
      setPassMsg({ type: 'err', text: 'La confirmation du nouveau mot de passe ne correspond pas.' });
      return;
    }
    const res = await onChangePassword(oldPass, newPass);
    if (res.ok) {
      setOldPass('');
      setNewPass('');
      setConfirmNewPass('');
      setPassMsg({ type: 'ok', text: 'Mot de passe Administrateur mis à jour avec succès.' });
    } else {
      setPassMsg({ type: 'err', text: res.errorMsg ?? 'Impossible de modifier le mot de passe.' });
    }
  };

  const handleDisableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableErr(null);
    const res = await onDisableSecurity(disableConfirmPass);
    if (res.ok) {
      setDisablePanelOpen(false);
      setDisableConfirmPass('');
    } else {
      setDisableErr(res.errorMsg ?? 'Mot de passe incorrect.');
    }
  };

  const handleExportProfilesBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      software: 'Uranie · Cosmic Insights',
      profilesCount: profiles.length,
      profiles,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uranie-sauvegarde-profils-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const activeLocksCount = Object.entries(securityState.policy).filter(
    ([k, v]) => k !== 'autoLockMinutes' && v === true
  ).length;

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1220px] space-y-5">
        {/* Hero Header */}
        <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/80 backdrop-blur-xl p-6 shadow-[0_18px_55px_rgba(0,0,0,0.62)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-200/90">
                {securityState.protectionActive && !isAdminUnlocked ? (
                  <Lock className="h-4 w-4 text-amber-300 shrink-0" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                )}
                <span>Administration &amp; Protection Anti-Manipulation</span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span className="font-mono-tabular">
                  {!hasPassword
                    ? 'Non configuré'
                    : isAdminUnlocked
                      ? 'Session Admin ouverte'
                      : securityState.protectionActive
                        ? `Mode Protégé actif (${activeLocksCount} verrous)`
                        : 'Session Admin verrouillée'}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                Espace Administrateur &amp; Sécurité
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Protégez vos thèmes natals, réglages de maisons/aspects et exports contre toute modification accidentelle ou manipulation par un tiers, via un mot de passe haché localement en SHA-256.
              </p>
            </div>

            {hasPassword && isAdminUnlocked && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onActivateProtectionAndClose}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Protéger &amp; Revenir à la Roue</span>
                </button>
                <button
                  type="button"
                  onClick={onEnableFullScreenLock}
                  className="flex items-center gap-1.5 rounded-full border border-rose-400/45 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/25 transition-all cursor-pointer whitespace-nowrap"
                >
                  <MonitorOff className="h-3.5 w-3.5" />
                  <span>Verrouiller l’écran</span>
                </button>
                <button
                  type="button"
                  onClick={onLockAdminSession}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-amber-300/45 transition-all cursor-pointer whitespace-nowrap"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-300" />
                  <span>Fermer session Admin</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* STATE 1: Initial Setup (No password configured yet) */}
        {!hasPassword && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <section className="cosmic-glass-panel lg:col-span-7 rounded-3xl border border-amber-200/30 bg-[#151824]/80 backdrop-blur-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-5 w-5 text-amber-300 shrink-0" />
                <h2 className="font-display text-base font-semibold uppercase tracking-widest text-amber-200">
                  Créer le Mot de Passe Administrateur
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Aucun mot de passe n’est encore défini. Choisissez votre code d’accès Administrateur : il sera immédiatement haché dans votre navigateur (SHA-256 salé) et ne sera jamais enregistré en clair.
              </p>

              <form onSubmit={(e) => void handleSetupSubmit(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Mot de passe Admin (min. 4 caractères)
                    </label>
                    <div className="relative">
                      <input
                        type={setupShowPass ? 'text' : 'password'}
                        value={setupPass}
                        onChange={(e) => setSetupPass(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Votre mot de passe…"
                        className="w-full rounded-xl border border-white/15 bg-[#0c101d] pl-3.5 pr-10 py-2.5 text-sm text-white focus:border-amber-300/60 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setSetupShowPass((v) => !v)}
                        aria-label={setupShowPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-200 cursor-pointer"
                      >
                        {setupShowPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {setupPass.length > 0 && (
                      <div className="mt-1.5 text-[11px] text-slate-400">
                        Robustesse : <span className={`font-semibold ${strength.toneClass}`}>{strength.label}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type={setupShowPass ? 'text' : 'password'}
                      value={setupConfirm}
                      onChange={(e) => setSetupConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Répétez le mot de passe…"
                      className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3.5 py-2.5 text-sm text-white focus:border-amber-300/60 outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setupActivateNow}
                    onChange={(e) => setSetupActivateNow(e.target.checked)}
                    className="mt-0.5 accent-amber-400"
                  />
                  <span>
                    <strong className="text-amber-100">Activer le mode anti-manipulation dès l’enregistrement</strong>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Dès que vous quitterez l’onglet Admin, les profils et la configuration seront protégés en lecture seule.
                    </span>
                  </span>
                </label>

                {setupError && (
                  <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-200">
                    {setupError}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={setupBusy}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 px-6 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.02] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{setupBusy ? 'Chiffrement…' : 'Activer la sécurité Admin'}</span>
                  </button>
                </div>
              </form>
            </section>

            <SecurityRealityCard className="lg:col-span-5" />
          </div>
        )}

        {/* STATE 2: Locked Admin Vault Gate */}
        {hasPassword && !isAdminUnlocked && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <section className="cosmic-glass-panel lg:col-span-6 rounded-3xl border border-amber-200/30 bg-[#151824]/85 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-400/10 text-amber-300">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-semibold uppercase tracking-widest text-amber-100">
                  Console Admin Verrouillée
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {securityState.protectionActive
                    ? 'Le mode anti-manipulation est actuellement actif sur le logiciel. Saisissez votre mot de passe Administrateur pour modifier les verrous ou éditer les thèmes.'
                    : 'Saisissez votre mot de passe pour accéder aux réglages de sécurité, activer les verrous anti-manipulation ou changer votre code.'}
                </p>
              </div>

              <form onSubmit={(e) => void handleUnlockSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mot de passe Administrateur
                  </label>
                  <div className="relative">
                    <input
                      type={unlockShowPass ? 'text' : 'password'}
                      value={unlockPass}
                      onChange={(e) => setUnlockPass(e.target.value)}
                      autoComplete="current-password"
                      disabled={cooldownLeftSec > 0}
                      placeholder="Entrez votre mot de passe…"
                      className="w-full rounded-xl border border-white/15 bg-[#0c101d] pl-3.5 pr-10 py-2.5 text-sm text-white focus:border-amber-300/60 disabled:opacity-50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setUnlockShowPass((v) => !v)}
                      aria-label={unlockShowPass ? 'Masquer' : 'Afficher'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-200 cursor-pointer"
                    >
                      {unlockShowPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {(unlockError || cooldownLeftSec > 0) && (
                  <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-200">
                    {cooldownLeftSec > 0
                      ? `Sécurité anti-force brute : patientez ${cooldownLeftSec} s avant de réessayer.`
                      : unlockError}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={unlockBusy || cooldownLeftSec > 0}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 px-6 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.02] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>{unlockBusy ? 'Vérification…' : 'Déverrouiller Admin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenWheel}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-300/45 transition-all cursor-pointer"
                  >
                    Retourner à la Roue
                  </button>
                </div>
              </form>
            </section>

            <SecurityRealityCard className="lg:col-span-6" />
          </div>
        )}

        {/* STATE 3: Unlocked Admin Console */}
        {hasPassword && isAdminUnlocked && (
          <>
            {/* Master Protection Toggle + Policy Matrix */}
            <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/80 backdrop-blur-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-amber-300" />
                    <h2 className="font-display text-base font-semibold uppercase tracking-widest text-amber-200">
                      Mode Protégé &amp; Restrictions Anti-Manipulation
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300">
                    Activez les verrous ci-dessous, puis cliquez sur « Fermer session Admin » ou « Protéger &amp; Revenir à la Roue » pour mettre le logiciel en lecture seule.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleProtectionActive(!securityState.protectionActive)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    securityState.protectionActive
                      ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.22)]'
                      : 'border-amber-300/35 bg-white/[0.04] text-slate-200 hover:border-amber-300/60'
                  }`}
                >
                  {securityState.protectionActive ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span>Protection Activée</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4 text-amber-300" />
                      <span>Protection Désactivée</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {POLICY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const checked = securityState.policy[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onUpdatePolicy({ [item.key]: !checked })}
                      className={`cosmic-glass-card text-left rounded-2xl border p-4 flex flex-col justify-between gap-3 cursor-pointer ${
                        checked
                          ? 'border-amber-300/45 bg-amber-400/10'
                          : 'border-white/10 bg-[#0b0e19]/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${
                              checked
                                ? 'border-amber-300/45 bg-amber-400/15 text-amber-200'
                                : 'border-white/10 bg-white/[0.03] text-slate-400'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-display text-xs font-semibold tracking-wider text-amber-100">
                            {item.title}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono-tabular font-semibold shrink-0 ${
                            checked ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        >
                          {checked ? 'VERROUILLÉ' : 'LIBRE'}
                        </span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-slate-300">
                        {item.description}
                      </p>
                    </button>
                  );
                })}

                {/* Auto-lock Timer Card */}
                <div className="cosmic-glass-card rounded-2xl border border-white/10 bg-[#0b0e19]/70 p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/35 bg-sky-500/10 text-sky-200 shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-display text-xs font-semibold tracking-wider text-amber-100">
                        Verrouillage automatique
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Après inactivité clavier/souris
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {([0, 5, 15, 30] as AutoLockMinutes[]).map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onUpdatePolicy({ autoLockMinutes: mins })}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                          securityState.policy.autoLockMinutes === mins
                            ? 'bg-sky-400 text-slate-950'
                            : 'border border-white/15 bg-white/[0.04] text-slate-300 hover:border-sky-300/45'
                        }`}
                      >
                        {mins === 0 ? 'Jamais' : `${mins} min`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Password Management + Backup + Security Audit & Honesty Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left: Change Password & Backup */}
              <section className="cosmic-glass-panel lg:col-span-6 rounded-3xl border border-amber-200/25 bg-[#151824]/80 backdrop-blur-xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-amber-300" />
                    <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-200">
                      Mot de passe &amp; Sauvegarde
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportProfilesBackup}
                    className="flex items-center gap-1.5 rounded-full border border-sky-300/35 bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/25 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Sauvegarde JSON ({profiles.length})</span>
                  </button>
                </div>

                <form onSubmit={(e) => void handleChangePasswordSubmit(e)} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white focus:border-amber-300/60 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white focus:border-amber-300/60 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Confirmer le nouveau
                      </label>
                      <input
                        type="password"
                        value={confirmNewPass}
                        onChange={(e) => setConfirmNewPass(e.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-white/15 bg-[#0c101d] px-3 py-2 text-xs text-white focus:border-amber-300/60 outline-none"
                      />
                    </div>
                  </div>

                  {passMsg && (
                    <div
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        passMsg.type === 'ok'
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                          : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
                      }`}
                    >
                      {passMsg.text}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-full bg-amber-400/90 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-all cursor-pointer"
                    >
                      Mettre à jour le mot de passe
                    </button>

                    <button
                      type="button"
                      onClick={() => setDisablePanelOpen((v) => !v)}
                      className="text-xs text-rose-300/90 hover:text-rose-200 underline underline-offset-4 cursor-pointer"
                    >
                      Supprimer le mot de passe Admin
                    </button>
                  </div>
                </form>

                {disablePanelOpen && (
                  <form
                    onSubmit={(e) => void handleDisableSubmit(e)}
                    className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 space-y-3"
                  >
                    <p className="text-xs text-rose-100">
                      Confirmez avec votre mot de passe actuel pour retirer toute protection par mot de passe :
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="password"
                        value={disableConfirmPass}
                        onChange={(e) => setDisableConfirmPass(e.target.value)}
                        placeholder="Mot de passe actuel…"
                        className="flex-1 min-w-[180px] rounded-xl border border-white/15 bg-[#0c101d] px-3 py-1.5 text-xs text-white outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-400/50 bg-rose-500/30 px-4 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/45 cursor-pointer"
                      >
                        Confirmer suppression
                      </button>
                    </div>
                    {disableErr && <div className="text-xs text-rose-200">{disableErr}</div>}
                  </form>
                )}
              </section>

              {/* Right: Security Audit Log */}
              <section className="cosmic-glass-panel lg:col-span-6 rounded-3xl border border-amber-200/25 bg-[#151824]/80 backdrop-blur-xl p-6 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-sky-300" />
                      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-sky-200">
                        Journal de Sécurité Local
                      </h2>
                    </div>
                    {securityState.auditLog.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearAuditLog}
                        className="text-[11px] text-slate-400 hover:text-amber-200 cursor-pointer"
                      >
                        Effacer le journal
                      </button>
                    )}
                  </div>

                  {securityState.auditLog.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      Aucun événement enregistré pour l’instant.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto cosmic-scroll pr-1">
                      {securityState.auditLog.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0e19]/80 px-3 py-2 text-xs"
                        >
                          <span
                            className={
                              entry.severity === 'warning'
                                ? 'text-rose-200'
                                : entry.severity === 'success'
                                  ? 'text-emerald-200'
                                  : 'text-slate-200'
                            }
                          >
                            {entry.event}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                            {formatAuditTime(entry.timestampIso)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <SecurityRealityCard className="lg:col-span-5" />
              <PrivateDeploymentCertificationCard className="lg:col-span-7" />
            </div>
          </>
        )}

        {!isAdminUnlocked && <PrivateDeploymentCertificationCard />}
      </div>
    </div>
  );
};

interface RuntimeIntegrityResult {
  checkedAtIso: string;
  origin: string;
  isSecureContext: boolean;
  hasSubtleCrypto: boolean;
  serviceWorkerActive: boolean;
  entryHtmlSha256: string | null;
  manifestStatus: 'verified' | 'mismatch' | 'dev-or-absent';
  manifestGeneratedAt: string | null;
  verifiedAssetsCount: number;
  failedAssets: string[];
}

async function computeBlobSha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const PrivateDeploymentCertificationCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditResult, setAuditResult] = useState<RuntimeIntegrityResult | null>(null);

  const runRuntimeIntegrityCheck = async () => {
    setAuditBusy(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'inconnu';
      const isSecureContext = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
      const hasSubtleCrypto = typeof crypto !== 'undefined' && Boolean(crypto.subtle);
      let serviceWorkerActive = false;
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          serviceWorkerActive = regs.length > 0;
        } catch {
          serviceWorkerActive = false;
        }
      }

      let entryHtmlSha256: string | null = null;
      try {
        const htmlRes = await fetch(window.location.pathname || './', { cache: 'no-store' });
        if (htmlRes.ok) {
          entryHtmlSha256 = await computeBlobSha256Hex(await htmlRes.arrayBuffer());
        }
      } catch {
        entryHtmlSha256 = null;
      }

      let manifestStatus: RuntimeIntegrityResult['manifestStatus'] = 'dev-or-absent';
      let manifestGeneratedAt: string | null = null;
      let verifiedAssetsCount = 0;
      const failedAssets: string[] = [];

      try {
        const manifestRes = await fetch('./integrity-manifest.json', { cache: 'no-store' });
        const contentType = manifestRes.headers.get('content-type') || '';
        if (manifestRes.ok && contentType.includes('application/json')) {
          const manifest = (await manifestRes.json()) as {
            generatedAt?: string;
            assets?: Array<{ path: string; sha256: string }>;
          };
          if (Array.isArray(manifest.assets) && manifest.assets.length > 0) {
            manifestGeneratedAt = manifest.generatedAt ?? null;
            const sample = manifest.assets.slice(0, 12);
            for (const asset of sample) {
              try {
                const assetRes = await fetch(`./${asset.path}`, { cache: 'no-store' });
                if (!assetRes.ok) {
                  failedAssets.push(asset.path);
                  continue;
                }
                const digest = await computeBlobSha256Hex(await assetRes.arrayBuffer());
                if (digest && digest === asset.sha256) {
                  verifiedAssetsCount += 1;
                } else if (digest) {
                  failedAssets.push(asset.path);
                }
              } catch {
                failedAssets.push(asset.path);
              }
            }
            manifestStatus = failedAssets.length === 0 && verifiedAssetsCount > 0 ? 'verified' : 'mismatch';
          }
        }
      } catch {
        manifestStatus = 'dev-or-absent';
      }

      setAuditResult({
        checkedAtIso: new Date().toISOString(),
        origin,
        isSecureContext,
        hasSubtleCrypto,
        serviceWorkerActive,
        entryHtmlSha256,
        manifestStatus,
        manifestGeneratedAt,
        verifiedAssetsCount,
        failedAssets,
      });
    } finally {
      setAuditBusy(false);
    }
  };

  useEffect(() => {
    void runRuntimeIntegrityCheck();
  }, []);

  const handleDownloadCertificationChecklist = () => {
    const lines = [
      '=== URANIE VR — FICHE DE CERTIFICATION & DÉPLOIEMENT PRIVÉ ===',
      `Date d'export : ${new Date().toISOString()}`,
      `Origine vérifiée : ${auditResult?.origin ?? window.location.origin}`,
      `Contexte sécurisé (HTTPS / Loopback) : ${auditResult?.isSecureContext ? 'OUI' : 'NON'}`,
      `Web Crypto SHA-256 actif : ${auditResult?.hasSubtleCrypto ? 'OUI' : 'NON'}`,
      `Service Worker hors-ligne actif : ${auditResult?.serviceWorkerActive ? 'OUI' : 'Non détecté (mode dev ou navigateur)'}`,
      `Empreinte SHA-256 index HTML : ${auditResult?.entryHtmlSha256 ?? 'Indisponible'}`,
      `Statut du manifeste d'intégrité : ${auditResult?.manifestStatus ?? 'Non vérifié'} (${auditResult?.verifiedAssetsCount ?? 0} fichiers vérifiés)`,
      '',
      '1. ARCHITECTURE SANS TÉLÉMÉTRIE NI TRACKERS',
      '- Calculs astronomiques/astrologiques 100 % locaux (astronomy-engine).',
      '- Données natales & sécurité stockées uniquement en local (localStorage).',
      '- Aucun tracker publicitaire, aucune télémétrie, aucune exfiltration distante.',
      '- Flux réseau sortants limités au géocodage HTTPS optionnel (geo.api.gouv.fr, nominatim.openstreetmap.org) et polices Google Fonts.',
      '- Coque PC Electron durcie : contextIsolation=true, nodeIntegration=false, sandbox=true, en-têtes nosniff/SAMEORIGIN.',
      '',
      '2. COMMANDES DE VÉRIFICATION AVANT INSTALLATION PRIVÉE',
      '- Audit source + génération manifeste SHA-256 : npm run build && npm run verify:security',
      '- Vérification empreinte Windows (.exe) : Get-FileHash Uranie-VR-Setup.exe -Algorithm SHA256',
      '- Comparer avec le fichier SHA256SUMS.txt et le rapport ANTIVIRUS-SCAN-REPORT.txt (ClamAV).',
      '- Vérification signature APK Android/Quest : apksigner verify --verbose uranie-vr-autonome.apk',
      '',
      '3. SUPPRIMER L’AVERTISSEMENT WINDOWS SMARTSCREEN EN DÉPLOIEMENT PRIVÉ',
      '- Un .exe non signé déclenche "Windows a protégé votre ordinateur" même sans aucun virus.',
      '- Solution 1 (Recommandée) : Signer le .exe avec un certificat Code Signing Authenticode (secrets GitHub WIN_CSC_LINK / WIN_CSC_KEY_PASSWORD).',
      '- Solution 2 (Parc privé / Entreprise) : Déployer la version Web/PWA HTTPS interne (zéro .exe à installer) ou installer votre certificat racine interne sur les postes privés.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uranie-certification-deploiement-prive-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section
      className={`cosmic-glass-panel rounded-3xl border border-emerald-300/25 bg-[#121826]/82 backdrop-blur-xl p-6 space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="h-5 w-5 text-emerald-300 shrink-0" />
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-emerald-200">
              Certification d’Intégrité &amp; Déploiement Privé
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Vérification cryptographique SHA-256, absence de télémétrie et procédure d’installation propre sans virus.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={auditBusy}
            onClick={() => void runRuntimeIntegrityCheck()}
            className="flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${auditBusy ? 'animate-spin' : ''}`} />
            <span>{auditBusy ? 'Vérification…' : 'Vérifier SHA-256'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCertificationChecklist}
            className="flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Fiche Certification (.txt)</span>
          </button>
        </div>
      </div>

      {auditResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11.5px]">
          <div className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 p-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Contexte d’exécution
            </div>
            <div className="font-medium text-emerald-200">
              {auditResult.isSecureContext ? 'Contexte sécurisé actif (HTTPS / Local)' : 'Origine locale non HTTPS'}
            </div>
            <div className="font-mono-tabular text-[10.5px] text-slate-400 truncate" title={auditResult.origin}>
              Origine : {auditResult.origin}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0e19]/80 p-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Empreinte SHA-256 &amp; Manifeste
            </div>
            <div className="font-medium text-sky-200">
              {auditResult.manifestStatus === 'verified'
                ? `Intégrité confirmée (${auditResult.verifiedAssetsCount} fichiers SHA-256 OK)`
                : auditResult.manifestStatus === 'mismatch'
                  ? `Écart détecté sur ${auditResult.failedAssets.length} fichier(s)`
                  : 'Mode dev actif — SHA-256 généré au build'}
            </div>
            <div className="font-mono-tabular text-[10px] text-slate-400 truncate">
              HTML SHA-256 : {auditResult.entryHtmlSha256 ? `${auditResult.entryHtmlSha256.slice(0, 22)}…` : '—'}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5 text-emerald-100">
          <strong className="block text-emerald-200 mb-1">
            Garanties réelles d’installation propre :
          </strong>
          Code exécuté 100 % localement sans télémétrie ni traceur, isolation stricte du bureau PC (
          <span className="font-mono-tabular">contextIsolation</span>,{' '}
          <span className="font-mono-tabular">sandbox</span>, sans accès Node côté interface), audit statique automatique, scan antivirus{' '}
          <span className="font-mono-tabular">ClamAV</span> et liste <span className="font-mono-tabular">SHA256SUMS.txt</span> joints à chaque release.
        </div>

        <div className="rounded-2xl border border-sky-300/25 bg-sky-500/10 p-3.5 text-sky-100">
          <strong className="block text-sky-200 mb-1">
            Pour certifier sans avertissement SmartScreen / Play Protect :
          </strong>
          Un installateur <span className="font-mono-tabular">.exe</span> ou <span className="font-mono-tabular">.apk</span> privé non signé déclenche par défaut une alerte « Éditeur inconnu » même sans virus. Pour un déploiement privé zéro-alerte : utilisez la version <strong>PWA HTTPS privée</strong> (aucun exécutable), ou signez le <span className="font-mono-tabular">.exe</span> avec un certificat <strong>Authenticode (.pfx)</strong> via <span className="font-mono-tabular">WIN_CSC_LINK</span> et l’APK avec votre clé privée.
        </div>
      </div>
    </section>
  );
};

const SecurityRealityCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <section
    className={`cosmic-glass-panel rounded-3xl border border-indigo-300/25 bg-[#121628]/80 backdrop-blur-xl p-6 space-y-4 ${className}`}
  >
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-4.5 w-4.5 text-indigo-300 shrink-0" />
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-indigo-200">
        Peut-on sécuriser le logiciel ? (Portée technique)
      </h2>
    </div>

    <div className="space-y-3 text-xs leading-relaxed text-slate-300">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5 text-emerald-100">
        <strong className="block text-emerald-200 mb-1">
          Ce que cette protection garantit immédiatement :
        </strong>
        Protection efficace contre toute manipulation par un visiteur, client ou élève (mode Kiosque / Lecture seule), écran de verrouillage plein écran, mot de passe chiffré localement en SHA-256 salé, blocage temporaire après 5 échecs et réinitialisation automatique de session au rechargement.
      </div>

      <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3.5 text-amber-100">
        <strong className="block text-amber-200 mb-1">
          Limite d’un navigateur web autonome (100 % local) :
        </strong>
        Comme Uranie tourne directement dans le navigateur sans serveur distant, une personne techniquement avertie ayant accès aux Outils Développeur (F12) ou au stockage local du navigateur peut inspecter ou réinitialiser le stockage local.
      </div>

      <p className="text-[11.5px] text-slate-300">
        <strong className="text-amber-200">Pour une sécurité inviolable en production :</strong> il est possible d’ajouter une authentification serveur (Firebase Auth ou compte utilisateur avec jeton serveur) ou de lancer l’application Electron/Android en mode Kiosque système bloquant F12 et les raccourcis OS.
      </p>
    </div>
  </section>
);
