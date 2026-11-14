import { useId } from 'react';
import type { Mission } from '../types/mission';
import { STATUS_GLYPH, STATUS_TEXT, formatDate } from '../data/display';
import './FactPanel.css';
import { useSplitReveal } from '../hooks/useSplitReveal';

export interface FactPanelProps {
  mission: Pick<
    Mission,
    'name' | 'date' | 'location' | 'goal' | 'payload' | 'status' | 'sources' | 'verified'
  >;
  /** Render unverified records. Defaults to dev builds only. */
  allowUnverified?: boolean;
}

export function FactPanel({
  mission,
  allowUnverified = import.meta.env.DEV,
}: FactPanelProps) {
  const headingId = `${useId()}-heading`;

  const titleRef = useSplitReveal<HTMLSpanElement>(mission.name);

  if (!mission.verified && !allowUnverified) return null;

  const { status } = mission;

  return (
    <section className="fact-panel" aria-labelledby={headingId}>
      <h2 id={headingId} className="fact-panel__title">
        <span className="fact-panel__eyebrow">Fact panel</span>
        <span className="fact-panel__sr-only">: </span>
        <span ref={titleRef} className="fact-panel__name">{mission.name}</span>
      </h2>

      {!mission.verified && (
        <p className="fact-panel__dev-note">
          Unverified content. Shown in development builds only.
        </p>
      )}

      <dl className="fact-panel__list">
        <div className="fact-panel__row fact-panel__row--tile">
          <dt>Date</dt>
          <dd>
            <time dateTime={mission.date}>{formatDate(mission.date)}</time>
          </dd>
        </div>
        <div className="fact-panel__row fact-panel__row--tile">
          <dt>Location</dt>
          <dd>{mission.location}</dd>
        </div>
        <div className="fact-panel__row fact-panel__row--tile">
          <dt>Current status</dt>
          <dd>
            <span className={`fact-status fact-status--${status.value}`}>
              <span aria-hidden="true">{STATUS_GLYPH[status.value]}</span>
              {STATUS_TEXT[status.value]}
            </span>
            <span className="fact-panel__checked">
              {status.checkedOn ? (
                <>
                  Last confirmed{' '}
                  <time dateTime={status.checkedOn}>
                    {formatDate(status.checkedOn)}
                  </time>
                </>
              ) : (
                'Status not yet confirmed'
              )}
            </span>
          </dd>
        </div>
        <div className="fact-panel__row fact-panel__row--wide fact-panel__row--lead">
          <dt>Purpose</dt>
          <dd>{mission.goal}</dd>
        </div>
        <div className="fact-panel__row fact-panel__row--wide">
          <dt>Key instruments</dt>
          <dd>
            <ul className="fact-panel__payload">
              {mission.payload.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div className="fact-panel__sources">
        <h3 className="fact-panel__sources-title">Sources</h3>
        <ul>
          {mission.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
                <span className="fact-panel__sr-only">
                  {' '}
                  ({s.publisher}, opens in a new tab)
                </span>
              </a>
              <span aria-hidden="true"> · {s.publisher}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
