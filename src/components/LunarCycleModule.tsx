import React, { useMemo } from 'react';
import { Moon, Orbit } from 'lucide-react';
import { AstroChart } from '../astro/astroEngine';
import { calculateLunarCycleSnapshot } from '../astro/lunarCycle';

export interface LunarCycleModuleProps {
  natalChart: AstroChart;
  anchorDate?: Date;
  onInspectTransitDate?: (date: Date) => void;
}

function formatCountdownFr(daysFromNow: number): string {
  const hours = Math.round(daysFromNow * 24);
  if (hours < 2) return 'Imminent';
  if (hours < 24) return `Dans ${hours} h`;
  const days = Math.round(daysFromNow);
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

function formatEventDateFr(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const LunarCycleCircularGauge: React.FC<{
  phaseAngleDeg: number;
  cyclePercent: number;
  illuminationPercent: number;
}> = ({ phaseAngleDeg, cyclePercent, illuminationPercent }) => {
  const angle = ((phaseAngleDeg % 360) + 360) % 360;
  const rad = (angle * Math.PI) / 180;

  // Inner Moon Disc (center 80,80 · radius 38)
  const moonR = 38;
  const rx = Math.abs(Math.cos(rad)) * moonR;
  const litPath =
    angle <= 180
      ? `M 80 ${80 - moonR} A ${moonR} ${moonR} 0 0 1 80 ${80 + moonR} A ${rx.toFixed(2)} ${moonR} 0 0 ${angle <= 90 ? 0 : 1} 80 ${80 - moonR} Z`
      : `M 80 ${80 - moonR} A ${moonR} ${moonR} 0 0 0 80 ${80 + moonR} A ${rx.toFixed(2)} ${moonR} 0 0 ${angle < 270 ? 0 : 1} 80 ${80 - moonR} Z`;

  // Outer Circular Progression Ring (radius 60)
  const ringR = 60;
  const circumference = 2 * Math.PI * ringR;
  const progressFraction = Math.max(0.015, Math.min(1, angle / 360));
  const dashOffset = circumference * (1 - progressFraction);

  // Orbital pointer coordinates along the ring (starting top -90°)
  const pointerRad = ((angle - 90) * Math.PI) / 180;
  const px = 80 + ringR * Math.cos(pointerRad);
  const py = 80 + ringR * Math.sin(pointerRad);

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative h-36 w-36">
        <svg
          viewBox="0 0 160 160"
          className="h-full w-full"
          role="img"
          aria-label={`Jauge circulaire du cycle lunaire à ${cyclePercent}% (${illuminationPercent}% éclairée)`}
        >
          <defs>
            <linearGradient id="lunarCycleRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <radialGradient id="lunarModuleLitGrad" cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="55%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>
            <clipPath id="lunarModuleDiscClip">
              <circle cx="80" cy="80" r={moonR} />
            </clipPath>
          </defs>

          {/* Background Circular Track */}
          <circle
            cx="80"
            cy="80"
            r={ringR}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />

          {/* Quarter Cardinal Ticks (0° NL · 90° 1Q · 180° PL · 270° DQ) */}
          {[
            { deg: 0, label: 'NL' },
            { deg: 90, label: '1Q' },
            { deg: 180, label: 'PL' },
            { deg: 270, label: 'DQ' },
          ].map((q) => {
            const qRad = ((q.deg - 90) * Math.PI) / 180;
            const tx = 80 + (ringR + 13) * Math.cos(qRad);
            const ty = 80 + (ringR + 13) * Math.sin(qRad);
            const x1 = 80 + (ringR - 4) * Math.cos(qRad);
            const y1 = 80 + (ringR - 4) * Math.sin(qRad);
            const x2 = 80 + (ringR + 4) * Math.cos(qRad);
            const y2 = 80 + (ringR + 4) * Math.sin(qRad);
            return (
              <g key={q.label}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(253, 230, 138, 0.35)"
                  strokeWidth="1.2"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(203, 213, 225, 0.65)"
                  fontSize="7.5"
                  fontWeight="600"
                >
                  {q.label}
                </text>
              </g>
            );
          })}

          {/* Glowing Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r={ringR}
            fill="none"
            stroke="url(#lunarCycleRingGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 7px rgba(251, 191, 36, 0.45))' }}
          />

          {/* Current Cycle Orbital Marker Dot */}
          <circle
            cx={px}
            cy={py}
            r="4.5"
            fill="#fef3c7"
            stroke="#0f172a"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 0 6px rgba(253, 224, 71, 0.9))' }}
          />

          {/* Unlit Lunar Hemisphere */}
          <circle
            cx="80"
            cy="80"
            r={moonR}
            fill="#0c1222"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1"
          />

          {/* Illuminated Crescent / Quarter / Gibbous / Full Surface */}
          <g clipPath="url(#lunarModuleDiscClip)">
            <path d={litPath} fill="url(#lunarModuleLitGrad)" />
            <circle cx="68" cy="67" r="8.5" fill="rgba(15, 23, 42, 0.08)" />
            <circle cx="91" cy="76" r="10.5" fill="rgba(15, 23, 42, 0.07)" />
            <circle cx="76" cy="95" r="6.5" fill="rgba(15, 23, 42, 0.06)" />
          </g>
        </svg>
      </div>

      {/* Numeric Circular Gauge Readout */}
      <div className="text-center space-y-0.5">
        <div className="font-mono-tabular text-xs font-bold text-amber-200">
          {cyclePercent}% du cycle
        </div>
        <div className="font-mono-tabular text-[11px] text-slate-400">
          Écart {Math.round(angle)}° · {illuminationPercent}% éclairée
        </div>
      </div>
    </div>
  );
};

export const LunarCycleModule: React.FC<LunarCycleModuleProps> = ({
  natalChart,
  anchorDate,
  onInspectTransitDate,
}) => {
  const lunarCycle = useMemo(() => {
    return calculateLunarCycleSnapshot(anchorDate ?? new Date(), natalChart);
  }, [anchorDate, natalChart]);

  const cyclePercent = Math.round((lunarCycle.phaseAngleDeg / 360) * 100);

  return (
    <section
      aria-label="Module Cycle Lunaire"
      className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-5 sm:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)] ring-1 ring-amber-300/10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-300/40 bg-indigo-400/12 text-amber-200 shrink-0">
            <Moon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-display text-sm sm:text-base font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Cycle Lunaire
            </h2>
            <p className="text-[11.5px] text-slate-400">
              Phase en cours, jauge orbitale &amp; prochaines lunaisons
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="font-mono-tabular text-amber-200 font-semibold">
            Jour {lunarCycle.lunarAgeDays.toFixed(1)} / {lunarCycle.synodicCycleDays.toFixed(1)}
          </span>
          <span aria-hidden="true" className="text-white/25">·</span>
          <span className="text-indigo-200">
            {lunarCycle.phase.isWaxing ? 'Lune croissante' : 'Lune décroissante'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left + Center: Circular Progress Gauge & Concise Phase Interpretation */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-center gap-5">
          <LunarCycleCircularGauge
            phaseAngleDeg={lunarCycle.phaseAngleDeg}
            cyclePercent={cyclePercent}
            illuminationPercent={lunarCycle.illuminationPercent}
          />

          <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-purple-200">
                {lunarCycle.phase.archetype}
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-amber-100 tracking-wide">
                {lunarCycle.phase.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-300">
                <span className="font-mono-tabular text-sky-200 font-medium">
                  ☽ {lunarCycle.currentDegFormatted} {lunarCycle.currentSignName}
                </span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span className="text-amber-200/90">
                  Maison {lunarCycle.currentNatalHouseRoman} natale
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200">
              {lunarCycle.phase.interpretation}
            </p>

            <p className="font-serif italic text-sm text-amber-100/85 leading-relaxed">
              « {lunarCycle.phase.guidance} »
            </p>
          </div>
        </div>

        {/* Right: Next New Moon & Next Full Moon */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {[lunarCycle.nextNewMoon, lunarCycle.nextFullMoon].map((ev) => {
            const isNew = ev.kind === 'new_moon';
            return (
              <article
                key={ev.kind}
                className="cosmic-glass-card rounded-2xl border border-white/10 bg-[#0b0e19]/80 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full border shrink-0 ${
                        isNew
                          ? 'border-indigo-300/70 bg-[#070a14]'
                          : 'border-amber-200 bg-gradient-to-br from-amber-100 to-slate-200 shadow-[0_0_8px_rgba(253,230,138,0.65)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={isNew ? 'text-indigo-200' : 'text-amber-200'}>
                      {ev.label}
                    </span>
                    <span className="text-slate-400 font-normal">
                      · {formatCountdownFr(ev.daysFromNow)}
                    </span>
                  </div>

                  <div className="font-mono-tabular text-xs font-semibold text-slate-100">
                    {formatEventDateFr(ev.date)}
                  </div>

                  <div className="text-[11px] text-slate-300 truncate">
                    {ev.signSymbol} {ev.degFormatted} {ev.signName} · Maison {ev.natalHouseRoman}
                  </div>
                </div>

                {onInspectTransitDate && (
                  <button
                    type="button"
                    onClick={() => onInspectTransitDate(ev.date)}
                    title={`Voir ${ev.label} sur la roue`}
                    className="flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-400/12 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Orbit className="h-3 w-3 text-amber-300" />
                    <span>Roue</span>
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
