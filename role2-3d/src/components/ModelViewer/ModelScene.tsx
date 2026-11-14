import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls, PerformanceMonitor, useGLTF, useProgress } from '@react-three/drei';
import { ACESFilmicToneMapping, Box3, Spherical, Vector3, type Camera, type Mesh, type PerspectiveCamera } from 'three';
import type { ModelHotspot, ViewerApi } from './types';
import { Backdrop, LOOKS, SUN, type Setting } from './Backdrop';

// The 3D part of the viewer. It is loaded lazily (see ModelViewer.tsx) so three.js,
// R3F and Drei stay out of the first-scene bundle.

interface ControlsLike {
  object: Camera;
  target: Vector3;
  autoRotate: boolean;
  update: () => void;
  saveState: () => void;
  reset: () => void;
}

interface SceneProps {
  modelPath: string;
  hotspots: ModelHotspot[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onReady: () => void;
  onProgress: (percent: number) => void;
  api: MutableRefObject<ViewerApi | null>;
  reduced: boolean;
  setting: Setting;
  /** False while the viewer is scrolled off-screen: rendering pauses to save battery. */
  active: boolean;
  /** True when the info card is shown, so the object is framed to leave room for it. */
  frameForCard: boolean;
}

// Models arrive in any size. Scale and centre each one into a ~2 unit box so the
// camera, zoom limits and hotspot positions mean the same thing for every model.
const FIT_SIZE = 2;
const HOME_POS = new Vector3(2.4, 0.5, 3.1);
const HOME_TARGET = new Vector3(0, -0.12, 0);
const FOCUS_DISTANCE = 2.5;

function Model({ modelPath, hotspots, activeId, onSelect, onReady, setting, reduced }: Omit<SceneProps, 'api' | 'onProgress' | 'active' | 'frameForCard'>) {
  // useDraco=false: we ship Meshopt-compressed files, so no decoder is fetched from a CDN.
  const { scene } = useGLTF(modelPath, false, true);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    // Every part casts and receives shadows, so the object sits properly on the ground.
    clone.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const fit = useMemo(() => {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = FIT_SIZE / Math.max(size.x, size.y, size.z, 0.0001);
    return {
      scale,
      offset: center.clone().multiplyScalar(-scale).toArray() as [number, number, number],
      floorY: (box.min.y - center.y) * scale,
    };
  }, [model]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <>
      <Backdrop setting={setting} floorY={fit.floorY} reduced={reduced} />
      <group scale={fit.scale} position={fit.offset}>
        <primitive object={model} />
      </group>

      {/* Hotspot positions are in the normalised space, so they stay valid for any model size. */}
      {hotspots.map((h, i) => {
        const on = activeId === h.id;
        return (
          // z-index stays below the info card (3), so a marker never covers its text.
          <Html key={h.id} position={h.position} center zIndexRange={[2, 0]}>
            <button
              type="button"
              className={`mv__hotspot${on ? ' is-active' : ''}`}
              aria-label={`${i + 1}. ${h.label}. ${on ? 'Hide' : 'Show'} details`}
              aria-pressed={on}
              // Keep the press and click away from the canvas: otherwise OrbitControls captures
              // the pointer (so the click never reaches this button) and the canvas treats it as
              // a click on empty space (which would close the part again).
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(on ? null : h.id);
              }}
            >
              <span className="mv__hotspot-dot">{i + 1}</span>
              <span className="mv__hotspot-label" aria-hidden="true">
                {h.label}
              </span>
            </button>
          </Html>
        );
      })}
    </>
  );
}

// On wide screens, frame the object a little right of centre so the info card on the
// left never sits on top of it. Orbiting is unaffected: this only shifts the picture.
function FrameOffset({ enabled }: { enabled: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    // Narrow screens: widen the lens a little so the object fits between the card and the dock.
    camera.zoom = enabled && aspect < 0.95 ? 0.82 : 1;
    if (!enabled) {
      camera.clearViewOffset(); // no info card: keep the object centred
    } else if (aspect > 1.15) {
      // wide: card on the left, so frame the object to the right
      camera.setViewOffset(size.width, size.height, -size.width * 0.13, 0, size.width, size.height);
    } else if (aspect < 0.95) {
      // tall (phones): card on top, so frame the object lower
      camera.setViewOffset(size.width, size.height, 0, -size.height * 0.19, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate, enabled]);
  return null;
}

function Progress({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);
  return null;
}

function Rig({ api, reduced }: { api: MutableRefObject<ViewerApi | null>; reduced: boolean }) {
  const controls = useRef<ControlsLike | null>(null);
  const goal = useRef<{ target: Vector3; pos: Vector3 } | null>(null);
  const homeSaved = useRef(false);
  const invalidate = useThree((s) => s.invalidate);

  // Glide toward a goal (a hotspot, or home). Reduced motion jumps straight there.
  const glideTo = (target: Vector3, pos: Vector3) => {
    const c = controls.current;
    if (!c) return;
    c.autoRotate = false;
    if (reduced) {
      c.target.copy(target);
      c.object.position.copy(pos);
      c.update();
      goal.current = null;
      invalidate();
    } else {
      goal.current = { target: target.clone(), pos: pos.clone() };
    }
  };

  useEffect(() => {
    const c = controls.current;
    if (c && !homeSaved.current) {
      c.saveState(); // the starting view, used by reset
      homeSaved.current = true;
      if (!reduced) {
        // Intro: start further out and glide in once.
        c.object.position.copy(HOME_POS.clone().sub(HOME_TARGET).multiplyScalar(1.8).add(HOME_TARGET));
        c.update();
        goal.current = { target: HOME_TARGET.clone(), pos: HOME_POS.clone() };
      }
    }
    api.current = {
      rotate(radians) {
        const ctl = controls.current;
        if (!ctl) return;
        goal.current = null;
        const offset = ctl.object.position.clone().sub(ctl.target);
        const sph = new Spherical().setFromVector3(offset);
        sph.theta += radians;
        offset.setFromSpherical(sph);
        ctl.object.position.copy(ctl.target).add(offset);
        ctl.autoRotate = false;
        ctl.update();
        invalidate();
      },
      zoom(factor) {
        const ctl = controls.current;
        if (!ctl) return;
        goal.current = null;
        const offset = ctl.object.position.clone().sub(ctl.target).multiplyScalar(factor);
        ctl.object.position.copy(ctl.target).add(offset);
        ctl.autoRotate = false;
        ctl.update(); // OrbitControls clamps the distance to min/max itself
        invalidate();
      },
      reset() {
        glideTo(HOME_TARGET, HOME_POS);
      },
      focus(p) {
        const ctl = controls.current;
        if (!ctl) return;
        if (!p) return glideTo(HOME_TARGET, HOME_POS);
        const target = new Vector3(...p);
        // Keep the current viewing direction, just move closer to the part.
        const dir = ctl.object.position.clone().sub(ctl.target).normalize();
        glideTo(target, target.clone().add(dir.multiplyScalar(FOCUS_DISTANCE)));
      },
    };
    return () => {
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, reduced, invalidate]);

  useFrame((_, dt) => {
    const g = goal.current;
    const c = controls.current;
    if (!g || !c) return;
    const k = 1 - Math.exp(-dt * 3.2); // frame-rate independent ease-out
    c.target.lerp(g.target, k);
    c.object.position.lerp(g.pos, k);
    c.update();
    if (c.object.position.distanceTo(g.pos) < 0.004 && c.target.distanceTo(g.target) < 0.004) goal.current = null;
  });

  return (
    <OrbitControls
      ref={(ctl) => {
        controls.current = ctl as unknown as ControlsLike | null;
      }}
      makeDefault
      enablePan={false}
      target={HOME_TARGET.toArray() as [number, number, number]}
      minDistance={1.6}
      maxDistance={7.5}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.05} // never dip below the ground
      enableDamping={!reduced}
      dampingFactor={0.08}
      autoRotate={!reduced}
      autoRotateSpeed={0.6}
      onStart={() => {
        goal.current = null; // the learner takes over
        if (controls.current) controls.current.autoRotate = false;
      }}
    />
  );
}

export default function ModelScene(props: SceneProps) {
  const { api, onProgress, active, frameForCard, ...modelProps } = props;
  const { reduced, setting } = modelProps;
  const look = LOOKS[setting];
  const sunPos = SUN.clone().multiplyScalar(9).toArray() as [number, number, number];
  // Start sharp; drop to 1x pixel density if the device struggles (phones, old laptops).
  const [dpr, setDpr] = useState(() => (typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2)));

  return (
    <Canvas
      className="mv__canvas"
      shadows
      camera={{ position: HOME_POS.toArray() as [number, number, number], fov: 35, near: 0.1, far: 300 }}
      dpr={dpr}
      frameloop={reduced || !active ? 'demand' : 'always'}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: look.exposure,
      }}
      onPointerMissed={() => {
        if (modelProps.activeId) modelProps.onSelect(null);
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <Progress onProgress={onProgress} />
      <FrameOffset enabled={frameForCard} />

      {/* Image-based lighting built from a few light panels: realistic reflections on the metal, no HDR file to download. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.85}>
        <color attach="background" args={[look.envTint]} />
        <Lightformer form="rect" intensity={5} position={[-4, 5, 3]} scale={[7, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#9fb4ff" position={[5, 2, -4]} scale={[5, 4, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffe6cc" position={[0, 4, -5]} scale={3} />
        <Lightformer form="rect" intensity={0.6} position={[0, -2, 4]} scale={[8, 1, 1]} />
      </Environment>

      <ambientLight intensity={0.12} />
      <hemisphereLight args={[look.skyHorizon, look.groundDark, 0.3]} />
      {/* The sun: key light and shadow caster. */}
      <directionalLight position={sunPos} intensity={3.2} castShadow shadow-mapSize={[1536, 1536]} shadow-bias={-0.0004} shadow-normalBias={0.02}>
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.5, 26]} />
      </directionalLight>
      <directionalLight position={[5, 2, -4]} intensity={0.6} color="#9fb4ff" />

      <Suspense fallback={null}>
        <Model {...modelProps} />
      </Suspense>
      <Rig api={api} reduced={reduced} />
    </Canvas>
  );
}
