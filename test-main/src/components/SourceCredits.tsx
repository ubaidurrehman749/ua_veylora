import { useId } from 'react';
import type { Credit, Source } from '../types/mission';
import './SourceCredits.css';
import { useSplitReveal } from '../hooks/useSplitReveal';

export interface SourceCreditsProps {
  sources: Source[];
  credits: Credit[];
  title?: string;
}

export function SourceCredits({
  sources,
  credits,
  title = 'Sources and credits',
}: SourceCreditsProps) {
  const headingId = `${useId()}-heading`;

  const titleRef = useSplitReveal<HTMLSpanElement>(title);

  return (
    <section className="source-credits" aria-labelledby={headingId}>
      <h2 id={headingId} className="source-credits__title">
        <span className="source-credits__eyebrow">Where this comes from</span>
        <span className="source-credits__sr-only">: </span>
        <span ref={titleRef} className="source-credits__name">{title}</span>
      </h2>

      <div className="source-credits__grid">
        <div>
          <h3 className="source-credits__heading">Sources</h3>
          {sources.length === 0 ? (
            <p className="source-credits__empty">No sources listed.</p>
          ) : (
            <ul className="source-credits__list">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                    <span className="source-credits__sr-only">
                      {' '}
                      (opens in a new tab)
                    </span>
                  </a>
                  <span className="source-credits__meta">{s.publisher}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="source-credits__heading">Image and model credits</h3>
          {credits.length === 0 ? (
            <p className="source-credits__empty">No asset credits listed.</p>
          ) : (
            <ul className="source-credits__list">
              {credits.map((c) => (
                <li key={`${c.asset}-${c.source}`}>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.asset}
                      <span className="source-credits__sr-only">
                        {' '}
                        (opens in a new tab)
                      </span>
                    </a>
                  ) : (
                    <span className="source-credits__asset">{c.asset}</span>
                  )}
                  <span className="source-credits__meta">
                    {c.source} · {c.license}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
