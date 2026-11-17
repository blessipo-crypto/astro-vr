import { jsPDF } from 'jspdf';
import type { PrintableChartReportProps } from '../components/PrintableChartReport';
import { calculateBaziSummary, transposeLongitudeToChinese } from './chineseAstrology';
import { generateChartInterpretation } from './interpretations';
import { buildSignAffinityProfile, buildWesternOppositesTable } from './oppositesTable';

const SYMBOL_TEXT_MAP: Array<[RegExp, string]> = [
  [/\uFE0E/g, ''],
  [/\uFE0F/g, ''],
  [/[’‘]/g, "'"],
  [/[“”]/g, '"'],
  [/œ/g, 'oe'],
  [/Œ/g, 'OE'],
  [/[—–]/g, '-'],
  [/…/g, '...'],
  [/→/g, '->'],
  [/↔/g, '<->'],
  [/℞/g, '(R)'],
  [/☌/g, 'Conjonction'],
  [/⚹/g, 'Sextile'],
  [/□/g, 'Carre'],
  [/△/g, 'Trigone'],
  [/☍/g, 'Opposition'],
  [/[☉☽☿♀♂♃♄♅♆♇☊☋♈♉♊♋♌♍♎♏♐♑♒♓]/g, ''],
  [/[\u4E00-\u9FFF]+/g, ''],
];

function sanitizePdfText(input: string): string {
  let out = input;
  for (const [pattern, replacement] of SYMBOL_TEXT_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

async function svgElementToPngDataUrl(svgEl: SVGSVGElement | null | undefined): Promise<string | null> {
  if (!svgEl || typeof window === 'undefined') return null;
  try {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '900');
    clone.setAttribute('height', '900');
    const serialized = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const pngData = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 900;
          canvas.height = 900;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
    return pngData;
  } catch {
    return null;
  }
}

export function buildPrintableHtmlDocument(
  bodyHtml: string,
  title: string,
  autoPrint = false
): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Noto+Sans+Symbols+2&family=Noto+Sans+Symbols:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { background: #ffffff; color: #0f172a; font-family: 'Montserrat', 'Lato', 'Noto Sans Symbols', sans-serif; font-variant-emoji: text; font-size: 12px; line-height: 1.5; padding: 20px; max-width: 900px; margin: 0 auto; }
  .font-display, h1, h2, h3 { font-family: 'Cinzel', 'Cormorant Garamond', 'Playfair Display', Cochin, Georgia, serif; }
  .font-glyph { font-family: 'Noto Sans Symbols', 'Noto Sans Symbols 2', 'Segoe UI Symbol', 'Apple Symbols', sans-serif; font-variant-emoji: text; }
  .print-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
  .grid { display: grid; gap: 8px; }
  .grid-cols-1 { grid-template-columns: 1fr; }
  .grid-cols-2, .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .flex { display: flex; }
  .items-start { align-items: flex-start; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-4 { gap: 16px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-5 { margin-bottom: 20px; }
  .p-2 { padding: 8px; }
  .p-2\\.5 { padding: 10px; }
  .p-3 { padding: 12px; }
  .pb-1 { padding-bottom: 4px; }
  .pb-3 { padding-bottom: 12px; }
  .border { border: 1px solid #cbd5e1; }
  .border-b { border-bottom: 1px solid #cbd5e1; }
  .border-b-2 { border-bottom: 2px solid #b45309; }
  .rounded, .rounded-lg { border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f1f5f9; font-weight: 700; }
  @media print { .print-toolbar { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="print-toolbar" style="margin-bottom:16px;padding:10px 14px;background:#fef3c7;border:1px solid #d97706;border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
    <span>Fiche astrologique Uranie VR · <strong>Imprimer</strong> ou <strong>Enregistrer en PDF</strong></span>
    <button onclick="window.print()" style="background:#b45309;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;">Imprimer</button>
  </div>
  ${bodyHtml}
  ${
    autoPrint
      ? `<script>
          window.addEventListener('load', function() {
            setTimeout(function() { window.print(); }, 350);
          });
        </script>`
      : ''
  }
</body>
</html>`;
}

export async function exportChartReportToPdf(
  reportProps: PrintableChartReportProps,
  svgElement?: SVGSVGElement | null
): Promise<void> {
  const {
    mode,
    modeLabel,
    tradition,
    profile,
    baseChart,
    outerChart,
    comparisonAspects,
    solarReturnAnalysis,
    solarReturnExactDate,
    comparativeAnalysis,
    snapshotDataUrl,
    shareUrl,
  } = reportProps;

  const interpretation = generateChartInterpretation({
    mode,
    tradition,
    baseChart,
    outerChart,
    comparisonAspects,
    solarReturnAnalysis,
    comparativeAnalysis,
  });
  const bazi = calculateBaziSummary(baseChart);
  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const sunAffinity = sun ? buildSignAffinityProfile(sun.sign, 'Soleil') : null;
  const ascAffinity = buildSignAffinityProfile(baseChart.ascSign, 'Ascendant');
  const westernOpposites = buildWesternOppositesTable(baseChart, outerChart);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(d);

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionHeading = (title: string, colorRgb: [number, number, number] = [146, 64, 14]) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...colorRgb);
    doc.text(sanitizePdfText(title), margin, y);
    y += 1.8;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;
  };

  const drawParagraph = (
    text: string,
    fontSize = 9,
    colorRgb: [number, number, number] = [51, 65, 85],
    indentMm = 0
  ) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...colorRgb);
    const lines = doc.splitTextToSize(sanitizePdfText(text), contentWidth - indentMm) as string[];
    const lineH = fontSize * 0.43;
    for (const line of lines) {
      ensureSpace(lineH + 1);
      doc.text(line, margin + indentMm, y);
      y += lineH;
    }
    y += 1.5;
  };

  // Document Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('URANIE VR - DOSSIER ASTROLOGIQUE COMPLET', margin, y);
  y += 5.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(
    sanitizePdfText(`${profile.name.trim() || 'Theme astral'} - ${modeLabel}`),
    contentWidth
  ) as string[];
  for (const line of titleLines) {
    doc.text(line, margin, y);
    y += 6.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    sanitizePdfText(
      `Base : ${fmtDate(baseChart.date)} | ${baseChart.cityName} (${baseChart.latitude.toFixed(2)} deg, ${baseChart.longitude.toFixed(2)} deg) | Maisons ${baseChart.houseSystem}`
    ),
    margin,
    y
  );
  y += 4.2;

  if (outerChart) {
    doc.setTextColor(12, 74, 110);
    doc.text(
      sanitizePdfText(
        `Roue externe : ${fmtDate(outerChart.date)} | ${outerChart.cityName}${solarReturnExactDate && mode === 'solarReturn' ? ' (Retour Solaire exact)' : ''}`
      ),
      margin,
      y
    );
    y += 4.2;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    sanitizePdfText(
      `ASC Natal : ${baseChart.ascSign.name}${
        mode === 'solarReturn' && outerChart && solarReturnAnalysis
          ? `  |  ASC RS : ${solarReturnAnalysis.ascDegFormatted} ${outerChart.ascSign.name} (M.${solarReturnAnalysis.ascInNatalHouse.roman} nat.)`
          : ''
      }  |  MC : ${baseChart.mcSign.name}  |  Pilier BaZi : ${bazi.yearPillar.label}`
    ),
    margin,
    y
  );
  y += 2.5;
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Wheel SVG -> PNG + Optional 3D Snapshot
  const wheelPng = await svgElementToPngDataUrl(svgElement);
  if (wheelPng || snapshotDataUrl) {
    const imgSize = wheelPng && snapshotDataUrl ? 76 : 86;
    ensureSpace(imgSize + 8);
    if (wheelPng && snapshotDataUrl) {
      doc.addImage(wheelPng, 'PNG', margin + 6, y, imgSize, imgSize);
      try {
        doc.addImage(snapshotDataUrl, 'PNG', pageWidth - margin - imgSize - 6, y, imgSize, imgSize);
      } catch {
        // Ignore snapshot errors if WebGL capture wasn't available
      }
      y += imgSize + 4;
    } else if (wheelPng) {
      doc.addImage(wheelPng, 'PNG', (pageWidth - imgSize) / 2, y, imgSize, imgSize);
      y += imgSize + 4;
    } else if (snapshotDataUrl) {
      try {
        doc.addImage(snapshotDataUrl, 'PNG', (pageWidth - imgSize) / 2, y, imgSize, imgSize);
        y += imgSize + 4;
      } catch {
        // Ignore
      }
    }
  }

  // Elements & Wu Xing box
  ensureSpace(16);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    sanitizePdfText(
      `Elements : Feu ${baseChart.elements.Feu} | Terre ${baseChart.elements.Terre} | Air ${baseChart.elements.Air} | Eau ${baseChart.elements.Eau}   |   Modalites : Cardinal ${baseChart.modalities.Cardinal} | Fixe ${baseChart.modalities.Fixe} | Mutable ${baseChart.modalities.Mutable}`
    ),
    margin + 3,
    y + 4.8
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    sanitizePdfText(
      `Wu Xing : Bois ${bazi.wuXingBalance.Bois} | Feu ${bazi.wuXingBalance.Feu} | Terre ${bazi.wuXingBalance.Terre} | Metal ${bazi.wuXingBalance.Métal} | Eau ${bazi.wuXingBalance.Eau}`
    ),
    margin + 3,
    y + 9.4
  );
  y += 16;

  // Planetary Positions Table
  drawSectionHeading(
    comparativeAnalysis
      ? 'Positions Planetaires & Tableau Comparatif'
      : 'Positions Planetaires & Transposition Chinoise'
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 3.2, contentWidth, 5.2, 'F');
  doc.setTextColor(51, 65, 85);
  doc.text('Astre', margin + 1.5, y);
  doc.text('Position Base', margin + 32, y);
  if (comparativeAnalysis) {
    doc.text('Roue Externe', margin + 78, y);
    doc.text('Maison', margin + 124, y);
    doc.text('Signe Chinois', margin + 148, y);
  } else {
    doc.text('Maison', margin + 84, y);
    doc.text('Signe Chinois', margin + 114, y);
  }
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const p of baseChart.planets) {
    ensureSpace(5.5);
    const ch = transposeLongitudeToChinese(p.longitude);
    const compRow = comparativeAnalysis?.rows.find((r) => r.planetId === p.id);
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizePdfText(`${p.name}${p.retrograde ? ' (R)' : ''}`), margin + 1.5, y);
    doc.setTextColor(51, 65, 85);
    doc.text(sanitizePdfText(`${p.formattedDeg} ${p.sign.name}`), margin + 32, y);
    if (comparativeAnalysis) {
      doc.setTextColor(7, 89, 133);
      doc.text(sanitizePdfText(compRow?.outerPos ?? '-'), margin + 78, y);
      doc.setTextColor(51, 65, 85);
      doc.text(
        sanitizePdfText(
          `M.${baseChart.houses[p.house - 1].roman}${compRow ? ` (Ext->M.${compRow.outerInBaseHouseRoman})` : ''}`
        ),
        margin + 124,
        y
      );
      doc.text(sanitizePdfText(`${ch.sign.name} (${ch.sign.wuXing})`), margin + 148, y);
    } else {
      doc.text(sanitizePdfText(`M.${baseChart.houses[p.house - 1].roman}`), margin + 84, y);
      doc.text(sanitizePdfText(`${ch.sign.name} (${ch.sign.wuXing})`), margin + 114, y);
    }
    y += 4.8;
  }
  y += 3;

  // Synthesis & Main Sections
  drawSectionHeading(`Synthese : ${interpretation.headline}`);
  drawParagraph(interpretation.synthesis, 9.2, [15, 23, 42]);

  if (interpretation.solarReturnSynthesis) {
    const srs = interpretation.solarReturnSynthesis;
    drawSectionHeading(`Analyse Croisee Revolution Solaire (Planetes + Maisons + Aspects)`, [146, 64, 14]);
    drawParagraph(
      `${srs.aspectClimate.climateLabel} - ${srs.aspectClimate.climateNarrative}`,
      8.5,
      [30, 41, 59]
    );
    for (const pp of srs.pillarPlanets) {
      drawParagraph(`${pp.name} [${pp.roleReason}] (${pp.positionSummary}) : ${pp.synthesis}`, 8.3, [51, 65, 85], 2);
    }
    for (const dh of srs.dominantHouses) {
      drawParagraph(`Maison ${dh.roman} RS (-> M.${dh.superposedNatalRoman} natale) : ${dh.synthesis}`, 8.3, [51, 65, 85], 2);
    }
    for (const ax of srs.lifeAxes) {
      drawParagraph(`${ax.title} : ${ax.synthesis}`, 8.3, [51, 65, 85], 2);
    }
    for (const lev of srs.actionLevers) {
      drawParagraph(`- ${lev}`, 8.2, [120, 53, 15], 3);
    }
  }

  for (const sec of interpretation.sections) {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(sanitizePdfText(sec.title), margin, y);
    y += 4.2;
    drawParagraph(sec.body, 8.6, [51, 65, 85]);
    if (sec.highlights && sec.highlights.length > 0) {
      for (const h of sec.highlights) {
        drawParagraph(`- ${h}`, 8.2, [71, 85, 105], 3);
      }
    }
    y += 1;
  }

  // Detailed Planets
  if (interpretation.detailedPlanets && interpretation.detailedPlanets.length > 0) {
    drawSectionHeading(`Interpretation Detaillee des Planetes (${interpretation.detailedContextLabel ?? ''})`);
    for (const dp of interpretation.detailedPlanets) {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const header = sanitizePdfText(
        `${dp.name}${dp.retrograde ? ' (R)' : ''} - ${dp.formattedDeg} ${dp.signName} | Maison ${dp.houseRoman}${dp.natalHouseRoman ? ` (Active M.${dp.natalHouseRoman} natale)` : ''}${dp.planetId !== 'northNode' ? ` | ${dp.dignityStatus}` : ''}`
      );
      doc.text(header, margin, y);
      y += 4;
      if (dp.ruledHouses.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.text(sanitizePdfText(`Maitre de : Maison(s) ${dp.ruledHouses.join(', ')}`), margin, y);
        y += 3.6;
      }
      drawParagraph(dp.summary, 8.4, [51, 65, 85]);
    }
  }

  // Detailed 12 Houses
  if (interpretation.detailedHouses && interpretation.detailedHouses.length > 0) {
    drawSectionHeading(`Interpretation Detaillee des 12 Maisons (${interpretation.detailedContextLabel ?? ''})`);
    for (const dh of interpretation.detailedHouses) {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(
        sanitizePdfText(`Maison ${dh.roman} - ${dh.title} (${dh.formattedDeg} ${dh.signName})`),
        margin,
        y
      );
      y += 4;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const subMeta = sanitizePdfText(
        `${dh.superposedNatalHouse ? `${dh.superposedNatalHouse} | ` : ''}Gouverneur : ${dh.rulerLocation}${dh.occupants.length > 0 ? ` | Occupants : ${dh.occupants.map((o) => o.name).join(', ')}` : ''}`
      );
      const subLines = doc.splitTextToSize(subMeta, contentWidth) as string[];
      for (const sl of subLines) {
        ensureSpace(4);
        doc.text(sl, margin, y);
        y += 3.5;
      }
      drawParagraph(dh.interpretation, 8.4, [51, 65, 85]);
    }
  }

  // Detailed Aspects
  if (interpretation.detailedAspects && interpretation.detailedAspects.length > 0) {
    drawSectionHeading(
      outerChart
        ? `Analyse Complete des Aspects ${modeLabel} -> Base (${interpretation.detailedAspects.length})`
        : `Analyse Complete des Aspects (${interpretation.detailedAspects.length})`
    );
    for (const asp of interpretation.detailedAspects) {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sanitizePdfText(`${asp.title} | ${asp.aspectLabel} (${asp.orb.toFixed(2)} deg)`), margin, y);
      y += 3.6;
      drawParagraph(asp.interpretation, 8.2, [51, 65, 85]);
    }
  }

  if (interpretation.secondaryAspects && interpretation.secondaryAspects.length > 0) {
    drawSectionHeading(
      interpretation.secondaryAspectsLabel ?? `Aspects Internes (${interpretation.secondaryAspects.length})`,
      [12, 74, 110]
    );
    for (const asp of interpretation.secondaryAspects) {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(12, 74, 110);
      doc.text(sanitizePdfText(`${asp.title} | ${asp.aspectLabel} (${asp.orb.toFixed(2)} deg)`), margin, y);
      y += 3.6;
      drawParagraph(asp.interpretation, 8.2, [51, 65, 85]);
    }
  }

  // Affinities & Opposites Table
  drawSectionHeading('Signes Complementaires, Opposes & Affinites');
  for (const prof of [sunAffinity, ascAffinity].filter((x): x is NonNullable<typeof x> => Boolean(x))) {
    drawParagraph(
      `${prof.sourceLabel} en ${prof.sourceSign.name} -> Trigones : ${prof.trineAllies.map((s) => s.name).join(', ')} | Sextiles : ${prof.sextileAllies.map((s) => s.name).join(', ')} | Oppose : ${prof.oppositeComplement.name}`,
      8.3,
      [30, 41, 59]
    );
  }
  for (const ax of westernOpposites) {
    ensureSpace(10);
    const active = [...ax.activePlanetsA, ...ax.activePlanetsB].join(', ');
    drawParagraph(
      `${ax.signA.name} <-> ${ax.signB.name} (${ax.axisTheme}) : ${ax.complementarity}${active ? ` [Astres : ${active}]` : ''}`,
      8.1,
      [51, 65, 85]
    );
  }

  // Share link footer on last page
  ensureSpace(12);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Lien direct Uranie VR :', margin, y);
  y += 3.6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const urlLines = doc.splitTextToSize(shareUrl, contentWidth) as string[];
  for (const ul of urlLines) {
    ensureSpace(3.5);
    doc.text(ul, margin, y);
    y += 3.3;
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Uranie VR - Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 7, {
      align: 'right',
    });
  }

  const safeName = (profile.name || 'uranie')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');
  doc.save(`theme-${safeName || 'uranie'}.pdf`);
}
