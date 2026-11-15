'use client'; // Safe in Next.js (PRD 11) and ignored by Vite (team sheet).

import { Component, Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { ModelHotspot, ModelStatus, ViewerApi } from './types';
import type { Setting } from './Backdrop';
import './ModelViewer.css';

// The 3D scene is a separate chunk: three.js only downloads when a viewer is
// about to be seen, so the first scene stays fast on a phone (PRD 10: performance).
const ModelScene = lazy(() => import('./ModelScene'));

export interface ModelViewerProps {
  /** Optimised .glb, e.g. "/models/opportunity.glb". Missing or broken → the image fallback is shown. */
  modelPath?: string;
  /** Picture shown while loading, and instead of the model if 3D is unavailable. */
  fallbackSrc: string;
  /** Describes the object for people who can't see the 3D view. Required. */
  alt: string;
  /** Object name for the info card (PRD 5.2 "Meet the object"). */
  title?: string;
  /** Short place line above the name, e.g. "Mars · Meridiani Planum". */
  place?: string;
  /** Status badge. Wording follows PRD 6.1: Inactive, Silent, Still operating. */
  status?: ModelStatus;
  /** One-line hook under the name (PRD 5.2). */
  hook?: string;
  /** Clickable parts (P2). Optional. */
  hotspots?: ModelHotspot[];
  /** The world behind the object: 'moon' or 'mars'. Default 'mars'. */
  setting?: Setting;
  /**
   * 'overlay' (default): parts list under the viewer, part details pop up inside it.
   * 'split': viewer on the left, parts list and a detail card on the right (stacks on phones).
   */
  layout?: 'overlay' | 'split';
  className?: string;
}

// Same words and glyphs as the rest of the project (Fact Panel, Timeline).
const STATUS: Record<ModelStatus, { text: string; glyph: string }> = {
  inactive: { text: 'Inactive', glyph: '■' },
  silent: { text: 'Silent', glyph: '◌' },
  operating: { text: 'Still operating', glyph: '●' },
};

const STEP = Math.PI / 12; // 15° per press
const ZOOM_IN = 0.8;
const ZOOM_OUT = 1.25;

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false; // server render: decide on the client
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function useReducedMotionLocal(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

// Small inline icons (no icon library to download).
const Icon = {
  left: <path d="M9 4 4 9l5 5M4 9h8a5 5 0 0 1 0 10h-1" />,
  right: <path d="m15 4 5 5-5 5m5-5h-8a5 5 0 0 0 0 10h1" />,
  zoomIn: <path d="M10.5 6v9M6 10.5h9M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.6-1.9L20 20" />,
  zoomOut: <path d="M6 10.5h9M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm4.6-1.9L20 20" />,
  reset: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  shrink: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};
function Svg({ d }: { d: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {d}
    </svg>
  );
}

export function ModelViewer({
  modelPath,
  fallbackSrc,
  alt,
  title,
  place,
  status,
  hook,
  hotspots = [],
  setting = 'mars',
  layout = 'overlay',
  className,
}: ModelViewerProps) {
  const uid = useId();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const api = useRef<ViewerApi | null>(null);
  const reduced = useReducedMotionLocal();

  const [near, setNear] = useState(false); // close enough to start loading (lazy)
  const [inView, setInView] = useState(false); // on screen right now (pause when not)
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  // Decided on the client only, so a server render never touches WebGL or the DOM.
  useEffect(() => {
    setSupported(webglAvailable());
    setCanFullscreen(!!document.fullscreenEnabled);
  }, []);

  const show3d = Boolean(modelPath) && supported && !failed;

  useEffect(() => {
    const el = stage.current;
    if (!el || !show3d) return;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      setInView(true);
      return;
    }
    const nearIo = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          nearIo.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    const viewIo = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.01 });
    nearIo.observe(el);
    viewIo.observe(el);
    return () => {
      nearIo.disconnect();
      viewIo.disconnect();
    };
  }, [show3d]);

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);
  const onProgress = useCallback((p: number) => setProgress(p), []);

  const select = useCallback(
    (id: string | null) => {
      setActiveId(id);
      const h = hotspots.find((x) => x.id === id);
      api.current?.focus(h ? h.position : null);
    },
    [hotspots],
  );

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen();
  };

  function onKeyDown(e: KeyboardEvent) {
    const a = api.current;
    if (!a) return;
    const map: Record<string, () => void> = {
      ArrowLeft: () => a.rotate(-STEP),
      ArrowRight: () => a.rotate(STEP),
      '+': () => a.zoom(ZOOM_IN),
      '=': () => a.zoom(ZOOM_IN),
      '-': () => a.zoom(ZOOM_OUT),
      '0': () => select(null),
      Escape: () => select(null),
    };
    const run = map[e.key];
    if (run) {
      e.preventDefault();
      run();
    }
  }

  const active = hotspots.find((h) => h.id === activeId) ?? null;
  const activeIndex = active ? hotspots.indexOf(active) + 1 : 0;
  const st = status ? STATUS[status] : null;
  const message = !show3d ? 'The 3D view is not available here, so you are seeing a picture instead.' : '';
  const hasCard = Boolean(title || st);
  const split = layout === 'split';

  return (
    <section
      ref={root}
      className={`mv mv--${setting} mv--${layout}${fullscreen ? ' is-fullscreen' : ''} ${className ?? ''}`}
      aria-label={`3D viewer: ${title ?? alt}`}
    >
      <div className="mv__main">
      <div
        ref={stage}
        data-lenis-prevent-wheel
        className={`mv__stage${ready ? ' is-ready' : ''}`}
        tabIndex={show3d ? 0 : -1}
        onKeyDown={onKeyDown}
        aria-describedby={show3d ? `${uid}-help` : undefined}
        role={show3d ? 'group' : undefined}
        aria-roledescription={show3d ? '3D model viewer' : undefined}
      >
        {/* Always rendered: it is the poster while loading and the answer when 3D fails. */}
        <img className="mv__fallback" src={fallbackSrc} alt={alt} loading="lazy" decoding="async" />

        {show3d && near && (
          <Boundary onError={onError}>
            <Suspense fallback={null}>
              <ModelScene
                modelPath={modelPath!}
                hotspots={hotspots}
                activeId={activeId}
                onSelect={select}
                onReady={onReady}
                onProgress={onProgress}
                api={api}
                reduced={reduced}
                setting={setting}
                active={inView || fullscreen}
                frameForCard={hasCard}
              />
            </Suspense>
          </Boundary>
        )}

        {/* Info card: name, place, status, one-line hook. */}
        {hasCard && (
          <div className="mv__card">
            {place && <p className="mv__place">{place}</p>}
            {title && <p className="mv__name">{title}</p>}
            {st && (
              <p className={`mv__badge mv__badge--${status}`}>
                <span aria-hidden="true">{st.glyph}</span> {st.text}
              </p>
            )}
            {hook && <p className="mv__hook">{hook}</p>}
          </div>
        )}

        {show3d && !ready && (
          <div className="mv__loader" role="status" aria-live="polite">
            <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">
              <circle cx="24" cy="24" r="20" className="mv__loader-track" />
              <circle cx="24" cy="24" r="20" className="mv__loader-bar" style={{ strokeDashoffset: 125.7 * (1 - progress / 100) }} />
            </svg>
            <span>Loading 3D model… {Math.round(progress)}%</span>
          </div>
        )}

        {message && (
          <p className="mv__status" role="status">
            {message}
          </p>
        )}

        {/* Part details for the selected hotspot (in split layout they show in the side card instead). */}
        {show3d && ready && !split && (
          // Stays in the DOM (empty when closed) so screen readers announce each new part.
          <div className={`mv__callout${active ? ' is-open' : ''}`} role="status" aria-live="polite">
            {active && (
              <>
                <span className="mv__callout-num" aria-hidden="true">
                  {activeIndex}
                </span>
                <div>
                  <p className="mv__callout-title">{active.label}</p>
                  <p className="mv__callout-text">{active.description}</p>
                </div>
                <button type="button" className="mv__icon-btn mv__callout-close" onClick={() => select(null)} aria-label="Close part details">
                  <Svg d={Icon.close} />
                </button>
              </>
            )}
          </div>
        )}

        {show3d && (
          <div className="mv__dock" role="group" aria-label="Model controls">
            <button type="button" className="mv__icon-btn" onClick={() => api.current?.rotate(-STEP)} disabled={!ready} aria-label="Rotate left" title="Rotate left (←)">
              <Svg d={Icon.left} />
            </button>
            <button type="button" className="mv__icon-btn" onClick={() => api.current?.rotate(STEP)} disabled={!ready} aria-label="Rotate right" title="Rotate right (→)">
              <Svg d={Icon.right} />
            </button>
            <span className="mv__dock-sep" aria-hidden="true" />
            <button type="button" className="mv__icon-btn" onClick={() => api.current?.zoom(ZOOM_IN)} disabled={!ready} aria-label="Zoom in" title="Zoom in (+)">
              <Svg d={Icon.zoomIn} />
            </button>
            <button type="button" className="mv__icon-btn" onClick={() => api.current?.zoom(ZOOM_OUT)} disabled={!ready} aria-label="Zoom out" title="Zoom out (−)">
              <Svg d={Icon.zoomOut} />
            </button>
            <span className="mv__dock-sep" aria-hidden="true" />
            <button type="button" className="mv__icon-btn" onClick={() => select(null)} disabled={!ready} aria-label="Reset view" title="Reset view (0)">
              <Svg d={Icon.reset} />
            </button>
            {canFullscreen && (
              <button
                type="button"
                className="mv__icon-btn"
                onClick={toggleFullscreen}
                aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
                title={fullscreen ? 'Exit full screen' : 'Full screen'}
              >
                <Svg d={fullscreen ? Icon.shrink : Icon.expand} />
              </button>
            )}
          </div>
        )}
      </div>

      {show3d && (
        <p id={`${uid}-help`} className="mv__help">
          Drag to rotate, scroll or pinch to zoom. Keyboard: arrow keys rotate, + and − zoom, 0 resets, Esc closes part details.
        </p>
      )}
      </div>

      {hotspots.length > 0 && show3d && (
        <div className="mv__side">
          <p className="mv__parts-title" id={`${uid}-parts`}>
            {split ? 'Tap a part to learn what it did' : 'Parts to explore'}
          </p>
          <ol className="mv__parts-list" aria-labelledby={`${uid}-parts`}>
            {hotspots.map((h, i) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={activeId === h.id ? 'is-active' : undefined}
                  aria-pressed={activeId === h.id}
                  disabled={!ready}
                  onClick={() => select(activeId === h.id ? null : h.id)}
                >
                  <span className="mv__part-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  {h.label}
                </button>
              </li>
            ))}
          </ol>
          {split && (
            <div className={`mv__detail${active ? ' is-open' : ''}`} role="status" aria-live="polite">
              {active ? (
                <>
                  <p className="mv__detail-title">{active.label}</p>
                  <p className="mv__detail-text">{active.description}</p>
                </>
              ) : (
                <p className="mv__detail-text">Pick a numbered part, on the model or in the list, to see what it did.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
