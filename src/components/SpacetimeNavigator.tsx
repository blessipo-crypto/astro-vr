import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  FastForward,
  Lock,
  MoveHorizontal,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface SpacetimeNavigatorProps {
  transitDate: Date;
  timeSpeedDaysPerSec: number;
  realTimeDaysPerSec: number;
  onSetTransitDate: (date: Date) => void;
  onStepMinutes: (deltaMinutes: number) => void;
  onTimeSpeedChange: (speed: number) => void;
  onResetNow: () => void;
  modeLabel?: string;
  compact?: boolean;
  locked?: boolean;
  onLockedAttempt?: () => void;
}

const SPEED_OPTIONS: Array<{ label: string; shortLabel: string; speed: number }> = [
  { label: 'Temps réel (1s/s)', shortLabel: 'Réel', speed: 1 / 86400 },
  { label: '1 min / sec', shortLabel: '1m/s', speed: 1 / 1440 },
  { label: '1 h / sec', shortLabel: '1h/s', speed: 1 / 24 },
  { label: '1 jour / sec', shortLabel: '1j/s', speed: 1 },
  { label: '7 jours / sec', shortLabel: '7j/s', speed: 7 },
  { label: '1 mois / sec', shortLabel: '1M/s', speed: 30 },
  { label: '1 an / sec', shortLabel: '1A/s', speed: 365.25 },
];

const STEP_BUTTONS: Array<{ label: string; minutes: number }> = [
  { label: '-1 an', minutes: -525949 },
  { label: '-1 mois', minutes: -43829 },
  { label: '-1 j', minutes: -1440 },
  { label: '-1 h', minutes: -60 },
  { label: '-1 min', minutes: -1 },
  { label: '+1 min', minutes: 1 },
  { label: '+1 h', minutes: 60 },
  { label: '+1 j', minutes: 1440 },
  { label: '+1 mois', minutes: 43829 },
  { label: '+1 an', minutes: 525949 },
];

type ScrubSpanId = 'day' | 'month' | 'year' | 'decade';

const SCRUB_SPANS: Array<{ id: ScrubSpanId; label: string; halfRangeMs: number }> = [
  { id: 'day', label: '±24h', halfRangeMs: 24 * 3600 * 1000 },
  { id: 'month', label: '±30j', halfRangeMs: 30 * 86400 * 1000 },
  { id: 'year', label: '±1 an', halfRangeMs: 182.625 * 86400 * 1000 },
  { id: 'decade', label: '±5 ans', halfRangeMs: 5 * 365.25 * 86400 * 1000 },
];

function formatDeltaOffset(deltaMs: number): string {
  const absSec = Math.round(Math.abs(deltaMs) / 1000);
  if (absSec < 5) return 'Centre';
  const sign = deltaMs >= 0 ? '+' : '-';
  if (absSec < 60) return `${sign}${absSec}s`;
  const absMin = Math.round(absSec / 60);
  if (absMin < 60) return `${sign}${absMin}m`;
  const absH = Math.round(absMin / 60);
  if (absH < 48) return `${sign}${absH}h`;
  const absD = Math.round(absH / 24);
  if (absD < 60) return `${sign}${absD}j`;
  const absM = Math.round(absD / 30.4375);
  if (absM < 24) return `${sign}${absM}M`;
  const absY = (absD / 365.25).toFixed(1);
  return `${sign}${absY}A`;
}

export const SpacetimeNavigator: React.FC<SpacetimeNavigatorProps> = ({
  transitDate,
  timeSpeedDaysPerSec,
  realTimeDaysPerSec,
  onSetTransitDate,
  onStepMinutes,
  onTimeSpeedChange,
  onResetNow,
  modeLabel,
  compact = false,
  locked = false,
  onLockedAttempt,
}) => {
  const isPlaying = timeSpeedDaysPerSec > 0;
  const isRealTime = Math.abs(timeSpeedDaysPerSec - realTimeDaysPerSec) < 1e-8;

  const [scrubSpanId, setScrubSpanId] = useState<ScrubSpanId>('month');
  const [anchorMs, setAnchorMs] = useState<number>(() => transitDate.getTime());
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const lastActiveSpeedRef = useRef<number>(1);
  const holdTimerRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  if (timeSpeedDaysPerSec > 0) {
    lastActiveSpeedRef.current = timeSpeedDaysPerSec;
  }

  const activeSpan = useMemo(
    () => SCRUB_SPANS.find((s) => s.id === scrubSpanId) ?? SCRUB_SPANS[1],
    [scrubSpanId]
  );

  // Keep anchor naturally tracking transitDate if user jumps out of current scrubber bounds while not dragging
  const currentMs = transitDate.getTime();
  useEffect(() => {
    if (isScrubbing) return;
    if (Math.abs(currentMs - anchorMs) > activeSpan.halfRangeMs) {
      setAnchorMs(currentMs);
    }
  }, [currentMs, anchorMs, activeSpan.halfRangeMs, isScrubbing]);

  const stopHoldRepeat = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopHoldRepeat(), [stopHoldRepeat]);

  const startHoldStep = useCallback(
    (minutes: number) => {
      if (locked) {
        onLockedAttempt?.();
        return;
      }
      stopHoldRepeat();
      onStepMinutes(minutes);
      holdTimerRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          onStepMinutes(minutes);
        }, 75);
      }, 320);
    },
    [locked, onLockedAttempt, onStepMinutes, stopHoldRepeat]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(transitDate),
    [transitDate]
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(transitDate),
    [transitDate]
  );

  const sliderProgress = useMemo(() => {
    const raw = (currentMs - anchorMs) / activeSpan.halfRangeMs;
    const clamped = Math.max(-1, Math.min(1, raw));
    return ((clamped + 1) / 2) * 100;
  }, [currentMs, anchorMs, activeSpan.halfRangeMs]);

  const scrubValueMs = Math.max(
    anchorMs - activeSpan.halfRangeMs,
    Math.min(anchorMs + activeSpan.halfRangeMs, currentMs)
  );
  const deltaFromAnchor = currentMs - anchorMs;

  return (
    <section
      aria-label="Spacetime Navigator"
      className={`w-full rounded-3xl border border-amber-200/30 bg-[#151824]/82 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.58)] ring-1 ring-amber-300/12 transition-all duration-300 ${
        compact ? 'px-3.5 py-2' : 'px-4 py-2.5'
      }`}
    >
      {/* Top Row: Live Readout + Transport + Quick Speeds */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Live Date & Orbital Activity Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`relative flex h-8 w-8 items-center justify-center rounded-full border shrink-0 transition-all duration-300 ${
              isPlaying
                ? 'border-amber-300/60 bg-amber-400/15 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.28)]'
                : 'border-amber-300/25 bg-amber-400/10 text-amber-300/80'
            }`}
          >
            {isPlaying && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full border border-amber-300/50 animate-ping opacity-30"
              />
            )}
            <Sparkles className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[11px] font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent whitespace-nowrap">
                Spacetime Navigator
              </span>
              {modeLabel && (
                <span className="hidden sm:inline-block rounded-full border border-indigo-300/25 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200 whitespace-nowrap">
                  {modeLabel}
                </span>
              )}
              {locked && (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200 whitespace-nowrap">
                  <Lock className="h-2.5 w-2.5" />
                  <span>Verrouillé</span>
                </span>
              )}
            </div>
            <div className="font-mono-tabular text-xs text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-amber-200 font-semibold">{formattedDate}</span>
              <span className="text-white/30">·</span>
              <span className="text-sky-200">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Now + Play/Pause + Speed Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              if (locked) {
                onLockedAttempt?.();
                return;
              }
              const now = new Date();
              setAnchorMs(now.getTime());
              onResetNow();
            }}
            title={locked ? 'Navigation temporelle verrouillée' : 'Synchroniser immédiatement sur l’instant présent (Temps réel)'}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
              locked
                ? 'border-white/10 bg-white/[0.02] text-slate-500 cursor-not-allowed'
                : isRealTime
                  ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)] cursor-pointer'
                  : 'border-amber-200/25 bg-white/[0.04] text-amber-100 hover:border-amber-300/50 cursor-pointer'
            }`}
          >
            {isRealTime && !locked && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            )}
            <Clock className="h-3 w-3 text-amber-300" />
            <span>Now</span>
          </button>

          <button
            type="button"
            disabled={locked}
            onClick={() => {
              if (locked) {
                onLockedAttempt?.();
                return;
              }
              onTimeSpeedChange(isPlaying ? 0 : lastActiveSpeedRef.current || 1);
            }}
            title={locked ? 'Navigation temporelle verrouillée' : isPlaying ? 'Mettre l’animation temporelle en pause' : 'Animer le mouvement planétaire à 60 ips'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
              locked
                ? 'border border-white/10 bg-white/[0.02] text-slate-500 cursor-not-allowed'
                : isPlaying
                  ? 'bg-gradient-to-r from-amber-500/90 via-amber-400/90 to-yellow-500/90 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.38)] cursor-pointer'
                  : 'border border-amber-300/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25 cursor-pointer'
            }`}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Direct tactile speed pills on wider screens */}
          <div className="hidden md:flex items-center gap-0.5 rounded-full border border-white/10 bg-[#0b0e19]/80 p-0.5">
            {SPEED_OPTIONS.map((opt) => {
              const active = Math.abs(opt.speed - timeSpeedDaysPerSec) < 1e-7;
              return (
                <button
                  key={opt.shortLabel}
                  type="button"
                  disabled={locked}
                  title={locked ? 'Navigation temporelle verrouillée' : opt.label}
                  onClick={() => (locked ? onLockedAttempt?.() : onTimeSpeedChange(opt.speed))}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all whitespace-nowrap ${
                    locked
                      ? 'text-slate-600 cursor-not-allowed border border-transparent'
                      : active
                        ? 'bg-sky-400/25 text-sky-100 border border-sky-300/50 shadow-[0_0_10px_rgba(56,189,248,0.2)] cursor-pointer'
                        : 'text-slate-300 hover:text-white border border-transparent cursor-pointer'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          <select
            aria-label="Vitesse d’animation Spacetime"
            disabled={locked}
            value={
              SPEED_OPTIONS.find((s) => Math.abs(s.speed - timeSpeedDaysPerSec) < 1e-7)?.speed ??
              (isPlaying ? 1 : 0)
            }
            onChange={(e) => onTimeSpeedChange(Number(e.target.value))}
            className="md:hidden rounded-full border border-white/15 bg-[#0e1220] px-2.5 py-1 text-[11px] text-amber-100 cursor-pointer focus:border-amber-300/60 outline-none disabled:opacity-50"
          >
            <option value={0}>Pause (0x)</option>
            {SPEED_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.speed}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle Row: Continuous 60fps Orbital Timeline Scrubber */}
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0d18]/75 px-3 py-1.5">
        <div className="flex items-center gap-1 shrink-0">
          <MoveHorizontal className="h-3.5 w-3.5 text-amber-300/80" aria-hidden="true" />
          <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            {SCRUB_SPANS.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => {
                  setScrubSpanId(sp.id);
                  setAnchorMs(currentMs);
                }}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  scrubSpanId === sp.id
                    ? 'bg-amber-400/20 text-amber-100 border border-amber-300/45'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex-1 min-w-[140px] flex items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 h-1.5 rounded-full bg-white/10 overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-400/45 via-amber-300/75 to-sky-400/75"
              style={{ width: `${sliderProgress}%` }}
            />
          </div>
          <input
            type="range"
            aria-label="Curseur temporel continu des planètes"
            disabled={locked}
            min={anchorMs - activeSpan.halfRangeMs}
            max={anchorMs + activeSpan.halfRangeMs}
            step={Math.max(1000, Math.floor((activeSpan.halfRangeMs * 2) / 1000))}
            value={scrubValueMs}
            onPointerDown={() => {
              if (locked) {
                onLockedAttempt?.();
                return;
              }
              setIsScrubbing(true);
              if (isPlaying) onTimeSpeedChange(0);
            }}
            onPointerUp={() => setIsScrubbing(false)}
            onPointerCancel={() => setIsScrubbing(false)}
            onChange={(e) => {
              if (locked) return;
              const nextMs = Number(e.target.value);
              onSetTransitDate(new Date(nextMs));
            }}
            className={`relative z-10 w-full h-4 appearance-none bg-transparent accent-amber-300 ${
              locked ? 'cursor-not-allowed opacity-50' : 'cursor-ew-resize'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono-tabular text-[10px] text-amber-200/90 min-w-[46px] text-right">
            {formatDeltaOffset(deltaFromAnchor)}
          </span>
          {Math.abs(deltaFromAnchor) > 5000 && (
            <button
              type="button"
              onClick={() => setAnchorMs(currentMs)}
              title="Recentrer le curseur sur la date affichée"
              className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-300 hover:border-amber-300/40 hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw className="h-2.5 w-2.5 text-amber-300/80" />
              <span className="hidden sm:inline">Ancrer</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Precision Hold-to-Glide Time Jump Buttons */}
      <div className="mt-1.5 flex items-center gap-1 overflow-x-auto cosmic-scroll pb-0.5">
        <Rewind className="h-3 w-3 text-slate-400 shrink-0 mr-0.5" aria-hidden="true" />
        {STEP_BUTTONS.slice(0, 5).map((step) => (
          <button
            key={step.label}
            type="button"
            title="Cliquer ou maintenir appuyé pour glisser dans le passé"
            onPointerDown={() => startHoldStep(step.minutes)}
            onPointerUp={stopHoldRepeat}
            onPointerLeave={stopHoldRepeat}
            onPointerCancel={stopHoldRepeat}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStepMinutes(step.minutes);
              }
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono-tabular text-[10.5px] font-medium text-slate-200 hover:border-amber-300/40 hover:bg-amber-400/10 hover:text-amber-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 select-none"
          >
            {step.label}
          </button>
        ))}

        <div className="h-3.5 w-px bg-white/10 mx-0.5 shrink-0" aria-hidden="true" />

        {STEP_BUTTONS.slice(5).map((step) => (
          <button
            key={step.label}
            type="button"
            title="Cliquer ou maintenir appuyé pour glisser dans le futur"
            onPointerDown={() => startHoldStep(step.minutes)}
            onPointerUp={stopHoldRepeat}
            onPointerLeave={stopHoldRepeat}
            onPointerCancel={stopHoldRepeat}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStepMinutes(step.minutes);
              }
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono-tabular text-[10.5px] font-medium text-sky-200 hover:border-sky-300/45 hover:bg-sky-400/10 hover:text-white active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 select-none"
          >
            {step.label}
          </button>
        ))}
        <FastForward className="h-3 w-3 text-sky-300/80 shrink-0 ml-0.5" aria-hidden="true" />
      </div>
    </section>
  );
};
