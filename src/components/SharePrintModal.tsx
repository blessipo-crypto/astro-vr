import React, { useEffect, useRef, useState } from 'react';
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
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const dossierRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEmailSubject('');
    setEmailBody('');
    setEmailCopied(false);
    if (!open) {
      setEmailComposerOpen(false);
    }
  }, [open, reportProps.shareUrl, reportProps.mode, reportProps.modeLabel]);

  if (!open) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const profileLabel = reportProps.profile.name.trim() || 'Thème astral';
  const sun = reportProps.baseChart.planets.find((p) => p.id === 'sun');
  const moon = reportProps.baseChart.planets.find((p) => p.id === 'moon');

  const defaultSubject = `Thème astrologique — ${profileLabel} (${reportProps.modeLabel})`;
  const defaultBody = [
    `Bonjour,`,
    ``,
    `Voici le thème astrologique de ${profileLabel} (${reportProps.modeLabel}) calculé sur Uranie VR :`,
    sun ? `• Soleil : ${sun.formattedDeg} ${sun.sign.name} (Maison ${reportProps.baseChart.houses[sun.house - 1].roman})` : null,
    moon ? `• Lune : ${moon.formattedDeg} ${moon.sign.name} (Maison ${reportProps.baseChart.houses[moon.house - 1].roman})` : null,
    `• Ascendant : ${reportProps.baseChart.ascSign.name} · Milieu du Ciel : ${reportProps.baseChart.mcSign.name}`,
    `• Lieu : ${reportProps.baseChart.cityName}`,
    ``,
    `Consulter le thème interactif complet :`,
    reportProps.shareUrl,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const activeSubject = emailSubject || defaultSubject;
  const activeBody = emailBody || defaultBody;
  const activeTo = emailTo.trim();

  const copyTextSafe = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyTextSafe(reportProps.shareUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleOpenEmailComposer = () => {
    if (!emailSubject) setEmailSubject(defaultSubject);
    if (!emailBody) setEmailBody(defaultBody);
    setEmailComposerOpen((prev) => !prev);
  };

  const handleCopyFullEmail = async () => {
    const fullText = `Destinataire : ${activeTo || '(à compléter)'}\nObjet : ${activeSubject}\n\n${activeBody}`;
    const ok = await copyTextSafe(fullText);
    if (ok) {
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2500);
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

  const mailtoHref = `mailto:${encodeURIComponent(activeTo)}?subject=${encodeURIComponent(
    activeSubject
  )}&body=${encodeURIComponent(activeBody)}`;

  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    activeTo
  )}&su=${encodeURIComponent(activeSubject)}&body=${encodeURIComponent(activeBody)}`;

  const outlookHref = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
    activeTo
  )}&subject=${encodeURIComponent(activeSubject)}&body=${encodeURIComponent(activeBody)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Convertir en PDF, imprimer ou partager le thème"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#07070C]/85 backdrop-blur-xl p-4 overflow-hidden"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[320px] w-[320px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-amber-200/30 bg-[#151824]/92 backdrop-blur-xl text-[#f3efe6] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 shrink-0">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase">
              Exporter PDF, Imprimer &amp; Partager
            </h2>
            <p className="font-serif italic text-sm text-slate-300 mt-0.5">
              Téléchargez le dossier complet en PDF, imprimez, ou envoyez vers WhatsApp / E-mail.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Real PDF Export + Print + HTML + WhatsApp + Mail */}
        <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4 space-y-3 shrink-0 overflow-y-auto cosmic-scroll max-h-[54vh]">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleConvertAndDownloadPdf()}
              disabled={pdfBusy}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-6 py-2.5 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] disabled:opacity-60 transition-all cursor-pointer"
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
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-100 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300/80" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-200 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300/80" />
              <span>Fiche HTML</span>
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 hover:border-amber-300/30 hover:bg-emerald-500/25 transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer vers WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleOpenEmailComposer}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 cursor-pointer ${
                emailComposerOpen
                  ? 'border-amber-300/70 bg-amber-400/20 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.25)]'
                  : 'border-white/15 bg-white/[0.04] text-slate-200 hover:border-amber-300/40 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-300/80" />
              <span>E-mail</span>
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-indigo-100 hover:border-amber-300/30 transition-all duration-300 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-300/80" />
                <span>Partager</span>
              </button>
            )}
          </div>

          {emailComposerOpen && (
            <div className="rounded-2xl border border-amber-300/35 bg-[#0b0e19]/90 p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-amber-200">
                  <Mail className="h-3.5 w-3.5 text-amber-300" />
                  <span>Préparer &amp; Envoyer par E-mail</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Choisissez Gmail, Outlook, votre messagerie locale ou copiez le message complet.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="share-email-to" className="block text-[11px] text-slate-400 mb-1">
                    Adresse e-mail du destinataire (optionnel)
                  </label>
                  <input
                    id="share-email-to"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="destinataire@exemple.com"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-300/60 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="share-email-subject" className="block text-[11px] text-slate-400 mb-1">
                    Objet du message
                  </label>
                  <input
                    id="share-email-subject"
                    type="text"
                    value={activeSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-amber-300/60 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="share-email-body" className="block text-[11px] text-slate-400 mb-1">
                  Contenu du message
                </label>
                <textarea
                  id="share-email-body"
                  rows={4}
                  value={activeBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 focus:border-amber-300/60 outline-none leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={gmailHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500/85 to-amber-500/85 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(244,63,94,0.28)] hover:scale-[1.02] transition-all"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Envoyer via Gmail Web</span>
                </a>
                <a
                  href={outlookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-500/20 px-4 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/30 transition-all"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Envoyer via Outlook Web</span>
                </a>
                <a
                  href={mailtoHref}
                  target="_top"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25 transition-all"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Messagerie appareil (mailto)</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleCopyFullEmail()}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    emailCopied
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/15 bg-white/[0.05] text-slate-200 hover:border-amber-300/40'
                  }`}
                >
                  {emailCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{emailCopied ? 'Message copié !' : 'Copier le message complet'}</span>
                </button>
              </div>
            </div>
          )}

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
              className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 font-mono-tabular text-[11px] text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 ${
                copied
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/15 bg-white/[0.05] text-amber-100 hover:border-amber-300/30'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-300/80" />}
              <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable A4 White Paper Preview */}
        <div className="flex-1 overflow-y-auto cosmic-scroll bg-[#07070C]/80 p-5">
          <div ref={dossierRef} className="mx-auto max-w-[794px] rounded-2xl bg-white p-7 shadow-2xl shadow-black/60">
            <PrintableChartReport {...reportProps} />
          </div>
        </div>
      </div>
    </div>
  );
};
