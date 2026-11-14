import { useMemo, useState } from 'react';
import missionsData from '@src/data/missions.json';
import type { Mission } from '@src/types/mission';
import { collectSourcesAndCredits } from '@src/data/collectCredits';
import { Timeline } from '@src/components/Timeline';
import { FactPanel } from '@src/components/FactPanel';
import { EvidenceDesk } from '@src/components/EvidenceDesk';
import { OpenQuestion, type OpenQuestionAnswer } from '@src/components/OpenQuestion';
import { QuestionEcho } from '@src/components/QuestionEcho';
import { FutureQuestions } from '@src/components/FutureQuestions';
import { SourceCredits } from '@src/components/SourceCredits';

const missions = missionsData as unknown as Mission[];

// Dev-only page that stacks every component so they can be viewed together.
export default function App() {
  const [selectedId, setSelectedId] = useState(missions[0]?.id);
  const [answers, setAnswers] = useState<OpenQuestionAnswer[]>([]);
  const selected = missions.find((m) => m.id === selectedId) ?? missions[0];
  const { sources, credits } = useMemo(() => collectSourcesAndCredits(missions), []);

  const select = (id: string) => {
    setSelectedId(id);
    document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <h1>Abandoned but not forgotten</h1>
      <Timeline missions={missions} onSelect={select} />

      {selected && (
        <section id="mission" key={selected.id}>
          <FactPanel mission={selected} />
          <EvidenceDesk mission={selected} />
          <OpenQuestion
            mission={selected}
            initialAnswer={answers.find((a) => a.missionId === selected.id) ?? null}
            onSubmit={(a) =>
              setAnswers((prev) => [...prev.filter((p) => p.missionId !== a.missionId), a])
            }
          />
        </section>
      )}

      <QuestionEcho answers={answers} missions={missions} />
      <FutureQuestions answers={answers} missions={missions} onRevisit={select} />
      <SourceCredits sources={sources} credits={credits} />
    </main>
  );
}
