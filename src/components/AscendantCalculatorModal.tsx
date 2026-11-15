import React, { useEffect, useMemo, useState } from 'react';
import { Check, Compass, Copy, MapPin, Sparkles, X } from 'lucide-react';
import {
  calculateAscendantOnly,
  CITY_PRESETS,
  GeocodedPlace,
  NatalProfile,
  searchPlacesByQuery,
} from '../astro/astroEngine';
import { getAscendantDeepInterpretation } from '../astro/astroKnowledge';
import { transposeLongitudeToChinese } from '../astro/chineseAstrology';
import { VoiceDictationButton } from './VoiceDictationButton';

interface AscendantCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  initialProfile: NatalProfile;
  onApplyToProfile: (patch: Partial<NatalProfile>) => void;
  showVoiceDictation?: boolean;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);
const YEARS_1900_2100 = Array.from({ length: 201 }, (_, i) => 1900 + i);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseParts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (m) {
    return {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
}

function fmtTimeHm(d: Date | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

export const AscendantCalculatorModal: React.FC<AscendantCalculatorModalProps> = ({
  open,
  onClose,
  initialProfile,
  onApplyToProfile,
  showVoiceDictation = true,
}) => {
  const [dateIso, setDateIso] = useState<string>(initialProfile.birthDateIso);
  const [cityId, setCityId] = useState<string>(initialProfile.cityId);
  const [customLoc, setCustomLoc] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(
    initialProfile.customCityName &&
      typeof initialProfile.customLat === 'number' &&
      typeof initialProfile.customLon === 'number'
      ? {
          name: initialProfile.customCityName,
          latitude: initialProfile.customLat,
          longitude: initialProfile.customLon,
        }
      : null
  );
  const [placeQuery, setPlaceQuery] = useState<string>('');
  const [candidates, setCandidates] = useState<GeocodedPlace[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [manualCoords, setManualCoords] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    setDateIso(initialProfile.birthDateIso);
    setCityId(initialProfile.cityId);
    if (
      initialProfile.customCityName &&
      typeof initialProfile.customLat === 'number' &&
      typeof initialProfile.customLon === 'number'
    ) {
      setCustomLoc({
        name: initialProfile.customCityName,
        latitude: initialProfile.customLat,
        longitude: initialProfile.customLon,
      });
    } else {
      setCustomLoc(null);
    }
    setCandidates([]);
    setLookupError(null);
    setCopied(false);
  }, [open, initialProfile]);

  const parts = useMemo(() => parseParts(dateIso), [dateIso]);
  const maxDays = new Date(parts.year, parts.month, 0).getDate();

  const updateParts = (patch: Partial<typeof parts>) => {
    const y = Math.min(2100, Math.max(1900, patch.year ?? parts.year));
    const mo = Math.min(12, Math.max(1, patch.month ?? parts.month));
    const dim = new Date(y, mo, 0).getDate();
    const d = Math.min(dim, Math.max(1, patch.day ?? parts.day));
    const h = Math.min(23, Math.max(0, patch.hour ?? parts.hour));
    const min = Math.min(59, Math.max(0, patch.minute ?? parts.minute));
    setDateIso(`${String(y).padStart(4, '0')}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(min)}`);
  };

  const stepMinutes = (deltaMins: number) => {
    const dt = new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    dt.setMinutes(dt.getMinutes() + deltaMins);
    setDateIso(
      `${String(Math.min(2100, Math.max(1900, dt.getFullYear()))).padStart(4, '0')}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
    );
  };

  const activeLoc = useMemo(() => {
    if (customLoc) return customLoc;
    const preset = CITY_PRESETS.find((c) => c.id === cityId) ?? CITY_PRESETS[0];
    return {
      name: `${preset.name} (${preset.country})`,
      latitude: preset.latitude,
      longitude: preset.longitude,
    };
  }, [customLoc, cityId]);

  const result = useMemo(() => {
    const dt = new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    return calculateAscendantOnly(dt, activeLoc.latitude, activeLoc.longitude, activeLoc.name);
  }, [parts, activeLoc]);

  const deep = useMemo(
    () => getAscendantDeepInterpretation(result.ascSign, result.ascDegInSign),
    [result.ascSign, result.ascDegInSign]
  );
  const chineseAsc = useMemo(
    () => transposeLongitudeToChinese(result.ascendant),
    [result.ascendant]
  );

  if (!open) return null;

  const handleSearchPlace = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? placeQuery).trim();
    if (!q) return;
    if (overrideQuery !== undefined) setPlaceQuery(q);
    setBusy(true);
    setLookupError(null);
    setCandidates([]);
    const found = await searchPlacesByQuery(q);
    setBusy(false);
    if (found.length === 0) {
      setLookupError('Lieu introuvable. Essayez un autre code postal, une ville ou saisissez Lat/Lon.');
      return;
    }
    setCustomLoc(found[0]);
    if (found.length > 1) setCandidates(found);
  };

  const handleCopy = async () => {
    const txt = [
      `Calcul Ascendant · Uranie VR`,
      `Date & Heure : ${pad2(parts.day)}/${pad2(parts.month)}/${parts.year} à ${pad2(parts.hour)}h${pad2(parts.minute)}`,
      `Lieu : ${activeLoc.name} (${activeLoc.latitude.toFixed(2)}°, ${activeLoc.longitude.toFixed(2)}°)`,
      `Ascendant : ${result.ascSign.symbol} ${result.ascSign.name} (${result.ascFormattedDeg}) · Maître : ${result.ascSign.ruler}`,
      `Plage horaire du signe : ${fmtTimeHm(result.signWindowStart)} → ${fmtTimeHm(result.signWindowEnd)}`,
      `Équivalent chinois : ${chineseAsc.sign.branchHanzi}${chineseAsc.sign.hanzi} ${chineseAsc.sign.name} (${chineseAsc.sign.wuXing} ${chineseAsc.sign.polarity})`,
      `Tempérament : ${deep.temperament}`,
      `Axe Ascendant-Descendant : ${deep.axisBalance}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calculateur d’Ascendant uniquement"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto cosmic-scroll rounded-2xl border border-[#d4af37]/40 bg-[#080d1b] p-5 text-[#f3efe6] shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#e7cfa0]">
              <Compass className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Calcul Direct & Rapide</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#f8f3e6] mt-0.5">
              Calculer l’Ascendant uniquement
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Saisissez simplement la date, l’heure exacte et la ville de naissance sans modifier vos thèmes enregistrés.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le calculateur d’Ascendant"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs: Date, Time & Place */}
        <div className="rounded-xl border border-white/10 bg-[#0d1428]/80 p-3.5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
            <div>
              <label htmlFor="asc-day" className="block text-[11px] text-slate-400 mb-1">
                Jour
              </label>
              <select
                id="asc-day"
                value={Math.min(parts.day, maxDays)}
                onChange={(e) => updateParts({ day: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
              >
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {pad2(d)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="asc-month" className="block text-[11px] text-slate-400 mb-1">
                Mois
              </label>
              <select
                id="asc-month"
                value={parts.month}
                onChange={(e) => updateParts({ month: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2 py-1.5 text-xs text-[#f3efe6] cursor-pointer"
              >
                {MONTHS_FR.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="asc-year" className="block text-[11px] text-slate-400 mb-1">
                Année
              </label>
              <select
                id="asc-year"
                value={parts.year}
                onChange={(e) => updateParts({ year: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
              >
                {YEARS_1900_2100.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="asc-hour" className="block text-[11px] text-slate-400 mb-1">
                Heure
              </label>
              <select
                id="asc-hour"
                value={parts.hour}
                onChange={(e) => updateParts({ hour: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
              >
                {HOURS_24.map((h) => (
                  <option key={h} value={h}>
                    {pad2(h)}h
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="asc-minute" className="block text-[11px] text-slate-400 mb-1">
                Minute
              </label>
              <select
                id="asc-minute"
                value={parts.minute}
                onChange={(e) => updateParts({ minute: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2 py-1.5 font-mono-tabular text-xs text-[#f3efe6] cursor-pointer"
              >
                {MINUTES_60.map((m) => (
                  <option key={m} value={m}>
                    {pad2(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick time step sensitivity buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 mr-1">Ajuster l’heure :</span>
              {[
                { label: '-1h', mins: -60 },
                { label: '-15m', mins: -15 },
                { label: '-5m', mins: -5 },
                { label: '+5m', mins: 5 },
                { label: '+15m', mins: 15 },
                { label: '+1h', mins: 60 },
              ].map((st) => (
                <button
                  key={st.label}
                  type="button"
                  onClick={() => stepMinutes(st.mins)}
                  className="rounded border border-white/15 bg-[#080d1b] px-2 py-1 font-mono-tabular text-[11px] text-slate-200 hover:border-[#d4af37] hover:text-white cursor-pointer"
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setManualCoords((v) => !v)}
              className="text-[11px] text-[#7dd3fc] hover:underline cursor-pointer"
            >
              {manualCoords ? 'Utiliser la recherche de ville' : 'Saisir Lat / Lon manuelles'}
            </button>
          </div>

          {!manualCoords ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
              <div>
                <label htmlFor="asc-city" className="block text-[11px] text-slate-400 mb-1">
                  Ville prédéfinie
                </label>
                <select
                  id="asc-city"
                  value={customLoc ? '__custom__' : cityId}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') return;
                    setCustomLoc(null);
                    setCityId(e.target.value);
                  }}
                  className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2.5 py-1.5 text-xs text-[#f3efe6] cursor-pointer"
                >
                  {customLoc && <option value="__custom__">{customLoc.name}</option>}
                  <optgroup label="France (Villes & Préfectures)">
                    {CITY_PRESETS.filter((c) => c.country === 'France').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.department ? `${c.department} · ` : ''}France)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Francophonie & Monde">
                    {CITY_PRESETS.filter((c) => c.country !== 'France').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label htmlFor="asc-place-search" className="block text-[11px] text-slate-400 mb-1">
                  Toutes communes FR (nom, code postal, dép.) ou Monde
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="asc-place-search"
                    type="text"
                    placeholder="Ex: Saint-Malo, 75008, Valence 26..."
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSearchPlace();
                    }}
                    className="flex-1 rounded-lg border border-white/15 bg-[#080d1b] px-2.5 py-1.5 text-xs text-[#f3efe6] focus:border-[#d4af37] focus:outline-none"
                  />
                  {showVoiceDictation && (
                    <VoiceDictationButton
                      accent="gold"
                      title="Dicter une ville ou un code postal"
                      onTranscript={(spoken) => void handleSearchPlace(spoken)}
                      onErrorMessage={(msg) => setLookupError(msg)}
                    />
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSearchPlace()}
                    className="rounded-lg border border-[#d4af37]/40 bg-[#121931] px-3 py-1.5 text-xs font-medium text-[#e7cfa0] hover:border-[#d4af37] disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? '...' : 'Chercher'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nom du lieu</label>
                <input
                  type="text"
                  value={activeLoc.name}
                  onChange={(e) =>
                    setCustomLoc({
                      name: e.target.value,
                      latitude: activeLoc.latitude,
                      longitude: activeLoc.longitude,
                    })
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2.5 py-1.5 text-xs text-[#f3efe6]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeLoc.latitude}
                  onChange={(e) =>
                    setCustomLoc({
                      name: activeLoc.name,
                      latitude: Number(e.target.value) || 0,
                      longitude: activeLoc.longitude,
                    })
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeLoc.longitude}
                  onChange={(e) =>
                    setCustomLoc({
                      name: activeLoc.name,
                      latitude: activeLoc.latitude,
                      longitude: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-white/15 bg-[#080d1b] px-2.5 py-1.5 font-mono-tabular text-xs text-[#f3efe6]"
                />
              </div>
            </div>
          )}

          {candidates.length > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-400">Communes trouvées :</span>
              {candidates.slice(0, 8).map((cand) => (
                <button
                  key={`${cand.name}-${cand.latitude}-${cand.longitude}`}
                  type="button"
                  onClick={() => setCustomLoc(cand)}
                  className={`rounded border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                    customLoc?.name === cand.name
                      ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f3d67a]'
                      : 'border-white/15 bg-[#080d1b] text-slate-200 hover:border-[#d4af37]'
                  }`}
                >
                  {cand.name}
                </button>
              ))}
            </div>
          )}
          {lookupError && <div className="text-xs text-rose-300">{lookupError}</div>}
        </div>

        {/* Dedicated Ascendant Result Card */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{
            borderColor: `${result.ascSign.color}66`,
            background: 'linear-gradient(135deg, rgba(16,23,43,0.96), rgba(9,14,29,0.98))',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl border text-3xl font-bold"
                style={{
                  borderColor: `${result.ascSign.color}88`,
                  color: result.ascSign.color,
                  backgroundColor: `${result.ascSign.color}18`,
                }}
              >
                {result.ascSign.symbol}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Votre Ascendant (Maison I)
                </div>
                <div className="font-display text-2xl font-bold text-[#f8f3e6]">
                  {result.ascSign.name}{' '}
                  <span className="font-mono-tabular text-lg text-[#e7cfa0]">
                    {result.ascFormattedDeg}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {result.ascSign.element} · {result.ascSign.modality} · Maître d’Ascendant :{' '}
                  <strong className="text-[#f3d67a]">{result.ascSign.ruler}</strong>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1 text-xs">
              <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#080d1b] px-2.5 py-1 text-slate-300">
                <MapPin className="w-3 h-3 text-[#d4af37]" />
                <span>{result.cityName}</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-[#7dd3fc]">
                Ce signe s’étend de {fmtTimeHm(result.signWindowStart)} à {fmtTimeHm(result.signWindowEnd)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-white/10">
            <div className="rounded-lg border border-white/10 bg-[#080d1b]/80 px-3 py-2">
              <div className="text-[10px] text-slate-400">Descendant (Axe VII · Opposé)</div>
              <div className="font-semibold text-[#f3efe6] mt-0.5">
                {result.dscSign.symbol} {result.dscSign.name}{' '}
                <span className="font-mono-tabular text-slate-400">{result.dscFormattedDeg}</span>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#080d1b]/80 px-3 py-2">
              <div className="text-[10px] text-slate-400">Milieu du Ciel (MC · Vocation)</div>
              <div className="font-semibold text-[#f3efe6] mt-0.5">
                {result.mcSign.symbol} {result.mcSign.name}{' '}
                <span className="font-mono-tabular text-slate-400">{result.mcFormattedDeg}</span>
              </div>
            </div>
            <div className="rounded-lg border border-rose-400/20 bg-[#150f19] px-3 py-2">
              <div className="text-[10px] text-amber-300">Rameau Chinois (Ascendant)</div>
              <div className="font-semibold mt-0.5" style={{ color: chineseAsc.sign.color }}>
                {chineseAsc.sign.branchHanzi}
                {chineseAsc.sign.hanzi} {chineseAsc.sign.name} ({chineseAsc.sign.wuXing} ·{' '}
                {chineseAsc.sign.polarity})
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs leading-relaxed border-t border-white/10 pt-3">
            <div className="text-[11px] font-medium text-[#e7cfa0]">{deep.decanNote}</div>
            <p className="text-[#f3efe6]">
              <strong className="text-[#d4af37]">Tempérament & Posture : </strong>
              {deep.temperament}
            </p>
            <p className="text-slate-300">
              <strong className="text-[#7dd3fc]">Première impression : </strong>
              {deep.firstImpression}
            </p>
            <p className="text-slate-300">
              <strong className="text-emerald-300">Équilibre relationnel (ASC ↔ DSC) : </strong>
              {deep.axisBalance}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0d1428] px-3 py-2 text-xs font-medium text-slate-200 hover:border-[#d4af37] hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Ascendant copié' : 'Copier le résultat'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApplyToProfile({
                  birthDateIso: dateIso,
                  ...(customLoc
                    ? {
                        customCityName: customLoc.name,
                        customLat: customLoc.latitude,
                        customLon: customLoc.longitude,
                      }
                    : {
                        cityId,
                        customCityName: undefined,
                        customLat: undefined,
                        customLon: undefined,
                      }),
                });
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3.5 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Charger dans le thème complet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
