import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Mic, Power, RotateCcw, SlidersHorizontal, Sparkles, Stars } from 'lucide-react';
import {
  analyzeComparison,
  analyzeSolarReturn,
  AspectType,
  AstroChart,
  calculateAstroChart,
  calculateComparisonAspects,
  calculateCompositeChart,
  calculateLunarReturnDate,
  calculatePlanetaryReturnDate,
  calculateRelocatedChart,
  calculateSecondaryProgressionDate,
  calculateSolarArcChart,
  calculateSolarReturnDate,
  ChartMode,
  CITY_PRESETS,
  ComparativeAnalysis,
  ComparisonAspectInfo,
  DEFAULT_MAJOR_ASPECT_TYPES,
  HOUSE_SYSTEMS,
  HouseCusp,
  NatalProfile,
  PlanetId,
  PlanetPosition,
  searchPlacesByQuery,
  SolarReturnAnalysis,
} from './astro/astroEngine';
import {
  buildFullChartDataSheet,
  CatalogPointEntry,
  searchMinorPlanetsCatalog,
} from './astro/celestialCatalog';
import { ZodiacTradition } from './astro/chineseAstrology';
import { buildShareThemeUrl, readSharedThemeFromUrl } from './astro/shareTheme';
import { ComparativePairKind, ControlDock, DockTab } from './components/ControlDock';
import {
  Chart2DCanvas,
  WHEEL_2D_STYLES,
  Wheel2DOrientation,
  Wheel2DStyle,
} from './components/Chart2DCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { PrintableChartReport } from './components/PrintableChartReport';
import { AboutCreatorModal } from './components/AboutCreatorModal';
import { AscendantCalculatorModal } from './components/AscendantCalculatorModal';
import { QuestGuideModal } from './components/QuestGuideModal';
import { SharePrintModal } from './components/SharePrintModal';
import { ChartSelectorBar } from './components/ChartSelectorBar';
import { CosmicHomeView } from './components/CosmicHomeView';
import { CosmicTabId, FloatingPillNav } from './components/FloatingPillNav';
import { AdvancedConfigDrawer, DignityRingsConfig } from './components/AdvancedConfigDrawer';
import { CelestialDataSheetView } from './components/CelestialDataSheetView';
import { AuxiliaryChartsView } from './components/AuxiliaryChartsView';
import { SpacetimeNavigator } from './components/SpacetimeNavigator';
import { SoftwareGuideHelpView } from './components/SoftwareGuideHelpView';
import { TutorialDidacticielView } from './components/TutorialDidacticielView';
import { HistoricalLibraryView } from './components/HistoricalLibraryView';
import { AdminSecurityView } from './components/AdminSecurityView';
import { ScreenLockOverlay } from './components/ScreenLockOverlay';
import { CosmicIntroReplayView } from './components/CosmicIntroReplayView';
import {
  AdminSecurityPolicy,
  AdminSecurityState,
  appendAuditEntry,
  hashAdminPassword,
  loadAdminSecurityState,
  saveAdminSecurityState,
  verifyAdminPasswordAttempt,
} from './astro/adminSecurity';
import {
  AspectFilter,
  AstrologyScene,
  CameraPreset,
  DEFAULT_SKY_ANIMATIONS,
  SceneDisplayFocus,
  SkyAnimationsConfig,
  XRSessionModeKind,
} from './vr/AstrologyScene';
import {
  celestialAudio,
  esotericIntroMusic,
  speakSingleFrenchUtterance,
  stopFrenchSpeech,
} from './vr/audio';
import {
  ContinuousVoiceListener,
  isSpeechRecognitionSupported,
  parseVoiceCommand,
} from './vr/voiceEngine';
import {
  ZODIAC_WHEEL_STYLES,
  type StarfieldBackdropStyle,
  type ZodiacSignStyle,
  type ZodiacWheelStyle,
} from './vr/textures';
import {
  applyTypographyToDocument,
  DEFAULT_TYPOGRAPHY,
  TypographyPreferences,
} from './vr/typography';

const REAL_TIME_DAYS_PER_SEC = 1 / 86400;

const STORAGE_KEY = 'uranie_vr_natal_profiles_v1';
const SKY_ANIMS_STORAGE_KEY = 'uranie_vr_sky_anims_v1';
const VIEW_DIM_STORAGE_KEY = 'uranie_vr_view_dim_v1';
const WHEEL_2D_STYLE_STORAGE_KEY = 'uranie_vr_wheel2d_v1';
const WHEEL_2D_ORIENT_STORAGE_KEY = 'uranie_vr_orient2d_v1';
const VOICE_FEEDBACK_STORAGE_KEY = 'uranie_vr_voice_feedback_v1';
const VOICE_SEARCH_BTN_STORAGE_KEY = 'uranie_vr_voice_search_btns_v1';
const TYPOGRAPHY_STORAGE_KEY = 'uranie_vr_typography_v1';
const SR_LOCATION_STORAGE_KEY = 'uranie_vr_sr_loc_v1';

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
  const [solarReturnCityId, setSolarReturnCityId] = useState<string>(() => {
    if (initialShared?.srCityId) return initialShared.srCityId;
    try {
      const raw = localStorage.getItem(SR_LOCATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { cityId?: string };
        if (parsed.cityId) return parsed.cityId;
      }
    } catch {
      // ignore storage error
    }
    return 'paris';
  });
  const [solarReturnCustomLoc, setSolarReturnCustomLoc] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(() => {
    if (initialShared?.srCustomLoc !== undefined) return initialShared.srCustomLoc ?? null;
    try {
      const raw = localStorage.getItem(SR_LOCATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          customLoc?: { name: string; latitude: number; longitude: number } | null;
        };
        if (parsed.customLoc && typeof parsed.customLoc.latitude === 'number' && typeof parsed.customLoc.longitude === 'number') {
          return parsed.customLoc;
        }
      }
    } catch {
      // ignore storage error
    }
    return null;
  });
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
  const [viewDimension, setViewDimension] = useState<'3d' | '2d'>(() => {
    try {
      const saved = localStorage.getItem(VIEW_DIM_STORAGE_KEY);
      if (saved === '2d' || saved === '3d') return saved;
    } catch {
      // Ignore storage errors
    }
    return '3d';
  });
  const [wheel2DStyle, setWheel2DStyle] = useState<Wheel2DStyle>(() => {
    try {
      const saved = localStorage.getItem(WHEEL_2D_STYLE_STORAGE_KEY) as Wheel2DStyle | null;
      if (saved && WHEEL_2D_STYLES.some((s) => s.id === saved)) return saved;
    } catch {
      // Ignore storage errors
    }
    return 'astrolabe';
  });
  const [wheel2DOrientation, setWheel2DOrientation] = useState<Wheel2DOrientation>(() => {
    try {
      const saved = localStorage.getItem(WHEEL_2D_ORIENT_STORAGE_KEY);
      if (saved === 'ascendant' || saved === 'aries0' || saved === 'mcTop') return saved;
    } catch {
      // Ignore storage errors
    }
    return 'ascendant';
  });
  const [highlightedAspectId, setHighlightedAspectId] = useState<string | null>(null);
  const [cosmicTab, setCosmicTab] = useState<CosmicTabId>(() => (initialShared ? 'wheel' : 'home'));
  const [configOpen, setConfigOpen] = useState<boolean>(false);
  const [show3DDock, setShow3DDock] = useState<boolean>(false);
  const [enabledAspectTypes, setEnabledAspectTypes] = useState<AspectType[]>(
    DEFAULT_MAJOR_ASPECT_TYPES
  );
  const [dignityConfig, setDignityConfig] = useState<DignityRingsConfig>({
    showDecans: true,
    showTerms: true,
    termSystem: 'egyptian',
    showDodecatemoria: false,
    showCentralSun: true,
  });
  const [pinnedPointIds, setPinnedPointIds] = useState<string[]>(['lot-fortune', 'chiron']);
  const [planetaryReturnPointId, setPlanetaryReturnPointId] = useState<string>('sun');
  const [relocatedLoc, setRelocatedLoc] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  }>({
    name: 'New York (États-Unis)',
    latitude: 40.7128,
    longitude: -74.006,
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
  const [autoStartIntroAudio, setAutoStartIntroAudio] = useState<boolean>(false);
  const [requestedDockTab, setRequestedDockTab] = useState<{ tab: DockTab; nonce: number } | null>(
    null
  );
  const [sharePrintOpen, setSharePrintOpen] = useState<boolean>(false);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [quitConfirmOpen, setQuitConfirmOpen] = useState<boolean>(false);
  const [appExited, setAppExited] = useState<boolean>(false);
  const [adminSecurity, setAdminSecurity] = useState<AdminSecurityState>(() =>
    loadAdminSecurityState()
  );
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [lockBannerMsg, setLockBannerMsg] = useState<string | null>(null);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState<boolean>(false);
  const [voiceListening, setVoiceListening] = useState<boolean>(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(VOICE_FEEDBACK_STORAGE_KEY);
      return saved === null ? true : saved === '1';
    } catch {
      return true;
    }
  });
  const [voiceSearchButtonsEnabled, setVoiceSearchButtonsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(VOICE_SEARCH_BTN_STORAGE_KEY);
      return saved === null ? true : saved === '1';
    } catch {
      return true;
    }
  });
  const [typography, setTypography] = useState<TypographyPreferences>(() => {
    try {
      const raw = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TypographyPreferences>;
        return {
          titleFont: parsed.titleFont ?? DEFAULT_TYPOGRAPHY.titleFont,
          bodyFont: parsed.bodyFont ?? DEFAULT_TYPOGRAPHY.bodyFont,
          glyphFont: parsed.glyphFont ?? DEFAULT_TYPOGRAPHY.glyphFont,
        };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_TYPOGRAPHY;
  });

  useEffect(() => {
    applyTypographyToDocument(typography);
    try {
      localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(typography));
    } catch {
      // Ignore storage errors
    }
    sceneRef.current?.refreshTypography();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        sceneRef.current?.refreshTypography();
      });
    }
  }, [typography]);
  const [voiceInterimText, setVoiceInterimText] = useState<string>('');
  const [voiceStatusText, setVoiceStatusText] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceListenerRef = useRef<ContinuousVoiceListener | null>(null);

  // Persist saved natal profiles
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore storage quota errors
    }
  }, [profiles]);

  // Persist admin security settings & audit log
  useEffect(() => {
    saveAdminSecurityState(adminSecurity);
  }, [adminSecurity]);

  const hasAdminPassword = Boolean(adminSecurity.passwordHash);
  const isProtectionEnforced =
    hasAdminPassword && adminSecurity.protectionActive && !isAdminUnlocked;
  const profilesLocked = isProtectionEnforced && adminSecurity.policy.lockEditionProfiles;
  const configLocked = isProtectionEnforced && adminSecurity.policy.lockConfigDrawer;
  const modesLocked = isProtectionEnforced && adminSecurity.policy.lockChartModeSwitch;
  const exportsLocked = isProtectionEnforced && adminSecurity.policy.lockExports;
  const quitLocked = isProtectionEnforced && adminSecurity.policy.lockQuitApp;

  const notifyLockedAction = useCallback((actionLabel: string) => {
    setLockBannerMsg(`${actionLabel} est verrouillé par l’administrateur.`);
  }, []);

  useEffect(() => {
    if (!lockBannerMsg) return;
    const t = window.setTimeout(() => setLockBannerMsg(null), 4500);
    return () => window.clearTimeout(t);
  }, [lockBannerMsg]);

  // Auto-lock Admin session after inactivity when configured
  useEffect(() => {
    const mins = adminSecurity.policy.autoLockMinutes;
    if (!hasAdminPassword || mins <= 0 || !isAdminUnlocked) return;
    let timerId = 0;
    const resetTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        setIsAdminUnlocked(false);
        setAdminSecurity((prev) => ({
          ...prev,
          auditLog: appendAuditEntry(
            prev.auditLog,
            `Session Admin verrouillée automatiquement après ${mins} min d’inactivité`,
            'info'
          ),
        }));
      }, mins * 60_000);
    };
    resetTimer();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => {
      window.clearTimeout(timerId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [hasAdminPassword, isAdminUnlocked, adminSecurity.policy.autoLockMinutes]);

  const handleInitializeAdminPassword = useCallback(
    async (password: string, enableProtectionImmediately: boolean) => {
      const salt = adminSecurity.salt;
      const hash = await hashAdminPassword(password, salt);
      setAdminSecurity((prev) => ({
        ...prev,
        passwordHash: hash,
        protectionActive: enableProtectionImmediately,
        screenLocked: false,
        failedAttempts: 0,
        lockedUntilTs: null,
        auditLog: appendAuditEntry(prev.auditLog, 'Mot de passe Administrateur initialisé', 'success'),
      }));
      setIsAdminUnlocked(true);
    },
    [adminSecurity.salt]
  );

  const handleUnlockAdmin = useCallback(
    async (password: string) => {
      const res = await verifyAdminPasswordAttempt(adminSecurity, password);
      setAdminSecurity(res.nextState);
      if (res.ok) {
        setIsAdminUnlocked(true);
      }
      return { ok: res.ok, errorMsg: res.errorMsg };
    },
    [adminSecurity]
  );

  const handleLockAdminSession = useCallback(() => {
    setIsAdminUnlocked(false);
    setAdminSecurity((prev) => ({
      ...prev,
      auditLog: appendAuditEntry(prev.auditLog, 'Session Admin fermée manuellement', 'info'),
    }));
  }, []);

  const handleActivateProtectionAndClose = useCallback(() => {
    setAdminSecurity((prev) => ({
      ...prev,
      protectionActive: true,
      auditLog: appendAuditEntry(prev.auditLog, 'Mode anti-manipulation activé', 'success'),
    }));
    setIsAdminUnlocked(false);
    setCosmicTab('wheel');
  }, []);

  const handleEnableFullScreenLock = useCallback(() => {
    setConfigOpen(false);
    setSharePrintOpen(false);
    setIsAdminUnlocked(false);
    setAdminSecurity((prev) => ({
      ...prev,
      protectionActive: true,
      screenLocked: true,
      auditLog: appendAuditEntry(prev.auditLog, 'Verrouillage plein écran activé', 'info'),
    }));
  }, []);

  const handleToggleProtectionActive = useCallback((active: boolean) => {
    setAdminSecurity((prev) => ({
      ...prev,
      protectionActive: active,
      auditLog: appendAuditEntry(
        prev.auditLog,
        active ? 'Protection anti-manipulation activée' : 'Protection anti-manipulation désactivée',
        active ? 'success' : 'info'
      ),
    }));
  }, []);

  const handleUpdateSecurityPolicy = useCallback((patch: Partial<AdminSecurityPolicy>) => {
    setAdminSecurity((prev) => ({
      ...prev,
      policy: { ...prev.policy, ...patch },
      auditLog: appendAuditEntry(prev.auditLog, 'Politique de verrous mise à jour', 'info'),
    }));
  }, []);

  const handleChangeAdminPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const check = await verifyAdminPasswordAttempt(adminSecurity, currentPassword);
      if (!check.ok) {
        setAdminSecurity(check.nextState);
        return { ok: false, errorMsg: check.errorMsg };
      }
      const nextHash = await hashAdminPassword(newPassword, check.nextState.salt);
      setAdminSecurity({
        ...check.nextState,
        passwordHash: nextHash,
        auditLog: appendAuditEntry(check.nextState.auditLog, 'Mot de passe Admin modifié', 'success'),
      });
      return { ok: true, errorMsg: null };
    },
    [adminSecurity]
  );

  const handleDisableSecurity = useCallback(
    async (currentPassword: string) => {
      const check = await verifyAdminPasswordAttempt(adminSecurity, currentPassword);
      if (!check.ok) {
        setAdminSecurity(check.nextState);
        return { ok: false, errorMsg: check.errorMsg };
      }
      setIsAdminUnlocked(false);
      setAdminSecurity({
        ...check.nextState,
        passwordHash: null,
        protectionActive: false,
        screenLocked: false,
        auditLog: appendAuditEntry(check.nextState.auditLog, 'Protection par mot de passe supprimée', 'warning'),
      });
      return { ok: true, errorMsg: null };
    },
    [adminSecurity]
  );

  const handleClearAuditLog = useCallback(() => {
    setAdminSecurity((prev) => ({ ...prev, auditLog: [] }));
  }, []);

  const birthDate = useMemo(() => parseProfileDate(draftProfile.birthDateIso), [draftProfile.birthDateIso]);
  const birthLocation = useMemo(() => resolveProfileLocation(draftProfile), [draftProfile]);

  const natalChart: AstroChart = useMemo(
    () =>
      calculateAstroChart(
        birthDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem,
        enabledAspectTypes
      ),
    [
      birthDate,
      birthLocation.latitude,
      birthLocation.longitude,
      birthLocation.cityName,
      draftProfile.houseSystem,
      enabledAspectTypes,
    ]
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
      partnerProfile.houseSystem,
      enabledAspectTypes
    );
  }, [partnerProfile, enabledAspectTypes]);

  const solarReturnLocation = useMemo(() => {
    if (solarReturnCustomLoc) return solarReturnCustomLoc;
    const preset = CITY_PRESETS.find((c) => c.id === solarReturnCityId) ?? CITY_PRESETS[0];
    return {
      name: `${preset.name} (${preset.country})`,
      latitude: preset.latitude,
      longitude: preset.longitude,
    };
  }, [solarReturnCityId, solarReturnCustomLoc]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SR_LOCATION_STORAGE_KEY,
        JSON.stringify({ cityId: solarReturnCityId, customLoc: solarReturnCustomLoc })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [solarReturnCityId, solarReturnCustomLoc]);

  const handleUseBirthLocationForSR = useCallback(() => {
    if (modesLocked) {
      notifyLockedAction('La modification du lieu de résidence anniversaire');
      return;
    }
    setSolarReturnCityId(draftProfile.cityId);
    if (
      draftProfile.customCityName &&
      draftProfile.customLat !== undefined &&
      draftProfile.customLon !== undefined
    ) {
      setSolarReturnCustomLoc({
        name: draftProfile.customCityName,
        latitude: draftProfile.customLat,
        longitude: draftProfile.customLon,
      });
    } else {
      setSolarReturnCustomLoc(null);
    }
  }, [draftProfile, modesLocked, notifyLockedAction]);

  const handleSolarReturnYearChangeGuarded = useCallback(
    (nextYear: number) => {
      if (modesLocked) {
        notifyLockedAction('Le changement d’année de Révolution Solaire');
        return;
      }
      setSolarReturnYear(nextYear);
    },
    [modesLocked, notifyLockedAction]
  );

  const handleSolarReturnCityChangeGuarded = useCallback(
    (nextCityId: string) => {
      if (modesLocked) {
        notifyLockedAction('La modification du lieu de résidence anniversaire');
        return;
      }
      setSolarReturnCityId(nextCityId);
    },
    [modesLocked, notifyLockedAction]
  );

  const handleSolarReturnCustomLocChangeGuarded = useCallback(
    (nextLoc: { name: string; latitude: number; longitude: number } | null) => {
      if (modesLocked) {
        notifyLockedAction('La modification du lieu de résidence anniversaire');
        return;
      }
      setSolarReturnCustomLoc(nextLoc);
    },
    [modesLocked, notifyLockedAction]
  );

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

  const planetaryReturnExact = useMemo(
    () => calculatePlanetaryReturnDate(planetaryReturnPointId, birthDate, transitDate),
    [planetaryReturnPointId, birthDate, transitDate]
  );

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
        draftProfile.houseSystem,
        enabledAspectTypes
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
        draftProfile.houseSystem,
        enabledAspectTypes
      );
      return {
        baseChart: natalChart,
        outerChart: trChart,
        comparisonAspects: calculateComparisonAspects(trChart, natalChart, 'Transit', enabledAspectTypes),
      };
    }

    if (mode === 'solarReturn' && solarReturnExactDate) {
      const srChart = calculateAstroChart(
        solarReturnExactDate,
        solarReturnLocation.latitude,
        solarReturnLocation.longitude,
        solarReturnLocation.name,
        draftProfile.houseSystem,
        enabledAspectTypes
      );
      return {
        baseChart: natalChart,
        outerChart: srChart,
        comparisonAspects: calculateComparisonAspects(srChart, natalChart, 'Rév. Solaire', enabledAspectTypes),
      };
    }

    if (mode === 'lunarReturn' && lunarReturnExactDate) {
      const lrChart = calculateAstroChart(
        lunarReturnExactDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem,
        enabledAspectTypes
      );
      return {
        baseChart: natalChart,
        outerChart: lrChart,
        comparisonAspects: calculateComparisonAspects(lrChart, natalChart, 'Rév. Lunaire', enabledAspectTypes),
      };
    }

    if (mode === 'planetaryReturn') {
      const preset = CITY_PRESETS.find((c) => c.id === solarReturnCityId) ?? CITY_PRESETS[0];
      const prLoc = solarReturnCustomLoc ?? {
        name: `${preset.name} (${preset.country})`,
        latitude: preset.latitude,
        longitude: preset.longitude,
      };
      const prDate = planetaryReturnExact?.date ?? transitDate;
      const prChart = calculateAstroChart(
        prDate,
        prLoc.latitude,
        prLoc.longitude,
        prLoc.name,
        draftProfile.houseSystem,
        enabledAspectTypes
      );
      return {
        baseChart: natalChart,
        outerChart: prChart,
        comparisonAspects: calculateComparisonAspects(
          prChart,
          natalChart,
          'Rév. Planétaire',
          enabledAspectTypes
        ),
      };
    }

    if (mode === 'progressions') {
      const progDate = calculateSecondaryProgressionDate(birthDate, transitDate);
      const progChart = calculateAstroChart(
        progDate,
        birthLocation.latitude,
        birthLocation.longitude,
        birthLocation.cityName,
        draftProfile.houseSystem,
        enabledAspectTypes
      );
      return {
        baseChart: natalChart,
        outerChart: progChart,
        comparisonAspects: calculateComparisonAspects(progChart, natalChart, 'Progressé', enabledAspectTypes),
      };
    }

    if (mode === 'solarArc') {
      const saChart = calculateSolarArcChart(natalChart, transitDate, birthDate, enabledAspectTypes);
      return {
        baseChart: natalChart,
        outerChart: saChart,
        comparisonAspects: calculateComparisonAspects(saChart, natalChart, 'Arc Solaire', enabledAspectTypes),
      };
    }

    if (mode === 'relocated') {
      const relocChart = calculateRelocatedChart(
        birthDate,
        relocatedLoc.latitude,
        relocatedLoc.longitude,
        relocatedLoc.name,
        draftProfile.houseSystem,
        enabledAspectTypes
      );
      return {
        baseChart: relocChart,
        outerChart: natalChart,
        comparisonAspects: calculateComparisonAspects(
          natalChart,
          relocChart,
          'Relocalisé',
          enabledAspectTypes
        ),
      };
    }

    if (mode === 'synastry') {
      return {
        baseChart: natalChart,
        outerChart: partnerChart,
        comparisonAspects: calculateComparisonAspects(partnerChart, natalChart, 'Synastrie', enabledAspectTypes),
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
          draftProfile.houseSystem,
          enabledAspectTypes
        );
        const srChartB = calculateAstroChart(
          srDateB,
          srLoc.latitude,
          srLoc.longitude,
          `${srLoc.name} (RS ${comparativeYearB})`,
          draftProfile.houseSystem,
          enabledAspectTypes
        );
        return {
          baseChart: srChartA,
          outerChart: srChartB,
          comparisonAspects: calculateComparisonAspects(srChartB, srChartA, 'Comparé', enabledAspectTypes),
        };
      }

      if (comparativePair === 'natal-vs-sr' && solarReturnExactDate) {
        const srChart = calculateAstroChart(
          solarReturnExactDate,
          srLoc.latitude,
          srLoc.longitude,
          `${srLoc.name} (RS ${solarReturnYear})`,
          draftProfile.houseSystem,
          enabledAspectTypes
        );
        return {
          baseChart: natalChart,
          outerChart: srChart,
          comparisonAspects: calculateComparisonAspects(srChart, natalChart, 'Rév. Solaire', enabledAspectTypes),
        };
      }

      if (comparativePair === 'natal-vs-natal') {
        return {
          baseChart: natalChart,
          outerChart: partnerChart,
          comparisonAspects: calculateComparisonAspects(partnerChart, natalChart, 'Comparé', enabledAspectTypes),
        };
      }

      if (comparativePair === 'natal-vs-transit') {
        const trChart = calculateAstroChart(
          transitDate,
          birthLocation.latitude,
          birthLocation.longitude,
          birthLocation.cityName,
          draftProfile.houseSystem,
          enabledAspectTypes
        );
        return {
          baseChart: natalChart,
          outerChart: trChart,
          comparisonAspects: calculateComparisonAspects(trChart, natalChart, 'Transit', enabledAspectTypes),
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
    solarReturnLocation,
    lunarReturnExactDate,
    planetaryReturnExact,
    relocatedLoc,
    comparativePair,
    comparativeYearA,
    comparativeYearB,
    enabledAspectTypes,
  ]);

  const pinnedCatalogPoints = useMemo<CatalogPointEntry[]>(() => {
    if (pinnedPointIds.length === 0) return [];
    const sheet = buildFullChartDataSheet(baseChart);
    const result: CatalogPointEntry[] = [];
    for (const pid of pinnedPointIds) {
      const found = sheet.find((e) => e.id === pid);
      if (found) {
        result.push(found);
      } else if (pid.startsWith('mpc-')) {
        const extra = searchMinorPlanetsCatalog(pid.slice(4), baseChart, 1);
        if (extra[0]) result.push(extra[0]);
      } else {
        const extra = searchMinorPlanetsCatalog(pid, baseChart, 1);
        if (extra[0]) result.push(extra[0]);
      }
    }
    return result;
  }, [pinnedPointIds, baseChart]);

  const handleTogglePinPoint = useCallback((pt: CatalogPointEntry) => {
    setPinnedPointIds((prev) =>
      prev.includes(pt.id) ? prev.filter((id) => id !== pt.id) : [...prev, pt.id]
    );
  }, []);

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
      onVRSelectMode: (nextMode) => {
        setMode(nextMode);
        if (nextMode === 'live') {
          setTransitDate(new Date());
          setTimeSpeedDaysPerSec(REAL_TIME_DAYS_PER_SEC);
        }
      },
      onVRTogglePlay: () => {
        setTimeSpeedDaysPerSec((prev) => (prev > 0 ? 0 : REAL_TIME_DAYS_PER_SEC));
      },
      onVRToggleTradition: () => {
        setTradition((prev) => (prev === 'western' ? 'chinese' : 'western'));
      },
      onVRToggleHouses: () => {
        setShowHouses((prev) => {
          const next = !prev;
          sceneRef.current?.setShowHouses(next);
          return next;
        });
      },
      onVRToggleSkyAnims: () => {
        setSkyAnimations((prev) => {
          const anyOn = prev.shootingStars || prev.nebulae || prev.aurora;
          const nextVal = !anyOn;
          return { shootingStars: nextVal, nebulae: nextVal, aurora: nextVal };
        });
      },
      onVRToggleVoice: () => {
        toggleVoiceModeRef.current();
      },
      onVRQuitApp: () => {
        void executeQuitAppRef.current();
      },
      onCameraPresetChange: (preset) => {
        setCameraPreset(preset);
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

  const isAnimPlaying = srAnimSpeed > 0 || timeSpeedDaysPerSec > 0;
  const skyAnimsOn =
    skyAnimations.shootingStars || skyAnimations.nebulae || skyAnimations.aurora;

  useEffect(() => {
    sceneRef.current?.setMenuStatus({
      isPlaying: isAnimPlaying,
      showHouses,
      skyAnimsOn,
      voiceListening: voiceModeEnabled && voiceListening,
      voiceStatus: voiceInterimText || voiceStatusText || '',
    });
  }, [isAnimPlaying, showHouses, skyAnimsOn, voiceModeEnabled, voiceListening, voiceInterimText, voiceStatusText]);

  useEffect(() => {
    sceneRef.current?.setPaused(
      ((cosmicTab !== 'wheel' || viewDimension === '2d') && !inVR) ||
        appExited ||
        (adminSecurity.screenLocked && hasAdminPassword)
    );
    try {
      localStorage.setItem(VIEW_DIM_STORAGE_KEY, viewDimension);
    } catch {
      // Ignore storage quota errors
    }
  }, [cosmicTab, viewDimension, inVR, appExited, adminSecurity.screenLocked, hasAdminPassword]);

  useEffect(() => {
    try {
      localStorage.setItem(WHEEL_2D_STYLE_STORAGE_KEY, wheel2DStyle);
    } catch {
      // Ignore storage quota errors
    }
  }, [wheel2DStyle]);

  useEffect(() => {
    try {
      localStorage.setItem(WHEEL_2D_ORIENT_STORAGE_KEY, wheel2DOrientation);
    } catch {
      // Ignore storage quota errors
    }
  }, [wheel2DOrientation]);

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

  const handleDraftProfileChange = useCallback(
    (patch: Partial<NatalProfile>) => {
      if (profilesLocked) {
        notifyLockedAction('La modification du thème natal');
        return;
      }
      setDraftProfile((prev) => ({ ...prev, ...patch }));
    },
    [profilesLocked, notifyLockedAction]
  );

  const handleSaveProfile = useCallback(() => {
    if (profilesLocked) {
      notifyLockedAction('L’enregistrement des profils');
      return;
    }
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === draftProfile.id);
      if (exists) {
        return prev.map((p) => (p.id === draftProfile.id ? draftProfile : p));
      }
      return [...prev, draftProfile];
    });
    celestialAudio.playSoftTick();
  }, [draftProfile, profilesLocked, notifyLockedAction]);

  const handleCreateNewProfile = useCallback(() => {
    if (profilesLocked) {
      notifyLockedAction('La création de profil');
      return;
    }
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
  }, [profilesLocked, notifyLockedAction]);

  const handleDeleteProfile = useCallback(
    (id: string) => {
      if (profilesLocked) {
        notifyLockedAction('La suppression de profil');
        return;
      }
      setProfiles((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((p) => p.id !== id);
        setActiveProfileId(filtered[0].id);
        setDraftProfile(filtered[0]);
        return filtered;
      });
    },
    [profilesLocked, notifyLockedAction]
  );

  const handleLoadHistoricalProfile = useCallback(
    (histProfile: NatalProfile, destination: 'wheel' | 'summary') => {
      if (profilesLocked) {
        notifyLockedAction('Le chargement depuis la Bibliothèque');
        return;
      }
      setProfiles((prev) => {
        const exists = prev.some((p) => p.id === histProfile.id);
        return exists
          ? prev.map((p) => (p.id === histProfile.id ? histProfile : p))
          : [...prev, histProfile];
      });
      setActiveProfileId(histProfile.id);
      setDraftProfile(histProfile);
      setMode('natal');
      setSelectedPlanet(null);
      setSelectedHouse(null);
      if (destination === 'summary') {
        setShowFullSummary(true);
      } else {
        setShowFullSummary(false);
        setViewDimension('2d');
        setCosmicTab('wheel');
      }
      celestialAudio.playSoftTick();
    },
    [profilesLocked, notifyLockedAction]
  );

  const handleCompareHistoricalSynastry = useCallback(
    (histProfile: NatalProfile) => {
      if (profilesLocked) {
        notifyLockedAction('Le chargement en Synastrie');
        return;
      }
      setProfiles((prev) => {
        const exists = prev.some((p) => p.id === histProfile.id);
        return exists
          ? prev.map((p) => (p.id === histProfile.id ? histProfile : p))
          : [...prev, histProfile];
      });
      setPartnerProfileId(histProfile.id);
      setMode('synastry');
      setShowFullSummary(false);
      setCosmicTab('auxiliary');
      celestialAudio.playSoftTick();
    },
    [profilesLocked, notifyLockedAction]
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
    setHighlightedAspectId(aspectId);
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

  const handleSelectPlanet = useCallback(
    (id: PlanetId, layer: 'base' | 'outer' = 'base') => {
      if (viewDimension === '2d') {
        const target = layer === 'outer' && outerChart ? outerChart : baseChart;
        const found = target.planets.find((p) => p.id === id) ?? null;
        setShowFullSummary(false);
        setSelectedHouse(null);
        setSelectedPlanetLayer(layer);
        setSelectedPlanet(found);
      }
      sceneRef.current?.selectPlanet(id, layer);
    },
    [viewDimension, baseChart, outerChart]
  );

  const handleSelectHouse2D = useCallback(
    (houseNum: number) => {
      const found = baseChart.houses.find((h) => h.house === houseNum) ?? null;
      setShowFullSummary(false);
      setSelectedPlanet(null);
      setSelectedHouse(found);
      sceneRef.current?.selectHouse(houseNum);
    },
    [baseChart.houses]
  );

  const handleWheel2DStyleChange = useCallback((style: Wheel2DStyle) => {
    setWheel2DStyle(style);
    if (ZODIAC_WHEEL_STYLES.some((s) => s.id === style)) {
      setWheelStyle(style as ZodiacWheelStyle);
    }
  }, []);

  const stopWebcamFeed = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const executeQuitApp = useCallback(async () => {
    setQuitConfirmOpen(false);
    setVoiceModeEnabled(false);
    voiceListenerRef.current?.stop();
    esotericIntroMusic.stop();
    stopFrenchSpeech();
    stopWebcamFeed();
    setAudioEnabled(false);
    celestialAudio.enabled = false;
    setTimeSpeedDaysPerSec(0);
    setSrAnimSpeed(0);
    try {
      await sceneRef.current?.exitXRSession();
    } catch {
      // Ignore XR end errors
    }
    sceneRef.current?.setPaused(true);

    try {
      const win = window as unknown as {
        Capacitor?: { Plugins?: { App?: { exitApp?: () => void } } };
      };
      win.Capacitor?.Plugins?.App?.exitApp?.();
      const nav = navigator as unknown as { app?: { exitApp?: () => void } };
      nav.app?.exitApp?.();
    } catch {
      // Ignore non-native environments
    }

    try {
      window.close();
    } catch {
      // Ignore browser close restrictions
    }

    setAppExited(true);
  }, [stopWebcamFeed]);

  const executeQuitAppRef = useRef(executeQuitApp);
  useEffect(() => {
    executeQuitAppRef.current = executeQuitApp;
  }, [executeQuitApp]);

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_FEEDBACK_STORAGE_KEY, voiceFeedbackEnabled ? '1' : '0');
    } catch {
      // Ignore storage quota errors
    }
  }, [voiceFeedbackEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_SEARCH_BTN_STORAGE_KEY, voiceSearchButtonsEnabled ? '1' : '0');
    } catch {
      // Ignore storage quota errors
    }
  }, [voiceSearchButtonsEnabled]);

  const handleOpenConfigGuarded = useCallback(() => {
    if (configLocked) {
      notifyLockedAction('La configuration avancée');
      return;
    }
    setConfigOpen(true);
  }, [configLocked, notifyLockedAction]);

  const handleRequestQuitGuarded = useCallback(() => {
    if (quitLocked) {
      notifyLockedAction('La fermeture du logiciel');
      return;
    }
    setQuitConfirmOpen(true);
  }, [quitLocked, notifyLockedAction]);

  const handleOpenSharePrint = useCallback(() => {
    if (exportsLocked) {
      notifyLockedAction('L’export PDF, E-mail & WhatsApp');
      return;
    }
    const snap = sceneRef.current?.captureSnapshot() ?? null;
    setSnapshotDataUrl(snap);
    setSharePrintOpen(true);
  }, [exportsLocked, notifyLockedAction]);

  const handleTriggerPdfPrint = useCallback(() => {
    if (exportsLocked) {
      notifyLockedAction('L’impression PDF');
      return;
    }
    const snap = sceneRef.current?.captureSnapshot() ?? null;
    if (snap) setSnapshotDataUrl(snap);
    window.setTimeout(() => {
      window.print();
    }, 100);
  }, [exportsLocked, notifyLockedAction]);

  const executeVoiceCommandText = useCallback(
    async (transcript: string) => {
      const parsed = parseVoiceCommand(transcript, profiles);
      let finalFeedback = parsed.feedback;

      if (!parsed.recognized) {
        setVoiceStatusText(finalFeedback);
        return;
      }

      for (const action of parsed.actions) {
        switch (action.type) {
          case 'setMode':
            if (modesLocked) {
              notifyLockedAction('Le changement de mode');
              finalFeedback = 'Changement de mode verrouillé par l’administrateur.';
              break;
            }
            setMode(action.mode);
            if (action.mode === 'live') {
              setTransitDate(new Date());
              setTimeSpeedDaysPerSec(REAL_TIME_DAYS_PER_SEC);
            }
            if (action.mode === 'natal') {
              setDockCollapsed(false);
              setRequestedDockTab((prev) => ({ tab: 'natal', nonce: (prev?.nonce ?? 0) + 1 }));
            } else if (action.mode === 'solarReturn' || action.mode === 'comparative') {
              setDockCollapsed(false);
              setRequestedDockTab((prev) => ({ tab: 'derived', nonce: (prev?.nonce ?? 0) + 1 }));
            }
            break;

          case 'updateBirthProfile': {
            if (profilesLocked) {
              notifyLockedAction('La modification du thème natal');
              finalFeedback = 'Modification du thème verrouillée par l’administrateur.';
              break;
            }
            const p = action.patch;
            setDraftProfile((prev) => {
              const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(prev.birthDateIso);
              const baseY = m ? Number(m[1]) : new Date().getFullYear();
              const baseMo = m ? Number(m[2]) : new Date().getMonth() + 1;
              const baseD = m ? Number(m[3]) : new Date().getDate();
              const baseH = m ? Number(m[4]) : 12;
              const baseMin = m ? Number(m[5]) : 0;

              const y = Math.min(2100, Math.max(1900, p.year ?? baseY));
              const mo = Math.min(12, Math.max(1, p.month ?? baseMo));
              const maxDay = new Date(y, mo, 0).getDate();
              const d = Math.min(maxDay, Math.max(1, p.day ?? baseD));
              const h = Math.min(23, Math.max(0, p.hour ?? baseH));
              const min = Math.min(59, Math.max(0, p.minute ?? baseMin));
              const pad = (n: number) => String(n).padStart(2, '0');
              return {
                ...prev,
                ...(p.name ? { name: p.name } : {}),
                birthDateIso: `${String(y).padStart(4, '0')}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(min)}`,
              };
            });
            break;
          }

          case 'searchBirthPlace': {
            if (profilesLocked) {
              notifyLockedAction('La modification du lieu de naissance');
              finalFeedback = 'Lieu verrouillé par l’administrateur.';
              break;
            }
            const places = await searchPlacesByQuery(action.query);
            if (places.length > 0) {
              const top = places[0];
              setDraftProfile((prev) => ({
                ...prev,
                customCityName: top.name,
                customLat: top.latitude,
                customLon: top.longitude,
              }));
              finalFeedback = `Lieu appliqué : ${top.name}`;
            } else {
              finalFeedback = `Lieu introuvable pour « ${action.query} ».`;
            }
            break;
          }

          case 'searchSrPlace': {
            if (modesLocked) {
              notifyLockedAction('Le lieu de révolution');
              finalFeedback = 'Lieu anniversaire verrouillé par l’administrateur.';
              break;
            }
            const places = await searchPlacesByQuery(action.query);
            if (places.length > 0) {
              setSolarReturnCustomLoc(places[0]);
              finalFeedback = `Lieu anniversaire appliqué : ${places[0].name}`;
            } else {
              finalFeedback = `Lieu anniversaire introuvable pour « ${action.query} ».`;
            }
            break;
          }

          case 'setSrYear':
            if (modesLocked) {
              notifyLockedAction('L’année de révolution');
              break;
            }
            setSolarReturnYear(action.year);
            break;

          case 'saveProfile':
            handleSaveProfile();
            break;

          case 'newProfile':
            handleCreateNewProfile();
            break;

          case 'selectProfile':
            handleSelectProfile(action.profileId);
            break;

          case 'selectPlanet':
            handleSelectPlanet(action.planetId, 'base');
            break;

          case 'selectHouse':
            handleSelectHouse2D(action.house);
            break;

          case 'clearSelection':
            setShowFullSummary(false);
            setSelectedPlanet(null);
            setSelectedHouse(null);
            setHighlightedAspectId(null);
            sceneRef.current?.selectPlanet(null, 'base');
            sceneRef.current?.selectHouse(null);
            sceneRef.current?.highlightAspect(null);
            break;

          case 'setViewDimension':
            setViewDimension(action.dim);
            break;

          case 'setCameraPreset':
            handleCameraPresetChange(action.preset);
            break;

          case 'bringMenuHere':
            sceneRef.current?.bringMenuInFrontOfViewer();
            break;

          case 'setTradition':
            setTradition(action.tradition);
            break;

          case 'setHousesVisible':
            setShowHouses(action.visible);
            sceneRef.current?.setShowHouses(action.visible);
            break;

          case 'setConstellationsVisible':
            setShowConstellations(action.visible);
            sceneRef.current?.setShowConstellations(action.visible);
            break;

          case 'setVRPlaqueVisible':
            setShowVRPlaque(action.visible);
            sceneRef.current?.setShowVRPlaque(action.visible);
            break;

          case 'setSkyAnimations':
            setSkyAnimations((prev) => ({ ...prev, ...action.patch }));
            break;

          case 'setTimePlayback':
            if (modesLocked) {
              notifyLockedAction('La vitesse temporelle');
              break;
            }
            if (action.action === 'pause') {
              setTimeSpeedDaysPerSec(0);
              setSrAnimSpeed(0);
            } else if (action.action === 'realtime') {
              handleResetTransitNow();
            } else {
              setTimeSpeedDaysPerSec(mode === 'live' ? REAL_TIME_DAYS_PER_SEC : 1);
            }
            break;

          case 'stepTime':
            if (modesLocked) {
              notifyLockedAction('La navigation temporelle');
              break;
            }
            setTimeSpeedDaysPerSec(0);
            setTransitDate((prev) => new Date(prev.getTime() + action.deltaMinutes * 60_000));
            break;

          case 'setTransitDate':
            if (modesLocked) {
              notifyLockedAction('La date de transit');
              break;
            }
            setTimeSpeedDaysPerSec(0);
            setTransitDate(action.date);
            break;

          case 'setAudioEnabled':
            setAudioEnabled(action.enabled);
            celestialAudio.enabled = action.enabled;
            break;

          case 'setVoiceFeedback':
            setVoiceFeedbackEnabled(action.enabled);
            break;

          case 'openTab':
            setCosmicTab('auxiliary');
            setDockCollapsed(false);
            setRequestedDockTab((prev) => ({ tab: action.tab, nonce: (prev?.nonce ?? 0) + 1 }));
            break;

          case 'toggleDockCollapsed':
            setDockCollapsed(action.collapsed);
            break;

          case 'openSummary':
            setSelectedPlanet(null);
            setSelectedHouse(null);
            setShowFullSummary(action.open);
            break;

          case 'openAscendant':
            setAscendantModalOpen(true);
            break;

          case 'openQuestGuide':
            setQuestModalOpen(true);
            break;

          case 'openIntro':
            setAutoStartIntroAudio(true);
            setAboutOpen(true);
            break;

          case 'openPdfShare':
            handleOpenSharePrint();
            break;

          case 'enterVR':
            handleEnterVR();
            break;

          case 'enterMR':
            handleEnterMR();
            break;

          case 'stopVoiceListening':
            setVoiceModeEnabled(false);
            break;

          case 'quitApp':
            handleRequestQuitGuarded();
            break;
        }
      }

      setVoiceStatusText(`« ${parsed.transcript} » → ${finalFeedback}`);
      if (voiceFeedbackEnabled && !inVR) {
        speakSingleFrenchUtterance(finalFeedback, { rate: 1.02 });
      }
    },
    [
      profiles,
      mode,
      voiceFeedbackEnabled,
      inVR,
      profilesLocked,
      modesLocked,
      notifyLockedAction,
      handleOpenSharePrint,
      handleRequestQuitGuarded,
      handleSaveProfile,
      handleCreateNewProfile,
      handleSelectProfile,
      handleSelectPlanet,
      handleSelectHouse2D,
      handleCameraPresetChange,
      handleResetTransitNow,
    ]
  );

  const executeVoiceCommandRef = useRef(executeVoiceCommandText);
  useEffect(() => {
    executeVoiceCommandRef.current = executeVoiceCommandText;
  }, [executeVoiceCommandText]);

  const handleToggleVoiceMode = useCallback(() => {
    setVoiceError(null);
    setVoiceModeEnabled((prev) => {
      const next = !prev;
      if (next && !isSpeechRecognitionSupported()) {
        setVoiceError(
          'Reconnaissance vocale indisponible sur ce navigateur. Essayez Chrome, Edge, Android ou Quest Browser.'
        );
        return false;
      }
      if (!next) {
        setVoiceInterimText('');
      } else {
        setVoiceStatusText('Écoute vocale active : parlez librement…');
      }
      return next;
    });
  }, []);

  const toggleVoiceModeRef = useRef(handleToggleVoiceMode);
  useEffect(() => {
    toggleVoiceModeRef.current = handleToggleVoiceMode;
  }, [handleToggleVoiceMode]);

  useEffect(() => {
    if (!voiceModeEnabled || appExited) {
      voiceListenerRef.current?.stop();
      setVoiceListening(false);
      return;
    }

    if (!voiceListenerRef.current) {
      voiceListenerRef.current = new ContinuousVoiceListener();
    }

    const started = voiceListenerRef.current.start({
      lang: 'fr-FR',
      onListeningChange: (listening) => setVoiceListening(listening),
      onInterim: (interim) => setVoiceInterimText(interim),
      onCommand: (finalText) => {
        void executeVoiceCommandRef.current(finalText);
      },
      onError: (msg) => {
        setVoiceError(msg);
      },
    });

    if (!started) {
      setVoiceModeEnabled(false);
    }

    return () => {
      voiceListenerRef.current?.stop();
    };
  }, [voiceModeEnabled, appExited]);

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
    setViewDimension('3d');
    if (webXRSupported) {
      void sceneRef.current?.enterVR();
    } else {
      setQuestModalOpen(true);
    }
  }, [webXRSupported]);

  const handleEnterMR = useCallback(() => {
    setViewDimension('3d');
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

  const sun = baseChart.planets.find((p) => p.id === 'sun');
  const moon = baseChart.planets.find((p) => p.id === 'moon');

  const modeTitle: Record<ChartMode, string> = {
    natal: 'Thème Natal',
    transits: 'Natal + Transits',
    solarReturn: `Rév. Solaire ${solarReturnYear}`,
    lunarReturn: 'Rév. Lunaire',
    planetaryReturn: 'Révolution Planétaire',
    progressions: 'Progressions Sec.',
    solarArc: 'Arc Solaire',
    relocated: `Relocalisé · ${relocatedLoc.name}`,
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

  const activeHouseSystemMeta =
    HOUSE_SYSTEMS.find((h) => h.id === draftProfile.houseSystem) ?? HOUSE_SYSTEMS[0];

  const handleModeSwitchFromSelector = useCallback(
    (nextMode: ChartMode) => {
      if (modesLocked) {
        notifyLockedAction('Le changement de mode astrologique');
        return;
      }
      setMode(nextMode);
      if (nextMode === 'live') {
        setTransitDate(new Date());
        setTimeSpeedDaysPerSec(REAL_TIME_DAYS_PER_SEC);
      }
    },
    [modesLocked, notifyLockedAction]
  );

  const spacetimeNavigatorElement = (
    <SpacetimeNavigator
      transitDate={transitDate}
      timeSpeedDaysPerSec={timeSpeedDaysPerSec}
      realTimeDaysPerSec={REAL_TIME_DAYS_PER_SEC}
      onSetTransitDate={(d) => {
        if (modesLocked) {
          notifyLockedAction('La navigation temporelle');
          return;
        }
        setTimeSpeedDaysPerSec(0);
        setTransitDate(d);
      }}
      onStepMinutes={(deltaMinutes) => {
        if (modesLocked) {
          notifyLockedAction('La navigation temporelle');
          return;
        }
        setTimeSpeedDaysPerSec(0);
        setTransitDate((prev) => new Date(prev.getTime() + deltaMinutes * 60_000));
      }}
      onTimeSpeedChange={(speed) => {
        if (modesLocked) {
          notifyLockedAction('La vitesse temporelle');
          return;
        }
        setTimeSpeedDaysPerSec(speed);
      }}
      onResetNow={() => {
        if (modesLocked) {
          notifyLockedAction('La navigation temporelle');
          return;
        }
        handleResetTransitNow();
      }}
      modeLabel={modeTitle[mode]}
      locked={modesLocked}
      onLockedAttempt={() => notifyLockedAction('Le Spacetime Navigator')}
    />
  );

  return (
    <div
      className={`app-print-shell relative h-full w-full overflow-hidden text-[#f3efe6] ${
        desktopMR && !cameraActive
          ? 'bg-[radial-gradient(circle_at_center,_#162238_0%,_#0b1120_65%,_#080911_100%)]'
          : 'bg-[#080911]'
      }`}
    >
      {/* Celestial Cosmic Insights Background: Subtle Nebulae + Golden Constellation Hairlines */}
      <div aria-hidden="true" className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute top-1/4 -right-24 h-[480px] w-[480px] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-amber-500/8 blur-[120px]" />
        <svg
          className="h-full w-full opacity-[0.22]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <g stroke="#fde68a" strokeOpacity="0.28" strokeWidth="0.7">
            <path d="M120 180 L210 140 L310 210 L265 300 L150 260 Z" />
            <path d="M1080 150 L1180 110 L1290 175 L1235 265 L1340 315" />
            <path d="M85 620 L195 570 L280 650 L410 615" />
            <path d="M1040 670 L1160 610 L1265 695 L1360 640" />
            <circle cx="720" cy="450" r="340" strokeDasharray="3 8" strokeOpacity="0.14" />
          </g>
          <g fill="#fef3c7" fillOpacity="0.45">
            <circle cx="120" cy="180" r="1.8" />
            <circle cx="210" cy="140" r="2.2" />
            <circle cx="310" cy="210" r="1.6" />
            <circle cx="265" cy="300" r="1.8" />
            <circle cx="1080" cy="150" r="2" />
            <circle cx="1180" cy="110" r="1.6" />
            <circle cx="1290" cy="175" r="2.2" />
            <circle cx="1235" cy="265" r="1.7" />
            <circle cx="1340" cy="315" r="1.9" />
            <circle cx="195" cy="570" r="1.9" />
            <circle cx="1160" cy="610" r="2" />
          </g>
        </svg>
      </div>

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

      {/* Isolated WebGL / WebXR Mount Container (active on Wheel tab in 3D or VR) */}
      <div
        ref={canvasMountRef}
        className={
          cosmicTab === 'wheel' && viewDimension === '3d'
            ? 'no-print relative z-10 h-full w-full'
            : 'hidden'
        }
      />

      {/* Top Cosmic Insights Chart Engine Selector & Utility Header */}
      <ChartSelectorBar
        mode={mode}
        onModeChange={handleModeSwitchFromSelector}
        planetaryReturnPointId={planetaryReturnPointId}
        onPlanetaryReturnPointChange={setPlanetaryReturnPointId}
        nativeName={draftProfile.name || 'Profil actif'}
        cityName={birthLocation.cityName}
        houseSystemName={activeHouseSystemMeta.name}
        onOpenConfig={handleOpenConfigGuarded}
        onOpenAbout={() => {
          setAutoStartIntroAudio(true);
          setAboutOpen(true);
        }}
        onOpenSharePrint={handleOpenSharePrint}
        onEnterMR={handleEnterMR}
        onEnterVR={() => {
          setCosmicTab('wheel');
          handleEnterVR();
        }}
        onToggleVoiceMode={handleToggleVoiceMode}
        onRequestQuit={handleRequestQuitGuarded}
        voiceModeEnabled={voiceModeEnabled}
        voiceListening={voiceListening}
        inVR={inVR}
        xrMode={xrMode}
        desktopMR={desktopMR}
        webXRSupported={webXRSupported}
        mrSupported={mrSupported}
        protectionActive={hasAdminPassword && adminSecurity.protectionActive}
        isAdminUnlocked={isAdminUnlocked}
        lockConfig={configLocked}
        lockModes={modesLocked}
        lockExports={exportsLocked}
        lockQuit={quitLocked}
        onOpenAdmin={() => setCosmicTab('admin')}
        isIntroActive={cosmicTab === 'intro'}
        onOpenIntroReplay={() => {
          if (esotericIntroMusic.isPlaying()) {
            esotericIntroMusic.stop();
          }
          setCosmicTab('intro');
        }}
      />

      {lockBannerMsg && !adminSecurity.screenLocked && (
        <div className="no-print fixed top-16 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-full border border-amber-300/45 bg-[#151824]/95 backdrop-blur-xl px-4 py-2 text-xs text-amber-100 shadow-2xl shadow-black/60 max-w-[94vw]">
          <Lock className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          <span className="truncate">{lockBannerMsg}</span>
          <button
            type="button"
            onClick={() => {
              setLockBannerMsg(null);
              setCosmicTab('admin');
            }}
            className="rounded-full bg-amber-400/90 px-3 py-0.5 text-[11px] font-semibold text-slate-950 hover:bg-amber-300 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Déverrouiller Admin
          </button>
        </div>
      )}

      {/* VIEW 1: COSMIC HOME / SYNTHÈSE */}
      {cosmicTab === 'home' && (
        <CosmicHomeView
          mode={mode}
          tradition={tradition}
          natalChart={natalChart}
          baseChart={baseChart}
          outerChart={outerChart}
          comparisonAspects={comparisonAspects}
          profiles={profiles}
          activeProfileId={activeProfileId}
          draftProfile={draftProfile}
          onSelectProfile={handleSelectProfile}
          onOpenWheel={() => setCosmicTab('wheel')}
          onOpenDataSheet={() => setCosmicTab('datasheet')}
          onOpenAuxiliary={() => setCosmicTab('auxiliary')}
          onOpenFullSummary={() => {
            setSelectedPlanet(null);
            setSelectedHouse(null);
            setShowFullSummary(true);
          }}
          onOpenConfig={handleOpenConfigGuarded}
          onInspectTransitDate={(targetDate) => {
            if (modesLocked) {
              notifyLockedAction('La navigation temporelle');
              return;
            }
            setTimeSpeedDaysPerSec(0);
            setTransitDate(targetDate);
            setMode('transits');
            setCosmicTab('wheel');
          }}
        />
      )}

      {/* VIEW 2A: INTERACTIVE 2D WHEEL + SPACETIME NAVIGATOR */}
      {cosmicTab === 'wheel' && viewDimension === '2d' && (
        <div className="no-print">
          <Chart2DCanvas
            baseChart={baseChart}
            outerChart={outerChart}
            comparisonAspects={comparisonAspects}
            tradition={tradition}
            wheel2DStyle={wheel2DStyle}
            onWheel2DStyleChange={handleWheel2DStyleChange}
            wheel2DOrientation={wheel2DOrientation}
            onWheel2DOrientationChange={setWheel2DOrientation}
            signStyle={signStyle}
            onSignStyleChange={setSignStyle}
            skyAnimations={skyAnimations}
            aspectFilter={aspectFilter}
            showHouses={showHouses}
            selectedPlanetId={selectedPlanet?.id ?? null}
            selectedPlanetLayer={selectedPlanetLayer}
            selectedHouseNum={selectedHouse?.house ?? null}
            highlightedAspectId={highlightedAspectId}
            onSelectPlanet={handleSelectPlanet}
            onSelectHouse={handleSelectHouse2D}
            onHighlightAspect={handleHighlightAspect}
            onSwitchTo3D={() => setViewDimension('3d')}
            inspectorOpen={Boolean(showFullSummary || selectedPlanet || selectedHouse)}
            dockCollapsed={dockCollapsed}
            dignityConfig={dignityConfig}
            onDignityConfigChange={(patch) => setDignityConfig((prev) => ({ ...prev, ...patch }))}
            pinnedCatalogPoints={pinnedCatalogPoints}
            spacetimeSlot={spacetimeNavigatorElement}
            solarReturnPanel={
              mode === 'solarReturn'
                ? {
                    year: solarReturnYear,
                    onYearChange: handleSolarReturnYearChangeGuarded,
                    cityId: solarReturnCityId,
                    onCityChange: handleSolarReturnCityChangeGuarded,
                    customLoc: solarReturnCustomLoc,
                    onCustomLocChange: handleSolarReturnCustomLocChangeGuarded,
                    locationName: solarReturnLocation.name,
                    latitude: solarReturnLocation.latitude,
                    longitude: solarReturnLocation.longitude,
                    birthCityName: birthLocation.cityName,
                    onUseBirthLocation: handleUseBirthLocationForSR,
                    exactDate: solarReturnExactDate,
                    modesLocked,
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* VIEW 2B: FLOATING SPACETIME NAVIGATOR & STUDIO 3D BUTTON OVER 3D WEBGL SCENE */}
      {cosmicTab === 'wheel' && viewDimension === '3d' && !inVR && !appExited && (
        <>
          <div className="no-print fixed bottom-[70px] left-1/2 z-20 -translate-x-1/2 w-[min(94vw,820px)]">
            {spacetimeNavigatorElement}
          </div>
          <button
            type="button"
            onClick={() => setShow3DDock((v) => !v)}
            className="no-print fixed left-4 top-20 z-20 flex items-center gap-1.5 rounded-full border border-amber-200/30 bg-[#151824]/80 backdrop-blur-xl px-3.5 py-1.5 text-xs font-medium text-amber-100 hover:border-amber-300/60 transition-all cursor-pointer shadow-lg shadow-black/40"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
            <span>{show3DDock ? 'Masquer Atelier 3D' : 'Atelier 3D / VR'}</span>
          </button>
        </>
      )}

      {/* VIEW 3: CELESTIAL CATALOGUE & CHART POINT DATASHEET */}
      {cosmicTab === 'datasheet' && (
        <CelestialDataSheetView
          baseChart={baseChart}
          pinnedCatalogPoints={pinnedCatalogPoints}
          onTogglePinPoint={handleTogglePinPoint}
          onOpenWheel={() => setCosmicTab('wheel')}
        />
      )}

      {/* VIEW 4: AUXILIARY CHARTS, SYNASTRY, RETURNS & RELOCATED */}
      {cosmicTab === 'auxiliary' && (
        <AuxiliaryChartsView
          mode={mode}
          onModeChange={handleModeSwitchFromSelector}
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
          solarReturnYear={solarReturnYear}
          onSolarReturnYearChange={handleSolarReturnYearChangeGuarded}
          solarReturnCityId={solarReturnCityId}
          onSolarReturnCityChange={handleSolarReturnCityChangeGuarded}
          solarReturnCustomLoc={solarReturnCustomLoc}
          onSolarReturnCustomLocChange={handleSolarReturnCustomLocChangeGuarded}
          solarReturnExactDate={solarReturnExactDate}
          birthLocation={birthLocation}
          onUseBirthLocationForSR={handleUseBirthLocationForSR}
          planetaryReturnPointId={planetaryReturnPointId}
          onPlanetaryReturnPointChange={setPlanetaryReturnPointId}
          planetaryReturnExact={planetaryReturnExact}
          relocatedLoc={relocatedLoc}
          onRelocatedLocChange={setRelocatedLoc}
          baseChart={baseChart}
          outerChart={outerChart}
          comparisonAspects={comparisonAspects}
          onOpenAscendantCalculator={() => setAscendantModalOpen(true)}
          onOpenWheel={() => setCosmicTab('wheel')}
          onOpenFullSummary={() => {
            setSelectedPlanet(null);
            setSelectedHouse(null);
            setShowFullSummary(true);
          }}
          onOpenLibrary={() => setCosmicTab('library')}
          showVoiceSearchButtons={voiceSearchButtonsEnabled}
          profilesLocked={profilesLocked}
          modesLocked={modesLocked}
          onOpenAdmin={() => setCosmicTab('admin')}
        />
      )}

      {/* VIEW 4B: BIBLIOTHÈQUE DES ASTRES (THÈMES HISTORIQUES CÉLÈBRES) */}
      {cosmicTab === 'library' && (
        <HistoricalLibraryView
          activeProfileId={activeProfileId}
          partnerProfileId={partnerProfileId}
          showVoiceSearchButtons={voiceSearchButtonsEnabled}
          onLoadHistoricalProfile={handleLoadHistoricalProfile}
          onCompareInSynastry={handleCompareHistoricalSynastry}
          profilesLocked={profilesLocked}
          onOpenAdmin={() => setCosmicTab('admin')}
        />
      )}

      {/* VIEW 5: DIDACTICIEL INTERACTIF (THÈME NATAL, RÉV. SOLAIRE & TRANSITS) */}
      {cosmicTab === 'tutorial' && (
        <TutorialDidacticielView
          draftProfile={draftProfile}
          natalChart={natalChart}
          solarReturnYear={solarReturnYear}
          solarReturnExactDate={solarReturnExactDate}
          solarReturnLocationName={solarReturnLocation.name}
          transitDate={transitDate}
          comparisonAspectsCount={comparisonAspects.length}
          actions={{
            onOpenNatalEditor: () => {
              if (!modesLocked) setMode('natal');
              setCosmicTab('auxiliary');
            },
            onOpenAscendantCalculator: () => setAscendantModalOpen(true),
            onOpenSolarReturnSetup: () => {
              if (!modesLocked) setMode('solarReturn');
              setCosmicTab('auxiliary');
            },
            onOpenSolarReturnWheel: () => {
              if (!modesLocked) setMode('solarReturn');
              setViewDimension('2d');
              setCosmicTab('wheel');
            },
            onOpenTransitsWheel: () => {
              if (!modesLocked) setMode('transits');
              setViewDimension('2d');
              setCosmicTab('wheel');
            },
            onOpenHomeAlerts: () => setCosmicTab('home'),
            onOpenConfig: handleOpenConfigGuarded,
            onOpenFullSummary: () => {
              setSelectedPlanet(null);
              setSelectedHouse(null);
              setShowFullSummary(true);
            },
            onOpenSharePrint: handleOpenSharePrint,
          }}
        />
      )}

      {/* VIEW 6: AIDE & RÉCAPITULATIF COMPLET DU LOGICIEL */}
      {cosmicTab === 'help' && (
        <SoftwareGuideHelpView
          voiceModeEnabled={voiceModeEnabled}
          actions={{
            onOpenHome: () => setCosmicTab('home'),
            onOpenTutorial: () => setCosmicTab('tutorial'),
            onOpenWheel2D: () => {
              setViewDimension('2d');
              setCosmicTab('wheel');
            },
            onOpenWheel3D: () => {
              setViewDimension('3d');
              setCosmicTab('wheel');
            },
            onOpenDataSheet: () => setCosmicTab('datasheet'),
            onOpenAuxiliary: () => setCosmicTab('auxiliary'),
            onOpenConfig: handleOpenConfigGuarded,
            onOpenFullSummary: () => {
              setSelectedPlanet(null);
              setSelectedHouse(null);
              setShowFullSummary(true);
            },
            onOpenAscendantCalculator: () => setAscendantModalOpen(true),
            onOpenSharePrint: handleOpenSharePrint,
            onOpenAboutAudio: () => {
              setAutoStartIntroAudio(true);
              setAboutOpen(true);
            },
            onOpenQuestGuide: () => setQuestModalOpen(true),
            onToggleVoiceMode: handleToggleVoiceMode,
            onOpenAdmin: () => setCosmicTab('admin'),
            onOpenIntroReplay: () => {
              if (esotericIntroMusic.isPlaying()) {
                esotericIntroMusic.stop();
              }
              setCosmicTab('intro');
            },
          }}
        />
      )}

      {/* VIEW 6B: REVOIR L'ANIMATION (CINÉMATIQUE D'INTRODUCTION 100s) */}
      {cosmicTab === 'intro' && (
        <CosmicIntroReplayView
          appName="URANIE VR"
          onEnterUniverse={() => setCosmicTab('home')}
        />
      )}

      {/* VIEW 7: ADMIN & SÉCURITÉ ANTI-MANIPULATION PAR MOT DE PASSE */}
      {cosmicTab === 'admin' && (
        <AdminSecurityView
          securityState={adminSecurity}
          isAdminUnlocked={isAdminUnlocked}
          profiles={profiles}
          onInitializePassword={handleInitializeAdminPassword}
          onUnlockAdmin={handleUnlockAdmin}
          onLockAdminSession={handleLockAdminSession}
          onActivateProtectionAndClose={handleActivateProtectionAndClose}
          onEnableFullScreenLock={handleEnableFullScreenLock}
          onToggleProtectionActive={handleToggleProtectionActive}
          onUpdatePolicy={handleUpdateSecurityPolicy}
          onChangePassword={handleChangeAdminPassword}
          onDisableSecurity={handleDisableSecurity}
          onClearAuditLog={handleClearAuditLog}
          onOpenWheel={() => setCosmicTab('wheel')}
        />
      )}

      {contextLost && (
        <div className="no-print fixed inset-0 z-40 flex items-center justify-center bg-[#080911]/90 backdrop-blur-xl p-6 text-center">
          <div className="max-w-md rounded-3xl border border-amber-200/30 bg-[#151824]/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-amber-300/80" />
            <h2 className="font-display text-2xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase">
              Contexte 3D interrompu
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Le moteur graphique WebGL est en cours de réinitialisation céleste.
            </p>
          </div>
        </div>
      )}

      {cameraPreset === 'center' && cosmicTab === 'wheel' && viewDimension === '3d' && !inVR && !appExited && (
        <div className="no-print fixed top-16 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-[#080911]/85 backdrop-blur-xl px-4 py-1.5 text-xs text-slate-200 shadow-2xl shadow-black/50">
          <Sparkles className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
          <span className="text-amber-100 font-medium whitespace-nowrap">
            Mode 360° · Glissez pour regarder tout autour · Cliquez sur les astres ou le pupitre 3D
          </span>
          <button
            type="button"
            onClick={() => sceneRef.current?.bringMenuInFrontOfViewer()}
            className="rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-0.5 font-medium text-amber-100 hover:border-amber-300/60 transition-all duration-300 whitespace-nowrap cursor-pointer"
          >
            Menu 3D ici
          </button>
          <button
            type="button"
            onClick={() => handleCameraPresetChange('overview')}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-0.5 font-medium text-slate-200 hover:border-amber-300/30 transition-all duration-300 whitespace-nowrap cursor-pointer"
          >
            Quitter 360°
          </button>
        </div>
      )}

      {(voiceModeEnabled || voiceError) && !appExited && (
        <div
          className={`no-print fixed ${
            cameraPreset === 'center' && viewDimension === '3d' && !inVR ? 'top-28' : 'top-16'
          } left-1/2 z-20 flex -translate-x-1/2 max-w-[92vw] items-center gap-2 rounded-full border ${
            voiceError
              ? 'border-rose-400/50 bg-[#1a0b12]/90 text-rose-200'
              : 'border-white/10 bg-[#07070C]/80 bg-white/[0.03] text-slate-200'
          } px-4 py-1.5 text-xs shadow-2xl shadow-black/50 backdrop-blur-xl`}
        >
          <Mic className={`w-3.5 h-3.5 shrink-0 ${voiceListening ? 'text-rose-400 animate-pulse' : 'text-amber-300/80'}`} />
          <span className="truncate">
            {voiceError
              ? voiceError
              : voiceInterimText
                ? `… ${voiceInterimText}`
                : voiceStatusText || 'Écoute vocale active : dites par exemple « Thème natal de Marie née le 15 mai 1988 à Lyon »'}
          </span>
          {voiceModeEnabled && (
            <button
              type="button"
              onClick={handleToggleVoiceMode}
              className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-slate-200 hover:border-amber-300/30 cursor-pointer shrink-0 transition-all duration-300"
            >
              Couper
            </button>
          )}
        </div>
      )}

      {!isOnline && (
        <div className="no-print fixed top-16 left-5 z-20 rounded-full border border-white/10 bg-[#07070C]/80 bg-white/[0.03] backdrop-blur-xl px-3.5 py-1.5 text-xs text-amber-200 shadow-xl shadow-black/40">
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
          setSelectedPlanet(null);
          setSelectedHouse(null);
          setHighlightedAspectId(null);
          sceneRef.current?.selectPlanet(null, 'base');
          sceneRef.current?.selectHouse(null);
          sceneRef.current?.highlightAspect(null);
        }}
        onSelectPlanet={handleSelectPlanet}
        onSelectHouse={handleSelectHouse2D}
        onHighlightAspect={handleHighlightAspect}
        onOpenSharePrint={handleOpenSharePrint}
      />

      {/* Collapsible Bottom Control Dock (only shown when 3D Studio drawer requested in 3D mode) */}
      {cosmicTab === 'wheel' && viewDimension === '3d' && show3DDock && (
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
          onSolarReturnYearChange={handleSolarReturnYearChangeGuarded}
          solarReturnCityId={solarReturnCityId}
          onSolarReturnCityChange={handleSolarReturnCityChangeGuarded}
          solarReturnCustomLoc={solarReturnCustomLoc}
          onSolarReturnCustomLocChange={handleSolarReturnCustomLocChangeGuarded}
          birthLocationCityName={birthLocation.cityName}
          onUseBirthLocationForSR={handleUseBirthLocationForSR}
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
          viewDimension={viewDimension}
          onViewDimensionChange={setViewDimension}
          wheel2DStyle={wheel2DStyle}
          onWheel2DStyleChange={handleWheel2DStyleChange}
          wheel2DOrientation={wheel2DOrientation}
          onWheel2DOrientationChange={setWheel2DOrientation}
          selectedPlanetId={selectedPlanet?.id ?? null}
          onSelectPlanet={handleSelectPlanet}
          onOpenFullSummary={() => {
            setSelectedPlanet(null);
            setSelectedHouse(null);
            sceneRef.current?.selectPlanet(null, 'base');
            sceneRef.current?.selectHouse(null);
            setShowFullSummary((v) => !v);
          }}
          onOpenAscendantCalculator={() => setAscendantModalOpen(true)}
          onOpenQuestGuide={() => setQuestModalOpen(true)}
          onOpenSharePrint={handleOpenSharePrint}
          onOpenAudioIntro={() => {
            setAutoStartIntroAudio(true);
            setAboutOpen(true);
          }}
          onQuitApp={() => setQuitConfirmOpen(true)}
          voiceEnabled={voiceModeEnabled}
          voiceListening={voiceListening}
          voiceFeedbackEnabled={voiceFeedbackEnabled}
          voiceSearchButtonsEnabled={voiceSearchButtonsEnabled}
          onToggleVoiceMode={handleToggleVoiceMode}
          onToggleVoiceFeedback={() => setVoiceFeedbackEnabled((v) => !v)}
          onToggleVoiceSearchButtons={() => setVoiceSearchButtonsEnabled((v) => !v)}
          onRunVoiceCommandText={(txt) => void executeVoiceCommandText(txt)}
          typography={typography}
          onTypographyChange={setTypography}
          requestedTab={requestedDockTab}
        />
      )}

      {/* Modular Advanced Configuration Drawer (33 Houses, 21 Aspects, Declinations & Chart Styles) */}
      <AdvancedConfigDrawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        baseChart={baseChart}
        houseSystem={draftProfile.houseSystem}
        onHouseSystemChange={(hs) => handleDraftProfileChange({ houseSystem: hs })}
        enabledAspectTypes={enabledAspectTypes}
        onEnabledAspectTypesChange={setEnabledAspectTypes}
        dignityConfig={dignityConfig}
        onDignityConfigChange={(patch) => setDignityConfig((prev) => ({ ...prev, ...patch }))}
        wheel2DStyle={wheel2DStyle}
        onWheel2DStyleChange={handleWheel2DStyleChange}
        wheel2DOrientation={wheel2DOrientation}
        onWheel2DOrientationChange={setWheel2DOrientation}
        signStyle={signStyle}
        onSignStyleChange={setSignStyle}
        typography={typography}
        onTypographyChange={setTypography}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
      />

      {/* Bottom Floating Pill Navigation Bar ("Cosmic Insights") */}
      {!appExited && !inVR && !(adminSecurity.screenLocked && hasAdminPassword) && (
        <FloatingPillNav
          activeTab={cosmicTab}
          onSelectTab={(tab) => {
            if (tab === 'intro' && esotericIntroMusic.isPlaying()) {
              esotericIntroMusic.stop();
            }
            setCosmicTab(tab);
          }}
          onOpenConfig={handleOpenConfigGuarded}
          onOpenFullSummary={() => {
            setSelectedPlanet(null);
            setSelectedHouse(null);
            setShowFullSummary(true);
          }}
          viewDimension={viewDimension}
          onToggleViewDimension={(dim) => {
            setViewDimension(dim);
            setCosmicTab('wheel');
          }}
          protectionLocked={isProtectionEnforced}
          isAdminUnlocked={isAdminUnlocked}
          configLocked={configLocked}
        />
      )}

      {/* Full-Screen Admin Lock Overlay */}
      <ScreenLockOverlay
        open={adminSecurity.screenLocked && hasAdminPassword}
        lockedUntilTs={adminSecurity.lockedUntilTs}
        onUnlock={handleUnlockAdmin}
      />

      <AscendantCalculatorModal
        open={ascendantModalOpen}
        onClose={() => setAscendantModalOpen(false)}
        initialProfile={draftProfile}
        onApplyToProfile={(patch) => {
          handleDraftProfileChange(patch);
        }}
        showVoiceDictation={voiceSearchButtonsEnabled}
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
          setAutoStartIntroAudio(false);
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
        autoStartAudio={autoStartIntroAudio}
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

      {/* Confirmation dialog before quitting Uranie VR */}
      {quitConfirmOpen && !appExited && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#07070C]/80 p-4 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d16]/90 bg-white/[0.03] backdrop-blur-xl p-7 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3">
              <Power className="h-5 w-5 text-amber-300/80 shrink-0" />
              <h2 className="font-display text-xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase">
                Quitter Uranie VR ?
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              La session 3D/VR, la voix et la musique ésotérique seront arrêtées. Sur Android ou
              Meta Quest, l’application se fermera ; sur navigateur PC, vous pourrez fermer l’onglet
              ou relancer à tout moment.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuitConfirmOpen(false)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-300/30 hover:text-white transition-all duration-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void executeQuitApp()}
                className="flex items-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-500/20 px-5 py-2.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/35 hover:border-rose-300/70 transition-all duration-300 cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" />
                <span>Quitter l’application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen peaceful exit screen (fallback when browser blocks window.close) */}
      {appExited && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#07070C] p-6 text-center overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/4 h-[460px] w-[460px] rounded-full bg-purple-900/20 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-indigo-900/15 blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[360px] w-[360px] rounded-full bg-amber-500/5 blur-[120px]" />
          </div>
          <div className="relative max-w-md rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-9 shadow-2xl shadow-black/50">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/30 bg-white/[0.04] text-amber-300/80">
              <Stars className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold bg-gradient-to-r from-amber-100 via-amber-200 to-indigo-200 bg-clip-text text-transparent tracking-widest uppercase">
              Session Uranie VR terminée
            </h1>
            <p className="mt-2 font-serif italic text-base text-amber-100/80">
              Sous la voûte silencieuse des astres
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Le moteur 3D, l’audio céleste et les capteurs sont arrêtés. Vous pouvez fermer cet
              onglet ou cette fenêtre en toute sécurité, ou relancer votre thème astral.
            </p>
            <button
              type="button"
              onClick={() => setAppExited(false)}
              className="mt-7 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/80 via-amber-400/80 to-yellow-500/80 text-slate-950 font-semibold tracking-wide rounded-full px-8 py-3.5 text-sm shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Relancer Uranie VR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
