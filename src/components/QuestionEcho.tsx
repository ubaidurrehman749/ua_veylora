import { Suspense, lazy, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Mission, QuestionTheme } from '../types/mission';
import { THEME_ORDER, THEME_TEXT } from '../data/display';
import { useReveal } from '../hooks/useReveal';
import type { OpenQuestionAnswer } from './OpenQuestion';
import './QuestionEcho.css';
import { useSplitReveal } from '../hooks/useSplitReveal';

// Three.js loads only when the Echo is rendered, keeping it out of the first scene's bundle.
const EchoSky = lazy(() => import('./EchoSky'));

export interface QuestionEchoProps {
  answers: OpenQuestionAnswer[];
  missions: Pick<Mission, 'id' | 'name'>[];
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function QuestionEcho({ answers, missions }: QuestionEchoProps) {
  const headingId = `${useId()}-heading`;

  const titleRef = useSplitReveal<HTMLSpanElement>();
  const names = useMemo(() => new Map(missions.map((m) => [m.id, m.name])), [missions]);
  const [hasGl] = useState(webglAvailable);

  const groups = useMemo(
    () =>
      THEME_ORDER.map((theme) => ({
        theme,
        items: answers.filter((a) => a.theme === theme),
      })).filter((g) => g.items.length > 0),
    [answers],
  );

  const skyGroups = useMemo(
    () => groups.map((g) => ({ theme: g.theme, keys: g.items.map((a) => a.missionId) })),
    [groups],
  );

  // Stop rendering frames while the sky is off screen.
  const skyRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = skyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [hasGl]);

  return (
    <section className="echo" aria-labelledby={headingId}>
      <h2 id={headingId} className="echo__title">
        <span className="echo__eyebrow">Question Echo</span>
        <span className="echo__sr-only">: </span>
        <span ref={titleRef} className="echo__name">Your questions among the stars</span>
      </h2>

      <p className="echo__summary" role="status">
        {answers.length === 0
          ? 'No stars yet.'
          : `${answers.length} ${answers.length === 1 ? 'star' : 'stars'} across ${groups.length} ${groups.length === 1 ? 'theme' : 'themes'}.`}
      </p>

      {hasGl && (
        // Decorative: every question is also listed as text below.
        <div ref={skyRef} className="echo__sky" aria-hidden="true">
          <Suspense fallback={null}>
            <EchoSky groups={skyGroups} inView={inView} />
          </Suspense>
        </div>
      )}

      {answers.length === 0 ? (
        <p className="echo__empty">
          Answer an Open Question and your idea will appear here as a star.
        </p>
      ) : (
        <div className="echo__grid">
          {groups.map(({ theme, items }) => (
            <ConstellationCard key={theme} theme={theme} items={items} names={names} />
          ))}
        </div>
      )}
    </section>
  );
}

function ConstellationCard({
  theme,
  items,
  names,
}: {
  theme: QuestionTheme;
  items: OpenQuestionAnswer[];
  names: Map<string, string>;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <article ref={ref} className="echo__card">
      <h3 className="echo__theme">
        {THEME_TEXT[theme]}
        <span className="echo__count">
          {items.length} {items.length === 1 ? 'star' : 'stars'}
        </span>
      </h3>

      <ul className="echo__list">
        {items.map((a, i) => (
          <li key={`${a.missionId}-${i}`}>
            <span className="echo__object">{names.get(a.missionId) ?? a.missionId}</span>
            <span className="echo__idea">{a.choice}</span>
            {a.evidence && <span className="echo__evidence">Test it with: {a.evidence}</span>}
          </li>
        ))}
      </ul>
    </article>
  );
}
