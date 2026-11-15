import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import {
  BackSide,
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type InstancedMesh,
  type ShaderMaterial,
} from 'three';

// Everything here is generated in code (noise textures and shaders), so there are no
// image files to download, host or license. A "setting" picks the world the object sits in.

export type Setting = 'moon' | 'mars';

export interface Look {
  groundDark: string;
  groundLight: string;
  rock: string;
  skyTop: string;
  skyHorizon: string;
  fog: string;
  /** Colour of the light bounced into reflections on the model. */
  envTint: string;
  stars: boolean;
  earth: boolean;
  exposure: number;
}

export const LOOKS: Record<Setting, Look> = {
  moon: {
    groundDark: '#45443f',
    groundLight: '#a6a299',
    rock: '#6f6c67',
    skyTop: '#01020a',
    skyHorizon: '#0b0c16',
    fog: '#06070d',
    envTint: '#1a1b24',
    stars: true,
    earth: true,
    exposure: 1.15,
  },
  mars: {
    groundDark: '#5a2412',
    groundLight: '#c4713f',
    rock: '#7a3d22',
    skyTop: '#34202e',
    skyHorizon: '#dc9c6f',
    fog: '#bf8059',
    envTint: '#7a4630',
    stars: false,
    earth: false,
    exposure: 1.05,
  },
};

/** Direction toward the sun. The key light, the shadows and the sky glow all use it. */
export const SUN = new Vector3(-4, 6, 3).normalize();

// ---------- ground texture ----------
function hash(x: number, y: number, s: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
// Value noise that wraps every `period` cells, so the texture tiles without seams.
function vnoise(x: number, y: number, period: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const w = (i: number) => ((i % period) + period) % period;
  const a = hash(w(xi), w(yi), s), b = hash(w(xi + 1), w(yi), s);
  const c = hash(w(xi), w(yi + 1), s), d = hash(w(xi + 1), w(yi + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, s: number) {
  let sum = 0, amp = 0.5, f = 4;
  for (let o = 0; o < 6; o++) {
    sum += amp * vnoise(x * f, y * f, f, s);
    f *= 2;
    amp *= 0.5;
  }
  return sum;
}
const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const groundCache = new Map<string, { map: DataTexture; bump: DataTexture }>();
function groundTextures(dark: string, light: string) {
  const key = dark + light;
  const hit = groundCache.get(key);
  if (hit) return hit;

  const N = 384;
  const col = new Uint8Array(new ArrayBuffer(N * N * 4));
  const height = new Uint8Array(new ArrayBuffer(N * N * 4));
  const [d, l] = [hexRgb(dark), hexRgb(light)];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = i / N, y = j / N;
      const broad = fbm(x, y, 1);
      const grain = hash(i, j, 7);
      const t = Math.min(1, Math.max(0, (broad - 0.25) * 1.9)) * 0.92 + grain * 0.08;
      const p = (j * N + i) * 4;
      for (let k = 0; k < 3; k++) col[p + k] = d[k] + (l[k] - d[k]) * t;
      col[p + 3] = 255;
      const hgt = Math.round((broad * 0.85 + grain * 0.15) * 255);
      height[p] = height[p + 1] = height[p + 2] = hgt;
      height[p + 3] = 255;
    }
  }
  const make = (data: Uint8Array<ArrayBuffer>, srgb: boolean) => {
    const t = new DataTexture(data, N, N);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(22, 22);
    t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
    t.generateMipmaps = true;
    t.magFilter = LinearFilter; // DataTexture defaults to nearest-neighbour, which looks blocky up close
    t.minFilter = LinearMipmapLinearFilter;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  const out = { map: make(col, true), bump: make(height, false) };
  groundCache.set(key, out);
  return out;
}

// ---------- sky ----------
const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform float uGlow;
  varying vec3 vDir;
  void main(){
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, pow(h, 0.45));
    float s = max(dot(d, normalize(uSun)), 0.0);
    col += vec3(1.0, 0.93, 0.82) * (pow(s, 900.0) * 4.0 + pow(s, 14.0) * 0.22) * uGlow;
    // below the horizon: keep the horizon colour so the far ground blends into it
    if (d.y < 0.0) col = uHorizon;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function Sky({ look }: { look: Look }) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new Color(look.skyTop) },
      uHorizon: { value: new Color(look.skyHorizon) },
      uSun: { value: SUN.clone() },
      uGlow: { value: look.earth ? 0.0 : 1.0 }, // no atmosphere on the Moon, so no glow
    }),
    [look],
  );
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[90, 32, 16]} />
      <shaderMaterial vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={uniforms} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

// ---------- Earth in the Moon's sky ----------
const EARTH_VERT = /* glsl */ `
  varying vec3 vObj; varying vec3 vN; varying vec3 vView;
  void main(){
    vObj = position;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - w.xyz);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const EARTH_FRAG = /* glsl */ `
  uniform float uTime; uniform vec3 uSun;
  varying vec3 vObj; varying vec3 vN; varying vec3 vView;
  float h(vec3 p){ p = fract(p*.3183+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1)),f.x),f.y),f.z); }
  float fb(vec3 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
  void main(){
    float c = cos(uTime), s = sin(uTime);
    vec3 p = normalize(vObj); p = vec3(c*p.x + s*p.z, p.y, c*p.z - s*p.x);
    float land = smoothstep(0.5, 0.56, fb(p*2.2));
    vec3 ocean = mix(vec3(.02,.1,.32), vec3(.05,.27,.58), fb(p*5.));
    vec3 ground = mix(vec3(.16,.36,.14), vec3(.6,.5,.3), fb(p*6.+3.));
    vec3 col = mix(ocean, ground, land);
    col = mix(col, vec3(.95), smoothstep(.9,.97,abs(p.y)));                      // ice caps
    col = mix(col, vec3(1.), smoothstep(.52,.72, fb(p*3.4 + uTime*.3))*.85);      // clouds
    float lit = smoothstep(-.15, .6, dot(normalize(vN), normalize(uSun)));
    float rim = pow(1. - max(dot(normalize(vN), vView), 0.), 3.);
    gl_FragColor = vec4(col*(.03 + 1.1*lit) + vec3(.35,.6,1.)*rim*.8*lit, 1.0);
    #include <colorspace_fragment>
  }
`;

function Earth({ reduced }: { reduced: boolean }) {
  const mat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSun: { value: new Vector3(-0.6, 0.35, 0.7).normalize() } }), []);
  useFrame((_, dt) => {
    if (mat.current && !reduced) mat.current.uniforms.uTime.value += dt * 0.05;
  });
  return (
    <mesh position={[-40, 8.5, -66]}>
      <sphereGeometry args={[5.5, 48, 48]} />
      <shaderMaterial ref={mat} vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} uniforms={uniforms} fog={false} />
    </mesh>
  );
}

// ---------- rocks ----------
const ROCKS = 28;
function Rocks({ floorY, color }: { floorY: number; color: string }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let seed = 1234567;
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const o = new Object3D();
    for (let i = 0; i < ROCKS; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 3.4 + Math.pow(rnd(), 1.5) * 15; // keep the middle clear around the model
      const sc = 0.05 + Math.pow(rnd(), 3) * 0.38;
      o.position.set(Math.cos(a) * r, floorY + sc * 0.22, Math.sin(a) * r);
      o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      o.scale.set(sc * (0.8 + rnd() * 0.6), sc * (0.5 + rnd() * 0.4), sc * (0.8 + rnd() * 0.6));
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [floorY]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, ROCKS]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} flatShading />
    </instancedMesh>
  );
}

// ---------- the whole backdrop ----------
export function Backdrop({ setting, floorY, reduced }: { setting: Setting; floorY: number; reduced: boolean }) {
  const look = LOOKS[setting];
  const { map, bump } = useMemo(() => groundTextures(look.groundDark, look.groundLight), [look]);
  return (
    <>
      <color attach="background" args={[look.skyHorizon]} />
      <fog attach="fog" args={[look.fog, 9, 44]} />
      <Sky look={look} />
      {look.stars && <Stars radius={75} depth={30} count={2200} factor={4} saturation={0} fade speed={reduced ? 0 : 0.4} />}
      {look.earth && <Earth reduced={reduced} />}
      <mesh rotation-x={-Math.PI / 2} position-y={floorY} receiveShadow>
        <circleGeometry args={[46, 64]} />
        <meshStandardMaterial map={map} bumpMap={bump} bumpScale={3} roughness={1} metalness={0} />
      </mesh>
      <Rocks floorY={floorY} color={look.rock} />
    </>
  );
}
