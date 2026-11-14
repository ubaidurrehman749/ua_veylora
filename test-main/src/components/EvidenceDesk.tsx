import { useEffect, useId, useMemo, useState } from 'react';
import type { EvidenceClaim, EvidenceLabel, Mission } from '../types/mission';
import {
  EVIDENCE_LABEL_GLYPH,
  EVIDENCE_LABEL_ORDER,
  EVIDENCE_LABEL_TEXT,
} from '../data/evidenceLabels';
import './EvidenceDesk.css';
import { useSplitReveal } from '../hooks/useSplitReveal';

type Filter = 'all' | EvidenceLabel;

export interface EvidenceDeskProps {
  mission: Pick<Mission, 'name' | 'evidence' | 'sources' | 'verified'>;
  /** Render unverified records. Defaults to dev builds only. */
  allowUnverified?: boolean;
}

export function EvidenceDesk({
  mission,
  allowUnverified = import.meta.env.DEV,
}: EvidenceDeskProps) {
  const uid = useId();
  const headingId = `${uid}-heading`;

  const titleRef = useSplitReveal<HTMLSpanElement>(mission.name);
  const [filter, setFilter] = useState<Filter>('all');

  const sourcesById = useMemo(
    () => new Map(
        mission.sources.flatMap((s) => (s.id ? [[s.id, s] as const] : [])),
      ),
    [mission.sources],
  );

  const counts = useMemo(() => {
    const c: Record<EvidenceLabel, number> = {
      confirmed: 0,
      interpretation: 0,
      unknown: 0,
    };
    mission.evidence.forEach((e) => (c[e.label] += 1));
    return c;
  }, [mission.evidence]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    mission.evidence.forEach((e) => {
      if (!sourcesById.has(e.sourceId)) {
        console.error(`EvidenceDesk: unknown sourceId "${e.sourceId}" in ${mission.name}`);
      }
    });
  }, [mission.evidence, mission.name, sourcesById]);

  if (!mission.verified && !allowUnverified) return null;

  const visible: EvidenceClaim[] =
    filter === 'all'
      ? mission.evidence
      : mission.evidence.filter((e) => e.label === filter);

  const filters: { key: Filter; text: string; count: number }[] = [
    { key: 'all', text: 'All', count: mission.evidence.length },
    ...EVIDENCE_LABEL_ORDER.map((l) => ({
      key: l,
      text: EVIDENCE_LABEL_TEXT[l],
      count: counts[l],
    })),
  ];

  return (
    <section className="evidence-desk" aria-labelledby={headingId}>
      <h2 id={headingId} className="evidence-desk__title">
        <span className="evidence-desk__eyebrow">Evidence desk</span>
        <span className="evidence-desk__sr-only">: </span>
        <span ref={titleRef} className="evidence-desk__name">{mission.name}</span>
      </h2>

      {!mission.verified && (
        <p className="evidence-desk__dev-note">
          Unverified content. Shown in development builds only.
        </p>
      )}

      <div
        className="evidence-desk__filters"
        role="group"
        aria-label="Filter findings by label"
      >
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className="evidence-desk__filter"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.text} <span aria-hidden="true">({f.count})</span>
            <span className="evidence-desk__sr-only"> ({f.count} findings)</span>
          </button>
        ))}
      </div>

      <p className="evidence-desk__status" role="status">
        Showing {visible.length} of {mission.evidence.length} findings
      </p>

      {visible.length === 0 ? (
        <p className="evidence-desk__empty">
          No findings with this label for this object.
        </p>
      ) : (
        <ul className="evidence-desk__list">
          {visible.map((claim, i) => {
            const source = sourcesById.get(claim.sourceId);
            return (
              <li
                key={`${claim.label}-${i}`}
                className={`evidence-claim evidence-claim--${claim.label}`}
              >
                <span
                  className={`evidence-badge evidence-badge--${claim.label}`}
                >
                  <span aria-hidden="true" className="evidence-badge__glyph">
                    {EVIDENCE_LABEL_GLYPH[claim.label]}
                  </span>
                  {EVIDENCE_LABEL_TEXT[claim.label]}
                </span>
                <p className="evidence-claim__text">{claim.text}</p>
                {source ? (
                  <p className="evidence-claim__source">
                    Source:{' '}
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                      <span className="evidence-desk__sr-only">
                        {' '}
                        ({source.publisher}, opens in a new tab)
                      </span>
                    </a>
                  </p>
                ) : (
                  import.meta.env.DEV && (
                    <p className="evidence-claim__source evidence-claim__source--missing">
                      Dev only: no source found for "{claim.sourceId}"
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
