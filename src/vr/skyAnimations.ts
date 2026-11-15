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
    float envelope = exp(-r2 * 4.4) * smoothstep(1.0, 0.45, length(centered));

    vec2 flow = vec2(uTime * 0.028, -uTime * 0.018);
    float n1 = fbm(vUv * 3.8 + uSeed + flow);
    float n2 = fbm(vUv * 6.5 - uSeed * 0.7 - flow * 1.4);
    float wisps = smoothstep(0.24, 0.86, n1 * 0.65 + n2 * 0.45);

    float breathe = 0.86 + 0.14 * sin(uTime * 0.35 + uSeed);
    float alpha = envelope * wisps * uIntensity * breathe;
    vec3 col = mix(uColorA, uColorB, clamp(n2 * 1.2, 0.0, 1.0));
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
    float wave = sin(uv.x * 14.0 + uTime * 0.28 + uSeed) * 1.6
               + cos(uv.x * 7.0 - uTime * 0.19 + uSeed * 1.7) * 1.1;
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
    float edgeX = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
    float edgeY = pow(smoothstep(0.0, 0.24, vUv.y), 1.3) * smoothstep(1.0, 0.26, vUv.y);

    float rayCoord = vUv.x * 26.0 + sin(vUv.x * 5.0 + uTime * 0.22) * 1.2;
    float raysA = noise(vec2(rayCoord + uTime * 0.22, vUv.y * 1.6 + uSeed));
    float raysB = noise(vec2(rayCoord * 1.9 - uTime * 0.31, vUv.y * 2.4 - uSeed));
    float curtain = smoothstep(0.28, 0.88, raysA * 0.62 + raysB * 0.45);

    float shimmer = 0.84 + 0.16 * sin(uTime * 0.42 + vUv.x * 8.0 + uSeed);
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
    float widthMask = pow(max(0.0, 1.0 - crossDist), 2.8);
    float headBoost = smoothstep(0.76, 0.96, vUv.x) * 0.85;
    float alpha = (along * 0.72 + headBoost) * widthMask * uOpacity;
    vec3 col = mix(uTailColor, uHeadColor, smoothstep(0.45, 0.95, vUv.x));
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
    // Three compact, delicate nebula veils nestled in separate upper sky quadrants
    const specs = [
      {
        pos: new THREE.Vector3(-56, 46, -68),
        w: 22,
        h: 14,
        rotZ: 0.42,
        seed: 1.7,
        intensity: 0.21,
        colorA: 0x3b82f6,
        colorB: 0xa855f7,
      },
      {
        pos: new THREE.Vector3(62, 38, -58),
        w: 20,
        h: 13,
        rotZ: -0.55,
        seed: 4.3,
        intensity: 0.19,
        colorA: 0xec4899,
        colorB: 0x6366f1,
      },
      {
        pos: new THREE.Vector3(14, 58, 72),
        w: 24,
        h: 15,
        rotZ: 0.24,
        seed: 8.9,
        intensity: 0.18,
        colorA: 0x2dd4bf,
        colorB: 0xf59e0b,
      },
    ];

    const lookTarget = new THREE.Vector3(0, 2, 0);
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
    // Two restrained northern-horizon aurora ribbons, modest height & low opacity
    const ribbons = [
      {
        radius: 84,
        height: 11.5,
        y: 16.5,
        thetaStart: Math.PI - 0.56,
        thetaLength: 0.86,
        seed: 2.1,
        intensity: 0.24,
        colorLow: 0x34d399,
        colorHigh: 0x818cf8,
      },
      {
        radius: 90,
        height: 13.0,
        y: 20.0,
        thetaStart: Math.PI - 0.18,
        thetaLength: 0.72,
        seed: 6.4,
        intensity: 0.19,
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
    // Two staggered meteor slots so at most 1-2 gentle streaks appear every several seconds
    for (let i = 0; i < 2; i++) {
      const group = new THREE.Group();
      group.visible = false;

      const uniforms = {
        uOpacity: { value: 0 },
        uHeadColor: { value: new THREE.Color(0xf8fafc) },
        uTailColor: { value: new THREE.Color(i === 0 ? 0x7dd3fc : 0xfde68a) },
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
      const planeA = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.16), mat);
      const planeB = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.16), mat);
      planeB.rotation.x = Math.PI / 2;
      group.add(planeA, planeB);

      this.shootingStarsGroup.add(group);
      this.meteors.push({
        group,
        uniforms,
        active: false,
        elapsed: 0,
        duration: 1.0,
        cooldown: i === 0 ? 1.8 : 6.2,
        length: 4.5,
        speed: 14,
        startPos: new THREE.Vector3(),
        dir: new THREE.Vector3(1, 0, 0),
      });
    }
  }

  private spawnMeteor(slot: MeteorSlot) {
    const r = 68 + Math.random() * 14;
    const phi = 0.42 + Math.random() * 0.62; // high sky dome, well above zodiac plane
    const theta = Math.random() * Math.PI * 2;

    slot.startPos.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );

    // Construct a tangent direction tilted slightly downward across the sky
    _radial.copy(slot.startPos).normalize();
    _tanA.crossVectors(_upVec, _radial);
    if (_tanA.lengthSq() < 0.001) _tanA.set(1, 0, 0);
    _tanA.normalize();
    _tanB.crossVectors(_radial, _tanA).normalize();

    const horizSign = Math.random() > 0.5 ? 1 : -1;
    const slope = 0.35 + Math.random() * 0.45;
    slot.dir
      .copy(_tanA)
      .multiplyScalar(horizSign)
      .addScaledVector(_tanB, slope)
      .normalize();

    slot.length = 3.8 + Math.random() * 1.8;
    slot.duration = 0.85 + Math.random() * 0.45;
    slot.speed = 12.5 + Math.random() * 4.5;
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
        m.cooldown = 1.5 + Math.random() * 3.5;
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
          m.cooldown = 5.0 + Math.random() * 7.0;
          continue;
        }

        _curPos.copy(m.startPos).addScaledVector(m.dir, m.speed * m.elapsed);
        m.group.position.copy(_curPos);
        m.uniforms.uOpacity.value = Math.sin(p * Math.PI) * 0.72;
      }
    }
  }
}
