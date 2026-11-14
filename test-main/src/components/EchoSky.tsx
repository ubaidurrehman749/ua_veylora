import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { gsap } from '../lib/gsap';
import { AdditiveBlending, type Group } from 'three';
import type { QuestionTheme } from '../types/mission';
import { THEME_ORDER } from '../data/display';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface SkyGroup {
  theme: QuestionTheme;
  /** One key per star, stable across renders so only new stars animate in. */
  keys: string[];
}

// Same input, same sky: stars don't jump when new answers arrive.
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

type Vec = [number, number, number];

function clusterCenter(theme: QuestionTheme): Vec {
  const angle = (THEME_ORDER.indexOf(theme) / THEME_ORDER.length) * Math.PI * 2 - Math.PI / 2;
  const rand = seeded(`center-${theme}`);
  return [Math.cos(angle) * 3.4, Math.sin(angle) * 1.9, (rand() - 0.5) * 1.5];
}

function starOffset(key: string): Vec {
  const rand = seeded(key);
  return [(rand() - 0.5) * 1.8, (rand() - 0.5) * 1.3, (rand() - 0.5) * 1.2];
}

function Star({ position, animate }: { position: Vec; animate: boolean }) {
  const ref = useRef<Group>(null);

  useLayoutEffect(() => {
    const group = ref.current;
    if (!group || !animate) return;
    const tween = gsap.fromTo(
      group.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 1, ease: 'back.out(2.4)' },
    );
    return () => {
      tween.kill();
    };
  }, [animate]);

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffe9a8" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshBasicMaterial
          color="#ffb94d"
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Dust({ count = 350 }: { count?: number }) {
  const positions = useMemo(() => {
    const rand = seeded('dust');
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 16;
      arr[i * 3 + 1] = (rand() - 0.5) * 9;
      arr[i * 3 + 2] = (rand() - 0.5) * 8 - 2;
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#cfd9ff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Constellations({ groups, reduced }: { groups: SkyGroup[]; reduced: boolean }) {
  const root = useRef<Group>(null);

  // Gentle sway, not a spin, so clusters stay readable.
  useFrame(({ clock }) => {
    if (root.current && !reduced) {
      root.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.3;
      root.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.06;
    }
  });

  return (
    <group ref={root}>
      <Dust />
      {groups.map(({ theme, keys }) => {
        const center = clusterCenter(theme);
        const points: Vec[] = keys.map((k) => {
          const o = starOffset(`${theme}-${k}`);
          return [center[0] + o[0], center[1] + o[1], center[2] + o[2]];
        });
        const segments = new Float32Array(Math.max(0, points.length - 1) * 6);
        for (let i = 0; i < points.length - 1; i++) segments.set([...points[i], ...points[i + 1]], i * 6);

        return (
          <group key={theme}>
            {points.length > 1 && (
              <lineSegments key={segments.length}>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[segments, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#8ab4ff" transparent opacity={0.5} />
              </lineSegments>
            )}
            {points.map((p, i) => (
              <Star key={keys[i]} position={p} animate={!reduced} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

export default function EchoSky({ groups, inView }: { groups: SkyGroup[]; inView: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 50 }}
      dpr={[1, 2]}
      frameloop={reduced ? 'demand' : inView ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true }}
    >
      <Constellations groups={groups} reduced={reduced} />
    </Canvas>
  );
}
