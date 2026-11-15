import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Glasses, Info, ScanEye, Share2 } from 'lucide-react';
import {
  analyzeComparison,
  analyzeSolarReturn,
  AstroChart,
  calculateAstroChart,
  calculateComparisonAspects,
  calculateCompositeChart,
  calculateLunarReturnDate,
  calculateSecondaryProgressionDate,
  calculateSolarReturnDate,
  ChartMode,
  CITY_PRESETS,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  HouseCusp,
  NatalProfile,
  PlanetId,
  PlanetPosition,
  SolarReturnAnalysis,
} from './astro/astroEngine';
import { transposeLongitudeToChinese, ZodiacTradition } from './astro/chineseAstrology';
import { buildShareThemeUrl, readSharedThemeFromUrl } from './astro/shareTheme';
import { ComparativePairKind, ControlDock } from './components/ControlDock';
import { InspectorPanel } from './components/InspectorPanel';
import { PrintableChartReport } from './components/PrintableChartReport';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AboutCreatorModal } from './components/AboutCreatorModal';
import { AscendantCalculatorModal } from './components/AscendantCalculatorModal';
import { QuestGuideModal } from './components/QuestGuideModal';
import { SharePrintModal } from './components/SharePrintModal';
import {
  AspectFilter,
  AstrologyScene,
  CameraPreset,
  DEFAULT_SKY_ANIMATIONS,
  SceneDisplayFocus,
  SkyAnimationsConfig,
  XRSessionModeKind,
} from './vr/AstrologyScene';
import { celestialAudio } from './vr/audio';
import type { StarfieldBackdropStyle, ZodiacSignStyle, ZodiacWheelStyle } from './vr/textures';

const REAL_TIME_DAYS_PER_SEC = 1 / 86400;

const STORAGE_KEY = 'uranie_vr_natal_profiles_v1';
const SKY_ANIMS_STORAGE_KEY = 'uranie_vr_sky_anims_v1';

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const LEGACY_EXAMPLE_IDS = new Set(['default-marie', 'default-solstice', 'default-hiver']);

function createDefaultUserProfile(): NatalProfile {
  return {
    id: 'mon-theme',
    name: '',
    birthDateIso: toLocalDatetimeInput(new Date()),
    cityId: 'paris',
    houseSystem: 'placidus',
  };
}

function parseProfileDate(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function resolveProfileLocation(profile: NatalProfile): {
  cityName: string;
  latitude: number;
  longitude: number;
} {
  if (
    profile.customCityName &&
    typeof profile.customLat === 'number' &&
    typeof profile.customLon === 'number'
  ) {
    return {
      cityName: profile.customCityName,
      latitude: profile.customLat,
      longitude: profile.customLon,
    };
  }
  const city = CITY_PRESETS.find((c) => c.id === profile.cityId) ?? CITY_PRESETS[0];
  return {
    cityName: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<AstrologyScene | null>(null);
  const initialShared = useMemo(() => readSharedThemeFromUrl(), []);

  const [profiles, setProfiles] = useState<NatalProfile[]>(() => {
    let base: NatalProfile[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NatalProfile[];
        if (Array.isArray(parsed)) {
          base = parsed.filter(
            (p) => !(LEGACY_EXAMPLE_IDS.has(p.id) && p.name.startsWith('Thème Exemple'))
          );
        }
      }
    } catch {
      // Ignore storage errors
    }
    if (initialShared?.profile) {
      const exists = base.some((p) => p.id === initialShared.profile.id);
      base = exists
        ? base.map((p) => (p.id === initialShared.profile.id ? initialShared.profile : p))
        : [initialShared.profile, ...base];
    }
    if (initialShared?.partner) {
      const pExists = base.some((p) => p.id === initialShared.partner!.id);
      if (!pExists) base = [...base, initialShared.partner];
    }
    if (base.length === 0) {
      base = [createDefaultUserProfile()];
    }
    return base;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(
    () => initialShared?.profile.id ?? profiles[0]?.id ?? 'mon-theme'
  );
  const [draftProfile, setDraftProfile] = useState<NatalProfile>(
    () => initialShared?.profile ?? profiles[0] ?? createDefaultUserProfile()
  );
  const [partnerProfileId, setPartnerProfileId] = useState<string>(
    () => initialShared?.partner?.id ?? profiles[1]?.id ?? profiles[0]?.id ?? 'mon-theme'
  );

  const [mode, setMode] = useState<ChartMode>(() => initialShared?.mode ?? 'transits');
  const [tradition, setTradition] = useState<ZodiacTradition>(
    () => initialShared?.tradition ?? 'western'
  );
  const [wheelStyle, setWheelStyle] = useState<ZodiacWheelStyle>(
    () => initialShared?.wheelStyle ?? 'astrolabe'
  );
  const [signStyle, setSignStyle] = useState<ZodiacSignStyle>(
    () => initialShared?.signStyle ?? 'figurative'
  );
  const [starfieldStyle, setStarfieldStyle] = useState<StarfieldBackdropStyle>(
    () => initialShared?.starfieldStyle ?? 'milkyway'
  );
  const [transitDate, setTransitDate] = useState<Date>(() => {
    if (initialShared?.transitIso) {
      const d = new Date(initialShared.transitIso);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [solarReturnYear, setSolarReturnYear] = useState<number>(
    () => initialShared?.srYear ?? new Date().getFullYear()
  );
  const [solarReturnCityId, setSolarReturnCityId] = useState<string>(
    () => initialShared?.srCityId ?? 'paris'
  );
  const [solarReturnCustomLoc, setSolarReturnCustomLoc] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(() => initialShared?.srCustomLoc ?? null);
  const [comparativePair, setComparativePair] = useState<ComparativePairKind>(
    () => initialShared?.compPair ?? 'sr-vs-sr'
  );
  const [comparativeYearA, setComparativeYearA] = useState<number>(
    () => initialShared?.compYearA ?? new Date().getFullYear()
  );
  const [comparativeYearB, setComparativeYearB] = useState<number>(
    () => initialShared?.compYearB ?? new Date().getFullYear() + 1
  );

  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [selectedPlanetLayer, setSelectedPlanetLayer] = useState<'base' | 'outer'>('base');
  const [selectedHouse, setSelectedHouse] = useState<HouseCusp | null>(null);
  const [showFullSummary, setShowFullSummary] = useState<boolean>(() => Boolean(initialShared));

  const [aspectFilter, setAspectFilter] = useState<AspectFilter>('all');
  const [displayFocus, setDisplayFocus] = useState<SceneDisplayFocus>('all');
  const [showHouses, setShowHouses] = useState<boolean>(true);
  const [showConstellations, setShowConstellations] = useState<boolean>(true);
  const [showVRPlaque, setShowVRPlaque] = useState<boolean>(true);
  const [timeSpeedDaysPerSec, setTimeSpeedDaysPerSec] = useState<number>(REAL_TIME_DAYS_PER_SEC);
  const [srAnimSpeed, setSrAnimSpeed] = useState<number>(0); // 0=pause, 1=1 an/2s, 2=1 an/1s
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [webXRSupported, setWebXRSupported] = useState<boolean>(false);
  const [mrSupported, setMrSupported] = useState<boolean>(false);
  const [inVR, setInVR] = useState<boolean>(false);
  const [xrMode, setXrMode] = useState<XRSessionModeKind>('none');
  const [desktopMR, setDesktopMR] = useState<boolean>(false);
  const [mrScale, setMrScale] = useState<number>(0.14);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [questModalOpen, setQuestModalOpen] = useState<boolean>(false);
  const [ascendantModalOpen, setAscendantModalOpen] = useState<boolean>(false);
  const [skyAnimations, setSkyAnimations] = useState<SkyAnimationsConfig>(() => {
    try {
      const raw = localStorage.getItem(SKY_ANIMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SkyAnimationsConfig>;
        return {
          shootingStars: parsed.shootingStars ?? true,
          nebulae: parsed.nebulae ?? true,
          aurora: parsed.aurora ?? true,
        };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_SKY_ANIMATIONS;
  });
  const [aboutOpen, setAboutOpen] = useState<boolean>(() => {
    if (initialShared) return false;
    try {
      const always = localStorage.getItem('uranie_vr_intro_always_v1') === '1';
      if (always) return true;
      return localStorage.getItem('uranie_vr_intro_seen_v1') !== '1';
    } catch {
      return true;
    }
  });
  const [sharePrintOpen, setSharePrintOpen] = useState<boolean>(false);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Persist saved natal profiles
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore storage quota errors
    }
  }, [profiles]);

  const birthDate = useMemo(() => parseProfileDate(draftProfile.birthDateIso), [draftProfile.birthDateIso]);
  const birthLocation = useMemo(() => resolveProfileLocation(draftProfile), [draftProfile]);

  const natalChart: AstroChart = useMemo(
    () =>
      calculateAstroChart(
        birthDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem
      ),
    [birthDate, birthLocation.latitude, birthLocation.longitude, birthLocation.cityName, draftProfile.houseSystem]
  );

  const partnerProfile = useMemo(
    () => profiles.find((p) => p.id === partnerProfileId) ?? profiles[0],
    [profiles, partnerProfileId]
  );

  const partnerChart: AstroChart = useMemo(() => {
    const pDate = parseProfileDate(partnerProfile.birthDateIso);
    const pLoc = resolveProfileLocation(partnerProfile);
    return calculateAstroChart(
      pDate,
      pLoc.latitude,
      pLoc.longitude,
      pLoc.cityName,
      partnerProfile.houseSystem
    );
  }, [partnerProfile]);

  const solarReturnExactDate: Date | null = useMemo(() => {
    const natalSun = natalChart.planets.find((p) => p.id === 'sun');
    if (!natalSun) return null;
    return calculateSolarReturnDate(natalSun.longitude, birthDate, solarReturnYear);
  }, [natalChart, birthDate, solarReturnYear]);

  const lunarReturnExactDate: Date | null = useMemo(() => {
    const natalMoon = natalChart.planets.find((p) => p.id === 'moon');
    if (!natalMoon) return null;
    return calculateLunarReturnDate(natalMoon.longitude, transitDate);
  }, [natalChart, transitDate]);

  // Compute baseChart, outerChart & comparisonAspects for current mode
  const { baseChart, outerChart, comparisonAspects } = useMemo<{
    baseChart: AstroChart;
    outerChart: AstroChart | null;
    comparisonAspects: ComparisonAspectInfo[];
  }>(() => {
    if (mode === 'natal') {
      return { baseChart: natalChart, outerChart: null, comparisonAspects: [] };
    }

    if (mode === 'live') {
      const liveChart = calculateAstroChart(
        transitDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem
      );
      return { baseChart: liveChart, outerChart: null, comparisonAspects: [] };
    }

    if (mode === 'composite') {
      const comp = calculateCompositeChart(
        natalChart,
        partnerChart,
        `${draftProfile.name.trim() || 'Thème A'} + ${partnerProfile.name.trim() || 'Thème B'}`
      );
      return { baseChart: comp, outerChart: null, comparisonAspects: [] };
    }

    if (mode === 'transits') {
      const trChart = calculateAstroChart(
        transitDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem
      );
      return {
        baseChart: natalChart,
        outerChart: trChart,
        comparisonAspects: calculateComparisonAspects(trChart, natalChart, 'Transit'),
      };
    }

    if (mode === 'solarReturn' && solarReturnExactDate) {
      const preset = CITY_PRESETS.find((c) => c.id === solarReturnCityId) ?? CITY_PRESETS[0];
      const srLoc = solarReturnCustomLoc ?? {
        name: `${preset.name} (${preset.country})`,
        latitude: preset.latitude,
        longitude: preset.longitude,
      };
      const srChart = calculateAstroChart(
        solarReturnExactDate,
        srLoc.latitude,
        srLoc.longitude,
        srLoc.name,
        draftProfile.houseSystem
      );
      return {
        baseChart: natalChart,
        outerChart: srChart,
        comparisonAspects: calculateComparisonAspects(srChart, natalChart, 'Rév. Solaire'),
      };
    }

    if (mode === 'lunarReturn' && lunarReturnExactDate) {
      const lrChart = calculateAstroChart(
        lunarReturnExactDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem
      );
      return {
        baseChart: natalChart,
        outerChart: lrChart,
        comparisonAspects: calculateComparisonAspects(lrChart, natalChart, 'Rév. Lunaire'),
      };
    }

    if (mode === 'progressions') {
      const progDate = calculateSecondaryProgressionDate(birthDate, transitDate);
      const progChart = calculateAstroChart(
        progDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem
      );
      return {
        baseChart: natalChart,
        outerChart: progChart,
        comparisonAspects: calculateComparisonAspects(progChart, natalChart, 'Progressé'),
      };
    }

    if (mode === 'synastry') {
      return {
        baseChart: natalChart,
        outerChart: partnerChart,
        comparisonAspects: calculateComparisonAspects(partnerChart, natalChart, 'Synastrie'),
      };
    }

    if (mode === 'comparative') {
      const preset = CITY_PRESETS.find((c) => c.id === solarReturnCityId) ?? CITY_PRESETS[0];
      const srLoc = solarReturnCustomLoc ?? {
        name: preset.name,
        latitude: preset.latitude,
        longitude: preset.longitude,
      };
      const natalSun = natalChart.planets.find((p) => p.id === 'sun');

      if (comparativePair === 'sr-vs-sr' && natalSun) {
        const srDateA = calculateSolarReturnDate(natalSun.longitude, birthDate, comparativeYearA);
        const srDateB = calculateSolarReturnDate(natalSun.longitude, birthDate, comparativeYearB);
        const srChartA = calculateAstroChart(
          srDateA,
          srLoc.latitude,
          srLoc.longitude,
          `${srLoc.name} (RS ${comparativeYearA})`,
          draftProfile.houseSystem
        );
        const srChartB = calculateAstroChart(
          srDateB,
          srLoc.latitude,
          srLoc.longitude,
          `${srLoc.name} (RS ${comparativeYearB})`,
          draftProfile.houseSystem
        );
        return {
          baseChart: srChartA,
          outerChart: srChartB,
          comparisonAspects: calculateComparisonAspects(srChartB, srChartA, 'Comparé'),
        };
      }

      if (comparativePair === 'natal-vs-sr' && solarReturnExactDate) {
        const srChart = calculateAstroChart(
          solarReturnExactDate,
          srLoc.latitude,
          srLoc.longitude,
          `${srLoc.name} (RS ${solarReturnYear})`,
          draftProfile.houseSystem
        );
        return {
          baseChart: natalChart,
          outerChart: srChart,
          comparisonAspects: calculateComparisonAspects(srChart, natalChart, 'Rév. Solaire'),
        };
      }

      if (comparativePair === 'natal-vs-natal') {
        return {
          baseChart: natalChart,
          outerChart: partnerChart,
          comparisonAspects: calculateComparisonAspects(partnerChart, natalChart, 'Comparé'),
        };
      }

      if (comparativePair === 'natal-vs-transit') {
        const trChart = calculateAstroChart(
          transitDate,
          birthLocation.latitude,
          birthLocation.longitude,
          birthLocation.cityName,
          draftProfile.houseSystem
        );
        return {
          baseChart: natalChart,
          outerChart: trChart,
          comparisonAspects: calculateComparisonAspects(trChart, natalChart, 'Transit'),
        };
      }
    }

    return { baseChart: natalChart, outerChart: null, comparisonAspects: [] };
  }, [
    mode,
    natalChart,
    partnerChart,
    transitDate,
    birthDate,
    birthLocation,
    draftProfile.houseSystem,
    draftProfile.name,
    partnerProfile.name,
    solarReturnExactDate,
    solarReturnYear,
    solarReturnCityId,
    solarReturnCustomLoc,
    lunarReturnExactDate,
    comparativePair,
    comparativeYearA,
    comparativeYearB,
  ]);

  const solarReturnAnalysis = useMemo<SolarReturnAnalysis | null>(() => {
    if (mode !== 'solarReturn' || !outerChart) return null;
    return analyzeSolarReturn(natalChart, outerChart);
  }, [mode, natalChart, outerChart]);

  const comparativeAnalysis = useMemo<ComparativeAnalysis | null>(() => {
    if (!outerChart) return null;
    return analyzeComparison(baseChart, outerChart, comparisonAspects);
  }, [baseChart, outerChart, comparisonAspects]);

  // Mount Three.js / WebXR Scene once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const scene = new AstrologyScene(container, {
      onSelectPlanet: (planet, layer) => {
        setShowFullSummary(false);
        setSelectedPlanet(planet);
        setSelectedPlanetLayer(layer);
      },
      onSelectHouse: (house) => {
        setShowFullSummary(false);
        setSelectedHouse(house);
      },
      onWebXRSupportChange: (supported) => setWebXRSupported(supported),
      onMRSupportChange: (supported) => setMrSupported(supported),
      onVRSessionChange: (active) => setInVR(active),
      onXRModeChange: (m) => setXrMode(m),
      onVRTimeStep: (deltaMinutes) => {
        setTimeSpeedDaysPerSec(0);
        setTransitDate((prev) => new Date(prev.getTime() + deltaMinutes * 60_000));
      },
    });
    sceneRef.current = scene;

    const canvas = container.querySelector('canvas');
    const handleLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleRestored = () => {
      setContextLost(false);
    };
    canvas?.addEventListener('webglcontextlost', handleLost);
    canvas?.addEventListener('webglcontextrestored', handleRestored);

    return () => {
      canvas?.removeEventListener('webglcontextlost', handleLost);
      canvas?.removeEventListener('webglcontextrestored', handleRestored);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Push chart updates into 3D scene (triggers smooth angular interpolation!)
  useEffect(() => {
    sceneRef.current?.updateCharts({
      mode,
      baseChart,
      outerChart,
      comparisonAspects,
    });
  }, [mode, baseChart, outerChart, comparisonAspects]);

  // Sync Western / Chinese zodiac band texture, wheel style, starfield sky & VR lectern
  useEffect(() => {
    sceneRef.current?.setZodiacTradition(tradition);
  }, [tradition]);

  useEffect(() => {
    sceneRef.current?.setZodiacWheelStyle(wheelStyle);
  }, [wheelStyle]);

  useEffect(() => {
    sceneRef.current?.setZodiacSignStyle(signStyle);
  }, [signStyle]);

  useEffect(() => {
    sceneRef.current?.setStarfieldStyle(starfieldStyle);
  }, [starfieldStyle]);

  useEffect(() => {
    sceneRef.current?.setSkyAnimations(skyAnimations);
    try {
      localStorage.setItem(SKY_ANIMS_STORAGE_KEY, JSON.stringify(skyAnimations));
    } catch {
      // Ignore storage quota errors
    }
  }, [skyAnimations]);

  // Keep selected planet synced when date or mode changes
  useEffect(() => {
    if (selectedPlanet) {
      const target = selectedPlanetLayer === 'outer' && outerChart ? outerChart : baseChart;
      const updated = target.planets.find((p) => p.id === selectedPlanet.id) ?? null;
      setSelectedPlanet(updated);
    }
    if (selectedHouse) {
      const updatedH = baseChart.houses.find((h) => h.house === selectedHouse.house) ?? null;
      setSelectedHouse(updatedH);
    }
  }, [baseChart, outerChart, selectedPlanet?.id, selectedPlanetLayer, selectedHouse?.house]);

  // Transit / progression / lunar return real-time & accelerated animation loop
  useEffect(() => {
    if (timeSpeedDaysPerSec === 0) return;

    // Exact 1s wall-clock pacing in Real-Time (1/86400) so HH:mm:ss ticks crisply without drift
    if (Math.abs(timeSpeedDaysPerSec - REAL_TIME_DAYS_PER_SEC) < 1e-8) {
      const id = window.setInterval(() => {
        setTransitDate((prev) => new Date(prev.getTime() + 1000));
      }, 1000);
      return () => window.clearInterval(id);
    }

    let rafId = 0;
    let lastTime = performance.now();
    let accMs = 0;
    const minIntervalMs = 65;

    const step = (now: number) => {
      const dtSec = Math.min((now - lastTime) / 1000, 0.2);
      lastTime = now;
      accMs += dtSec * 1000;
      if (accMs >= minIntervalMs) {
        const deltaDays = (accMs / 1000) * timeSpeedDaysPerSec;
        accMs = 0;
        setTransitDate((prev) => new Date(prev.getTime() + deltaDays * 86400 * 1000));
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [timeSpeedDaysPerSec]);

  // Solar Return real-time cycle animation (steps smoothly year by year)
  useEffect(() => {
    if (srAnimSpeed === 0) return;
    const isSrMode =
      mode === 'solarReturn' ||
      (mode === 'comparative' && (comparativePair === 'natal-vs-sr' || comparativePair === 'sr-vs-sr'));
    if (!isSrMode) return;

    const minYear = new Date().getFullYear() - 5;
    const maxYear = new Date().getFullYear() + 7;
    const intervalMs = srAnimSpeed >= 2 ? 1100 : 2100;

    const id = window.setInterval(() => {
      if (mode === 'comparative' && comparativePair === 'sr-vs-sr') {
        setComparativeYearB((y) => (y >= maxYear ? minYear : y + 1));
      } else {
        setSolarReturnYear((y) => (y >= maxYear ? minYear : y + 1));
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [srAnimSpeed, mode, comparativePair]);

  // Keyboard shortcut 'H' to collapse/expand dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleSelectProfile = useCallback(
    (id: string) => {
      const found = profiles.find((p) => p.id === id);
      if (found) {
        setActiveProfileId(found.id);
        setDraftProfile(found);
      }
    },
    [profiles]
  );

  const handleDraftProfileChange = useCallback((patch: Partial<NatalProfile>) => {
    setDraftProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSaveProfile = useCallback(() => {
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === draftProfile.id);
      if (exists) {
        return prev.map((p) => (p.id === draftProfile.id ? draftProfile : p));
      }
      return [...prev, draftProfile];
    });
    celestialAudio.playSoftTick();
  }, [draftProfile]);

  const handleCreateNewProfile = useCallback(() => {
    const newId = `profile-${Date.now()}`;
    const newProfile: NatalProfile = {
      id: newId,
      name: '',
      birthDateIso: toLocalDatetimeInput(new Date()),
      cityId: 'paris',
      houseSystem: 'placidus',
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
    setDraftProfile(newProfile);
  }, []);

  const handleDeleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((p) => p.id !== id);
        setActiveProfileId(filtered[0].id);
        setDraftProfile(filtered[0]);
        return filtered;
      });
    },
    []
  );

  const handleTransitDateChange = useCallback((val: string) => {
    if (!val) return;
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) {
      setTimeSpeedDaysPerSec(0);
      setTransitDate(parsed);
    }
  }, []);

  const handleResetTransitNow = useCallback(() => {
    setTransitDate(new Date());
    setTimeSpeedDaysPerSec(REAL_TIME_DAYS_PER_SEC);
  }, []);

  const handleToggleRealTime = useCallback(() => {
    const isCurrentlyLive = Math.abs(timeSpeedDaysPerSec - REAL_TIME_DAYS_PER_SEC) < 1e-8;
    if (isCurrentlyLive) {
      setTimeSpeedDaysPerSec(0);
    } else {
      setTransitDate(new Date());
      setTimeSpeedDaysPerSec(REAL_TIME_DAYS_PER_SEC);
      if (mode === 'natal') {
        setMode('transits');
      }
    }
  }, [timeSpeedDaysPerSec, mode]);

  const handleAspectFilterChange = useCallback((f: AspectFilter) => {
    setAspectFilter(f);
    sceneRef.current?.setAspectFilter(f);
  }, []);

  const handleDisplayFocusChange = useCallback((focus: SceneDisplayFocus) => {
    setDisplayFocus(focus);
    if (focus === 'aspectsOnly') {
      setAspectFilter((prev) => (prev === 'none' ? 'all' : prev));
    }
    sceneRef.current?.setDisplayFocus(focus);
  }, []);

  const handleHighlightAspect = useCallback((aspectId: string | null) => {
    sceneRef.current?.highlightAspect(aspectId);
  }, []);

  const handleToggleHouses = useCallback(() => {
    setShowHouses((prev) => {
      const next = !prev;
      sceneRef.current?.setShowHouses(next);
      return next;
    });
  }, []);

  const handleToggleConstellations = useCallback(() => {
    setShowConstellations((prev) => {
      const next = !prev;
      sceneRef.current?.setShowConstellations(next);
      return next;
    });
  }, []);

  const handleToggleVRPlaque = useCallback(() => {
    setShowVRPlaque((prev) => {
      const next = !prev;
      sceneRef.current?.setShowVRPlaque(next);
      return next;
    });
  }, []);

  const handleCameraPresetChange = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneRef.current?.setCameraPreset(preset);
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      celestialAudio.enabled = next;
      if (next) celestialAudio.playSoftTick();
      return next;
    });
  }, []);

  const handleSelectPlanet = useCallback((id: PlanetId, layer: 'base' | 'outer' = 'base') => {
    sceneRef.current?.selectPlanet(id, layer);
  }, []);

  const stopWebcamFeed = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const handleToggleDesktopMR = useCallback(() => {
    setDesktopMR((prev) => {
      const next = !prev;
      sceneRef.current?.setDesktopMRMode(next);
      if (!next) {
        stopWebcamFeed();
      } else if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
          .then((stream) => {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              void videoRef.current.play();
            }
            setCameraActive(true);
          })
          .catch(() => {
            setCameraActive(false);
          });
      }
      return next;
    });
  }, [stopWebcamFeed]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleMrScaleChange = useCallback((scale: number) => {
    setMrScale(scale);
    sceneRef.current?.setMRScale(scale);
  }, []);

  const handleEnterVR = useCallback(() => {
    if (webXRSupported) {
      void sceneRef.current?.enterVR();
    } else {
      setQuestModalOpen(true);
    }
  }, [webXRSupported]);

  const handleEnterMR = useCallback(() => {
    if (mrSupported) {
      void sceneRef.current?.enterMR();
    } else {
      handleToggleDesktopMR();
    }
  }, [mrSupported, handleToggleDesktopMR]);

  const shareUrl = useMemo(() => {
    const includePartner =
      mode === 'synastry' ||
      mode === 'composite' ||
      (mode === 'comparative' && comparativePair === 'natal-vs-natal');
    return buildShareThemeUrl({
      v: 1,
      profile: draftProfile,
      partner: includePartner ? partnerProfile : undefined,
      mode,
      tradition,
      wheelStyle,
      signStyle,
      starfieldStyle,
      transitIso: toLocalDatetimeInput(transitDate),
      srYear: solarReturnYear,
      srCityId: solarReturnCityId,
      srCustomLoc: solarReturnCustomLoc,
      compPair: comparativePair,
      compYearA: comparativeYearA,
      compYearB: comparativeYearB,
    });
  }, [
    draftProfile,
    partnerProfile,
    mode,
    tradition,
    wheelStyle,
    signStyle,
    starfieldStyle,
    transitDate,
    solarReturnYear,
    solarReturnCityId,
    solarReturnCustomLoc,
    comparativePair,
    comparativeYearA,
    comparativeYearB,
  ]);

  const handleOpenSharePrint = useCallback(() => {
    const snap = sceneRef.current?.captureSnapshot() ?? null;
    setSnapshotDataUrl(snap);
    setSharePrintOpen(true);
  }, []);

  const handleTriggerPdfPrint = useCallback(() => {
    const snap = sceneRef.current?.captureSnapshot() ?? null;
    if (snap) setSnapshotDataUrl(snap);
    window.setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const moon = baseChart.planets.find((p) => p.id === 'moon');

  const modeTitle: Record<ChartMode, string> = {
    natal: 'Thème Natal',
    transits: 'Natal + Transits',
    solarReturn: `Rév. Solaire ${solarReturnYear}`,
    lunarReturn: 'Rév. Lunaire',
    progressions: 'Progressions Sec.',
    synastry: 'Synastrie',
    composite: 'Thème Composite',
    comparative:
      comparativePair === 'sr-vs-sr'
        ? `Comparatif RS ${comparativeYearA} / ${comparativeYearB}`
        : comparativePair === 'natal-vs-sr'
          ? `Comparatif Natal / RS ${solarReturnYear}`
          : comparativePair === 'natal-vs-natal'
            ? 'Comparatif Natal / Natal'
            : 'Comparatif Natal / Transit',
    live: 'Ciel en direct',
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden text-[#f3efe6] ${
        desktopMR && !cameraActive
          ? 'bg-[radial-gradient(circle_at_center,_#162238_0%,_#0b1120_65%,_#060913_100%)]'
          : 'bg-[#05070e]'
      }`}
    >
      {/* Optional Desktop Webcam Passthrough Video Layer for Mixed Reality Preview */}
      {desktopMR && (
        <video
          ref={videoRef}
          muted
          playsInline
          className={`pointer-events-none fixed inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            cameraActive ? 'opacity-80' : 'opacity-0'
          }`}
        />
      )}

      {/* Isolated WebGL / WebXR Mount Container */}
      <div ref={canvasMountRef} className="no-print relative z-10 h-full w-full" />

      {contextLost && (
        <div className="no-print fixed inset-0 z-40 flex items-center justify-center bg-[#05070e]/95 p-6 text-center">
          <div className="max-w-md rounded-xl border border-[#d4af37]/30 bg-[#090e1d] p-6">
            <h2 className="font-display text-2xl font-semibold">Contexte 3D interrompu</h2>
            <p className="mt-2 text-sm text-slate-300">
              Le moteur graphique WebGL est en cours de réinitialisation.
            </p>
          </div>
        </div>
      )}

      {/* Top Bar: Clean 3-Zone Contract */}
      <header className="no-print pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-8 px-5 py-4">
        <div className="pointer-events-auto flex items-center gap-3 shrink-0">
          <div className="font-display text-2xl font-semibold tracking-tight text-[#f8f3e6] whitespace-nowrap shrink-0">
            Uranie VR
          </div>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            title="Présentation du programme et des créateurs"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0d1428]/90 px-2.5 py-1.5 text-xs font-medium text-[#e7cfa0] hover:border-[#d4af37]/60 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Présentation</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2.5 text-xs text-slate-300 font-mono-tabular whitespace-nowrap">
          <span className="text-[#38bdf8]">{modeTitle[mode]}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-[#e7cfa0]">
            {tradition === 'chinese'
              ? `ASC ${transposeLongitudeToChinese(baseChart.ascendant).sign.branchHanzi}${transposeLongitudeToChinese(baseChart.ascendant).sign.hanzi} ${transposeLongitudeToChinese(baseChart.ascendant).sign.name}`
              : `ASC ${baseChart.ascSign.symbol} ${baseChart.ascSign.name}`}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          {sun && (
            <>
              <span>
                ☉{' '}
                {tradition === 'chinese'
                  ? transposeLongitudeToChinese(sun.longitude).sign.name
                  : `${sun.formattedDeg} ${sun.sign.name}`}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
            </>
          )}
          {moon && (
            <>
              <span>
                ☽{' '}
                {tradition === 'chinese'
                  ? transposeLongitudeToChinese(moon.longitude).sign.name
                  : `${moon.formattedDeg} ${moon.sign.name}`}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
            </>
          )}
          <span className="text-slate-400">{baseChart.cityName}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleRealTime}
            title={
              Math.abs(timeSpeedDaysPerSec - REAL_TIME_DAYS_PER_SEC) < 1e-8
                ? 'Temps réel actif — Cliquer pour mettre en pause'
                : 'Synchroniser sur l’heure exacte et animer en temps réel'
            }
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono-tabular text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              Math.abs(timeSpeedDaysPerSec - REAL_TIME_DAYS_PER_SEC) < 1e-8
                ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
                : 'border-white/15 bg-[#0d1428] text-slate-300 hover:border-[#38bdf8] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              Temps réel ·{' '}
              {new Intl.DateTimeFormat('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }).format(transitDate)}
            </span>
          </button>
          <PWAInstallButton />
          <button
            type="button"
            onClick={handleOpenSharePrint}
            title="Imprimer en PDF ou envoyer par lien"
            className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/45 bg-[#121931] px-3 py-2 text-xs font-semibold text-[#f3d67a] hover:bg-[#d4af37]/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>PDF / Lien</span>
          </button>
          <button
            type="button"
            onClick={handleEnterMR}
            title="Lancer en Réalité Mixte (Passthrough Quest 3 ou Aperçu Hologramme)"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              xrMode === 'mr' || desktopMR
                ? 'border-[#38bdf8] bg-[#38bdf8] text-[#05070e]'
                : 'border-[#38bdf8]/45 bg-[#0c162d] text-[#7dd3fc] hover:bg-[#38bdf8]/20'
            }`}
          >
            <ScanEye className="w-4 h-4" />
            <span>
              {xrMode === 'mr'
                ? 'Quitter RM'
                : desktopMR
                  ? 'Quitter Hologramme'
                  : mrSupported
                    ? 'Réalité Mixte'
                    : 'Réalité Mixte (MR)'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleEnterVR}
            className="flex items-center gap-2 rounded-lg bg-[#d4af37] px-3.5 py-2 text-xs font-semibold text-[#05070e] hover:bg-[#e5c458] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Glasses className="w-4 h-4" />
            <span>{inVR && xrMode === 'vr' ? 'Quitter VR' : webXRSupported ? 'Entrer en VR' : 'VR · Quest 3'}</span>
          </button>
        </div>
      </header>

      {!isOnline && (
        <div className="no-print fixed top-16 left-5 z-20 rounded-lg border border-amber-400/30 bg-[#0b101f]/95 px-3 py-1.5 text-xs text-amber-200">
          Mode hors ligne · Éphéméride autonome actif
        </div>
      )}

      {/* Contextual Planet / House / Full Summary Inspector */}
      <InspectorPanel
        mode={mode}
        tradition={tradition}
        baseChart={baseChart}
        outerChart={outerChart}
        comparisonAspects={comparisonAspects}
        solarReturnAnalysis={solarReturnAnalysis}
        solarReturnExactDate={solarReturnExactDate}
        comparativeAnalysis={comparativeAnalysis}
        selectedPlanet={selectedPlanet}
        selectedPlanetLayer={selectedPlanetLayer}
        selectedHouse={selectedHouse}
        showFullSummary={showFullSummary}
        onClose={() => {
          setShowFullSummary(false);
          sceneRef.current?.selectPlanet(null, 'base');
          sceneRef.current?.selectHouse(null);
          sceneRef.current?.highlightAspect(null);
        }}
        onSelectPlanet={handleSelectPlanet}
        onHighlightAspect={handleHighlightAspect}
        onOpenSharePrint={handleOpenSharePrint}
      />

      {/* Collapsible Bottom Control Dock */}
      <ControlDock
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          if (nextMode === 'live') {
            setTransitDate(new Date());
            setTimeSpeedDaysPerSec(REAL_TIME_DAYS_PER_SEC);
          }
          if (nextMode === 'natal' || nextMode === 'comparative' || nextMode === 'solarReturn') {
            sceneRef.current?.selectPlanet(null, 'base');
            sceneRef.current?.selectHouse(null);
            setShowFullSummary(true);
          }
        }}
        tradition={tradition}
        onTraditionChange={setTradition}
        baseChart={baseChart}
        outerChart={outerChart}
        comparisonAspects={comparisonAspects}
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        draftProfile={draftProfile}
        onDraftProfileChange={handleDraftProfileChange}
        onSaveProfile={handleSaveProfile}
        onCreateNewProfile={handleCreateNewProfile}
        onDeleteProfile={handleDeleteProfile}
        partnerProfileId={partnerProfileId}
        onPartnerProfileChange={setPartnerProfileId}
        comparativePair={comparativePair}
        onComparativePairChange={setComparativePair}
        comparativeYearA={comparativeYearA}
        onComparativeYearAChange={setComparativeYearA}
        comparativeYearB={comparativeYearB}
        onComparativeYearBChange={setComparativeYearB}
        transitDateInput={toLocalDatetimeInput(transitDate)}
        onTransitDateChange={handleTransitDateChange}
        onResetTransitNow={handleResetTransitNow}
        solarReturnYear={solarReturnYear}
        onSolarReturnYearChange={setSolarReturnYear}
        solarReturnCityId={solarReturnCityId}
        onSolarReturnCityChange={setSolarReturnCityId}
        solarReturnCustomLoc={solarReturnCustomLoc}
        onSolarReturnCustomLocChange={setSolarReturnCustomLoc}
        solarReturnExactDate={solarReturnExactDate}
        lunarReturnExactDate={lunarReturnExactDate}
        timeSpeedDaysPerSec={timeSpeedDaysPerSec}
        onTimeSpeedChange={setTimeSpeedDaysPerSec}
        srAnimSpeed={srAnimSpeed}
        onSrAnimSpeedChange={setSrAnimSpeed}
        aspectFilter={aspectFilter}
        onAspectFilterChange={handleAspectFilterChange}
        onHighlightAspect={handleHighlightAspect}
        wheelStyle={wheelStyle}
        onWheelStyleChange={setWheelStyle}
        signStyle={signStyle}
        onSignStyleChange={setSignStyle}
        starfieldStyle={starfieldStyle}
        onStarfieldStyleChange={setStarfieldStyle}
        displayFocus={displayFocus}
        onDisplayFocusChange={handleDisplayFocusChange}
        showHouses={showHouses}
        onToggleHouses={handleToggleHouses}
        showConstellations={showConstellations}
        onToggleConstellations={handleToggleConstellations}
        showVRPlaque={showVRPlaque}
        onToggleVRPlaque={handleToggleVRPlaque}
        desktopMR={desktopMR}
        onToggleDesktopMR={handleToggleDesktopMR}
        mrScale={mrScale}
        onMrScaleChange={handleMrScaleChange}
        cameraPreset={cameraPreset}
        onCameraPresetChange={handleCameraPresetChange}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        skyAnimations={skyAnimations}
        onSkyAnimationsChange={setSkyAnimations}
        selectedPlanetId={selectedPlanet?.id ?? null}
        onSelectPlanet={handleSelectPlanet}
        onOpenFullSummary={() => {
          sceneRef.current?.selectPlanet(null, 'base');
          sceneRef.current?.selectHouse(null);
          setShowFullSummary((v) => !v);
        }}
        onOpenAscendantCalculator={() => setAscendantModalOpen(true)}
        onOpenQuestGuide={() => setQuestModalOpen(true)}
      />

      <AscendantCalculatorModal
        open={ascendantModalOpen}
        onClose={() => setAscendantModalOpen(false)}
        initialProfile={draftProfile}
        onApplyToProfile={(patch) => {
          handleDraftProfileChange(patch);
        }}
      />

      <QuestGuideModal
        open={questModalOpen}
        onClose={() => setQuestModalOpen(false)}
        webXRSupported={webXRSupported}
        mrSupported={mrSupported}
        onEnterVR={() => void sceneRef.current?.enterVR()}
        onEnterMR={() => void sceneRef.current?.enterMR()}
        shareUrl={shareUrl}
      />

      <AboutCreatorModal
        open={aboutOpen}
        onClose={() => {
          setAboutOpen(false);
          try {
            localStorage.setItem('uranie_vr_intro_seen_v1', '1');
          } catch {
            // Ignore storage errors
          }
        }}
        webXRSupported={webXRSupported}
        mrSupported={mrSupported}
        onEnterVR={() => void sceneRef.current?.enterVR()}
        onEnterMR={() => void sceneRef.current?.enterMR()}
      />

      <SharePrintModal
        open={sharePrintOpen}
        onClose={() => setSharePrintOpen(false)}
        onPrintPdf={handleTriggerPdfPrint}
        reportProps={{
          mode,
          modeLabel: modeTitle[mode],
          tradition,
          wheelStyle,
          signStyle,
          profile: draftProfile,
          baseChart,
          outerChart,
          comparisonAspects,
          solarReturnAnalysis,
          solarReturnExactDate,
          comparativeAnalysis,
          snapshotDataUrl,
          shareUrl,
        }}
      />

      {/* Hidden on screen, visible ONLY during window.print() / Save as PDF */}
      <div className="print-only">
        <PrintableChartReport
          mode={mode}
          modeLabel={modeTitle[mode]}
          tradition={tradition}
          wheelStyle={wheelStyle}
          signStyle={signStyle}
          profile={draftProfile}
          baseChart={baseChart}
          outerChart={outerChart}
          comparisonAspects={comparisonAspects}
          solarReturnAnalysis={solarReturnAnalysis}
          solarReturnExactDate={solarReturnExactDate}
          comparativeAnalysis={comparativeAnalysis}
          snapshotDataUrl={snapshotDataUrl}
          shareUrl={shareUrl}
        />
      </div>
    </div>
  );
}
