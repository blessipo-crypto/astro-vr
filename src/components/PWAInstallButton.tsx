import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-[#07070C]/70 bg-white/[0.03] backdrop-blur-xl px-3.5 py-1.5 text-xs font-medium text-[#f3efe6] hover:border-amber-300/30 transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-black/30"
      >
        <Download className="w-3.5 h-3.5 text-amber-300/80" />
        Installer l’app
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#07070C]/70 bg-white/[0.03] backdrop-blur-xl px-3.5 py-1.5 text-xs font-medium text-[#f3efe6] hover:border-amber-300/30 transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-black/30"
        >
          <Download className="w-3.5 h-3.5 text-amber-300/80" />
          Installer sur iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070C]/80 backdrop-blur-xl p-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d16]/90 bg-white/[0.03] backdrop-blur-xl p-6 text-[#f3efe6] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase">
                  Installer sur iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fermer"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-all duration-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                1. Touchez le bouton <strong>Partager</strong> dans la barre d’outils Safari.
                <br />
                2. Faites défiler et touchez <strong>Sur l’écran d’accueil</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-8 py-3.5 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
