import React, { useRef, useState } from 'react';
import { Check, Copy, Download, Mail, Printer, Share2, X } from 'lucide-react';
import { PrintableChartReport, PrintableChartReportProps } from './PrintableChartReport';

interface SharePrintModalProps {
  open: boolean;
  onClose: () => void;
  onPrintPdf: () => void;
  reportProps: PrintableChartReportProps;
}

export const SharePrintModal: React.FC<SharePrintModalProps> = ({
  open,
  onClose,
  onPrintPdf,
  reportProps,
}) => {
  const [copied, setCopied] = useState(false);
  const dossierRef = useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportProps.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: input remains selectable
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `Uranie VR — ${reportProps.profile.name} (${reportProps.modeLabel})`,
        text: `Voici le thème astrologique de ${reportProps.profile.name} sur Uranie VR.`,
        url: reportProps.shareUrl,
      });
    } catch {
      // User cancelled native share
    }
  };

  const handleDownloadHtml = () => {
    const bodyHtml = dossierRef.current?.innerHTML ?? '';
    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Uranie VR — ${reportProps.profile.name} (${reportProps.modeLabel})</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  body { background: #ffffff; color: #0f172a; font-family: system-ui, -apple-system, sans-serif; padding: 24px; max-width: 900px; margin: 0 auto; }
  @media print { .print-toolbar { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="print-toolbar" style="margin-bottom:16px;padding:10px 14px;background:#fef3c7;border:1px solid #d97706;border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
    <span>Fiche astrologique Uranie VR · Utilisez <strong>Ctrl+P / Imprimer → Enregistrer en PDF</strong></span>
    <button onclick="window.print()" style="background:#b45309;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">Imprimer / PDF</button>
  </div>
  ${bodyHtml}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = reportProps.profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    a.download = `theme-${safeName || 'uranie'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    `Thème astrologique — ${reportProps.profile.name} (${reportProps.modeLabel})`
  )}&body=${encodeURIComponent(
    `Découvrez le thème astrologique de ${reportProps.profile.name} (${reportProps.modeLabel}) calculé sur Uranie VR :\n\n${reportProps.shareUrl}`
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imprimer en PDF ou partager le thème par lien"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#d4af37]/35 bg-[#0a1020] text-[#f3efe6] shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 shrink-0">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#f8f3e6]">
              Imprimer en PDF & Partager par lien
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Dossier complet ({reportProps.profile.name} · {reportProps.modeLabel}) ou lien direct encodé.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Share Link + PDF Print */}
        <div className="border-b border-white/10 bg-[#0d152a] px-6 py-3.5 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrintPdf}
              className="flex items-center gap-2 rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Enregistrer en PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-[#121c36] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#38bdf8] hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#38bdf8]" />
              <span>Télécharger Fiche HTML</span>
            </button>

            <a
              href={mailtoHref}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-[#121c36] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#d4af37] hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 text-[#e7cfa0]" />
              <span>Envoyer par e-mail</span>
            </a>

            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className="flex items-center gap-2 rounded-lg border border-[#38bdf8]/40 bg-[#0d2238] px-3.5 py-2 text-xs font-medium text-[#7dd3fc] hover:bg-[#38bdf8]/20 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="share-theme-url" className="text-[11px] text-slate-400 whitespace-nowrap">
              Lien direct :
            </label>
            <input
              id="share-theme-url"
              type="text"
              readOnly
              value={reportProps.shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-lg border border-white/15 bg-[#060b16] px-3 py-1.5 font-mono-tabular text-[11px] text-[#7dd3fc] focus:border-[#38bdf8] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                copied
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-[#38bdf8]/40 bg-[#121c36] text-[#7dd3fc] hover:bg-[#38bdf8]/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable A4 White Paper Preview */}
        <div className="flex-1 overflow-y-auto cosmic-scroll bg-slate-200 p-5">
          <div ref={dossierRef} className="mx-auto max-w-[794px] rounded-md bg-white p-7 shadow-xl">
            <PrintableChartReport {...reportProps} />
          </div>
        </div>
      </div>
    </div>
  );
};
