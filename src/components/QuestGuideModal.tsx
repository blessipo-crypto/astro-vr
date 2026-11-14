import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Glasses, QrCode, Smartphone, Terminal, X } from 'lucide-react';

interface QuestGuideModalProps {
  open: boolean;
  onClose: () => void;
  webXRSupported: boolean;
  mrSupported: boolean;
  onEnterVR: () => void;
  onEnterMR: () => void;
  shareUrl?: string;
}

export const QuestGuideModal: React.FC<QuestGuideModalProps> = ({
  open,
  onClose,
  webXRSupported,
  mrSupported,
  onEnterVR,
  onEnterMR,
  shareUrl,
}) => {
  const [copiedKey, setCopiedKey] = useState<'url' | 'adb' | 'apk' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [includeTheme, setIncludeTheme] = useState<boolean>(true);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const targetUrl = includeTheme && shareUrl ? shareUrl : originUrl || shareUrl || '';

  useEffect(() => {
    if (!open || !targetUrl) return;
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#05070e',
        light: '#f8f3e6',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [open, targetUrl]);

  if (!open) return null;

  const adbOpenCommand = `adb shell am start -a android.intent.action.VIEW -d "${targetUrl}" com.oculus.browser`;
  const cliCommand = `npx @bubblewrap/cli init --manifest="${originUrl}/manifest.webmanifest" && npx @bubblewrap/cli build && adb install -r app-release-signed.apk`;

  const copyText = async (text: string, key: 'url' | 'adb' | 'apk') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#d4af37]/30 bg-[#090e1d] p-6 text-[#f3efe6] shadow-2xl max-h-[90vh] overflow-y-auto cosmic-scroll">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-medium text-[#d4af37]">Déploiement Meta Quest 3 · Horizon OS</p>
            <h2 className="font-display text-2xl font-semibold text-[#f8f3e6] mt-0.5">
              Envoyer au casque sans retaper, VR/MR & APK
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-300">
          {/* Synchronisation rapide sans clavier virtuel */}
          <div className="rounded-lg border border-[#38bdf8]/35 bg-[#0b152b] p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-[#f8f3e6] font-medium">
                <QrCode className="w-4 h-4 text-[#38bdf8]" />
                <span>Ouvrir sur votre Meta Quest sans retaper l’adresse</span>
              </div>
              {shareUrl && (
                <label className="flex items-center gap-1.5 text-[11px] text-[#7dd3fc] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTheme}
                    onChange={(e) => setIncludeTheme(e.target.checked)}
                    className="accent-[#38bdf8]"
                  />
                  <span>Inclure mon thème actuel</span>
                </label>
              )}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-center gap-4">
              {qrDataUrl && (
                <div className="shrink-0 rounded-lg border border-[#d4af37]/40 bg-[#f8f3e6] p-2 shadow-md">
                  <img
                    src={qrDataUrl}
                    alt="QR code Uranie VR pour Meta Quest"
                    className="w-32 h-32 block"
                  />
                </div>
              )}

              <div className="space-y-2.5 text-xs text-slate-300 flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#f8f3e6]">Via votre téléphone (Meta Horizon) :</strong>
                    <ol className="mt-1 list-decimal list-inside space-y-0.5 text-slate-300">
                      <li>Scannez ce QR code avec l’appareil photo du téléphone.</li>
                      <li>
                        Touchez <strong>Partager → Meta Horizon → Ouvrir sur le casque</strong> (ou envoyez le lien sur Messenger / WhatsApp / E-mail ouvert dans le Quest).
                      </li>
                      <li>Une fois ouvert, ajoutez la page en <strong>favori / PWA</strong> dans le navigateur du Quest.</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={targetUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 rounded border border-white/15 bg-[#05070e] px-2.5 py-1.5 font-mono-tabular text-[11px] text-[#7dd3fc]"
                  />
                  <button
                    type="button"
                    onClick={() => void copyText(targetUrl, 'url')}
                    className="flex items-center gap-1 rounded border border-[#38bdf8]/40 bg-[#121c36] px-2.5 py-1.5 text-[11px] font-medium text-[#7dd3fc] hover:bg-[#38bdf8]/20 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'url' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'url' ? 'Copié' : 'Copier URL'}</span>
                  </button>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1">
                    Ou ouverture instantanée via câble USB / ADB (PC → Quest) :
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded border border-white/10 bg-[#05070e] px-2.5 py-1.5">
                    <code className="font-mono-tabular text-[10px] text-[#e7cfa0] truncate">
                      {adbOpenCommand}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyText(adbOpenCommand, 'adb')}
                      aria-label="Copier la commande ADB d'ouverture"
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'adb' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0e1529] p-4">
            <div className="flex items-center gap-2 text-[#f8f3e6] font-medium">
              <Glasses className="w-4 h-4 text-[#38bdf8]" />
              <span>Option 1 : VR & Réalité Mixte sur Meta Quest 3 (WebXR + PWA)</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Ce logiciel intègre nativement WebXR en <strong>Réalité Virtuelle</strong> (<span className="font-mono-tabular text-[#d4af37]">immersive-vr</span>) et en <strong>Réalité Mixte Passthrough couleur</strong> (<span className="font-mono-tabular text-[#38bdf8]">immersive-ar</span>) pour projeter votre sphère astrologique en hologramme au milieu de votre pièce, avec suivi des mains et manettes Quest Touch Plus.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mrSupported && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnterMR();
                  }}
                  className="rounded-lg bg-[#38bdf8] px-4 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
                >
                  Lancer Réalité Mixte (Passthrough)
                </button>
              )}
              {webXRSupported && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnterVR();
                  }}
                  className="rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] transition-colors cursor-pointer"
                >
                  Entrer en VR maintenant
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0e1529] p-4">
            <div className="flex items-center gap-2 text-[#f8f3e6] font-medium">
              <Terminal className="w-4 h-4 text-[#d4af37]" />
              <span>Option 2 : APK autonome & compilation cloud GitHub Actions</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Le projet inclut désormais <span className="font-mono-tabular text-[#fde68a]">.github/workflows/build-apk.yml</span> (pour compiler automatiquement l’APK sur GitHub sans installer Android Studio sur votre PC), <span className="font-mono-tabular text-[#fde68a]">capacitor.config.ts</span> + <span className="font-mono-tabular text-[#fde68a]">scripts/build-standalone-apk.sh</span> (APK 100 % autonome hors-ligne), et <span className="font-mono-tabular">twa-manifest.json</span> (APK WebXR VR/Passthrough).
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Pour compiler en local sur votre ordinateur (APK WebXR ou <span className="font-mono-tabular">bash scripts/build-standalone-apk.sh</span> pour l’APK autonome) :
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#05070e] px-3 py-2.5">
              <code className="font-mono-tabular text-[11px] text-[#e7cfa0] break-all">
                {cliCommand}
              </code>
              <button
                type="button"
                onClick={() => void copyText(cliCommand, 'apk')}
                aria-label="Copier la commande APK"
                className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'apk' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
