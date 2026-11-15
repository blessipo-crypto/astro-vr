import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileDown,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import { buildPrintableHtmlDocument, exportChartReportToPdf } from '../astro/pdfExport';
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const dossierRef = useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const profileLabel = reportProps.profile.name.trim() || 'Thème astral';
  const sun = reportProps.baseChart.planets.find((p) => p.id === 'sun');
  const moon = reportProps.baseChart.planets.find((p) => p.id === 'moon');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportProps.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: input remains selectable
    }
  };

  const handleConvertAndDownloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    setPdfDone(false);
    try {
      const svgEl = dossierRef.current?.querySelector('svg') ?? null;
      await exportChartReportToPdf(reportProps, svgEl);
      setPdfDone(true);
      window.setTimeout(() => setPdfDone(false), 3000);
    } catch {
      setPdfError('Impossible de générer le PDF directement ; utilisez Fiche HTML ou Imprimer.');
    } finally {
      setPdfBusy(false);
    }
  };

  const handleDirectPrint = () => {
    const bodyHtml = dossierRef.current?.innerHTML ?? '';
    if (!bodyHtml) {
      onPrintPdf();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        onPrintPdf();
        return;
      }

      const html = buildPrintableHtmlDocument(
        bodyHtml,
        `Uranie VR — ${profileLabel} (${reportProps.modeLabel})`,
        false
      );
      doc.open();
      doc.write(html);
      doc.close();

      window.setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          onPrintPdf();
        } finally {
          window.setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 4000);
        }
      }, 450);
    } catch {
      onPrintPdf();
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `Uranie VR — ${profileLabel} (${reportProps.modeLabel})`,
        text: `Voici le thème astrologique de ${profileLabel} sur Uranie VR.`,
        url: reportProps.shareUrl,
      });
    } catch {
      // User cancelled native share
    }
  };

  const handleDownloadHtml = () => {
    const bodyHtml = dossierRef.current?.innerHTML ?? '';
    const html = buildPrintableHtmlDocument(
      bodyHtml,
      `Uranie VR — ${profileLabel} (${reportProps.modeLabel})`,
      false
    );
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = profileLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    a.download = `theme-${safeName || 'uranie'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const whatsappText = [
    `✨ *Uranie VR — ${profileLabel}*`,
    `Analyse : ${reportProps.modeLabel}`,
    sun ? `• Soleil : ${sun.formattedDeg} ${sun.sign.name} (Maison ${reportProps.baseChart.houses[sun.house - 1].roman})` : null,
    moon ? `• Lune : ${moon.formattedDeg} ${moon.sign.name} (Maison ${reportProps.baseChart.houses[moon.house - 1].roman})` : null,
    `• Ascendant : ${reportProps.baseChart.ascSign.name} · MC : ${reportProps.baseChart.mcSign.name}`,
    ``,
    `Consulter la carte interactive complète :`,
    reportProps.shareUrl,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    `Thème astrologique — ${profileLabel} (${reportProps.modeLabel})`
  )}&body=${encodeURIComponent(
    `Découvrez le thème astrologique de ${profileLabel} (${reportProps.modeLabel}) calculé sur Uranie VR :\n\n${reportProps.shareUrl}`
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Convertir en PDF, imprimer ou partager le thème"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#d4af37]/35 bg-[#0a1020] text-[#f3efe6] shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 shrink-0">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#f8f3e6]">
              Exporter PDF, Imprimer & Partager
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Téléchargez le dossier complet en PDF, imprimez, ou envoyez vers WhatsApp / e-mail.
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

        {/* Action Bar: Real PDF Export + Print + HTML + WhatsApp + Mail */}
        <div className="border-b border-white/10 bg-[#0d152a] px-6 py-3.5 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleConvertAndDownloadPdf()}
              disabled={pdfBusy}
              className="flex items-center gap-2 rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {pdfBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : pdfDone ? (
                <Check className="w-4 h-4" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>
                {pdfBusy
                  ? 'Génération PDF...'
                  : pdfDone
                    ? 'PDF téléchargé !'
                    : 'Convertir & Télécharger PDF'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-[#121c36] px-3.5 py-2 text-xs font-medium text-slate-100 hover:border-[#d4af37] hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#e7cfa0]" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-[#121c36] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#38bdf8] hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#38bdf8]" />
              <span>Fiche HTML</span>
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-emerald-400/45 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 hover:text-emerald-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer vers WhatsApp</span>
            </a>

            <a
              href={mailtoHref}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-[#121c36] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#d4af37] hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 text-[#e7cfa0]" />
              <span>E-mail</span>
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

          {pdfError && (
            <div className="text-[11px] text-rose-300">{pdfError}</div>
          )}

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
