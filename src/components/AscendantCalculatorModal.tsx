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
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#07070C]/85 p-4 backdrop-blur-xl overflow-hidden"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[320px] w-[320px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto cosmic-scroll rounded-3xl border border-white/10 bg-[#0c0c16]/90 bg-white/[0.03] backdrop-blur-xl p-6 text-[#f3efe6] shadow-2xl shadow-black/50 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-200/80">
              <Compass className="w-4 h-4 text-amber-300/80" />
              <span className="font-serif italic text-sm tracking-wide">Calcul Direct &amp; Rapide</span>
            </div>
            <h2 className="font-display text-2xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase mt-1">
              Calculer l’Ascendant uniquement
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Saisissez simplement la date, l’heure exacte et la ville de naissance sans modifier vos thèmes enregistrés.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le calculateur d’Ascendant"
            className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs: Date, Time & Place */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 space-y-3.5 shadow-xl shadow-black/30">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
            <div>
              <label htmlFor="asc-day" className="block text-[11px] text-slate-400 mb-1">
                Jour
              </label>
              <select
                id="asc-day"
                value={Math.min(parts.day, maxDays)}
                onChange={(e) => updateParts({ day: Number(e.target.value) })}
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-2.5 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all cursor-pointer"
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
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all cursor-pointer"
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
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-2.5 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all cursor-pointer"
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
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-2.5 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all cursor-pointer"
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
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-2.5 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all cursor-pointer"
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
            <div className="flex items-center gap-1.5 flex-wrap">
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
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono-tabular text-[11px] text-slate-200 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setManualCoords((v) => !v)}
              className="text-[11px] text-amber-200/80 hover:text-amber-100 underline-offset-4 hover:underline cursor-pointer transition-colors"
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
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all cursor-pointer"
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
                    className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
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
                    className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-amber-100 hover:border-amber-300/30 disabled:opacity-50 transition-all duration-300 cursor-pointer"
                  >
                    {busy ? '...' : 'Chercher'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 items-end">
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
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
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
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
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
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2 font-mono-tabular text-xs text-white focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {candidates.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Communes trouvées :</span>
              {candidates.slice(0, 8).map((cand) => (
                <button
                  key={`${cand.name}-${cand.latitude}-${cand.longitude}`}
                  type="button"
                  onClick={() => setCustomLoc(cand)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-all duration-300 cursor-pointer ${
                    customLoc?.name === cand.name
                      ? 'border-amber-300/50 bg-amber-400/20 text-amber-100'
                      : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-amber-300/30'
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4 shadow-2xl shadow-black/50 hover:border-amber-300/30 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl font-bold font-glyph shadow-lg"
                style={{
                  borderColor: `${result.ascSign.color}88`,
                  color: result.ascSign.color,
                  backgroundColor: `${result.ascSign.color}18`,
                }}
              >
                {result.ascSign.symbol}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-amber-200/80">
                  Votre Ascendant (Maison I)
                </div>
                <div className="font-display text-2xl font-bold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase">
                  {result.ascSign.name}{' '}
                  <span className="font-mono-tabular text-lg text-amber-200">
                    {result.ascFormattedDeg}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-200">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px]">
                    {result.ascSign.element} · {result.ascSign.modality}
                  </span>
                  <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-0.5 text-[11px] text-amber-100">
                    Maître : <strong>{result.ascSign.ruler}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1 text-xs">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200">
                <MapPin className="w-3 h-3 text-amber-300/80" />
                <span>{result.cityName}</span>
              </div>
              <div className="font-mono-tabular text-[11px] text-indigo-200">
                Ce signe s’étend de {fmtTimeHm(result.signWindowStart)} à {fmtTimeHm(result.signWindowEnd)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-white/10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 hover:border-amber-300/30 transition-all duration-300">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Descendant (Axe VII · Opposé)</div>
              <div className="font-semibold text-[#f3efe6] mt-1">
                {result.dscSign.symbol} {result.dscSign.name}{' '}
                <span className="font-mono-tabular text-slate-400">{result.dscFormattedDeg}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 hover:border-amber-300/30 transition-all duration-300">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Milieu du Ciel (MC · Vocation)</div>
              <div className="font-semibold text-[#f3efe6] mt-1">
                {result.mcSign.symbol} {result.mcSign.name}{' '}
                <span className="font-mono-tabular text-slate-400">{result.mcFormattedDeg}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 hover:border-amber-300/30 transition-all duration-300">
              <div className="text-[10px] uppercase tracking-wider text-amber-200/80">Rameau Chinois (Ascendant)</div>
              <div className="font-semibold mt-1" style={{ color: chineseAsc.sign.color }}>
                {chineseAsc.sign.branchHanzi}
                {chineseAsc.sign.hanzi} {chineseAsc.sign.name} ({chineseAsc.sign.wuXing} ·{' '}
                {chineseAsc.sign.polarity})
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs leading-relaxed border-t border-white/10 pt-3">
            <div className="font-serif italic text-sm text-amber-100">{deep.decanNote}</div>
            <div className="grid grid-cols-1 gap-2">
              <div className="rounded-2xl border border-white/10 bg-[#07070C]/50 p-3 text-slate-200 leading-relaxed">
                <strong className="text-amber-200">Tempérament &amp; Posture : </strong>
                {deep.temperament}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07070C]/50 p-3 text-slate-200 leading-relaxed">
                <strong className="text-indigo-200">Première impression : </strong>
                {deep.firstImpression}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07070C]/50 p-3 text-slate-200 leading-relaxed">
                <strong className="text-emerald-200">Équilibre relationnel (ASC ↔ DSC) : </strong>
                {deep.axisBalance}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-amber-300/80" />}
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
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-8 py-3.5 text-xs shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Charger dans le thème complet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
