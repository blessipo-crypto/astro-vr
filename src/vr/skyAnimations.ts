import * as THREE from 'three';

export interface SkyAnimationsConfig {
  shootingStars: boolean;
  nebulae: boolean;
  aurora: boolean;
}

export const DEFAULT_SKY_ANIMATIONS: SkyAnimationsConfig = {
  shootingStars: true,
  nebulae: true,
  aurora: true,
};

interface MeteorSlot {
  group: THREE.Group;
  uniforms: {
    uOpacity: { value: number };
    uHeadColor: { value: THREE.Color };
    uTailColor: { value: THREE.Color };
  };
  active: boolean;
  elapsed: number;
  duration: number;
  cooldown: number;
  length: number;
  speed: number;
  startPos: THREE.Vector3;
  dir: THREE.Vector3;
}

const _xAxis = new THREE.Vector3(1, 0, 0);
const _upVec = new THREE.Vector3(0, 1, 0);
const _radial = new THREE.Vector3();
const _tanA = new THREE.Vector3();
const _tanB = new THREE.Vector3();
const _curPos = new THREE.Vector3();
const _targetQuat = new THREE.Quaternion();

const NEBULA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p = p * 2.03 + vec2(13.1, 7.7);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 centered = (vUv - 0.5) * vec2(2.0, 2.25);
    float r2 = dot(centered, centered);
    float envelope = exp(-r2 * 4.2) * smoothstep(1.0, 0.4, length(centered));

    vec2 flow = vec2(uTime * 0.045, -uTime * 0.025);
    float n1 = fbm(vUv * 3.6 + uSeed + flow);
    float n2 = fbm(vUv * 6.2 - uSeed * 0.7 - flow * 1.4);
    float wisps = smoothstep(0.22, 0.82, n1 * 0.65 + n2 * 0.45);

    float breathe = 0.82 + 0.18 * sin(uTime * 0.55 + uSeed);
    float alpha = envelope * wisps * uIntensity * breathe;
    vec3 col = mix(uColorA, uColorB, clamp(n2 * 1.25, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
  }
`;

const AURORA_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(uv.x * 14.0 + uTime * 0.48 + uSeed) * 1.8
               + cos(uv.x * 7.0 - uTime * 0.31 + uSeed * 1.7) * 1.2;
    vec3 radialOut = normalize(vec3(pos.x, 0.0, pos.z));
    pos += radialOut * (wave * (0.25 + 0.75 * uv.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uIntensity;
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    float edgeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    float edgeY = pow(smoothstep(0.0, 0.24, vUv.y), 1.25) * smoothstep(1.0, 0.22, vUv.y);

    float rayCoord = vUv.x * 26.0 + sin(vUv.x * 5.0 + uTime * 0.35) * 1.4;
    float raysA = noise(vec2(rayCoord + uTime * 0.32, vUv.y * 1.5 + uSeed));
    float raysB = noise(vec2(rayCoord * 1.9 - uTime * 0.42, vUv.y * 2.2 - uSeed));
    float curtain = smoothstep(0.24, 0.84, raysA * 0.62 + raysB * 0.45);

    float shimmer = 0.82 + 0.18 * sin(uTime * 0.65 + vUv.x * 8.0 + uSeed);
    float alpha = edgeX * edgeY * curtain * uIntensity * shimmer;
    vec3 col = mix(uColorLow, uColorHigh, smoothstep(0.15, 0.85, vUv.y));
    gl_FragColor = vec4(col, alpha);
  }
`;

const METEOR_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const METEOR_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uHeadColor;
  uniform vec3 uTailColor;
  varying vec2 vUv;

  void main() {
    // vUv.x: 0.0 = tail -> 1.0 = leading tip
    float along = smoothstep(0.0, 0.92, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    float crossDist = abs(vUv.y - 0.5) * 2.0;
    float widthMask = pow(max(0.0, 1.0 - crossDist), 2.4);
    float headBoost = smoothstep(0.74, 0.96, vUv.x) * 0.95;
    float alpha = (along * 0.78 + headBoost) * widthMask * uOpacity;
    vec3 col = mix(uTailColor, uHeadColor, smoothstep(0.4, 0.94, vUv.x));
    gl_FragColor = vec4(col, alpha);
  }
`;

export class SkyAnimationsController {
  public readonly rootGroup = new THREE.Group();

  private readonly nebulaeGroup = new THREE.Group();
  private readonly auroraGroup = new THREE.Group();
  private readonly shootingStarsGroup = new THREE.Group();

  private nebulaTimeUniforms: Array<{ value: number }> = [];
  private auroraTimeUniforms: Array<{ value: number }> = [];
  private meteors: MeteorSlot[] = [];

  private config: SkyAnimationsConfig = { ...DEFAULT_SKY_ANIMATIONS };

  constructor() {
    this.rootGroup.name = 'SkyAnimationsRoot';
    this.initNebulae();
    this.initAuroras();
    this.initShootingStars();

    this.rootGroup.add(this.nebulaeGroup);
    this.rootGroup.add(this.auroraGroup);
    this.rootGroup.add(this.shootingStarsGroup);
    this.setConfig(this.config);
  }

  private initNebulae() {
    // Three compact, delicate nebula veils positioned within the natural observatory sky band
    const specs = [
      {
        pos: new THREE.Vector3(-42, 3.0, -58),
        w: 22,
        h: 13,
        rotZ: 0.35,
        seed: 1.7,
        intensity: 0.34,
        colorA: 0x3b82f6,
        colorB: 0xc084fc,
      },
      {
        pos: new THREE.Vector3(44, 1.5, -56),
        w: 20,
        h: 12,
        rotZ: -0.45,
        seed: 4.3,
        intensity: 0.31,
        colorA: 0xf43f5e,
        colorB: 0x6366f1,
      },
      {
        pos: new THREE.Vector3(-12, 24, 66),
        w: 22,
        h: 14,
        rotZ: 0.22,
        seed: 8.9,
        intensity: 0.28,
        colorA: 0x2dd4bf,
        colorB: 0xf59e0b,
      },
    ];

    const lookTarget = new THREE.Vector3(0, 4, 0);
    for (const s of specs) {
      const geo = new THREE.PlaneGeometry(s.w, s.h, 1, 1);
      const uTime = { value: 0 };
      this.nebulaTimeUniforms.push(uTime);

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime,
          uSeed: { value: s.seed },
          uIntensity: { value: s.intensity },
          uColorA: { value: new THREE.Color(s.colorA) },
          uColorB: { value: new THREE.Color(s.colorB) },
        },
        vertexShader: NEBULA_VERT,
        fragmentShader: NEBULA_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(s.pos);
      mesh.lookAt(lookTarget);
      mesh.rotateZ(s.rotZ);
      this.nebulaeGroup.add(mesh);
    }
  }

  private initAuroras() {
    // Two delicate northern-horizon aurora curtains framed behind the zodiac rim (visible in default view & VR)
    const ribbons = [
      {
        radius: 74,
        height: 13.5,
        y: 2.5,
        thetaStart: Math.PI - 0.58,
        thetaLength: 0.92,
        seed: 2.1,
        intensity: 0.36,
        colorLow: 0x34d399,
        colorHigh: 0x818cf8,
      },
      {
        radius: 80,
        height: 15.0,
        y: 6.2,
        thetaStart: Math.PI - 0.22,
        thetaLength: 0.82,
        seed: 6.4,
        intensity: 0.28,
        colorLow: 0x2dd4bf,
        colorHigh: 0xc084fc,
      },
    ];

    for (const r of ribbons) {
      const geo = new THREE.CylinderGeometry(
        r.radius,
        r.radius,
        r.height,
        56,
        6,
        true,
        r.thetaStart,
        r.thetaLength
      );
      const uTime = { value: 0 };
      this.auroraTimeUniforms.push(uTime);

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime,
          uSeed: { value: r.seed },
          uIntensity: { value: r.intensity },
          uColorLow: { value: new THREE.Color(r.colorLow) },
          uColorHigh: { value: new THREE.Color(r.colorHigh) },
        },
        vertexShader: AURORA_VERT,
        fragmentShader: AURORA_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = r.y;
      this.auroraGroup.add(mesh);
    }
  }

  private initShootingStars() {
    // Three staggered meteor slots so occasional streaks glide cleanly across visible sky
    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      group.visible = false;

      const uniforms = {
        uOpacity: { value: 0 },
        uHeadColor: { value: new THREE.Color(0xffffff) },
        uTailColor: { value: new THREE.Color(i % 2 === 0 ? 0x7dd3fc : 0xfde68a) },
      };

      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: METEOR_VERT,
        fragmentShader: METEOR_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
      });

      // Crossed thin strips so streak reads crisply from any angle in desktop or VR
      const planeA = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.22), mat);
      const planeB = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.22), mat);
      planeB.rotation.x = Math.PI / 2;
      group.add(planeA, planeB);

      this.shootingStarsGroup.add(group);
      this.meteors.push({
        group,
        uniforms,
        active: false,
        elapsed: 0,
        duration: 1.0,
        cooldown: i === 0 ? 0.5 : i === 1 ? 2.6 : 5.2,
        length: 5.5,
        speed: 16,
        startPos: new THREE.Vector3(),
        dir: new THREE.Vector3(1, 0, 0),
      });
    }
  }

  private spawnMeteor(slot: MeteorSlot) {
    const r = 56 + Math.random() * 18;
    // Place mostly in the -Z / side sky band visible from default camera, with occasional full-360° spawn for VR
    const inFrontBand = Math.random() < 0.72;
    const theta = inFrontBand
      ? -Math.PI * 0.5 + (Math.random() - 0.5) * 1.9
      : Math.random() * Math.PI * 2;
    const y = inFrontBand ? -4 + Math.random() * 14 : 6 + Math.random() * 24;

    const horizR = Math.sqrt(Math.max(100, r * r - y * y));
    slot.startPos.set(horizR * Math.cos(theta), y, horizR * Math.sin(theta));

    // Construct a tangent direction tilted diagonally across the sky
    _radial.copy(slot.startPos).normalize();
    _tanA.crossVectors(_upVec, _radial);
    if (_tanA.lengthSq() < 0.001) _tanA.set(1, 0, 0);
    _tanA.normalize();
    _tanB.crossVectors(_radial, _tanA).normalize();

    const horizSign = Math.random() > 0.5 ? 1 : -1;
    const slope = 0.28 + Math.random() * 0.35;
    slot.dir
      .copy(_tanA)
      .multiplyScalar(horizSign)
      .addScaledVector(_tanB, slope)
      .normalize();

    slot.length = 4.8 + Math.random() * 2.2;
    slot.duration = 0.9 + Math.random() * 0.45;
    slot.speed = 15.0 + Math.random() * 5.0;
    slot.elapsed = 0;
    slot.active = true;

    slot.group.position.copy(slot.startPos);
    slot.group.scale.set(slot.length, 1, 1);
    _targetQuat.setFromUnitVectors(_xAxis, slot.dir);
    slot.group.quaternion.copy(_targetQuat);
    slot.uniforms.uOpacity.value = 0;
    slot.group.visible = true;
  }

  public setConfig(next: SkyAnimationsConfig) {
    this.config = { ...next };
    this.shootingStarsGroup.visible = next.shootingStars;
    this.nebulaeGroup.visible = next.nebulae;
    this.auroraGroup.visible = next.aurora;

    if (!next.shootingStars) {
      for (const m of this.meteors) {
        m.active = false;
        m.group.visible = false;
        m.cooldown = 0.8 + Math.random() * 2.2;
      }
    }
  }

  public update(delta: number, elapsed: number) {
    if (!this.rootGroup.visible) return;

    if (this.config.nebulae) {
      for (let i = 0; i < this.nebulaTimeUniforms.length; i++) {
        this.nebulaTimeUniforms[i].value = elapsed;
      }
    }

    if (this.config.aurora) {
      for (let i = 0; i < this.auroraTimeUniforms.length; i++) {
        this.auroraTimeUniforms[i].value = elapsed;
      }
    }

    if (this.config.shootingStars) {
      for (let i = 0; i < this.meteors.length; i++) {
        const m = this.meteors[i];
        if (!m.active) {
          m.cooldown -= delta;
          if (m.cooldown <= 0) {
            this.spawnMeteor(m);
          }
          continue;
        }

        m.elapsed += delta;
        const p = m.elapsed / m.duration;
        if (p >= 1) {
          m.active = false;
          m.group.visible = false;
          m.cooldown = 2.8 + Math.random() * 4.5;
          continue;
        }

        _curPos.copy(m.startPos).addScaledVector(m.dir, m.speed * m.elapsed);
        m.group.position.copy(_curPos);
        m.uniforms.uOpacity.value = Math.sin(p * Math.PI) * 0.88;
      }
    }
  }
}
