import type { Mission } from '../types/mission';

import { StorySection } from './StorySection';
import { ModelViewer } from './ModelViewer';
import { EquipmentCard } from './EquipmentCard';
import { EvidenceDesk } from './EvidenceDesk';
import { OpenQuestion } from './OpenQuestion';
import type { OpenQuestionAnswer } from './OpenQuestion';

export interface DestinationProps {
  missions: Mission[];
  selected: Mission;
  onSelect: (id: string) => void;
  savedAnswer: OpenQuestionAnswer | null;
  onAnswer: (answer: OpenQuestionAnswer) => void;
}

// One stop per machine: pick a mission, read its story, explore the 3D model,
// check the equipment and evidence, then answer its open question.
export function Destination({
  missions,
  selected,
  onSelect,
  savedAnswer,
  onAnswer,
}: DestinationProps) {
  return (
    <section id="missions" className="mission-section">
      <div className="section-heading">
        <p className="eyebrow">THE MISSIONS</p>
        <h2>Meet the machines</h2>
      </div>

      <div className="mission-tabs" role="group" aria-label="Choose a mission">
        {missions.map((mission) => (
          <button
            key={mission.id}
            type="button"
            className={selected.id === mission.id ? 'mission-tab active' : 'mission-tab'}
            aria-pressed={selected.id === mission.id}
            onClick={() => onSelect(mission.id)}
          >
            {mission.name}
          </button>
        ))}
      </div>

      <StorySection mission={selected} />

      {/* key: a fresh viewer for each machine, so one model never lingers behind the next */}
      <ModelViewer
        key={selected.id}
        modelPath={selected.modelPath}
        fallbackSrc={selected.fallbackSrc ?? `/images/${selected.id}.svg`}
        alt={selected.alt ?? `Interactive 3D model of ${selected.name}`}
        title={selected.name}
        place={selected.location}
        status={selected.status.value}
        hook={selected.goal}
        hotspots={selected.hotspots}
        setting={selected.setting ?? (selected.id === 'lrv' ? 'moon' : 'mars')}
        layout="split"
      />

      <EquipmentCard mission={selected} />

      <EvidenceDesk mission={selected} />

      <OpenQuestion
        key={`question-${selected.id}`}
        mission={selected}
        initialAnswer={savedAnswer}
        onSubmit={onAnswer}
      />
    </section>
  );
}
