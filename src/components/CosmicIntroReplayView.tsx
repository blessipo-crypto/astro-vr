import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Home,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  computeSplashFrame,
  COSMIC_SPLASH_DURATION_SEC,
  formatTimecode,
  phaseProgress,
  SPLASH_TIMELINE,
} from '../astro/splashTimeline';
import { CosmicSplashAudioEngine } from '../astro/splashAudio';

export interface CosmicIntroReplayViewProps {
  onEnterUniverse: () => void;
  appName?: string;
}

interface StarParticle {
  nx: number;
  ny: number;
  depth: number; // 0.35..1.0
  radius: number;
  vx: number;
  vy: number;
  phase: number;
  twinkleSpeed: number;
  isGold: boolean;
}

const SVG_CENTER = 300;
const OUTER_CIRCLE_R = 198;
const OUTER_RING_R = 218;
const INNER_RING_R = 136;

// Precompute 6 vertices of the sacred geometry hexagram (rotated so apex is top)
const HEX_VERTICES = Array.from({ length: 6 }, (_, i) => {
  const rad = ((i * 60 - 90) * Math.PI) / 180;
  return {
    x: SVG_CENTER + OUTER_CIRCLE_R * Math.cos(rad),
    y: SVG_CENTER + OUTER_CIRCLE_R * Math.sin(rad),
  };
});

const TRIANGLE_UP_PATH = `M ${HEX_VERTICES[0].x.toFixed(1)} ${HEX_VERTICES[0].y.toFixed(1)} L ${HEX_VERTICES[2].x.toFixed(1)} ${HEX_VERTICES[2].y.toFixed(1)} L ${HEX_VERTICES[4].x.toFixed(1)} ${HEX_VERTICES[4].y.toFixed(1)} Z`;
const TRIANGLE_DOWN_PATH = `M ${HEX_VERTICES[1].x.toFixed(1)} ${HEX_VERTICES[1].y.toFixed(1)} L ${HEX_VERTICES[3].x.toFixed(1)} ${HEX_VERTICES[3].y.toFixed(1)} L ${HEX_VERTICES[5].x.toFixed(1)} ${HEX_VERTICES[5].y.toFixed(1)} Z`;

// 12 zodiacal minimalist ticks
const ZODIAC_TICKS = Array.from({ length: 12 }, (_, i) => {
  const rad = ((i * 30 - 90) * Math.PI) / 180;
  const major = i % 3 === 0;
  const rIn = major ? OUTER_CIRCLE_R - 10 : OUTER_CIRCLE_R - 5;
  const rOut = OUTER_RING_R + (major ? 4 : 0);
  return {
    x1: SVG_CENTER + rIn * Math.cos(rad),
    y1: SVG_CENTER + rIn * Math.sin(rad),
    x2: SVG_CENTER + rOut * Math.cos(rad),
    y2: SVG_CENTER + rOut * Math.sin(rad),
    major,
  };
});

// Outer astral constellation nodes & segments
const CONSTELLATION_SEGMENTS: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
  // North-West crown arc
  { x1: 92, y1: 146, x2: 128, y2: 108 },
  { x1: 128, y1: 108, x2: 178, y2: 88 },
  { x1: 178, y1: 88, x2: 224, y2: 74 },
  // North-East celestial river
  { x1: 392, y1: 72, x2: 448, y2: 96 },
  { x1: 448, y1: 96, x2: 486, y2: 142 },
  { x1: 486, y1: 142, x2: 522, y2: 184 },
  // South-West mirror
  { x1: 76, y1: 392, x2: 108, y2: 454 },
  { x1: 108, y1: 454, x2: 168, y2: 498 },
  { x1: 168, y1: 498, x2: 228, y2: 522 },
  // South-East mirror
  { x1: 526, y1: 396, x2: 492, y2: 458 },
  { x1: 492, y1: 458, x2: 432, y2: 504 },
  { x1: 432, y1: 504, x2: 374, y2: 526 },
];

const CONSTELLATION_STARS = [
  { x: 92, y: 146 },
  { x: 128, y: 108 },
  { x: 178, y: 88 },
  { x: 224, y: 74 },
  { x: 392, y: 72 },
  { x: 448, y: 96 },
  { x: 486, y: 142 },
  { x: 522, y: 184 },
  { x: 76, y: 392 },
  { x: 108, y: 454 },
  { x: 168, y: 498 },
  { x: 228, y: 522 },
  { x: 526, y: 396 },
  { x: 492, y: 458 },
  { x: 432, y: 504 },
  { x: 374, y: 526 },
];

// Central mystic seal: Crescent Moon cradling a minimalist Mystic Eye
const SEAL_CRESCENT_PATH =
  'M 244.8 244.8 A 78 78 0 0 0 355.2 355.2 A 81.5 81.5 0 0 1 244.8 244.8 Z';
const SEAL_EYE_OUTLINE_PATH = 'M 248 300 Q 300 260 352 300 Q 300 340 248 300 Z';

function dashStyle(length: number, progress: number): React.CSSProperties {
  const clamped = Math.max(0, Math.min(1, progress));
  return {
    strokeDasharray: length,
    strokeDashoffset: length * (1 - clamped),
  };
}

export const CosmicIntroReplayView: React.FC<CosmicIntroReplayViewProps> = ({
  onEnterUniverse,
  appName = 'URANIE VR',
}) => {
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(!prefersReducedMotion);
  const [elapsedSec, setElapsedSec] = useState<number>(
    prefersReducedMotion ? COSMIC_SPLASH_DURATION_SEC - 2 : 0
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [audioBlockedNotice, setAudioBlockedNotice] = useState<boolean>(false);
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [exiting, setExiting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<CosmicSplashAudioEngine | null>(null);
  const timeRef = useRef<number>(prefersReducedMotion ? COSMIC_SPLASH_DURATION_SEC - 2 : 0);
  const isPlayingRef = useRef<boolean>(!prefersReducedMotion);
  const frameStateRef = useRef(computeSplashFrame(timeRef.current));

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Attempt automatic audio start on mount (respects browser gesture policy gracefully)
  useEffect(() => {
    const engine = new CosmicSplashAudioEngine();
    audioRef.current = engine;

    let cancelled = false;
    void engine.ensureStarted().then((ok) => {
      if (cancelled) return;
      if (ok) {
        setSoundEnabled(true);
        setAudioBlockedNotice(false);
        engine.syncToTime(timeRef.current, isPlayingRef.current);
      } else {
        setSoundEnabled(false);
        setAudioBlockedNotice(true);
      }
    });

    return () => {
      cancelled = true;
      engine.dispose();
      audioRef.current = null;
    };
  }, []);

  const handleToggleSound = useCallback(async () => {
    const engine = audioRef.current;
    if (!engine) return;
    if (!engine.isRunning()) {
      const ok = await engine.ensureStarted();
      if (ok) {
        engine.setMuted(false);
        setSoundEnabled(true);
        setAudioBlockedNotice(false);
        engine.syncToTime(timeRef.current, isPlayingRef.current);
      }
      return;
    }
    const nextMuted = !engine.isMuted();
    engine.setMuted(nextMuted);
    setSoundEnabled(!nextMuted);
    setAudioBlockedNotice(false);
    engine.syncToTime(timeRef.current, isPlayingRef.current);
  }, []);

  const handleSeek = useCallback(async (targetSec: number) => {
    const clamped = Math.max(0, Math.min(COSMIC_SPLASH_DURATION_SEC, targetSec));
    if (clamped < timeRef.current) {
      audioRef.current?.resetCues();
    }
    timeRef.current = clamped;
    frameStateRef.current = computeSplashFrame(clamped);
    setElapsedSec(clamped);

    if (audioRef.current && !audioRef.current.isRunning() && !audioRef.current.isMuted()) {
      const ok = await audioRef.current.ensureStarted();
      if (ok) {
        setSoundEnabled(true);
        setAudioBlockedNotice(false);
      }
    }
    audioRef.current?.syncToTime(clamped, isPlayingRef.current);
  }, []);

  const handleReplay = useCallback(async () => {
    audioRef.current?.resetCues();
    timeRef.current = 0;
    frameStateRef.current = computeSplashFrame(0);
    setElapsedSec(0);
    setIsPlaying(true);
    isPlayingRef.current = true;
    if (audioRef.current && !audioRef.current.isRunning()) {
      const ok = await audioRef.current.ensureStarted();
      if (ok) {
        audioRef.current.setMuted(false);
        setSoundEnabled(true);
        setAudioBlockedNotice(false);
      }
    }
    audioRef.current?.syncToTime(0, true);
  }, []);

  const handleExitImmediately = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    audioRef.current?.dispose();
    audioRef.current = null;
    onEnterUniverse();
  }, [onEnterUniverse]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExitImmediately();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExitImmediately]);

  const handleEnterClick = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    audioRef.current?.playEnterChime();
    window.setTimeout(() => {
      onEnterUniverse();
    }, 820);
  }, [exiting, onEnterUniverse]);

  // Master 60fps Canvas Loop + 30fps SVG/HUD Sync
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pre-render soft radial gold stardust sprite onto offscreen canvas for GPU efficiency
    const spriteSize = 36;
    const goldSprite = document.createElement('canvas');
    goldSprite.width = spriteSize;
    goldSprite.height = spriteSize;
    const gsCtx = goldSprite.getContext('2d');
    if (gsCtx) {
      const g = gsCtx.createRadialGradient(18, 18, 0, 18, 18, 18);
      g.addColorStop(0, 'rgba(255, 250, 230, 1)');
      g.addColorStop(0.24, 'rgba(253, 230, 138, 0.85)');
      g.addColorStop(0.55, 'rgba(212, 175, 55, 0.25)');
      g.addColorStop(1, 'rgba(212, 175, 55, 0)');
      gsCtx.fillStyle = g;
      gsCtx.fillRect(0, 0, spriteSize, spriteSize);
    }

    const whiteSprite = document.createElement('canvas');
    whiteSprite.width = spriteSize;
    whiteSprite.height = spriteSize;
    const wsCtx = whiteSprite.getContext('2d');
    if (wsCtx) {
      const g = wsCtx.createRadialGradient(18, 18, 0, 18, 18, 18);
      g.addColorStop(0, 'rgba(243, 239, 230, 0.95)');
      g.addColorStop(0.28, 'rgba(199, 210, 254, 0.5)');
      g.addColorStop(1, 'rgba(199, 210, 254, 0)');
      wsCtx.fillStyle = g;
      wsCtx.fillRect(0, 0, spriteSize, spriteSize);
    }

    // Generate 125 balanced deep-space & golden stardust particles
    const particles: StarParticle[] = Array.from({ length: 125 }, (_, idx) => {
      const isGold = idx % 3 !== 0;
      const depth = 0.35 + ((idx * 37) % 65) / 100;
      return {
        nx: ((idx * 7919) % 1000) / 1000,
        ny: ((idx * 6271) % 1000) / 1000,
        depth,
        radius: isGold ? 1.1 + (idx % 4) * 0.55 : 0.75 + (idx % 3) * 0.4,
        vx: (Math.sin(idx * 1.7) * 0.0045 + 0.0012) * depth,
        vy: -(0.003 + (idx % 5) * 0.0014) * depth,
        phase: idx * 0.85,
        twinkleSpeed: 0.65 + (idx % 7) * 0.18,
        isGold,
      };
    });

    // Dissipative wave micro-particles (emitted in Movement III)
    const waveDots = Array.from({ length: 48 }, (_, i) => ({
      angle: (i / 48) * Math.PI * 2 + (i % 2) * 0.08,
      speedJitter: 0.86 + ((i * 19) % 28) / 100,
      size: 1.4 + (i % 3) * 0.6,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTs = performance.now();
    let lastReactSyncTs = 0;

    const tick = (nowTs: number) => {
      const dt = Math.min((nowTs - lastTs) / 1000, 0.05);
      lastTs = nowTs;

      if (isPlayingRef.current && timeRef.current < COSMIC_SPLASH_DURATION_SEC) {
        const nextT = Math.min(COSMIC_SPLASH_DURATION_SEC, timeRef.current + dt);
        timeRef.current = nextT;
        if (nextT >= COSMIC_SPLASH_DURATION_SEC) {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      }

      const frame = computeSplashFrame(timeRef.current);
      frameStateRef.current = frame;

      // Sync audio cues continuously
      audioRef.current?.syncToTime(timeRef.current, isPlayingRef.current);

      // Sync React SVG/HUD at ~30fps
      if (nowTs - lastReactSyncTs >= 32 || timeRef.current >= COSMIC_SPLASH_DURATION_SEC) {
        lastReactSyncTs = nowTs;
        setElapsedSec(timeRef.current);
      }

      // Draw Canvas 2D Cosmos
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const minDim = Math.min(w, h);

      ctx.fillStyle = '#05060B';
      ctx.fillRect(0, 0, w, h);

      // Slow Ken Burns Nebula transformation
      ctx.save();
      const kb = frame.kenBurnsScale;
      const driftX = Math.sin(frame.tSec * 0.055) * 16;
      const driftY = Math.cos(frame.tSec * 0.045) * 12;
      ctx.translate(cx + driftX, cy + driftY);
      ctx.scale(kb, kb);
      ctx.translate(-cx, -cy);

      if (frame.nebulaOpacity > 0.005) {
        // Primary deep midnight-velvet nebula core
        const n1 = ctx.createRadialGradient(
          cx * 0.92,
          cy * 0.95,
          minDim * 0.04,
          cx,
          cy,
          Math.max(w, h) * 0.62
        );
        n1.addColorStop(0, `rgba(28, 36, 78, ${0.58 * frame.nebulaOpacity})`);
        n1.addColorStop(0.38, `rgba(11, 16, 34, ${0.72 * frame.nebulaOpacity})`);
        n1.addColorStop(1, 'rgba(5, 6, 11, 0)');
        ctx.fillStyle = n1;
        ctx.fillRect(-100, -100, w + 200, h + 200);

        // Warm subtle amber cosmic dust cloud offset
        const n2 = ctx.createRadialGradient(
          cx * 1.12,
          cy * 0.86,
          0,
          cx * 1.08,
          cy * 0.9,
          minDim * 0.56
        );
        n2.addColorStop(0, `rgba(212, 175, 55, ${0.14 * frame.nebulaOpacity})`);
        n2.addColorStop(0.45, `rgba(146, 64, 14, ${0.09 * frame.nebulaOpacity})`);
        n2.addColorStop(1, 'rgba(5, 6, 11, 0)');
        ctx.fillStyle = n2;
        ctx.fillRect(-100, -100, w + 200, h + 200);

        // Central soft pearl-gold aura during Identity Core (Movement III)
        if (frame.sealAuraOpacity > 0.01) {
          const auraR = minDim * (0.28 + 0.04 * frame.breathFactor);
          const n3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
          n3.addColorStop(0, `rgba(253, 230, 138, ${0.22 * frame.sealAuraOpacity})`);
          n3.addColorStop(0.45, `rgba(245, 158, 11, ${0.1 * frame.sealAuraOpacity})`);
          n3.addColorStop(1, 'rgba(5, 6, 11, 0)');
          ctx.fillStyle = n3;
          ctx.beginPath();
          ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Stars & Drifting Golden Stardust
      const stepFactor = isPlayingRef.current ? dt * frame.particleSpeedMult : dt * 0.12;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.nx = (p.nx + p.vx * stepFactor + 1) % 1;
        p.ny = (p.ny + p.vy * stepFactor + 1) % 1;

        const px = p.nx * w;
        const py = p.ny * h;
        const twinkle =
          0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame.tSec * p.twinkleSpeed + p.phase));
        const alpha = frame.starfieldOpacity * twinkle * (p.isGold ? 0.92 : 0.72);
        if (alpha <= 0.02) continue;

        const drawSize = p.radius * 7.5;
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          p.isGold ? goldSprite : whiteSprite,
          px - drawSize / 2,
          py - drawSize / 2,
          drawSize,
          drawSize
        );
      }
      ctx.globalAlpha = 1;

      // Dissipative golden particle waves expanding outward in Movement III
      const renderWaveRing = (prog: number) => {
        if (prog <= 0 || prog >= 1) return;
        const easeP = 1 - Math.pow(1 - prog, 2.5);
        const radius = minDim * (0.12 + easeP * 0.54);
        const waveAlpha = Math.sin(prog * Math.PI) * 0.72;
        if (waveAlpha <= 0.01) return;

        for (let i = 0; i < waveDots.length; i++) {
          const d = waveDots[i];
          const r = radius * d.speedJitter;
          const dx = cx + Math.cos(d.angle) * r;
          const dy = cy + Math.sin(d.angle) * r;
          const s = d.size * 7;
          ctx.globalAlpha = waveAlpha;
          ctx.drawImage(goldSprite, dx - s / 2, dy - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
      };

      renderWaveRing(frame.wave1Progress);
      renderWaveRing(frame.wave2Progress);

      ctx.restore();

      // Subtle atmospheric dark vignette (strengthens gracefully in Movement IV)
      const vigAlpha = 0.45 + frame.dimOverlayOpacity;
      const vig = ctx.createRadialGradient(
        cx,
        cy,
        minDim * 0.25,
        cx,
        cy,
        Math.max(w, h) * 0.72
      );
      vig.addColorStop(0, 'rgba(5, 6, 11, 0)');
      vig.addColorStop(1, `rgba(5, 6, 11, ${Math.min(0.92, vigAlpha)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const frame = useMemo(() => computeSplashFrame(elapsedSec), [elapsedSec]);
  const outerCircleLen = 2 * Math.PI * OUTER_CIRCLE_R;
  const outerRingLen = 2 * Math.PI * OUTER_RING_R;
  const innerRingLen = 2 * Math.PI * INNER_RING_R;
  const triangleLen = OUTER_CIRCLE_R * Math.sqrt(3) * 3;
  const sealCrescentLen = 420;
  const sealEyeLen = 260;
  const irisLen = 2 * Math.PI * 19;

  // Position of the champagne spark gliding along the outer circle tip during Movement I
  const tipAngle = -Math.PI / 2 + frame.outerCircleDraw * Math.PI * 2;
  const tipX = SVG_CENTER + OUTER_CIRCLE_R * Math.cos(tipAngle);
  const tipY = SVG_CENTER + OUTER_CIRCLE_R * Math.sin(tipAngle);

  // Shimmer wave distance sweeping outward through sacred geometry vertices
  const breathOpacity = 0.68 + frame.breathFactor * 0.32;

  return (
    <div
      className={`no-print fixed inset-0 ${
        cinemaMode ? 'z-40' : 'z-20'
      } overflow-hidden bg-[#05060B] text-[#F3EFE6] select-none transition-all duration-700 ${
        exiting ? 'opacity-0 scale-[1.06]' : 'opacity-100 scale-100'
      }`}
      onClick={() => {
        if (cinemaMode) setCinemaMode(false);
      }}
    >
      {/* Layer 0: Living Cosmic Canvas 2D */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" />

      {/* Top Subtle Action Strip (audio unlock / cinema toggle / skip) */}
      {!cinemaMode && (
        <div
          className={`fixed top-16 sm:top-[70px] left-0 right-0 z-30 mx-auto flex max-w-5xl items-center justify-between px-4 transition-opacity duration-700 ${
            frame.tSec >= 1.5 ? 'opacity-100' : 'opacity-70'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleToggleSound();
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium backdrop-blur-xl transition-all cursor-pointer ${
                audioBlockedNotice && !soundEnabled
                  ? 'border-amber-300/60 bg-amber-400/20 text-amber-100 animate-pulse'
                  : soundEnabled
                    ? 'border-amber-200/30 bg-[#0b1022]/75 text-amber-100 hover:border-amber-300/60'
                    : 'border-white/15 bg-[#0b1022]/70 text-slate-300 hover:text-white'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-amber-300" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>
                {audioBlockedNotice && !soundEnabled
                  ? 'Activer le son céleste'
                  : soundEnabled
                    ? 'Audio 432 Hz actif'
                    : 'Son coupé'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCinemaMode(true);
              }}
              title="Masquer l’interface pour une immersion pure"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0b1022]/70 backdrop-blur-xl px-3 py-1.5 text-[11px] text-slate-300 hover:border-amber-300/40 hover:text-amber-100 transition-all cursor-pointer"
            >
              <Maximize2 className="h-3 w-3 text-amber-300/80" />
              <span>Mode Cinéma</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleExitImmediately();
            }}
            title="Quitter l’animation et revenir immédiatement à l’accueil"
            className="flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-[#0b1022]/80 backdrop-blur-xl px-3.5 py-1.5 text-[11px] font-medium tracking-wider uppercase text-amber-100 hover:border-amber-300/75 hover:bg-amber-400/15 hover:text-white transition-all cursor-pointer"
          >
            <Home className="h-3.5 w-3.5 text-amber-300" />
            <span>Quitter l’animation</span>
          </button>
        </div>
      )}

      {cinemaMode && (
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCinemaMode(false);
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0b1022]/65 backdrop-blur-xl px-3 py-1.5 text-[11px] text-slate-300/85 hover:text-amber-100 transition-all cursor-pointer"
          >
            <Minimize2 className="h-3 w-3" />
            <span>Afficher contrôles</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleExitImmediately();
            }}
            title="Quitter l’animation et revenir à l’accueil"
            className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-[#0b1022]/75 backdrop-blur-xl px-3 py-1.5 text-[11px] font-medium text-amber-100 hover:border-amber-300/75 hover:bg-amber-400/15 transition-all cursor-pointer"
          >
            <X className="h-3 w-3 text-amber-300" />
            <span>Quitter</span>
          </button>
        </div>
      )}

      {/* Layer 1 & 2: Sacred Geometry SVG Centerpiece + Identity + CTA */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 pb-24 pt-12">
        <div
          className="relative flex items-center justify-center w-[min(78vw,390px)] sm:w-[min(58vw,450px)] aspect-square pointer-events-none"
          style={{ transform: `scale(${0.96 + (frame.kenBurnsScale - 1) * 0.25})` }}
        >
          <svg
            viewBox="0 0 600 600"
            className="h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <filter id="splashGoldGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="splashSealAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.34" />
                <stop offset="48%" stopColor="#D4AF37" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#05060B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Constellation Filaments (appear late Movement II, stay soft) */}
            {frame.constellationDraw > 0.01 && (
              <g
                opacity={
                  frame.tSec < 50
                    ? 0.72
                    : frame.tSec < 80
                      ? 0.42
                      : 0.28
                }
              >
                {CONSTELLATION_SEGMENTS.map((seg, i) => {
                  const segProg = phaseProgress(
                    frame.constellationDraw,
                    (i % 4) * 0.18,
                    (i % 4) * 0.18 + 0.42
                  );
                  const segLen = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
                  return (
                    <line
                      key={`cseg-${i}`}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke="#D4AF37"
                      strokeWidth={0.85}
                      strokeOpacity={0.55}
                      style={dashStyle(segLen, segProg)}
                    />
                  );
                })}
                {CONSTELLATION_STARS.map((st, i) => {
                  const starProg = phaseProgress(
                    frame.constellationDraw,
                    (i % 4) * 0.18,
                    (i % 4) * 0.18 + 0.25
                  );
                  return (
                    <circle
                      key={`cstar-${i}`}
                      cx={st.x}
                      cy={st.y}
                      r={1.4 + starProg * 1.1}
                      fill="#FDE68A"
                      opacity={starProg * (0.65 + 0.35 * Math.sin(frame.tSec * 1.6 + i))}
                      filter="url(#splashGoldGlow)"
                    />
                  );
                })}
              </g>
            )}

            {/* Sacred Geometry & Filigree Zodiac Rings (Movements I -> IV) */}
            <g
              opacity={frame.geometryOpacity * breathOpacity}
              style={{
                transformOrigin: '300px 300px',
                transform: `rotate(${(frame.tSec - 20) * 0.45}deg)`,
              }}
            >
              {/* Primary Celestial Circle (0:08 -> 0:20) */}
              {frame.outerCircleDraw > 0.005 && (
                <circle
                  cx={SVG_CENTER}
                  cy={SVG_CENTER}
                  r={OUTER_CIRCLE_R}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth={1.15}
                  transform="rotate(-90 300 300)"
                  style={dashStyle(outerCircleLen, frame.outerCircleDraw)}
                  filter="url(#splashGoldGlow)"
                />
              )}

              {/* Moving champagne spark at circle drawing tip */}
              {frame.outerCircleDraw > 0.02 && frame.outerCircleDraw < 0.99 && (
                <circle
                  cx={tipX}
                  cy={tipY}
                  r={3.2}
                  fill="#FDE68A"
                  filter="url(#splashGoldGlow)"
                />
              )}

              {/* Secondary Outer Filigree Ring & Inner Orbit Ring */}
              {frame.outerRingDraw > 0.005 && (
                <>
                  <circle
                    cx={SVG_CENTER}
                    cy={SVG_CENTER}
                    r={OUTER_RING_R}
                    fill="none"
                    stroke="#FDE68A"
                    strokeOpacity={0.48}
                    strokeWidth={0.75}
                    transform="rotate(90 300 300)"
                    style={dashStyle(outerRingLen, frame.outerRingDraw)}
                  />
                  <circle
                    cx={SVG_CENTER}
                    cy={SVG_CENTER}
                    r={INNER_RING_R}
                    fill="none"
                    stroke="#D4AF37"
                    strokeOpacity={0.55}
                    strokeWidth={0.8}
                    transform="rotate(-90 300 300)"
                    style={dashStyle(innerRingLen, frame.outerRingDraw)}
                  />
                </>
              )}

              {/* 12 Minimalist Zodiac Divisions */}
              {frame.zodiacTicksDraw > 0.01 &&
                ZODIAC_TICKS.map((tk, idx) => {
                  const localP = phaseProgress(
                    frame.zodiacTicksDraw,
                    idx * 0.05,
                    idx * 0.05 + 0.45
                  );
                  return (
                    <line
                      key={`ztick-${idx}`}
                      x1={tk.x1}
                      y1={tk.y1}
                      x2={tk.x2}
                      y2={tk.y2}
                      stroke={tk.major ? '#FDE68A' : '#D4AF37'}
                      strokeWidth={tk.major ? 1.1 : 0.7}
                      strokeOpacity={localP * (tk.major ? 0.75 : 0.45)}
                    />
                  );
                })}

              {/* Sacred Geometry: Hexagram of Aspects + Nodal Shimmer */}
              {frame.sacredGeoDraw > 0.005 && (
                <g>
                  <path
                    d={TRIANGLE_UP_PATH}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth={0.95}
                    strokeOpacity={0.72}
                    style={dashStyle(triangleLen, phaseProgress(frame.sacredGeoDraw, 0, 0.78))}
                  />
                  <path
                    d={TRIANGLE_DOWN_PATH}
                    fill="none"
                    stroke="#FDE68A"
                    strokeWidth={0.9}
                    strokeOpacity={0.62}
                    style={dashStyle(triangleLen, phaseProgress(frame.sacredGeoDraw, 0.22, 1))}
                  />

                  {/* Subtle Shimmer Pulses on Intersections */}
                  {HEX_VERTICES.map((v, idx) => {
                    const waveDist = Math.abs(
                      ((frame.shimmerPhase * 2.2 - idx / 6) % 1 + 1) % 1 - 0.5
                    );
                    const nodeShimmer =
                      frame.tSec >= 28 ? Math.max(0, 1 - waveDist * 4.5) : 0;
                    return (
                      <circle
                        key={`hv-${idx}`}
                        cx={v.x}
                        cy={v.y}
                        r={1.8 + nodeShimmer * 3.2}
                        fill="#FDE68A"
                        opacity={0.45 + nodeShimmer * 0.55}
                        filter="url(#splashGoldGlow)"
                      />
                    );
                  })}
                </g>
              )}
            </g>

            {/* Movement III & IV: Central Mystic Seal (Crescent Moon + Celestial Eye) */}
            {frame.sealDraw > 0.005 && (
              <g>
                {frame.sealAuraOpacity > 0.02 && (
                  <circle
                    cx={SVG_CENTER}
                    cy={SVG_CENTER}
                    r={125 + frame.breathFactor * 10}
                    fill="url(#splashSealAura)"
                    opacity={frame.sealAuraOpacity}
                  />
                )}

                {/* Crescent Moon Filigree */}
                <path
                  d={SEAL_CRESCENT_PATH}
                  fill="rgba(212, 175, 55, 0.06)"
                  fillOpacity={phaseProgress(frame.sealDraw, 0.65, 1)}
                  stroke="#FDE68A"
                  strokeWidth={1.45}
                  strokeLinejoin="round"
                  style={dashStyle(
                    sealCrescentLen,
                    phaseProgress(frame.sealDraw, 0, 0.68)
                  )}
                  filter="url(#splashGoldGlow)"
                />

                {/* Mystic Eye Outline */}
                <path
                  d={SEAL_EYE_OUTLINE_PATH}
                  fill="none"
                  stroke="#F3EFE6"
                  strokeWidth={1.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={dashStyle(
                    sealEyeLen,
                    phaseProgress(frame.sealDraw, 0.3, 0.88)
                  )}
                  filter="url(#splashGoldGlow)"
                />

                {/* Iris Ring & Star Pupil */}
                <circle
                  cx={SVG_CENTER}
                  cy={SVG_CENTER}
                  r={19}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth={1.2}
                  style={dashStyle(irisLen, phaseProgress(frame.sealDraw, 0.52, 0.96))}
                />
                <circle
                  cx={SVG_CENTER}
                  cy={SVG_CENTER}
                  r={4.2}
                  fill="#FDE68A"
                  opacity={phaseProgress(frame.sealDraw, 0.72, 1)}
                  filter="url(#splashGoldGlow)"
                />

                {/* Delicate North/South Celestial Rays */}
                <line
                  x1={300}
                  y1={232}
                  x2={300}
                  y2={248}
                  stroke="#FDE68A"
                  strokeWidth={1}
                  opacity={phaseProgress(frame.sealDraw, 0.78, 1) * 0.75}
                />
                <line
                  x1={300}
                  y1={352}
                  x2={300}
                  y2={368}
                  stroke="#FDE68A"
                  strokeWidth={1}
                  opacity={phaseProgress(frame.sealDraw, 0.78, 1) * 0.75}
                />
              </g>
            )}
          </svg>
        </div>

        {/* Brand Identity & Movement IV Call-to-Action */}
        <div className="mt-2 sm:mt-4 flex flex-col items-center text-center min-h-[140px]">
          <div
            style={{
              opacity: frame.titleReveal,
              transform: `translateY(${(1 - frame.titleReveal) * 10}px)`,
            }}
          >
            <h1
              className="font-display text-2xl sm:text-4xl font-semibold uppercase bg-gradient-to-b from-[#F3EFE6] via-[#FDE68A] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(253,230,138,0.28)]"
              style={{ letterSpacing: `${frame.titleLetterSpacingEm}em` }}
            >
              {appName}
            </h1>
            <p className="mt-2 font-serif italic text-sm sm:text-base tracking-[0.22em] text-amber-100/75">
              Observatoire Astral · Géométrie & Lumière
            </p>
          </div>

          <div
            className="mt-6"
            style={{
              opacity: frame.ctaReveal,
              transform: `translateY(${(1 - frame.ctaReveal) * 8}px)`,
              pointerEvents: frame.ctaReveal > 0.25 ? 'auto' : 'none',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEnterClick();
              }}
              className="group relative inline-flex items-center gap-2.5 rounded-full border border-[#FDE68A]/45 bg-[#0B1022]/75 backdrop-blur-xl px-7 py-3 text-xs sm:text-sm font-medium tracking-[0.22em] uppercase text-[#F3EFE6] shadow-[0_0_28px_rgba(212,175,55,0.2)] hover:border-[#FDE68A]/85 hover:bg-amber-400/15 hover:shadow-[0_0_38px_rgba(253,230,138,0.38)] transition-all duration-500 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FDE68A] transition-transform duration-500 group-hover:rotate-45" />
              <span>Entrer dans votre univers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Director's Playback & Movement Scrubber HUD (above FloatingPillNav) */}
      {!cinemaMode && (
        <div
          className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 w-[min(94vw,660px)] rounded-2xl border border-amber-200/20 bg-[#0B1022]/82 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.75)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (elapsedSec >= COSMIC_SPLASH_DURATION_SEC - 0.1) {
                    void handleReplay();
                  } else {
                    const nextPlay = !isPlaying;
                    setIsPlaying(nextPlay);
                    isPlayingRef.current = nextPlay;
                    audioRef.current?.syncToTime(timeRef.current, nextPlay);
                  }
                }}
                aria-label={isPlaying ? 'Mettre en pause' : 'Lire la séquence'}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25 transition-all cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => void handleReplay()}
                title="Revoir depuis le début (0:00)"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-slate-200 hover:border-amber-300/40 hover:text-amber-100 transition-all cursor-pointer shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <div className="min-w-0 truncate">
                <span className="font-display text-amber-200 font-semibold">
                  {frame.movement.roman}. {frame.movement.title}
                </span>
                <span className="hidden sm:inline text-slate-400">
                  {' '}
                  — {frame.movement.subtitle}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono-tabular text-[11px] text-amber-200/90">
                {formatTimecode(elapsedSec)} / {formatTimecode(COSMIC_SPLASH_DURATION_SEC)}
              </span>
              <button
                type="button"
                onClick={handleExitImmediately}
                title="Quitter l’animation et revenir immédiatement à l’accueil (Échap)"
                className="flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-100 hover:border-amber-300/70 hover:bg-amber-400/20 transition-all cursor-pointer"
              >
                <X className="h-3 w-3 text-amber-300" />
                <span>Accueil</span>
              </button>
            </div>
          </div>

          {/* Interactive 4-Movement Timeline Scrubber */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {SPLASH_TIMELINE.map((m) => {
              const span = m.endSec - m.startSec;
              const fill = Math.max(0, Math.min(1, (elapsedSec - m.startSec) / span));
              const isCurrent = frame.movement.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void handleSeek(m.startSec)}
                  className={`group text-left rounded-lg border px-2 py-1 transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-amber-300/45 bg-amber-400/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-amber-200/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={isCurrent ? 'text-amber-100 font-semibold' : 'text-slate-300'}>
                      {m.roman}. {m.shortTitle}
                    </span>
                    <span className="font-mono-tabular text-[9px] text-slate-400">
                      {formatTimecode(m.startSec)}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FDE68A] transition-[width] duration-75"
                      style={{ width: `${Math.round(fill * 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quasi-imperceptible 1px stellar progress line at very bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 h-[1.5px] bg-white/5"
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500/40 via-[#FDE68A]/70 to-amber-200/40"
          style={{ width: `${(elapsedSec / COSMIC_SPLASH_DURATION_SEC) * 100}%` }}
        />
      </div>
    </div>
  );
};
