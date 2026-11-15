import { useMemo, useState } from 'react';

import missionsData from '../data/missions.json';
import type { Mission } from '../types/mission';
import { collectSourcesAndCredits } from '../data/collectCredits';
import { useReducedMotion } from '../hooks/useReducedMotion';

import { Navbar } from '../components/Navbar';
import { Landing } from '../components/Landing';
import { Destination } from '../components/Destination';
import { Timeline } from '../components/Timeline';
import { FutureQuestions } from '../components/FutureQuestions';
import { QuestionEcho } from '../components/QuestionEcho';
import { SourceCredits } from '../components/SourceCredits';
import { Starfield } from '../components/Starfield';
import { MagneticLink, Marquee, Preloader, Stat, goToAnchor } from '../components/fx';
import type { OpenQuestionAnswer } from '../components/OpenQuestion';

const missions = missionsData as Mission[];

// Every line here comes from the mission stories in missions.json.
const TICKER = [
  'Planned for 90 days, worked for 15 years',
  '72 flights in the thin air of Mars',
  'Three rovers still parked on the Moon',
  '45 km driven across Mars',
  'First powered flight on another world',
  '90.4 km driven on the Moon',
];

export default function HomePage() {
  const [selectedId, setSelectedId] = useState(missions[0].id);
  const [answers, setAnswers] = useState<OpenQuestionAnswer[]>([]);
  const reduced = useReducedMotion();

  const selectedMission = missions.find((m) => m.id === selectedId) ?? missions[0];
  const savedAnswer = answers.find((a) => a.missionId === selectedMission.id) ?? null;

  const sourceData = useMemo(() => collectSourcesAndCredits(missions), []);

  function saveAnswer(answer: OpenQuestionAnswer) {
    setAnswers((previous) => [
      ...previous.filter((item) => item.missionId !== answer.missionId),
      answer,
    ]);
  }

  function openMission(id: string) {
    setSelectedId(id);
    goToAnchor('#missions');
  }

  return (
    <>
      <Starfield still={reduced} />
      <div className="grain" aria-hidden="true" />
      <Preloader />

      <Navbar answered={answers.length} />

      <main>
        <Landing missions={missions} onPick={openMission} />

        <Marquee items={TICKER} />

        <div className="app">
          <section className="stats" aria-label="By the numbers">
            <Stat value={15} label="years Opportunity kept working" />
            <Stat value={72} label="flights Ingenuity made on Mars" />
            <Stat value={90.4} decimals={1} suffix=" km" label="driven by three rovers on the Moon" />
            <Stat value={45} suffix=" km" label="driven by Opportunity on Mars" />
          </section>

          <Destination
            missions={missions}
            selected={selectedMission}
            onSelect={setSelectedId}
            savedAnswer={savedAnswer}
            onAnswer={saveAnswer}
          />

          <div id="timeline" className="anchor">
            <Timeline missions={missions} onSelect={openMission} />
          </div>

          <div id="questions" className="anchor">
            <FutureQuestions answers={answers} missions={missions} onRevisit={openMission} />

            <QuestionEcho
              answers={answers}
              missions={missions.map(({ id, name }) => ({ id, name }))}
            />
          </div>

          <div id="sources" className="anchor">
            <SourceCredits sources={sourceData.sources} credits={sourceData.credits} />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-cta">
          <p className="eyebrow">Keep exploring</p>
          <p className="footer-big">
            Every machine left a question.
            <br />
            <span className="accent">Which one is yours?</span>
          </p>
          <div className="footer-btns">
            <MagneticLink href="#missions" className="btn" cursor="Go">
              Meet the machines
            </MagneticLink>
            <MagneticLink href="#top" className="btn ghost" cursor="Top">
              Back to the start
            </MagneticLink>
          </div>
        </div>
        <div className="footer-meta">
          <p>
            Made by Team UA VEYLORA for the NASA Space Apps Challenge 2026. Models and mission facts
            from NASA; this site is not endorsed by NASA.
          </p>
          <p>ABANDONED BUT NOT FORGOTTEN</p>
        </div>
      </footer>
    </>
  );
}
