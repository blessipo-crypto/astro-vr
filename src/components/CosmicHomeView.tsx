import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  Compass,
  Moon,
  Orbit,
  Sparkles,
  Stars,
  Sun,
  UserCheck,
} from 'lucide-react';
import {
  AstroChart,
  ChartMode,
  ComparisonAspectInfo,
  HOUSE_SYSTEMS,
  NatalProfile,
} from '../astro/astroEngine';
import { generateChartInterpretation } from '../astro/interpretations';
import { ZodiacTradition } from '../astro/chineseAstrology';
import {
  scanUpcomingTransitNotifications,
  TransitAlertCategory,
  TransitNotification,
} from '../astro/transitNotifications';
import { LunarCycleModule } from './LunarCycleModule';

export interface CosmicHomeViewProps {
  mode: ChartMode;
  tradition: ZodiacTradition;
  natalChart?: AstroChart;
  baseChart: AstroChart;
  outerChart: AstroChart | null;
  comparisonAspects: ComparisonAspectInfo[];
  profiles: NatalProfile[];
  activeProfileId: string;
  draftProfile: NatalProfile;
  onSelectProfile: (id: string) => void;
  onOpenWheel: () => void;
  onOpenDataSheet: () => void;
  onOpenAuxiliary: () => void;
  onOpenFullSummary: () => void;
  onOpenConfig: () => void;
  onInspectTransitDate?: (date: Date) => void;
}

interface ProgressRingProps {
  percentage: number;
  color: 'gold' | 'lavender' | 'glacier';
  label?: string;
}

const RING_COLORS: Record<ProgressRingProps['color'], { stroke: string; glow: string; text: string }> = {
  gold: {
    stroke: '#fbbf24',
    glow: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.55))',
    text: 'text-amber-200',
  },
  lavender: {
    stroke: '#c084fc',
    glow: 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.55))',
    text: 'text-purple-200',
  },
  glacier: {
    stroke: '#38bdf8',
    glow: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.55))',
    text: 'text-sky-200',
  },
};

export const CircularCosmicProgress: React.FC<ProgressRingProps> = ({
  percentage,
  color,
}) => {
  const clamped = Math.max(8, Math.min(99, Math.round(percentage)));
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped / 100);
  const palette = RING_COLORS[color];

  return (
    <div className="relative flex h-16 w-16 items-center justify-center shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" style={{ filter: palette.glow }}>
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4.5"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={palette.stroke}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700"
        />
      </svg>
      <span className={`absolute font-mono-tabular text-xs font-bold ${palette.text}`}>
        {clamped}%
      </span>
    </div>
  );
};

type NotifFilter = 'all' | 'major' | TransitAlertCategory;

const READ_NOTIFS_STORAGE_KEY = 'uranie_vr_read_transit_notifs_v1';

function formatCountdownFr(daysFromNow: number): string {
  const hours = Math.round(daysFromNow * 24);
  if (hours < 2) return 'Imminent';
  if (hours < 24) return `Dans ${hours} h`;
  const days = Math.round(daysFromNow);
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

export const CosmicHomeView: React.FC<CosmicHomeViewProps> = ({
  mode,
  tradition,
  natalChart,
  baseChart,
  outerChart,
  comparisonAspects,
  profiles,
  activeProfileId,
  draftProfile,
  onSelectProfile,
  onOpenWheel,
  onOpenDataSheet,
  onOpenAuxiliary,
  onOpenFullSummary,
  onOpenConfig,
  onInspectTransitDate,
}) => {
  const activeNatalChart = natalChart ?? baseChart;
  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const moon = baseChart.planets.find((p) => p.id === 'moon');
  const venus = baseChart.planets.find((p) => p.id === 'venus');
  const mars = baseChart.planets.find((p) => p.id === 'mars');

  const [notifFilter, setNotifFilter] = useState<NotifFilter>('all');
  const [showAllNotifs, setShowAllNotifs] = useState<boolean>(false);
  const [readIdsByProfile, setReadIdsByProfile] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Record<string, string[]>;
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(readIdsByProfile));
    } catch {
      // Ignore storage errors
    }
  }, [readIdsByProfile]);

  const upcomingNotifications = useMemo<TransitNotification[]>(() => {
    const anchorNow = new Date();
    return scanUpcomingTransitNotifications(activeNatalChart, anchorNow, 30);
  }, [activeNatalChart]);

  const readSet = useMemo(
    () => new Set(readIdsByProfile[activeProfileId] ?? []),
    [readIdsByProfile, activeProfileId]
  );

  const unreadCount = useMemo(
    () => upcomingNotifications.filter((n) => !readSet.has(n.id)).length,
    [upcomingNotifications, readSet]
  );

  const filteredNotifications = useMemo(() => {
    return upcomingNotifications.filter((n) => {
      if (notifFilter === 'all') return true;
      if (notifFilter === 'major') return n.priority === 'major';
      return n.category === notifFilter;
    });
  }, [upcomingNotifications, notifFilter]);

  const visibleNotifications = showAllNotifs
    ? filteredNotifications
    : filteredNotifications.slice(0, 6);

  const toggleReadNotif = (id: string) => {
    setReadIdsByProfile((prev) => {
      const current = new Set(prev[activeProfileId] ?? []);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      return { ...prev, [activeProfileId]: Array.from(current).slice(-250) };
    });
  };

  const markAllRead = () => {
    setReadIdsByProfile((prev) => ({
      ...prev,
      [activeProfileId]: upcomingNotifications.map((n) => n.id),
    }));
  };

  const fmtNotifDate = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);

  const interp = useMemo(
    () =>
      generateChartInterpretation({
        mode,
        tradition,
        baseChart,
        outerChart,
        comparisonAspects,
        solarReturnAnalysis: null,
        comparativeAnalysis: null,
      }),
    [mode, tradition, baseChart, outerChart, comparisonAspects]
  );

  // Compute deterministic Cosmic Resonance Scores from actual planetary geometry & elemental distribution
  const metrics = useMemo(() => {
    const activeAspects = outerChart ? comparisonAspects : baseChart.aspects;
    const harmCount = activeAspects.filter((a) => a.harmony === 'harmonious' || a.harmony === 'fusion').length;
    const tenseCount = activeAspects.filter((a) => a.harmony === 'tense').length;
    const tightestOrb = activeAspects[0]?.orb ?? 4.5;
    const totalEl =
      baseChart.elements.Feu +
      baseChart.elements.Terre +
      baseChart.elements.Air +
      baseChart.elements.Eau || 1;
    const maxEl = Math.max(
      baseChart.elements.Feu,
      baseChart.elements.Terre,
      baseChart.elements.Air,
      baseChart.elements.Eau
    );

    const alignmentScore = Math.min(97, Math.max(58, Math.round(74 + harmCount * 4 - tenseCount * 1.5 + (6 - Math.min(6, tightestOrb)) * 2)));
    const intuitionScore = Math.min(98, Math.max(62, Math.round(68 + (moon ? moon.house * 1.8 : 8) + baseChart.declinationAspects.length * 4)));
    const momentumScore = Math.min(96, Math.max(55, Math.round(64 + (sun ? (sun.degInSign % 10) * 1.4 : 6) + (maxEl / totalEl) * 28)));
    const clarityScore = Math.min(95, Math.max(60, Math.round(70 + (mars && !mars.retrograde ? 10 : 4) + (venus && !venus.retrograde ? 8 : 3))));

    return { alignmentScore, intuitionScore, momentumScore, clarityScore };
  }, [baseChart, outerChart, comparisonAspects, moon, sun, mars, venus]);

  const houseMeta = HOUSE_SYSTEMS.find((h) => h.id === baseChart.houseSystem);

  const insightCards = [
    {
      id: 'insight-solar',
      icon: Sun,
      iconBg: 'border-amber-300/40 bg-amber-400/10 text-amber-300',
      ringColor: 'gold' as const,
      score: metrics.alignmentScore,
      tag: sun ? `${sun.symbol} Soleil · ${sun.formattedDeg} ${sun.sign.name}` : 'Rayonnement Solaire',
      title: 'Architecture Identitaire & Alignement Cosmique',
      body: sun?.signMeaning || interp.synthesis,
    },
    {
      id: 'insight-lunar',
      icon: Moon,
      iconBg: 'border-purple-300/40 bg-purple-400/10 text-purple-300',
      ringColor: 'lavender' as const,
      score: metrics.intuitionScore,
      tag: moon ? `${moon.symbol} Lune · Maison ${baseChart.houses[moon.house - 1]?.roman ?? moon.house}` : 'Résonance Émotionnelle',
      title: 'Climat Intérieur, Mémoire & Intuition Lunaire',
      body: moon?.signMeaning || interp.sections[0]?.body || '',
    },
    {
      id: 'insight-horizon',
      icon: Compass,
      iconBg: 'border-sky-300/40 bg-sky-400/10 text-sky-300',
      ringColor: 'glacier' as const,
      score: metrics.momentumScore,
      tag: `ASC ${baseChart.ascSign.symbol} ${baseChart.ascSign.name} · MC ${baseChart.mcSign.name}`,
      title: 'Boussole d’Horizon, Maisons & Cap d’Action',
      body: interp.synthesis,
    },
    {
      id: 'insight-aspects',
      icon: Stars,
      iconBg: 'border-amber-300/40 bg-indigo-400/10 text-amber-200',
      ringColor: 'gold' as const,
      score: metrics.clarityScore,
      tag: `${baseChart.aspects.length} aspects actifs · ${baseChart.declinationAspects.length} déclinaisons`,
      title: 'Synthèse des Aspects & Parallèles Actifs',
      body:
        (outerChart ? comparisonAspects[0]?.interpretation : baseChart.aspects[0]?.interpretation) ||
        'Votre thème révèle une distribution planétaire harmonieuse prête à être explorée sur la roue interactive.',
    },
  ];

  return (
    <div className="no-print fixed inset-0 z-10 overflow-y-auto cosmic-scroll pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero Cosmic Identity Banner */}
        <section className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-6 sm:p-7 shadow-[0_18px_50px_rgba(0,0,0,0.6)] ring-1 ring-amber-300/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Synthèse Astrale · {houseMeta?.shortName ?? 'Placidus'}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                {draftProfile.name.trim() || 'Observatoire Personnel'}
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-amber-100/85">
                {interp.headline}
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                {baseChart.cityName} · Ascendant <span className="text-amber-200 font-semibold">{baseChart.ascSign.symbol} {baseChart.ascSign.name}</span> · Milieu du Ciel <span className="text-sky-200 font-semibold">{baseChart.mcSign.symbol} {baseChart.mcSign.name}</span>
              </p>
            </div>

            {/* Profile Switcher + Direct Workspace Shortcuts */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-300/80 shrink-0" />
                <select
                  aria-label="Profil natal actif"
                  value={activeProfileId}
                  onChange={(e) => onSelectProfile(e.target.value)}
                  className="rounded-xl border border-amber-200/25 bg-[#0c101d] px-3 py-2 text-xs font-medium text-amber-100 focus:border-amber-300/60 outline-none cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.trim() || 'Thème sans nom'} ({p.birthDateIso.slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenWheel}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/90 via-amber-400/90 to-yellow-500/90 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Orbit className="h-3.5 w-3.5" />
                  <span>Roue & Spacetime</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenFullSummary}
                  className="flex items-center gap-1.5 rounded-full border border-amber-200/30 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-amber-100 hover:border-amber-300/60 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Interprétation Complète</span>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Element Balance Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Feu', 'Terre', 'Air', 'Eau'] as const).map((el) => {
              const count = baseChart.elements[el];
              const total =
                baseChart.elements.Feu +
                baseChart.elements.Terre +
                baseChart.elements.Air +
                baseChart.elements.Eau || 1;
              const pct = Math.round((count / total) * 100);
              const barColor =
                el === 'Feu'
                  ? 'from-amber-400 to-rose-500'
                  : el === 'Terre'
                    ? 'from-emerald-400 to-teal-500'
                    : el === 'Air'
                      ? 'from-sky-400 to-indigo-400'
                      : 'from-purple-400 to-blue-500';
              return (
                <div key={el} className="rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{el}</span>
                    <span className="font-mono-tabular font-semibold text-amber-200">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cycle Lunaire Module */}
        <LunarCycleModule
          natalChart={activeNatalChart}
          onInspectTransitDate={onInspectTransitDate}
        />

        {/* 30-Day Major Planetary Transits Notifications Feed */}
        <section
          aria-label="Notifications des transits planétaires des 30 prochains jours"
          className="cosmic-glass-panel rounded-3xl border border-amber-200/30 bg-[#151824]/75 backdrop-blur-xl p-5 sm:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)] ring-1 ring-amber-300/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-start gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-400/12 text-amber-300 shrink-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-1 font-mono-tabular text-[10px] font-bold text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-sm sm:text-base font-semibold tracking-widest uppercase bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                    Alertes Transits · 30 Prochains Jours
                  </h2>
                  <span className="rounded-full border border-indigo-300/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-medium text-indigo-200">
                    {upcomingNotifications.length} événement{upcomingNotifications.length > 1 ? 's' : ''} détecté{upcomingNotifications.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Entrées dans vos maisons natales (ex. Saturne en Maison VII), aspects exacts, changements de signes et stations pour{' '}
                  <span className="text-amber-200 font-medium">{draftProfile.name.trim() || 'ce thème natal'}</span>.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 self-start md:self-auto rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-300/45 hover:text-amber-100 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', `Tous (${upcomingNotifications.length})`],
                ['major', `Majeurs (${upcomingNotifications.filter((n) => n.priority === 'major').length})`],
                ['house_ingress', `Entrées Maison (${upcomingNotifications.filter((n) => n.category === 'house_ingress').length})`],
                ['natal_aspect', `Aspects Natals (${upcomingNotifications.filter((n) => n.category === 'natal_aspect').length})`],
                ['sign_ingress', `Signes (${upcomingNotifications.filter((n) => n.category === 'sign_ingress').length})`],
                ['station', `Stations ℞ (${upcomingNotifications.filter((n) => n.category === 'station').length})`],
              ] as Array<[NotifFilter, string]>
            ).map(([fKey, fLabel]) => (
              <button
                key={fKey}
                type="button"
                onClick={() => setNotifFilter(fKey)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  notifFilter === fKey
                    ? 'bg-gradient-to-r from-amber-400/90 via-amber-300/90 to-yellow-400/90 text-slate-950 font-semibold shadow-[0_0_14px_rgba(251,191,36,0.28)]'
                    : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-300/35 hover:text-white'
                }`}
              >
                {fLabel}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="mt-4 space-y-2.5 max-h-[420px] overflow-y-auto cosmic-scroll px-1.5 py-1">
            {visibleNotifications.map((notif) => {
              const isRead = readSet.has(notif.id);
              const priorityBadge =
                notif.priority === 'major'
                  ? 'border-amber-300/45 bg-amber-400/15 text-amber-200'
                  : notif.priority === 'notable'
                    ? 'border-sky-300/40 bg-sky-400/15 text-sky-200'
                    : 'border-purple-300/35 bg-purple-400/10 text-purple-200';
              const priorityLabel =
                notif.priority === 'major'
                  ? 'Transit Majeur'
                  : notif.priority === 'notable'
                    ? 'Transit Notable'
                    : 'Mouvement';

              return (
                <article
                  key={notif.id}
                  className={`cosmic-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                    isRead
                      ? 'border-white/10 bg-white/[0.02] opacity-75'
                      : notif.priority === 'major'
                        ? 'border-amber-300/40 bg-amber-500/[0.06] shadow-[0_0_24px_rgba(251,191,36,0.08)]'
                        : 'border-white/15 bg-white/[0.035]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-lg font-semibold shrink-0 ${
                        notif.priority === 'major'
                          ? 'border-amber-300/50 bg-amber-400/15 text-amber-200'
                          : 'border-sky-300/35 bg-sky-500/10 text-sky-200'
                      }`}
                      style={{ fontFamily: 'var(--font-glyph)', fontVariantEmoji: 'text' }}
                    >
                      {notif.planetSymbol}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!isRead && (
                          <span
                            className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                            aria-label="Non lu"
                          />
                        )}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityBadge}`}>
                          {priorityLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0b0e19]/80 px-2 py-0.5 font-mono-tabular text-[10px] text-sky-200">
                          <CalendarClock className="h-2.5 w-2.5 text-sky-300" />
                          <span>{formatCountdownFr(notif.daysFromNow)} · {fmtNotifDate(notif.date)}</span>
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-semibold text-amber-100">
                        {notif.title}{' '}
                        <span className="font-normal text-indigo-200/90">— {notif.subtitle}</span>
                      </h3>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {onInspectTransitDate && (
                      <button
                        type="button"
                        onClick={() => onInspectTransitDate(notif.date)}
                        title="Positionner la Roue SVG sur cet instant exact"
                        className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Orbit className="h-3 w-3 text-amber-300" />
                        <span>Voir sur la roue</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleReadNotif(notif.id)}
                      title={isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      className={`rounded-full border p-1.5 transition-all cursor-pointer ${
                        isRead
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                          : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-amber-300/40 hover:text-white'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
                Aucun transit correspondant à ce filtre sur les 30 prochains jours.
              </div>
            )}
          </div>

          {filteredNotifications.length > 6 && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllNotifs((v) => !v)}
                className="rounded-full border border-amber-200/25 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-amber-200 hover:border-amber-300/50 hover:text-white transition-all cursor-pointer"
              >
                {showAllNotifs
                  ? 'Réduire la liste'
                  : `Afficher tous les transits (${filteredNotifications.length})`}
              </button>
            </div>
          )}
        </section>

        {/* Cosmic Insights Analysis Cards (Left Mystic Icon · Center Synthesis · Right Glowing Circular Progress Ring) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insightCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                className="cosmic-glass-card group flex items-center gap-4 rounded-3xl border border-amber-200/30 bg-[#151824]/70 backdrop-blur-xl p-5 shadow-2xl shadow-black/50 ring-1 ring-white/[0.04]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-mono-tabular text-[11px] font-medium text-amber-200/90 truncate">
                    {card.tag}
                  </div>
                  <h2 className="font-display text-sm font-semibold tracking-wider text-amber-100 uppercase">
                    {card.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-300 line-clamp-3">
                    {card.body}
                  </p>
                </div>

                <CircularCosmicProgress percentage={card.score} color={card.ringColor} />
              </article>
            );
          })}
        </section>

        {/* Quick Navigation Strip to Specialized Suite Modules */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={onOpenDataSheet}
            className="cosmic-glass-card text-left rounded-3xl border border-amber-200/25 bg-[#151824]/70 backdrop-blur-xl p-5 cursor-pointer"
          >
            <div className="font-display text-sm font-semibold text-amber-200 uppercase tracking-wider">
              Catalogue Céleste & DataSheet
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Explorez 700+ étoiles fixes (conjonctions & parans), 26 000+ astéroïdes, Parts arabes, Nœuds planétaires et Uraniens.
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenAuxiliary}
            className="cosmic-glass-card text-left rounded-3xl border border-amber-200/25 bg-[#151824]/70 backdrop-blur-xl p-5 cursor-pointer"
          >
            <div className="font-display text-sm font-semibold text-purple-200 uppercase tracking-wider">
              Synastrie, Progressions & Profils
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Éditez votre thème natal (communes françaises), comparez un partenaire, lancez un Arc Solaire ou un Thème Relocalisé.
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenConfig}
            className="cosmic-glass-card text-left rounded-3xl border border-amber-200/25 bg-[#151824]/70 backdrop-blur-xl p-5 cursor-pointer"
          >
            <div className="font-display text-sm font-semibold text-sky-200 uppercase tracking-wider">
              33 Maisons · 21 Aspects · Déclinaisons
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Activez les anneaux de Décans, Termes Égyptiens/Ptolémaïques, Dodécatémories et inspectez Parallèles & Contre-parallèles.
            </p>
          </button>
        </section>
      </div>
    </div>
  );
};
