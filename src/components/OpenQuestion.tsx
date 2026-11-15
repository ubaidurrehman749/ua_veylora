import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Mission, QuestionTheme } from '../types/mission';
import './OpenQuestion.css';

export interface OpenQuestionAnswer {
  missionId: string;
  choice: string;
  evidence: string | null;
  theme: QuestionTheme;
}

export interface OpenQuestionProps {
  mission: Pick<Mission, 'id' | 'name' | 'openQuestion' | 'questionTheme' | 'verified'>;
  /** Pass a saved answer to start in the submitted state. */
  initialAnswer?: OpenQuestionAnswer | null;
  onSubmit: (answer: OpenQuestionAnswer) => void;
  /** Render unverified records. Defaults to dev builds only. */
  allowUnverified?: boolean;
}

const REFLECTION =
  "There isn't only one way to ask a good scientific question. Connect your idea to evidence.";

export function OpenQuestion({
  mission,
  initialAnswer = null,
  onSubmit,
  allowUnverified = import.meta.env.DEV,
}: OpenQuestionProps) {
  const uid = useId();
  const [choice, setChoice] = useState<string | null>(initialAnswer?.choice ?? null);
  const [evidence, setEvidence] = useState<string | null>(initialAnswer?.evidence ?? null);
  const [submitted, setSubmitted] = useState(initialAnswer !== null);
  const [error, setError] = useState(false);

  const firstChoice = useRef<HTMLInputElement>(null);
  const reflection = useRef<HTMLHeadingElement>(null);
  const justSubmitted = useRef(false);

  useEffect(() => {
    if (submitted && justSubmitted.current) {
      reflection.current?.focus();
      justSubmitted.current = false;
    }
  }, [submitted]);

  if (!mission.verified && !allowUnverified) return null;

  const { prompt, choices, evidenceOptions = [] } = mission.openQuestion;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!choice) {
      setError(true);
      firstChoice.current?.focus();
      return;
    }
    setError(false);
    justSubmitted.current = true;
    onSubmit({
      missionId: mission.id,
      choice,
      evidence,
      theme: mission.openQuestion.theme ?? mission.questionTheme,
    });
    setSubmitted(true);
  }

  if (submitted && choice) {
    return (
      <section
        className="open-question"
        aria-label={`Your question about ${mission.name}`}
      >
        <p className="open-question__eyebrow">Your question</p>
        <h2
          ref={reflection}
          tabIndex={-1}
          className="open-question__prompt"
        >
          {REFLECTION}
        </h2>
        <dl className="open-question__summary">
          <div>
            <dt>You would investigate</dt>
            <dd>{choice}</dd>
          </div>
          {evidence && (
            <div>
              <dt>To test it, you would use</dt>
              <dd>{evidence}</dd>
            </div>
          )}
        </dl>
        <button
          type="button"
          className="open-question__button open-question__button--ghost"
          onClick={() => setSubmitted(false)}
        >
          Change my answer
        </button>
      </section>
    );
  }

  const choiceName = `${uid}-choice`;
  const evidenceName = `${uid}-evidence`;

  return (
    <section className="open-question" aria-labelledby={`${uid}-prompt`}>
      <p className="open-question__eyebrow">What would you investigate next?</p>
      <h2 id={`${uid}-prompt`} className="open-question__prompt">
        {prompt}
      </h2>

      {!mission.verified && (
        <p className="open-question__dev-note">
          Unverified content. Shown in development builds only.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <fieldset
          className="open-question__group"
          aria-describedby={error ? `${uid}-error` : undefined}
        >
          <legend className="open-question__legend">Pick one idea</legend>
          {choices.map((c, i) => {
            const selected = choice === c;
            return (
              <label
                key={c}
                className={`oq-option${selected ? ' oq-option--selected' : ''}`}
              >
                <input
                  ref={i === 0 ? firstChoice : undefined}
                  type="radio"
                  name={choiceName}
                  value={c}
                  checked={selected}
                  onChange={() => {
                    setChoice(c);
                    setError(false);
                  }}
                />
                <span className="oq-option__text">{c}</span>
                {selected && (
                  <span className="oq-option__check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>

        {error && (
          <p id={`${uid}-error`} role="alert" className="open-question__error">
            <span aria-hidden="true">! </span>Pick one idea to continue.
          </p>
        )}

        {evidenceOptions.length > 0 && (
          <fieldset className="open-question__group">
            <legend className="open-question__legend">
              What evidence or instrument would help you test your idea? (optional)
            </legend>
            {evidenceOptions.map((o) => {
              const selected = evidence === o;
              return (
                <label
                  key={o}
                  className={`oq-option${selected ? ' oq-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={evidenceName}
                    value={o}
                    checked={selected}
                    onChange={() => setEvidence(o)}
                  />
                  <span className="oq-option__text">{o}</span>
                  {selected && (
                    <span className="oq-option__check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </label>
              );
            })}
          </fieldset>
        )}

        <button type="submit" className="open-question__button">
          Send your question into the future
        </button>
      </form>
    </section>
  );
}
