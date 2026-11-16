import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Stars, Unlock } from 'lucide-react';

export interface ScreenLockOverlayProps {
  open: boolean;
  lockedUntilTs: number | null;
  onUnlock: (password: string) => Promise<{ ok: boolean; errorMsg: string | null }>;
}

export const ScreenLockOverlay: React.FC<ScreenLockOverlayProps> = ({
  open,
  lockedUntilTs,
  onUnlock,
}) => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (!open || !lockedUntilTs) {
      setCooldownSec(0);
      return;
    }
    const tick = () => {
      const rem = Math.ceil((lockedUntilTs - Date.now()) / 1000);
      setCooldownSec(rem > 0 ? rem : 0);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [open, lockedUntilTs]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Entrez votre mot de passe Administrateur.');
      return;
    }
    setBusy(true);
    try {
      const res = await onUnlock(password);
      if (res.ok) {
        setPassword('');
        setError(null);
      } else {
        setError(res.errorMsg ?? 'Mot de passe incorrect.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Logiciel verrouillé par l’administrateur"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#070811]/95 backdrop-blur-2xl p-4"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[440px] w-[440px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="cosmic-glass-panel relative w-full max-w-md rounded-3xl border border-amber-200/30 bg-[#151824]/85 backdrop-blur-xl p-7 shadow-2xl shadow-black/70 space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.2)]">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-amber-200/80">
            <Stars className="h-3.5 w-3.5 text-amber-300" />
            <span>Uranie · Cosmic Insights</span>
          </div>
          <h2 className="font-display text-xl font-semibold uppercase tracking-widest bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
            Logiciel Verrouillé
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            L’accès au logiciel et aux thèmes natals est protégé par mot de passe Administrateur.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={cooldownSec > 0}
              autoComplete="current-password"
              placeholder="Mot de passe Administrateur…"
              className="w-full rounded-xl border border-white/15 bg-[#0c101d] pl-4 pr-10 py-3 text-sm text-white focus:border-amber-300/60 disabled:opacity-50 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Masquer' : 'Afficher'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-200 cursor-pointer"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {(error || cooldownSec > 0) && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-200 text-center">
              {cooldownSec > 0
                ? `Trop de tentatives : réessayez dans ${cooldownSec} s.`
                : error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || cooldownSec > 0}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 px-6 py-3 text-xs font-semibold text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.3)] hover:scale-[1.01] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Unlock className="h-4 w-4" />
            <span>{busy ? 'Déverrouillage…' : 'Déverrouiller le logiciel'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
