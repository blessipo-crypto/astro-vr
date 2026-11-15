import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import {
  AstroChart,
  ChartMode,
  ComparisonAspectInfo,
  HouseCusp,
  PlanetId,
  PlanetPosition,
} from '../astro/astroEngine';
import { ZodiacTradition } from '../astro/chineseAstrology';
import { celestialAudio } from './audio';
import {
  DEFAULT_SKY_ANIMATIONS,
  SkyAnimationsConfig,
  SkyAnimationsController,
} from './skyAnimations';
import {
  createAstrolabeFloorTexture,
  createGlowSpriteTexture,
  createGlyphBadgeTexture,
  createPlanetTexture,
  createSaturnRingTexture,
  createStarfieldBackdropTexture,
  createZodiacWheelTextures,
  DiegeticPlaqueRenderer,
  StarfieldBackdropStyle,
  ZODIAC_CONSTELLATION_POINTS,
  ZodiacSignStyle,
  ZodiacWheelStyle,
} from './textures';

export { DEFAULT_SKY_ANIMATIONS };
export type { SkyAnimationsConfig };
export type CameraPreset = 'overview' | 'center' | 'ecliptic' | 'horizon';
export type AspectFilter = 'all' | 'comparison' | 'natal' | 'harmonious' | 'tense' | 'none';
export type SceneDisplayFocus = 'all' | 'planetsOnly' | 'aspectsOnly' | 'housesOnly';

export type XRSessionModeKind = 'none' | 'vr' | 'mr';

export interface SceneCallbacks {
  onSelectPlanet: (planet: PlanetPosition | null, layer: 'base' | 'outer') => void;
  onSelectHouse: (house: HouseCusp | null) => void;
  onWebXRSupportChange: (supported: boolean) => void;
  onMRSupportChange: (supported: boolean) => void;
  onVRSessionChange: (inVR: boolean) => void;
  onXRModeChange: (mode: XRSessionModeKind) => void;
  onVRTimeStep?: (deltaMinutes: number) => void;
}

interface PlanetNode {
  data: PlanetPosition;
  group: THREE.Group;
  sphere: THREE.Mesh;
  ringCollar: THREE.Mesh;
  pointerRod: THREE.Mesh;
  badge: THREE.Sprite;
  collider: THREE.Mesh;
  currentAngle: number;
  targetAngle: number;
  currentY: number;
  targetY: number;
  initialized: boolean;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();

const ZODIAC_RADIUS = 11.4;
const CHART_Y = 1.65;
const OUTER_LAYER_Y = 1.45;

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

function shortestAngleDiff(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function eclipticLonToWorldAngle(lonDeg: number, ascendantDeg: number): number {
  return degToRad(lonDeg - ascendantDeg + 180);
}

function angleToXZ(angleRad: number, radius: number): { x: number; z: number } {
  return {
    x: Math.cos(angleRad) * radius,
    z: -Math.sin(angleRad) * radius,
  };
}

export class AstrologyScene {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private userRig!: THREE.Group;
  private controls!: OrbitControls;

  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private lastHoverRaycast = 0;
  private interactables: THREE.Object3D[] = [];

  private holoRoot = new THREE.Group();
  private platformGroup = new THREE.Group();
  private chartGroup = new THREE.Group();
  private zodiacBandGroup = new THREE.Group();
  private zodiacCylinder!: THREE.Mesh;
  private zodiacCollarMesh!: THREE.Mesh;
  private skyDomeMesh!: THREE.Mesh;
  private zodiacTextureCache = new Map<
    string,
    { bandTexture: THREE.CanvasTexture; collarTexture: THREE.CanvasTexture }
  >();
  private skyTextureCache = new Map<StarfieldBackdropStyle, THREE.CanvasTexture>();
  private tradition: ZodiacTradition = 'western';
  private wheelStyle: ZodiacWheelStyle = 'astrolabe';
  private signStyle: ZodiacSignStyle = 'figurative';
  private starfieldStyle: StarfieldBackdropStyle = 'milkyway';
  private targetZodiacRotY = 0;
  private zodiacInitialized = false;

  private houseGroup = new THREE.Group();
  private planetsGroup = new THREE.Group();
  private outerPlanetsGroup = new THREE.Group();
  private aspectsGroup = new THREE.Group();
  private starDomeGroup = new THREE.Group();
  private skyAnimations!: SkyAnimationsController;
  private armillaryOuterGroup = new THREE.Group();

  private outerAscMarker!: THREE.Group;
  private outerAscCurrentAngle = 0;
  private outerAscTargetAngle = 0;

  private planetNodes = new Map<PlanetId, PlanetNode>();
  private outerPlanetNodes = new Map<PlanetId, PlanetNode>();
  private houseBadgeSprites: THREE.Sprite[] = [];

  private baseChart: AstroChart | null = null;
  private outerChart: AstroChart | null = null;
  private comparisonAspects: ComparisonAspectInfo[] = [];
  private chartMode: ChartMode = 'natal';

  private selectedPlanetId: PlanetId | null = null;
  private selectedPlanetLayer: 'base' | 'outer' = 'base';
  private selectedHouseNum: number | null = null;
  private hoveredObject: THREE.Object3D | null = null;
  private highlightedAspectId: string | null = null;

  private aspectFilter: AspectFilter = 'all';
  private displayFocus: SceneDisplayFocus = 'all';
  private showHouses = true;
  private showConstellations = true;
  private showVRPlaque = true;
  private mrScale = 0.14;
  private activeXRMode: XRSessionModeKind = 'none';
  private desktopMRMode = false;

  private cameraTransitionActive = false;
  private targetCamPos = new THREE.Vector3(0, 11.5, 16.5);
  private targetLookAt = new THREE.Vector3(0, 1.4, 0);

  private vrSession: XRSession | null = null;
  private controllers: THREE.XRTargetRaySpace[] = [];
  private controllerRays: THREE.Line[] = [];
  private controllerReticles: THREE.Mesh[] = [];
  private lastVrTimeStepMs = 0;

  private plaqueRenderer!: DiegeticPlaqueRenderer;
  private vrLecternGroup = new THREE.Group();

  private texturesToDispose: THREE.Texture[] = [];
  private maxAniso = 4;
  private maxTexSize = 4096;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    this.initRenderer();
    this.initScene();
    this.initLightingAndEnv();
    this.initObservatoryPlatform();
    this.initStarDome();
    this.initArmillaryRings();
    this.initVRLectern();
    this.initControls();
    this.initWebXR();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.startLoop();
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x05070e, 1);
    this.renderer.setSize(
      this.container.clientWidth || window.innerWidth,
      this.container.clientHeight || window.innerHeight
    );
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.xr.enabled = true;
    this.renderer.xr.setReferenceSpaceType('local-floor');

    this.maxAniso = this.isSoftwareGl
      ? 1
      : Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.maxTexSize = this.renderer.capabilities.maxTextureSize || 4096;
    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060d);
    this.scene.fog = new THREE.FogExp2(0x05070e, 0.0052);

    const aspect =
      (this.container.clientWidth || window.innerWidth) /
      (this.container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 260);

    this.userRig = new THREE.Group();
    this.userRig.position.set(0, 0, 0);
    this.camera.position.set(0, 11.5, 16.5);
    this.userRig.add(this.camera);
    this.scene.add(this.userRig);

    this.chartGroup.position.set(0, CHART_Y, 0);
    this.chartGroup.add(this.zodiacBandGroup);
    this.chartGroup.add(this.houseGroup);
    this.chartGroup.add(this.planetsGroup);
    this.chartGroup.add(this.outerPlanetsGroup);
    this.chartGroup.add(this.aspectsGroup);

    this.holoRoot.add(this.chartGroup);
    this.holoRoot.add(this.armillaryOuterGroup);
    this.scene.add(this.holoRoot);
    this.scene.add(this.starDomeGroup);
  }

  private initLightingAndEnv() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight(0x88b4ff, 0x1e1810, 0.65);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.55);
    keyLight.position.set(14, 22, 12);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 55;
      const d = 14;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    rimLight.position.set(-16, 10, -14);
    this.scene.add(rimLight);

    const centerLight = new THREE.PointLight(0xffd27a, 2.4, 26, 1.6);
    centerLight.position.set(0, CHART_Y + 0.5, 0);
    this.scene.add(centerLight);
  }

  private initObservatoryPlatform() {
    const platformGroup = this.platformGroup;

    const floorTex = createAstrolabeFloorTexture(this.maxAniso);
    this.texturesToDispose.push(floorTex);

    const deckGeo = new THREE.CylinderGeometry(13.2, 13.6, 0.45, 72);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x0b101d,
      roughness: 0.72,
      metalness: 0.18,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = -0.225;
    deck.receiveShadow = true;
    platformGroup.add(deck);

    const dialGeo = new THREE.CircleGeometry(12.8, 72);
    const dialMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.48,
      metalness: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.015;
    dial.receiveShadow = true;
    platformGroup.add(dial);

    const brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.25,
    });
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.11, 16, 96), brassMat);
    outerRim.rotation.x = Math.PI / 2;
    outerRim.position.y = 0.02;
    platformGroup.add(outerRim);

    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.06, 12, 64), brassMat);
    innerRim.rotation.x = Math.PI / 2;
    innerRim.position.y = 0.03;
    platformGroup.add(innerRim);

    const shadowTex = createGlowSpriteTexture();
    this.texturesToDispose.push(shadowTex);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 6.5), contactMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.025;
    platformGroup.add(contactPlane);

    const basePlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.78, 0.32, 32), deckMat);
    basePlinth.position.y = 0.16;
    platformGroup.add(basePlinth);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.14, CHART_Y - 0.32, 24),
      brassMat
    );
    stem.position.y = 0.32 + (CHART_Y - 0.32) * 0.5;
    platformGroup.add(stem);

    const earthCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x2563eb,
        roughness: 0.25,
        metalness: 0.15,
        clearcoat: 0.85,
        emissive: 0x0f2b66,
        emissiveIntensity: 0.45,
      })
    );
    earthCore.position.y = CHART_Y;
    this.holoRoot.add(earthCore);

    this.scene.add(platformGroup);
  }

  private getOrCreateSkyTexture(style: StarfieldBackdropStyle): THREE.CanvasTexture {
    const cached = this.skyTextureCache.get(style);
    if (cached) return cached;
    const tex = createStarfieldBackdropTexture(style, this.maxAniso);
    this.skyTextureCache.set(style, tex);
    this.texturesToDispose.push(tex);
    return tex;
  }

  private getOrCreateZodiacTextures(
    style: ZodiacWheelStyle,
    signStyle: ZodiacSignStyle,
    tradition: ZodiacTradition
  ) {
    const key = `${tradition}:${style}:${signStyle}`;
    const cached = this.zodiacTextureCache.get(key);
    if (cached) return cached;
    const pair = createZodiacWheelTextures({
      style,
      signStyle,
      tradition,
      maxAniso: this.maxAniso,
      maxTexSize: this.maxTexSize,
    });
    this.zodiacTextureCache.set(key, pair);
    this.texturesToDispose.push(pair.bandTexture, pair.collarTexture);
    return pair;
  }

  private initStarDome() {
    // 1. Realistic Equirectangular Sky Dome (Milky Way, Nebulae, Auroras, Deep Night)
    const skyTex = this.getOrCreateSkyTexture(this.starfieldStyle);
    const skyGeo = new THREE.SphereGeometry(125, 64, 40);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    this.starDomeGroup.add(this.skyDomeMesh);

    // 2. 3D Parallax Field Stars concentrated realistically along the tilted Galactic Plane
    const starCount = 1900;
    const starGeo = new THREE.OctahedronGeometry(0.075, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    // Planckian spectral star classes (O/B blue-white -> G solar -> K/M amber-red)
    const spectralPalette = [0xffffff, 0xcbe4ff, 0xffe8c2, 0xa5d8ff, 0xfcd9a8, 0xfecaca];

    let seed = 4219;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const galacticTilt = 0.96;
    const galacticPhase = 1.1;

    for (let i = 0; i < starCount; i++) {
      const inMilkyWayBand = rand() < 0.56;
      const theta = rand() * Math.PI * 2;
      let phi: number;
      if (inMilkyWayBand) {
        const galLat = Math.atan(Math.tan(galacticTilt) * Math.sin(theta + galacticPhase));
        const spread = (rand() + rand() - 1) * 0.28;
        phi = Math.PI * 0.5 - (galLat + spread);
      } else {
        phi = Math.acos(2 * rand() - 1);
      }

      const r = 46 + rand() * 38;
      const y = r * Math.cos(phi);
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        Math.max(-10, y),
        r * Math.sin(phi) * Math.sin(theta)
      );
      const s = rand() > 0.95 ? 1.1 + rand() * 0.8 : 0.35 + rand() * 0.85;
      dummy.scale.setScalar(s);
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);

      color.setHex(spectralPalette[Math.floor(rand() * spectralPalette.length)]);
      stars.setColorAt(i, color);
    }

    stars.instanceMatrix.needsUpdate = true;
    if (stars.instanceColor) stars.instanceColor.needsUpdate = true;
    stars.computeBoundingSphere();
    this.starDomeGroup.add(stars);

    // 3. Bright 1st-Magnitude Navigation Stars with soft diffraction halos
    const glowTex = createGlowSpriteTexture();
    this.texturesToDispose.push(glowTex);
    for (let b = 0; b < 55; b++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(0.15 + rand() * 0.82); // upper hemisphere
      const r = 44 + rand() * 18;
      const col = spectralPalette[Math.floor(rand() * spectralPalette.length)];
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: col,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      );
      spr.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      const sc = 0.85 + rand() * 0.95;
      spr.scale.set(sc, sc, 1);
      this.starDomeGroup.add(spr);
    }

    // 4. Recognizable Distant Zodiac Constellation Asterisms
    const constMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.24,
      fog: false,
    });
    const eclipticRefPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      eclipticRefPts.push(
        new THREE.Vector3(Math.cos(a) * 38, CHART_Y + Math.sin(a * 2) * 1.2, Math.sin(a) * 38)
      );
    }
    this.starDomeGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(eclipticRefPts), constMat)
    );

    for (let c = 0; c < 12; c++) {
      const baseAngle = (c / 12) * Math.PI * 2;
      const pattern = ZODIAC_CONSTELLATION_POINTS[c] ?? [];
      const pts: THREE.Vector3[] = [];
      const r = 38;
      for (const [px, py] of pattern) {
        const a = baseAngle + (px - 0.5) * 0.42;
        const y = CHART_Y + 3.2 + (0.5 - py) * 7.5;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r));
      }
      if (pts.length > 1) {
        this.starDomeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), constMat));
      }
    }

    // 5. Subtle animated celestial phenomena (shooting stars, compact nebulae, northern aurora)
    this.skyAnimations = new SkyAnimationsController();
    this.starDomeGroup.add(this.skyAnimations.rootGroup);
  }

  private buildAnnularCollarGeometry(innerR: number, outerR: number, segments: number): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Outer vertex (v = 1)
      positions.push(outerR * sinT, 0, outerR * cosT);
      normals.push(0, 1, 0);
      uvs.push(u, 1);

      // Inner vertex (v = 0)
      positions.push(innerR * sinT, 0, innerR * cosT);
      normals.push(0, 1, 0);
      uvs.push(u, 0);
    }

    for (let i = 0; i < segments; i++) {
      const iOut = i * 2;
      const iIn = i * 2 + 1;
      const nOut = (i + 1) * 2;
      const nIn = (i + 1) * 2 + 1;

      indices.push(iOut, nOut, iIn);
      indices.push(nOut, nIn, iIn);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  private initArmillaryRings() {
    const { bandTexture, collarTexture } = this.getOrCreateZodiacTextures(
      this.wheelStyle,
      this.signStyle,
      this.tradition
    );

    const bandGeo = new THREE.CylinderGeometry(ZODIAC_RADIUS, ZODIAC_RADIUS, 1.38, 144, 1, true);
    const bandMat = new THREE.MeshStandardMaterial({
      map: bandTexture,
      roughness: 0.36,
      metalness: 0.45,
      side: THREE.DoubleSide,
    });
    this.zodiacCylinder = new THREE.Mesh(bandGeo, bandMat);
    this.zodiacBandGroup.add(this.zodiacCylinder);

    // Horizontal beveled 360° degree collar attached inside the cylinder for crisp overhead reading
    const collarGeo = this.buildAnnularCollarGeometry(ZODIAC_RADIUS - 1.45, ZODIAC_RADIUS - 0.01, 144);
    const collarMat = new THREE.MeshStandardMaterial({
      map: collarTexture,
      roughness: 0.34,
      metalness: 0.46,
      side: THREE.DoubleSide,
    });
    this.zodiacCollarMesh = new THREE.Mesh(collarGeo, collarMat);
    this.zodiacCollarMesh.position.y = -0.68;
    this.zodiacCylinder.add(this.zodiacCollarMesh);

    const brassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.94,
      roughness: 0.18,
      clearcoat: 0.35,
    });
    const topRim = new THREE.Mesh(new THREE.TorusGeometry(ZODIAC_RADIUS, 0.055, 14, 144), brassMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 0.7;
    this.zodiacBandGroup.add(topRim);

    const botRim = new THREE.Mesh(new THREE.TorusGeometry(ZODIAC_RADIUS, 0.055, 14, 144), brassMat);
    botRim.rotation.x = Math.PI / 2;
    botRim.position.y = -0.7;
    this.zodiacBandGroup.add(botRim);

    const innerCollarRim = new THREE.Mesh(
      new THREE.TorusGeometry(ZODIAC_RADIUS - 1.45, 0.032, 12, 144),
      brassMat
    );
    innerCollarRim.rotation.x = Math.PI / 2;
    innerCollarRim.position.y = -0.68;
    this.zodiacBandGroup.add(innerCollarRim);

    // Subtle elevated cyan outer comparison ring
    const outerRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(ZODIAC_RADIUS - 0.45, 0.024, 10, 96),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.48,
      })
    );
    outerRingMesh.rotation.x = Math.PI / 2;
    outerRingMesh.position.y = OUTER_LAYER_Y;
    this.outerPlanetsGroup.add(outerRingMesh);

    // Outer ASC indicator marker (for Solar Return or Transit ASC)
    this.outerAscMarker = new THREE.Group();
    const ascPin = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.45, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ascPin.rotation.z = -Math.PI / 2;
    ascPin.position.set(ZODIAC_RADIUS - 0.55, OUTER_LAYER_Y, 0);
    this.outerAscMarker.add(ascPin);
    const ascTex = createGlyphBadgeTexture('ASC', 'Ext.', '#38bdf8');
    this.texturesToDispose.push(ascTex);
    const ascSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: ascTex, transparent: true, depthWrite: false })
    );
    ascSprite.position.set(ZODIAC_RADIUS - 0.55, OUTER_LAYER_Y + 0.52, 0);
    ascSprite.scale.set(1.2, 0.6, 1);
    this.outerAscMarker.add(ascSprite);
    this.outerPlanetsGroup.add(this.outerAscMarker);

    const armillaryMat = new THREE.MeshPhysicalMaterial({
      color: 0xb8923a,
      metalness: 0.9,
      roughness: 0.28,
      transparent: true,
      opacity: 0.72,
    });

    const meridianRing = new THREE.Mesh(new THREE.TorusGeometry(12.25, 0.045, 12, 96), armillaryMat);
    meridianRing.position.y = CHART_Y;
    this.armillaryOuterGroup.add(meridianRing);

    const colureRing = new THREE.Mesh(new THREE.TorusGeometry(12.25, 0.045, 12, 96), armillaryMat);
    colureRing.rotation.y = Math.PI / 2;
    colureRing.position.y = CHART_Y;
    this.armillaryOuterGroup.add(colureRing);

    const eqRing = new THREE.Mesh(new THREE.TorusGeometry(12.05, 0.032, 10, 96), armillaryMat);
    eqRing.rotation.x = Math.PI / 2 + degToRad(23.44);
    eqRing.position.y = CHART_Y;
    this.armillaryOuterGroup.add(eqRing);

    const angleLabels: Array<{ text: string; angle: number; color: string }> = [
      { text: 'ASC', angle: Math.PI, color: '#fbbf24' },
      { text: 'DSC', angle: 0, color: '#94a3b8' },
      { text: 'MC', angle: Math.PI / 2, color: '#38bdf8' },
      { text: 'IC', angle: (3 * Math.PI) / 2, color: '#94a3b8' },
    ];
    angleLabels.forEach(({ text, angle, color }) => {
      const pos = angleToXZ(angle, 12.6);
      const tex = createGlyphBadgeTexture(text, '', color);
      this.texturesToDispose.push(tex);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
      );
      sprite.position.set(pos.x, CHART_Y + 1.25, pos.z);
      sprite.scale.set(1.6, 0.8, 1);
      this.holoRoot.add(sprite);
    });
  }

  private initVRLectern() {
    this.plaqueRenderer = new DiegeticPlaqueRenderer(this.maxAniso);
    this.texturesToDispose.push(this.plaqueRenderer.texture);

    const frameMat = new THREE.MeshPhysicalMaterial({
      color: 0xc59b38,
      metalness: 0.9,
      roughness: 0.25,
    });
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.plaqueRenderer.texture,
    });

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.075), screenMat);
    screen.position.z = 0.02;
    this.vrLecternGroup.add(screen);

    const backing = new THREE.Mesh(new THREE.BoxGeometry(2.26, 1.18, 0.03), frameMat);
    this.vrLecternGroup.add(backing);

    this.vrLecternGroup.position.set(0, 1.15, 4.9);
    this.vrLecternGroup.rotation.x = -0.35;
    this.scene.add(this.vrLecternGroup);
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 0.4;
    this.controls.maxDistance = 32;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.target.set(0, 1.4, 0);

    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });
  }

  private async initWebXR() {
    if (typeof navigator !== 'undefined' && 'xr' in navigator && navigator.xr) {
      try {
        const [vrOk, mrOk] = await Promise.all([
          navigator.xr.isSessionSupported('immersive-vr').catch(() => false),
          navigator.xr.isSessionSupported('immersive-ar').catch(() => false),
        ]);
        this.callbacks.onWebXRSupportChange(vrOk);
        this.callbacks.onMRSupportChange(mrOk);
      } catch {
        this.callbacks.onWebXRSupportChange(false);
        this.callbacks.onMRSupportChange(false);
      }
    } else {
      this.callbacks.onWebXRSupportChange(false);
      this.callbacks.onMRSupportChange(false);
    }

    const controllerModelFactory = new XRControllerModelFactory();

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', () => this.onXRSelectStart(controller));
      this.userRig.add(controller);
      this.controllers.push(controller);

      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -18),
      ]);
      const rayMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
      });
      const rayLine = new THREE.Line(rayGeo, rayMat);
      controller.add(rayLine);
      this.controllerRays.push(rayLine);

      const reticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      reticle.visible = false;
      this.scene.add(reticle);
      this.controllerReticles.push(reticle);

      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      this.userRig.add(grip);
    }
  }

  private applyVisualBackdropState() {
    const isMR = this.activeXRMode === 'mr' || this.desktopMRMode;
    if (isMR) {
      this.scene.background = null;
      this.scene.fog = null;
      this.renderer.setClearColor(0x000000, 0);
      this.platformGroup.visible = false;
      this.starDomeGroup.visible = false;

      if (this.activeXRMode === 'mr') {
        this.holoRoot.scale.setScalar(this.mrScale);
        this.holoRoot.position.set(0, 0.92, -1.75);
        this.vrLecternGroup.position.set(0, 0.72, -0.82);
        this.vrLecternGroup.scale.setScalar(0.55);
      } else {
        this.holoRoot.scale.setScalar(1);
        this.holoRoot.position.set(0, 0, 0);
        this.vrLecternGroup.position.set(0, 1.15, 4.9);
        this.vrLecternGroup.scale.setScalar(1);
      }
    } else {
      this.scene.background = new THREE.Color(0x04060d);
      this.scene.fog = new THREE.FogExp2(0x05070e, 0.0052);
      this.renderer.setClearColor(0x05070e, 1);
      this.platformGroup.visible = true;
      this.starDomeGroup.visible = this.showConstellations;
      this.holoRoot.scale.setScalar(1);
      this.holoRoot.position.set(0, 0, 0);
      this.vrLecternGroup.position.set(0, 1.15, 4.9);
      this.vrLecternGroup.scale.setScalar(1);
    }
  }

  public setMRScale(scale: number) {
    this.mrScale = scale;
    if (this.activeXRMode === 'mr') {
      this.holoRoot.scale.setScalar(scale);
    }
  }

  public setDesktopMRMode(enabled: boolean) {
    this.desktopMRMode = enabled;
    this.applyVisualBackdropState();
  }

  public async enterVR(): Promise<boolean> {
    if (!navigator.xr) return false;
    if (this.vrSession) {
      await this.vrSession.end();
      return false;
    }
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      this.vrSession = session;
      this.activeXRMode = 'vr';
      session.addEventListener('end', () => {
        this.vrSession = null;
        this.activeXRMode = 'none';
        this.userRig.position.set(0, 0, 0);
        this.camera.position.set(0, 11.5, 16.5);
        this.controls.enabled = true;
        this.applyVisualBackdropState();
        this.callbacks.onVRSessionChange(false);
        this.callbacks.onXRModeChange('none');
      });
      this.controls.enabled = false;
      this.userRig.position.set(0, 0, 7.6);
      this.applyVisualBackdropState();
      await this.renderer.xr.setSession(session);
      this.callbacks.onVRSessionChange(true);
      this.callbacks.onXRModeChange('vr');
      return true;
    } catch {
      return false;
    }
  }

  public async enterMR(): Promise<boolean> {
    if (!navigator.xr) return false;
    if (this.vrSession) {
      await this.vrSession.end();
      return false;
    }
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'hit-test'],
      });
      this.vrSession = session;
      this.activeXRMode = 'mr';
      session.addEventListener('end', () => {
        this.vrSession = null;
        this.activeXRMode = 'none';
        this.userRig.position.set(0, 0, 0);
        this.camera.position.set(0, 11.5, 16.5);
        this.controls.enabled = true;
        this.applyVisualBackdropState();
        this.callbacks.onVRSessionChange(false);
        this.callbacks.onXRModeChange('none');
      });
      this.controls.enabled = false;
      this.userRig.position.set(0, 0, 0);
      this.applyVisualBackdropState();
      await this.renderer.xr.setSession(session);
      this.callbacks.onVRSessionChange(true);
      this.callbacks.onXRModeChange('mr');
      return true;
    } catch {
      return false;
    }
  }

  public updateCharts(options: {
    mode: ChartMode;
    baseChart: AstroChart;
    outerChart: AstroChart | null;
    comparisonAspects: ComparisonAspectInfo[];
  }) {
    const { mode, baseChart, outerChart, comparisonAspects } = options;
    this.chartMode = mode;
    this.baseChart = baseChart;
    this.outerChart = outerChart;
    this.comparisonAspects = comparisonAspects;

    const zeroLonAngle = eclipticLonToWorldAngle(0, baseChart.ascendant);
    this.targetZodiacRotY = zeroLonAngle + Math.PI / 2;
    if (!this.zodiacInitialized) {
      this.zodiacCylinder.rotation.y = this.targetZodiacRotY;
      this.zodiacInitialized = true;
    }

    this.rebuildHouses(baseChart);
    this.syncPlanetLayer(baseChart, this.planetNodes, this.planetsGroup, 'base', 0);

    if (outerChart) {
      this.outerPlanetsGroup.visible = true;
      this.syncPlanetLayer(outerChart, this.outerPlanetNodes, this.outerPlanetsGroup, 'outer', OUTER_LAYER_Y);
      this.outerAscTargetAngle = eclipticLonToWorldAngle(outerChart.ascendant, baseChart.ascendant);
      this.outerAscMarker.rotation.y = this.outerAscTargetAngle;
    } else {
      this.outerPlanetsGroup.visible = false;
      if (this.selectedPlanetLayer === 'outer') {
        this.selectedPlanetId = null;
        this.selectedPlanetLayer = 'base';
      }
    }

    this.rebuildAspects();
    this.applyDisplayFocus();
    this.refreshSelectionVisuals();
    this.updatePlaque();
  }

  private rebuildHouses(chart: AstroChart) {
    while (this.houseGroup.children.length > 0) {
      this.houseGroup.remove(this.houseGroup.children[0]);
    }
    this.houseBadgeSprites = [];
    this.interactables = this.interactables.filter((o) => o.userData.kind !== 'house');

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.42,
    });
    const angleMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
    });

    chart.houses.forEach((house, idx) => {
      const angle = eclipticLonToWorldAngle(house.longitude, chart.ascendant);
      const inner = angleToXZ(angle, 1.35);
      const outer = angleToXZ(angle, ZODIAC_RADIUS - 0.15);
      const isAngular = idx === 0 || idx === 3 || idx === 6 || idx === 9;

      const pts = [
        new THREE.Vector3(inner.x, -0.04, inner.z),
        new THREE.Vector3(outer.x, -0.04, outer.z),
      ];
      this.houseGroup.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), isAngular ? angleMat : lineMat)
      );

      const nextLon = chart.houses[(idx + 1) % 12].longitude;
      let span = nextLon - house.longitude;
      if (span < 0) span += 360;
      const midAngle = eclipticLonToWorldAngle(house.longitude + span * 0.5, chart.ascendant);
      const midPos = angleToXZ(midAngle, ZODIAC_RADIUS - 0.95);

      const tex = createGlyphBadgeTexture(house.roman, '', '#e7cfa0');
      this.texturesToDispose.push(tex);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false })
      );
      sprite.position.set(midPos.x, 0.42, midPos.z);
      sprite.scale.set(1.05, 0.52, 1);
      this.houseGroup.add(sprite);
      this.houseBadgeSprites.push(sprite);

      const proxy = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      proxy.position.copy(sprite.position);
      proxy.layers.set(1);
      proxy.userData = { kind: 'house', house };
      this.houseGroup.add(proxy);
      this.interactables.push(proxy);
    });

    this.houseGroup.visible = this.showHouses;
  }

  private syncPlanetLayer(
    chart: AstroChart,
    nodeMap: Map<PlanetId, PlanetNode>,
    targetGroup: THREE.Group,
    layer: 'base' | 'outer',
    baseY: number
  ) {
    const isOuter = layer === 'outer';
    const collarHex = isOuter ? 0x38bdf8 : 0xd4af37;
    const scaleMult = isOuter ? 0.86 : 1.0;

    if (nodeMap.size === 0) {
      chart.planets.forEach((p) => {
        const group = new THREE.Group();

        if (!isOuter) {
          const trackGeo = new THREE.TorusGeometry(p.orbitRadius, 0.012, 8, 96);
          const trackMat = new THREE.MeshBasicMaterial({
            color: p.colorHex,
            transparent: true,
            opacity: 0.2,
          });
          const orbitTrack = new THREE.Mesh(trackGeo, trackMat);
          orbitTrack.rotation.x = Math.PI / 2;
          targetGroup.add(orbitTrack);
        }

        const tex = createPlanetTexture(p.id, this.maxAniso);
        this.texturesToDispose.push(tex);
        const sphereMat =
          p.id === 'sun'
            ? new THREE.MeshStandardMaterial({
                map: tex,
                emissive: 0xffae22,
                emissiveMap: tex,
                emissiveIntensity: isOuter ? 1.05 : 1.35,
                roughness: 0.4,
                metalness: 0.0,
              })
            : new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.62,
                metalness: 0.12,
                emissive: p.id === 'northNode' ? 0x5b21b6 : isOuter ? 0x082f49 : 0x000000,
                emissiveIntensity: p.id === 'northNode' ? 0.55 : isOuter ? 0.35 : 0,
              });
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(p.visualRadius * scaleMult, 28, 20),
          sphereMat
        );
        sphere.castShadow = !this.isSoftwareGl && p.id !== 'sun' && !isOuter;
        group.add(sphere);

        if (p.id === 'saturn' || p.id === 'uranus') {
          const innerR = p.visualRadius * scaleMult * 1.38;
          const outerR = p.visualRadius * scaleMult * (p.id === 'saturn' ? 2.35 : 1.9);
          const ringGeo = new THREE.RingGeometry(innerR, outerR, 48);
          const posAttr = ringGeo.attributes.position;
          const uvAttr = ringGeo.attributes.uv;
          for (let k = 0; k < posAttr.count; k++) {
            const x = posAttr.getX(k);
            const y = posAttr.getY(k);
            const r = Math.hypot(x, y);
            uvAttr.setXY(k, (r - innerR) / (outerR - innerR), 0.5);
          }
          const ringTex = createSaturnRingTexture(this.maxAniso, p.id === 'uranus');
          this.texturesToDispose.push(ringTex);
          const ringMesh = new THREE.Mesh(
            ringGeo,
            new THREE.MeshStandardMaterial({
              map: ringTex,
              transparent: true,
              side: THREE.DoubleSide,
              roughness: 0.6,
              depthWrite: false,
            })
          );
          ringMesh.rotation.x = p.id === 'saturn' ? Math.PI * 0.36 : Math.PI * 0.08;
          ringMesh.rotation.y = 0.25;
          group.add(ringMesh);
        }

        const collarMat = new THREE.MeshPhysicalMaterial({
          color: collarHex,
          metalness: 0.9,
          roughness: 0.22,
        });
        const ringCollar = new THREE.Mesh(
          new THREE.TorusGeometry(p.visualRadius * scaleMult * 1.48, 0.018, 10, 48),
          collarMat
        );
        ringCollar.rotation.x = Math.PI / 2;
        group.add(ringCollar);

        const rodLen = Math.max(0.4, ZODIAC_RADIUS - p.orbitRadius - 0.35);
        const pointerRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, rodLen, 8),
          new THREE.MeshBasicMaterial({
            color: isOuter ? 0x38bdf8 : p.colorHex,
            transparent: true,
            opacity: isOuter ? 0.36 : 0.42,
          })
        );
        pointerRod.rotation.z = Math.PI / 2;
        pointerRod.position.x = rodLen * 0.5;
        group.add(pointerRod);

        // Vertical drop stem for outer transit/solar return planets down toward the base plane
        if (isOuter) {
          const dropStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.007, 0.007, OUTER_LAYER_Y, 6),
            new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.26,
            })
          );
          dropStem.position.y = -OUTER_LAYER_Y * 0.5;
          group.add(dropStem);
        }

        const badgeColor = isOuter ? '#7dd3fc' : `#${p.colorHex.toString(16).padStart(6, '0')}`;
        const badgeLabel = isOuter ? `${p.name} (Ext.)` : p.name;
        const badgeTex = createGlyphBadgeTexture(p.symbol, badgeLabel, badgeColor);
        this.texturesToDispose.push(badgeTex);
        const badge = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthWrite: false })
        );
        badge.position.y = p.visualRadius * scaleMult + 0.5;
        badge.scale.set(isOuter ? 1.18 : 1.25, isOuter ? 0.58 : 0.62, 1);
        group.add(badge);

        const collider = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(0.42, p.visualRadius * 1.75), 12, 10),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        collider.layers.set(1);
        collider.userData = { kind: 'planet', planetId: p.id, layer };
        group.add(collider);
        this.interactables.push(collider);

        targetGroup.add(group);
        nodeMap.set(p.id, {
          data: p,
          group,
          sphere,
          ringCollar,
          pointerRod,
          badge,
          collider,
          currentAngle: 0,
          targetAngle: 0,
          currentY: baseY,
          targetY: baseY,
          initialized: false,
        });
      });
    }

    const baseAsc = this.baseChart?.ascendant ?? chart.ascendant;
    chart.planets.forEach((p) => {
      const node = nodeMap.get(p.id);
      if (!node) return;
      node.data = p;

      const angle = eclipticLonToWorldAngle(p.longitude, baseAsc);
      const latY = baseY + THREE.MathUtils.clamp(p.latitude * 0.08, -0.5, 0.5);

      node.targetAngle = angle;
      node.targetY = latY;

      if (!node.initialized) {
        node.currentAngle = angle;
        node.currentY = latY;
        const pos = angleToXZ(angle, p.orbitRadius);
        node.group.position.set(pos.x, latY, pos.z);
        node.group.rotation.y = angle;
        node.initialized = true;
      }
    });
  }

  private getNodeWorldPos(node: PlanetNode): THREE.Vector3 {
    const pos = angleToXZ(node.targetAngle, node.data.orbitRadius);
    return new THREE.Vector3(pos.x, node.targetY, pos.z);
  }

  private rebuildAspects() {
    while (this.aspectsGroup.children.length > 0) {
      const child = this.aspectsGroup.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material?.dispose();
      this.aspectsGroup.remove(child);
    }

    if (this.aspectFilter === 'none' || !this.baseChart) return;

    const showBaseAspects =
      this.aspectFilter === 'all' ||
      this.aspectFilter === 'natal' ||
      this.aspectFilter === 'harmonious' ||
      this.aspectFilter === 'tense';

    const showComparisonAspects =
      Boolean(this.outerChart) &&
      (this.aspectFilter === 'all' ||
        this.aspectFilter === 'comparison' ||
        this.aspectFilter === 'harmonious' ||
        this.aspectFilter === 'tense');

    // 1. Base chart internal aspects (Natal or Live)
    if (showBaseAspects) {
      const baseFiltered = this.baseChart.aspects.filter((asp) => {
        if (this.aspectFilter === 'harmonious') return asp.harmony === 'harmonious' || asp.harmony === 'fusion';
        if (this.aspectFilter === 'tense') return asp.harmony === 'tense';
        return true;
      });

      baseFiltered.forEach((asp) => {
        const nodeA = this.planetNodes.get(asp.planetA);
        const nodeB = this.planetNodes.get(asp.planetB);
        if (!nodeA || !nodeB) return;

        const pA = this.getNodeWorldPos(nodeA);
        const pB = this.getNodeWorldPos(nodeB);
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        mid.y += asp.harmony === 'tense' ? 0.65 : 0.42;

        const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
        const isHighlighted = this.highlightedAspectId === asp.id;
        const thickness = isHighlighted ? 0.048 : Math.max(0.011, 0.028 - asp.orb * 0.0022);
        const geo = new THREE.TubeGeometry(curve, 22, thickness, 6, false);

        const isFocused =
          isHighlighted ||
          (!this.highlightedAspectId &&
            (!this.selectedPlanetId ||
              (this.selectedPlanetLayer === 'base' &&
                (asp.planetA === this.selectedPlanetId || asp.planetB === this.selectedPlanetId))));

        const baseOpacity = this.outerChart ? 0.25 : 0.72;
        const mat = new THREE.MeshBasicMaterial({
          color: asp.colorHex,
          transparent: true,
          opacity: isHighlighted ? 0.96 : isFocused ? baseOpacity : 0.09,
        });

        this.aspectsGroup.add(new THREE.Mesh(geo, mat));
      });
    }

    // 2. Comparison aspects (Transits -> Natal or Solar Return -> Natal)
    if (showComparisonAspects) {
      const compFiltered = this.comparisonAspects.filter((asp) => {
        if (this.aspectFilter === 'harmonious') return asp.harmony === 'harmonious' || asp.harmony === 'fusion';
        if (this.aspectFilter === 'tense') return asp.harmony === 'tense';
        return true;
      });

      compFiltered.forEach((asp) => {
        const outerNode = this.outerPlanetNodes.get(asp.outerPlanet);
        const natalNode = this.planetNodes.get(asp.natalPlanet);
        if (!outerNode || !natalNode) return;

        const pA = this.getNodeWorldPos(outerNode);
        const pB = this.getNodeWorldPos(natalNode);
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        mid.y += 0.55;

        const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
        const isHighlighted = this.highlightedAspectId === asp.id;
        const thickness = isHighlighted ? 0.052 : Math.max(0.014, 0.034 - asp.orb * 0.003);
        const geo = new THREE.TubeGeometry(curve, 24, thickness, 6, false);

        const isFocused =
          isHighlighted ||
          (!this.highlightedAspectId &&
            (!this.selectedPlanetId ||
              (this.selectedPlanetLayer === 'outer' && asp.outerPlanet === this.selectedPlanetId) ||
              (this.selectedPlanetLayer === 'base' && asp.natalPlanet === this.selectedPlanetId)));

        const mat = new THREE.MeshBasicMaterial({
          color: asp.colorHex,
          transparent: true,
          opacity: isHighlighted ? 0.98 : isFocused ? 0.85 : 0.12,
        });

        this.aspectsGroup.add(new THREE.Mesh(geo, mat));
      });
    }
  }

  private applyDisplayFocus() {
    const f = this.displayFocus;
    if (f === 'all') {
      this.planetsGroup.visible = true;
      this.outerPlanetsGroup.visible = Boolean(this.outerChart);
      this.aspectsGroup.visible = this.aspectFilter !== 'none';
      this.houseGroup.visible = this.showHouses;
      this.zodiacBandGroup.visible = true;
      this.armillaryOuterGroup.visible = true;
    } else if (f === 'planetsOnly') {
      this.planetsGroup.visible = true;
      this.outerPlanetsGroup.visible = Boolean(this.outerChart);
      this.aspectsGroup.visible = false;
      this.houseGroup.visible = false;
      this.zodiacBandGroup.visible = false;
      this.armillaryOuterGroup.visible = false;
    } else if (f === 'aspectsOnly') {
      this.planetsGroup.visible = false;
      this.outerPlanetsGroup.visible = false;
      this.aspectsGroup.visible = true;
      this.houseGroup.visible = false;
      this.zodiacBandGroup.visible = false;
      this.armillaryOuterGroup.visible = false;
    } else if (f === 'housesOnly') {
      this.planetsGroup.visible = false;
      this.outerPlanetsGroup.visible = false;
      this.aspectsGroup.visible = false;
      this.houseGroup.visible = true;
      this.zodiacBandGroup.visible = true;
      this.armillaryOuterGroup.visible = true;
    }
  }

  public setDisplayFocus(focus: SceneDisplayFocus) {
    this.displayFocus = focus;
    if (focus === 'aspectsOnly' && this.aspectFilter === 'none') {
      this.aspectFilter = 'all';
      this.rebuildAspects();
    }
    this.applyDisplayFocus();
  }

  public setAspectFilter(filter: AspectFilter) {
    this.aspectFilter = filter;
    this.rebuildAspects();
    this.applyDisplayFocus();
  }

  public highlightAspect(aspectId: string | null) {
    this.highlightedAspectId = aspectId;
    if (aspectId) celestialAudio.playSoftTick();
    this.rebuildAspects();
  }

  public setShowHouses(show: boolean) {
    this.showHouses = show;
    this.applyDisplayFocus();
  }

  public setShowConstellations(show: boolean) {
    this.showConstellations = show;
    this.starDomeGroup.visible = show && this.activeXRMode !== 'mr' && !this.desktopMRMode;
  }

  public setShowVRPlaque(show: boolean) {
    this.showVRPlaque = show;
    this.vrLecternGroup.visible = show;
  }

  private applyZodiacTextures() {
    const { bandTexture, collarTexture } = this.getOrCreateZodiacTextures(
      this.wheelStyle,
      this.signStyle,
      this.tradition
    );
    const bandMat = this.zodiacCylinder.material as THREE.MeshStandardMaterial;
    bandMat.map = bandTexture;
    bandMat.needsUpdate = true;

    const collarMat = this.zodiacCollarMesh.material as THREE.MeshStandardMaterial;
    collarMat.map = collarTexture;
    collarMat.needsUpdate = true;
  }

  public setZodiacTradition(tradition: ZodiacTradition) {
    if (this.tradition === tradition) return;
    this.tradition = tradition;
    this.applyZodiacTextures();
    this.updatePlaque();
  }

  public setZodiacWheelStyle(style: ZodiacWheelStyle) {
    if (this.wheelStyle === style) return;
    this.wheelStyle = style;
    this.applyZodiacTextures();
  }

  public setZodiacSignStyle(style: ZodiacSignStyle) {
    if (this.signStyle === style) return;
    this.signStyle = style;
    this.applyZodiacTextures();
  }

  public setStarfieldStyle(style: StarfieldBackdropStyle) {
    if (this.starfieldStyle === style) return;
    this.starfieldStyle = style;
    const skyTex = this.getOrCreateSkyTexture(style);
    const skyMat = this.skyDomeMesh.material as THREE.MeshBasicMaterial;
    skyMat.map = skyTex;
    skyMat.needsUpdate = true;
  }

  public setSkyAnimations(config: SkyAnimationsConfig) {
    this.skyAnimations?.setConfig(config);
  }

  public setCameraPreset(preset: CameraPreset) {
    this.cameraTransitionActive = true;
    if (preset === 'overview') {
      this.targetCamPos.set(0, 11.5, 16.5);
      this.targetLookAt.set(0, 1.4, 0);
    } else if (preset === 'center') {
      this.targetCamPos.set(0, 2.1, 0.4);
      this.targetLookAt.set(0, 1.85, -8.5);
    } else if (preset === 'ecliptic') {
      this.targetCamPos.set(0, 22.0, 0.6);
      this.targetLookAt.set(0, 1.5, 0);
    } else if (preset === 'horizon') {
      this.targetCamPos.set(0, 2.35, 13.6);
      this.targetLookAt.set(0, 1.75, 0);
    }
  }

  public selectPlanet(planetId: PlanetId | null, layer: 'base' | 'outer' = 'base') {
    this.selectedPlanetId = planetId;
    this.selectedPlanetLayer = layer;
    this.selectedHouseNum = null;
    this.highlightedAspectId = null;

    if (planetId) celestialAudio.playPlanetChime(planetId);

    const targetChart = layer === 'outer' && this.outerChart ? this.outerChart : this.baseChart;
    const planet = targetChart?.planets.find((p) => p.id === planetId) ?? null;

    this.callbacks.onSelectHouse(null);
    this.callbacks.onSelectPlanet(planet, layer);
    this.rebuildAspects();
    this.refreshSelectionVisuals();
    this.updatePlaque();
  }

  public selectHouse(houseNum: number | null) {
    this.selectedHouseNum = houseNum;
    this.selectedPlanetId = null;
    this.highlightedAspectId = null;
    if (houseNum) celestialAudio.playSoftTick();

    const house = this.baseChart?.houses.find((h) => h.house === houseNum) ?? null;
    this.callbacks.onSelectPlanet(null, 'base');
    this.callbacks.onSelectHouse(house);
    this.rebuildAspects();
    this.refreshSelectionVisuals();
    this.updatePlaque();
  }

  private refreshSelectionVisuals() {
    this.planetNodes.forEach((node, id) => {
      const isSelected = this.selectedPlanetLayer === 'base' && id === this.selectedPlanetId;
      const mat = node.ringCollar.material as THREE.MeshPhysicalMaterial;
      mat.emissive.setHex(isSelected ? 0xfbbf24 : 0x000000);
      mat.emissiveIntensity = isSelected ? 1.2 : 0;
      node.ringCollar.scale.setScalar(isSelected ? 1.28 : 1.0);
    });
    this.outerPlanetNodes.forEach((node, id) => {
      const isSelected = this.selectedPlanetLayer === 'outer' && id === this.selectedPlanetId;
      const mat = node.ringCollar.material as THREE.MeshPhysicalMaterial;
      mat.emissive.setHex(isSelected ? 0x38bdf8 : 0x000000);
      mat.emissiveIntensity = isSelected ? 1.2 : 0;
      node.ringCollar.scale.setScalar(isSelected ? 1.28 : 1.0);
    });
  }

  private updatePlaque() {
    if (!this.baseChart) return;
    const activeChart =
      this.selectedPlanetLayer === 'outer' && this.outerChart ? this.outerChart : this.baseChart;
    const p = activeChart.planets.find((pl) => pl.id === this.selectedPlanetId) ?? null;
    const h = this.baseChart.houses.find((hs) => hs.house === this.selectedHouseNum) ?? null;

    const modeLabelMap: Record<ChartMode, string> = {
      natal: 'Thème Natal',
      transits: 'Thème Natal + Transits',
      solarReturn: 'Révolution Solaire',
      lunarReturn: 'Révolution Lunaire',
      progressions: 'Progressions Secondaires',
      synastry: 'Synastrie Relationnelle',
      composite: 'Thème Composite',
      comparative: 'Comparatif Double Roue',
      live: 'Ciel en Direct',
    };
    const outerRoleMap: Partial<Record<ChartMode, string>> = {
      transits: 'Transit',
      solarReturn: 'Rév. Solaire',
      lunarReturn: 'Rév. Lunaire',
      progressions: 'Progressé',
      synastry: 'Partenaire B',
      comparative: 'Carte Comparée',
    };
    const modeLabel = modeLabelMap[this.chartMode] ?? 'Thème Natal';
    const outerRoleLabel = outerRoleMap[this.chartMode] ?? 'Transit';

    this.plaqueRenderer.render({
      tradition: this.tradition,
      baseChart: this.baseChart,
      outerChart: this.outerChart,
      modeLabel,
      outerRoleLabel,
      selectedPlanet: p,
      selectedPlanetLayer: this.selectedPlanetLayer,
      selectedHouse: h,
      comparisonAspects: this.comparisonAspects,
    });
  }

  private handleSelectObject(obj: THREE.Object3D) {
    if (obj.userData.kind === 'planet') {
      const id = obj.userData.planetId as PlanetId;
      const layer = (obj.userData.layer as 'base' | 'outer') ?? 'base';
      if (id === this.selectedPlanetId && layer === this.selectedPlanetLayer) {
        this.selectPlanet(null, layer);
      } else {
        this.selectPlanet(id, layer);
      }
    } else if (obj.userData.kind === 'house') {
      const h = obj.userData.house as HouseCusp;
      this.selectHouse(h.house === this.selectedHouseNum ? null : h.house);
    }
  }

  private onXRSelectStart(controller: THREE.XRTargetRaySpace) {
    _mat4.identity().extractRotation(controller.matrixWorld);
    _vec3A.set(0, 0, -1).applyMatrix4(_mat4);
    _vec3B.setFromMatrixPosition(controller.matrixWorld);

    this.raycaster.layers.set(1);
    this.raycaster.set(_vec3B, _vec3A);
    const hits = this.raycaster.intersectObjects(this.interactables, false);
    if (hits.length > 0) {
      this.handleSelectObject(hits[0].object);
    }
  }

  private bindEvents() {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('resize', this.onResize);
  }

  private onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - this.lastHoverRaycast < 45) return;
    this.lastHoverRaycast = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.layers.set(1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);
    this.hoveredObject = hits.length > 0 ? hits[0].object : null;
    this.renderer.domElement.style.cursor = this.hoveredObject ? 'pointer' : 'grab';
  };

  private pointerDownPos = { x: 0, y: 0 };

  private onPointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointerup', onUp);
      const dist = Math.hypot(
        upEvent.clientX - this.pointerDownPos.x,
        upEvent.clientY - this.pointerDownPos.y
      );
      if (dist > 6) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((upEvent.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((upEvent.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.layers.set(1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactables, false);
      if (hits.length > 0) {
        this.handleSelectObject(hits[0].object);
      }
    };
    window.addEventListener('pointerup', onUp);
  };

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private dampNodeMap(nodeMap: Map<PlanetId, PlanetNode>, delta: number, elapsed: number) {
    const smoothFactor = this.isSoftwareGl ? 1 : 1 - Math.exp(-7.5 * delta);
    nodeMap.forEach((node) => {
      node.sphere.rotation.y += delta * 0.22;
      node.ringCollar.rotation.z = Math.sin(elapsed * 0.7 + node.data.orbitRadius) * 0.14;

      const angleDelta = shortestAngleDiff(node.currentAngle, node.targetAngle);
      if (Math.abs(angleDelta) > 0.0005 || Math.abs(node.currentY - node.targetY) > 0.0005) {
        node.currentAngle += angleDelta * smoothFactor;
        node.currentY = THREE.MathUtils.lerp(node.currentY, node.targetY, smoothFactor);
        const pos = angleToXZ(node.currentAngle, node.data.orbitRadius);
        node.group.position.set(pos.x, node.currentY, pos.z);
        node.group.rotation.y = node.currentAngle;
      }
    });
  }

  private updateFrame(delta: number, elapsed: number) {
    // Smooth Zodiac band orientation transition
    if (this.zodiacInitialized) {
      const zDiff = shortestAngleDiff(this.zodiacCylinder.rotation.y, this.targetZodiacRotY);
      if (Math.abs(zDiff) > 0.0005) {
        const f = this.isSoftwareGl ? 1 : 1 - Math.exp(-6.5 * delta);
        this.zodiacCylinder.rotation.y += zDiff * f;
      }
    }

    // Smooth planet angular transitions along shortest ecliptic arc
    this.dampNodeMap(this.planetNodes, delta, elapsed);
    if (this.outerPlanetsGroup.visible) {
      this.dampNodeMap(this.outerPlanetNodes, delta, elapsed);
      const ascDiff = shortestAngleDiff(this.outerAscCurrentAngle, this.outerAscTargetAngle);
      if (Math.abs(ascDiff) > 0.0005) {
        this.outerAscCurrentAngle += ascDiff * (this.isSoftwareGl ? 1 : 1 - Math.exp(-6.5 * delta));
        this.outerAscMarker.rotation.y = this.outerAscCurrentAngle;
      }
    }

    this.armillaryOuterGroup.rotation.y = Math.sin(elapsed * 0.05) * 0.04;
    if (this.starDomeGroup.visible) {
      this.skyAnimations?.update(delta, elapsed);
    }

    if (!this.vrSession) {
      if (this.cameraTransitionActive) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCamPos.x, 4.5, delta);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCamPos.y, 4.5, delta);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCamPos.z, 4.5, delta);

        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.targetLookAt.x, 4.5, delta);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.targetLookAt.y, 4.5, delta);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.targetLookAt.z, 4.5, delta);

        if (
          this.camera.position.distanceTo(this.targetCamPos) < 0.05 &&
          this.controls.target.distanceTo(this.targetLookAt) < 0.05
        ) {
          this.cameraTransitionActive = false;
        }
      }
      this.controls.update();
    } else {
      for (let i = 0; i < this.controllers.length; i++) {
        const ctrl = this.controllers[i];
        const reticle = this.controllerReticles[i];
        _mat4.identity().extractRotation(ctrl.matrixWorld);
        _vec3A.set(0, 0, -1).applyMatrix4(_mat4);
        _vec3B.setFromMatrixPosition(ctrl.matrixWorld);
        this.raycaster.layers.set(1);
        this.raycaster.set(_vec3B, _vec3A);
        const hits = this.raycaster.intersectObjects(this.interactables, false);
        if (hits.length > 0) {
          reticle.position.copy(hits[0].point);
          reticle.visible = true;
        } else {
          reticle.visible = false;
        }
      }

      if (this.callbacks.onVRTimeStep) {
        const nowMs = performance.now();
        if (nowMs - this.lastVrTimeStepMs >= 180) {
          for (const src of this.vrSession.inputSources) {
            const axes = src.gamepad?.axes;
            if (!axes || axes.length === 0) continue;
            const axisX = axes.length >= 3 ? axes[2] : axes[0];
            if (Math.abs(axisX) > 0.55) {
              const stepMins = Math.abs(axisX) > 0.88 ? 60 : 15;
              this.lastVrTimeStepMs = nowMs;
              this.callbacks.onVRTimeStep(axisX > 0 ? stepMins : -stepMins);
              break;
            }
          }
        }
      }
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    if (!sync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    if (this.isSoftwareGl) {
      const tick = () => {
        if (this.disposed) return;
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const elapsed = this.clock.getElapsedTime();
        this.updateFrame(delta, elapsed);
        this.renderer.render(this.scene, this.camera);
        this.afterDraw(tick);
      };
      tick();
    } else {
      this.renderer.setAnimationLoop(() => {
        if (this.disposed) return;
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const elapsed = this.clock.getElapsedTime();
        this.updateFrame(delta, elapsed);
        this.renderer.render(this.scene, this.camera);
      });
    }
  }

  public captureSnapshot(): string | null {
    try {
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderer.setAnimationLoop(null);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('resize', this.onResize);

    this.controls.dispose();
    this.texturesToDispose.forEach((t) => t.dispose());
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material?.dispose();
      }
    });
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
