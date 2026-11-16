import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, ExternalLink, Glasses, QrCode, Smartphone, Terminal, X } from 'lucide-react';

const GITHUB_PAGES_URL = 'https://blessipo-crypto.github.io/astro-vr/';

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
  const [urlSource, setUrlSource] = useState<'pages' | 'current'>('pages');
  const [includeTheme, setIncludeTheme] = useState<boolean>(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const isCurrentSameAsPages =
    typeof window !== 'undefined' && window.location.href.startsWith(GITHUB_PAGES_URL);

  const baseTargetUrl =
    urlSource === 'pages' || !originUrl ? GITHUB_PAGES_URL : `${originUrl}/`;

  const themeSuffix = (() => {
    if (!includeTheme || !shareUrl) return '';
    try {
      const parsed = new URL(shareUrl);
      const token = parsed.searchParams.get('theme');
      return token ? `?theme=${token}` : '';
    } catch {
      return '';
    }
  })();

  const targetUrl = `${baseTargetUrl}${themeSuffix}`;

  useEffect(() => {
    if (!open || !targetUrl) return;
    let active = true;

    QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((svgString) => {
        if (!active) return;
        const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        setQrDataUrl(encoded);
      })
      .catch(() =>
        QRCode.toDataURL(targetUrl, {
          width: 512,
          margin: 4,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
          .then((pngUrl) => {
            if (active) setQrDataUrl(pngUrl);
          })
          .catch(() => {
            if (active) setQrDataUrl('');
          })
      );

    return () => {
      active = false;
    };
  }, [open, targetUrl]);

  if (!open) return null;

  const adbOpenCommand = `adb shell am start -a android.intent.action.VIEW -d "${targetUrl}" com.oculus.browser`;
  const cliCommand = `npx @bubblewrap/cli init --manifest="${GITHUB_PAGES_URL}manifest.webmanifest" && npx @bubblewrap/cli build && adb install -r app-release-signed.apk`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070C]/85 backdrop-blur-xl p-4 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[320px] w-[320px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0c0c16]/90 bg-white/[0.03] backdrop-blur-xl p-6 text-[#f3efe6] shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto cosmic-scroll">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="font-serif italic text-sm text-amber-200/80">
              Déploiement Meta Quest 3 · Horizon OS
            </p>
            <h2 className="font-display text-2xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase mt-0.5">
              Vrai VR 360° / Passthrough, QR Code &amp; APK
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-200">
          {/* Synchronisation rapide par QR code haute lisibilité */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-amber-300/30 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-amber-100 font-medium">
                <QrCode className="w-4 h-4 text-amber-300/80" />
                <span>Ouvrir sur votre Meta Quest en 360° VR (sans taper)</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {!isCurrentSameAsPages && originUrl && (
                  <div className="flex items-center rounded-full border border-white/10 bg-[#07070C]/60 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUrlSource('pages')}
                      className={`rounded-full px-3 py-1 transition-all duration-300 cursor-pointer ${
                        urlSource === 'pages'
                          ? 'bg-gradient-to-r from-amber-500/80 to-yellow-500/80 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      GitHub Pages (Quest 3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrlSource('current')}
                      className={`rounded-full px-3 py-1 transition-all duration-300 cursor-pointer ${
                        urlSource === 'current'
                          ? 'bg-gradient-to-r from-amber-500/80 to-yellow-500/80 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Aperçu local
                    </button>
                  </div>
                )}

                {shareUrl && (
                  <label className="flex items-center gap-1.5 text-[11px] text-indigo-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTheme}
                      onChange={(e) => setIncludeTheme(e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span>Inclure mon thème actuel (QR plus dense)</span>
                  </label>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              {qrDataUrl && (
                <div className="shrink-0 rounded-2xl border border-amber-300/40 bg-white p-2.5 shadow-lg">
                  <img
                    src={qrDataUrl}
                    alt="QR code Uranie VR pour Meta Quest"
                    className="w-44 h-44 sm:w-48 sm:h-48 block"
                  />
                </div>
              )}

              <div className="space-y-3 text-xs text-slate-200 flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-amber-300/80 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-100">
                      Pour ouvrir en vrai VR 360° &amp; Passthrough sur Meta Quest :
                    </strong>
                    <ol className="mt-1 list-decimal list-inside space-y-1 text-slate-200 leading-relaxed">
                      <li>
                        Scannez ce QR code avec l’appareil photo du téléphone (contraste pur noir/blanc).
                      </li>
                      <li>
                        Touchez <strong>Partager → Meta Horizon → Ouvrir sur le casque</strong>, ou ouvrez le lien directement dans le <strong>Navigateur Meta Quest</strong>.
                      </li>
                      <li>
                        Appuyez sur <strong>Entrer en VR</strong> (ou <strong>Réalité Mixte</strong>) et utilisez le <strong>joystick droit ou gauche</strong> pour faire défiler l’heure en VR.
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={targetUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 font-mono-tabular text-[11px] text-indigo-200 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => void copyText(targetUrl, 'url')}
                    className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-2 text-[11px] font-medium text-amber-100 hover:border-amber-300/30 transition-all duration-300 shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'url' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-amber-300/80" />
                    )}
                    <span>{copiedKey === 'url' ? 'Copié' : 'Copier URL'}</span>
                  </button>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ouvrir l'URL dans un onglet"
                    className="rounded-full border border-white/15 bg-white/[0.04] p-2 text-slate-300 hover:border-amber-300/30 hover:text-white transition-all duration-300 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1">
                    Ou ouverture instantanée via câble USB / ADB (PC → Quest) :
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#07070C]/65 px-3 py-2">
                    <code className="font-mono-tabular text-[10px] text-amber-200/90 truncate">
                      {adbOpenCommand}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyText(adbOpenCommand, 'adb')}
                      aria-label="Copier la commande ADB d'ouverture"
                      className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'adb' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-amber-300/30 transition-all duration-300">
            <div className="flex items-center gap-2 text-amber-100 font-medium">
              <Glasses className="w-4 h-4 text-amber-300/80" />
              <span>Pourquoi choisir l’APK WebXR (ou Navigateur Quest) plutôt que l’APK Capacitor ?</span>
            </div>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed">
              Sur Horizon OS, la WebView Android utilisée par Capacitor n’expose pas WebXR (<span className="font-mono-tabular">immersive-vr</span>) et s’ouvre dans une fenêtre 2D plate. Pour la <strong>VR 360° complète</strong> et le <strong>Passthrough couleur</strong>, installez l’artefact <span className="font-mono-tabular text-amber-200">uranie-vr-quest3-webxr-apk</span> (lié à votre GitHub Pages) ou ouvrez <span className="font-mono-tabular text-indigo-200">{GITHUB_PAGES_URL}</span> dans le Navigateur Meta Quest.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {mrSupported && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEnterMR();
                  }}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold text-indigo-100 hover:border-amber-300/30 transition-all duration-300 cursor-pointer"
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
                  className="bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-6 py-2.5 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Entrer en VR maintenant
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-amber-300/30 transition-all duration-300">
            <div className="text-amber-200 font-semibold text-xs">
              Si SideQuest affiche « pm install -r … exited with code 1 » :
            </div>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-slate-200 leading-relaxed">
              <li>
                Dans SideQuest → <strong>Currently Installed</strong> (ou dans le casque : <strong>Bibliothèque → Sources inconnues</strong>), <strong>désinstallez d’abord</strong> toute ancienne version d’Uranie VR (erreur de signature Android entre anciennes compilations).
              </li>
              <li>
                Installez ensuite le dernier APK signé depuis <strong>GitHub Releases</strong> (icône <strong>Install APK</strong> dans SideQuest ou <code className="text-amber-200">adb install uranie-vr-autonome.apk</code>).
              </li>
              <li>
                Ou encore plus simple : ouvrez directement <strong>https://blessipo-crypto.github.io/astro-vr/</strong> dans le <strong>Navigateur Meta Quest</strong> (aucun APK requis, VR 360° &amp; Passthrough complets).
              </li>
            </ol>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-amber-300/30 transition-all duration-300">
            <div className="flex items-center gap-2 text-amber-100 font-medium">
              <Terminal className="w-4 h-4 text-amber-300/80" />
              <span>Activation unique sur GitHub (Pages + APK WebXR)</span>
            </div>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed">
              Dans votre dépôt GitHub <strong>blessipo-crypto/astro-vr</strong>, allez une seule fois dans <strong>Settings → Pages → Build and deployment → Source</strong> et sélectionnez <strong>GitHub Actions</strong>. Chaque push publiera automatiquement le site WebXR et l’APK <span className="font-mono-tabular text-amber-200">uranie-vr-quest3-webxr.apk</span>.
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#07070C]/65 px-3 py-2.5">
              <code className="font-mono-tabular text-[11px] text-amber-200/90 break-all">
                {cliCommand}
              </code>
              <button
                type="button"
                onClick={() => void copyText(cliCommand, 'apk')}
                aria-label="Copier la commande APK"
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'apk' ? (
                  <Check className="w-4 h-4 text-emerald-300" />
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
            className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
