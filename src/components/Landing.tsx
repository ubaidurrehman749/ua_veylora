import { Component, Suspense, lazy, useLayoutEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Mission } from '../types/mission';
import { bodyOf } from '../data/display';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';
import { MagneticLink } from './fx';
import type { Site } from './HeroScene/Globe';

// three.js for the opening flight loads on its own, after the text is already on screen.
const HeroScene = lazy(() => import('./HeroScene/HeroScene'));

export interface LandingProps {
  missions: Pick<Mission, 'id' | 'name' | 'date' | 'location' | 'sites'>[];
  /** Called when a learner picks a machine, from a list or from a dot on a globe. */
  onPick: (missionId: string) => void;
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const year = (date: string) => date.slice(0, 4);

// Opening scene: a scroll-driven flight from the Moon to Mars, with each machine's
// resting place marked on the globes. Without WebGL the planets are drawn in CSS.
export function Landing({ missions, onPick }: LandingProps) {
  const track = useRef<HTMLElement>(null);
  const progress = useMemo(() => ({ value: 0 }), []);
  const webgl = useMemo(hasWebGL, []);

  const moon = missions.filter((m) => bodyOf(m.location) === 'Moon');
  const mars = missions.filter((m) => bodyOf(m.location) === 'Mars');

  const sitesOf = (list: typeof missions): Site[] =>
    list.flatMap((m) =>
      (m.sites ?? []).map((s, i) => ({ id: `${m.id}:${i}`, label: s.label, lat: s.lat, lon: s.lon })),
    );
  const moonSites = useMemo(() => sitesOf(moon), [missions]);
  const marsSites = useMemo(() => sitesOf(mars), [missions]);

  // Pin the 3D stage and scrub the camera flight and captions with the scroll.
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      progress.value = 0.25;
      return;
    }
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 1 };
      gsap.to(progress, { value: 1, ease: 'none', scrollTrigger: st });
      const tl = gsap.timeline({ scrollTrigger: st, defaults: { ease: 'power2.out' } });
      const fade = (sel: string, at: number, out: number | null) => {
        tl.fromTo(sel, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.06 }, at);
        if (out !== null) tl.to(sel, { autoAlpha: 0, y: -40, duration: 0.06 }, out);
      };
      tl.set('.step-0', { autoAlpha: 1 }, 0).to('.step-0', { autoAlpha: 0, y: -60, duration: 0.08 }, 0.08);
      fade('.step-1', 0.18, 0.42);
      fade('.step-2', 0.47, 0.58);
      fade('.step-3', 0.66, 0.88);
      fade('.step-4', 0.92, null);
      tl.to('.scroll-cue', { autoAlpha: 0, duration: 0.05 }, 0.04);
    }, el);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      window.clearTimeout(id);
      ctx.revert();
    };
  }, [progress]);

  const fallback = (
    <div className="hero-fallback" aria-hidden="true">
      <span className="planet planet-moon" style={{ width: 340, height: 340 }} />
      <span className="planet planet-mars" style={{ width: 180, height: 180 }} />
    </div>
  );

  const list = (items: typeof missions) => (
    <ul className="flight-list">
      {items.map((m) => (
        <li key={m.id}>
          <button type="button" onClick={() => onPick(m.id)}>
            {m.name}
          </button>
          <span>{year(m.date)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <header id="top" className="flight" ref={track} aria-label="Fly from the Moon to Mars">
      <div className="flight-stage">
        <div className="scene-fill">
          {webgl ? (
            <Boundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <HeroScene
                  progress={progress}
                  moonSites={moonSites}
                  marsSites={marsSites}
                  onPick={(siteId) => onPick(siteId.split(':')[0])}
                />
              </Suspense>
            </Boundary>
          ) : (
            fallback
          )}
        </div>

        <div className="flight-step step-0">
          <p className="eyebrow">NASA Space Apps Challenge 2026 · UA VEYLORA</p>
          <h1>
            Abandoned
            <br />
            <span className="accent">but Not Forgotten</span>
          </h1>
          <p className="lede">
            Their missions ended. Their discoveries did not. Explore the machines that changed
            planetary exploration and the questions they leave for the future.
          </p>
          <div className="hero-actions">
            <MagneticLink href="#missions" className="btn" cursor="Go">
              Explore the missions
            </MagneticLink>
            <MagneticLink href="#timeline" className="btn ghost" cursor="Go">
              See the timeline
            </MagneticLink>
          </div>
        </div>

        <div className="flight-step step-1 right">
          <p className="eyebrow">The Moon</p>
          <h2>Still parked where the astronauts left them</h2>
          {list(moon)}
          <p className="flight-note">Gold dots mark the landing sites. Tap one to open its story.</p>
        </div>

        <div className="flight-step step-2 center">
          <p className="eyebrow">Leaving the Moon</p>
          <h2>Millions of kilometres later…</h2>
          <p className="flight-note">Not to scale.</p>
        </div>

        <div className="flight-step step-3 right">
          <p className="eyebrow">Mars</p>
          <h2>Explorers now silent under red dust</h2>
          {list(mars)}
          <p className="flight-note">Gold dots mark where each one rests today.</p>
        </div>

        <div className="flight-step step-4">
          <p className="eyebrow">Your turn</p>
          <h2>Every machine left a question unanswered.</h2>
          <p className="lede">Meet them, weigh the evidence, and decide what the next mission should do.</p>
          <div className="hero-actions">
            <MagneticLink href="#missions" className="btn" cursor="Go">
              Meet the machines
            </MagneticLink>
          </div>
        </div>

        <p className="scroll-cue" aria-hidden="true">
          Scroll to fly ↓
        </p>
      </div>
    </header>
  );
}
