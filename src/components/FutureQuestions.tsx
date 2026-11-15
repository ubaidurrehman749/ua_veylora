import { useId, useMemo } from 'react';
import type { Mission } from '../types/mission';
import { THEME_TEXT } from '../data/display';
import { useReveal } from '../hooks/useReveal';
import type { OpenQuestionAnswer } from './OpenQuestion';
import './FutureQuestions.css';
import { useSplitReveal } from '../hooks/useSplitReveal';

export interface FutureQuestionsProps {
  answers: OpenQuestionAnswer[];
  /** Mission order decides the list order. */
  missions: Pick<Mission, 'id' | 'name' | 'openQuestion'>[];
  /** Lets the learner jump back to an object to change their answer. */
  onRevisit?: (missionId: string) => void;
}

export function FutureQuestions({ answers, missions, onRevisit }: FutureQuestionsProps) {
  const headingId = `${useId()}-heading`;
  const titleRef = useSplitReveal<HTMLSpanElement>();

  const items = useMemo(
    () =>
      missions.flatMap((m) => {
        const answer = answers.find((a) => a.missionId === m.id);
        return answer ? [{ mission: m, answer }] : [];
      }),
    [answers, missions],
  );

  return (
    <section className="future" aria-labelledby={headingId}>
      <h2 id={headingId} className="future__title">
        <span className="future__eyebrow">The questions didn't end</span>
        <span className="future__sr-only">: </span>
        <span ref={titleRef} className="future__name">Your questions for the future</span>
      </h2>

      {items.length === 0 ? (
        <p className="future__empty">
          You haven't sent a question yet. Go back to any object and answer its Open Question.
        </p>
      ) : (
        <ol className="future__list">
          {items.map(({ mission, answer }, i) => (
            <FutureItem
              key={mission.id}
              index={i + 1}
              mission={mission}
              answer={answer}
              onRevisit={onRevisit}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function FutureItem({
  index,
  mission,
  answer,
  onRevisit,
}: {
  index: number;
  mission: FutureQuestionsProps['missions'][number];
  answer: OpenQuestionAnswer;
  onRevisit?: (missionId: string) => void;
}) {
  const ref = useReveal<HTMLLIElement>();
  return (
    <li ref={ref} className="future__item">
      <span className="future__number" aria-hidden="true">
        {index}
      </span>
      <div className="future__body">
        <div className="future__meta">
          <span className="future__object">{mission.name}</span>
          <span className="future__theme">{THEME_TEXT[answer.theme]}</span>
        </div>
        <p className="future__prompt">{mission.openQuestion.prompt}</p>
        <p className="future__idea">
          <span className="future__label">Your idea</span>
          {answer.choice}
        </p>
        {answer.evidence && (
          <p className="future__evidence">
            <span className="future__label">You would test it with</span>
            {answer.evidence}
          </p>
        )}
        {onRevisit && (
          <button
            type="button"
            className="future__revisit"
            onClick={() => onRevisit(mission.id)}
          >
            Change this question
            <span className="future__sr-only"> about {mission.name}</span>
          </button>
        )}
      </div>
    </li>
  );
}
