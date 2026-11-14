import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from '../lib/gsap';
import type { Mission } from '../types/mission';
import { STATUS_GLYPH, STATUS_TEXT, bodyOf, formatDate } from '../data/display';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useReveal } from '../hooks/useReveal';
import { useSplitReveal } from '../hooks/useSplitReveal';
import './Timeline.css';

export interface TimelineProps {
  missions: Pick<Mission, 'id' | 'name' | 'date' | 'location' | 'goal' | 'status' | 'verified'>[];
  /** Called when a learner opens an object from the timeline. */
  onSelect?: (id: string) => void;
  /** Render unverified records. Defaults to dev builds only. */
  allowUnverified?: boolean;
}

const BODY_GLYPH = { Moon: '☾', Mars: '♂', 'Deep space': '✦' } as const;

export function Timeline({
  missions,
  onSelect,
  allowUnverified = import.meta.env.DEV,
}: TimelineProps) {
  const headingId = `${useId()}-heading`;

  const items = useMemo(
    () =>
      missions
        .filter((m) => m.verified || allowUnverified)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [missions, allowUnverified],
  );

  // The rail is tied to scroll: it draws downward as the reader moves through time,
  // and each date lights up as the rail reaches it.
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const titleRef = useSplitReveal<HTMLSpanElement>();
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const trackEl = track.current;
    const railEl = rail.current;
    if (!trackEl || !railEl || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        railEl,
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: trackEl, start: 'top 75%', end: 'bottom 60%', scrub: 0.8 },
        },
      );
      gsap.utils.toArray<HTMLElement>('.timeline__date', trackEl).forEach((date) => {
        gsap.from(date, {
          opacity: 0.25,
          x: -12,
          letterSpacing: '0.3em',
          duration: 0.8,
          scrollTrigger: { trigger: date, start: 'top 70%', toggleActions: 'play none none reverse' },
        });
      });
    }, trackEl);

    return () => ctx.revert();
  }, [reduced, items.length]);

  if (items.length === 0) return null;

  return (
    <section className="timeline" aria-labelledby={headingId}>
      <h2 id={headingId} className="timeline__title">
        <span className="timeline__eyebrow">Mission timeline</span>
        <span className="timeline__sr-only">: </span>
        <span ref={titleRef} className="timeline__name">Machines across time</span>
      </h2>

      <div ref={track} className="timeline__track">
        <span ref={rail} className="timeline__rail" aria-hidden="true" />
        <ol className="timeline__list">
          {items.map((m) => (
            <TimelineItem key={m.id} mission={m} onSelect={onSelect} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function TimelineItem({
  mission: m,
  onSelect,
}: {
  mission: TimelineProps['missions'][number];
  onSelect?: (id: string) => void;
}) {
  const ref = useReveal<HTMLLIElement>();
  const body = bodyOf(m.location);
  return (
    <li ref={ref} className="timeline__item">
      <time className="timeline__date" dateTime={m.date}>
        {formatDate(m.date)}
      </time>
      <div className="timeline__card">
        <div className="timeline__tags">
          <span className="timeline__tag timeline__tag--body">
            <span aria-hidden="true">{BODY_GLYPH[body]}</span>
            {body}
          </span>
          <span className={`timeline__tag timeline__tag--${m.status.value}`}>
            <span aria-hidden="true">{STATUS_GLYPH[m.status.value]}</span>
            {STATUS_TEXT[m.status.value]}
          </span>
        </div>
        <h3 className="timeline__object">
          {onSelect ? (
            <button type="button" className="timeline__link" onClick={() => onSelect(m.id)}>
              {m.name}
            </button>
          ) : (
            m.name
          )}
        </h3>
        <p className="timeline__goal">{m.goal}</p>
      </div>
    </li>
  );
}
